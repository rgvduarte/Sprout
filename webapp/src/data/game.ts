import { tidyDeep } from '../lib/format';
import type { KnowledgeLevel, KnowledgeModule, OriginSealDef, Quest } from './types';

/* =====================================================================
   Sistema de jogo. Os níveis sobem SÓ com conhecimento e diligência
   (módulos, missões, mini-jogos, simulador). Nunca com dinheiro.
   ===================================================================== */

export const LEVELS: KnowledgeLevel[] = [
  { id: 'aprendiz', nome: 'Aprendiz', minPoints: 0, description: 'Conhece o que é um lote e de onde vem a margem.' },
  { id: 'provador', nome: 'Provador', minPoints: 120, description: 'Lê uma análise, distingue categorias e percebe o ciclo de 18 meses.' },
  { id: 'lagareiro', nome: 'Lagareiro', minPoints: 300, description: 'Avalia riscos, coberturas e extensões lote a lote.' },
  { id: 'mestre', nome: 'Mestre de campanha', minPoints: 600, description: 'Conhece os três mundos e já jogou campanhas com perda e com ganho.' },
];

/** Pontos atribuídos por completar uma campanha no simulador (uma vez). */
export const SIM_COMPLETE_POINTS = 20;

/* ------------------------------------------------------------ selos */

export const SEALS: OriginSealDef[] = [
  { id: 'seal-gardunha-2526', producerId: 'lagar-serra-gardunha', regionId: 'beira-interior', world: 'azeite', campanha: '2025/26', initials: 'SG', earnable: 'compromisso', questIds: [] },
  { id: 'seal-fontefria-2526', producerId: 'aguas-fonte-fria', regionId: 'beira-interior', world: 'agua', campanha: '2025/26', initials: 'FF', earnable: 'compromisso', questIds: [] },
  { id: 'seal-monteclaro-2526', producerId: 'herdade-monte-claro', regionId: 'ribatejo', world: 'azeite', campanha: '2025/26', initials: 'MC', earnable: 'compromisso', questIds: [] },
  { id: 'seal-ribeira-2627', producerId: 'lagar-ribeira-alta', regionId: 'tras-os-montes', world: 'azeite', campanha: '2026/27', initials: 'RA', earnable: 'ambos', questIds: ['q-analise-az021', 'q-riscos-az021'] },
  { id: 'seal-guadiana-2627', producerId: 'olival-guadiana', regionId: 'alentejo', world: 'azeite', campanha: '2026/27', initials: 'OG', earnable: 'compromisso', questIds: [] },
  { id: 'seal-gardunha-2627', producerId: 'lagar-serra-gardunha', regionId: 'beira-interior', world: 'azeite', campanha: '2026/27', initials: 'SG', earnable: 'compromisso', questIds: [] },
  { id: 'seal-fontefria-2627', producerId: 'aguas-fonte-fria', regionId: 'beira-interior', world: 'agua', campanha: '2026/27', initials: 'FF', earnable: 'ambos', questIds: ['q-analise-ag007', 'q-riscos-ag007'] },
  { id: 'seal-serraverde-2627', producerId: 'nascente-serra-verde', regionId: 'minho', world: 'agua', campanha: '2026/27', initials: 'SV', earnable: 'diligencia', questIds: ['q-serra-verde', 'q-rotulo-3'] },
  { id: 'seal-altomogiana-2728', producerId: 'fazenda-alto-mogiana', regionId: 'alta-mogiana', world: 'cafe', campanha: '2027/28', initials: 'AM', earnable: 'diligencia', questIds: ['q-origens-cafe', 'q-cereja'] },
];

/* ------------------------------------------------------------ módulos */

export const MODULES: KnowledgeModule[] = tidyDeep([
  {
    id: 'm-lote',
    world: 'geral',
    title: 'Como funciona um lote',
    summary: 'O que se financia, de onde vem a margem e quem fica com ela.',
    minutes: 6,
    points: 40,
    sections: [
      {
        heading: 'Um lote é mercadoria identificada',
        body: [
          'Cada lote é uma quantidade concreta de produto, com origem, análise e local de armazenagem. Por exemplo: 24 000 kg de azeite virgem extra em 24 IBC selados no Lagar da Ribeira Alta.',
          'Os co-financiadores pagam a compra ao produtor e os custos até à venda. A Sprout vende o lote a compradores B2B e, quando o comprador paga, liquida o lote.',
        ],
      },
      {
        heading: 'De onde vem a margem',
        body: [
          'A Sprout compra diretamente ao produtor, sem embalador pelo meio, e vende ao comprador 10–15 % abaixo da referência de mercado. O comprador paga menos do que pagaria ao embalador; o produtor recebe mais cedo.',
          'A diferença entre o preço de venda e o custo total (aquisição, análises, armazenagem, seguro, logística e cobertura) é a margem bruta do lote. 65 % vai para os co-financiadores; o resto paga a operação e alimenta a reserva de primeira perda.',
        ],
      },
      {
        heading: 'O que pode correr mal',
        body: [
          'O preço pode cair, o azeite pode perder categoria, a venda pode atrasar e um comprador pode não pagar. O capital está em risco e não há garantia de resultado.',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'O que financia um co-financiador?', options: ['A compra de mercadoria física identificada e os custos até à venda', 'Ações da Sprout', 'Um fundo de índices de matérias-primas', 'Um depósito com taxa fixa'], correct: 0, explanation: 'O dinheiro paga a compra do lote ao produtor e os custos até à venda ao comprador B2B.' },
      { id: 'q2', prompt: 'A que preço vende a Sprout ao comprador B2B?', options: ['Ao preço de referência', '10–15 % abaixo da referência de mercado', '10–15 % acima da referência', 'Ao preço que o produtor definir'], correct: 1, explanation: 'O desconto ao comprador é possível porque não há embalador a reter margem.' },
    ],
  },
  {
    id: 'm-ciclo-18m',
    world: 'geral',
    title: 'O ciclo de 18 meses: liquidação, extensão e refunding',
    summary: 'Quando se espera receber, o que muda numa extensão e para que serve o refunding.',
    minutes: 7,
    points: 40,
    sections: [
      {
        heading: 'A janela de liquidação',
        body: [
          'A janela conta 18 meses a partir do fecho do financiamento. A liquidação prevista acontece quando o lote está vendido e os compradores pagaram, o que pode ser antes do mês 18.',
          '"Liquidação prevista" é uma estimativa. Não é um prazo garantido nem um valor garantido.',
        ],
      },
      {
        heading: 'Extensão condicionada',
        body: [
          'Se no mês 18 o preço de referência estiver 15 % ou mais abaixo do preço de entrada, ou se mais de 30 % do stock estiver por vender, a Tesouraria pode propor uma extensão de até 6 meses.',
          'A extensão é justificada por escrito, comunicada 30 dias antes do fim da janela e só acontece uma vez por lote. Durante a extensão, a armazenagem continua a custar dinheiro.',
        ],
      },
      {
        heading: 'Refunding',
        body: [
          'Cada lote tem um playbook de refunding escrito antes de abrir: gatilhos, prazos e responsáveis. Num choque de preços, uma nova ronda pode refinanciar o lote para pagar custos de armazenagem enquanto o stock espera melhor preço.',
          'O refunding não elimina a perda. Adia-a, com custo, à espera de que o mercado recupere, o que pode não acontecer.',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'Quantas vezes pode um lote ser estendido?', options: ['Sem limite', 'Uma vez, até 6 meses', 'Duas vezes, até 12 meses', 'Nunca'], correct: 1, explanation: 'Uma única extensão de até 6 meses, com condições e aviso prévio.' },
      { id: 'q2', prompt: 'O que faz o refunding?', options: ['Garante o capital', 'Refinancia o lote para ganhar tempo, com custo', 'Devolve o dinheiro sem perdas', 'Vende a posição a outro investidor'], correct: 1, explanation: 'Dá tempo ao lote, com custo. Não é uma garantia.' },
    ],
  },
  {
    id: 'm-olival-deposito',
    world: 'azeite',
    title: 'Do olival ao depósito',
    summary: 'Colheita, moenda e armazenagem: o que protege a qualidade do azeite.',
    minutes: 6,
    points: 30,
    sections: [
      {
        heading: 'Moer depressa',
        body: [
          'A azeitona começa a fermentar assim que é apanhada. Os bons lagares moem no próprio dia; azeitona amontoada vários dias dá o defeito tulha.',
          'A extração moderna é em contínuo: lavagem, moenda, batedura a menos de 27 °C e separação em decanter.',
        ],
      },
      {
        heading: 'Guardar sem luz nem ar',
        body: [
          'O azeite novo repousa em depósitos de inox, sob azoto, a 15–18 °C. Oxigénio, luz e calor fazem subir os peróxidos e o K232, e podem tirar ao azeite a categoria de virgem extra.',
          'Num lote Sprout, o azeite passa para IBC de 1 000 kg selados com o número do lote, o que permite contá-lo e fotografá-lo em cada inventário.',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'Que defeito resulta de azeitona amontoada antes da moenda?', options: ['Ranço', 'Tulha', 'Metálico', 'Avinhado'], correct: 1, explanation: 'Tulha: fermentação anaeróbia da azeitona amontoada.' },
      { id: 'q2', prompt: 'Quanto azeite leva um IBC?', options: ['100 kg', '500 kg', '1 000 kg', '25 000 kg'], correct: 2, explanation: 'Um IBC leva 1 000 kg, cerca de 1 092 litros de azeite.' },
    ],
  },
  {
    id: 'm-categorias-azeite',
    world: 'azeite',
    title: 'Categorias e análises do azeite',
    summary: 'Virgem extra, virgem e lampante: os limites legais e como ler um boletim.',
    minutes: 8,
    points: 40,
    sections: [
      {
        heading: 'Os limites da lei',
        body: [
          'O Regulamento Delegado (UE) 2022/2104 fixa as categorias. Virgem extra: acidez até 0,8 %, peróxidos até 20 meq O₂/kg, K232 até 2,50, K268 até 0,22, mediana do defeito igual a 0 e mediana do frutado acima de 0.',
          'Virgem: acidez até 2,0 % e mediana do defeito até 3,5. Acima de 2,0 % de acidez, ou com defeito acima de 3,5, o azeite é lampante e não pode ser vendido ao consumidor sem refinação.',
        ],
      },
      {
        heading: 'Química e painel',
        body: [
          'A química mede o estado do azeite; o painel de prova, com 8 a 12 provadores treinados, mede aromas e defeitos. Um azeite pode passar na química e falhar no painel.',
          'Cada lote Sprout publica o boletim completo antes de abrir o financiamento e repete a análise a cada 4 meses de armazenagem.',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'Um azeite com acidez 0,6 % e mediana do defeito 1,2 é…', options: ['Virgem extra', 'Virgem', 'Lampante', 'Refinado'], correct: 1, explanation: 'Passa na acidez de virgem extra, mas qualquer defeito acima de 0 tira-lhe essa categoria.' },
      { id: 'q2', prompt: 'Qual é o limite de acidez do azeite virgem?', options: ['0,8 %', '1,0 %', '2,0 %', '3,3 %'], correct: 2, explanation: 'Virgem: acidez ≤ 2,0 %. Acima disso é lampante.' },
    ],
  },
  {
    id: 'm-cobertura-azeite',
    world: 'azeite',
    title: 'Cobertura de preço no azeite',
    summary: 'Sem futuros líquidos, a cobertura faz-se com vendas a prazo e indexação.',
    minutes: 6,
    points: 40,
    sections: [
      {
        heading: 'Vender antes de vender',
        body: [
          'Não há um mercado de futuros líquido para azeite. A forma mais direta de fixar preço é vender a prazo: um comprador compromete-se hoje a comprar uma parte do lote, a um preço fixo, com entregas futuras.',
          'O resto do lote fica indexado a uma referência pública de preços na origem: se o mercado cair, o preço de venda acompanha, e a margem encolhe.',
        ],
      },
      {
        heading: 'Gatilhos',
        body: [
          'Cada lote tem gatilhos escritos: por exemplo, se a referência descer abaixo de 4,10 €/kg, a cobertura sobe de 50 % para 70 %. Cobrir mais custa margem e reduz o ganho se o preço subir.',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'Como se cobre o preço de um lote de azeite?', options: ['Futuros de azeite em bolsa', 'Venda a prazo a compradores e indexação', 'Seguro de colheita', 'Não se cobre'], correct: 1, explanation: 'Vendas a prazo com preço fixado e cláusulas de indexação.' },
      { id: 'q2', prompt: 'O que acontece à cobertura se o preço subir muito?', options: ['Aumenta o ganho', 'Limita o ganho na parte coberta', 'Desaparece', 'Passa a garantir o capital'], correct: 1, explanation: 'A parte vendida a prazo fica ao preço fixado: protege na descida, limita na subida.' },
    ],
  },
  {
    id: 'm-agua-tipos',
    world: 'agua',
    title: 'Água mineral natural e água de nascente',
    summary: 'O que distingue as duas e o que diz o rótulo.',
    minutes: 5,
    points: 30,
    sections: [
      {
        heading: 'Duas categorias legais',
        body: [
          'A água mineral natural vem de um aquífero protegido, tem composição estável e é reconhecida oficialmente (em Portugal, pela DGEG). A água de nascente também é subterrânea e própria para consumo na origem, sem a exigência de estabilidade mineral.',
          'Ambas têm de ser engarrafadas na origem. Não se transportam a granel para engarrafar noutro sítio.',
        ],
      },
      {
        heading: 'Ler a mineralização',
        body: [
          'O resíduo seco a 180 °C mede os sais dissolvidos. Até 50 mg/L é muito pouco mineralizada; até 500 mg/L, pouco mineralizada; acima de 1 500 mg/L, rica em sais minerais.',
          'Sódio até 20 mg/L permite a menção "adequada para dieta pobre em sódio". Bicarbonato acima de 600 mg/L dá "bicarbonatada".',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'Uma água com resíduo seco de 32 mg/L é…', options: ['Rica em sais minerais', 'Pouco mineralizada', 'Muito pouco mineralizada', 'Bicarbonatada'], correct: 2, explanation: 'Até 50 mg/L: muito pouco mineralizada.' },
      { id: 'q2', prompt: 'Onde tem de ser engarrafada a água mineral natural?', options: ['Em qualquer fábrica licenciada', 'Na origem', 'No país de venda', 'Pelo comprador'], correct: 1, explanation: 'A lei obriga a engarrafar na origem.' },
    ],
  },
  {
    id: 'm-agua-logistica',
    world: 'agua',
    title: 'Logística da água: paletes, prazos e custos',
    summary: 'Porque é que a margem da água se joga no camião e no armazém.',
    minutes: 5,
    points: 30,
    sections: [
      {
        heading: 'A palete',
        body: [
          'Uma palete de 1,5 L leva 84 packs de 6 garrafas: 504 garrafas, 756 litros. Um lote de 320 paletes são 241 920 litros.',
          'Com uma margem de 2–3 cêntimos por litro, o transporte e o armazém pesam muito. Por isso o preço do frete fica fixado no contrato com o comprador.',
        ],
      },
      {
        heading: 'Sazonalidade e depósito',
        body: [
          'A procura concentra-se entre maio e setembro. As linhas enchem stock no inverno, e é esse stock que se financia.',
          'Desde 10/04/2026 cada embalagem paga um depósito de 0,10 € no sistema de depósito e reembolso (SDR). Não é margem: passa pelo preço e volta ao consumidor que devolve a garrafa.',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'Quantas garrafas de 1,5 L leva uma palete?', options: ['84', '252', '504', '756'], correct: 2, explanation: '6 garrafas × 84 packs = 504 garrafas.' },
      { id: 'q2', prompt: 'Quando é a época alta de vendas de água?', options: ['Outubro a janeiro', 'Maio a setembro', 'Todo o ano igual', 'Só em agosto'], correct: 1, explanation: 'HoReCa e distribuição escoam sobretudo entre maio e setembro.' },
    ],
  },
  {
    id: 'm-cafe-verde',
    world: 'cafe',
    title: 'Café verde: origens, processos e o contrato KC',
    summary: 'Da cereja à saca de 60 kg e ao preço formado em Nova Iorque.',
    minutes: 8,
    points: 40,
    sections: [
      {
        heading: 'Da cereja ao grão verde',
        body: [
          'A cereja é colhida, seca ou despolpada e lavada, e descascada até ficar o grão verde. Lavado, natural e honey são os três processos principais; cada um muda o perfil na chávena.',
          'O café verde viaja em sacas de juta de 60 kg, com humidade entre 10 e 12 %.',
        ],
      },
      {
        heading: 'Preço e cobertura',
        body: [
          'O arábica forma preço no contrato de futuros ICE KC, em cêntimos de dólar por libra; cada contrato são 37 500 libras, cerca de 17 toneladas. O café físico negoceia-se com um diferencial sobre o KC.',
          'Como há futuros líquidos, um lote de café pode cobrir 80 % do preço com venda de futuros enquanto o físico não é vendido. Falta cobrir o câmbio: o café paga-se em dólares.',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'Quanto pesa uma saca de café verde?', options: ['30 kg', '46 kg', '60 kg', '69 kg'], correct: 2, explanation: 'A saca de comércio da origem tem 60 kg.' },
      { id: 'q2', prompt: 'Em que unidade cota o ICE KC?', options: ['€/kg', 'Cêntimos de dólar por libra', 'Dólares por tonelada', 'Reais por saca'], correct: 1, explanation: 'O KC cota em cêntimos de dólar por libra-peso.' },
    ],
  },
  {
    id: 'm-rails',
    world: 'geral',
    title: 'Para onde vai o dinheiro: PSP, contas segregadas e reconciliação',
    summary: 'Porque é que o dinheiro nunca passa pelas contas da Sprout.',
    minutes: 5,
    points: 30,
    sections: [
      {
        heading: 'Um prestador licenciado na UE',
        body: [
          'As transferências vão para uma conta segregada num prestador de serviços de pagamento ou instituição de moeda eletrónica licenciado na UE. O dinheiro dos clientes fica separado do dinheiro da Sprout.',
          'Não há numerário em lado nenhum do circuito: só transferências SEPA identificadas.',
        ],
      },
      {
        heading: 'Reconciliação diária',
        body: [
          'Todos os dias, o saldo da conta segregada é comparado com o registo interno de cada lote. Qualquer diferença é explicada e fechada antes do dia seguinte.',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'Onde fica o dinheiro de um co-financiador?', options: ['Na conta corrente da Sprout', 'Numa conta segregada num PSP licenciado na UE', 'Em numerário no produtor', 'Numa carteira de criptoativos'], correct: 1, explanation: 'Conta segregada num prestador licenciado na UE.' },
      { id: 'q2', prompt: 'Com que frequência se reconciliam as contas?', options: ['Mensalmente', 'Trimestralmente', 'Diariamente', 'No fim do lote'], correct: 2, explanation: 'A reconciliação é diária.' },
    ],
  },
  {
    id: 'm-simulacao-perdas',
    world: 'geral',
    title: 'Simular perdas antes de investir',
    summary: 'O que o Regulamento europeu do crowdfunding pede e porque usamos a mesma lógica.',
    minutes: 5,
    points: 30,
    sections: [
      {
        heading: 'O que diz o Regulamento (UE) 2020/1503',
        body: [
          'As plataformas europeias de crowdfunding têm de fazer, a investidores não sofisticados, um teste de conhecimentos de entrada e de lhes pedir uma simulação da capacidade de suportar perdas, calculada como 10 % do património líquido.',
          'O regulamento prevê ainda um período de reflexão pré-contratual de 4 dias e um aviso quando o investimento passa de 1 000 € ou de 5 % do património líquido.',
        ],
      },
      {
        heading: 'Como aplicamos isto no piloto',
        body: [
          'O piloto está fechado a investidores qualificados, a quem estas regras não se aplicam da mesma forma. Mesmo assim, o Simulador de campanha mostra, com dinheiro fictício, campanhas que acabam em perda, e faz parte do percurso antes do primeiro compromisso.',
        ],
      },
    ],
    quiz: [
      { id: 'q1', prompt: 'Como se calcula a capacidade de suportar perdas no ECSP?', options: ['5 % do rendimento anual', '10 % do património líquido', '20 % das poupanças', 'Não se calcula'], correct: 1, explanation: '10 % do património líquido, segundo o Regulamento (UE) 2020/1503.' },
      { id: 'q2', prompt: 'Quanto dura o período de reflexão pré-contratual?', options: ['24 horas', '4 dias', '14 dias', '30 dias'], correct: 1, explanation: '4 dias, durante os quais o investidor pode desistir sem custos.' },
    ],
  },
]);

/* ------------------------------------------------------------ missões */

export const QUESTS: Quest[] = tidyDeep([
  { id: 'q-painel-3', title: 'Identifica 3 atributos no painel de prova', description: 'Associa três descrições sensoriais ao atributo certo no mini-jogo Painel de prova.', world: 'azeite', points: 20, criteria: { type: 'minigame', gameId: 'painel-prova', minScore: 3 }, href: '/academia#painel-prova' },
  { id: 'q-extensao', title: 'Percebe o que acontece numa extensão', description: 'Completa o módulo sobre o ciclo de 18 meses.', world: 'geral', points: 15, criteria: { type: 'module', moduleId: 'm-ciclo-18m' }, href: '/academia#m-ciclo-18m' },
  { id: 'q-comparar-preco', title: 'Compara o preço de entrada com a referência', description: 'No mundo do azeite, vê quanto abaixo da referência é vendido um lote aberto.', world: 'azeite', points: 10, criteria: { type: 'manual' }, href: '/mercados/azeite' },
  { id: 'q-cobertura', title: 'Encontra a cobertura de preço de um lote de azeite', description: 'Abre um lote de azeite e lê a secção de cobertura.', world: 'azeite', points: 10, criteria: { type: 'manual' }, href: '/lote/AZ-2026-021#cobertura' },
  { id: 'q-analise-az021', title: 'Lê o boletim de análises do AZ-2026-021', description: 'Abre o boletim do lote e confirma em que categoria o azeite está.', world: 'azeite', points: 15, lotId: 'AZ-2026-021', sealId: 'seal-ribeira-2627', criteria: { type: 'analysis-read', lotId: 'AZ-2026-021' }, href: '/lote/AZ-2026-021#analises' },
  { id: 'q-riscos-az021', title: 'Lê os 6 fatores de risco do AZ-2026-021', description: 'Abre cada fator de risco do lote antes de decidir.', world: 'azeite', points: 15, lotId: 'AZ-2026-021', sealId: 'seal-ribeira-2627', criteria: { type: 'risk-read', lotId: 'AZ-2026-021' }, href: '/lote/AZ-2026-021#riscos' },
  { id: 'q-analise-ag007', title: 'Lê o boletim de análises do AG-2026-007', description: 'Confirma a mineralização e a conformidade microbiológica do lote.', world: 'agua', points: 15, lotId: 'AG-2026-007', sealId: 'seal-fontefria-2627', criteria: { type: 'analysis-read', lotId: 'AG-2026-007' }, href: '/lote/AG-2026-007#analises' },
  { id: 'q-riscos-ag007', title: 'Lê os 5 fatores de risco do AG-2026-007', description: 'Abre cada fator de risco do lote de água.', world: 'agua', points: 15, lotId: 'AG-2026-007', sealId: 'seal-fontefria-2627', criteria: { type: 'risk-read', lotId: 'AG-2026-007' }, href: '/lote/AG-2026-007#riscos' },
  { id: 'q-rotulo-3', title: 'Classifica 3 águas no Lê o rótulo', description: 'Acerta a classificação de três rótulos de água.', world: 'agua', points: 20, sealId: 'seal-serraverde-2627', criteria: { type: 'minigame', gameId: 'le-o-rotulo', minScore: 3 }, href: '/academia#le-o-rotulo' },
  { id: 'q-serra-verde', title: 'Visita a Nascente da Serra Verde no mapa', description: 'No mundo da água, abre a região do Minho e a ficha do produtor.', world: 'agua', points: 10, sealId: 'seal-serraverde-2627', criteria: { type: 'region-visit', regionId: 'minho' }, href: '/mercados/agua' },
  { id: 'q-simulador', title: 'Joga uma campanha completa no simulador', description: 'Distribui o orçamento fictício, joga os 18 meses e lê o balanço final.', world: 'geral', points: 25, criteria: { type: 'sim-complete' }, href: '/academia/simulador' },
  { id: 'q-origens-cafe', title: 'Explora as origens de café', description: 'Entra no mundo do café e percorre o mapa das origens.', world: 'cafe', points: 10, sealId: 'seal-altomogiana-2728', criteria: { type: 'world-visit', worldId: 'cafe' }, href: '/mercados/cafe' },
  { id: 'q-cereja', title: 'Ordena as etapas da cereja à chávena', description: 'No mini-jogo Da cereja à chávena, acerta pelo menos 4 respostas.', world: 'cafe', points: 20, sealId: 'seal-altomogiana-2728', criteria: { type: 'minigame', gameId: 'cereja-chavena', minScore: 4 }, href: '/academia#cereja-chavena' },
  { id: 'q-contas', title: 'Percebe para onde vai o dinheiro', description: 'Completa o módulo sobre PSP, contas segregadas e reconciliação.', world: 'geral', points: 10, criteria: { type: 'module', moduleId: 'm-rails' }, href: '/academia#m-rails' },
]);

/* ------------------------------------------------------------ progresso inicial */

/** Progresso de conhecimento da investidora de demonstração: 190 pontos, nível Provador. */
export const DEMO_PROGRESS = {
  modulesCompleted: [
    { id: 'm-lote', at: '2025-11-20' },
    { id: 'm-ciclo-18m', at: '2025-11-22' },
    { id: 'm-olival-deposito', at: '2026-01-10' },
  ],
  questsCompleted: [
    { id: 'q-painel-3', at: '2026-01-12' },
    { id: 'q-extensao', at: '2025-11-22' },
    { id: 'q-comparar-preco', at: '2025-11-30' },
    { id: 'q-cobertura', at: '2026-06-10' },
  ],
  miniGames: [{ id: 'painel-prova' as const, bestScore: 5, at: '2026-01-12' }],
  regionsVisited: ['alentejo'],
  worldsVisited: ['azeite', 'agua'] as const,
};
