import { useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, type MotionValue } from 'motion/react';
import { Sprout, FlaskConical, Container, Store, Truck, Landmark } from 'lucide-react';
import { getWorld } from '../../data';
import type { JourneyStage, Lot, Milestone, WorldId } from '../../data/types';
import { cn } from '../../lib/cn';
import { date as fmtDate } from '../../lib/format';
import { EASE_OUT } from './motion';

/* =====================================================================
   JourneyTrack · a missão física do lote: Colhido → Analisado → Em depósito
   → Em venda → Expedido → Liquidado. Os marcos acendem com eventos reais.
   ===================================================================== */

const ICONS: Record<JourneyStage, typeof Sprout> = {
  colhido: Sprout,
  analisado: FlaskConical,
  'em-deposito': Container,
  'em-venda': Store,
  expedido: Truck,
  liquidado: Landmark,
};

export interface JourneyTrackProps {
  /** lote (usa milestones e mundo) ou marcos soltos */
  lot?: Pick<Lot, 'world' | 'milestones'>;
  world?: WorldId;
  milestones?: Milestone[];
  orientation?: 'auto' | 'horizontal' | 'vertical';
  /** acende marcos com o scroll (0–1); sem ele mostra o estado real */
  progress?: MotionValue<number>;
  /** esconde notas (versão compacta para listas) */
  compact?: boolean;
  className?: string;
}

export function JourneyTrack({ lot, world: worldProp, milestones: msProp, orientation = 'auto', progress, compact, className }: JourneyTrackProps) {
  const world = lot?.world ?? worldProp ?? 'azeite';
  const milestones = lot?.milestones ?? msProp ?? [];
  const labels = getWorld(world).journeyLabels;
  const reduce = useReducedMotion();
  const doneCount = milestones.filter((m) => m.done).length;
  const [lit, setLit] = useState(progress ? 0 : doneCount);
  useMotionValueEvent(progress ?? ({ on: () => () => {} } as unknown as MotionValue<number>), 'change', (v) => {
    const n = Math.round(Math.max(0, Math.min(1, v)) * doneCount);
    setLit((prev) => (prev === n ? prev : n));
  });
  const shown = progress ? lit : doneCount;
  const currentIdx = shown < milestones.length ? shown : -1;
  const vertical = orientation === 'vertical';
  const auto = orientation === 'auto';

  return (
    <ol
      data-world={world}
      aria-label={`Jornada do lote: ${doneCount} de ${milestones.length} etapas cumpridas`}
      className={cn('relative grid min-w-0', vertical ? 'grid-cols-1 gap-0' : auto ? 'grid-cols-1 gap-0 sm:grid-cols-6 sm:gap-2' : 'grid-cols-6 gap-2', className)}
    >
      {milestones.map((m, i) => {
        const Icon = ICONS[m.stage];
        const on = i < shown;
        const current = i === currentIdx;
        const last = i === milestones.length - 1;
        return (
          <li key={m.stage} className={cn('relative flex min-w-0 gap-3 pb-5', !vertical && auto && 'sm:flex-col sm:gap-2 sm:pb-0', !vertical && !auto && 'flex-col gap-2 pb-0')} aria-current={current ? 'step' : undefined}>
            {/* conector */}
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute bg-border',
                  vertical || auto ? 'left-[19px] top-10 h-[calc(100%-36px)] w-0.5' : '',
                  !vertical && auto && 'sm:left-10 sm:right-[-8px] sm:top-[19px] sm:h-0.5 sm:w-auto',
                  !vertical && !auto && 'left-10 right-[-8px] top-[19px] h-0.5',
                )}
              >
                <motion.span
                  className={cn('absolute inset-0 origin-top bg-world-ink', !vertical && auto && 'sm:origin-left', !vertical && !auto && 'origin-left')}
                  initial={false}
                  animate={{ opacity: i < shown - 1 ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.35, ease: EASE_OUT }}
                />
              </span>
            )}
            <motion.span
              className={cn(
                'relative z-[1] inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300',
                on ? 'border-world-ink bg-world text-[var(--surface)]' : current ? 'border-world-ink bg-surface text-world-ink' : 'border-border bg-surface text-muted',
              )}
              initial={false}
              animate={on && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              <Icon aria-hidden className="size-[18px]" strokeWidth={1.75} />
            </motion.span>
            <div className="min-w-0 pt-1 sm:pt-0">
              <p className={cn('text-[0.9375rem] font-semibold leading-tight', on || current ? 'text-fg' : 'text-muted')}>
                {labels[m.stage]}
                <span className="sr-only">{m.done ? ' · cumprido' : ' · por cumprir'}</span>
              </p>
              <p className="mt-0.5 font-mono text-[13px] text-muted tnum">{m.date ? fmtDate(m.date) : m.planned ? `prev. ${fmtDate(m.planned)}` : '—'}</p>
              {!compact && <p className="mt-1 text-sm text-muted">{m.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
