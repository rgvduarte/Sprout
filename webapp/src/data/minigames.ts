import { tidyDeep } from '../lib/format';
import type {
  CoffeeDefect,
  CoffeeProcess,
  CoffeeSample,
  CoffeeStep,
  MiniGameMeta,
  OliveCategory,
  OliveSample,
  SensoryAttribute,
  WaterClass,
  WaterLabel,
} from './types';

/* =====================================================================
   Conteúdo real dos mini-jogos da Academia (amostras fictícias,
   limites e definições reais).
   ===================================================================== */

export const MINI_GAMES: MiniGameMeta[] = [
  { id: 'painel-prova', world: 'azeite', title: 'Painel de prova', summary: 'Associa descrições a atributos e defeitos e classifica amostras com os limites da UE.', maxScore: 6, maxPoints: 30 },
  { id: 'le-o-rotulo', world: 'agua', title: 'Lê o rótulo', summary: 'Lê a composição de cinco águas e escolhe a classificação certa.', maxScore: 5, maxPoints: 30 },
  { id: 'cereja-chavena', world: 'cafe', title: 'Da cereja à chávena', summary: 'Ordena as etapas, reconhece processos e classifica amostras pela escala SCA.', maxScore: 6, maxPoints: 30 },
];

/* ------------------------------------------------------------ Painel de prova */

/** Atributos e defeitos do método do COI (Reg. Delegado (UE) 2022/2104, anexo III). */
export const OLIVE_ATTRIBUTES: SensoryAttribute[] = tidyDeep([
  { id: 'frutado-verde', nome: 'Frutado verde', tipo: 'positivo', descricao: 'Aromas de azeitona sã colhida antes de madura: erva cortada, folha de oliveira, tomateiro, amêndoa verde.' },
  { id: 'frutado-maduro', nome: 'Frutado maduro', tipo: 'positivo', descricao: 'Aromas de azeitona sã colhida madura: fruta doce, tomate maduro, frutos secos.' },
  { id: 'amargo', nome: 'Amargo', tipo: 'positivo', descricao: 'Sabor elementar sentido na parte de trás da língua, típico de azeitona verde ou em pintor.' },
  { id: 'picante', nome: 'Picante', tipo: 'positivo', descricao: 'Sensação de ardor na garganta, mais intensa em azeites de início de campanha.' },
  { id: 'tulha', nome: 'Tulha / borras', tipo: 'defeito', descricao: 'Cheiro de fermentação anaeróbia, abafado e húmido.', causa: 'Azeitona amontoada vários dias antes da moenda, ou azeite deixado sobre as borras.' },
  { id: 'mofo', nome: 'Mofo-humidade-terra', tipo: 'defeito', descricao: 'Cheiro a bolor e a terra molhada.', causa: 'Azeitona com fungos, apanhada do chão ou guardada húmida.' },
  { id: 'avinhado', nome: 'Avinhado-avinagrado', tipo: 'defeito', descricao: 'Lembra vinho ou vinagre, com nota ácida.', causa: 'Fermentação aeróbia da azeitona que gera ácido acético e acetato de etilo.' },
  { id: 'ranco', nome: 'Ranço', tipo: 'defeito', descricao: 'Cheiro a gordura velha, a frutos secos passados.', causa: 'Oxidação por exposição a oxigénio, luz ou calor durante a armazenagem.' },
  { id: 'metalico', nome: 'Metálico', tipo: 'defeito', descricao: 'Sabor a metal, a moeda.', causa: 'Contacto prolongado com superfícies metálicas durante a moenda ou a armazenagem.' },
]);

export const OLIVE_SAMPLES: OliveSample[] = [
  { id: 'A', label: 'Amostra A', origem: 'Trás-os-Montes, outubro', acidez: 0.19, peroxidos: 6.4, k232: 1.82, k268: 0.13, deltaK: 0.001, medianaDefeito: 0, medianaFrutado: 5.6, notas: 'Erva cortada, folha de oliveira, amargo e picante intensos.', atributos: ['frutado-verde', 'amargo', 'picante'], defeitos: [] },
  { id: 'B', label: 'Amostra B', origem: 'Alentejo, dezembro', acidez: 0.42, peroxidos: 11.2, k232: 2.12, k268: 0.17, deltaK: 0.003, medianaDefeito: 0, medianaFrutado: 3.9, notas: 'Tomate maduro, frutos secos, amargo ligeiro.', atributos: ['frutado-maduro', 'amargo'], defeitos: [] },
  { id: 'C', label: 'Amostra C', origem: 'Ribatejo, janeiro', acidez: 0.65, peroxidos: 14.8, k232: 2.31, k268: 0.19, deltaK: 0.004, medianaDefeito: 1.8, medianaFrutado: 2.4, notas: 'Frutado maduro fraco, nota abafada no fim.', atributos: ['frutado-maduro'], defeitos: ['tulha'] },
  { id: 'D', label: 'Amostra D', origem: 'Beira Interior, novembro', acidez: 1.4, peroxidos: 16.5, k232: 2.48, k268: 0.21, deltaK: 0.005, medianaDefeito: 2.6, medianaFrutado: 1.9, notas: 'Lembra vinagre ao cheirar; frutado tímido.', atributos: ['frutado-maduro'], defeitos: ['avinhado'] },
  { id: 'E', label: 'Amostra E', origem: 'Alentejo, fevereiro', acidez: 2.9, peroxidos: 24.1, k232: 2.86, k268: 0.31, deltaK: 0.009, medianaDefeito: 4.8, medianaFrutado: 0, notas: 'Bolor e terra molhada; sem fruta.', atributos: [], defeitos: ['mofo'] },
  { id: 'F', label: 'Amostra F', origem: 'Douro, 14 meses de armazenagem', acidez: 0.52, peroxidos: 19.6, k232: 2.58, k268: 0.24, deltaK: 0.006, medianaDefeito: 1.1, medianaFrutado: 1.6, notas: 'Gordura velha no fim de boca.', atributos: ['frutado-maduro'], defeitos: ['ranco'] },
];

/** Classifica uma amostra pelos limites do Reg. Delegado (UE) 2022/2104. */
export function classifyOlive(s: OliveSample): OliveCategory {
  const extra = s.acidez <= 0.8 && s.peroxidos <= 20 && s.k232 <= 2.5 && s.k268 <= 0.22 && s.deltaK <= 0.01 && s.medianaDefeito === 0 && s.medianaFrutado > 0;
  if (extra) return 'virgem-extra';
  const virgem = s.acidez <= 2.0 && s.peroxidos <= 20 && s.k232 <= 2.6 && s.k268 <= 0.25 && s.deltaK <= 0.01 && s.medianaDefeito <= 3.5;
  return virgem ? 'virgem' : 'lampante';
}

export const OLIVE_CATEGORIES: { id: OliveCategory; label: string; rule: string }[] = [
  { id: 'virgem-extra', label: 'Virgem extra', rule: 'Acidez ≤ 0,8 %, peróxidos ≤ 20, K232 ≤ 2,50, K268 ≤ 0,22, defeito = 0, frutado > 0' },
  { id: 'virgem', label: 'Virgem', rule: 'Acidez ≤ 2,0 %, peróxidos ≤ 20, K232 ≤ 2,60, K268 ≤ 0,25, defeito ≤ 3,5' },
  { id: 'lampante', label: 'Lampante', rule: 'Acidez > 2,0 % ou defeito > 3,5: não pode ser vendido ao consumidor sem refinação' },
];

/* ------------------------------------------------------------ Lê o rótulo */

export const WATER_LABELS: WaterLabel[] = [
  { id: 'w1', marca: 'Águas da Fonte Fria', tipo: 'mineral natural', origem: 'Serra da Estrela, 1 050 m', residuoSeco: 29, ph: 5.8, sodio: 3.1, bicarbonato: 6.8, calcio: 1.2, magnesio: 0.4, silica: 9.6, fluoreto: 0.1, potassio: 0.6, cloreto: 5.3, sulfato: 1.6, nitrato: 2.1 },
  { id: 'w2', marca: 'Nascente da Serra Verde', tipo: 'de nascente', origem: 'Gerês, granito', residuoSeco: 22, ph: 6.1, sodio: 2.8, bicarbonato: 5.2, calcio: 0.9, magnesio: 0.3, silica: 8.1, fluoreto: 0.05, potassio: 0.4, cloreto: 4.1, sulfato: 0.8, nitrato: 1.5 },
  { id: 'w3', marca: 'Fonte da Lameira Alta', tipo: 'mineral natural', origem: 'Beira Litoral, calcário', residuoSeco: 312, ph: 7.6, sodio: 12.4, bicarbonato: 228, calcio: 68, magnesio: 9.8, silica: 14.2, fluoreto: 0.2, potassio: 1.9, cloreto: 21.4, sulfato: 26.8, nitrato: 4.6 },
  { id: 'w4', marca: 'Nascente do Vale Fundo', tipo: 'mineral natural', origem: 'Trás-os-Montes, falha granítica', residuoSeco: 2380, ph: 6.4, sodio: 612, bicarbonato: 1985, calcio: 92, magnesio: 31, silica: 58, fluoreto: 1.6, co2Livre: 2100, potassio: 41, cloreto: 88, sulfato: 14, nitrato: 0.5 },
  { id: 'w5', marca: 'Fonte da Pedra Alta', tipo: 'mineral natural', origem: 'origem fictícia, rocha alcalina (sienito)', residuoSeco: 268, ph: 9.4, sodio: 46, bicarbonato: 98, calcio: 1.6, magnesio: 0.2, silica: 31, fluoreto: 1.2, potassio: 1.4, cloreto: 42, sulfato: 30, nitrato: 0.6, carbonato: 21 },
];

/** Menções de rotulagem (Diretiva 2009/54/CE, anexo III; DL 156/98). */
export const WATER_CLASSES: WaterClass[] = [
  { id: 'muito-pouco', label: 'Muito pouco mineralizada', rule: 'Resíduo seco ≤ 50 mg/L', test: (w) => w.residuoSeco <= 50 },
  { id: 'pouco', label: 'Pouco mineralizada', rule: 'Resíduo seco ≤ 500 mg/L', test: (w) => w.residuoSeco > 50 && w.residuoSeco <= 500 },
  { id: 'rica', label: 'Rica em sais minerais', rule: 'Resíduo seco > 1 500 mg/L', test: (w) => w.residuoSeco > 1500 },
  { id: 'bicarbonatada', label: 'Bicarbonatada', rule: 'Bicarbonato > 600 mg/L', test: (w) => w.bicarbonato > 600 },
  { id: 'sodica', label: 'Sódica', rule: 'Sódio > 200 mg/L', test: (w) => w.sodio > 200 },
  { id: 'calcica', label: 'Cálcica', rule: 'Cálcio > 150 mg/L', test: (w) => w.calcio > 150 },
  { id: 'magnesiana', label: 'Magnesiana', rule: 'Magnésio > 50 mg/L', test: (w) => w.magnesio > 50 },
  { id: 'fluoretada', label: 'Contém fluoreto', rule: 'Fluoreto > 1 mg/L', test: (w) => w.fluoreto > 1 },
  { id: 'pobre-sodio', label: 'Adequada para dieta pobre em sódio', rule: 'Sódio ≤ 20 mg/L', test: (w) => w.sodio <= 20 },
  { id: 'gasocarbonica', label: 'Acídula (gasocarbónica)', rule: 'CO₂ livre de origem > 250 mg/L. «Naturalmente gaseificada» é outra menção: o teor de CO₂ depois de engarrafar igual ao da nascente.', test: (w) => (w.co2Livre ?? 0) > 250 },
];

/** Mineralização total = soma dos iões dissolvidos + sílica (mg/L). */
export function mineralizacaoTotal(w: WaterLabel): number {
  return Math.round(w.bicarbonato + w.sodio + w.calcio + w.magnesio + w.silica + w.fluoreto + w.potassio + w.cloreto + w.sulfato + w.nitrato + (w.carbonato ?? 0));
}

/** Menção de mineralização da UE, pelo resíduo seco (Diretiva 2009/54/CE). */
export function mineralizationClass(w: WaterLabel): string {
  if (w.residuoSeco <= 50) return 'muito-pouco';
  if (w.residuoSeco <= 500) return 'pouco';
  if (w.residuoSeco > 1500) return 'rica';
  return 'media';
}

/* ------------------------------------------------------------ Da cereja à chávena */

export const COFFEE_STEPS: CoffeeStep[] = tidyDeep([
  { id: 'colheita', order: 1, nome: 'Colheita da cereja', descricao: 'À mão, cereja a cereja, ou por derriça e máquina, quando a maioria está madura.' },
  { id: 'processo', order: 2, nome: 'Processamento', descricao: 'Natural, honey ou lavado: decide quanta polpa fica em contacto com o grão durante a secagem.' },
  { id: 'secagem', order: 3, nome: 'Secagem no terreiro', descricao: 'Ao sol, revolvida várias vezes ao dia, até ficar entre 10 e 12 % de humidade, dentro do intervalo de 8–12,5 % da norma ICO.' },
  { id: 'descasque', order: 4, nome: 'Descasque e classificação', descricao: 'Retira-se o pergaminho; o grão verde é separado por peneira, densidade e cor.' },
  { id: 'ensaque', order: 5, nome: 'Ensaque e embarque', descricao: 'Sacas de juta de 60 kg em contentor, com ou sem saco hermético.' },
  { id: 'torra', order: 6, nome: 'Torra e prova', descricao: 'A torrefação transforma o grão verde; a prova SCA pontua o resultado de 0 a 100.' },
]);

export const COFFEE_PROCESSES: CoffeeProcess[] = tidyDeep([
  { id: 'lavado', nome: 'Lavado', descricao: 'A polpa é retirada, o grão fermenta em tanque para soltar a mucilagem e é lavado antes de secar.', perfil: 'Limpo, acidez viva, corpo leve a médio.', passos: ['Despolpa', 'Fermentação em tanque 12–36 h', 'Lavagem', 'Secagem do pergaminho'] },
  { id: 'natural', nome: 'Natural', descricao: 'A cereja seca inteira, com a polpa, durante 2 a 4 semanas.', perfil: 'Fruta madura, doçura, corpo encorpado; mais risco de defeitos.', passos: ['Seleção da cereja', 'Secagem inteira no terreiro', 'Descasque da cereja seca'] },
  { id: 'honey', nome: 'Honey (próximo do cereja descascado brasileiro)', descricao: 'Retira-se a pele e parte da polpa; a mucilagem seca agarrada ao grão.', perfil: 'Doçura de mel, acidez média, entre o lavado e o natural.', passos: ['Despolpa', 'Secagem com mucilagem', 'Descasque'] },
]);

export const COFFEE_DEFECTS: CoffeeDefect[] = tidyDeep([
  { id: 'preto', nome: 'Grão preto', categoria: 1, equivalencia: 1, descricao: 'Grão totalmente preto, de cereja sobremadura ou fermentada.' },
  { id: 'azedo', nome: 'Grão ardido (azedo)', categoria: 1, equivalencia: 1, descricao: 'Grão castanho-avermelhado de fermentação excessiva.' },
  { id: 'cereja-seca', nome: 'Cereja seca', categoria: 1, equivalencia: 1, descricao: 'Cereja que não foi descascada.' },
  { id: 'fungos', nome: 'Ataque de fungos', categoria: 1, equivalencia: 1, descricao: 'Manchas amarelas ou castanhas de bolor.' },
  { id: 'materia', nome: 'Matéria estranha', categoria: 1, equivalencia: 1, descricao: 'Pedras, paus ou outros objetos.' },
  { id: 'broca', nome: 'Broca', categoria: 2, equivalencia: 10, descricao: 'Grão perfurado pela broca do café.' },
  { id: 'quebrado', nome: 'Partido ou cortado', categoria: 2, equivalencia: 5, descricao: 'Grão danificado no descasque.' },
  { id: 'imaturo', nome: 'Verde (imaturo)', categoria: 2, equivalencia: 5, descricao: 'Grão de cereja verde, pálido e enrugado.' },
  { id: 'concha', nome: 'Concha', categoria: 2, equivalencia: 5, descricao: 'Grão malformado em forma de concha.' },
  { id: 'pergaminho', nome: 'Pergaminho', categoria: 2, equivalencia: 5, descricao: 'Grão que ainda tem a película de pergaminho.' },
]);

/** Escala SCA (Specialty Coffee Association). */
export const SCA_SCALE = [
  { min: 90, max: 100, label: 'Excecional' },
  { min: 85, max: 89.99, label: 'Excelente' },
  { min: 80, max: 84.99, label: 'Muito bom' },
  { min: 0, max: 79.99, label: 'Abaixo de especialidade' },
] as const;

export function scaLabel(score: number): string {
  return SCA_SCALE.find((s) => score >= s.min && score <= s.max)?.label ?? 'Abaixo de especialidade';
}

/** Especialidade: 0 defeitos de categoria 1, até 5 defeitos completos em 350 g, pontuação ≥ 80. */
export function isSpecialty(s: CoffeeSample): boolean {
  return s.defeitosCat1 === 0 && s.defeitosCompletosCat2 <= 5 && s.pontuacao >= 80;
}

export const COFFEE_SAMPLES: CoffeeSample[] = [
  { id: 'c1', label: 'Amostra 1', origem: 'Huila, Colômbia', processo: 'lavado', humidade: 10.9, defeitosCat1: 0, defeitosCompletosCat2: 2, pontuacao: 85.5, notas: 'Laranja, panela, acidez brilhante.' },
  { id: 'c2', label: 'Amostra 2', origem: 'Alta Mogiana, Brasil', processo: 'natural', humidade: 11.4, defeitosCat1: 0, defeitosCompletosCat2: 4, pontuacao: 82.25, notas: 'Chocolate, frutos secos, corpo médio.' },
  { id: 'c3', label: 'Amostra 3', origem: 'Sidama, Etiópia', processo: 'natural', humidade: 10.2, defeitosCat1: 0, defeitosCompletosCat2: 3, pontuacao: 88, notas: 'Mirtilo, jasmim, doçura alta.' },
  { id: 'c4', label: 'Amostra 4', origem: 'Sul de Minas, Brasil', processo: 'honey', humidade: 12.9, defeitosCat1: 2, defeitosCompletosCat2: 9, pontuacao: 78.5, notas: 'Madeira, fermentado; humidade de 12,9 %, acima do máximo de 12,5 % da norma ICO para armazenar e transportar.' },
  { id: 'c5', label: 'Amostra 5', origem: 'Planalto Central, Vietname', processo: 'natural', humidade: 11.8, defeitosCat1: 1, defeitosCompletosCat2: 12, pontuacao: 74, notas: 'Robusta comercial: terroso, amargo, corpo pesado.' },
];
