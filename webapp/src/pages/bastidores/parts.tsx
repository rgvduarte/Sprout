import { useId, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleAlert, CircleCheck, CircleDashed } from 'lucide-react';
import { getWorld, type Lot, type ReconciliationRun, type WorldId } from '../../data';
import { EASE_OUT } from '../../components/game';
import { CommodityGlyph } from '../../components/ui';
import { addMonths, TODAY_DATE } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, lisbonParts, MONTHS_SHORT, num, pct } from '../../lib/format';

/* =====================================================================
   Peças visuais dos Bastidores: histórico curto de um indicador, faixa de
   reconciliação, calendário das janelas de liquidação e régua de gatilhos.
   ===================================================================== */

export const signedEur = (v: number, decimals = 0) => (Math.abs(v) < 0.5 && decimals === 0 ? eur(0, { decimals: 0 }) : eur(v, { sign: true, decimals }));
export const signedPct = (v: number, d = 1) => (Math.abs(v) < 0.0005 ? pct(0, d) : pct(v, d, { sign: true }));

/* ------------------------------------------------------------ histórico de um indicador */

export interface KpiHistoryProps {
  values: number[];
  labels: string[];
  /** 'line' para taxas perto do alvo; 'columns' para contagens e montantes (base zero) */
  kind: 'line' | 'columns';
  format: (v: number) => string;
  target?: number;
  /** coluna de contexto por trás (p.ex. comprometido vs financiado) */
  track?: number[];
  /** nome acessível do indicador */
  label: string;
  className?: string;
}

const W = 200;
const H = 72;
const PLOT = { x0: 4, x1: 196, y0: 10, y1: 50 };

function colPath(x: number, y: number, w: number, h: number, r = 3) {
  if (h <= 0.5) return '';
  const rr = Math.min(r, h, w / 2);
  return `M${x} ${y + h}V${y + rr}Q${x} ${y} ${x + rr} ${y}H${x + w - rr}Q${x + w} ${y} ${x + w} ${y + rr}V${y + h}Z`;
}

/** Histórico curto de um indicador, com o alvo tracejado e o valor atual em destaque. */
export function KpiHistory({ values, labels, kind, format, target, track, label, className }: KpiHistoryProps) {
  const n = values.length;
  const slot = (PLOT.x1 - PLOT.x0) / n;
  const all = [...values, ...(track ?? []), ...(target !== undefined ? [target] : [])];
  let lo = kind === 'columns' ? 0 : Math.min(...all);
  let hi = Math.max(...all);
  if (kind === 'line') {
    const pad = Math.max((hi - lo) * 0.25, Math.abs(hi) * 0.01, 0.001);
    lo -= pad;
    hi += pad;
  } else hi = hi * 1.08 || 1;
  const y = (v: number) => PLOT.y1 - ((v - lo) / (hi - lo)) * (PLOT.y1 - PLOT.y0);
  const cx = (i: number) => PLOT.x0 + slot * i + slot / 2;
  const summary = `${label}, últimos ${n} períodos: ${values.map((v, i) => `${labels[i]} ${format(v)}`).join(', ')}${target !== undefined ? `. Alvo ${format(target)}` : ''}.`;
  const past = 'color-mix(in oklab, var(--fg) 26%, var(--surface))';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className={cn('block h-auto w-full max-w-[220px]', className)}>
      <line x1={PLOT.x0} x2={PLOT.x1} y1={PLOT.y1 + 0.5} y2={PLOT.y1 + 0.5} stroke="var(--chart-grid)" strokeWidth="1" />
      {target !== undefined && <line x1={PLOT.x0} x2={PLOT.x1} y1={y(target)} y2={y(target)} stroke="var(--chart-ref)" strokeWidth="1" strokeDasharray="3 3" />}
      {kind === 'columns' &&
        values.map((v, i) => {
          const bw = 16;
          const x = cx(i) - bw / 2;
          const t = track?.[i];
          return (
            <g key={i}>
              {t !== undefined && t > v && <path d={colPath(x, y(t), bw, PLOT.y1 - y(t))} fill="var(--surface)" stroke={past} strokeWidth="1.25" />}
              <path d={colPath(x, y(v), bw, PLOT.y1 - y(v))} fill={i === n - 1 ? 'var(--accent)' : past} />
            </g>
          );
        })}
      {kind === 'line' && (
        <>
          <polyline points={values.map((v, i) => `${cx(i)},${y(v)}`).join(' ')} fill="none" stroke="color-mix(in oklab, var(--fg) 45%, var(--surface))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {values.map((v, i) => (
            <circle key={i} cx={cx(i)} cy={y(v)} r={i === n - 1 ? 4.5 : 3.5} fill={i === n - 1 ? 'var(--accent)' : 'color-mix(in oklab, var(--fg) 45%, var(--surface))'} stroke="var(--surface)" strokeWidth="2" />
          ))}
        </>
      )}
      {values.map((v, i) => (
        <rect key={`hit-${i}`} x={PLOT.x0 + slot * i} y={0} width={slot} height={PLOT.y1 + 4} fill="transparent">
          <title>{`${labels[i]}: ${format(v)}${track?.[i] !== undefined ? ` de ${format(track[i])}` : ''}`}</title>
        </rect>
      ))}
      {labels.map((l, i) => (
        <text key={l + i} x={cx(i)} y={H - 5} textAnchor="middle" fontSize="11.5" fontFamily="var(--font-mono)" fill={i === n - 1 ? 'var(--fg)' : 'var(--muted)'}>
          {l}
        </text>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------ faixa de reconciliação */

export interface StripDay {
  date: string;
  status: ReconciliationRun['status'] | 'por-executar';
  difference: number;
  weekend: boolean;
}

const STRIP_LABEL: Record<StripDay['status'], string> = {
  conciliado: 'conciliado',
  'diferenca-resolvida': 'diferença resolvida',
  'em-aberto': 'diferença em aberto',
  'por-executar': 'por executar',
};

/** 30 dias de reconciliação + hoje. Cada dia é um botão que abre o detalhe. */
export function ReconStrip({ days, selected, onSelect }: { days: StripDay[]; selected?: string; onSelect: (date: string) => void }) {
  const reduce = useReducedMotion();
  return (
    <div>
      <ol className="grid grid-cols-8 gap-1 sm:grid-cols-[repeat(16,minmax(0,1fr))] lg:grid-cols-[repeat(31,minmax(0,1fr))]" aria-label="Reconciliação diária, últimos 30 dias e hoje">
        {days.map((d) => {
          const p = lisbonParts(d.date);
          const isSel = selected === d.date;
          const tone =
            d.status === 'conciliado'
              ? d.weekend
                ? 'bg-[color-mix(in_oklab,var(--ok)_14%,var(--surface))] text-ok-ink'
                : 'bg-[color-mix(in_oklab,var(--ok)_26%,var(--surface))] text-ok-ink'
              : d.status === 'diferenca-resolvida'
                ? 'bg-[color-mix(in_oklab,var(--warn)_28%,var(--surface))] text-warn-ink'
                : d.status === 'em-aberto'
                  ? 'bg-[color-mix(in_oklab,var(--crit)_24%,var(--surface))] text-crit-ink'
                  : 'border border-dashed border-[color-mix(in_oklab,var(--fg)_40%,var(--border))] bg-surface text-fg';
          return (
            <li key={d.date} className="min-w-0">
              <motion.button
                type="button"
                onClick={() => onSelect(d.date)}
                aria-pressed={isSel}
                aria-label={`${fmtDate(d.date)}: ${STRIP_LABEL[d.status]}${d.difference ? `, diferença de ${eur(d.difference, { decimals: 2 })}` : ''}`}
                className={cn(
                  'relative flex h-11 w-full flex-col items-center justify-center rounded-xs font-mono text-[11px] leading-none tnum transition-shadow duration-150',
                  tone,
                  isSel && 'shadow-[0_0_0_2px_var(--fg)]',
                )}
                initial={false}
                animate={{ scale: 1 }}
                whileTap={reduce ? undefined : { scale: 0.94 }}
              >
                <span>{p.day}</span>
                {d.status === 'diferenca-resolvida' && <CircleAlert aria-hidden className="mt-0.5 size-3" strokeWidth={2} />}
                {d.status === 'em-aberto' && <CircleAlert aria-hidden className="mt-0.5 size-3" strokeWidth={2} />}
                {d.status === 'por-executar' && <CircleDashed aria-hidden className="mt-0.5 size-3" strokeWidth={2} />}
              </motion.button>
            </li>
          );
        })}
      </ol>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block size-3 rounded-[2px] bg-[color-mix(in_oklab,var(--ok)_26%,var(--surface))]" />
          <CircleCheck aria-hidden className="size-3.5 text-ok-ink" strokeWidth={2} />
          Conciliado (mais claro: fim de semana, sem movimentos)
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block size-3 rounded-[2px] bg-[color-mix(in_oklab,var(--warn)_28%,var(--surface))]" />
          <CircleAlert aria-hidden className="size-3.5 text-warn-ink" strokeWidth={2} />
          Diferença resolvida
        </li>
        <li className="inline-flex items-center gap-2">
          <CircleDashed aria-hidden className="size-3.5" strokeWidth={2} />
          Por executar
        </li>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ calendário das janelas */

export interface CalendarRow {
  lot: Lot;
  /** extensão nova neste cenário (desenhada a tracejado, a crescer) */
  newExtension?: boolean;
  refunding?: boolean;
  /** nota curta à direita do rótulo */
  note?: string;
}

const CAL_START = '2025-03-01';
const CAL_MONTHS = 46; // mar. 2025 → dez. 2028

function monthIndex(iso: string) {
  const p = lisbonParts(iso);
  const s = lisbonParts(CAL_START);
  const dim = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
  return (p.year - s.year) * 12 + (p.month - s.month) + (p.day - 1) / dim;
}
const xPct = (iso: string) => `${(Math.max(0, Math.min(CAL_MONTHS, monthIndex(iso))) / CAL_MONTHS) * 100}%`;
const wPct = (a: string, b: string) => `${((Math.min(CAL_MONTHS, monthIndex(b)) - Math.max(0, monthIndex(a))) / CAL_MONTHS) * 100}%`;

const STRONG: Record<WorldId, (m: number) => boolean> = {
  azeite: (m) => m >= 10 || m === 1,
  agua: (m) => m >= 10 || m <= 4,
  cafe: (m) => m >= 5 && m <= 9,
};

function Hatch({ id }: { id: string }) {
  return (
    <svg aria-hidden className="block h-full w-full" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--world-ink)" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function windowOf(lot: Lot) {
  const end = lot.settlement.plannedEnd ?? addMonths(TODAY_DATE, lot.settlement.windowMonths);
  const start = lot.settlement.start ?? addMonths(end, -lot.settlement.windowMonths);
  const settle = lot.milestones.find((m) => m.stage === 'liquidado');
  const early = settle && !settle.done && settle.planned && settle.planned < end ? settle.planned : undefined;
  return { start, end, ext: lot.settlement.extendedTo, early };
}

/** As janelas de 18 meses de todos os lotes em ciclo, sobre as bandas de colheita de cada mundo. */
export function CycleCalendar({ rows, caption }: { rows: CalendarRow[]; caption: string }) {
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const months = Array.from({ length: CAL_MONTHS }, (_, i) => {
    const total = 2025 * 12 + 2 + i;
    return { y: Math.floor(total / 12), m: (total % 12) + 1 };
  });
  return (
    <figure className="min-w-0">
      <figcaption className="sr-only">{caption}</figcaption>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" tabIndex={0} role="region" aria-label="Calendário das janelas de liquidação (desliza na horizontal)">
        <div className="min-w-[760px]">
          {/* anos */}
          <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-end gap-3 pb-1">
            <span className="text-xs text-muted">Lote</span>
            <div className="relative h-5">
              {months.map((c, i) =>
                c.m === 1 || i === 0 ? (
                  <span key={i} className="absolute top-0 font-mono text-[11px] text-fg" style={{ left: `${(i / CAL_MONTHS) * 100}%` }}>
                    {c.m === 1 ? c.y : `${MONTHS_SHORT[c.m - 1]}. ${c.y}`}
                  </span>
                ) : null,
              )}
            </div>
          </div>
          <ol className="relative">
            {rows.map(({ lot, newExtension, refunding, note }) => {
              const w = windowOf(lot);
              const open = lot.status === 'aberto';
              const extTo = w.ext ?? (newExtension ? addMonths(w.end, 6) : undefined);
              return (
                <li key={lot.id} className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-3 border-t border-[color-mix(in_oklab,var(--border)_70%,transparent)] py-1.5" data-world={lot.world}>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <CommodityGlyph world={lot.world} className="size-3.5 text-world-ink" />
                    <span className="font-mono text-[13px] text-fg tnum">{lot.id}</span>
                    {note && <span className="truncate text-xs text-muted">{note}</span>}
                  </div>
                  <div className="relative h-6" role="img" aria-label={`${lot.id}: janela ${open ? 'prevista ' : ''}de ${fmtDate(w.start)} a ${fmtDate(w.end)}${extTo ? `, extensão até ${fmtDate(extTo)}` : ''}${refunding ? ', refunding' : ''}${w.early ? `, liquidação prevista a ${fmtDate(w.early)}` : ''}.`}>
                    {/* bandas da campanha do mundo */}
                    <div aria-hidden className="absolute inset-0 flex overflow-hidden rounded-xs">
                      {months.map((c, i) => (
                        <span key={i} className="h-full flex-1" style={{ background: STRONG[lot.world](c.m) ? 'color-mix(in oklab, var(--world) 16%, var(--surface))' : 'color-mix(in oklab, var(--world) 4%, var(--surface))' }} />
                      ))}
                    </div>
                    {/* janela de 18 meses */}
                    <div
                      aria-hidden
                      className={cn('absolute top-1/2 h-2.5 -translate-y-1/2 rounded-xs', open ? 'border border-world-ink bg-[color-mix(in_oklab,var(--world)_30%,var(--surface))]' : 'bg-world-ink')}
                      style={{ left: xPct(w.start), width: wPct(w.start, w.end) }}
                    />
                    {/* extensão: existente ou do cenário */}
                    <AnimatePresence initial={false}>
                      {extTo && (
                        <motion.div
                          key={`ext-${lot.id}`}
                          aria-hidden
                          className={cn('absolute top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-xs border', newExtension && !w.ext ? 'border-world-ink' : 'border-world-ink')}
                          style={{ left: xPct(w.end), width: wPct(w.end, extTo) }}
                          initial={reduce || !newExtension ? { opacity: 0 } : { clipPath: 'inset(0 100% 0 0)' }}
                          animate={reduce || !newExtension ? { opacity: 1 } : { clipPath: 'inset(0 0% 0 0)' }}
                          exit={{ opacity: 0, transition: { duration: 0.15 } }}
                          transition={{ duration: newExtension ? 0.7 : 0.2, ease: EASE_OUT }}
                        >
                          <Hatch id={`h-${uid}-${lot.id}`} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* liquidação antecipada prevista */}
                    {w.early && <span aria-hidden className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-fg" style={{ left: xPct(w.early) }} />}
                    {/* refunding */}
                    <AnimatePresence initial={false}>
                      {refunding && (
                        <motion.span
                          key={`rf-${lot.id}`}
                          aria-hidden
                          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-surface bg-crit"
                          style={{ left: xPct(extTo ?? w.end) }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.12 } }}
                          transition={{ duration: 0.25, delay: reduce ? 0 : 0.45 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
            {/* hoje */}
            <li aria-hidden className="pointer-events-none absolute inset-y-0 left-[calc(9.5rem+0.75rem)] right-0">
              <span className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-fg" style={{ left: xPct(TODAY_DATE) }} />
            </li>
          </ol>
          <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-3 pt-1" aria-hidden>
            <span />
            <div className="relative h-4">
              <span className="absolute -translate-x-1/2 font-mono text-[11px] text-fg" style={{ left: xPct(TODAY_DATE) }}>
                hoje
              </span>
            </div>
          </div>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted" data-world="azeite">
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: 'color-mix(in oklab, var(--world) 16%, var(--surface))' }} />
          Colheita (azeite: out.–jan.) ou engarrafamento (água: out.–abr.)
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-2.5 w-5 rounded-[2px] bg-world-ink" />
          Janela de 18 meses
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-2.5 w-5 rounded-[2px] border border-world-ink bg-[color-mix(in_oklab,var(--world)_30%,var(--surface))]" />
          Janela prevista (financiamento aberto)
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-2.5 w-5 overflow-hidden rounded-[2px] border border-world-ink">
            <Hatch id={`lg-${uid}`} />
          </span>
          Extensão de até 6 meses
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block size-2.5 rounded-full bg-fg" />
          Liquidação antecipada prevista
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block size-2.5 rotate-45 bg-crit" />
          Refunding
        </li>
      </ul>
    </figure>
  );
}

/* ------------------------------------------------------------ régua de preços e gatilhos */

export interface RulerMark {
  value: number;
  label: string;
}

/** Régua de preço do azeite (€/kg): limiares dos gatilhos e a referência, hoje e sob esforço. */
export function PriceRuler({ min, max, unit, today, stressed, marks, stressLabel }: { min: number; max: number; unit: string; today: number; stressed?: number; marks: RulerMark[]; stressLabel?: string }) {
  const reduce = useReducedMotion();
  const pos = (v: number) => ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 100;
  const x = (v: number) => `${pos(v)}%`;
  const ticks: number[] = [];
  for (let v = Math.ceil(min * 10) / 10; v <= max + 1e-9; v = Math.round((v + 0.1) * 10) / 10) ticks.push(v);
  const showStress = stressed !== undefined && Math.abs(stressed - today) > 1e-6;
  const sorted = [...marks].sort((a, b) => b.value - a.value);
  return (
    <div className="min-w-0" role="img" aria-label={`Régua de preço em ${unit}. Referência hoje ${num(today, 2)}. ${showStress ? `${stressLabel}: ${num(stressed!, 2)}. ` : ''}Gatilhos: ${marks.map((m) => `${num(m.value, 2)} (${m.label})`).join('; ')}.`}>
      <div className="relative mx-2 h-[4.5rem]">
        {/* marcador de hoje e sob esforço */}
        <div className="absolute inset-x-0 top-0 h-9">
          <span className="absolute top-0 -translate-x-1/2 whitespace-nowrap font-mono text-xs text-fg tnum" style={{ left: x(today) }}>
            hoje {num(today, 2)}
          </span>
          <span className="absolute bottom-0 h-4 w-0.5 -translate-x-1/2 bg-fg" style={{ left: x(today) }} />
        </div>
        {/* eixo */}
        <div className="absolute inset-x-0 top-9 h-2 rounded-full bg-surface-2" />
        {showStress && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-9 h-2 origin-left rounded-full bg-[color-mix(in_oklab,var(--fg)_30%,var(--surface))]"
            initial={false}
            animate={{ x: `${pos(Math.min(today, stressed!))}%`, scaleX: (pos(Math.max(today, stressed!)) - pos(Math.min(today, stressed!))) / 100 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: EASE_OUT }}
          />
        )}
        {showStress && (
          <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-9" initial={false} animate={{ x: `${pos(stressed!)}%` }} transition={{ duration: reduce ? 0 : 0.5, ease: EASE_OUT }}>
            <span className="absolute bottom-0 left-0 flex -translate-x-1/2 flex-col items-center">
              <span className="mb-0.5 whitespace-nowrap rounded-xs bg-fg px-1.5 py-0.5 font-mono text-xs text-bg tnum">{num(stressed!, 2)}</span>
              <span className="h-2 w-0.5 bg-fg" />
            </span>
          </motion.div>
        )}
        {sorted.map((m) => (
          <span key={m.value} className="absolute top-8 h-4 w-0.5 -translate-x-1/2 bg-warn" style={{ left: x(m.value) }} />
        ))}
        {/* graduações */}
        {ticks.map((t) => (
          <span key={t} className="absolute top-[3.25rem] -translate-x-1/2 font-mono text-[11px] text-muted tnum" style={{ left: x(t) }}>
            {Math.abs((t * 10) % 5) < 1e-6 ? num(t, 1) : ''}
          </span>
        ))}
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        <li>Limiares em {unit}:</li>
        {sorted.map((m) => (
          <li key={m.value} className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-0.5 bg-warn" />
            <span className="font-mono text-fg tnum">{num(m.value, 2)}</span> {m.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ barra de resultado (divergente) */

/** Resultado previsto em % do montante: barra a partir do zero, perda à esquerda. */
export function ResultBar({ value, min = -0.1, max = 0.12, label }: { value: number; min?: number; max?: number; label: string }) {
  const reduce = useReducedMotion();
  const zero = (-min / (max - min)) * 100;
  const v = Math.max(min, Math.min(max, value));
  const t = { duration: reduce ? 0 : 0.4, ease: EASE_OUT };
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-3 w-24 shrink-0 overflow-hidden rounded-xs bg-surface-2" aria-hidden>
        <motion.span className="absolute inset-y-0 origin-right rounded-l-xs bg-crit" style={{ left: 0, width: `${zero}%` }} initial={false} animate={{ scaleX: v < 0 ? v / min : 0 }} transition={t} />
        <motion.span className="absolute inset-y-0 origin-left rounded-r-xs bg-accent" style={{ left: `${zero}%`, right: 0 }} initial={false} animate={{ scaleX: v > 0 ? v / max : 0 }} transition={t} />
        <span className="absolute inset-y-0 w-px bg-[color-mix(in_oklab,var(--fg)_55%,var(--surface))]" style={{ left: `${zero}%` }} />
      </div>
      <span className={cn('font-mono tnum', value < -0.0005 ? 'text-crit-ink' : 'text-fg')} aria-label={label}>
        {signedPct(value)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ pequenos */

/** Linha de lista "rótulo · valor" alinhada, para contas e políticas. */
export function Row({ label, value, hint, className }: { label: ReactNode; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2', className)}>
      <dt className="min-w-0 text-sm text-muted">{label}</dt>
      <dd className="font-mono text-[0.9375rem] text-fg tnum">{value}</dd>
      {hint && <dd className="w-full text-sm text-muted">{hint}</dd>}
    </div>
  );
}

export const worldName = (w: WorldId) => getWorld(w).commodity;

/** Cabeçalho de cartão com ações que passam para baixo do título em ecrãs estreitos (sem espremer o título). */
export function HeaderRow({ title, description, actions, id }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-[min(100%,18rem)] flex-1">
        <h2 id={id} className="text-[1.1875rem] leading-tight">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
