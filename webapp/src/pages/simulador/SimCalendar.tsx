import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import type { WorldId } from '../../data/types';
import { cn } from '../../lib/cn';
import { EASE_OUT } from '../../components/game';
import { MAX_MONTH, WINDOW, calendarMonth, calendarYear, getSimLot, monthLabel, monthShort, phaseOf, shortName } from './deck';
import type { MonthState, SimRun } from './engine';
import { Hatch } from './parts';

/* =====================================================================
   O tempo do jogo desenhado no calendário agrícola: bandas da estação de
   cada mundo, a janela de 18 meses, a zona de extensão e, por lote, a
   janela de vendas com o que já foi vendido, as pausas e os acontecimentos.
   ===================================================================== */

const COLS = MAX_MONTH; // meses 1–24
const pos = (m: number) => ((m - 1) / COLS) * 100;
const width = (from: number, to: number) => ((to - from + 1) / COLS) * 100;

export function SimCalendar({ run, month, className }: { run: SimRun; month: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const revealed: MonthState[] = run.months.filter((m) => m.month >= 1 && m.month <= month);
  const current = run.months.find((m) => m.month === month) ?? run.months[0];
  const lotIds = current.lots.map((l) => l.simLotId);
  const worlds = [...new Set(lotIds.map((id) => getSimLot(id)!.world))] as WorldId[];
  const cursorX = month <= 0 ? 0 : ((month - 0.5) / COLS) * 100;

  const months = Array.from({ length: COLS }, (_, i) => i + 1);

  return (
    <div className={cn('min-w-0', className)}>
      {/* cabeçalho dos meses */}
      <div className="grid grid-cols-1 gap-x-3 md:grid-cols-[184px_minmax(0,1fr)]">
        <div className="hidden md:block" />
        <div className="relative">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }} aria-hidden>
            {months.map((m) => {
              const jan = calendarMonth(m) === 1;
              return (
                <div key={m} className="min-w-0 text-center font-mono text-[11px] leading-4 text-muted">
                  <span className={cn('block', m % 3 !== 1 && 'max-md:invisible', m === month && 'font-semibold text-fg')}>{monthShort(m)}</span>
                  <span className={cn('block text-fg', !jan && m !== 1 && 'invisible')}>{calendarYear(m)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative mt-1.5">
        {/* linhas: estações e lotes */}
        <div className="flex flex-col gap-2.5">
          {worlds.map((w) => (
            <Row key={w} label={w === 'azeite' ? 'Estação do azeite' : w === 'agua' ? 'Estação da água' : 'Safra do café'} world={w}>
              <Lane cursorX={cursorX} month={month} uid={`${uid}-${w}`} reduce={Boolean(reduce)}>
                <PhaseBand world={w} />
              </Lane>
            </Row>
          ))}
          <div className="h-px bg-border" aria-hidden />
          {lotIds.map((id) => {
            const lot = getSimLot(id)!;
            const snap = current.lots.find((l) => l.simLotId === id)!;
            const sold = revealed.filter((m) => (m.lots.find((l) => l.simLotId === id)?.soldUnits ?? 0) > 1e-6).map((m) => m.month);
            const paused = revealed.filter((m) => m.lots.find((l) => l.simLotId === id)?.status === 'pausa').map((m) => m.month);
            const evMonths = revealed.filter((m) => m.events.some((e) => e.hits.some((h) => h.simLotId === id)));
            const settled = snap.settledAt;
            const planFrom = Math.max(month + 1, snap.salesFrom);
            const planTo = snap.salesTo;
            return (
              <Row key={id} label={shortName(id)} world={lot.world} hedged={snap.hedged}>
                <Lane cursorX={cursorX} month={month} uid={`${uid}-${id}`} reduce={Boolean(reduce)} extended={snap.extended}>
                <div className="relative h-7 rounded-xs bg-[color-mix(in_oklab,var(--border)_40%,transparent)]">
                  {/* plano de vendas ainda por cumprir */}
                  {settled === undefined && planTo >= planFrom && (
                    <div className="absolute inset-y-1 rounded-xs border border-dashed border-world-line" style={{ left: `${pos(planFrom)}%`, width: `${width(planFrom, planTo)}%` }} />
                  )}
                  {/* meses em pausa (refunding) */}
                  {paused.map((m) => (
                    <div key={`p${m}`} className="absolute inset-y-1 overflow-hidden" style={{ left: `${pos(m)}%`, width: `${width(m, m)}%` }}>
                      <Hatch id={`p-${uid}-${id}-${m}`} />
                    </div>
                  ))}
                  {/* meses com vendas */}
                  {sold.map((m) => (
                    <motion.div
                      key={`s${m}`}
                      className="absolute inset-y-1 origin-left bg-world"
                      style={{ left: `calc(${pos(m)}% + 1px)`, width: `calc(${width(m, m)}% - 2px)` }}
                      initial={reduce ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                    />
                  ))}
                  {/* acontecimentos */}
                  {evMonths.map((m) => {
                    const ev = m.events.find((e) => e.hits.some((h) => h.simLotId === id))!;
                    const adverse = ev.event.tone === 'adverso';
                    return (
                      <span
                        key={`e${m.month}`}
                        title={`${monthLabel(m.month)}: ${m.events.filter((e) => e.hits.some((h) => h.simLotId === id)).map((e) => e.event.title).join(', ')}`}
                        className="absolute top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${pos(m.month) + width(m.month, m.month) / 2}%` }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="block">
                          <path d="M6 0.8 L11.2 6 L6 11.2 L0.8 6 Z" fill={adverse ? 'var(--fg)' : 'var(--surface)'} stroke="var(--fg)" strokeWidth="1.4" />
                        </svg>
                      </span>
                    );
                  })}
                  {settled !== undefined && settled > 0 && settled <= month && (
                    <span className="absolute top-1/2 z-[1] inline-flex size-4 -translate-y-1/2 items-center justify-center rounded-full bg-fg text-bg" style={{ left: `calc(${pos(settled) + width(settled, settled)}% + 2px)` }} aria-hidden>
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
                </Lane>
              </Row>
            );
          })}
        </div>

      </div>

      {/* legenda */}
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Legenda do calendário">
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] bg-muted" />
          Vendido, na cor do mercado
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-dashed border-muted" />
          Vendas previstas
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-4 overflow-hidden rounded-[2px] border border-border">
            <Hatch id={`lg-${uid}`} color="var(--muted)" />
          </span>
          Pausa (refunding) e zona de extensão
        </li>
        <li className="inline-flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M6 0.8 L11.2 6 L6 11.2 L0.8 6 Z" fill="var(--fg)" stroke="var(--fg)" strokeWidth="1.4" />
          </svg>
          Acontecimento adverso
        </li>
        <li className="inline-flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M6 0.8 L11.2 6 L6 11.2 L0.8 6 Z" fill="var(--surface)" stroke="var(--fg)" strokeWidth="1.4" />
          </svg>
          Favorável
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-0.5 bg-fg" />
          Fim da janela de 18 meses
        </li>
      </ul>
    </div>
  );
}

/** Faixa com a linha do mês 18, a zona de extensão e o cursor do mês atual. */
function Lane({ children, cursorX, month, uid, reduce, extended }: { children: React.ReactNode; cursorX: number; month: number; uid: string; reduce: boolean; extended?: boolean }) {
  return (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute inset-y-[-3px] inset-x-0" aria-hidden>
        <div className={cn('absolute inset-y-0 right-0', extended ? 'opacity-[0.16]' : 'opacity-[0.08]')} style={{ left: `${(WINDOW / COLS) * 100}%` }}>
          <Hatch id={`ext-${uid}`} color="var(--fg)" />
        </div>
        <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-fg" style={{ left: `${(WINDOW / COLS) * 100}%` }} />
        <div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute inset-y-0 left-0 w-full" initial={false} animate={{ x: `${cursorX}%` }} transition={{ duration: reduce ? 0 : 0.5, ease: EASE_OUT }}>
            <div className={cn('absolute inset-y-0 -ml-px w-0.5 bg-accent', month === 0 && 'opacity-0')} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, world, hedged, children }: { label: string; world: WorldId; hedged?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-1 md:grid-cols-[184px_minmax(0,1fr)] md:items-center" data-world={world}>
      <div className="min-w-0 truncate text-sm text-fg">
        {label}
        {hedged && <span className="text-muted"> · coberto</span>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function PhaseBand({ world }: { world: WorldId }) {
  const months = Array.from({ length: COLS }, (_, i) => i + 1);
  // agrupa meses seguidos com a mesma fase
  const groups: { label: string; strong: boolean; from: number; to: number }[] = [];
  for (const m of months) {
    const ph = phaseOf(world, calendarMonth(m));
    const last = groups[groups.length - 1];
    if (last && last.label === ph.label) last.to = m;
    else groups.push({ ...ph, from: m, to: m });
  }
  return (
    <div className="flex h-6 overflow-hidden rounded-xs border border-border">
      {groups.map((g) => (
        <div
          key={`${g.from}`}
          className="flex min-w-0 items-center overflow-hidden border-r border-[color-mix(in_oklab,var(--border)_70%,transparent)] px-1.5 last:border-r-0"
          style={{ flex: g.to - g.from + 1, background: g.strong ? 'color-mix(in oklab, var(--world) 26%, var(--surface))' : 'color-mix(in oklab, var(--world) 9%, var(--surface))' }}
          title={`${g.label}: ${monthLabel(g.from)} a ${monthLabel(g.to)}`}
        >
          <span className="truncate text-xs font-medium text-world-ink max-sm:hidden">{g.to - g.from >= 2 ? g.label : ''}</span>
        </div>
      ))}
    </div>
  );
}

/** Fita fina da estação no painel fixo: os meses passados enchem-se sobre as bandas da colheita. */
export function SeasonStrip({ month, extended, className }: { month: number; extended: boolean; className?: string }) {
  const months = Array.from({ length: COLS }, (_, i) => i + 1);
  return (
    <div className={cn('min-w-0', className)} data-world="azeite">
      <div className="flex h-2.5 gap-[2px]" role="img" aria-label={`Mês ${month} de ${WINDOW}${extended ? ', com extensão até ao mês 24' : ''}. Colheita do azeite de outubro a janeiro.`}>
        {months.map((m) => {
          const strong = phaseOf('azeite', calendarMonth(m)).strong;
          const past = m <= month;
          const outside = m > WINDOW && !extended;
          return (
            <span
              key={m}
              className={cn('h-full flex-1 rounded-[1px] transition-colors duration-300 ease-out', m === WINDOW + 1 && 'ml-1.5', outside && 'opacity-40')}
              style={{
                background: past ? 'var(--accent)' : strong ? 'color-mix(in oklab, var(--world) 30%, var(--surface))' : 'color-mix(in oklab, var(--fg) 9%, var(--surface))',
              }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] leading-4 text-muted" aria-hidden>
        <span>{monthLabel(1)}</span>
        <span className="flex items-center gap-3 max-sm:hidden">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-[1px]" style={{ background: 'color-mix(in oklab, var(--world) 30%, var(--surface))' }} />
            colheita do azeite
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-[1px] bg-accent" />
            meses jogados
          </span>
        </span>
        <span>
          {monthLabel(WINDOW)} · mês 18{extended ? ` → ${monthLabel(MAX_MONTH)}` : ''}
        </span>
      </div>
    </div>
  );
}
