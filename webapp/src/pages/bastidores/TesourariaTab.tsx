import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CircleCheck, Landmark, LoaderCircle, Play } from 'lucide-react';
import { ILLUSTRATIVE_LABEL, RECONCILIATION, TRANSACTIONS, type Transaction } from '../../data';
import { Badge, Button, Card, CardHeader, DataTable, Drawer, KeyValue, RadioGroup, SegmentedControl, StatusPill, type Column } from '../../components/ui';
import { useData, useToast } from '../../state';
import { GameContext } from '../../state/AppProvider';
import { TODAY_DATE } from '../../lib/clock';
import { date as fmtDate, dateTime, eur, lisbonParts, num, plural, time } from '../../lib/format';
import { recon } from './metrics';
import { HeaderRow, ReconStrip, Row, signedEur, type StripDay } from './parts';
import { actions, APPROVERS, useBastidores, type Approver } from './store';
import {
  approvalsNeeded,
  approvalsOf,
  canApprove,
  clientBalanceNow,
  DOUBLE_APPROVAL_LIMIT,
  lastClose,
  OPERATING,
  payouts,
  payoutStatus,
  pendingReceipts,
  PSP_NAME,
  todayEntries,
  type Payout,
} from './treasury';

/* =====================================================================
   Tesouraria: conta de clientes segregada no PSP vs. conta operacional,
   reconciliação diária, quebras, pagamentos com dupla aprovação e as
   políticas que protegem o ciclo (sem numerário, só rails UE).
   ===================================================================== */

const TX_LABEL: Record<Transaction['type'], string> = {
  'entrada-investidor': 'Entrada de investidor',
  'pagamento-produtor': 'Pagamento a produtor',
  'recebimento-comprador': 'Recebimento de comprador',
  'liquidacao-investidor': 'Liquidação a investidores',
  'custo-operacional': 'Custo operacional',
  cobertura: 'Cobertura',
};

type TxFilter = 'todos' | 'entradas' | 'recebimentos' | 'custos';
const TX_FILTER: Record<TxFilter, (t: Transaction) => boolean> = {
  todos: () => true,
  entradas: (t) => t.type === 'entrada-investidor',
  recebimentos: (t) => t.type === 'recebimento-comprador',
  custos: (t) => t.type === 'custo-operacional' || t.type === 'cobertura',
};

const STEPS = ['A importar o extrato do PSP (camt.053)…', 'A casar movimentos com o razão…', 'A comparar saldos…'];

function ReconCard() {
  const st = useBastidores();
  const { toast } = useToast();
  const [selected, setSelected] = useState(TODAY_DATE);
  const [step, setStep] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const days: StripDay[] = [
    ...recon.days.map((r) => {
      const wd = new Date(`${r.date}T12:00:00Z`).getUTCDay();
      return { date: r.date, status: r.status, difference: r.difference, weekend: wd === 0 || wd === 6 };
    }),
    { date: TODAY_DATE, status: st.recon ? 'conciliado' : 'por-executar', difference: 0, weekend: false },
  ];

  const run = () => {
    setStep(0);
    setSelected(TODAY_DATE);
    timers.current = [
      window.setTimeout(() => setStep(1), 450),
      window.setTimeout(() => setStep(2), 900),
      window.setTimeout(() => {
        actions.runRecon({ date: TODAY_DATE, psp: clientBalanceNow, ledger: clientBalanceNow, matched: todayEntries.length });
        setStep(null);
        toast({ tone: 'ok', title: 'Reconciliação de 13/10 fechada', description: `Saldo no PSP igual ao razão: ${eur(clientBalanceNow)}. Diferença 0,00 €.` });
      }, 1400),
    ];
  };

  const sel = RECONCILIATION.find((r) => r.date === selected);
  const isToday = selected === TODAY_DATE;

  return (
    <Card>
      <HeaderRow
        title="Reconciliação diária"
        description={`Saldo da conta de clientes no ${PSP_NAME} contra o razão interno, todos os dias até às 20:00. Os fechos dos últimos 30 dias são ${ILLUSTRATIVE_LABEL.toLowerCase()}.`}
        actions={
          st.recon ? (
            <Badge tone="ok" icon={<CircleCheck aria-hidden className="size-3.5" strokeWidth={2} />}>
              Hoje conciliado às {time(st.recon.at)}
            </Badge>
          ) : (
            <Button onClick={run} loading={step !== null} iconLeft={<Play aria-hidden className="size-4" strokeWidth={1.75} />}>
              {step !== null ? 'A reconciliar' : 'Executar reconciliação'}
            </Button>
          )
        }
      />
      <p className="sr-only" aria-live="polite">
        {step !== null ? STEPS[step] : st.recon ? 'Reconciliação de hoje concluída.' : ''}
      </p>
      <ReconStrip days={days} selected={selected} onSelect={setSelected} />
      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-3 font-medium text-fg">
          {fmtDate(selected)}
          {isToday && ' · hoje'}
        </p>
        {isToday ? (
          step !== null ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={1.75} />
              {STEPS[step]}
            </p>
          ) : st.recon ? (
            <KeyValue
              columns={4}
              dense
              items={[
                { label: 'Saldo no PSP', value: eur(st.recon.psp, { decimals: 2 }), mono: true },
                { label: 'Saldo no razão', value: eur(st.recon.ledger, { decimals: 2 }), mono: true },
                { label: 'Diferença', value: eur(0, { decimals: 2 }), mono: true },
                { label: 'Movimentos casados', value: num(st.recon.matched), mono: true, hint: `fechado às ${time(st.recon.at)}` },
              ]}
            />
          ) : (
            <p className="text-sm text-muted">
              Por executar. Movimentos de hoje já no extrato: {todayEntries.map((t) => `${eur(t.amount)} de ${t.counterparty} (${t.rail})`).join('; ')}.
            </p>
          )
        ) : sel ? (
          <>
            <KeyValue
              columns={4}
              dense
              items={[
                { label: 'Saldo no PSP', value: eur(sel.pspBalance, { decimals: 2 }), mono: true },
                { label: 'Saldo no razão', value: eur(sel.ledgerBalance, { decimals: 2 }), mono: true },
                { label: 'Diferença', value: signedEur(sel.difference, 2), mono: true },
                { label: 'Fecho', value: time(sel.closedAt), mono: true, hint: sel.status === 'conciliado' ? 'conciliado' : 'diferença resolvida' },
              ]}
            />
            {sel.note && <p className="max-w-[60ch] mt-3 text-sm text-muted">{sel.note}</p>}
          </>
        ) : null}
      </div>
    </Card>
  );
}

function ApproveDrawer({ payout, onClose }: { payout: Payout | null; onClose: () => void }) {
  const st = useBastidores();
  const { toast } = useToast();
  const [by, setBy] = useState<Approver | undefined>();
  const list = payout ? approvalsOf(payout, st) : [];
  const check = payout && by ? canApprove(payout, st, by) : { ok: false, reason: 'Escolhe a função que aprova.' };
  const close = () => {
    setBy(undefined);
    onClose();
  };
  return (
    <Drawer
      open={payout !== null}
      onClose={close}
      title={payout ? `Aprovar ${payout.kind === 'liquidacao' ? 'liquidação' : 'pagamento ao produtor'} · ${payout.lotId}` : ''}
      description={payout ? `${eur(payout.amount)} para ${payout.counterparty}` : undefined}
      footer={
        payout && (
          <div className="flex flex-col gap-2">
            {!check.ok && by && <p className="text-sm text-warn-ink">{check.reason}</p>}
            <Button
              disabled={!check.ok}
              onClick={() => {
                if (!payout || !by) return;
                actions.approve(payout.id, by);
                const after = approvalsOf(payout, st).length + 1;
                const need = approvalsNeeded(payout);
                toast({
                  tone: 'ok',
                  title: after >= need ? `${payout.lotId}: pagamento aprovado` : `${payout.lotId}: 1.ª aprovação registada`,
                  description: after >= need ? payout.condition : 'Falta a aprovação de outra função.',
                });
                close();
              }}
            >
              Registar aprovação
            </Button>
          </div>
        )
      }
    >
      {payout && (
        <div className="flex flex-col gap-5">
          <dl className="divide-y divide-border">
            <Row label="Montante" value={eur(payout.amount)} />
            <Row label="Data prevista" value={payout.due ? fmtDate(payout.due) : 'depois do fecho'} />
            <Row label="Rail" value="SEPA via PSP" />
            <Row label="Aprovações" value={`${num(list.length)} de ${num(approvalsNeeded(payout))}`} hint={payout.amount > DOUBLE_APPROVAL_LIMIT ? `Acima de ${eur(DOUBLE_APPROVAL_LIMIT)}: duas aprovações de funções diferentes.` : `Até ${eur(DOUBLE_APPROVAL_LIMIT)}: uma aprovação.`} />
          </dl>
          <p className="text-sm text-muted">{payout.condition}</p>
          {list.length > 0 && (
            <ul className="text-sm text-muted">
              {list.map((a) => (
                <li key={a.at}>
                  <CircleCheck aria-hidden className="mr-1.5 inline size-3.5 text-ok-ink" strokeWidth={2} />
                  {a.by} aprovou às {time(a.at)}
                </li>
              ))}
            </ul>
          )}
          <RadioGroup<Approver>
            legend="Aprovar como"
            name="aprovador"
            value={by}
            onChange={setBy}
            options={APPROVERS.map((a) => {
              const done = list.some((x) => x.by === a);
              return { value: a, label: a, description: done ? 'Já aprovou este pagamento.' : undefined, disabled: done };
            })}
          />
        </div>
      )}
    </Drawer>
  );
}

export default function TesourariaTab() {
  const { lots } = useData();
  const st = useBastidores();
  const game = useContext(GameContext);
  const [txFilter, setTxFilter] = useState<TxFilter>('todos');
  const [approving, setApproving] = useState<Payout | null>(null);

  const list = useMemo(() => payouts(lots), [lots]);
  const sessionCommits = game ? [...game.state.profiles.demo.commitments, ...game.state.profiles.visitante.commitments] : [];

  const payoutCols: Column<Payout>[] = [
    {
      key: 'tipo',
      header: 'Pagamento',
      minWidth: 220,
      render: (p) => (
        <div>
          <div className="font-medium text-fg">{p.kind === 'liquidacao' ? 'Liquidação aos cofinanciadores' : 'Pagamento ao produtor'}</div>
          <div className="text-sm text-muted">
            <Link to={`/lote/${p.lotId}`} className="font-mono text-accent underline-offset-[0.2em] hover:underline tnum">
              {p.lotId}
            </Link>{' '}
            · {p.counterparty}
          </div>
        </div>
      ),
    },
    { key: 'montante', header: 'Montante', align: 'right', mono: true, className: 'whitespace-nowrap', sortValue: (p) => p.amount, render: (p) => <span>{p.kind === 'liquidacao' ? '≈ ' : ''}{eur(p.amount)}</span> },
    { key: 'data', header: 'Data prevista', align: 'right', mono: true, sortValue: (p) => p.due ?? '9999', render: (p) => (p.due ? fmtDate(p.due) : '—') },
    {
      key: 'aprov',
      header: 'Aprovações',
      align: 'right',
      mono: true,
      render: (p) => (
        <span title={approvalsOf(p, st).map((a) => a.by).join(', ')}>
          {num(approvalsOf(p, st).length)} / {num(approvalsNeeded(p))}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      minWidth: 170,
      render: (p) => {
        const s = payoutStatus(p, st);
        return (
          <div>
            <StatusPill tone={s.tone} label={s.label} />
            {!p.ready && <p className="mt-1 text-xs text-muted">{p.notReadyReason}</p>}
          </div>
        );
      },
    },
    {
      key: 'acao',
      header: 'Ação',
      srHeader: true,
      align: 'right',
      render: (p) => {
        const s = payoutStatus(p, st);
        if (s.id === 'aprovado') return <span className="text-sm text-muted">Aprovado</span>;
        if (!p.ready)
          return (
            <span className="text-sm text-muted" title="Sem ação até ao fecho do financiamento">
              —<span className="sr-only">Sem ação até ao fecho do financiamento</span>
            </span>
          );
        return (
          <Button size="sm" variant="secondary" onClick={() => setApproving(p)}>
            {s.id === 'falta-segunda' ? 'Segunda aprovação' : 'Aprovar'}
          </Button>
        );
      },
    },
  ];

  const breakCols: Column<(typeof recon.breaks)[number]>[] = [
    { key: 'data', header: 'Dia', mono: true, sortValue: (r) => r.date, render: (r) => fmtDate(r.date) },
    { key: 'psp', header: 'PSP', align: 'right', mono: true, render: (r) => eur(r.pspBalance, { decimals: 2 }) },
    { key: 'razao', header: 'Razão', align: 'right', mono: true, render: (r) => eur(r.ledgerBalance, { decimals: 2 }) },
    { key: 'dif', header: 'Diferença', align: 'right', mono: true, sortValue: (r) => r.difference, render: (r) => signedEur(r.difference, 2) },
    { key: 'estado', header: 'Estado', render: (r) => <StatusPill tone={r.status === 'em-aberto' ? 'crit' : 'ok'} label={r.status === 'em-aberto' ? 'Em aberto' : 'Resolvida'} /> },
    { key: 'nota', header: 'Causa e resolução', minWidth: 320, render: (r) => <span className="text-muted">{r.note}</span> },
  ];

  const txs = TRANSACTIONS.filter(TX_FILTER[txFilter]).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const txCols: Column<Transaction>[] = [
    { key: 'data', header: 'Data', mono: true, className: 'whitespace-nowrap', sortValue: (t) => t.date, render: (t) => fmtDate(t.date) },
    { key: 'tipo', header: 'Tipo', className: 'whitespace-nowrap', sortValue: (t) => t.type, render: (t) => TX_LABEL[t.type] },
    { key: 'contraparte', header: 'Contraparte', minWidth: 220, render: (t) => t.counterparty },
    { key: 'lote', header: 'Lote', mono: true, render: (t) => (t.lotId ? <Link to={`/lote/${t.lotId}`} className="text-accent hover:underline">{t.lotId}</Link> : '—') },
    { key: 'montante', header: 'Montante', align: 'right', mono: true, sortValue: (t) => t.amount, render: (t) => signedEur(t.amount, Number.isInteger(t.amount) ? 0 : 2) },
    { key: 'rail', header: 'Rail', render: (t) => t.rail },
    { key: 'estado', header: 'Estado', render: (t) => <StatusPill tone={t.status === 'liquidada' ? 'ok' : 'info'} label={t.status === 'liquidada' ? 'Liquidada' : t.status === 'pendente' ? 'Pendente' : 'Em trânsito'} /> },
  ];

  const sepa = TRANSACTIONS.filter((t) => t.rail === 'SEPA').length;
  const instant = TRANSACTIONS.filter((t) => t.rail === 'SEPA Instant').length;
  const onTime = RECONCILIATION.filter((r) => lisbonParts(r.closedAt).hour < 20).length;
  const doubles = list.filter((p) => approvalsNeeded(p) === 2).length;

  const policies = [
    { title: 'Sem numerário nem cash-in-transit', evidence: `${num(TRANSACTIONS.length)} movimentos desde 01/09: ${num(sepa)} por SEPA, ${num(instant)} por SEPA Instant, nenhum em numerário.` },
    { title: 'Contas segregadas', evidence: 'O dinheiro de investidores e compradores só entra na conta de clientes no PSP. A conta operacional nunca recebe transferências de investidores.' },
    { title: 'Reconciliação diária até às 20:00', evidence: `${num(onTime)} de ${num(RECONCILIATION.length)} fechos dentro do prazo nos últimos 30 dias.` },
    { title: `Dupla aprovação acima de ${eur(DOUBLE_APPROVAL_LIMIT)}`, evidence: `${plural(doubles, 'pagamento programado precisa', 'pagamentos programados precisam')} de duas funções diferentes.` },
    { title: 'Produtores pagos em D+2 úteis', evidence: 'Contados a partir do fecho do financiamento do lote; nunca adiantados antes do fecho. O limite legal é de 30 dias (DL 118/2010).' },
    { title: 'Só rails e jurisdição UE', evidence: 'PSP e banco de liquidação na UE. Nada de custódia em jurisdições sem ponte bancária europeia, para não haver capital retido na repatriação.' },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Card as="article">
          <div className="flex items-start gap-3">
            <Landmark aria-hidden className="mt-1 size-5 shrink-0 text-accent" strokeWidth={1.75} />
            <div className="min-w-0">
              <h2 className="text-[1.0625rem] leading-tight sm:text-[1.1875rem]">Conta de clientes segregada</h2>
              <p className="mt-0.5 text-sm text-muted">{PSP_NAME} · IBAN terminado em 4471</p>
            </div>
          </div>
          <p className="mt-4 text-[1.75rem] font-semibold leading-tight text-fg pnum">{eur(clientBalanceNow)}</p>
          <p className="text-sm text-muted">
            fecho de {fmtDate(lastClose.date)}: {eur(lastClose.pspBalance)} + {eur(todayEntries.reduce((s, t) => s + t.amount, 0))} recebidos hoje
          </p>
          <dl className="mt-4 divide-y divide-border border-t border-border">
            {pendingReceipts.map((t) => (
              <Row key={t.id} label={`A receber · ${t.lotId} · ${t.counterparty}`} value={eur(t.amount)} />
            ))}
            {sessionCommits.map((c) => (
              <Row key={c.id} label={`Compromisso de hoje · ${c.lotId} · aguarda transferência SEPA`} value={eur(c.amount)} hint={`Registado às ${time(c.committedAt)}. Só conta no saldo quando o PSP creditar.`} />
            ))}
          </dl>
        </Card>
        <Card as="article">
          <div className="flex items-start gap-3">
            <Building2 aria-hidden className="mt-1 size-5 shrink-0 text-muted" strokeWidth={1.75} />
            <div className="min-w-0">
              <h2 className="text-[1.0625rem] leading-tight sm:text-[1.1875rem]">Conta operacional Sprout</h2>
              <p className="mt-0.5 text-sm text-muted">Banco de liquidação na UE · separada da conta de clientes</p>
            </div>
          </div>
          <p className="mt-4 text-[1.75rem] font-semibold leading-tight text-fg pnum">{eur(OPERATING.balance)}</p>
          <p className="text-sm text-muted">saldo ilustrativo de {fmtDate(TODAY_DATE)}</p>
          <p className="max-w-[60ch] mt-4 border-t border-border pt-3 text-sm text-muted">{OPERATING.note}</p>
          <p className="max-w-[60ch] mt-2 text-sm text-muted">Transferências da conta de clientes para a operacional só na liquidação de um lote, pela parte da Sprout, com dupla aprovação.</p>
        </Card>
      </div>

      <ReconCard />

      <section aria-labelledby="quebras-t">
        <div className="mb-4">
          <h2 id="quebras-t" className="text-[1.375rem] leading-tight">
            Quebras de reconciliação
          </h2>
          <p className="measure mt-1 text-muted">Diferenças entre o PSP e o razão nos últimos 30 dias, com causa e resolução. {ILLUSTRATIVE_LABEL}.</p>
        </div>
        <DataTable columns={breakCols} rows={recon.breaks} getRowId={(r) => r.date} caption="Quebras de reconciliação nos últimos 30 dias" empty={{ title: 'Sem quebras nos últimos 30 dias' }} />
      </section>

      <section aria-labelledby="pagamentos-t">
        <div className="mb-4">
          <h2 id="pagamentos-t" className="text-[1.375rem] leading-tight">
            Pagamentos programados
          </h2>
          <p className="measure mt-1 text-muted">
            Liquidações a cofinanciadores e pagamentos a produtores. Acima de {eur(DOUBLE_APPROVAL_LIMIT)}, duas aprovações de funções diferentes. As liquidações são estimativas até à última receção do comprador e referem-se a lotes do histórico ilustrativo (dados fictícios).
          </p>
        </div>
        <DataTable columns={payoutCols} rows={list} getRowId={(p) => p.id} caption="Pagamentos programados" />
      </section>

      <Card>
        <CardHeader title="Políticas de tesouraria" description="Regras do piloto e a evidência de que estão a ser cumpridas." />
        <ul className="divide-y divide-border">
          {policies.map((p) => (
            <li key={p.title} className="grid gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0 md:grid-cols-[18rem_minmax(0,1fr)_auto] md:items-baseline">
              <p className="font-medium text-fg">{p.title}</p>
              <p className="text-sm text-muted">{p.evidence}</p>
              <StatusPill tone="ok" label="Em vigor" className="justify-self-start" />
            </li>
          ))}
        </ul>
      </Card>

      <section aria-labelledby="movimentos-t">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="movimentos-t" className="text-[1.375rem] leading-tight">
              Movimentos na conta de clientes
            </h2>
            <p className="measure mt-1 text-muted">Desde 01/09/2026, mais recentes primeiro. Montantes com sinal: entradas positivas, saídas negativas. {ILLUSTRATIVE_LABEL}.</p>
          </div>
          <div className="max-w-full overflow-x-auto pb-1">
            <div className="w-max">
            <SegmentedControl<TxFilter>
              label="Filtrar movimentos"
              size="sm"
              value={txFilter}
              onChange={setTxFilter}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'entradas', label: 'Investidores' },
                { value: 'recebimentos', label: 'Compradores' },
                { value: 'custos', label: 'Custos' },
              ]}
            />
            </div>
          </div>
        </div>
        <DataTable columns={txCols} rows={txs} getRowId={(t) => t.id} caption="Movimentos na conta de clientes" />
        <p className="mt-2 text-sm text-muted">
          Último extrato fechado: {dateTime(lastClose.closedAt)}. Os recebimentos pendentes dos compradores pagam a liquidação dos lotes expedidos.
        </p>
      </section>

      <ApproveDrawer payout={approving} onClose={() => setApproving(null)} />
    </div>
  );
}
