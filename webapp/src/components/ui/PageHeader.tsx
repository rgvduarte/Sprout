import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface PageHeaderProps {
  title: ReactNode;
  /** uma linha que diz o que o ecrã faz */
  description?: ReactNode;
  /** ações à direita (botões) */
  actions?: ReactNode;
  /** chips de contexto por baixo da descrição (Badge, StatusPill, CommodityChip) */
  meta?: ReactNode;
  className?: string;
  /** conteúdo grande à direita em ecrãs largos (p.ex. um LotGauge) */
  aside?: ReactNode;
}

/**
 * Cabeçalho de página. Sem eyebrow/kicker acima do título: o título fala
 * por si. Mais espaço acima do que abaixo.
 */
export function PageHeader({ title, description, actions, meta, className, aside }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-5 pb-6 pt-2 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-[1.875rem] leading-[1.08] sm:text-[2.375rem]" style={{ letterSpacing: '-0.018em' }}>
          {title}
        </h1>
        {description && <p className="mt-2 max-w-[56ch] text-[1.0625rem] text-muted">{description}</p>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {(actions || aside) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          {aside}
          {actions}
        </div>
      )}
    </header>
  );
}

/** Contentor de página com largura máxima e margens laterais (16 px no telemóvel). */
export function Page({ children, className, width = 'default' }: { children: ReactNode; className?: string; width?: 'default' | 'wide' | 'narrow' | 'full' }) {
  return (
    <div
      className={cn(
        'mx-auto w-full min-w-0 px-4 pb-16 pt-6 sm:px-6 lg:px-8',
        width === 'default' && 'max-w-[1240px]',
        width === 'wide' && 'max-w-[1440px]',
        width === 'narrow' && 'max-w-[860px]',
        width === 'full' && 'max-w-none px-0 sm:px-0 lg:px-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Secção com título h2 e espaço acima maior do que abaixo. */
export function Section({ title, description, actions, children, className, id }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn('mt-10 first:mt-0', className)} aria-labelledby={id && title ? `${id}-title` : undefined}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 flex-[1_1_16rem]">
            {title && (
              <h2 id={id ? `${id}-title` : undefined} className="text-[1.375rem] leading-tight">
                {title}
              </h2>
            )}
            {description && <p className="measure mt-1 text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
