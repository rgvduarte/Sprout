import type { ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '../../lib/cn';
import { eur, pct } from '../../lib/format';
import type { WorldId } from '../../data/types';

/* Peças pequenas do simulador. */

export const SIM_LABEL = 'Simulação educativa · dinheiro fictício · não representa resultados reais nem previsões';

/** Faixa permanente da simulação. */
export function SimBand({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 font-medium text-info-ink',
        compact ? 'text-[0.8125rem] leading-snug' : 'rounded-sm bg-[color-mix(in_oklab,var(--info)_10%,var(--surface))] px-4 py-2.5 text-sm',
        className,
      )}
    >
      <FlaskConical aria-hidden className={cn('shrink-0', compact ? 'mt-px size-3.5' : 'mt-0.5 size-4')} strokeWidth={1.75} />
      <span>{SIM_LABEL}</span>
    </p>
  );
}

/** Euros fictícios, sem casas decimais. */
export const fe = (v: number) => eur(Math.round(v), { decimals: 0 });
/** Euros fictícios com sinal. */
export const fes = (v: number) => (Math.round(v) === 0 ? '0 €' : eur(Math.round(v), { decimals: 0, sign: true }));
/** Resultado em % com sinal. */
export const fpct = (v: number, d = 1) => (Math.abs(v) < 0.0005 ? pct(0, d) : pct(v, d, { sign: true }));

/** Mudança do índice de referência face à entrada. */
export const refChange = (index: number) => fpct(index - 1, 0);

export const WORLD_INK: Record<WorldId, string> = { azeite: 'text-azeite-ink', agua: 'text-agua-ink', cafe: 'text-cafe-ink' };
export const WORLD_BG: Record<WorldId, string> = { azeite: 'bg-azeite', agua: 'bg-agua', cafe: 'bg-cafe' };

/** Interruptor acessível (role="switch") com área de toque de 44 px. */
export function Switch({ checked, onChange, label, description, disabled, disabledReason, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean; disabledReason?: ReactNode; id: string }) {
  return (
    <div className="flex min-h-11 items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description || disabledReason ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out',
          'after:absolute after:-inset-2.5 after:content-[""]',
          checked ? 'border-accent bg-accent' : 'border-[color-mix(in_oklab,var(--fg)_30%,var(--border))] bg-surface-2',
          'disabled:cursor-not-allowed disabled:opacity-55',
        )}
      >
        <span
          aria-hidden
          className={cn('inline-block size-[18px] rounded-full border border-[color-mix(in_oklab,var(--fg)_22%,var(--border))] bg-surface transition-transform duration-200 ease-out', checked ? 'translate-x-[21px]' : 'translate-x-[2px]')}
        />
      </button>
      <label htmlFor={id} className={cn('min-w-0', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
        <span className={cn('block text-[0.9375rem] font-medium', disabled ? 'text-muted' : 'text-fg')}>{label}</span>
        {(description || disabledReason) && (
          <span id={`${id}-d`} className="mt-0.5 block text-sm text-muted">
            {disabled ? disabledReason : description}
          </span>
        )}
      </label>
    </div>
  );
}

/** Padrão tracejado (pausa, extensão) desenhado em SVG na tinta do mundo. */
export function Hatch({ id, color = 'var(--world-ink)', className }: { id: string; color?: string; className?: string }) {
  return (
    <svg aria-hidden className={cn('block h-full w-full', className)} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
