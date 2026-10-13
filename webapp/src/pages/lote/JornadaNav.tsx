import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Tooltip } from '../../components/ui';
import { CheckMark, NAV_H, TOPBAR_H } from './shared';

/* =====================================================================
   Navegação dos capítulos da jornada: barra fina de progresso, rótulos
   (com o estado das missões de diligência), nota de capital em risco
   sempre visível e atalhos de teclado (J / K).
   ===================================================================== */

export interface NavChapter {
  id: string;
  label: string;
  /** missão do capítulo cumprida */
  done?: boolean;
  /** contador curto, p.ex. "4/6" */
  count?: string;
}

export function JornadaNav({ chapters, lotId, onGo, agent }: { chapters: NavChapter[]; lotId: string; onGo: (id: string) => void; agent?: boolean }) {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  const [active, setActive] = useState(chapters[0]?.id);
  const ids = chapters.map((c) => c.id).join('|');
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const els = ids
      .split('|')
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.01, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);

  // a lista larga nunca esconde um capítulo: o ativo fica sempre à vista dentro dela
  useEffect(() => {
    const list = listRef.current;
    const btn = list?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!list || !btn || list.scrollWidth <= list.clientWidth) return;
    const left = btn.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + btn.offsetWidth > list.scrollLeft + list.clientWidth) list.scrollTo({ left: Math.max(0, left - 24), behavior: 'auto' });
  }, [active]);

  const idx = Math.max(0, chapters.findIndex((c) => c.id === active));
  const current = chapters[idx];
  const go = (i: number) => {
    const c = chapters[Math.max(0, Math.min(chapters.length - 1, i))];
    if (c) {
      setActive(c.id);
      onGo(c.id);
    }
  };

  return (
    <nav
      aria-label={`Capítulos da jornada do lote ${lotId}`}
      data-chrome="jornada"
      className="sticky z-10 border-b border-border bg-bg"
      style={{ top: TOPBAR_H, height: NAV_H }}
    >
      <motion.div aria-hidden className="absolute inset-x-0 bottom-[-1px] h-0.5 origin-left bg-world-ink" style={{ scaleX: reduce ? scrollYProgress : smooth }} />
      <div className="mx-auto flex h-full max-w-[1240px] items-center gap-2 px-2 sm:px-4 lg:px-6">
        {/* até 1280 px: capítulo atual + anterior/seguinte (nenhum capítulo fica escondido numa lista cortada) */}
        <div className="flex min-w-0 items-center gap-1 xl:hidden">
          <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Capítulo anterior" className="relative inline-flex size-9 items-center justify-center rounded-sm text-fg after:absolute after:-inset-1 after:content-[''] hover:bg-surface-2 disabled:text-muted">
            <ChevronLeft aria-hidden className="size-5" strokeWidth={1.75} />
          </button>
          <p className="min-w-0 truncate text-sm font-medium text-fg" aria-live="polite">
            <span className="text-muted tnum">
              {idx + 1}/{chapters.length}
            </span>{' '}
            {current?.label}
            {current?.count && !current.done && <span className="text-muted"> · {current.count}</span>}
          </p>
          <button type="button" onClick={() => go(idx + 1)} disabled={idx === chapters.length - 1} aria-label="Capítulo seguinte" className="relative inline-flex size-9 items-center justify-center rounded-sm text-fg after:absolute after:-inset-1 after:content-[''] hover:bg-surface-2 disabled:text-muted">
            <ChevronRight aria-hidden className="size-5" strokeWidth={1.75} />
          </button>
          {/* números dos outros capítulos, para saltar sem passar pelos do meio (tablet e portátil) */}
          <ol className="ml-2 hidden items-center gap-0.5 md:flex" aria-label="Ir para o capítulo">
            {chapters.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={c.id === active ? 'location' : undefined}
                  aria-label={`${String(i + 1).padStart(2, '0')} ${c.label}${c.done ? ', missão cumprida' : c.count ? `, ${c.count}` : ''}`}
                  className={cn(
                    'relative inline-flex h-9 min-w-9 items-center justify-center rounded-xs px-1.5 font-mono text-xs tnum transition-colors duration-150 after:absolute after:-inset-y-1 after:inset-x-0 after:content-[""]',
                    c.id === active ? 'bg-world-soft font-semibold text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                  {c.done && <span aria-hidden className="absolute right-0.5 top-1 size-1.5 rounded-full bg-accent" />}
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* ≥ 1280 px: todos os capítulos com o rótulo */}
        <ol ref={listRef} className="hidden min-w-0 items-center gap-0.5 overflow-x-auto no-scrollbar xl:flex">
          {chapters.map((c, i) => (
            <li key={c.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={c.id === active ? 'location' : undefined}
                className={cn(
                  'relative inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xs px-2.5 text-sm transition-colors duration-150 after:absolute after:-inset-y-1 after:inset-x-0 after:content-[""]',
                  c.id === active ? 'bg-world-soft font-medium text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                <span className="text-xs tnum text-muted">{String(i + 1).padStart(2, '0')}</span>
                {c.label}
                {c.done !== undefined && <CheckMark done={c.done} size={16} label={c.done ? 'missão cumprida' : 'missão por fazer'} />}
                {c.count && !c.done && <span className="font-mono text-xs text-muted tnum">{c.count}</span>}
              </button>
            </li>
          ))}
        </ol>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Tooltip side="bottom" content="Com o foco nesta barra: J capítulo seguinte · K capítulo anterior">
            <span tabIndex={0} className="hidden items-center gap-1 rounded-xs text-xs text-muted 2xl:inline-flex" aria-label="Atalhos com o foco na barra de capítulos: J para o capítulo seguinte, K para o anterior">
              <kbd className="rounded-xs border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-fg">J</kbd>
              <kbd className="rounded-xs border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-fg">K</kbd>
            </span>
          </Tooltip>
          {agent ? (
            // cesto de água (modelo de agente): não há capital de cofinanciadores neste lote
            <p className="whitespace-nowrap text-sm font-medium text-fg">Cesto · sem financiamento</p>
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-fg">
              <ShieldAlert aria-hidden className="size-4 shrink-0 text-warn-ink" strokeWidth={1.75} />
              <span className="whitespace-nowrap font-medium">Capital em risco</span>
              <span className="hidden text-muted 2xl:inline">· liquidação prevista não garantida</span>
            </p>
          )}
        </div>
      </div>
    </nav>
  );
}
