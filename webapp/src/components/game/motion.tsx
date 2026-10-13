import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { cn } from '../../lib/cn';
import { useIsDesktop } from '../../lib/useMediaQuery';

/* =====================================================================
   Primitivas de movimento e scroll. Regras: o scroll nunca é sequestrado,
   o conteúdo está visível em repouso, o movimento reduzido mostra o estado
   final. Curva: cubic-bezier(0.16, 1, 0.3, 1).
   ===================================================================== */

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const DUR = { feedback: 0.12, state: 0.22, view: 0.4, focal: 0.7 } as const;

/** true quando há espaço e preferência para movimento rico (≥ 900 px e sem movimento reduzido). */
export function useRichMotion(): boolean {
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  return desktop && !reduce;
}

/** MotionValue constante (estado final) para fallbacks estáticos. */
export function useStaticProgress(value = 1): MotionValue<number> {
  return useMotionValue(value);
}

/**
 * Progresso 0–1 de uma secção pelo viewport. Por omissão de quando o topo
 * entra por baixo até o fundo sair por cima.
 */
export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
  offset: NonNullable<Parameters<typeof useScroll>[0]>['offset'] = ['start end', 'end start'],
): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: ref, offset });
  return scrollYProgress;
}

/* ------------------------------------------------------------ Reveal */

/**
 * Entrada única e discreta para blocos abaixo da dobra. Nunca esconde texto:
 * em repouso o conteúdo está visível; só elementos ainda fora do ecrã ao montar
 * fazem uma subida curta com opacidade parcial.
 */
export function Reveal({ children, className, delay = 0, y = 16, as = 'div' }: { children: ReactNode; className?: string; delay?: number; y?: number; as?: 'div' | 'section' | 'li' | 'article' }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  useLayoutEffect(() => {
    if (reduce || !ref.current || typeof IntersectionObserver === 'undefined') return;
    const top = ref.current.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.95) setArmed(true);
  }, [reduce]);

  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      ref={ref}
      className={className}
      initial={false}
      animate={armed && !inView ? { opacity: 0.4, y } : { opacity: 1, y: 0 }}
      transition={{ duration: armed ? 0.55 : 0, delay: armed ? delay : 0, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------ ParallaxLayer */

/** Camada decorativa com deslocamento ligado ao scroll. Desligada < 900 px e com movimento reduzido. */
export function ParallaxLayer({ children, distance = 40, className }: { children: ReactNode; distance?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rich = useRichMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);
  return (
    <motion.div ref={ref} aria-hidden className={cn('pointer-events-none', className)} style={rich ? { y } : undefined}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------ CountUp */

/**
 * Número que conta até ao valor. Mostra o valor final no primeiro frame; só
 * conta a partir de `from` se estiver abaixo da dobra (startOnView) ou quando
 * o valor muda. Usar para grandezas físicas (kg, paletes), não para euros.
 */
export function CountUp({ value, format = (n) => String(Math.round(n)), from = 0, startOnView = false, duration = 0.9, className }: { value: number; format?: (n: number) => string; from?: number; startOnView?: boolean; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const pendingFromView = useRef(false);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useLayoutEffect(() => {
    if (!startOnView || reduce || !ref.current) return;
    if (ref.current.getBoundingClientRect().top > window.innerHeight) {
      pendingFromView.current = true;
      setDisplay(from);
    }
    // só ao montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pendingFromView.current && inView) {
      pendingFromView.current = false;
      const c = animate(from, value, { duration, ease: EASE_OUT, onUpdate: setDisplay });
      prev.current = value;
      return () => c.stop();
    }
  }, [inView, from, value, duration]);

  useEffect(() => {
    if (prev.current === value || pendingFromView.current) return;
    if (reduce) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const c = animate(prev.current, value, { duration: Math.min(duration, 0.6), ease: EASE_OUT, onUpdate: setDisplay });
    prev.current = value;
    return () => c.stop();
  }, [value, reduce, duration]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden>{format(display)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/* ------------------------------------------------------------ DrawPath */

/**
 * Caminho SVG que se desenha (pathLength). Com `progress` fica ligado ao
 * scroll; sem ele desenha-se uma vez ao entrar no ecrã. Usar dentro de <svg>.
 */
export function DrawPath({ d, progress, stroke = 'currentColor', strokeWidth = 2, className, duration = 0.9, fill = 'none' }: { d: string; progress?: MotionValue<number>; stroke?: string; strokeWidth?: number; className?: string; duration?: number; fill?: string }) {
  const ref = useRef<SVGPathElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [below, setBelow] = useState(false);
  useLayoutEffect(() => {
    if (!ref.current || reduce || progress) return;
    if (ref.current.getBoundingClientRect().top > window.innerHeight) setBelow(true);
  }, [reduce, progress]);

  if (progress) {
    return <motion.path ref={ref} d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ pathLength: progress }} />;
  }
  return (
    <motion.path
      ref={ref}
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={false}
      animate={{ pathLength: below && !inView ? 0 : 1 }}
      transition={{ duration: below ? duration : 0, ease: EASE_OUT }}
    />
  );
}

/* ------------------------------------------------------------ Chapter */

export interface ChapterProps {
  id: string;
  /** rótulo para o ScrollProgress */
  label?: string;
  /** altura total do capítulo em vh (100–250). O conteúdo fica fixo (sticky) durante esse percurso. */
  heightVh?: number;
  /** recebe o progresso 0–1 do capítulo; em fallback recebe 1 (estado final) */
  children: ReactNode | ((progress: MotionValue<number>, rich: boolean) => ReactNode);
  className?: string;
  /** classes do painel fixo */
  stickyClassName?: string;
  /** força o modo estático */
  static?: boolean;
}

/**
 * Capítulo com painel fixo (sticky) e orçamento de altura ≤ 250vh.
 * Abaixo de 900 px ou com movimento reduzido: secção empilhada, estado final.
 */
export function Chapter({ id, label, heightVh = 200, children, className, stickyClassName, static: forceStatic }: ChapterProps) {
  const ref = useRef<HTMLElement>(null);
  const rich = useRichMotion() && !forceStatic;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const finalState = useStaticProgress(1);
  const h = Math.max(100, Math.min(250, heightVh));
  const content = typeof children === 'function' ? children(rich ? scrollYProgress : finalState, rich) : children;
  if (!rich) {
    return (
      <section ref={ref} id={id} data-chapter={label} className={cn('relative py-14 sm:py-20', className)}>
        {content}
      </section>
    );
  }
  return (
    <section ref={ref} id={id} data-chapter={label} className={cn('relative', className)} style={{ height: `${h}vh` }}>
      <div className={cn('sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden', stickyClassName)}>{content}</div>
    </section>
  );
}

/* ------------------------------------------------------------ ScrollProgress */

export interface ScrollChapter {
  id: string;
  label: string;
}

/**
 * Barra fina de progresso de leitura com rótulos de capítulo (clicáveis).
 * O capítulo ativo é o que ocupa o meio do ecrã.
 */
export function ScrollProgress({ chapters, className, top = 0 }: { chapters: ScrollChapter[]; className?: string; top?: number }) {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  const [active, setActive] = useState(chapters[0]?.id);

  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.01, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [chapters]);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  const activeChapter = chapters.find((c) => c.id === active);

  return (
    <nav aria-label="Capítulos" className={cn('sticky z-30 border-b border-border bg-[color-mix(in_oklab,var(--bg)_94%,transparent)]', className)} style={{ top }}>
      <motion.div aria-hidden className="absolute inset-x-0 bottom-[-1px] h-0.5 origin-left bg-accent" style={{ scaleX: reduce ? scrollYProgress : smooth }} />
      <div className="mx-auto flex h-11 max-w-[1440px] items-center gap-1 overflow-x-auto px-4 no-scrollbar sm:px-6">
        <span className="mr-2 shrink-0 text-sm text-muted md:hidden">{activeChapter?.label}</span>
        <ol className="hidden items-center gap-1 md:flex">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => go(c.id)}
                aria-current={c.id === active ? 'location' : undefined}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xs px-2.5 text-sm transition-colors',
                  c.id === active ? 'bg-accent-soft text-fg' : 'text-muted hover:text-fg',
                )}
              >
                <span className="font-mono text-xs tnum text-muted">{String(i + 1).padStart(2, '0')}</span>
                {c.label}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
