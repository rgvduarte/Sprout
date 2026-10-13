import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { getLot as getStaticLot } from '../../data';
import type { Lot } from '../../data/types';
import { cn } from '../../lib/cn';
import { mergeLot, useData, useRole, type PositionView } from '../../state';
import { positionKey, useLedger } from './ledger';
import { lotContext, lotWindow, type LotContext, type LotWindow } from './model';

/* =====================================================================
   Peças partilhadas pelos capítulos da jornada.
   ===================================================================== */

/** Altura da barra superior da aplicação (fixa) e da navegação de capítulos. */
export const TOPBAR_H = 57;
export const NAV_H = 45;
export const CHROME_H = TOPBAR_H + NAV_H;

export interface Journey {
  /** lote com compromissos da sessão (e cancelamentos locais) */
  lot: Lot;
  ctx: LotContext;
  win: LotWindow;
  /** posições ativas do perfil neste lote (sem as canceladas) */
  positions: PositionView[];
  /** capítulos fixos com scroll (≥ 900 px de largura, ≥ 720 px de altura, sem movimento reduzido) */
  rich: boolean;
  goTo: (id: string) => void;
}

const JourneyContext = createContext<Journey | null>(null);

export function JourneyProvider({ value, children }: { value: Journey; children: ReactNode }) {
  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney(): Journey {
  const j = useContext(JourneyContext);
  if (!j) throw new Error('useJourney fora da jornada');
  return j;
}

/**
 * Lote efetivo: o da loja (com compromissos da sessão) menos os compromissos
 * cancelados no período de reflexão (registo local).
 */
export function useEffectiveLot(lotId: string): { lot?: Lot; positions: PositionView[] } {
  const data = useData();
  const { profileId } = useRole();
  const ledger = useLedger();
  const storeLot = data.getLot(lotId);
  const base = getStaticLot(lotId);
  const allMine = data.positions.filter((p) => p.lotId === lotId);
  const positions = allMine.filter((p) => !ledger.cancelled[positionKey(p)]);
  if (!storeLot || !base) return { lot: storeLot, positions };
  const cancelled = Object.values(ledger.cancelled).filter((c) => c.lotId === lotId);
  if (!cancelled.length) return { lot: storeLot, positions };
  const cancelledAmount = cancelled.reduce((s, c) => s + c.amount, 0);
  const mineAllCancelled = allMine.length > 0 && positions.length === 0 && cancelled.some((c) => c.profileId === profileId);
  const deltaRaised = storeLot.funding.raised - base.funding.raised - cancelledAmount;
  const deltaCo = storeLot.funding.coFinancers - base.funding.coFinancers - (mineAllCancelled ? 1 : 0);
  const lot = mergeLot(base, { [lotId]: { raised: Math.max(0, deltaRaised), coFinancers: Math.max(0, deltaCo) } });
  return { lot, positions };
}

export function journeyBase(lot: Lot) {
  return { ctx: lotContext(lot), win: lotWindow(lot) };
}

/* ------------------------------------------------------------ navegação */

/** Leva o leitor ao capítulo e passa-lhe o foco (título), respeitando o movimento reduzido. */
export function scrollToChapter(id: string, opts: { reduce: boolean; sticky: boolean }) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = opts.sticky ? 0 : CHROME_H + 8;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: opts.reduce ? 'auto' : 'smooth' });
  const heading = document.getElementById(`${id}-titulo`);
  heading?.focus({ preventScroll: true });
}

/* ------------------------------------------------------------ títulos */

export function ChapterHeading({ id, n, title, lead, aside, className }: { id: string; n: number; title: ReactNode; lead?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-8 gap-y-3', className)}>
      <div className="min-w-0 max-w-[780px]">
        <h2 id={`${id}-titulo`} tabIndex={-1} className="flex items-baseline gap-3 text-[clamp(1.75rem,2.5vw,2.375rem)] leading-[1.06] outline-none" style={{ letterSpacing: '-0.02em' }}>
          <span className="shrink-0 text-[0.62em] font-semibold text-world-ink tnum" aria-hidden>
            {String(n).padStart(2, '0')}
          </span>
          <span className="min-w-0">{title}</span>
        </h2>
        {lead && <p className="measure mt-3 text-[1.0625rem] leading-relaxed text-muted">{lead}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Contentor horizontal dos capítulos (mesma largura que as outras páginas). */
export function Wrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full min-w-0 max-w-[1240px] px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

/* ------------------------------------------------------------ hooks */

/**
 * Chama `onDwell` depois de o elemento ficar visível (≥ metade dele, ou
 * metade do ecrã) durante `ms`. Serve para dar uma missão como lida quando
 * o capítulo não tem scroll ligado (telemóvel, movimento reduzido).
 */
export function useDwell(ref: RefObject<HTMLElement | null>, enabled: boolean, onDwell: () => void, ms = 1400) {
  const cb = useRef(onDwell);
  useEffect(() => {
    cb.current = onDwell;
  });
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        const enough = entry.isIntersecting && (entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= window.innerHeight * 0.5);
        window.clearTimeout(timer);
        if (enough) timer = window.setTimeout(() => cb.current(), ms);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [ref, enabled, ms]);
}

/** Largura de um elemento (para desenhar SVG em píxeis reais, sem esticar texto). */
export function useWidth(ref: RefObject<HTMLElement | null>, fallback = 720): number {
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.getBoundingClientRect().width || fallback);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fallback]);
  return w;
}

/** Marca de verificação que se desenha quando passa a cumprida (feedback de missão). */
export function CheckMark({ done, size = 20, className, label }: { done: boolean; size?: number; className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200',
        done ? 'border-accent bg-accent text-accent-fg' : 'border-[color-mix(in_oklab,var(--fg)_30%,var(--border))] text-transparent',
        className,
      )}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 16 16" className="size-[70%]" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3.5 8.5l3 3 6-7" pathLength={1} strokeDasharray="1 1" style={{ strokeDashoffset: done ? 0 : 1, transition: 'stroke-dashoffset 320ms cubic-bezier(0.16, 1, 0.3, 1) 80ms' }} />
      </svg>
    </span>
  );
}
