import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Ban, Check, CircleAlert, CircleDashed, CircleDot, Quote, TriangleAlert } from 'lucide-react';
import { ACTION_ITEMS, EXECUTION_PLAN, SOURCE_DOC, type ActionItem, type ExecutionPlanRow } from '../../data';
import { EASE_OUT } from '../../components/game';
import { Badge, Button, Card, CardHeader, DataTable, Field, Input, Meter, Page, PageHeader, Select, StatusPill, Textarea, type Column } from '../../components/ui';
import { useToast } from '../../state';
import { TODAY_DATE } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, dateTime, lisbonParts, MONTHS_SHORT, num, plural } from '../../lib/format';
import { ALLOWED, DECISION_STATUS, DIRECTIVE_2026_10_13, FORBIDDEN, FOUNDERS_QUOTES, PHASES, PILOT_SCOPE, PRIORITY_ZERO, type Decision, type Phase } from './content';
import { ITEM_STATUS_LABEL, ITEM_STATUSES, planoActions, usePlano, type ItemStatus, type PlanoState } from './store';

/* =====================================================================
   /plano · Plano de execução (equipa). O plano dos fundadores tal como
   saiu da reunião de 13/10: responsáveis, ações (texto exato, prazo TBD),
   prioridade zero, roteiro por fases com go/no-go e registo de decisões.
   Pessoas reais do documento-fonte só aparecem aqui.
   ===================================================================== */


function StatusIcon({ s, className }: { s: ItemStatus; className?: string }) {
  const cls = cn('size-4 shrink-0', className);
  if (s === 'concluido') return <Check aria-hidden className={cn(cls, 'text-ok-ink')} strokeWidth={2.25} />;
  if (s === 'em-curso') return <CircleDot aria-hidden className={cn(cls, 'text-info-ink')} strokeWidth={1.75} />;
  if (s === 'bloqueado') return <CircleAlert aria-hidden className={cn(cls, 'text-crit-ink')} strokeWidth={1.75} />;
  return <CircleDashed aria-hidden className={cn(cls, 'text-muted')} strokeWidth={1.75} />;
}

const itemsOf = (owner: string) => ACTION_ITEMS.filter((a) => a.owner === owner);
const doneCount = (ids: string[], st: PlanoState) => ids.filter((id) => st.status[id] === 'concluido').length;

/** Estado agregado de um conjunto de ações. */
function aggregate(ids: string[], st: PlanoState): ItemStatus {
  const list = ids.map((id) => st.status[id]);
  if (list.every((s) => s === 'concluido')) return 'concluido';
  if (list.some((s) => s === 'bloqueado')) return 'bloqueado';
  if (list.some((s) => s === 'em-curso' || s === 'concluido')) return 'em-curso';
  return 'por-iniciar';
}

/* ------------------------------------------------------------ ações */

function ActionRow({ item, st }: { item: ActionItem; st: PlanoState }) {
  const s = st.status[item.id];
  const reduce = useReducedMotion();
  return (
    <li className="border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-2">
        <motion.span key={s} initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.18, ease: EASE_OUT }} className="mt-0.5">
          <StatusIcon s={s} />
        </motion.span>
        <p className={cn('min-w-0 text-[0.9375rem] leading-snug', s === 'concluido' ? 'text-muted' : 'text-fg')}>{item.text}</p>
      </div>
      <div className="mt-2 flex items-center gap-2 pl-6">
        <div className="min-w-0 flex-1">
          <Select aria-label={`Estado da ação: ${item.text}`} value={s} onChange={(e) => planoActions.setStatus(item.id, e.target.value as ItemStatus)} className="h-10 text-sm">
            {ITEM_STATUSES.map((v) => (
              <option key={v} value={v}>
                {ITEM_STATUS_LABEL[v]}
              </option>
            ))}
          </Select>
        </div>
        <span className="shrink-0 font-mono text-sm text-muted tnum" title="Prazo por definir">
          Prazo: <span className="text-fg">{item.due}</span>
        </span>
      </div>
      {st.changedAt[item.id] && <p className="mt-1 pl-6 text-xs text-muted">alterado às {dateTime(st.changedAt[item.id]).slice(-5)}</p>}
    </li>
  );
}

function OwnerLane({ row, st }: { row: ExecutionPlanRow; st: PlanoState }) {
  const items = itemsOf(row.responsavel);
  const done = doneCount(items.map((i) => i.id), st);
  const unassigned = row.responsavel === 'Tesouraria';
  const candidates = EXECUTION_PLAN.filter((r) => r.responsavel !== 'Tesouraria').map((r) => r.responsavel);
  return (
    <section aria-labelledby={`lane-${row.responsavel}`} className={cn('flex min-w-0 flex-col rounded-md border bg-surface p-4', unassigned ? 'border-[color-mix(in_oklab,var(--warn)_50%,var(--border))]' : 'border-border')}>
      <header>
        <h3 id={`lane-${row.responsavel}`} className="text-[1.0625rem] leading-tight">
          {unassigned ? 'Risco & Tesouraria' : row.responsavel}
        </h3>
        <p className="mt-0.5 text-sm text-muted">{row.area}</p>
        {unassigned ? (
          <div className="mt-2 flex flex-col gap-2">
            <Badge tone="warn" icon={<TriangleAlert aria-hidden className="size-3.5" strokeWidth={1.75} />}>
              {row.foco}
            </Badge>
            <Field label="Propor responsável interino">
              {({ id }) => (
                <Select id={id} value={st.treasuryProposal ?? ''} onChange={(e) => planoActions.proposeTreasury(e.target.value || null)} className="h-10 text-sm">
                  <option value="">Sem proposta</option>
                  {candidates.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="contratação externa">Contratação externa</option>
                </Select>
              )}
            </Field>
            {st.treasuryProposal && <p className="text-xs text-muted">Proposta registada no registo de decisões, a confirmar.</p>}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted">
            Foco: <span className="text-fg">{row.foco}</span>
          </p>
        )}
        <Meter className="mt-3" size="sm" value={items.length ? done / items.length : 0} label="Ações concluídas" valueLabel={`${num(done)} de ${num(items.length)}`} tone={done === items.length ? 'ok' : 'accent'} />
      </header>
      <ol className="mt-4 flex-1">
        {items.map((it) => (
          <ActionRow key={it.id} item={it} st={st} />
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------ roteiro */

const CAL_FROM = { y: 2026, m: 10 };
const CAL_MONTHS = 36;
const monthPos = (ym: string, end = false) => {
  const [y, m] = ym.split('-').map(Number);
  return ((y - CAL_FROM.y) * 12 + (m - CAL_FROM.m) + (end ? 1 : 0)) / CAL_MONTHS;
};

function PhaseCalendar() {
  const reduce = useReducedMotion();
  const today = lisbonParts(TODAY_DATE);
  const todayPos = ((today.year - CAL_FROM.y) * 12 + (today.month - CAL_FROM.m) + (today.day - 1) / 31) / CAL_MONTHS;
  const months = Array.from({ length: CAL_MONTHS }, (_, i) => ((CAL_FROM.m - 1 + i) % 12) + 1);
  const campaigns = ['Campanha 2026/27', 'Campanha 2027/28', 'Campanha 2028/29'];
  return (
    <figure className="min-w-0">
      <figcaption className="sr-only">Fases do plano sobre o calendário agrícola, de outubro de 2026 a setembro de 2029. Janelas indicativas.</figcaption>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" tabIndex={0} role="region" aria-label="Calendário das fases (desliza na horizontal)">
        <div className="min-w-[680px]" data-world="azeite">
          <div className="grid grid-cols-[11rem_minmax(0,1fr)] gap-3">
            <span />
            <div className="flex">
              {campaigns.map((c) => (
                <span key={c} className="flex-1 border-l border-border pl-2 text-xs font-medium text-fg first:border-l-0 first:pl-0">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <ol className="relative mt-1">
            {PHASES.map((p, i) => {
              const a = monthPos(p.from);
              const b = monthPos(p.to, true);
              return (
                <li key={p.id} className="grid grid-cols-[11rem_minmax(0,1fr)] items-center gap-3 border-t border-[color-mix(in_oklab,var(--border)_70%,transparent)] py-2">
                  <span className="truncate text-sm font-medium text-fg">{p.name.split(' · ')[0]}</span>
                  <div className="relative h-7">
                    <div aria-hidden className="absolute inset-0 flex overflow-hidden rounded-xs">
                      {months.map((m, k) => (
                        <span key={k} className="h-full flex-1" style={{ background: m >= 10 || m === 1 ? 'color-mix(in oklab, var(--world) 16%, var(--surface))' : 'color-mix(in oklab, var(--world) 4%, var(--surface))' }} />
                      ))}
                    </div>
                    <motion.div
                      className={cn('absolute top-1/2 flex h-4 -translate-y-1/2 items-center rounded-xs px-2', p.id === 'f3' ? 'border border-accent bg-accent-soft' : 'bg-accent')}
                      style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%`, transformOrigin: 'left center' }}
                      initial={reduce ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: EASE_OUT }}
                    />
                    <span className="sr-only">
                      {p.name}: {p.window}
                    </span>
                  </div>
                </li>
              );
            })}
            <li aria-hidden className="pointer-events-none absolute inset-y-0 left-[calc(11rem+0.75rem)] right-0">
              <span className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-fg" style={{ left: `${todayPos * 100}%` }} />
            </li>
          </ol>
          <div className="grid grid-cols-[11rem_minmax(0,1fr)] gap-3 pt-1" aria-hidden>
            <span />
            <div className="relative flex">
              {months.map((m, k) => (
                <span key={k} className={cn('flex-1 text-center font-mono text-[11px] text-muted', k % 3 !== 0 && 'invisible')}>
                  {MONTHS_SHORT[m - 1]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted" data-world="azeite">
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: 'color-mix(in oklab, var(--world) 16%, var(--surface))' }} />
          Colheita e extração do azeite (out.–jan.)
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-2.5 w-5 rounded-[2px] bg-accent" />
          Janela indicativa da fase
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-0.5 bg-fg" />
          Hoje, {fmtDate(TODAY_DATE)}
        </li>
      </ul>
    </figure>
  );
}

function Gate({ phase, st }: { phase: Phase; st: PlanoState }) {
  if (!phase.gate) return null;
  const linked = phase.gate.criteria.filter((c) => c.actionIds);
  const met = linked.filter((c) => c.actionIds!.every((id) => st.status[id] === 'concluido')).length;
  const measured = phase.gate.criteria.length - linked.length;
  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-fg">{phase.gate.title}</p>
        {linked.length > 0 ? (
          <StatusPill tone={met === linked.length ? 'ok' : 'warn'} label={met === linked.length ? 'Pronto para decidir' : `${num(met)} de ${num(linked.length)} critérios cumpridos`} />
        ) : (
          <StatusPill tone="neutral" label={`${plural(measured, 'critério', 'critérios')} a medir`} />
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {phase.gate.criteria.map((c) => {
          const ok = c.actionIds ? c.actionIds.every((id) => st.status[id] === 'concluido') : false;
          return (
            <li key={c.text} className="flex items-start gap-2 text-sm">
              {c.actionIds ? <StatusIcon s={ok ? 'concluido' : aggregate(c.actionIds, st)} className="mt-0.5" /> : <CircleDashed aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} />}
              <span className={cn(ok ? 'text-muted' : 'text-fg')}>
                {c.text}
                {c.actionIds && <span className="text-muted"> · {c.actionIds.map((id) => id.replace('ai-', 'ação ')).join(', ')}</span>}
                {!c.actionIds && <span className="text-muted"> · medido no piloto</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ registo de decisões */

function DecisionForm() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [status, setStatus] = useState<Decision['status']>('decidida');
  const [tried, setTried] = useState(false);
  const error = tried && title.trim().length < 8 ? 'Escreve a decisão numa frase (mínimo 8 caracteres).' : undefined;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (title.trim().length < 8) return;
    planoActions.addDecision({ title: title.trim(), context: context.trim(), status });
    toast({ tone: 'accent', title: 'Decisão registada', description: title.trim() });
    setTitle('');
    setContext('');
    setStatus('decidida');
    setTried(false);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label="Decisão" required error={error}>
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: PSP escolhido para o piloto" />}
      </Field>
      <Field label="Contexto" hint="Porquê, alternativas e o que muda.">
        {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} value={context} onChange={(e) => setContext(e.target.value)} className="min-h-24" />}
      </Field>
      <Field label="Estado">
        {({ id }) => (
          <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as Decision['status'])}>
            {(['decidida', 'proposta', 'em-aberto', 'revogada'] as const).map((s) => (
              <option key={s} value={s}>
                {DECISION_STATUS[s].label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div>
        <Button type="submit">Registar decisão</Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------ página */

const NAV = [
  { id: 'responsaveis', label: 'Responsáveis' },
  { id: 'prioridade-zero', label: 'Prioridade zero' },
  { id: 'roteiro', label: 'Roteiro' },
  { id: 'decisao-produto', label: 'Decisão de produto' },
  { id: 'ambito', label: 'Âmbito do piloto' },
  { id: 'entregaveis', label: 'Entregáveis' },
  { id: 'decisoes', label: 'Registo de decisões' },
];

export default function PlanoPage() {
  const st = usePlano();
  const counts = Object.fromEntries(ITEM_STATUSES.map((s) => [s, ACTION_ITEMS.filter((a) => st.status[a.id] === s).length])) as Record<ItemStatus, number>;
  const tbd = ACTION_ITEMS.filter((a) => a.due === 'TBD').length;

  const deliverableCols: Column<ExecutionPlanRow>[] = [
    { key: 'resp', header: 'Responsável', minWidth: 150, render: (r) => <span className="font-medium text-fg">{r.responsavel === 'Tesouraria' ? 'Tesouraria (a designar)' : r.responsavel}</span> },
    { key: 'area', header: 'Área', minWidth: 150, render: (r) => r.area },
    {
      key: 'entregaveis',
      header: 'Entregáveis',
      minWidth: 300,
      render: (r) => (
        <ul className="list-disc space-y-0.5 pl-4">
          {r.entregaveis.split(';').map((e) => (
            <li key={e}>{e.trim()}</li>
          ))}
        </ul>
      ),
    },
    { key: 'foco', header: 'Foco', minWidth: 160, render: (r) => r.foco },
    {
      key: 'progresso',
      header: 'Ações concluídas',
      align: 'right',
      mono: true,
      render: (r) => {
        const ids = itemsOf(r.responsavel).map((i) => i.id);
        return `${num(doneCount(ids, st))} / ${num(ids.length)}`;
      },
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Plano de execução"
        description="Próximos passos e responsáveis, tal como saíram da reunião de 13/10. O estado de cada ação é editável nesta sessão."
        meta={
          <>
            <Badge tone="neutral">Fonte: resumo da reunião de 13/10 · alinhamento 14h45–16h</Badge>
            <Badge tone="warn">{plural(tbd, 'ação sem prazo', 'ações sem prazo')} (TBD)</Badge>
          </>
        }
      />

      <div className="mb-8 rounded-md border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="text-fg">
            <span className="text-[1.375rem] font-semibold pnum">{num(counts.concluido)}</span> <span className="text-muted">de {num(ACTION_ITEMS.length)} ações concluídas</span>
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {ITEM_STATUSES.map((s) => (
              <li key={s} className="inline-flex items-center gap-1.5">
                <StatusIcon s={s} />
                {ITEM_STATUS_LABEL[s]} <span className="font-mono text-fg tnum">{num(counts[s])}</span>
              </li>
            ))}
          </ul>
        </div>
        <ol className="mt-3 grid grid-cols-12 gap-1" aria-label="Estado das 12 ações">
          {ACTION_ITEMS.map((a) => {
            const s = st.status[a.id];
            return (
              <li
                key={a.id}
                title={`${a.ownerLabel}: ${a.text} (${ITEM_STATUS_LABEL[s]})`}
                className={cn(
                  'h-2.5 rounded-xs transition-colors duration-200',
                  s === 'concluido' && 'bg-ok',
                  s === 'em-curso' && 'bg-info',
                  s === 'bloqueado' && 'bg-crit',
                  s === 'por-iniciar' && 'bg-surface-2 shadow-[inset_0_0_0_1px_var(--border)]',
                )}
              >
                <span className="sr-only">
                  {a.text}: {ITEM_STATUS_LABEL[s]}
                </span>
              </li>
            );
          })}
        </ol>
        <nav aria-label="Nesta página" className="mt-4 flex flex-wrap gap-x-1 gap-y-1 border-t border-border pt-3">
          {NAV.map((n) => (
            <Link key={n.id} to={`/plano#${n.id}`} className="inline-flex min-h-11 items-center rounded-sm px-2 text-sm font-medium text-accent hover:bg-surface-2">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      <section id="responsaveis" aria-labelledby="responsaveis-t" className="scroll-mt-20">
        <h2 id="responsaveis-t" className="text-[1.375rem] leading-tight">
          Responsáveis e próximos passos
        </h2>
        <p className="measure mt-1 text-muted">As 12 ações do documento, com o texto exato, agrupadas por responsável. Prazo de todas: TBD.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {EXECUTION_PLAN.map((row) => (
            <OwnerLane key={row.responsavel} row={row} st={st} />
          ))}
        </div>
      </section>

      <section id="prioridade-zero" aria-labelledby="pz-t" className="mt-12 scroll-mt-20">
        <h2 id="pz-t" className="text-[1.375rem] leading-tight">
          Prioridade zero
        </h2>
        <p className="measure mt-1 text-muted">Mecanismos de bloqueio e regulação que travam tudo o resto. O estado vem das ações que os resolvem.</p>
        <ol className="mt-4 divide-y divide-border rounded-md border border-border bg-surface">
          {PRIORITY_ZERO.map((p) => {
            const agg = aggregate(p.actionIds, st);
            const done = doneCount(p.actionIds, st);
            return (
              <li key={p.id} className="grid gap-x-8 gap-y-3 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_14rem]">
                <div className="min-w-0">
                  <h3 className="text-[1.0625rem] leading-tight">{p.title}</h3>
                  <p className="mt-1.5 text-[0.9375rem] text-fg">{p.goal}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted">Mecanismo de bloqueio</p>
                  <p className="mt-0.5 text-[0.9375rem] text-fg">{p.blocker}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {p.actionIds.map((id) => {
                      const a = ACTION_ITEMS.find((x) => x.id === id)!;
                      return (
                        <li key={id} className="flex items-start gap-2">
                          <StatusIcon s={st.status[id]} className="mt-0.5" />
                          <span className="text-muted">
                            <span className="text-fg">{a.owner === 'Tesouraria' ? 'Tesouraria' : a.owner}:</span> {a.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <StatusPill tone={agg === 'concluido' ? 'ok' : agg === 'bloqueado' ? 'crit' : agg === 'em-curso' ? 'info' : 'warn'} label={agg === 'concluido' ? 'Desbloqueado' : agg === 'por-iniciar' ? 'Bloqueante · por iniciar' : `Bloqueante · ${ITEM_STATUS_LABEL[agg].toLowerCase()}`} />
                  <Meter className="w-full" size="sm" value={done / p.actionIds.length} label="Ações concluídas" valueLabel={`${num(done)} de ${num(p.actionIds.length)}`} tone={agg === 'concluido' ? 'ok' : 'accent'} />
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="roteiro" aria-labelledby="roteiro-t" className="mt-12 scroll-mt-20">
        <h2 id="roteiro-t" className="text-[1.375rem] leading-tight">
          Roteiro por fases
        </h2>
        <p className="measure mt-1 text-muted">Cada fase sobre o calendário agrícola, com o go/no-go que a fecha. As janelas são indicativas: as datas dependem das ações, todas ainda TBD.</p>
        <Card className="mt-4">
          <PhaseCalendar />
        </Card>
        <ol className="mt-6 grid gap-6 lg:grid-cols-2">
          {PHASES.map((p) => (
            <li key={p.id} className="min-w-0">
              <Card as="article" className="h-full">
                <h3 className="text-[1.0625rem] leading-tight">{p.name}</h3>
                <p className="mt-0.5 font-mono text-sm text-muted tnum">{p.window}</p>
                <p className="mt-2 text-[0.9375rem] text-fg">{p.summary}</p>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted">
                  {p.scope.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <Gate phase={p} st={st} />
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section id="decisao-produto" aria-labelledby="dp-t" className="mt-12 scroll-mt-20">
        <h2 id="dp-t" className="text-[1.375rem] leading-tight">
          Decisão de produto: gamificação e seriedade financeira
        </h2>
        <p className="measure mt-1 text-muted">A diretriz aprovada na reunião e a posição atual dos fundadores. A segunda não revoga a primeira: dá-lhe forma.</p>
        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="ok" label="Em vigor" />
            <span className="text-sm text-muted">Atualizada depois da reunião de 13/10</span>
          </div>
          <div className="mt-4 grid gap-8 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="text-[1rem]">Diretriz aprovada a 13/10</h3>
              <dl className="mt-2 space-y-2 text-[0.9375rem]">
                <div>
                  <dt className="text-sm text-muted">Tese</dt>
                  <dd className="text-fg">{DIRECTIVE_2026_10_13.tese}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Antítese</dt>
                  <dd className="text-fg">{DIRECTIVE_2026_10_13.antitese}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Síntese</dt>
                  <dd className="text-fg">{DIRECTIVE_2026_10_13.sintese}</dd>
                </div>
              </dl>
            </div>
            <div className="min-w-0">
              <h3 className="text-[1rem]">Posição atual dos fundadores</h3>
              <ul className="mt-2 space-y-2">
                {FOUNDERS_QUOTES.map((q) => (
                  <li key={q} className="flex items-start gap-2 text-[0.9375rem] text-fg">
                    <Quote aria-hidden className="mt-1 size-3.5 shrink-0 text-muted" strokeWidth={1.75} />
                    <q className="italic">{q}</q>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.9375rem] text-fg">
                Uma app de investimento gamificada à volta do conhecimento, da colheita física e de um simulador com dinheiro fictício. Zero gamificação dos retornos reais.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-8 border-t border-border pt-5 lg:grid-cols-2">
            <div>
              <h3 className="text-[1rem]">O jogo vive aqui</h3>
              <ul className="mt-2 space-y-2">
                {ALLOWED.map((a) => (
                  <li key={a.title} className="flex items-start gap-2 text-[0.9375rem]">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-ok-ink" strokeWidth={2.25} />
                    <span>
                      <span className="font-medium text-fg">{a.title}.</span> <span className="text-muted">{a.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[1rem]">Nunca com dinheiro real</h3>
              <ul className="mt-2 space-y-2">
                {FORBIDDEN.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[0.9375rem] text-fg">
                    <Ban aria-hidden className="mt-1 size-4 shrink-0 text-crit-ink" strokeWidth={1.75} />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">Todas as vistas com dinheiro real levam nota de capital em risco e linguagem neutra: "liquidação prevista", "montante financiado".</p>
            </div>
          </div>
          <p className="mt-5 flex flex-wrap gap-x-4 border-t border-border pt-4 text-sm">
            <Link to="/bastidores?sec=compliance" className="inline-flex min-h-11 items-center gap-1 font-medium text-accent hover:underline">
              Controlo da gamificação em Compliance <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
            </Link>
            <Link to="/bastidores?sec=revisao" className="inline-flex min-h-11 items-center gap-1 font-medium text-accent hover:underline">
              Padrões adotados e rejeitados <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
            </Link>
          </p>
        </Card>
      </section>

      <section id="ambito" aria-labelledby="ambito-t" className="mt-12 scroll-mt-20">
        <h2 id="ambito-t" className="text-[1.375rem] leading-tight">
          Âmbito do piloto fechado
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Card>
            <CardHeader title="Dentro" level={3} />
            <dl className="divide-y divide-border">
              {PILOT_SCOPE.inScope.map((s) => (
                <div key={s.label} className="grid gap-x-4 gap-y-0.5 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)]">
                  <dt className="font-medium text-fg">{s.label}</dt>
                  <dd className="text-[0.9375rem] text-muted">{s.text}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardHeader title="Fora, por agora" level={3} />
            <ul className="space-y-2.5">
              {PILOT_SCOPE.outOfScope.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[0.9375rem] text-fg">
                  <Ban aria-hidden className="mt-1 size-4 shrink-0 text-muted" strokeWidth={1.75} />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section id="entregaveis" aria-labelledby="entregaveis-t" className="mt-12 scroll-mt-20">
        <h2 id="entregaveis-t" className="text-[1.375rem] leading-tight">
          Entregáveis de ativação do piloto
        </h2>
        <p className="measure mt-1 text-muted">A tabela do painel-resumo do documento, com o progresso das ações de cada responsável.</p>
        <DataTable className="mt-4" columns={deliverableCols} rows={EXECUTION_PLAN} getRowId={(r) => r.responsavel} caption="Entregáveis de ativação do piloto por responsável" dense={false} />
      </section>

      <section id="decisoes" aria-labelledby="decisoes-t" className="mt-12 scroll-mt-20">
        <h2 id="decisoes-t" className="text-[1.375rem] leading-tight">
          Registo de decisões
        </h2>
        <p className="measure mt-1 text-muted">O que ficou decidido, o que está proposto e o que continua em aberto, mais recente primeiro.</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <ol className="divide-y divide-border rounded-md border border-border bg-surface">
            {st.decisions.map((d) => (
              <li key={d.id} className="p-4 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-muted tnum">{d.session ? dateTime(d.date) : fmtDate(d.date)}</span>
                  <StatusPill tone={DECISION_STATUS[d.status].tone} label={DECISION_STATUS[d.status].label} />
                  {d.session && <Badge tone="accent">nesta sessão</Badge>}
                </div>
                <p className="mt-1.5 font-medium text-fg">{d.title}</p>
                {d.context && <p className="mt-0.5 text-sm text-muted">{d.context}</p>}
                <p className="mt-1 text-xs text-muted">{d.origin}</p>
              </li>
            ))}
          </ol>
          <Card className="self-start">
            <CardHeader title="Registar uma decisão" level={3} description="Fica no registo desta sessão, com data e hora." />
            <DecisionForm />
          </Card>
        </div>
      </section>

      <p className="mt-12 text-sm text-muted">
        Documento-fonte: <span className="text-fg">{SOURCE_DOC.title}</span> ({SOURCE_DOC.path}).
      </p>
    </Page>
  );
}
