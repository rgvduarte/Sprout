import { getWorld } from '../../data';
import type { Lot } from '../../data';
import { cn } from '../../lib/cn';
import { date as fmtDate } from '../../lib/format';
import { nextMilestone } from './positions';

/**
 * A jornada do lote numa linha: seis marcos (cumpridos cheios, o atual em anel)
 * e o próximo marco com data. Versão densa do JourneyTrack para listas e
 * ecrãs estreitos.
 */
export function JourneyMini({ lot, className, showNext = true }: { lot: Pick<Lot, 'world' | 'milestones'>; className?: string; showNext?: boolean }) {
  const labels = getWorld(lot.world).journeyLabels;
  const doneCount = lot.milestones.filter((m) => m.done).length;
  const next = nextMilestone(lot);
  const last = lot.milestones[doneCount - 1];
  return (
    <div className={cn('min-w-0', className)} data-world={lot.world}>
      <ol className="flex items-center" aria-label={`Jornada: ${doneCount} de ${lot.milestones.length} etapas cumpridas`}>
        {lot.milestones.map((m, i) => {
          const done = m.done;
          const current = i === doneCount;
          return (
            <li key={m.stage} className="flex min-w-0 flex-1 items-center last:flex-none">
              <span
                className={cn(
                  'relative inline-block size-3 shrink-0 rounded-full border-2',
                  done ? 'border-world-ink bg-world-ink' : current ? 'border-world-ink bg-surface' : 'border-[color-mix(in_oklab,var(--fg)_22%,var(--border))] bg-surface',
                )}
              >
                <span className="sr-only">
                  {labels[m.stage]}: {done ? `cumprido${m.date ? ` a ${fmtDate(m.date)}` : ''}` : m.planned ? `previsto para ${fmtDate(m.planned)}` : 'por cumprir'}
                </span>
              </span>
              {i < lot.milestones.length - 1 && <span aria-hidden className={cn('mx-0.5 h-0.5 min-w-2 flex-1 rounded-full', i < doneCount - 1 ? 'bg-world-ink' : 'bg-border')} />}
            </li>
          );
        })}
      </ol>
      {showNext && (
        <p className="mt-2 text-sm leading-snug text-muted">
          {last && (
            <span className="font-medium text-fg">
              {labels[last.stage]}
              {last.date && <span className="font-mono font-normal tnum text-muted"> {fmtDate(last.date)}</span>}
            </span>
          )}
          {next && (
            <>
              {last ? ' · a seguir: ' : 'A seguir: '}
              {labels[next.stage].toLowerCase()}
              {next.planned && <span className="font-mono tnum"> prev. {fmtDate(next.planned)}</span>}
            </>
          )}
        </p>
      )}
    </div>
  );
}
