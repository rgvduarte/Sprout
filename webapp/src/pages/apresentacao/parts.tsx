import { useState, type ReactNode } from 'react';
import { useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { cn } from '../../lib/cn';
import { tidyText } from '../../lib/format';

/* =====================================================================
   Peças partilhadas da apresentação: tokens locais (gráfico da cadeia),
   cabeçalho de capítulo e utilitários de progresso.
   ===================================================================== */

/**
 * Tokens locais da apresentação, claro e escuro. Definidos aqui (e não nos
 * tokens globais) porque só esta página os usa; validados com o script do
 * dataviz: as duas tintas de série são --series-azeite e --series-agua;
 * --vc-pack (cor de cartão) marca o embalamento no co-packer.
 */
export const PAGE_CSS = `
.apr {
  --vc-producer: #c6cbba;
  --vc-packager: #4a5240;
  --vc-cost: #9ba190;
  --vc-pack: #b08f66;
  --vc-premium: var(--series-azeite);
  --vc-spread: var(--series-agua);
  --vc-hatch: #6b725f;
  --ls-far: color-mix(in oklab, var(--c-azeite) 9%, var(--bg));
  --ls-mid: color-mix(in oklab, var(--c-azeite) 17%, var(--bg));
  --ls-near: color-mix(in oklab, var(--c-azeite) 26%, var(--bg));
  --ls-contour: color-mix(in oklab, var(--c-azeite) 34%, var(--bg));
  --ls-canopy: color-mix(in oklab, var(--accent) 62%, var(--bg));
  --ls-canopy-far: color-mix(in oklab, var(--accent) 42%, var(--bg));
  --ls-line: color-mix(in oklab, var(--fg) 58%, var(--bg));
  --ls-trunk: color-mix(in oklab, var(--fg) 42%, var(--bg));
  --ls-steel: color-mix(in oklab, var(--fg) 6%, var(--surface));
  --ls-road: color-mix(in oklab, var(--fg) 16%, var(--bg));
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .apr {
    --vc-producer: #3b4234;
    --vc-packager: #b8bfab;
    --vc-cost: #646c59;
    --vc-pack: #94744e;
    --vc-hatch: #9ba390;
    --ls-canopy: color-mix(in oklab, var(--accent) 48%, var(--bg));
    --ls-canopy-far: color-mix(in oklab, var(--accent) 30%, var(--bg));
  }
}
:root[data-theme="dark"] .apr {
  --vc-producer: #3b4234;
  --vc-packager: #b8bfab;
  --vc-cost: #646c59;
  --vc-pack: #94744e;
  --vc-hatch: #9ba390;
  --ls-canopy: color-mix(in oklab, var(--accent) 48%, var(--bg));
  --ls-canopy-far: color-mix(in oklab, var(--accent) 30%, var(--bg));
}
`;

/** Contentor de largura da página (alinhado com o resto da app). */
export function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

/** Título de capítulo: sem kicker; o título fala por si. */
export function ChapterHead({ title, lead, className, id }: { title: ReactNode; lead?: ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <h2 id={id} className="text-[clamp(1.875rem,1.25rem+1.8vw,2.75rem)] leading-[1.06] tracking-[-0.02em]">
        {title}
      </h2>
      {lead && <p className="mt-3 max-w-[60ch] text-[1.0625rem] leading-relaxed text-muted sm:text-lg">{typeof lead === 'string' ? tidyText(lead) : lead}</p>}
    </div>
  );
}

/** Índice inteiro derivado de um MotionValue; só re-renderiza quando muda. */
export function useStep(progress: MotionValue<number>, toStep: (v: number) => number): number {
  const [step, setStep] = useState(() => toStep(progress.get()));
  useMotionValueEvent(progress, 'change', (v) => {
    const s = toStep(v);
    setStep((prev) => (prev === s ? prev : s));
  });
  return step;
}

/**
 * Os capítulos fixos precisam de altura: abaixo de 760 px de viewport ficam
 * empilhados e estáticos (o conteúdo não cabe num ecrã sem ser cortado).
 */
export const useTallViewport = () => useMediaQuery('(min-height: 760px)', true);

/**
 * Mapeia um intervalo do progresso para valores (com limites), por função.
 * Usamos uma função em vez de useTransform(v, [a, b], [x, y]) porque o motion
 * acelera esses mapeamentos de opacidade com ScrollTimeline nativa e, dentro
 * de capítulos fixos (sticky), o resultado não segue o progresso do capítulo.
 */
export function useRange(progress: MotionValue<number>, [a, b]: [number, number], [from, to]: [number, number]): MotionValue<number> {
  return useTransform(progress, (v) => {
    const t = b === a ? (v >= b ? 1 : 0) : Math.max(0, Math.min(1, (v - a) / (b - a)));
    return from + (to - from) * t;
  });
}
