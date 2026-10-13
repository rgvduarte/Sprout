import type { SVGProps } from 'react';
import { cn } from '../../lib/cn';
import { getWorld } from '../../data';
import type { WorldId } from '../../data/types';

/** Glifos geométricos dos mundos (traço único de 1,75, cor atual). */
export function CommodityGlyph({ world, className, ...rest }: { world: WorldId; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn('size-4 shrink-0', className)} {...rest}>
      <CommodityGlyphPaths world={world} />
    </svg>
  );
}


/** Só os traços do glifo (para usar dentro de outro SVG, viewBox 24 × 24). */
export function CommodityGlyphPaths({ world }: { world: WorldId }) {
  return (
    <>
      {world === 'azeite' && (
        <>
          <ellipse cx="10" cy="14.5" rx="5" ry="6.4" transform="rotate(-28 10 14.5)" />
          <path d="M13.4 8.6c1.2-2.4 3-3.9 5.6-4.4" />
          <path d="M16.2 5.6c1.6-1.9 3.6-2.4 5-2.1-.5 1.5-2.4 2.8-5 2.1z" />
        </>
      )}
      {world === 'agua' && (
        <>
          <path d="M3 8.5c3-2 6-2 9 0s6 2 9 0" />
          <path d="M3 13.5c3-2 6-2 9 0s6 2 9 0" />
          <path d="M3 18.5c3-2 6-2 9 0s6 2 9 0" />
          <path d="M12 2.5v8.5" />
        </>
      )}
      {world === 'cafe' && (
        <>
          <ellipse cx="12" cy="12" rx="6.2" ry="8.6" transform="rotate(35 12 12)" />
          <path d="M8.3 17.4c2.4-2.4 3.2-5.4 3.7-7.3.5-1.8 1.6-3.4 3.7-4.6" />
        </>
      )}
    </>
  );
}

/** Etiqueta de commodity: glifo + nome. `label="world"` mostra "O Olival". */
export function CommodityChip({ world, label = 'commodity', size = 'sm', className, plain }: { world: WorldId; label?: 'commodity' | 'world' | 'none'; size?: 'sm' | 'md'; className?: string; plain?: boolean }) {
  const w = getWorld(world);
  const text = label === 'world' ? w.nome : label === 'commodity' ? w.commodity : null;
  const ink = world === 'azeite' ? 'text-azeite-ink' : world === 'agua' ? 'text-agua-ink' : 'text-cafe-ink';
  const soft =
    world === 'azeite'
      ? 'bg-[color-mix(in_oklab,var(--c-azeite)_15%,var(--surface))] border-[color-mix(in_oklab,var(--c-azeite)_35%,var(--border))]'
      : world === 'agua'
        ? 'bg-[color-mix(in_oklab,var(--c-agua)_13%,var(--surface))] border-[color-mix(in_oklab,var(--c-agua)_32%,var(--border))]'
        : 'bg-[color-mix(in_oklab,var(--c-cafe)_13%,var(--surface))] border-[color-mix(in_oklab,var(--c-cafe)_32%,var(--border))]';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap font-medium leading-none',
        ink,
        !plain && cn('rounded-xs border', soft, size === 'sm' ? 'h-6 px-2 text-[0.8125rem]' : 'h-7 px-2.5 text-sm'),
        plain && 'text-sm',
        className,
      )}
      title={text ? undefined : w.commodity}
    >
      <CommodityGlyph world={world} className={size === 'md' ? 'size-[18px]' : 'size-4'} />
      {text}
      {!text && <span className="sr-only">{w.commodity}</span>}
    </span>
  );
}
