import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronRight, ChevronsRight, FastForward, Undo2 } from 'lucide-react';
import type { Tone } from '../../data/types';
import { Badge, Button, Card, CardHeader, StatusPill } from '../../components/ui';
import { EASE_OUT, LotGauge } from '../../components/game';
import { cn } from '../../lib/cn';
import { pct, price } from '../../lib/format';
import { MAX_MONTH, SEASON_NOTE, WINDOW, calendarMonth, getSimLot, monthLabel, shortName, unitsText } from './deck';
import { simulateFull, type DecisionChoice, type LotSnap, type LotStatus, type MonthState, type SimRun } from './engine';
import { DecisionCard, EndCard, EventCard, FlipIn, NoticeList, QuietMonth, StartCard } from './EventCards';
import { SeasonStrip, SimCalendar } from './SimCalendar';
import { ValueChart } from './ValueChart';
import { fe, fes, fpct, refChange, SimBand } from './parts';

const STATUS: Record<LotStatus, { label: string; tone: Tone }> = {
  'em-stock': { label: 'Em stock', tone: 'neutral' },
  'em-venda': { label: 'Em venda', tone: 'accent' },
  pausa: { label: 'Vendas em pausa', tone: 'warn' },
  extensao: { label: 'Em extensão', tone: 'warn' },
  liquidado: { label: 'Liquidado', tone: 'ok' },
};

export interface PlayProps {
  run: SimRun;
  month: number;
  budget: number;
  onAdvance: (months: number) => void;
  onDecide: (key: string, choice: DecisionChoice) => void;
  onOpenDebrief: () => void;
  onAbandon: () => void;
}

export function PlayPhase({ run, month, budget, onAdvance, onDecide, onOpenDebrief, onAbandon }: PlayProps) {
  const reduce = useReducedMotion();
  const [from, setFrom] = useState(month);
  const stop = run.pending ? run.pending.month : run.end;
  const atStop = month >= stop;
  const finished = atStop && run.complete && !run.pending;
  const state = run.months.find((m) => m.month === month) ?? run.months[0];
  const pendingNow = run.pending && run.pending.month === month ? run.pending : undefined;
  const anyExtended = state.lots.some((l) => l.extended);

  // a mesma campanha sem coberturas (linha de contexto no gráfico)
  const noHedge = useMemo(() => (run.allocations.some((a) => a.hedged) ? simulateFull(run.seed, run.allocations.map((a) => ({ ...a, hedged: false })), run.decisions) : undefined), [run.seed, run.allocations, run.decisions]);

  const advance = (n: number) => {
    setFrom(month);
    onAdvance(n);
  };

  // acontecimentos desde o último avanço (um salto de 6 meses mostra todos)
  const span = run.months.filter((m) => m.month > Math.min(from, month - 1) && m.month <= month);
  const spanEvents = span.flatMap((m) => m.events);
  const spanNotices = span.flatMap((m) => m.notices);
  const jumped = span.length > 1;

  const blockedReason = pendingNow ? 'Decide primeiro a proposta deste mês.' : finished ? 'A campanha terminou.' : undefined;

  return (
    <div className="flex flex-col gap-6 max-md:pb-16">
      {/* ---------------- painel do mês (fixo a partir de 768 px; no telemóvel os controlos vão para baixo) ---------------- */}
      <div className="-mx-4 border-b border-border bg-[color-mix(in_oklab,var(--bg)_96%,transparent)] px-4 py-3 md:sticky md:top-[57px] md:z-10 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <MonthLeaf month={month} reduce={Boolean(reduce)} />
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-[0.9375rem] text-fg">{month === 0 ? 'Lotes financiados. A campanha começa em novembro.' : SEASON_NOTE[calendarMonth(month)]}</p>
            <SimBand compact className="mt-1" />
          </div>
          <div className="ml-auto max-md:hidden">
            <Controls finished={finished} atStop={atStop} blockedReason={blockedReason} onAdvance={advance} onOpenDebrief={onOpenDebrief} />
          </div>
        </div>
        {pendingNow && (
          <p className="mt-2 text-sm font-medium text-warn-ink" role="status">
            Há uma proposta por decidir em {monthLabel(month)}: escolhe uma opção em baixo para continuar.
          </p>
        )}
        <SeasonStrip month={month} extended={anyExtended} className="mt-3" />
        <SimBand compact className="mt-2 md:hidden" />
        <p className="sr-only" aria-live="polite">
          {`Mês ${month}, ${monthLabel(month)}. ${spanEvents.map((e) => e.event.title).join('. ')}${pendingNow ? '. Há uma decisão por tomar.' : ''}${finished ? '. Campanha terminada.' : ''}`}
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg px-4 py-2.5 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm">
            <span className="block font-semibold text-fg">Mês {month} de {WINDOW}</span>
            <span className="block truncate font-mono text-muted tnum">{month === 0 ? 'out. 2026' : monthLabel(month)}</span>
          </p>
          <Controls finished={finished} atStop={atStop} blockedReason={blockedReason} onAdvance={advance} onOpenDebrief={onOpenDebrief} compact />
        </div>
      </div>

      {/* ---------------- este mês + lotes ---------------- */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <section aria-labelledby="mes-title" className="min-w-0">
          <h2 id="mes-title" className="mb-3 text-[1.25rem]">
            {jumped ? `De ${monthLabel(span[0].month)} a ${monthLabel(month)}` : month === 0 ? 'Antes da campanha' : `Este mês: ${monthLabel(month)}`}
          </h2>
          <div className="flex flex-col gap-3">
            {pendingNow && (
              <FlipIn key={`d-${pendingNow.month}-${pendingNow.simLotId}-${pendingNow.kind}`}>
                <DecisionCard pending={pendingNow} run={run} onDecide={(c) => onDecide(`${pendingNow.simLotId}:${pendingNow.kind}`, c)} />
              </FlipIn>
            )}
            {finished && (
              <FlipIn key="fim">
                <EndCard run={run} onOpen={onOpenDebrief} />
              </FlipIn>
            )}
            {month === 0 && <StartCard run={run} />}
            {spanEvents.slice(-4).map((ev, i) => (
              <FlipIn key={ev.key} index={i}>
                <EventCard ev={ev} />
              </FlipIn>
            ))}
            {spanEvents.length > 4 && <p className="text-sm text-muted">E mais {spanEvents.length - 4} acontecimentos neste período, no diário em baixo.</p>}
            {month > 0 && spanEvents.length === 0 && !pendingNow && !finished && (
              <FlipIn key={`q-${month}`}>
                <QuietMonth state={state} />
              </FlipIn>
            )}
            {spanNotices.length > 0 && (
              <div className="rounded-md border border-border bg-surface p-4">
                <h3 className="mb-2 text-[1rem]">Registo da operação</h3>
                <NoticeList notices={spanNotices.slice(-6)} />
              </div>
            )}
          </div>
        </section>

        <LotsPanel state={state} budget={budget} invested={run.invested} />
      </div>

      {/* ---------------- calendário ---------------- */}
      <Card padding="md" aria-labelledby="cal-title">
        <CardHeader
          title={<span id="cal-title">Calendário da campanha</span>}
          description={`Mês ${month} de ${WINDOW}${anyExtended ? ' (com extensão até ao mês 24)' : ''}. Bandas da estação, janela de 18 meses e o que cada lote já vendeu.`}
          actions={
            <Button variant="ghost" size="sm" onClick={onAbandon} iconLeft={<Undo2 aria-hidden className="size-4" strokeWidth={1.75} />}>
              Voltar à preparação
            </Button>
          }
        />
        <SimCalendar run={run} month={month} />
      </Card>

      {/* ---------------- gráfico + diário ---------------- */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <Card padding="md">
          <ValueChart run={run} counterfactual={noHedge} month={month} />
        </Card>
        <Journal run={run} month={month} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ controlos */

function Controls({ finished, atStop, blockedReason, onAdvance, onOpenDebrief, compact }: { finished: boolean; atStop: boolean; blockedReason?: string; onAdvance: (n: number) => void; onOpenDebrief: () => void; compact?: boolean }) {
  if (finished) {
    return (
      <Button size={compact ? 'md' : 'lg'} onClick={onOpenDebrief}>
        Abrir o balanço
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Button size={compact ? 'md' : 'lg'} onClick={() => onAdvance(1)} disabled={atStop} title={blockedReason} iconRight={<ChevronRight aria-hidden className="size-4" strokeWidth={2} />} className="motion-safe:active:scale-[0.98]">
        Avançar mês
      </Button>
      <Button variant="secondary" size={compact ? 'md' : 'lg'} onClick={() => onAdvance(6)} disabled={atStop} title={blockedReason} aria-label="Avançar 6 meses" iconRight={<ChevronsRight aria-hidden className="size-4" strokeWidth={1.75} />} className={compact ? 'px-3' : undefined}>
        {compact ? '6' : 'Avançar 6 meses'}
      </Button>
      {!compact && (
        <Button variant="ghost" size="lg" onClick={() => onAdvance(MAX_MONTH)} disabled={atStop} title={blockedReason} iconLeft={<FastForward aria-hidden className="size-4" strokeWidth={1.75} />} className="max-lg:hidden">
          Até ao fim
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ folha do mês */

function MonthLeaf({ month, reduce }: { month: number; reduce: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-[58px] w-[64px] shrink-0 overflow-hidden rounded-sm border border-border bg-surface" style={{ perspective: 500 }} aria-hidden>
        <div className="h-[18px] bg-rail" />
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={month}
            className="absolute inset-x-0 bottom-0 top-[18px] flex items-center justify-center bg-surface"
            initial={reduce ? { opacity: 0 } : { rotateX: -88, opacity: 0.2 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { rotateX: 70, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
            transition={{ duration: reduce ? 0.12 : 0.38, ease: EASE_OUT }}
            style={{ transformOrigin: 'top center' }}
          >
            <span className="font-display text-[1.75rem] font-bold leading-none text-fg pnum">{month}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="min-w-0">
        <p className="font-display text-[1.25rem] font-semibold leading-tight text-fg">
          Mês {month} <span className="font-sans text-[0.9375rem] font-normal text-muted">de {WINDOW}</span>
        </p>
        <p className="font-mono text-sm text-muted tnum">{month === 0 ? 'out. 2026 · financiamento' : monthLabel(month)}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ lotes */

function LotsPanel({ state, budget, invested }: { state: MonthState; budget: number; invested: number }) {
  const reserveTotal = state.lots.reduce((s, l) => s + l.reserveUsed, 0);
  return (
    <Card padding="md" aria-labelledby="lotes-title">
      <CardHeader title={<span id="lotes-title">Os teus lotes</span>} description="O medidor mostra o stock por vender: esvazia à medida que o lote vende." />
      <ul className="divide-y divide-border">
        {state.lots.map((l) => (
          <LotRow key={l.simLotId} snap={l} />
        ))}
      </ul>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted">Investido</dt>
          <dd className="font-mono text-[0.9375rem] text-fg tnum">{fe(invested)}</dd>
        </div>
        <div>
          <dt className="text-muted">Liquidação estimada</dt>
          <dd className="font-mono text-[0.9375rem] text-fg tnum">{fe(state.value)}</dd>
        </div>
        <div>
          <dt className="text-muted">Resultado estimado</dt>
          <dd className="font-mono text-[0.9375rem] text-fg tnum">{fpct(invested > 0 ? state.value / invested - 1 : 0)}</dd>
        </div>
        <div>
          <dt className="text-muted">Fora da carteira</dt>
          <dd className="font-mono text-[0.9375rem] text-fg tnum">{fe(budget - invested)}</dd>
        </div>
      </dl>
      {reserveTotal > 0.5 && <p className="mt-3 text-sm text-muted">A reserva de primeira perda está a absorver {fe(reserveTotal)} neste momento.</p>}
    </Card>
  );
}

function LotRow({ snap }: { snap: LotSnap }) {
  const lot = getSimLot(snap.simLotId)!;
  const st = STATUS[snap.status];
  const flags: { label: string; tone: Tone }[] = [];
  if (lot.hedge.available) flags.push(snap.hedged ? { label: `Coberto ${pct(lot.hedge.coverage, 0)}`, tone: 'info' } : { label: 'Sem cobertura', tone: 'neutral' });
  if (snap.reserveUsed > 0.5) flags.push({ label: `Reserva: ${fe(snap.reserveUsed)}`, tone: 'neutral' });
  if (snap.downgraded > 0) flags.push({ label: `${pct(snap.downgraded, 0)} desclassificado`, tone: 'warn' });
  if (snap.refunded) flags.push({ label: 'Refunding', tone: 'warn' });
  if (snap.extended) flags.push({ label: `Extensão até ${monthLabel(snap.salesTo)}`, tone: 'warn' });
  if (snap.delayed > 0 && !snap.extended) flags.push({ label: `Vendas +${snap.delayed} meses`, tone: 'neutral' });
  if (snap.premium > 0) flags.push({ label: `Prémio +${pct(snap.premium, 0)}`, tone: 'ok' });
  return (
    <li className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[84px_minmax(0,1fr)]" data-world={lot.world}>
      <LotGauge kind={lot.world} value={snap.rem} size="md" showScale={false} className="w-[64px] sm:w-[84px]" label={`Stock por vender de ${shortName(snap.simLotId)}`} valueText={`${unitsText(lot, snap.units)} de ${unitsText(lot, snap.totalUnits)}`} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <h3 className="min-w-0 text-[1rem] leading-snug">{shortName(snap.simLotId)}</h3>
          <StatusPill label={st.label} tone={st.tone} />
        </div>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm min-[480px]:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-muted">Por vender</dt>
            <dd className="font-mono text-fg tnum">{unitsText(lot, snap.units)}</dd>
            <dd className="font-mono text-muted tnum">de {unitsText(lot, snap.totalUnits)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted">Referência</dt>
            <dd className="font-mono text-fg tnum">{refChange(snap.priceIndex)}</dd>
            <dd className="font-mono text-muted tnum">{price(snap.price, lot.priceUnit)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted">Liquidação estimada</dt>
            <dd className="font-mono text-fg tnum">{fe(snap.value)}</dd>
            <dd className="font-mono text-muted tnum">{fpct(snap.result)}</dd>
          </div>
        </dl>
        {flags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {flags.map((f) => (
              <Badge key={f.label} tone={f.tone}>
                {f.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------ diário */

function Journal({ run, month }: { run: SimRun; month: number }) {
  const [all, setAll] = useState(false);
  const months = run.months.filter((m) => m.month >= 1 && m.month <= month && (m.events.length || m.notices.length)).reverse();
  const items = months.flatMap((m) => [
    ...m.events.map((e) => ({ key: e.key, month: m.month, title: e.event.title, detail: e.hits.map((h) => `${shortName(h.simLotId)} ${Math.abs(h.impact) < 0.5 ? 'sem efeito imediato' : fes(h.impact)}`).join(' · '), kind: 'ev' as const, tone: e.event.tone })),
    ...m.notices.map((n, i) => ({ key: `${m.month}-${n.kind}-${n.simLotId}-${i}`, month: m.month, title: shortName(n.simLotId), detail: n.text, kind: 'no' as const, tone: undefined })),
  ]);
  const shown = all ? items : items.slice(0, 8);
  return (
    <Card padding="md" aria-labelledby="diario-title">
      <CardHeader title={<span id="diario-title">Diário da campanha simulada</span>} description="Tudo o que aconteceu até agora, do mais recente para o mais antigo." />
      {items.length === 0 ? (
        <p className="text-[0.9375rem] text-muted">Ainda nada para registar. Avança o primeiro mês.</p>
      ) : (
        <ol className="flex flex-col">
          {shown.map((it) => (
            <li key={it.key} className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 border-b border-border py-2.5 last:border-b-0">
              <span className="font-mono text-sm text-muted tnum">{monthLabel(it.month).replace('. ', ' ')}</span>
              <div className="min-w-0">
                <p className={cn('text-[0.9375rem] font-medium', 'text-fg')}>
                  {it.kind === 'ev' && <span className="sr-only">{it.tone === 'adverso' ? 'Acontecimento adverso: ' : 'Acontecimento favorável: '}</span>}
                  {it.title}
                </p>
                <p className="text-sm text-muted">{it.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {items.length > 8 && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'Mostrar só os 8 mais recentes' : `Mostrar o diário completo (${items.length})`}
        </Button>
      )}
    </Card>
  );
}
