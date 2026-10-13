import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Badge, Button, Card, Disclaimer, Page, PageHeader, Stepper, TextLink } from '../../components/ui';
import { EASE_OUT } from '../../components/game';
import { DEMO_INVESTOR_ID, getLot, KYC_QUEUE } from '../../data';
import { useData, useGame, useRole, useToast, type ProfileId } from '../../state';
import { now } from '../../lib/clock';
import { date as fmtDate } from '../../lib/format';
import {
  checkStep,
  classeFor,
  displayName,
  docSlotsFor,
  emptyDraft,
  EXP1,
  EXP2,
  exampleDraft,
  FIN1,
  FIN2,
  isExampleValue,
  paisLabel,
  quizCorrect,
  ROTA_LABEL,
  STEPS,
  useDraft,
  type Draft,
} from './draft';
import { ADQ, VISITOR_KYC_ID, caseLabel } from './kycCase';
import { ErrorSummary, MissionBar, type StepProps } from './parts';
import { StepDados, StepDocumentos, StepPerfil } from './StepsA';
import { BlockPanel, StepAdequacao, StepBeneficiario, StepRevisao } from './StepsB';
import { ApprovedView, BlockedView, CLASSE_LABEL, ReviewView, type CaseView } from './StatusViews';

/* =====================================================================
   Onboarding: KYC/KYB e adequação como uma linha de missões. Seis passos,
   progresso visível campo a campo, nada sobre dinheiro.
   ===================================================================== */

const FIELD_LABELS: Record<string, string> = {
  tipo: 'Tipo de investidor',
  pais: 'País de residência fiscal',
  entidade: 'Tipo de entidade',
  nome: 'Nome completo',
  nif: 'NIF',
  nascimento: 'Data de nascimento',
  nacionalidade: 'Nacionalidade',
  denominacao: 'Denominação',
  nipc: 'NIPC',
  morada: 'Morada',
  codigoPostal: 'Código postal',
  localidade: 'Localidade',
  repNome: 'Nome do representante',
  repNif: 'NIF do representante',
  repCargo: 'Cargo do representante',
  email: 'Email',
  telefone: 'Telefone',
  iban: 'IBAN',
  certidao: 'Código da certidão permanente',
  'doc-id': 'Cartão de cidadão ou passaporte',
  'doc-morada': 'Comprovativo de morada',
  'doc-iban': 'Comprovativo de IBAN',
  'doc-rep': 'Documento do representante',
  'doc-procuracao': 'Procuração',
  'doc-evidencia': 'Evidência dos critérios',
  ubos: 'Beneficiários efetivos',
  contaPropria: 'Conta própria',
  pep: 'Pessoa politicamente exposta',
  pepDetalhe: 'Cargo ou relação PEP',
  origemFundos: 'Origem dos fundos',
  sancoes: 'Declaração de sanções',
  q1: 'Pergunta 1',
  q2: 'Pergunta 2',
  q3: 'Pergunta 3',
  exp1: 'Ativos sem mercado secundário',
  exp2: 'Experiência com mercadorias',
  fin1: 'Património financeiro',
  fin2: 'Parte a afetar',
  fin3: 'Capacidade de suportar perdas',
  rota: 'Qualificação',
  registoSupervisao: 'N.º de registo',
  criterios: 'Critérios',
  pedidoEscrito: 'Pedido de tratamento como profissional',
  consentTermos: 'Termos do piloto',
  consentRiscos: 'Informação sobre riscos',
  consentVeracidade: 'Declaração de veracidade',
  assinatura: 'Assinatura',
};

const STEP_INTRO = [
  'Como vais investir e onde tens residência fiscal. Isto define os documentos e as regras que se aplicam.',
  'Os dados que vamos comparar com os documentos. O NIF e o IBAN são validados enquanto escreves.',
  'Arrasta os ficheiros ou escolhe-os no computador. Confirmamos o formato no teu browser.',
  'Quem está por trás do investimento e de onde vem o dinheiro.',
  'Três perguntas sobre o produto, a tua experiência e situação financeira, e o critério de investidor qualificado que cumpres.',
  'Confirma o que escreveste, aceita os termos e assina.',
];

const WHY: { title: string; body: string[] }[] = [
  {
    title: 'Porque pedimos isto',
    body: [
      'Uma pessoa coletiva entrega a certidão permanente e declara os beneficiários efetivos; uma pessoa singular entrega identificação e morada.',
      'O piloto só aceita residentes fiscais na UE e no EEE porque o dinheiro passa apenas por prestadores de pagamento licenciados na UE, com contas segregadas.',
    ],
  },
  {
    title: 'Porque pedimos isto',
    body: [
      'A lei de prevenção do branqueamento de capitais (Lei n.º 83/2017) obriga-nos a identificar quem investe antes de aceitar fundos.',
      'O IBAN tem de ser do próprio investidor: só recebemos transferências dessa conta, e é para ela que vão as liquidações.',
    ],
  },
  {
    title: 'Porque pedimos isto',
    body: ['Os documentos provam os dados do passo anterior. Um comprovativo de morada serve se tiver menos de 3 meses.', 'Nesta demonstração os ficheiros ficam no teu browser.'],
  },
  {
    title: 'Porque pedimos isto',
    body: [
      'O beneficiário efetivo é quem, no fim da cadeia, detém ou controla a entidade. Confirmamo-lo no RCBE (Lei n.º 89/2017).',
      'Ser pessoa politicamente exposta não impede o registo: obriga a diligência reforçada.',
    ],
  },
  {
    title: 'Porque pedimos isto',
    body: [
      'O piloto é fechado a investidores qualificados. As regras de promoção a investidores na UE não nos deixam abrir a mais pessoas nesta fase.',
      'As perguntas sobre o produto não dão nota: servem para confirmar que a janela de 18 meses, a perda possível e a falta de mercado secundário ficaram claras.',
    ],
  },
  {
    title: 'O que acontece a seguir',
    body: ['A equipa de compliance verifica o processo em 2 dias úteis, ou 5 com diligência reforçada.', 'Depois da aprovação recebes a referência da conta segregada para transferências SEPA. Sem numerário.'],
  },
];

function docNames(d: Draft): string[] {
  const names = docSlotsFor(d)
    .filter((s) => d.docs[s.slot])
    .map((s) => (s.slot === 'rep' ? 'Documento do representante legal' : s.slot === 'iban' ? 'Comprovativo de IBAN' : s.label));
  if (d.tipo === 'pessoa-coletiva') names.unshift('Certidão permanente', 'RCBE');
  if (d.docs.evidencia) names.push('Evidência de qualificação');
  return names;
}

function adequacaoRecord(d: Draft, submittedAt: number): Record<string, number> {
  const idx = (list: readonly string[], v: string) => list.indexOf(v);
  return {
    q1: d.quiz.q1 ?? -1,
    q2: d.quiz.q2 ?? -1,
    q3: d.quiz.q3 ?? -1,
    exp1: idx(EXP1, d.exp1),
    exp2: idx(EXP2, d.exp2),
    fin1: idx(FIN1, d.fin1),
    fin2: idx(FIN2, d.fin2),
    fin3: d.fin3 === 'sim' ? 1 : d.fin3 === 'nao' ? 0 : -1,
    [ADQ.pep]: d.pep === 'proprio' ? 1 : d.pep === 'familiar' ? 2 : 0,
    [ADQ.rota]: ['regulada', 'grande', 'pedido', 'nenhuma'].indexOf(d.rota),
    [ADQ.quizCorrect]: quizCorrect(d),
    [ADQ.criterios]: d.criterios.length,
    [ADQ.submittedAt]: submittedAt,
  };
}

/* ------------------------------------------------------------ fluxo de registo */

function RegistrationFlow({ profileId }: { profileId: ProfileId }) {
  const [draft, update, replace] = useDraft(profileId);
  const game = useGame();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const stepChanged = useRef(false);
  const [params] = useSearchParams();
  const fromLot = params.get('lote') ? getLot(params.get('lote')!) : undefined;

  const step = Math.min(draft.step, STEPS.length - 1);
  const check = useMemo(() => checkStep(step, draft), [step, draft]);
  const fractions = useMemo(
    () =>
      STEPS.map((_, i) => {
        const c = checkStep(i, draft);
        const f = c.total ? c.done / c.total : 0;
        return c.block ? Math.min(f, (c.total - 1) / c.total) : f;
      }),
    [draft],
  );

  useEffect(() => {
    if (!stepChanged.current) return;
    stepChanged.current = false;
    heading.current?.focus({ preventScroll: true });
    const rect = top.current?.getBoundingClientRect();
    if (rect && rect.top < 0) top.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [step, reduce]);

  const goTo = (i: number) => {
    stepChanged.current = true;
    update({ step: i });
    setAttempted(false);
    setTouched(new Set());
  };

  const props: StepProps = {
    d: draft,
    set: update,
    err: (k) => (attempted || touched.has(k) ? check.errors[k] : undefined),
    raw: (k) => check.errors[k],
    touch: (k) => setTouched((t) => (t.has(k) ? t : new Set(t).add(k))),
    isEx: (k) => isExampleValue(draft, k),
    goTo,
  };

  const hasErrors = Object.keys(check.errors).length > 0;

  const next = () => {
    if (hasErrors || check.block) {
      setAttempted(true);
      return;
    }
    const firstTime = step >= draft.reached;
    const ni = step + 1;
    stepChanged.current = true;
    update({ step: ni, reached: Math.max(draft.reached, ni) });
    setAttempted(false);
    setTouched(new Set());
    game.updateOnboarding({ status: 'em-curso', step: ni, tipo: draft.tipo || undefined, nome: displayName(draft) || undefined, pais: paisLabel(draft.pais) });
    if (firstTime) {
      const left = fractions.filter((f, i) => i !== step && f < 1).length;
      toast({
        tone: 'accent',
        title: `Missão de registo cumprida: ${STEPS[step].label}`,
        description: left === 0 ? 'Tudo pronto: só falta assinar.' : left === 1 ? 'Falta 1 passo.' : `Faltam ${left} passos.`,
        duration: 3800,
      });
    }
  };

  const submit = async () => {
    if (hasErrors) {
      setAttempted(true);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 900));
    const at = now();
    setSubmitting(false);
    update({ submittedAt: at.toISOString() });
    game.updateOnboarding({
      status: 'em-analise',
      step: STEPS.length,
      tipo: draft.tipo || undefined,
      classe: classeFor(draft),
      nome: displayName(draft),
      pais: paisLabel(draft.pais),
      documentos: docNames(draft),
      adequacao: adequacaoRecord(draft, at.getTime()),
      blockedReason: undefined,
    });
    toast({ tone: 'accent', title: `Registo submetido: processo ${caseLabel(VISITOR_KYC_ID)}`, description: 'Missão de registo cumprida. Falta uma: o teu objetivo de aprendizagem.' });
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  const joinWaitlist = () => {
    const at = now();
    game.updateOnboarding({
      status: 'bloqueado',
      step: 4,
      classe: 'nao-qualificado',
      tipo: draft.tipo || undefined,
      nome: displayName(draft) || 'Visitante',
      pais: paisLabel(draft.pais),
      documentos: [],
      adequacao: adequacaoRecord(draft, at.getTime()),
      blockedReason: 'Investidor não qualificado: lista de interesse para quando o acesso abrir',
    });
    toast({ tone: 'neutral', title: 'Ficas na lista de interesse', description: 'A Academia e o Simulador continuam abertos, sem registo.' });
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  const stepBody = (() => {
    switch (step) {
      case 0:
        return <StepPerfil {...props} />;
      case 1:
        return <StepDados {...props} />;
      case 2:
        return <StepDocumentos {...props} />;
      case 3:
        return <StepBeneficiario {...props} />;
      case 4:
        return (
          <StepAdequacao
            {...props}
            blockPanel={
              check.block ? (
                <BlockPanel
                  reason={check.block}
                  onWaitlist={joinWaitlist}
                  onChange={() => document.querySelector<HTMLInputElement>('[data-field="fin3"] input')?.focus()}
                />
              ) : null
            }
          />
        );
      default:
        return <StepRevisao {...props} />;
    }
  })();

  return (
    <>
      {draft.example && (
        <section aria-label="Exemplo fictício" className="mb-5 flex flex-col gap-3 rounded-md border border-border bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="measure text-sm text-fg">
            <Badge tone="neutral" className="mr-2 align-[1px]">
              exemplo
            </Badge>
            Preenchemos o registo com dados fictícios para veres o percurso inteiro. Os campos marcados podem ser alterados; as três perguntas sobre o produto e a assinatura ficam para ti.
          </p>
          <Button variant="secondary" size="sm" className="shrink-0 self-start sm:self-center" onClick={() => replace({ ...emptyDraft() })}>
            Começar do zero
          </Button>
        </section>
      )}
      {fromLot && (
        <Disclaimer boxed className="mb-5">
          Vieste do lote <span className="font-mono tnum">{fromLot.id}</span>. Para comprometer capital é preciso concluir o registo e a verificação; depois voltas ao lote para leres os fatores de risco.{' '}
          <TextLink to={`/lote/${fromLot.id}`}>Voltar ao lote</TextLink>
        </Disclaimer>
      )}

      <div ref={top} className="scroll-mt-20 rounded-md border border-border bg-surface px-4 py-4 sm:px-6 sm:py-5">
        <Stepper steps={STEPS.map((s) => ({ id: s.id, label: s.label }))} current={step} onStepClick={goTo} />
        <div className="mt-4 border-t border-border pt-4">
          <MissionBar fractions={fractions} current={step} counts={{ done: check.done, total: check.total }} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <Card as="section" padding="lg" aria-labelledby="ob-step-title">
          <header className="mb-7">
            <h2 id="ob-step-title" ref={heading} tabIndex={-1} className="text-[1.5rem] leading-tight outline-none">
              {STEPS[step].title}
            </h2>
            <p className="measure mt-1.5 text-muted">{STEP_INTRO[step]}</p>
            {step < STEPS.length - 1 && <p className="mt-1 text-sm text-muted">Todos os campos são obrigatórios, salvo indicação.</p>}
          </header>
          {attempted && <ErrorSummary errors={check.errors} labels={FIELD_LABELS} />}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -10, transition: { duration: 0.12 } }}
              transition={{ duration: 0.26, ease: EASE_OUT }}
            >
              {stepBody}
            </motion.div>
          </AnimatePresence>
          <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => goTo(step - 1)} iconLeft={<ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />}>
                Voltar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap items-center justify-end gap-3">
              {check.block && <p className="text-sm text-muted">Sem qualificação não é possível continuar.</p>}
              {step < STEPS.length - 1 ? (
                <Button variant="primary" onClick={next} disabled={Boolean(check.block)} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
                  Continuar
                </Button>
              ) : (
                <Button variant="primary" onClick={submit} loading={submitting}>
                  {submitting ? 'A submeter…' : 'Assinar e submeter'}
                </Button>
              )}
            </div>
          </footer>
        </Card>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24" aria-label="Contexto do passo">
          <Card>
            <h2 className="text-[1.0625rem]">{WHY[step].title}</h2>
            <div className="mt-2 flex flex-col gap-2 text-sm text-muted">
              {WHY[step].body.map((b) => (
                <p key={b}>{b}</p>
              ))}
            </div>
          </Card>
          <p className="px-1 text-sm text-muted">
            Nada neste registo envolve dinheiro. Os pontos de conhecimento vêm da Academia; aqui só se mede o que falta para abrir conta.
          </p>
          {!draft.example && profileId === 'visitante' && (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => replace({ ...exampleDraft(draft.tipo || 'pessoa-singular'), step: draft.step, reached: draft.reached })}>
              Repor o exemplo fictício
            </Button>
          )}
        </aside>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ página */

const DEMO_DOC_NOTES: Record<string, string> = {
  RCBE: 'Declaração do beneficiário efetivo consultada a 25/11/2025. Atualiza-a se a estrutura de capital mudar.',
  'Comprovativo de IBAN': 'Conta de origem e de liquidação confirmada a 25/11/2025.',
  'Declaração de investidor qualificado': 'Pedido escrito assinado a 21/11/2025, com evidência de 2 dos 3 critérios.',
};

export default function OnboardingPage() {
  const { profileId } = useRole();
  const game = useGame();
  const { investor } = useData();
  const { toast } = useToast();
  const [draft, , replace] = useDraft(profileId);
  const o = game.onboarding;
  const status = o.status;

  const restart = () => {
    game.updateOnboarding({ status: 'nao-iniciado', step: 0, adequacao: {}, documentos: [], blockedReason: undefined, classe: undefined, nome: undefined, tipo: undefined, pais: undefined });
    replace(exampleDraft());
    window.scrollTo({ top: 0 });
  };

  const caseView: CaseView = useMemo(() => {
    if (profileId === 'demo') {
      const k = KYC_QUEUE.find((x) => x.investorId === DEMO_INVESTOR_ID);
      return {
        id: k?.id ?? 'kyc-017',
        nome: investor.nome,
        tipo: investor.tipo,
        classe: investor.classe,
        rota: 'Tratamento como investidor profissional a pedido, com 2 de 3 critérios',
        pais: investor.pais,
        submittedAt: k?.submittedAt ?? '2025-11-21',
        decidedAt: o.updatedAt ?? investor.since,
        documentos: o.documentos.map((name) => ({ name, note: DEMO_DOC_NOTES[name] ?? 'Verificado.' })),
        pep: false,
        risco: 'baixo',
      };
    }
    const submittedAt = draft.submittedAt ?? (o.adequacao[ADQ.submittedAt] ? new Date(o.adequacao[ADQ.submittedAt]).toISOString() : now().toISOString());
    const pep = (o.adequacao[ADQ.pep] ?? 0) > 0;
    return {
      id: VISITOR_KYC_ID,
      nome: o.nome ?? displayName(draft),
      tipo: o.tipo ?? (draft.tipo || 'pessoa-singular'),
      classe: o.classe ?? classeFor(draft),
      rota: draft.rota ? ROTA_LABEL[draft.rota] : '',
      pais: o.pais ?? paisLabel(draft.pais),
      submittedAt,
      decidedAt: status === 'aprovado' ? o.updatedAt : undefined,
      documentos: o.documentos.map((name) => ({ name, note: `Junto a ${fmtDate(submittedAt)} e verificado pela equipa.` })),
      pep,
      risco: pep ? 'elevado' : 'baixo',
    };
  }, [profileId, investor, o, draft, status]);

  const header =
    status === 'aprovado'
      ? {
          title: 'Verificação concluída',
          description: 'Conta ativa no piloto fechado. Aqui ficam o estado do processo KYC, a classificação e os documentos em ficheiro.',
        }
      : status === 'em-analise'
        ? { title: 'Registo submetido', description: 'A equipa de compliance está a verificar o processo. Enquanto esperas, define o que queres aprender primeiro.' }
        : status === 'bloqueado'
          ? { title: 'Acesso ao piloto', description: 'O registo ficou na lista de interesse. Aprender continua aberto.' }
          : {
              title: 'Registo no piloto',
              description: 'Seis passos para abrir conta no piloto fechado de azeite e água. Cerca de 12 minutos, e podes voltar a qualquer passo.',
            };

  const meta =
    status === 'aprovado' ? (
      <>
        <Badge tone="ok" dot>
          KYC aprovado
        </Badge>
        <Badge tone="neutral">{CLASSE_LABEL[caseView.classe]}</Badge>
        <Badge tone="neutral">
          <span className="font-mono tnum">{caseLabel(caseView.id)}</span>
        </Badge>
      </>
    ) : status === 'em-analise' ? (
      <Badge tone="warn" dot>
        Em análise
      </Badge>
    ) : status === 'bloqueado' ? (
      <Badge tone="neutral" dot>
        Lista de interesse
      </Badge>
    ) : (
      <>
        <Badge tone="accent">Só investidores qualificados</Badge>
        <Badge tone="neutral">KYC/KYB · adequação</Badge>
      </>
    );

  return (
    <Page>
      <PageHeader title={header.title} description={header.description} meta={meta} />
      {status === 'aprovado' ? (
        <ApprovedView c={caseView} profileId={profileId} onRestart={profileId === 'visitante' ? restart : undefined} />
      ) : status === 'em-analise' ? (
        <ReviewView
          c={caseView}
          profileId={profileId}
          onRestart={restart}
          onApprove={() => {
            game.updateOnboarding({ status: 'aprovado' });
            toast({ tone: 'ok', title: 'Verificação concluída (simulação)', description: 'A conta está ativa. Cada compromisso continua a exigir a leitura dos fatores de risco do lote.' });
            window.scrollTo({ top: 0 });
          }}
        />
      ) : status === 'bloqueado' ? (
        <BlockedView
          c={{ nome: o.nome ?? 'Este registo', reason: o.blockedReason }}
          since={o.adequacao[ADQ.submittedAt] ? new Date(o.adequacao[ADQ.submittedAt]).toISOString() : o.updatedAt}
          profileId={profileId}
          onReview={() => {
            game.updateOnboarding({ status: 'em-curso', step: 4, blockedReason: undefined });
            replace({ ...draft, step: 4 });
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <RegistrationFlow profileId={profileId} />
      )}
    </Page>
  );
}
