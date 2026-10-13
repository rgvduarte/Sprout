import type { HTMLAttributes, ReactNode } from 'react';
import type { LotStatus, Tone } from '../../data/types';
import { STATUS_LABEL, STATUS_TONE } from '../../data';
import { cn } from '../../lib/cn';

export type { Tone };

/** Fundo suave e tinta legível (≥ 4,5:1) por tom. */
export const TONE_SOFT: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-neutral-ink border-border',
  accent: 'bg-accent-soft text-accent border-[color-mix(in_oklab,var(--accent)_30%,var(--border))]',
  ok: 'bg-[color-mix(in_oklab,var(--ok)_14%,var(--surface))] text-ok-ink border-[color-mix(in_oklab,var(--ok)_32%,var(--border))]',
  warn: 'bg-[color-mix(in_oklab,var(--warn)_14%,var(--surface))] text-warn-ink border-[color-mix(in_oklab,var(--warn)_32%,var(--border))]',
  crit: 'bg-[color-mix(in_oklab,var(--crit)_12%,var(--surface))] text-crit-ink border-[color-mix(in_oklab,var(--crit)_30%,var(--border))]',
  info: 'bg-[color-mix(in_oklab,var(--info)_13%,var(--surface))] text-info-ink border-[color-mix(in_oklab,var(--info)_30%,var(--border))]',
  azeite: 'bg-[color-mix(in_oklab,var(--c-azeite)_15%,var(--surface))] text-azeite-ink border-[color-mix(in_oklab,var(--c-azeite)_35%,var(--border))]',
  agua: 'bg-[color-mix(in_oklab,var(--c-agua)_13%,var(--surface))] text-agua-ink border-[color-mix(in_oklab,var(--c-agua)_32%,var(--border))]',
  cafe: 'bg-[color-mix(in_oklab,var(--c-cafe)_13%,var(--surface))] text-cafe-ink border-[color-mix(in_oklab,var(--c-cafe)_32%,var(--border))]',
  seal: 'bg-[color-mix(in_oklab,var(--seal)_12%,var(--surface))] text-seal-ink border-[color-mix(in_oklab,var(--seal)_30%,var(--border))]',
};

/** Cor sólida do tom (pontos, marcas). */
export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-muted',
  accent: 'bg-accent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  crit: 'bg-crit',
  info: 'bg-info',
  azeite: 'bg-azeite',
  agua: 'bg-agua',
  cafe: 'bg-cafe',
  seal: 'bg-seal',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: 'sm' | 'md';
  /** ponto de cor à esquerda */
  dot?: boolean;
  icon?: ReactNode;
}

/** Etiqueta curta com tom. Para estados use StatusPill. */
export function Badge({ tone = 'neutral', size = 'sm', dot, icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-xs border font-medium leading-none',
        size === 'sm' ? 'h-6 px-2 text-[0.8125rem]' : 'h-7 px-2.5 text-sm',
        TONE_SOFT[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', TONE_DOT[tone])} />}
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Alias semântico. */
export const Pill = Badge;

export interface StatusPillProps extends Omit<BadgeProps, 'tone'> {
  /** estado de lote (usa rótulo e tom do domínio) */
  status?: LotStatus;
  /** ou rótulo/tom livres */
  label?: string;
  tone?: Tone;
}

/** Estado com ponto + texto (nunca só cor). */
export function StatusPill({ status, label, tone, ...rest }: StatusPillProps) {
  const t = tone ?? (status ? STATUS_TONE[status] : 'neutral');
  const text = label ?? (status ? STATUS_LABEL[status] : '');
  return (
    <Badge tone={t} dot {...rest}>
      {text}
    </Badge>
  );
}
