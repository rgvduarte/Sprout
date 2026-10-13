import { tidyDeep } from '../../lib/format';
import type { CoffeeProcess, LearningFocus, MiniGameId, OliveSample, WaterLabel } from '../../data/types';

/* =====================================================================
   Conteúdo próprio da Academia: regalias por nível, objetivos de
   aprendizagem, catálogo de recompensas e o texto dos mini-jogos.
   Nada aqui tem valor monetário: as recompensas são conhecimento,
   acesso e produto em espécie.
   ===================================================================== */

/* ------------------------------------------------------------ níveis */

/* As regalias por nível vivem em src/data/game.ts (LEVEL_PERKS), partilhadas com Início e Caderno. */
export { LEVEL_PERKS, REWARDS } from '../../data/game';
export type { RewardDef, RewardId } from '../../data/types';

/* ------------------------------------------------------------ objetivos */

/** Objetivo de aprendizagem: o foco partilhado com o registo (LearningFocus). */
export type GoalId = LearningFocus;

export type GoalItem = { kind: 'module'; id: string } | { kind: 'quest'; id: string };

export interface LearningGoal {
  id: GoalId;
  title: string;
  why: string;
  items: GoalItem[];
}

export const GOALS: LearningGoal[] = tidyDeep([
  {
    id: 'risco',
    title: 'Perceber o risco antes do primeiro compromisso',
    why: 'O que se compra, quando se espera receber e como se pode perder.',
    items: [
      { kind: 'module', id: 'm-lote' },
      { kind: 'module', id: 'm-ciclo-18m' },
      { kind: 'module', id: 'm-simulacao-perdas' },
      { kind: 'quest', id: 'q-simulador' },
    ],
  },
  {
    id: 'azeite',
    title: 'Ler um lote de azeite como um provador',
    why: 'Categorias, boletins e coberturas: o que separa um virgem extra de um problema em depósito.',
    items: [
      { kind: 'module', id: 'm-olival-deposito' },
      { kind: 'module', id: 'm-categorias-azeite' },
      { kind: 'module', id: 'm-cobertura-azeite' },
      { kind: 'quest', id: 'q-painel-3' },
      { kind: 'quest', id: 'q-analise-az021' },
    ],
  },
  {
    id: 'agua',
    title: 'Conhecer a água engarrafada',
    why: 'Tipos legais, rótulos e a logística que decide a margem de uma palete.',
    items: [
      { kind: 'module', id: 'm-agua-tipos' },
      { kind: 'module', id: 'm-agua-logistica' },
      { kind: 'quest', id: 'q-rotulo-3' },
      { kind: 'quest', id: 'q-analise-ag007' },
    ],
  },
  {
    id: 'cafe',
    title: 'Preparar a Fase 2: café verde',
    why: 'O café abre em 2027. Origens, processos e o contrato KC antes de haver lotes.',
    items: [
      { kind: 'module', id: 'm-cafe-verde' },
      { kind: 'quest', id: 'q-cereja' },
      { kind: 'quest', id: 'q-origens-cafe' },
    ],
  },
]);

/* ------------------------------------------------------------ recompensas */


/* ------------------------------------------------------------ Painel de prova */

/** Explicação de cada amostra (a categoria certa vem de classifyOlive). */
export const OLIVE_EXPLAIN: Record<OliveSample['id'], string> = tidyDeep({
  A: 'Todos os parâmetros dentro dos limites de virgem extra, mediana do defeito 0 e frutado intenso (5,6). Azeite de início de campanha: verde, amargo e picante.',
  B: 'Química folgada e painel sem defeitos. O frutado maduro, mais doce, também é virgem extra: o que conta é não haver defeito e haver fruta.',
  C: 'A química passava em virgem extra, mas o painel encontrou tulha com mediana 1,8. Qualquer defeito com mediana acima de 0 tira a categoria de virgem extra. É o defeito da azeitona amontoada antes da moenda.',
  D: 'Acidez de 1,4 % já não cabe nos 0,8 % do virgem extra e o painel encontrou avinhado (2,6). Fica abaixo de 2,0 % de acidez e de 3,5 de defeito: virgem.',
  E: 'Acidez de 2,9 %, acima do limite de 2,0 %, e mofo-humidade com mediana 4,8, acima de 3,5. Não pode ser vendido ao consumidor sem refinação.',
  F: 'A acidez é baixa (0,52 %), mas K232 de 2,58 e K268 de 0,24 passam os limites de virgem extra: oxidação depois de 14 meses de armazenagem. O painel confirma ranço (1,1). É por isto que cada lote repete a análise a cada 4 meses.',
});

/** Linhas do boletim: limite de virgem extra e de virgem (Reg. Delegado (UE) 2022/2104). */
export const OLIVE_PARAMS: {
  id: 'acidez' | 'peroxidos' | 'k232' | 'k268' | 'deltaK' | 'medianaDefeito' | 'medianaFrutado';
  label: string;
  unit?: string;
  decimals: number;
  ve: { text: string; ok: (v: number) => boolean };
  v: { text: string; ok: (v: number) => boolean };
}[] = [
  { id: 'acidez', label: 'Acidez', unit: '% ác. oleico', decimals: 2, ve: { text: '≤ 0,80', ok: (v) => v <= 0.8 }, v: { text: '≤ 2,0', ok: (v) => v <= 2 } },
  { id: 'peroxidos', label: 'Peróxidos', unit: 'meq O₂/kg', decimals: 1, ve: { text: '≤ 20', ok: (v) => v <= 20 }, v: { text: '≤ 20', ok: (v) => v <= 20 } },
  { id: 'k232', label: 'K232', decimals: 2, ve: { text: '≤ 2,50', ok: (v) => v <= 2.5 }, v: { text: '≤ 2,60', ok: (v) => v <= 2.6 } },
  { id: 'k268', label: 'K268', decimals: 2, ve: { text: '≤ 0,22', ok: (v) => v <= 0.22 }, v: { text: '≤ 0,25', ok: (v) => v <= 0.25 } },
  { id: 'deltaK', label: 'ΔK', decimals: 3, ve: { text: '≤ 0,01', ok: (v) => v <= 0.01 }, v: { text: '≤ 0,01', ok: (v) => v <= 0.01 } },
  { id: 'medianaDefeito', label: 'Mediana do defeito', decimals: 1, ve: { text: '= 0', ok: (v) => v === 0 }, v: { text: '≤ 3,5', ok: (v) => v <= 3.5 } },
  { id: 'medianaFrutado', label: 'Mediana do frutado', decimals: 1, ve: { text: '> 0', ok: (v) => v > 0 }, v: { text: 'sem limite', ok: () => true } },
];

/* ------------------------------------------------------------ Lê o rótulo */

/** Iões que completam o rótulo (somados dão a mineralização total). */
export const WATER_EXTRA: Record<WaterLabel['id'], { potassio: number; cloreto: number; sulfato: number; nitrato: number; carbonato?: number }> = {
  w1: { potassio: 0.6, cloreto: 5.3, sulfato: 1.6, nitrato: 2.1 },
  w2: { potassio: 0.4, cloreto: 4.1, sulfato: 0.8, nitrato: 1.5 },
  w3: { potassio: 1.9, cloreto: 21.4, sulfato: 26.8, nitrato: 4.6 },
  w4: { potassio: 41, cloreto: 88, sulfato: 14, nitrato: 0.5 },
  w5: { potassio: 1.4, cloreto: 42, sulfato: 30, nitrato: 0.6, carbonato: 21 },
};

/** Mineralização total = soma dos iões dissolvidos + sílica (mg/L). */
export function mineralizacaoTotal(w: WaterLabel): number {
  const x = WATER_EXTRA[w.id];
  const sum = w.bicarbonato + w.sodio + w.calcio + w.magnesio + w.silica + w.fluoreto + x.potassio + x.cloreto + x.sulfato + x.nitrato + (x.carbonato ?? 0);
  return Math.round(sum);
}

export type SalinityClass = 'hipossalina' | 'fracamente' | 'mesossalina' | 'hipersalina';

/** Classificação portuguesa pela mineralização total. */
export const SALINITY: { id: SalinityClass; label: string; range: string; from: number; to: number }[] = [
  { id: 'hipossalina', label: 'Hipossalina', range: '< 200 mg/L', from: 0, to: 200 },
  { id: 'fracamente', label: 'Fracamente mineralizada', range: '200–1 000 mg/L', from: 200, to: 1000 },
  { id: 'mesossalina', label: 'Mesossalina', range: '1 000–2 000 mg/L', from: 1000, to: 2000 },
  { id: 'hipersalina', label: 'Hipersalina', range: '> 2 000 mg/L', from: 2000, to: 4000 },
];

export function salinityOf(mt: number): SalinityClass {
  if (mt < 200) return 'hipossalina';
  if (mt <= 1000) return 'fracamente';
  if (mt <= 2000) return 'mesossalina';
  return 'hipersalina';
}

/** Campos do rótulo que a pergunta faz olhar (para os destacar na revelação). */
export type WaterField = 'mt' | 'residuo' | 'ph' | 'sodio' | 'bicarbonato' | 'fluoreto' | 'co2' | 'tipo';

export interface WaterQuestion {
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
  fields: WaterField[];
}

/** Segunda pergunta de cada rótulo: o que mais interessa ler nesta água. */
export const WATER_QUESTION: Record<WaterLabel['id'], WaterQuestion> = tidyDeep({
  w1: {
    prompt: 'O pH é 5,8. O que diz isto sobre a água?',
    options: ['É ácida, típica de aquíferos de granito pobres em sais', 'É alcalina e rica em bicarbonato', 'Não pode ser vendida: o pH tem de estar entre 6,5 e 9,5', 'É naturalmente gaseificada'],
    correct: 0,
    explanation: 'Abaixo de 7 é ácida. É comum nas águas de granito e de altitude, muito pouco mineralizadas. O intervalo 6,5–9,5 é da água da torneira; a lei da água mineral natural não fixa um pH mínimo.',
    fields: ['ph', 'mt'],
  },
  w2: {
    prompt: 'O rótulo diz «água de nascente». O que a distingue de uma água mineral natural?',
    options: [
      'É água da rede pública tratada',
      'Pode ser transportada em camião-cisterna e engarrafada noutra fábrica',
      'Não precisa de composição estável nem do reconhecimento oficial como mineral natural',
      'Tem sempre menos sódio do que uma mineral natural',
    ],
    correct: 2,
    explanation: 'Também é subterrânea, própria para consumo na origem e engarrafada na origem. Não tem de provar uma composição estável nem de ser reconhecida pela DGEG como água mineral natural.',
    fields: ['tipo'],
  },
  w3: {
    prompt: 'Sódio de 12,4 mg/L. Que menção pode ir no rótulo?',
    options: ['Sódica', 'Adequada para dieta pobre em sódio', 'Bicarbonatada', 'Rica em sais minerais'],
    correct: 1,
    explanation: 'Até 20 mg/L de sódio, o rótulo pode dizer «adequada para dieta pobre em sódio». «Sódica» exige mais de 200 mg/L e «bicarbonatada» mais de 600 mg/L de bicarbonato.',
    fields: ['sodio'],
  },
  w4: {
    prompt: 'CO₂ livre de 2 100 mg/L vindo da origem e bicarbonato de 1 985 mg/L. Como se descreve esta água?',
    options: ['Gaseificada com gás industrial e hipossalina', 'Naturalmente gaseificada, bicarbonatada e sódica', 'Água de nascente com gás adicionado', 'Pouco mineralizada e pobre em sódio'],
    correct: 1,
    explanation: 'O gás vem do próprio aquífero (gasocarbónica), o bicarbonato passa os 600 mg/L e o sódio os 200 mg/L. Águas assim nascem em falhas graníticas de Trás-os-Montes.',
    fields: ['co2', 'bicarbonato', 'sodio'],
  },
  w5: {
    prompt: 'pH 9,4 e fluoreto de 1,2 mg/L. O que é obrigatório ou permitido no rótulo?',
    options: [
      'Tem de levar o aviso para lactentes e crianças com menos de 7 anos',
      'Não pode ser vendida: o pH passa de 9',
      'É naturalmente gaseificada',
      'Pode dizer «contém fluoreto»; o aviso para crianças só é obrigatório acima de 1,5 mg/L',
    ],
    correct: 3,
    explanation: 'Acima de 1 mg/L o rótulo pode dizer «contém fluoreto». Acima de 1,5 mg/L é obrigatório o aviso «não adequada para consumo regular por lactentes e crianças com menos de 7 anos». O pH alto vem do sienito, uma rocha alcalina.',
    fields: ['fluoreto', 'ph'],
  },
});

/* ------------------------------------------------------------ Da cereja à chávena */

/** Efeito de cada processo na chávena e no custo (sem nomear os passos). */
export const COFFEE_EFFECTS: { id: string; process: CoffeeProcess['id']; text: string }[] = tidyDeep([
  { id: 'e1', process: 'lavado', text: 'Chávena limpa, acidez viva, corpo leve. Gasta mais água e equipamento na beneficiação, mas o resultado é previsível de lote para lote.' },
  { id: 'e2', process: 'natural', text: 'Fruta madura, doçura alta, corpo encorpado. Quase não usa água nem máquinas, mas ocupa o terreiro durante semanas e arrisca fermentações e bolor.' },
  { id: 'e3', process: 'honey', text: 'Doçura de mel, acidez média. Usa pouca água, mas a secagem é pegajosa e o grão tem de ser revolvido muitas vezes por dia.' },
]);

/** Folha de prova SCA da Amostra 2 (Alta Mogiana, natural): soma 82,25. */
export const SCA_SHEET: { id: string; label: string; score: number; scale: string }[] = [
  { id: 'fragrancia', label: 'Fragrância e aroma', score: 7.75, scale: '6–10' },
  { id: 'sabor', label: 'Sabor', score: 7.5, scale: '6–10' },
  { id: 'final', label: 'Final (retrogosto)', score: 7.25, scale: '6–10' },
  { id: 'acidez', label: 'Acidez', score: 7.5, scale: '6–10' },
  { id: 'corpo', label: 'Corpo', score: 7.75, scale: '6–10' },
  { id: 'equilibrio', label: 'Equilíbrio', score: 7.5, scale: '6–10' },
  { id: 'uniformidade', label: 'Uniformidade (5 chávenas)', score: 10, scale: '0–10' },
  { id: 'limpa', label: 'Chávena limpa (5 chávenas)', score: 10, scale: '0–10' },
  { id: 'docura', label: 'Doçura (5 chávenas)', score: 10, scale: '0–10' },
  { id: 'global', label: 'Apreciação global', score: 7, scale: '6–10' },
];

export const SCA_SHEET_DEFECTS = 0;

export const SCA_QUESTION = {
  prompt: 'Soma a folha da Amostra 2. Qual é a pontuação final e o que significa?',
  options: ['72,25 · abaixo de especialidade', '82,25 · muito bom, café de especialidade', '82,25 · ainda não é especialidade: precisa de 85', '92,25 · excecional'],
  correct: 1,
  explanation: 'Dez atributos somam 82,25 e não há defeitos a descontar. A partir de 80 pontos, com o grão verde dentro das regras de defeitos, é café de especialidade; 80–84,99 é «muito bom».',
};

/** Ids de mini-jogo com âncora na página. */
export const GAME_IDS: MiniGameId[] = ['painel-prova', 'le-o-rotulo', 'cereja-chavena'];
