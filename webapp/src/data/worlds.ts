import { tidyDeep } from '../lib/format';
import type { Region, World } from './types';

export const WORLDS: World[] = tidyDeep([
  {
    id: 'azeite',
    nome: 'O Olival',
    commodity: 'Azeite',
    tagline: 'Azeite virgem extra de origem identificada, comprado ao lagar, embalado num co-packer e vendido a HoReCa e distribuidores.',
    description:
      'A campanha começa em outubro, quando a azeitona chega ao lagar, e a extração corre até janeiro. A Sprout compra ao lagar ao índice de origem com um prémio, guarda o lote em IBC de 1 000 kg selados, sob azoto e ao abrigo da luz, e embala-o por tranches em garrafões de 5 L. Vende-o entre fevereiro e setembro a HoReCa e lojas gourmet, 10 % abaixo de uma referência embalada, e a distribuidores e exportadores ao preço de saída do embalador, com venda contratada antes da compra.',
    unit: 'kg',
    priceUnit: 'kg',
    gauge: 'ibc',
    map: 'pt',
    fase: 1,
    investable: true,
    model: 'principal',
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
      { termo: 'IBC', definicao: 'Contentor de 1 000 kg numa grade metálica sobre palete. É a unidade de armazenagem do lote; a venda faz-se embalada.' },
      { termo: 'Índice de origem', definicao: 'Preço do virgem extra a granel na origem (média de 2 semanas SIMA Alentejo e Poolred). Base do preço de compra e dos gatilhos.' },
      { termo: 'Co-packer', definicao: 'Embalador contratado à tarefa: enche os garrafões de 5 L do lote sem comprar o azeite.' },
      { termo: 'Campanha', definicao: 'Ano agrícola do azeite: colheita de outubro a janeiro, vendas até setembro.' },
      { termo: 'Acidez', definicao: 'Ácidos gordos livres, em % de ácido oleico. Virgem extra: até 0,8 %.' },
      { termo: 'Frutado', definicao: 'Conjunto de aromas da azeitona sã, verde ou madura, avaliado pelo painel de prova.' },
    ],
    journeyLabels: { colhido: 'Colhido', analisado: 'Analisado', 'em-deposito': 'Selado em IBC', 'em-venda': 'Em venda', expedido: 'Expedido', liquidado: 'Liquidado' },
    hedge: {
      instrument: 'forward',
      label: 'Venda contratada e venda a prazo',
      description:
        'Não há um mercado de futuros para azeite: o de Jaén (MFAO) fechou em 2017. A cobertura faz-se vendendo antes de comprar: contratos com distribuidores e exportadores sobre pelo menos 85 % do lote, e vendas a prazo com preço fixado na HoReCa. O resto fica exposto ao índice de origem.',
    },
    physical: { container: 'IBC de 1 000 kg', containerCapacity: '1 000 kg ≈ 1 092 L ≈ 218 garrafões de 5 L', storage: 'IBC selados sob azoto; embalamento por tranches' },
  },
  {
    id: 'agua',
    nome: 'A Nascente',
    commodity: 'Água',
    tagline: 'Água mineral natural e de nascente, engarrafada na origem e vendida no cesto dos clientes HoReCa. Sem financiamento.',
    description:
      'A água é captada num aquífero protegido e engarrafada na origem, como exige a lei. Entra no piloto como produto de cesto para os clientes HoReCa que já compram azeite: o engarrafador vende, fatura e entrega, e a Sprout recebe 2 % de comissão. Não há stock da Sprout nem dinheiro de cofinanciadores; o mundo serve para conhecer as origens e acompanhar as paletes.',
    unit: 'palete',
    priceUnit: 'L',
    gauge: 'pallet',
    map: 'pt',
    fase: 1,
    investable: false,
    model: 'agente',
    faseLabel: 'Cesto · sem financiamento',
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
      label: 'Sem cobertura: modelo de agente',
      description: 'A Sprout não compra a água, por isso não tem preço nem stock em risco. Como principal teria de adiantar o depósito SDR (0,10 € por garrafa) e o transporte numa margem de cêntimos por litro.',
    },
    physical: { container: 'Palete de 504 garrafas', containerCapacity: '504 × 1,5 L = 756 L', storage: 'Armazém coberto, à sombra' },
  },
  {
    id: 'cafe',
    nome: 'A Plantação',
    commodity: 'Café',
    tagline: 'Café verde de origem, em sacas de 60 kg. Fase 2: só exploração e diligência.',
    description:
      'O café chega como grão verde em sacas de 60 kg, depois da colheita e do processamento da cereja. O preço forma-se no contrato de futuros Arabica (ICE KC), mas abaixo de 50–100 t por ano não compensa usá-lo: o plano é comprar o verde em EUR, a preço fixo, a um importador da UE que cumpra o regulamento da desflorestação (EUDR), e vendê-lo a microtorrefações. O mundo já se explora e joga na Academia; o financiamento só abre com um go/no-go próprio, e o business plan recomendado não o prevê antes de 2030.',
    unit: 'saca',
    priceUnit: 'kg',
    gauge: 'sacks',
    map: 'cafe',
    fase: 2,
    investable: false,
    model: 'principal',
    faseLabel: 'Fase 2 · não investível',
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
    journeyLabels: { colhido: 'Colhido', analisado: 'Classificado', 'em-deposito': 'No armazém (UE)', 'em-venda': 'Em venda', expedido: 'Entregue', liquidado: 'Liquidado' },
    hedge: {
      instrument: 'forward',
      label: 'Compra em EUR a preço fixo',
      description: 'O arábica tem futuros líquidos (ICE KC, em cêntimos de dólar por libra), mas cada contrato são ≈ 17 t e só compensam acima de 50–100 t por ano. Abaixo disso, compra-se em EUR a preço fixo a um importador, contrata-se parte da venda às torrefações e cobre-se o câmbio com um forward EUR/USD.',
    },
    physical: { container: 'Saca de juta de 60 kg', containerCapacity: '60 kg de café verde', storage: 'Armazém seco, humidade do grão 8–12,5 % (norma ICO)' },
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
