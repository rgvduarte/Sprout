import { useId, useState, type ReactNode } from 'react';
import { Check, Lock } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useRole, ROLE_LABEL, type Role } from '../../state';
import { Button } from './Button';

/* ------------------------------------------------------------ Tooltip */

/**
 * Dica curta em hover e foco. O conteúdo também deve estar acessível de outra
 * forma (texto visível, tabela). Não usar para informação essencial.
 */
export function Tooltip({ content, children, side = 'top', className }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom'; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId().replace(/:/g, '');
  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      aria-describedby={open ? `tt-${id}` : undefined}
    >
      {children}
      <span
        id={`tt-${id}`}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-40 w-max max-w-[260px] -translate-x-1/2 rounded-sm border border-border bg-surface px-2.5 py-1.5 text-left text-sm text-fg shadow-pop transition-opacity duration-150',
          side === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]',
          open ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden={!open}
      >
        {content}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------ Stepper */

export interface Step {
  id: string;
  label: string;
  description?: string;
}

/** Passos numerados (a sequência é informação: onboarding, simulador). */
export function Stepper({ steps, current, className, onStepClick }: { steps: Step[]; current: number; className?: string; onStepClick?: (index: number) => void }) {
  return (
    <ol className={cn('flex min-w-0 flex-wrap gap-x-2 gap-y-3', className)} aria-label="Passos">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        const inner = (
          <>
            <span
              className={cn(
                'inline-flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-sm tnum',
                state === 'done' && 'border-accent bg-accent text-accent-fg',
                state === 'current' && 'border-accent bg-accent-soft text-accent',
                state === 'todo' && 'border-border bg-surface text-muted',
              )}
            >
              {state === 'done' ? <Check aria-hidden className="size-4" strokeWidth={2.25} /> : i + 1}
            </span>
            <span className="min-w-0 text-left">
              <span className={cn('block text-sm font-medium leading-tight', state === 'todo' ? 'text-muted' : 'text-fg')}>{s.label}</span>
              {s.description && <span className="block text-xs text-muted">{s.description}</span>}
            </span>
          </>
        );
        return (
          <li key={s.id} className="flex min-w-0 items-center gap-2" aria-current={state === 'current' ? 'step' : undefined}>
            {onStepClick && i < current ? (
              <button type="button" onClick={() => onStepClick(i)} className="flex min-h-11 items-center gap-2 rounded-sm pr-2 hover:bg-surface-2">
                {inner}
              </button>
            ) : (
              <span className="flex min-h-11 items-center gap-2 pr-2">{inner}</span>
            )}
            {i < steps.length - 1 && <span aria-hidden className="hidden h-px w-6 bg-border sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------ Timeline */

export interface TimelineItem {
  id: string;
  date?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  state?: 'done' | 'current' | 'upcoming';
  icon?: ReactNode;
}

/** Linha vertical de acontecimentos. Para a jornada física do lote use JourneyTrack. */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative min-w-0', className)}>
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-4 pb-6 last:pb-0">
          {i < items.length - 1 && <span aria-hidden className={cn('absolute left-[7px] top-5 h-[calc(100%-12px)] w-px', it.state === 'done' ? 'bg-accent' : 'bg-border')} />}
          <span
            aria-hidden
            className={cn(
              'relative mt-1.5 size-[15px] shrink-0 rounded-full border-2',
              it.state === 'done' && 'border-accent bg-accent',
              it.state === 'current' && 'border-accent bg-surface',
              (!it.state || it.state === 'upcoming') && 'border-border bg-surface',
            )}
          />
          <div className="min-w-0">
            {it.date && <div className="font-mono text-sm text-muted tnum">{it.date}</div>}
            <div className={cn('font-medium', it.state === 'upcoming' ? 'text-muted' : 'text-fg')}>{it.title}</div>
            {it.body && <div className="mt-0.5 text-sm text-muted">{it.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------ FilterBar */

/** Uma linha de filtros, alinhada à esquerda, por cima do que filtra. */
export function FilterBar({ children, className, label = 'Filtros', trailing }: { children: ReactNode; className?: string; label?: string; trailing?: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cn('mb-5 flex min-w-0 flex-wrap items-end gap-3', className)}>
      {children}
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ NoAccess */

/** Estado sem acesso: explica e oferece mudar de papel, em vez de falhar. */
export function NoAccess({ title = 'Este ecrã é da equipa Sprout', body, allowed = ['equipa'] }: { title?: string; body?: ReactNode; allowed?: Role[] }) {
  const { setRole, roleLabel } = useRole();
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-start gap-4 px-4 py-16 sm:px-6">
      <span aria-hidden className="inline-flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-muted">
        <Lock className="size-5" strokeWidth={1.75} />
      </span>
      <h1 className="text-[1.75rem]">{title}</h1>
      <p className="text-muted">{body ?? `Estás a ver a plataforma como ${roleLabel}. Esta área só está disponível para ${allowed.map((r) => ROLE_LABEL[r]).join(' ou ')}.`}</p>
      <div className="flex flex-wrap gap-2">
        {allowed.map((r) => (
          <Button key={r} variant="primary" onClick={() => setRole(r)}>
            Ver como {ROLE_LABEL[r]}
          </Button>
        ))}
      </div>
    </div>
  );
}
