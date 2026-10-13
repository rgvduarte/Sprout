import { useCallback, useSyncExternalStore } from 'react';
import type { InvestorClass } from '../../data/types';
import type { ProfileId } from '../../state';
import {
  onlyDigits,
  validateBirth,
  validateCertidao,
  validateEmail,
  validateIban,
  validateNif,
  validatePhone,
  validatePostal,
  validateRequired,
} from './validation';

/* =====================================================================
   Rascunho do registo, em memória (como o resto do jogo), por perfil.
   Sobrevive à mudança de ecrã; perde-se ao recarregar.
   ===================================================================== */

export type Tipo = 'pessoa-singular' | 'pessoa-coletiva';
export type DocSlot = 'id' | 'morada' | 'iban' | 'rep' | 'procuracao' | 'evidencia';
export type Rota = 'regulada' | 'grande' | 'pedido' | 'nenhuma';

export interface DocFile {
  name: string;
  size: number;
  kind: 'PDF' | 'JPEG' | 'PNG';
  addedAt: string;
  /** ficheiro fictício do exemplo (não existe no disco) */
  example?: boolean;
}

export interface UboRow {
  id: string;
  nome: string;
  nif: string;
  pct: string;
  tipo: 'direta' | 'indireta' | 'controlo';
}

export interface Draft {
  step: number;
  /** passo mais avançado já alcançado */
  reached: number;
  /** o exemplo pré-preenchido continua ativo */
  example: boolean;
  tipo: Tipo | '';
  pais: string;
  entidade: string;
  nome: string;
  nif: string;
  nascimento: string;
  nacionalidade: string;
  denominacao: string;
  nipc: string;
  repNome: string;
  repNif: string;
  repCargo: string;
  morada: string;
  codigoPostal: string;
  localidade: string;
  email: string;
  telefone: string;
  iban: string;
  certidao: string;
  /** última atualização do código da certidão (vista aprovada) */
  certidaoAtualizada?: string;
  docs: Partial<Record<DocSlot, DocFile>>;
  contaPropria: '' | 'sim' | 'nao';
  ubos: UboRow[];
  pep: '' | 'nao' | 'proprio' | 'familiar';
  pepDetalhe: string;
  origemFundos: string;
  sancoes: boolean;
  quiz: Partial<Record<QuizId, number>>;
  exp1: string;
  exp2: string;
  fin1: string;
  fin2: string;
  fin3: string;
  rota: Rota | '';
  criterios: string[];
  registoSupervisao: string;
  pedidoEscrito: boolean;
  consentTermos: boolean;
  consentRiscos: boolean;
  consentVeracidade: boolean;
  optDiario: boolean;
  optVisitas: boolean;
  assinatura: string;
  /** momento da submissão (ISO) */
  submittedAt?: string;
}

/* ------------------------------------------------------------ opções */

export const PAISES = [
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'Espanha' },
  { value: 'FR', label: 'França' },
  { value: 'DE', label: 'Alemanha' },
  { value: 'NL', label: 'Países Baixos' },
  { value: 'IT', label: 'Itália' },
  { value: 'BE', label: 'Bélgica' },
  { value: 'LU', label: 'Luxemburgo' },
  { value: 'IE', label: 'Irlanda' },
  { value: 'UE', label: 'Outro país da UE ou do EEE' },
  { value: 'FORA', label: 'Fora da UE e do EEE' },
] as const;

export const paisLabel = (v: string) => PAISES.find((p) => p.value === v)?.label ?? v;

export const NACIONALIDADES = ['Portuguesa', 'Espanhola', 'Francesa', 'Alemã', 'Neerlandesa', 'Italiana', 'Belga', 'Luxemburguesa', 'Irlandesa', 'Brasileira', 'Outra'];

export const ENTIDADES = [
  { value: 'sociedade', label: 'Sociedade comercial (Lda., SA)' },
  { value: 'holding', label: 'Holding ou family office' },
  { value: 'fundacao', label: 'Fundação ou associação' },
  { value: 'regulada', label: 'Entidade regulada (banco, seguradora, OIC, fundo de pensões)' },
];

export const CARGOS = [
  { value: 'gerente', label: 'Gerente' },
  { value: 'administrador', label: 'Administrador' },
  { value: 'procurador', label: 'Procurador (com procuração)' },
];

export const ORIGEM_FUNDOS = [
  'Rendimentos do trabalho',
  'Atividade empresarial ou lucros distribuídos',
  'Venda de empresa ou de participações',
  'Venda de imóveis',
  'Poupança acumulada',
  'Herança ou doação',
];

export type QuizId = 'q1' | 'q2' | 'q3';

export interface QuizQuestionDef {
  id: QuizId;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}

/** Perguntas de conhecimento do produto (não dão nota: confirmam que o produto é percebido). */
export const QUIZ: QuizQuestionDef[] = [
  {
    id: 'q1',
    prompt: 'Quando recebes o capital de um lote?',
    options: [
      'Quando quiser, com pré-aviso de 30 dias.',
      'Na liquidação, depois da venda do lote: dentro da janela de 18 meses, ou até 6 meses depois se houver extensão.',
      'Em prestações mensais, a partir do primeiro mês.',
    ],
    correct: 1,
    explanation:
      'O capital fica no lote até o comprador pagar. A janela é de 18 meses; se as vendas travarem, pode haver uma extensão (uma vez, até 6 meses) e, nos casos previstos, o playbook de refunding do lote.',
  },
  {
    id: 'q2',
    prompt: 'A referência do azeite cai 30 % a meio da janela. O que acontece ao lote?',
    options: [
      'Nada: o preço de venda ficou fixado no dia em que o lote abriu.',
      'A liquidação pode ficar abaixo do capital. A venda a prazo e a reserva de primeira perda atenuam a queda, mas não a eliminam.',
      'A Sprout devolve o capital por inteiro.',
    ],
    correct: 1,
    explanation:
      'Só a parte do volume vendida a prazo tem preço fixado. O resto vende-se ao preço da altura, 10–15 % abaixo da referência. A reserva de primeira perda absorve as primeiras perdas até ao seu limite; para lá disso, a perda é dos co-financiadores.',
  },
  {
    id: 'q3',
    prompt: 'Precisas do dinheiro antes da liquidação. Podes vender a tua parte?',
    options: [
      'Sim, a outro co-financiador, no mercado secundário da Sprout.',
      'Não. No piloto não há mercado secundário: o capital fica no lote até à liquidação.',
      'Sim, mas só nos lotes de água.',
    ],
    correct: 1,
    explanation: 'Investe só o que não vais precisar durante pelo menos 18 meses, ou 24 se houver extensão.',
  },
];

export const EXP1 = ['Nunca', 'Uma a três vezes', 'Mais de três vezes'];
export const EXP2 = ['Nenhuma', 'Indireta: fundos ou ETC de mercadorias', 'Direta: comércio físico, produção ou derivados'];
export const FIN1 = ['Até 100 000 €', 'De 100 000 € a 500 000 €', 'Mais de 500 000 €'];
export const FIN2 = ['Menos de 10 %', 'De 10 % a 25 %', 'Mais de 25 %'];
export const FIN3 = [
  { value: 'sim', label: 'Sim, consigo suportar essa perda' },
  { value: 'nao', label: 'Não, essa perda afetaria o meu dia a dia ou a atividade da empresa' },
];

export const CRITERIOS_GRANDE = [
  { value: 'balanco', label: 'Balanço total igual ou superior a 20 000 000 €' },
  { value: 'volume', label: 'Volume de negócios líquido igual ou superior a 40 000 000 €' },
  { value: 'fundos', label: 'Fundos próprios iguais ou superiores a 2 000 000 €' },
];

export const CRITERIOS_PEDIDO = [
  { value: 'operacoes', label: 'Operações de dimensão significativa, em média 10 por trimestre nos últimos 4 trimestres' },
  { value: 'carteira', label: 'Carteira de instrumentos financeiros, incluindo depósitos, acima de 500 000 €' },
  { value: 'experiencia', label: 'Pelo menos um ano de trabalho no setor financeiro, numa função que exige conhecer estas operações' },
];

export const STEPS = [
  { id: 'perfil', label: 'Perfil', title: 'Perfil de investidor' },
  { id: 'dados', label: 'Dados', title: 'Dados de identificação' },
  { id: 'documentos', label: 'Documentos', title: 'Documentos' },
  { id: 'beneficiario', label: 'Beneficiário e PEP', title: 'Beneficiário efetivo e declarações' },
  { id: 'adequacao', label: 'Adequação', title: 'Adequação e qualificação' },
  { id: 'assinatura', label: 'Revisão e assinatura', title: 'Revisão e assinatura' },
] as const;

/* ------------------------------------------------------------ exemplo */

/**
 * O exemplo preenche só dados factuais (identificação, morada, documentos,
 * beneficiários). Declarações (conta própria, PEP, sanções), adequação e
 * assinatura nunca vêm preenchidas: são da pessoa.
 */
const EXAMPLE_COMMON: Partial<Draft> = {
  pais: 'PT',
  morada: 'Rua do Almada, 214, 2.º',
  codigoPostal: '4050-032',
  localidade: 'Porto',
  origemFundos: 'Venda de empresa ou de participações',
};

export const EXAMPLE: Record<Tipo, Partial<Draft>> = {
  'pessoa-singular': {
    ...EXAMPLE_COMMON,
    tipo: 'pessoa-singular',
    nome: 'Rita Pacheco Lemos',
    nif: '238 471 055',
    nascimento: '17/04/1979',
    nacionalidade: 'Portuguesa',
    email: 'rita.lemos@example.com',
    telefone: '+351 913 408 271',
    iban: 'PT50 0099 0042 1023 4567 8029 0',
    docs: {
      id: { name: 'cartao-cidadao-rita-lemos.pdf', size: 412_000, kind: 'PDF', addedAt: '2026-10-13', example: true },
      morada: { name: 'fatura-agua-setembro-2026.pdf', size: 188_000, kind: 'PDF', addedAt: '2026-10-13', example: true },
      iban: { name: 'comprovativo-iban.pdf', size: 96_000, kind: 'PDF', addedAt: '2026-10-13', example: true },
      evidencia: { name: 'extrato-carteira-set-2026.pdf', size: 268_000, kind: 'PDF', addedAt: '2026-10-13', example: true },
    },
  },
  'pessoa-coletiva': {
    ...EXAMPLE_COMMON,
    tipo: 'pessoa-coletiva',
    entidade: 'holding',
    denominacao: 'Lemos Pacheco Participações, Lda.',
    nipc: '514 872 039',
    repNome: 'Rita Pacheco Lemos',
    repNif: '238 471 055',
    repCargo: 'gerente',
    morada: 'Avenida da Boavista, 1837, 6.º',
    codigoPostal: '4100-133',
    email: 'geral@example.com',
    telefone: '+351 226 091 340',
    iban: 'PT50 0099 0017 4098 1726 3053 0',
    certidao: '4821-0937-5516',
    ubos: [
      { id: 'u1', nome: 'Rita Pacheco Lemos', nif: '238 471 055', pct: '60', tipo: 'direta' },
      { id: 'u2', nome: 'Tomás Lemos Pacheco', nif: '210 938 471', pct: '40', tipo: 'direta' },
    ],
    origemFundos: 'Atividade empresarial ou lucros distribuídos',
    docs: {
      rep: { name: 'cc-representante-legal.pdf', size: 398_000, kind: 'PDF', addedAt: '2026-10-13', example: true },
      iban: { name: 'comprovativo-iban-empresa.pdf', size: 102_000, kind: 'PDF', addedAt: '2026-10-13', example: true },
      evidencia: { name: 'extrato-carteira-set-2026.pdf', size: 268_000, kind: 'PDF', addedAt: '2026-10-13', example: true },
    },
  },
};

export function emptyDraft(): Draft {
  return {
    step: 0,
    reached: 0,
    example: false,
    tipo: '',
    pais: '',
    entidade: '',
    nome: '',
    nif: '',
    nascimento: '',
    nacionalidade: '',
    denominacao: '',
    nipc: '',
    repNome: '',
    repNif: '',
    repCargo: '',
    morada: '',
    codigoPostal: '',
    localidade: '',
    email: '',
    telefone: '',
    iban: '',
    certidao: '',
    docs: {},
    contaPropria: '',
    ubos: [{ id: 'u1', nome: '', nif: '', pct: '', tipo: 'direta' }],
    pep: '',
    pepDetalhe: '',
    origemFundos: '',
    sancoes: false,
    quiz: {},
    exp1: '',
    exp2: '',
    fin1: '',
    fin2: '',
    fin3: '',
    rota: '',
    criterios: [],
    registoSupervisao: '',
    pedidoEscrito: false,
    consentTermos: false,
    consentRiscos: false,
    consentVeracidade: false,
    optDiario: false,
    optVisitas: false,
    assinatura: '',
  };
}

export function exampleDraft(tipo: Tipo = 'pessoa-singular'): Draft {
  return { ...emptyDraft(), ...EXAMPLE[tipo], example: true } as Draft;
}

/** O valor deste campo ainda é o do exemplo. */
export function isExampleValue(d: Draft, key: keyof Draft): boolean {
  if (!d.example || !d.tipo) return false;
  const ex = EXAMPLE[d.tipo][key];
  if (ex === undefined) return false;
  return JSON.stringify(ex) === JSON.stringify(d[key]);
}

/* ------------------------------------------------------------ loja */

const drafts: Partial<Record<ProfileId, Draft>> = {};
const listeners = new Set<() => void>();

function getDraft(profile: ProfileId): Draft {
  if (!drafts[profile]) drafts[profile] = profile === 'visitante' ? exampleDraft() : emptyDraft();
  return drafts[profile]!;
}

export function setDraft(profile: ProfileId, next: Draft | ((d: Draft) => Draft)) {
  const prev = getDraft(profile);
  drafts[profile] = typeof next === 'function' ? next(prev) : next;
  listeners.forEach((l) => l());
}

export function useDraft(profile: ProfileId): [Draft, (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void, (d: Draft) => void] {
  const draft = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getDraft(profile),
    () => getDraft(profile),
  );
  const update = useCallback(
    (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => setDraft(profile, (d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) })),
    [profile],
  );
  const replace = useCallback((d: Draft) => setDraft(profile, d), [profile]);
  return [draft, update, replace];
}

/* ------------------------------------------------------------ derivados */

export const isColetiva = (d: Draft) => d.tipo === 'pessoa-coletiva';
export const displayName = (d: Draft) => (isColetiva(d) ? d.denominacao : d.nome).trim();
export const signatoryName = (d: Draft) => (isColetiva(d) ? d.repNome : d.nome).trim();
const norm = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-PT');

export function classeFor(d: Draft): InvestorClass {
  if (d.rota === 'regulada' || d.rota === 'grande') return 'profissional';
  if (d.rota === 'pedido') return 'qualificado';
  return 'nao-qualificado';
}

export const ROTA_LABEL: Record<Rota, string> = {
  regulada: 'Entidade regulada ou institucional',
  grande: 'Grande empresa (2 de 3 critérios)',
  pedido: 'Tratamento como investidor profissional a pedido (2 de 3 critérios)',
  nenhuma: 'Nenhuma destas',
};

export function docSlotsFor(d: Draft): { slot: DocSlot; label: string; hint: string; required: boolean }[] {
  if (isColetiva(d))
    return [
      { slot: 'rep', label: 'Documento de identificação do representante legal', hint: 'Cartão de cidadão (frente e verso) ou passaporte válido.', required: true },
      { slot: 'iban', label: 'Comprovativo de IBAN em nome da entidade', hint: 'Declaração do banco ou extrato com o IBAN e o titular.', required: true },
      {
        slot: 'procuracao',
        label: 'Procuração',
        hint: 'Só se o representante não for gerente nem administrador.',
        required: d.repCargo === 'procurador',
      },
    ];
  return [
    { slot: 'id', label: 'Cartão de cidadão ou passaporte', hint: 'Frente e verso, dentro da validade.', required: true },
    { slot: 'morada', label: 'Comprovativo de morada', hint: 'Fatura de serviços ou declaração das Finanças com menos de 3 meses.', required: true },
    { slot: 'iban', label: 'Comprovativo de IBAN', hint: 'Declaração do banco ou extrato com o IBAN e o titular.', required: true },
  ];
}

export type BlockReason = 'retail' | 'perda';

export interface StepCheck {
  errors: Record<string, string>;
  done: number;
  total: number;
  block?: BlockReason;
}

/** Valida um passo. A mesma função alimenta a barra de missões e o botão Continuar. */
export function checkStep(i: number, d: Draft): StepCheck {
  const errors: Record<string, string> = {};
  let total = 0;
  const req = (key: string, error: string | null) => {
    total++;
    if (error) errors[key] = error;
  };
  const col = isColetiva(d);

  if (i === 0) {
    req('tipo', d.tipo ? null : 'Escolhe como vais investir.');
    req('pais', !d.pais ? 'Escolhe o país de residência fiscal.' : d.pais === 'FORA' ? 'No piloto só abrimos contas a residentes fiscais na UE ou no EEE: os pagamentos passam apenas por rails licenciados na UE.' : null);
    if (col) req('entidade', d.entidade ? null : 'Escolhe o tipo de entidade.');
  }

  if (i === 1) {
    if (col) {
      req('denominacao', validateRequired(d.denominacao, 'Indica a denominação, como na certidão permanente.'));
      req('nipc', validateNif(d.nipc, 'coletiva'));
    } else {
      req('nome', validateRequired(d.nome, 'Indica o nome completo, como no documento de identificação.'));
      req('nif', validateNif(d.nif, 'singular'));
      req('nascimento', validateBirth(d.nascimento));
      req('nacionalidade', validateRequired(d.nacionalidade, 'Escolhe a nacionalidade.'));
    }
    req('morada', validateRequired(d.morada, col ? 'Indica a morada da sede.' : 'Indica a morada de residência.'));
    req('codigoPostal', validatePostal(d.codigoPostal, d.pais));
    req('localidade', validateRequired(d.localidade, 'Indica a localidade.'));
    if (col) {
      req('repNome', validateRequired(d.repNome, 'Indica o nome do representante legal.'));
      req('repNif', validateNif(d.repNif, 'singular'));
      req('repCargo', validateRequired(d.repCargo, 'Escolhe o cargo do representante.'));
    }
    req('email', validateEmail(d.email));
    req('telefone', validatePhone(d.telefone));
    req('iban', validateIban(d.iban));
  }

  if (i === 2) {
    if (col) req('certidao', validateCertidao(d.certidao));
    for (const s of docSlotsFor(d)) if (s.required) req(`doc-${s.slot}`, d.docs[s.slot] ? null : `Junta: ${s.label.toLowerCase()}.`);
  }

  if (i === 3) {
    if (col) {
      total++;
      const rows = d.ubos;
      let rowsOk = rows.length > 0;
      let sum = 0;
      for (const r of rows) {
        if (!r.nome.trim()) {
          errors[`ubo-${r.id}-nome`] = 'Indica o nome.';
          rowsOk = false;
        }
        const nifErr = validateNif(r.nif, 'singular');
        if (nifErr && onlyDigits(r.nif).length !== 0) {
          errors[`ubo-${r.id}-nif`] = nifErr;
          rowsOk = false;
        } else if (!onlyDigits(r.nif)) {
          errors[`ubo-${r.id}-nif`] = 'Indica o NIF.';
          rowsOk = false;
        }
        const pct = Number(r.pct.replace(',', '.'));
        if (r.tipo !== 'controlo') {
          if (!r.pct.trim() || Number.isNaN(pct)) {
            errors[`ubo-${r.id}-pct`] = 'Indica a percentagem.';
            rowsOk = false;
          } else if (pct <= 25 || pct > 100) {
            errors[`ubo-${r.id}-pct`] = 'Beneficiário efetivo é quem detém mais de 25 %. Abaixo disso, só se controlar por outros meios.';
            rowsOk = false;
          } else sum += pct;
        }
      }
      if (sum > 100) {
        errors.ubos = `As participações somam ${String(sum).replace('.', ',')} %; não podem passar de 100 %.`;
        rowsOk = false;
      }
      if (!rowsOk && !errors.ubos) errors.ubos = 'Completa os beneficiários efetivos.';
    } else {
      req('contaPropria', !d.contaPropria ? 'Responde se investes por conta própria.' : d.contaPropria === 'nao' ? 'No piloto só aceitamos investimento por conta própria. Se investes por uma empresa, regista-a como pessoa coletiva.' : null);
    }
    req('pep', d.pep ? null : 'Responde à declaração de pessoa politicamente exposta.');
    if (d.pep && d.pep !== 'nao') req('pepDetalhe', validateRequired(d.pepDetalhe, 'Indica o cargo ou a relação com a pessoa exposta.'));
    req('origemFundos', d.origemFundos ? null : 'Escolhe a origem principal dos fundos.');
    req('sancoes', d.sancoes ? null : 'Precisamos desta declaração para continuar.');
  }

  let block: BlockReason | undefined;
  if (i === 4) {
    for (const q of QUIZ) req(q.id, d.quiz[q.id] === undefined ? 'Escolhe uma resposta.' : null);
    req('exp1', d.exp1 ? null : 'Escolhe uma opção.');
    req('exp2', d.exp2 ? null : 'Escolhe uma opção.');
    req('fin1', d.fin1 ? null : 'Escolhe uma opção.');
    req('fin2', d.fin2 ? null : 'Escolhe uma opção.');
    req('fin3', d.fin3 ? null : 'Escolhe uma opção.');
    req('rota', d.rota ? null : 'Escolhe como cumpres os critérios de investidor qualificado.');
    if (d.rota === 'regulada') req('registoSupervisao', validateRequired(d.registoSupervisao, 'Indica o número de registo na autoridade de supervisão.'));
    if (d.rota === 'grande' || d.rota === 'pedido') {
      req('criterios', d.criterios.length >= 2 ? null : `São precisos 2 de 3 critérios; assinalaste ${d.criterios.length}.`);
      req('doc-evidencia', d.docs.evidencia ? null : 'Junta a evidência dos critérios.');
    }
    if (d.rota === 'pedido') req('pedidoEscrito', d.pedidoEscrito ? null : 'Precisamos do pedido expresso para te tratar como investidor profissional.');
    if (d.rota === 'nenhuma') block = 'retail';
    else if (d.fin3 === 'nao') block = 'perda';
  }

  if (i === 5) {
    req('consentTermos', d.consentTermos ? null : 'Aceita os termos do piloto para submeter.');
    req('consentRiscos', d.consentRiscos ? null : 'Confirma que leste a informação sobre riscos.');
    req('consentVeracidade', d.consentVeracidade ? null : 'Precisamos desta declaração para submeter.');
    const sig = signatoryName(d);
    req('assinatura', !d.assinatura.trim() ? 'Escreve o teu nome para assinar.' : norm(d.assinatura) !== norm(sig) ? `Escreve o nome exatamente como no passo 2: ${sig || '(nome em falta)'}.` : null);
  }

  return { errors, done: total - Object.keys(errors).filter((k) => !k.startsWith('ubo-')).length, total, block };
}

export const quizCorrect = (d: Draft) => QUIZ.filter((q) => d.quiz[q.id] === q.correct).length;
