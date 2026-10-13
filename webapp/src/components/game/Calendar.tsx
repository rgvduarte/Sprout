import { useId } from 'react';
import { motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { getWorld } from '../../data';
import type { SeasonPhase, WorldId } from '../../data/types';
import { addMonths, daysBetween, TODAY_DATE } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, lisbonParts, MONTHS_SHORT, monthYear } from '../../lib/format';

/* =====================================================================
   O tempo desenhado no calendário agrícola: bandas de campanha (colheita
   vs. armazenagem e vendas), janela de 18 meses e extensão tracejada.
   ===================================================================== */

interface MonthCell {
  y: number;
  m: number; // 1–12
}

function monthsFrom(startIso: string, count: number): MonthCell[] {
  const p = lisbonParts(startIso);
  return Array.from({ length: count }, (_, i) => {
    const total = p.year * 12 + (p.month - 1) + i;
    return { y: Math.floor(total / 12), m: (total % 12) + 1 };
  });
}

function inPhase(phase: SeasonPhase, m: number) {
  return phase.startMonth <= phase.endMonth ? m >= phase.startMonth && m <= phase.endMonth : m >= phase.startMonth || m <= phase.endMonth;
}

function phaseFor(world: WorldId, m: number): SeasonPhase | undefined {
  return getWorld(world).season.phases.find((ph) => inPhase(ph, m));
}

/** posição 0–1 de uma data dentro de um intervalo de meses */
function positionOf(iso: string, months: MonthCell[]): number {
  const first = months[0];
  const p = lisbonParts(iso);
  const idx = (p.year - first.y) * 12 + (p.month - first.m);
  const daysInMonth = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
  return (idx + (p.day - 1) / daysInMonth) / months.length;
}

const PHASE_BG: Record<string, string> = {
  strong: 'color-mix(in oklab, var(--world) 26%, var(--surface))',
  light: 'color-mix(in oklab, var(--world) 9%, var(--surface))',
};

function isStrongPhase(ph?: SeasonPhase) {
  return ph?.kind === 'colheita' || ph?.kind === 'engarrafamento';
}

/* ------------------------------------------------------------ HarvestBand */

export interface HarvestBandProps {
  world: WorldId;
  /** início da janela (fecho do financiamento), 'YYYY-MM-DD' */
  start: string;
  /** duração da janela em meses (18) */
  months?: number;
  /** meses de extensão (desenhados tracejados) */
  extensionMonths?: number;
  /** 'YYYY-MM-DD'; por omissão hoje (13/10/2026) */
  today?: string;
  /** marcos com rótulo (venda a prazo, fecho previsto, …) */
  markers?: { date: string; label: string }[];
  /** cursor ligado ao scroll (0–1 sobre a janela) */
  progress?: MotionValue<number>;
  /** linha com a legenda (por omissão sim) */
  legend?: boolean;
  className?: string;
}

/** Janela de liquidação desenhada sobre as bandas da campanha agrícola. */
export function HarvestBand({ world, start, months = 18, extensionMonths = 0, today = TODAY_DATE, markers = [], progress, legend = true, className }: HarvestBandProps) {
  const uid = useId().replace(/:/g, '');
  const startMonth = `${start.slice(0, 7)}-01`;
  const totalMonths = months + extensionMonths + 1;
  const cells = monthsFrom(startMonth, totalMonths);
  const end = addMonths(start, months);
  const extEnd = extensionMonths ? addMonths(start, months + extensionMonths) : undefined;
  const a = positionOf(start, cells);
  const b = positionOf(end, cells);
  const c = extEnd ? positionOf(extEnd, cells) : b;
  const t = positionOf(today, cells);
  const showToday = t >= 0 && t <= 1;
  const w = getWorld(world);
  const harvest = w.season.phases.find(isStrongPhase);
  const fallback = useMotionValue(0);
  const playX = useTransform(progress ?? fallback, (v) => `${(a + (b - a) * Math.max(0, Math.min(1, v))) * 100}%`);
  const summary = `Janela de ${months} meses de ${fmtDate(start)} a ${fmtDate(end)}${extEnd ? `, estendida até ${fmtDate(extEnd)}` : ''}. ${harvest ? `${harvest.label}: ${MONTHS_SHORT[harvest.startMonth - 1]}–${MONTHS_SHORT[harvest.endMonth - 1]}.` : ''}${showToday ? ` Hoje: ${fmtDate(today)}.` : ''}`;

  return (
    <div className={cn('min-w-0', className)} data-world={world}>
      <div role="img" aria-label={summary} className="relative">
        {/* bandas da campanha */}
        <div className="flex h-14 overflow-hidden rounded-sm border border-border">
          {cells.map((cell, i) => {
            const ph = phaseFor(world, cell.m);
            return <div key={i} className="h-full flex-1 border-r border-[color-mix(in_oklab,var(--border)_60%,transparent)] last:border-r-0" style={{ background: isStrongPhase(ph) ? PHASE_BG.strong : PHASE_BG.light }} />;
          })}
        </div>
        {/* janela de 18 meses */}
        <div className="pointer-events-none absolute inset-x-0 top-[18px] h-[18px]">
          <div className="absolute h-full rounded-xs bg-world-ink" style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }} />
          {extEnd && <div className="hatch absolute h-full rounded-xs border border-world-ink text-world-ink" style={{ left: `${b * 100}%`, width: `${(c - b) * 100}%` }} />}
        </div>
        {/* hoje */}
        {showToday && (
          <div className="pointer-events-none absolute -top-1 bottom-[-4px] w-0" style={{ left: `${t * 100}%` }}>
            <div className="absolute inset-y-0 -left-px w-0.5 bg-fg" />
            <div className="absolute -top-5 left-0 -translate-x-1/2 whitespace-nowrap font-mono text-xs text-fg">hoje</div>
          </div>
        )}
        {/* cursor do scroll */}
        {progress && (
          <motion.div aria-hidden className="pointer-events-none absolute -top-1 bottom-[-4px] w-0" style={{ left: playX }}>
            <div className="absolute inset-y-0 -left-[1.5px] w-[3px] rounded-full bg-accent" />
          </motion.div>
        )}
        {/* marcos */}
        {markers.map((mk) => {
          const x = positionOf(mk.date, cells);
          if (x < 0 || x > 1) return null;
          return <div key={mk.label} aria-hidden className="pointer-events-none absolute top-[38px] h-4 w-px bg-fg" style={{ left: `${x * 100}%` }} />;
        })}
      </div>
      {/* meses */}
      <div className="mt-1.5 flex" aria-hidden>
        {cells.map((cell, i) => {
          const hideOnPhone = totalMonths > 13 ? i % 3 !== 0 : i % 2 === 1;
          const showYear = cell.m === 1 || (i === 0 && cell.m <= 10);
          return (
            <div key={i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center font-mono text-[11px] leading-4 text-muted">
              <span className={cn('block', hideOnPhone && 'max-sm:invisible')}>{MONTHS_SHORT[cell.m - 1]}</span>
              {showYear && <span className="block text-fg">{cell.y}</span>}
            </div>
          );
        })}
      </div>
      {markers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {markers.map((mk) => (
            <li key={mk.label}>
              <span className="font-mono tnum text-fg">{fmtDate(mk.date)}</span> · {mk.label}
            </li>
          ))}
        </ul>
      )}
      {legend && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted" id={`hb-${uid}`}>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: PHASE_BG.strong }} />
            {harvest?.label ?? 'Colheita'}
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: PHASE_BG.light }} />
            {w.season.phases.find((p) => !isStrongPhase(p))?.label ?? 'Armazenagem e vendas'}
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-2 w-4 rounded-[2px] bg-world-ink" />
            Janela de {months} meses
          </li>
          {extEnd && (
            <li className="inline-flex items-center gap-2">
              <span aria-hidden className="hatch inline-block h-2 w-4 rounded-[2px] border border-world-ink text-world-ink" />
              Extensão de {extensionMonths} meses
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ SeasonTrack */

export interface SeasonTrackProps {
  world?: WorldId;
  today?: string;
  /** só a barra, sem títulos de fase */
  compact?: boolean;
  className?: string;
}

/** A campanha como estação de jogo: out. → set., com o marcador de hoje. */
export function SeasonTrack({ world = 'azeite', today = TODAY_DATE, compact, className }: SeasonTrackProps) {
  const w = getWorld(world);
  const start = '2026-10-01';
  const cells = monthsFrom(start, 12);
  const t = positionOf(today, cells);
  const day = daysBetween(start, today) + 1;
  // agrupar meses contíguos por fase
  const groups: { phase?: SeasonPhase; from: number; to: number }[] = [];
  cells.forEach((c, i) => {
    const ph = phaseFor(world, c.m);
    const last = groups[groups.length - 1];
    if (last && last.phase?.id === ph?.id) last.to = i;
    else groups.push({ phase: ph, from: i, to: i });
  });
  const current = groups.find((g) => t * 12 >= g.from && t * 12 < g.to + 1);

  return (
    <div className={cn('min-w-0', className)} data-world={world}>
      {!compact && (
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-medium text-fg">
            {w.season.label}
            {current?.phase && <span className="text-muted"> · {current.phase.label.toLowerCase()}</span>}
          </p>
          <p className="font-mono text-sm text-muted tnum">
            dia {day} de 365 · {monthYear(today)}
          </p>
        </div>
      )}
      <div role="img" aria-label={`${w.season.label}. Hoje, ${fmtDate(today)}, ${current?.phase ? `fase: ${current.phase.label}` : ''}.`} className="relative">
        <div className="flex h-9 overflow-hidden rounded-sm border border-border">
          {groups.map((g, i) => (
            <div
              key={i}
              className="flex h-full items-center overflow-hidden border-r border-border px-2 last:border-r-0"
              style={{ flex: g.to - g.from + 1, background: isStrongPhase(g.phase) ? PHASE_BG.strong : PHASE_BG.light }}
            >
              <span className="truncate text-xs font-medium text-world-ink">{g.phase?.label}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute -bottom-1 -top-1 w-0" style={{ left: `${t * 100}%` }}>
          <div className="absolute inset-y-0 -left-px w-0.5 bg-fg" />
        </div>
      </div>
      <div className="mt-1 flex" aria-hidden>
        {cells.map((c, i) => (
          <div key={i} className={cn('flex-1 text-center font-mono text-[11px] text-muted', i % 2 === 1 && 'max-sm:invisible')}>
            {MONTHS_SHORT[c.m - 1]}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Data a partir da qual uma posição fica na janela: útil para HarvestBand. */
export const windowStart = (closedAt?: string, opensAt?: string) => closedAt ?? opensAt ?? TODAY_DATE;
