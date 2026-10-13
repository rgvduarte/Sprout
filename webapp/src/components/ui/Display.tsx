import type { ReactNode } from 'react';
import { ShieldAlert, Info, FlaskConical, Inbox } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { Tone } from '../../data/types';
import { TONE_DOT } from './Badge';

/* ------------------------------------------------------------ KeyValue */

export interface KeyValueItem {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  /** valor numérico/ID: usa a mono tabular */
  mono?: boolean;
}

/** Lista de pares rótulo/valor (dl). `columns` em ecrãs largos. */
export function KeyValue({ items, columns = 2, className, dense }: { items: KeyValueItem[]; columns?: 1 | 2 | 3 | 4; className?: string; dense?: boolean }) {
  return (
    <dl
      className={cn(
        'grid gap-x-6',
        dense ? 'gap-y-2' : 'gap-y-4',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {items.map((it, i) => (
        <div key={i} className="min-w-0">
          <dt className="text-sm text-muted">{it.label}</dt>
          <dd className={cn('mt-0.5 text-fg', it.mono && 'font-mono text-[0.9375rem] tnum')}>{it.value}</dd>
          {it.hint && <dd className="mt-0.5 text-sm text-muted">{it.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------ Meter */

export interface MeterProps {
  /** 0–1 */
  value: number;
  label: string;
  /** texto do valor (por omissão percentagem) */
  valueLabel?: string;
  tone?: Tone;
  /** mostra o rótulo e o valor por cima da barra */
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/** Barra de progresso com trilho do mesmo tom (mais claro). */
export function Meter({ value, label, valueLabel, tone = 'accent', showLabel = true, size = 'md', className }: MeterProps) {
  const v = Math.max(0, Math.min(1, value));
  const pctText = valueLabel ?? `${Math.round(v * 100)} %`;
  const color = `var(--${tone === 'accent' ? 'accent' : tone === 'azeite' ? 'c-azeite' : tone === 'agua' ? 'c-agua' : tone === 'cafe' ? 'c-cafe' : tone === 'neutral' ? 'muted' : tone})`;
  return (
    <div className={cn('min-w-0', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
          <span className="truncate text-muted">{label}</span>
          <span className="font-mono tnum text-fg">{pctText}</span>
        </div>
      )}
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        aria-valuetext={pctText}
        className={cn('relative w-full overflow-hidden rounded-full', size === 'sm' ? 'h-1.5' : 'h-2')}
        style={{ background: `color-mix(in oklab, ${color} 18%, var(--surface-2))` }}
      >
        <div className="h-full origin-left rounded-full transition-transform duration-500 ease-out" style={{ background: color, transform: `scaleX(${v})` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ StatTile */

/** Número que é o ponto da vista. Algarismos proporcionais, sans. */
export function StatTile({ label, value, sub, tone, className }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center gap-2 text-sm text-muted">
        {tone && <span aria-hidden className={cn('size-2 rounded-full', TONE_DOT[tone])} />}
        {label}
      </div>
      <div className="mt-1 text-[1.625rem] font-semibold leading-tight tracking-[-0.01em] text-fg pnum">{value}</div>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ EmptyState */

export function EmptyState({ title, body, action, icon, className }: { title: string; body?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-surface px-5 py-8 sm:px-8', className)}>
      <span aria-hidden className="text-muted">{icon ?? <Inbox className="size-6" strokeWidth={1.5} />}</span>
      <div>
        <p className="font-display text-lg font-semibold text-fg">{title}</p>
        {body && <p className="measure mt-1 text-muted">{body}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------ Skeleton */

export function Skeleton({ className, label = 'A carregar' }: { className?: string; label?: string }) {
  return <div role="status" aria-label={label} className={cn('skeleton h-4 w-full', className)} />;
}

/* ------------------------------------------------------------ Avisos */

/**
 * Nota de capital em risco. Obrigatória em todas as vistas com dinheiro real.
 * Linguagem neutra: "liquidação prevista", "montante financiado".
 */
export function RiskNote({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <p className={cn('flex items-start gap-2 text-sm text-muted', !compact && 'max-w-[68ch]', className)}>
      <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warn-ink" strokeWidth={1.75} />
      <span>
        <strong className="font-semibold text-fg">Capital em risco.</strong>{' '}
        {compact
          ? 'A liquidação prevista não é garantida e pode haver perda.'
          : 'A liquidação prevista é uma estimativa, não uma promessa: o preço pode cair, a venda pode atrasar e pode haver perda de parte ou da totalidade do capital. Não há mercado secundário antes da liquidação.'}
      </span>
    </p>
  );
}

/**
 * Aviso genérico (demonstração, simulação, regulamentar). Por omissão é texto
 * com ícone (cabe dentro de um Card sem criar um cartão aninhado); `boxed`
 * dá-lhe fundo próprio para usar diretamente na página.
 */
export function Disclaimer({ children, kind = 'info', className, title, boxed }: { children: ReactNode; kind?: 'info' | 'simulacao' | 'regulatorio'; className?: string; title?: string; boxed?: boolean }) {
  const Icon = kind === 'simulacao' ? FlaskConical : kind === 'regulatorio' ? ShieldAlert : Info;
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-3 text-sm text-fg',
        boxed && 'rounded-sm px-4 py-3',
        boxed && (kind === 'simulacao' ? 'bg-[color-mix(in_oklab,var(--info)_10%,var(--surface))]' : 'bg-surface-2'),
        className,
      )}
    >
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', kind === 'simulacao' ? 'text-info-ink' : kind === 'regulatorio' ? 'text-warn-ink' : 'text-muted')} strokeWidth={1.75} />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5', 'text-muted [&_strong]:text-fg')}>{children}</div>
      </div>
    </div>
  );
}

/** Faixa fixa das simulações: "Simulação educativa · dinheiro fictício · não representa resultados reais nem previsões". */
export function SimulationLabel({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-start gap-2 text-sm font-medium text-info-ink', className)}>
      <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
      Simulação educativa · dinheiro fictício · não representa resultados reais nem previsões
    </p>
  );
}
