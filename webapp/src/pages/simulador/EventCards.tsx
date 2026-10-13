import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarClock, CheckCircle2, Landmark, PauseCircle, PlayCircle, ShoppingCart, Tag } from 'lucide-react';
import { SIM_RULES } from '../../data';
import { Badge, Button, CommodityGlyph } from '../../components/ui';
import { EASE_OUT } from '../../components/game';
import { cn } from '../../lib/cn';
import { pct, price } from '../../lib/format';
import { getSimLot, monthLabel, shortName, unitsText, SEASON_NOTE, calendarMonth } from './deck';
import type { AppliedEvent, DecisionChoice, MonthState, Notice, NoticeKind, Pending, SimRun } from './engine';
import { fe, fes, fpct, refChange } from './parts';

/* =====================================================================
   Cartas do mês: acontecimentos (causa → efeito), propostas para decidir,
   meses calmos e o fecho da campanha. As cartas viram ao entrar.
   ===================================================================== */

const WORLD_LABEL = { azeite: 'Azeite', agua: 'Água', cafe: 'Café' } as const;

/** Carta que vira (rotação em Y) ao entrar. Com movimento reduzido só aparece. */
export function FlipIn({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, rotateY: -72, x: 12 }}
      animate={{ opacity: 1, rotateY: 0, x: 0 }}
      transition={{ duration: reduce ? 0.15 : 0.45, delay: Math.min(index, 4) * 0.09, ease: EASE_OUT }}
      style={{ transformPerspective: 900, transformOrigin: 'left center' }}
    >
      {children}
    </motion.div>
  );
}

export function EventCard({ ev }: { ev: AppliedEvent }) {
  const adverse = ev.event.tone === 'adverso';
  const total = ev.hits.reduce((s, h) => s + h.impact, 0);
  return (
    <article className="overflow-hidden rounded-md border border-border bg-surface" data-world={ev.world} aria-label={`${ev.event.title}, ${monthLabel(ev.month)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-world-line bg-world-soft px-4 py-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-world-ink">
          <CommodityGlyph world={ev.world} className="size-4" />
          {WORLD_LABEL[ev.world]} · {ev.scope === 'mundo' ? 'todo o mercado' : 'um lote'} · {monthLabel(ev.month)}
        </span>
        <Badge tone={adverse ? 'warn' : 'ok'} dot>
          {adverse ? 'Adverso' : 'Favorável'}
        </Badge>
      </div>
      <div className="px-4 pb-4 pt-3">
        <h3 className="text-[1.125rem] leading-snug">{ev.event.title}</h3>
        <p className="mt-1.5 text-[0.9375rem] text-muted">
          <span className="font-medium text-fg">Causa.</span> {ev.event.description}
        </p>
        <p className="mt-3 text-sm font-medium text-fg">Efeito nos teus lotes</p>
        <ul className="mt-1.5 divide-y divide-border">
          {ev.hits.map((h) => (
            <li key={h.simLotId} className="py-2 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[0.9375rem] font-medium text-fg">{shortName(h.simLotId)}</span>
                <span className="shrink-0 font-mono text-[0.9375rem] text-fg tnum">{Math.abs(h.impact) < 0.5 ? 'sem efeito imediato' : fes(h.impact)}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted">{h.note}</p>
              {h.hedgeSaved !== undefined && h.hedgeSaved > 0.5 && <p className="mt-0.5 text-sm font-medium text-ok-ink">A cobertura evitou {fe(h.hedgeSaved)} deste efeito.</p>}
            </li>
          ))}
        </ul>
        {ev.hits.length > 1 && Math.abs(total) >= 0.5 && (
          <p className="mt-2 flex items-baseline justify-between gap-3 border-t border-border pt-2 text-sm">
            <span className="text-muted">No total</span>
            <span className="font-mono text-fg tnum">{fes(total)}</span>
          </p>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------ propostas */

export function DecisionCard({ pending, run, onDecide }: { pending: Pending; run: SimRun; onDecide: (c: DecisionChoice) => void }) {
  const lot = getSimLot(pending.simLotId)!;
  const amount = run.allocations.find((a) => a.simLotId === pending.simLotId)?.amount ?? 0;
  const isRefunding = pending.kind === 'refunding';
  const ext = pending.extMonths ?? SIM_RULES.extension.maxMonths;
  const snap = run.months[run.months.length - 1].lots.find((l) => l.simLotId === pending.simLotId)!;
  const options: { choice: DecisionChoice; title: string; body: string }[] = isRefunding
    ? [
        { choice: 'aprovar', title: 'Aprovar a ronda de refunding', body: `Custa ${pct(SIM_RULES.refunding.costPct, 1)} do lote (${fe(SIM_RULES.refunding.costPct * amount)}). As vendas param 4 meses à espera de melhor preço. Pode não recuperar a perda.` },
        { choice: 'recusar', title: 'Recusar e continuar a vender', body: 'Sem custo extra. O lote vende ao preço de mercado, mesmo em baixo.' },
      ]
    : [
        { choice: 'aprovar', title: `Aceitar até ${ext} meses de extensão`, body: `Vende o resto até ${monthLabel(18 + ext)}. Custa ${pct(SIM_RULES.extension.monthlyCostPct, 1)} do montante por mês (${fe(SIM_RULES.extension.monthlyCostPct * amount * ext)} no total, se durar tudo).` },
        { choice: 'recusar', title: 'Vender tudo no mês 18', body: `Venda de fecho de ${unitsText(lot, snap.units)} com 3 % de desconto. O lote liquida já.` },
      ];
  return (
    <section aria-labelledby="proposta-title" className="rounded-md border border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] bg-surface p-4 sm:p-5" data-world={lot.world}>
      <p className="inline-flex items-center gap-2 text-sm font-medium text-world-ink">
        {isRefunding ? <Landmark aria-hidden className="size-4" strokeWidth={1.75} /> : <CalendarClock aria-hidden className="size-4" strokeWidth={1.75} />}
        Mês {pending.month} · {monthLabel(pending.month)} · decisão por tomar
      </p>
      <h3 id="proposta-title" className="mt-1 text-[1.25rem] leading-snug">
        {isRefunding ? 'Proposta de refunding' : 'Proposta de extensão'}: {shortName(pending.simLotId)}
      </h3>
      <p className="mt-2 text-[0.9375rem] text-fg">
        {isRefunding
          ? `O choque deixou a referência ${refChange(pending.priceIndex)} face à entrada. O resultado bruto previsto do lote é ${fpct(pending.gross)}, mais do que a reserva de primeira perda absorve (${pct(SIM_RULES.firstLossReservePct, 0)}): mesmo com a reserva, ficas em ${fpct(pending.projected)}.`
          : `Chegou o fim da janela de 18 meses com ${pct(pending.rem, 0)} do stock por vender (${unitsText(lot, snap.units)}) e a referência ${refChange(pending.priceIndex)} face à entrada.`}
      </p>
      <p className="mt-1.5 text-sm text-muted">Na operação real, quem decide é a Tesouraria com o Comité de risco, e os co-financiadores são avisados. Aqui decides tu, para veres o efeito no balanço.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.choice}
            type="button"
            onClick={() => onDecide(o.choice)}
            className={cn(
              'flex min-h-11 flex-col items-start gap-1 rounded-sm border px-4 py-3 text-left transition-[background-color,border-color,transform] duration-150 ease-out',
              'hover:bg-surface-2 active:translate-y-px',
              o.choice === 'aprovar' ? 'border-accent' : 'border-border',
            )}
          >
            <span className="font-semibold text-fg">{o.title}</span>
            <span className="text-sm text-muted">{o.body}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ mês calmo e notas */

const NOTICE_ICON: Record<NoticeKind, typeof ShoppingCart> = {
  vendas: ShoppingCart,
  refunding: Landmark,
  'refunding-recusado': Landmark,
  extensao: CalendarClock,
  'venda-fecho': Tag,
  liquidado: CheckCircle2,
  retoma: PlayCircle,
};

export function NoticeList({ notices, className }: { notices: Notice[]; className?: string }) {
  if (!notices.length) return null;
  return (
    <ul className={cn('flex flex-col gap-2.5', className)}>
      {notices.map((n, i) => {
        const Icon = NOTICE_ICON[n.kind];
        return (
          <li key={`${n.kind}-${n.simLotId}-${i}`} className="flex items-start gap-2.5 text-[0.9375rem]">
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} />
            <span className="min-w-0">
              <span className="font-medium text-fg">{shortName(n.simLotId)}.</span> <span className="text-muted">{n.text}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function QuietMonth({ state }: { state: MonthState }) {
  const sales = state.lots.filter((l) => l.soldUnits > 1e-6);
  const paused = state.lots.filter((l) => l.status === 'pausa');
  return (
    <article className="rounded-md border border-border bg-surface p-4" aria-label={`${monthLabel(state.month)}: mês sem acontecimentos`}>
      <p className="text-sm font-medium text-muted">{monthLabel(state.month)}</p>
      <h3 className="mt-0.5 text-[1.125rem]">Mês sem acontecimentos</h3>
      <p className="mt-1.5 text-[0.9375rem] text-muted">{SEASON_NOTE[calendarMonth(state.month)]}</p>
      {sales.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 text-[0.9375rem]">
          {sales.map((l) => {
            const lot = getSimLot(l.simLotId)!;
            return (
              <li key={l.simLotId} className="flex items-start gap-2.5">
                <ShoppingCart aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} />
                <span>
                  <span className="font-medium text-fg">{shortName(l.simLotId)}:</span>{' '}
                  <span className="text-muted">
                    vendidos <span className="font-mono text-fg tnum">{unitsText(lot, l.soldUnits)}</span> a{' '}
                    <span className="font-mono text-fg tnum">{price(l.price, lot.priceUnit)}</span>
                    .
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {paused.length > 0 && (
        <p className="mt-2 flex items-start gap-2.5 text-[0.9375rem] text-muted">
          <PauseCircle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          <span>Vendas em pausa (refunding): {paused.map((l) => shortName(l.simLotId)).join(', ')}.</span>
        </p>
      )}
      {sales.length === 0 && paused.length === 0 && <p className="mt-2 text-[0.9375rem] text-muted">Nenhum lote vendeu este mês: o stock espera pela janela de vendas.</p>}
    </article>
  );
}

export function StartCard({ run }: { run: SimRun }) {
  const m0 = run.months[0];
  return (
    <article className="rounded-md border border-border bg-surface p-4">
      <p className="text-sm font-medium text-muted">Mês 0 · out. 2026</p>
      <h3 className="mt-0.5 text-[1.125rem]">Lotes financiados</h3>
      <ul className="mt-2 flex flex-col gap-1.5 text-[0.9375rem]">
        {m0.lots.map((l) => {
          const lot = getSimLot(l.simLotId)!;
          return (
            <li key={l.simLotId} className="text-muted">
              <span className="font-medium text-fg">{shortName(l.simLotId)}:</span> {fe(l.amount)} compram <span className="font-mono text-fg tnum">{unitsText(lot, l.totalUnits)}</span>
              {l.hedged ? `, com ${lot.hedge.label.toLowerCase()}` : ''}.
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[0.9375rem] text-muted">
        A liquidação estimada parte de <span className="font-mono text-fg tnum">{fe(m0.value)}</span>: é o que os lotes dariam se tudo se vendesse ao preço de hoje. Avança para o primeiro mês da campanha.
      </p>
    </article>
  );
}

export function EndCard({ run, onOpen }: { run: SimRun; onOpen: () => void }) {
  const f = run.final!;
  return (
    <section aria-labelledby="fim-title" className="rounded-md border border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] bg-accent-soft p-4 sm:p-5">
      <p className="text-sm font-medium text-fg">Mês {run.end} · {monthLabel(run.end)}</p>
      <h3 id="fim-title" className="mt-0.5 text-[1.25rem]">
        Campanha terminada
      </h3>
      <p className="mt-1.5 text-[0.9375rem] text-fg">
        Todos os lotes liquidaram. Investiste {fe(run.invested)} fictícios e recebes {fe(f.value)} ({fpct(f.result)}). O balanço mostra o que a cobertura, a reserva, a extensão e o refunding mudaram.
      </p>
      <Button className="mt-4" size="lg" onClick={onOpen}>
        Abrir o balanço
      </Button>
    </section>
  );
}
