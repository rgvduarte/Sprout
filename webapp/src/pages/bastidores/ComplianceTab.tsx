import { useContext, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, CircleCheck, ClipboardCopy, ShieldAlert } from 'lucide-react';
import { getInvestor, QUESTS, TOTAL_KNOWLEDGE_POINTS, type InvestorClass, type KycCase, type KycStatus } from '../../data';
import { Badge, Button, Card, CardHeader, Checkbox, DataTable, Drawer, Field, KeyValue, RadioGroup, SegmentedControl, StatusPill, Textarea, type Column } from '../../components/ui';
import { knowledgePoints, useToast } from '../../state';
import { GameContext } from '../../state/AppProvider';
import { allPositions } from '../../state/gameStore';
import { daysBetween, TODAY_DATE } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, dateTime, eur, num, plural } from '../../lib/format';
import { BLOCKED_TRIGGERS, DISCLAIMERS, FRAMEWORKS, MATERIALS, MONEY_SCREENS, POINT_SOURCES, SIM_LABEL_OK, type Material } from './content';
import { KYC_SLA_DAYS, OPEN_KYC } from './metrics';
import { actions, lastDecision, useBastidores, type KycAction } from './store';
import { kycStatusAfter, SESSION_CASE_ID, useKycCases } from './useCases';

/* =====================================================================
   Compliance: fila KYC/KYB com decisões, pré-check da classificação do
   produto com o advogado, controlo da gamificação e materiais de
   marketing com a lista de avisos obrigatórios.
   ===================================================================== */

const CLASSE: Record<InvestorClass, string> = { profissional: 'Profissional', qualificado: 'Qualificado', 'nao-qualificado': 'Não qualificado' };
const STATUS: Record<KycStatus, { label: string; tone: 'info' | 'warn' | 'ok' | 'neutral' | 'crit' }> = {
  'em-analise': { label: 'Em análise', tone: 'info' },
  pendente: { label: 'Pendente de informação', tone: 'warn' },
  aprovado: { label: 'Aprovado', tone: 'ok' },
  bloqueado: { label: 'Bloqueado · piloto fechado', tone: 'neutral' },
  recusado: { label: 'Recusado', tone: 'crit' },
  'nao-iniciado': { label: 'Não iniciado', tone: 'neutral' },
};
const RISCO: Record<KycCase['risco'], { label: string; tone: 'neutral' | 'warn' | 'crit' }> = {
  baixo: { label: 'Baixo', tone: 'neutral' },
  medio: { label: 'Médio', tone: 'warn' },
  elevado: { label: 'Elevado', tone: 'crit' },
};
const ACTION_LABEL: Record<KycAction, string> = { aprovar: 'Aprovado', 'pedir-info': 'Pedido de informação', rejeitar: 'Rejeitado' };

/* ------------------------------------------------------------ decisão KYC */

function KycDrawer({ c, onClose }: { c: KycCase | null; onClose: () => void }) {
  const st = useBastidores();
  const { toast } = useToast();
  const [action, setAction] = useState<KycAction | undefined>();
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const close = () => {
    setAction(undefined);
    setNote('');
    setTried(false);
    onClose();
  };
  if (!c) return null;
  const history = st.kyc.filter((d) => d.caseId === c.id);
  const status = kycStatusAfter(c, lastDecision(st, c.id));
  const notQualified = c.classe === 'nao-qualificado';
  const needsNote = action === 'pedir-info' || action === 'rejeitar' || (action === 'aprovar' && c.flags.length > 0);
  const noteError = tried && needsNote && note.trim().length < 8 ? (action === 'aprovar' ? 'Explica como ficaram resolvidos os alertas (mínimo 8 caracteres).' : 'Escreve o que falta ou o motivo (mínimo 8 caracteres).') : undefined;
  const investor = c.investorId ? getInvestor(c.investorId) : undefined;
  const submit = () => {
    setTried(true);
    if (!action) return;
    if (needsNote && note.trim().length < 8) return;
    actions.decideKyc(c.id, action, note);
    toast({ tone: action === 'aprovar' ? 'ok' : action === 'rejeitar' ? 'crit' : 'warn', title: `${c.nome}: ${ACTION_LABEL[action].toLowerCase()}`, description: note.trim() || 'Decisão registada no processo.' });
    close();
  };
  return (
    <Drawer
      open
      onClose={close}
      width="lg"
      title={c.nome}
      description={`${c.tipo === 'pessoa-coletiva' ? 'Pessoa coletiva · KYB' : 'Pessoa singular · KYC'} · submetido a ${fmtDate(c.submittedAt)}`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{tried && !action ? 'Escolhe uma decisão.' : 'A decisão fica no histórico do processo.'}</p>
          <Button onClick={submit}>Registar decisão</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={STATUS[status].tone} label={STATUS[status].label} />
          <Badge tone={RISCO[c.risco].tone}>Risco {RISCO[c.risco].label.toLowerCase()}</Badge>
          {c.id === SESSION_CASE_ID && <Badge tone="accent">Registo desta sessão</Badge>}
        </div>
        <KeyValue
          columns={2}
          dense
          items={[
            { label: 'Classe declarada', value: CLASSE[c.classe] },
            { label: 'Tipo', value: c.tipo === 'pessoa-coletiva' ? 'Pessoa coletiva' : 'Pessoa singular' },
            { label: 'Dias em fila', value: num(daysBetween(c.submittedAt, TODAY_DATE)), mono: true, hint: `prazo interno: ${KYC_SLA_DAYS} dias` },
            { label: 'País', value: investor?.pais ?? 'Portugal' },
          ]}
        />
        <div>
          <h3 className="text-[0.9375rem]">Alertas</h3>
          {c.flags.length ? (
            <ul className="mt-2 space-y-1.5">
              {c.flags.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-fg">
                  <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warn-ink" strokeWidth={1.75} />
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">Sem alertas: documentos completos e beneficiário efetivo validado.</p>
          )}
        </div>
        {history.length > 0 && (
          <div>
            <h3 className="text-[0.9375rem]">Histórico nesta sessão</h3>
            <ol className="mt-2 space-y-2 text-sm">
              {history.map((d) => (
                <li key={d.at}>
                  <span className="font-mono text-muted tnum">{dateTime(d.at)}</span> · <strong className="font-medium text-fg">{ACTION_LABEL[d.action]}</strong>
                  {d.note && <span className="text-muted">: {d.note}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}
        <RadioGroup<KycAction>
          legend="Decisão"
          name={`kyc-${c.id}`}
          value={action}
          onChange={setAction}
          options={[
            {
              value: 'aprovar',
              label: 'Aprovar',
              description: notQualified ? 'Indisponível: o piloto está fechado a investidores qualificados e profissionais.' : 'O investidor pode comprometer capital nos lotes abertos.',
              disabled: notQualified,
            },
            { value: 'pedir-info', label: 'Pedir informação', description: 'O caso fica pendente até o investidor enviar o que falta.' },
            { value: 'rejeitar', label: 'Rejeitar', description: 'Fecha o caso. O investidor é informado do motivo, sem detalhes de AML.' },
          ]}
        />
        <Field label="Nota para o processo" hint={needsNote ? 'Obrigatória para esta decisão.' : 'Opcional.'} error={noteError}>
          {({ id, describedBy, invalid }) => <Textarea id={id} aria-describedby={describedBy} invalid={invalid} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: falta a certidão permanente atualizada" />}
        </Field>
        {c.id === SESSION_CASE_ID && <p className="text-sm text-muted">Este caso veio do ecrã de onboarding. Nesta demonstração, a decisão fica registada aqui, no processo de Compliance.</p>}
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------------ materiais */

function MaterialRow({ m }: { m: Material }) {
  const st = useBastidores();
  const { toast } = useToast();
  const checked = st.materials[m.id] ?? [];
  const approvedAt = st.materialsApproved[m.id];
  const missing = DISCLAIMERS.length - checked.length;
  const status = m.blocked
    ? { tone: 'crit' as const, label: 'Bloqueado' }
    : approvedAt
      ? { tone: 'ok' as const, label: 'Aprovado · distribuição restrita' }
      : missing === 0
        ? { tone: 'info' as const, label: 'Pronto para aprovação' }
        : { tone: 'warn' as const, label: `${plural(missing, 'aviso em falta', 'avisos em falta')}` };
  return (
    <li className="py-1">
      <details className="group">
        <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 rounded-sm py-2 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-fg">{m.title}</span>
            <span className="block text-sm text-muted">
              {m.kind} · {m.owner}
            </span>
          </span>
          <StatusPill tone={status.tone} label={status.label} />
          <ChevronDown aria-hidden className="size-4 text-muted transition-transform duration-200 group-open:rotate-180" strokeWidth={1.75} />
        </summary>
        <div className="pb-3 pl-0 sm:pl-1">
          {m.blocked ? (
            <p className="max-w-[60ch] text-sm text-crit-ink">{m.blocked}</p>
          ) : (
            <>
              <fieldset>
                <legend className="mb-1 text-sm text-muted">Avisos obrigatórios presentes no material</legend>
                <div className="grid gap-x-6 md:grid-cols-2">
                  {DISCLAIMERS.map((d) => (
                    <Checkbox key={d.id} label={d.label} checked={checked.includes(d.id)} onChange={() => actions.toggleDisclaimer(m.id, d.id)} />
                  ))}
                </div>
              </fieldset>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {m.href && (
                  <Link to={m.href} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent hover:underline">
                    Abrir material <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
                  </Link>
                )}
                {approvedAt ? (
                  <span className="text-sm text-muted">Aprovado a {dateTime(approvedAt)} por Jurídico & Compliance.</span>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={missing > 0}
                    title={missing > 0 ? 'Assinala todos os avisos antes de aprovar.' : undefined}
                    onClick={() => {
                      actions.approveMaterial(m.id);
                      toast({ tone: 'ok', title: `${m.title}: aprovado`, description: 'Só para investidores qualificados da coorte do piloto.' });
                    }}
                  >
                    Aprovar para distribuição restrita
                  </Button>
                )}
                {missing > 0 && !approvedAt && <span className="text-sm text-muted">Assinala todos os avisos para poder aprovar.</span>}
              </div>
            </>
          )}
        </div>
      </details>
    </li>
  );
}

/* ------------------------------------------------------------ separador */

export default function ComplianceTab() {
  const st = useBastidores();
  const { toast } = useToast();
  const game = useContext(GameContext);
  const cases = useKycCases();
  const [filter, setFilter] = useState<'abertos' | 'todos'>('abertos');
  const [open, setOpen] = useState<KycCase | null>(null);

  const statusOf = (c: KycCase) => kycStatusAfter(c, lastDecision(st, c.id));
  const openCases = cases.filter((c) => OPEN_KYC.includes(statusOf(c)));
  const rows = filter === 'abertos' ? openCases : cases;

  const cols: Column<KycCase>[] = [
    {
      key: 'nome',
      header: 'Investidor',
      minWidth: 220,
      sortValue: (c) => c.nome,
      render: (c) => (
        <div>
          <div className="font-medium text-fg">{c.nome}</div>
          <div className="text-xs text-muted">
            {c.tipo === 'pessoa-coletiva' ? 'KYB' : 'KYC'} · {CLASSE[c.classe]}
            {c.id === SESSION_CASE_ID && ' · desta sessão'}
          </div>
        </div>
      ),
    },
    {
      key: 'dias',
      header: 'Em fila',
      align: 'right',
      mono: true,
      sortValue: (c) => daysBetween(c.submittedAt, TODAY_DATE),
      render: (c) => {
        const d = daysBetween(c.submittedAt, TODAY_DATE);
        const late = OPEN_KYC.includes(statusOf(c)) && d > KYC_SLA_DAYS;
        return (
          <div>
            <div className={cn(late && 'text-warn-ink')}>{plural(d, 'dia', 'dias')}</div>
            <div className="text-xs text-muted">{fmtDate(c.submittedAt)}</div>
          </div>
        );
      },
    },
    { key: 'risco', header: 'Risco', sortValue: (c) => ['baixo', 'medio', 'elevado'].indexOf(c.risco), render: (c) => <Badge tone={RISCO[c.risco].tone}>{RISCO[c.risco].label}</Badge> },
    { key: 'alertas', header: 'Alertas', minWidth: 220, render: (c) => <span className="text-muted">{c.flags[0] ?? 'Sem alertas'}{c.flags.length > 1 ? ` (+${c.flags.length - 1})` : ''}</span> },
    {
      key: 'estado',
      header: 'Estado',
      minWidth: 170,
      sortValue: (c) => statusOf(c),
      render: (c) => {
        const d = lastDecision(st, c.id);
        return (
          <div>
            <StatusPill tone={STATUS[statusOf(c)].tone} label={STATUS[statusOf(c)].label} />
            {d && <div className="mt-1 text-xs text-muted">decidido às {dateTime(d.at).slice(-5)}</div>}
          </div>
        );
      },
    },
    {
      key: 'acao',
      header: 'Ação',
      srHeader: true,
      align: 'right',
      render: (c) => (
        <Button size="sm" variant={OPEN_KYC.includes(statusOf(c)) ? 'secondary' : 'ghost'} onClick={() => setOpen(c)}>
          {OPEN_KYC.includes(statusOf(c)) ? 'Decidir' : 'Ver'}
        </Button>
      ),
    },
  ];

  /* controlo da gamificação */
  const demo = game?.state.profiles.demo;
  const demoPoints = demo ? knowledgePoints(demo) : 0;
  const demoPositions = demo ? allPositions(demo, 'demo') : [];
  const demoAmount = demoPositions.reduce((s, p) => s + p.amount, 0);
  const criteriaTypes = [...new Set(QUESTS.map((q) => q.criteria.type))];
  const pointsSum = POINT_SOURCES.reduce((s, p) => s + p.points, 0);
  const screensDone = MONEY_SCREENS.filter((s) => st.screensVerified[s.route]).length;

  const controls: { id: string; title: string; evidence: ReactNode; status: { tone: 'ok' | 'info' | 'warn'; label: string } }[] = [
    {
      id: 'gatilhos',
      title: 'Nenhum gatilho de missão usa dinheiro',
      evidence: `${num(QUESTS.length)} missões com ${num(criteriaTypes.length)} tipos de critério (conhecimento, diligência, exploração). ${num(BLOCKED_TRIGGERS.length)} tipos de evento financeiro bloqueados no motor.`,
      status: { tone: 'ok', label: 'Verificado nos dados' },
    },
    {
      id: 'pontos',
      title: 'Pontos só por conhecimento',
      evidence: `${num(pointsSum)} pontos possíveis: ${POINT_SOURCES.map((p) => `${p.label.toLowerCase()} ${num(p.points)}`).join(', ')}.`,
      status: pointsSum === TOTAL_KNOWLEDGE_POINTS ? { tone: 'ok', label: 'Verificado nos dados' } : { tone: 'warn', label: 'Soma não bate' },
    },
    {
      id: 'compromisso',
      title: 'Comprometer capital não dá pontos nem nível',
      evidence: `A investidora de demonstração tem ${eur(demoAmount)} em ${plural(demoPositions.length, 'lote', 'lotes')} e ${num(demoPoints)} pontos, todos de módulos, missões e mini-jogos.`,
      status: { tone: 'ok', label: 'Verificado no perfil' },
    },
    {
      id: 'ranking',
      title: 'Sem rankings onde há dinheiro real',
      evidence: (
        <>
          A Liga de campanha existe só no <Link to="/academia/simulador" className="text-accent underline underline-offset-[0.2em]">Simulador</Link>, com dinheiro fictício, pseudónimo e Pontuação de gestão.
        </>
      ),
      status: { tone: 'ok', label: 'Por desenho' },
    },
    { id: 'pressao', title: 'Sem streaks, contagens decrescentes nem escassez', evidence: 'Nada conta dias seguidos nem tempo até ao fecho de um lote. Mostra-se quanto falta financiar, sem urgência.', status: { tone: 'ok', label: 'Por desenho' } },
    {
      id: 'simulador',
      title: 'Dinheiro fictício sempre etiquetado',
      evidence: '"Simulação educativa · dinheiro fictício · não representa resultados reais" em todas as vistas do Simulador.',
      status: SIM_LABEL_OK ? { tone: 'ok', label: 'Verificado nos dados' } : { tone: 'warn', label: 'Etiqueta alterada' },
    },
    { id: 'recompensas', title: 'Recompensas sem valor financeiro', evidence: 'Amostras, provas, visitas e relatórios. Nenhum desconto, bónus ou prioridade de alocação.', status: { tone: 'ok', label: 'Por desenho' } },
    { id: 'colecao', title: 'Selos e cartas não transferíveis nem resgatáveis', evidence: 'Sem mercado, sem troca, sem valor de resgate.', status: { tone: 'ok', label: 'Por desenho' } },
    { id: 'reflexao', title: 'Período de reflexão de 4 dias depois de cada compromisso', evidence: 'Cancelamento sem custos durante 4 dias, como política própria do piloto.', status: { tone: 'ok', label: 'Por desenho' } },
    {
      id: 'nota',
      title: 'Nota de capital em risco em todas as vistas com dinheiro real',
      evidence: 'Verificação manual, ecrã a ecrã. Abre cada um e marca quando confirmares a nota.',
      status: screensDone === MONEY_SCREENS.length ? { tone: 'ok', label: 'Verificado ecrã a ecrã' } : { tone: 'warn', label: `${num(screensDone)} de ${num(MONEY_SCREENS.length)} ecrãs verificados` },
    },
  ];

  const copyQuestions = async () => {
    const text = FRAMEWORKS.map((f, i) => `${i + 1}. ${f.name} (${f.ref})\n${f.question}\nHipótese de trabalho: ${f.hypothesis}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ tone: 'ok', title: 'Perguntas copiadas', description: `${plural(FRAMEWORKS.length, 'pergunta pronta', 'perguntas prontas')} a colar no pedido de parecer.` });
    } catch {
      toast({ tone: 'warn', title: 'Não foi possível copiar', description: 'O navegador bloqueou a área de transferência. Seleciona o texto da lista e copia à mão.' });
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="kyc-t">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="kyc-t" className="text-[1.375rem] leading-tight">
              Fila KYC/KYB
            </h2>
            <p className="measure mt-1 text-muted">Identificação, beneficiário efetivo e classificação do investidor. O piloto só aceita investidores qualificados e profissionais.</p>
          </div>
          <SegmentedControl
            label="Casos a mostrar"
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'abertos', label: `Por decidir (${openCases.length})` },
              { value: 'todos', label: `Todos (${cases.length})` },
            ]}
          />
        </div>
        <DataTable
          columns={cols}
          rows={rows}
          getRowId={(c) => c.id}
          caption="Fila KYC/KYB"
          initialSort={{ key: 'dias', dir: 'desc' }}
          empty={{ title: 'Nenhum caso por decidir', body: 'Todos os casos desta fila têm decisão. Vê o histórico em "Todos".', action: <Button size="sm" variant="secondary" onClick={() => setFilter('todos')}>Ver todos</Button> }}
        />
      </section>

      <Card>
        <CardHeader
          title="Classificação do produto: pré-check com o advogado"
          description="Seis perguntas que decidem se o piloto pode avançar como está. Nenhuma tem parecer ainda."
          actions={
            <Button size="sm" variant="secondary" iconLeft={<ClipboardCopy aria-hidden className="size-4" strokeWidth={1.75} />} onClick={copyQuestions}>
              Copiar perguntas
            </Button>
          }
        />
        <ul className="divide-y divide-border">
          {FRAMEWORKS.map((f) => (
            <li key={f.id} className="grid gap-x-6 gap-y-2 py-4 first:pt-0 last:pb-0 lg:grid-cols-[12rem_minmax(0,1fr)_15rem]">
              <div>
                <p className="font-semibold text-fg">{f.name}</p>
                <p className="text-sm text-muted">{f.ref}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[0.9375rem] text-fg">{f.question}</p>
                <p className="mt-1.5 text-sm text-muted">
                  <span className="font-medium text-fg">Hipótese de trabalho:</span> {f.hypothesis}
                </p>
                <p className="mt-1 text-sm text-muted">
                  <span className="font-medium text-fg">Se a resposta for sim:</span> {f.ifYes}
                </p>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <StatusPill tone="warn" label="Pendente de parecer jurídico" />
                <p className="text-sm text-muted">
                  Responsável: Jurídico & Compliance ·{' '}
                  <Link to="/plano" className="text-accent underline underline-offset-[0.2em]">
                    ver no Plano
                  </Link>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="Controlo da gamificação"
          description="Prova de que as mecânicas permitidas estão em uso e as proibidas não existem onde há dinheiro real."
          actions={
            <Link to="/bastidores?sec=revisao" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent hover:underline">
              Padrões adotados e rejeitados <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
            </Link>
          }
        />
        <ul className="divide-y divide-border">
          {controls.map((c) => (
            <li key={c.id} className="grid gap-x-6 gap-y-1.5 py-3 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] md:items-baseline">
              <p className="font-medium text-fg">{c.title}</p>
              <div className="min-w-0 text-sm text-muted">
                {c.evidence}
                {c.id === 'nota' && (
                  <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
                    {MONEY_SCREENS.map((s) => (
                      <li key={s.route} className="flex items-center gap-1">
                        <Checkbox className="flex-1" label={s.label} description={st.screensVerified[s.route] ? `verificado às ${dateTime(st.screensVerified[s.route]).slice(-5)}` : s.route} checked={Boolean(st.screensVerified[s.route])} onChange={() => actions.toggleScreen(s.route)} />
                        <Link to={s.route} aria-label={`Abrir ${s.label}`} className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-accent hover:bg-surface-2">
                          <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <StatusPill tone={c.status.tone} label={c.status.label} />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button
            variant="secondary"
            iconLeft={<CircleCheck aria-hidden className="size-4" strokeWidth={1.75} />}
            onClick={() => {
              actions.recordGamReview();
              toast({ tone: 'ok', title: 'Revisão da gamificação registada', description: screensDone === MONEY_SCREENS.length ? 'Todos os controlos cumpridos.' : `Ficam ${MONEY_SCREENS.length - screensDone} ecrãs por verificar.` });
            }}
          >
            Registar revisão
          </Button>
          <p className="text-sm text-muted">{st.gamReviewAt ? `Última revisão: ${dateTime(st.gamReviewAt)}, Compliance.` : 'Ainda sem revisão registada nesta campanha.'}</p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Materiais de marketing" description="Cada material só sai com todos os avisos e aprovação de Jurídico & Compliance. Distribuição restrita à coorte do piloto." />
        <ul className="divide-y divide-border">
          {MATERIALS.map((m) => (
            <MaterialRow key={m.id} m={m} />
          ))}
        </ul>
      </Card>

      <KycDrawer key={open?.id ?? 'none'} c={open} onClose={() => setOpen(null)} />
    </div>
  );
}
