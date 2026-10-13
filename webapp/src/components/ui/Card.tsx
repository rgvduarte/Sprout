import type React from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { tidyText } from '../../lib/format';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'article' | 'div' | 'aside';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** fundo tingido do mundo (requer data-world num antepassado) */
  tinted?: boolean;
}

/**
 * Superfície simples: fundo, borda de 1 px, raio pequeno. Sem sombra (as sombras
 * são só para sobreposições). Não aninhar cartões: dentro de um Card use
 * divisórias, KeyValue ou listas.
 */
export function Card({ as: Tag = 'section', padding = 'md', tinted, className, children, ref, ...rest }: CardProps & { ref?: React.Ref<HTMLElement> }) {
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn(
        'min-w-0 rounded-md border border-border',
        tinted ? 'bg-world-soft border-world-line' : 'bg-surface',
        padding === 'sm' && 'p-3 sm:p-4',
        padding === 'md' && 'p-4 sm:p-5',
        padding === 'lg' && 'p-5 sm:p-7',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** nível do título (por omissão h2) */
  level?: 2 | 3;
  className?: string;
  id?: string;
}

export function CardHeader({ title, description, actions, level = 2, className, id }: CardHeaderProps) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2', className)}>
      {/* base de 14rem: com ações largas, as ações passam para baixo em vez de espremer o título */}
      <div className="min-w-0 flex-[1_1_14rem]">
        <H id={id} className={cn(level === 2 ? 'text-[1.1875rem]' : 'text-[1.0625rem]', 'leading-tight')}>
          {title}
        </H>
        {description && <p className="measure mt-1 text-sm text-muted">{typeof description === 'string' ? tidyText(description) : description}</p>}
      </div>
      {actions && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Divisória interna (em vez de cartões aninhados). */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('my-4 border-border', className)} />;
}
