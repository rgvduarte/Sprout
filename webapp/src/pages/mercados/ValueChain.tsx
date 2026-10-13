import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { WorldId } from '../../data/types';
import { CHAIN_DIFFERENTIAL, FOUNDERS_THESIS, OLIVE_CHAIN_FACTS } from '../../data';
import { RiskNote, SegmentedControl } from '../../components/ui';
import { cn } from '../../lib/cn';
import { pct } from '../../lib/format';
import { useTokens } from '../../lib/useTokens';
import { priceNumber, unitPrice, type ChainNumbers, type ChainSegment } from './model';

/* =====================================================================
   "A cadeia neste mercado": o preço que o comprador B2B paga hoje,
   decomposto. Na cadeia habitual o diferencial produtor → comprador
   (embalamento, logística e margens de intermediação) é um bloco; com a
   Sprout abre-se em prémio ao produtor, custos, spread do lote e desconto
   ao comprador. É o momento focal do ecrã do mundo.
   ===================================================================== */

type Mode = 'habitual' | 'sprout';

/** Luminância relativa de um #rrggbb (para escolher a tinta do rótulo). */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
/** Tinta clara ou escura com mais contraste sobre a cor dada. */
function inkOn(fillHex: string, light: string, dark: string): string {
  const L = luminance(fillHex);
  return contrast(L, luminance(light)) >= contrast(L, luminance(dark)) ? light : dark;
}

const SHORT: Record<ChainSegment['id'], string> = { produtor: 'Produtor', premio: 'Prémio', custos: 'Custos', spread: 'Spread do lote', desconto: 'Desconto' };

const MIDDLE_SPROUT: Record<WorldId, string> = {
  azeite: 'Sprout · lote em IBC',
  agua: 'Sprout · lote em paletes',
  cafe: 'Sprout · lote em sacas (Fase 2)',
};

export function ValueChain({ world, chain }: { world: WorldId; chain: ChainNumbers }) {
  const tokens = useTokens();
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [mode, setMode] = useState<Mode>('sprout');
  const armed = useRef(false);
  const played = useRef(false);

  // Primeiro frame completo (Sprout). Só se o bloco começar fora do ecrã é que,
  // ao entrar, mostra a cadeia habitual por um instante e abre a margem.
  useLayoutEffect(() => {
    if (reduce || !ref.current) return;
    if (ref.current.getBoundingClientRect().top > window.innerHeight * 0.9) armed.current = true;
  }, [reduce]);
  useEffect(() => {
    if (!inView || !armed.current || played.current) return;
    played.current = true;
    setMode('habitual');
    const t = window.setTimeout(() => setMode('sprout'), 420);
    return () => window.clearTimeout(t);
  }, [inView]);

  const { ref: refPrice, pool, traditionalProducer: trad, segments, model, lot } = chain;
  const unit = world === 'agua' ? 'L' : 'kg';
  const zoom = segments.filter((s) => s.id !== 'produtor');
  const sprout = mode === 'sprout';
  const worldHex = world === 'azeite' ? tokens.azeite : world === 'agua' ? tokens.agua : tokens.cafe;
  const darkInk = tokens.dark ? tokens.bg : tokens.fg;
  const lightInk = tokens.dark ? tokens.fg : tokens.surface;
  const FILL: Record<ChainSegment['id'], { bg: string; ink: string }> = {
    produtor: { bg: 'color-mix(in oklab, var(--fg) 10%, var(--surface-2))', ink: 'var(--fg)' },
    premio: { bg: 'var(--world)', ink: inkOn(worldHex, lightInk, darkInk) },
    custos: { bg: 'var(--muted)', ink: inkOn(tokens.muted, lightInk, darkInk) },
    spread: { bg: 'var(--fg)', ink: inkOn(tokens.fg, lightInk, darkInk) },
    desconto: { bg: 'var(--surface)', ink: 'var(--fg)' },
  };
  const poolStart = trad / refPrice;
  const pos = (v: number) => ((v - trad) / pool) * 100;
  const fmt = (v: number) => priceNumber(world, v);

  return (
    <div data-world={world} className="min-w-0">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-x-4">
        <div className="min-w-0 flex-1">
          <h3 id={`${uid}-t`} className="text-[1.1875rem] leading-tight">
            A cadeia neste mercado
          </h3>
          <p className="mt-1 text-sm text-muted">
            Por {unit}, com os números do <span className="font-mono tnum text-fg">{lot.id}</span>. O preço habitual ao produtor é ilustrativo.
          </p>
        </div>
        <SegmentedControl
          label="Cadeia"
          size="sm"
          value={mode}
          onChange={(m) => {
            played.current = true;
            setMode(m);
          }}
          options={[
            { value: 'habitual', label: 'Habitual' },
            { value: 'sprout', label: 'Com a Sprout' },
          ]}
        />
      </div>

      {/* percurso: quem está entre o produtor e o comprador */}
      <ol className="mt-5 grid grid-cols-1 justify-items-stretch gap-y-1 text-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-x-2" aria-label="Percurso da mercadoria">
        <li className="min-w-0 rounded-sm border border-border bg-surface px-2.5 py-2 text-center font-medium leading-snug text-fg">{model.nodes[0]}</li>
        <li aria-hidden className="justify-self-center text-muted">
          <ArrowRight className="size-4 max-sm:rotate-90" strokeWidth={1.75} />
        </li>
        <li className={cn('relative min-w-0 rounded-sm border px-2.5 py-2 text-center font-medium leading-snug transition-colors duration-300', sprout ? 'border-world-line bg-world-soft text-world-ink' : 'border-dashed border-border bg-surface text-fg')}>
          <span className={cn('block transition-opacity duration-200', sprout ? 'opacity-0' : 'opacity-100')} aria-hidden={sprout}>
            {model.nodes[1]}
          </span>
          <span className={cn('absolute inset-0 flex items-center justify-center px-2.5 transition-opacity duration-200', sprout ? 'opacity-100' : 'opacity-0')} aria-hidden={!sprout}>
            {MIDDLE_SPROUT[world]}
          </span>
        </li>
        <li aria-hidden className="justify-self-center text-muted">
          <ArrowRight className="size-4 max-sm:rotate-90" strokeWidth={1.75} />
        </li>
        <li className="min-w-0 rounded-sm border border-border bg-surface px-2.5 py-2 text-center font-medium leading-snug text-fg">{model.nodes[2]}</li>
      </ol>

      <div ref={ref} className="mt-6" role="img" aria-labelledby={`${uid}-t`} aria-describedby={`${uid}-d`}>
        {/* contexto: o preço inteiro, de 0 à referência */}
        <div className="flex items-baseline justify-between font-mono text-xs text-muted tnum">
          <span>0</span>
          <span>
            referência <span className="text-fg">{unitPrice(world, refPrice)}</span>
          </span>
        </div>
        <div className="relative mt-1 h-3">
          <div className="absolute inset-y-0 left-0 rounded-l-xs" style={{ width: `${poolStart * 100}%`, background: FILL.produtor.bg }} />
          <div className="absolute inset-y-0 right-0 rounded-r-xs bg-muted" style={{ left: `calc(${poolStart * 100}% + 2px)` }} />
          {sprout && <div className="absolute -bottom-1 -top-1 w-0.5 bg-fg" style={{ left: `${(chain.buyer / refPrice) * 100}%` }} aria-hidden />}
        </div>
        {/* conectores do zoom */}
        <svg aria-hidden className="block h-7 w-full" viewBox="0 0 100 28" preserveAspectRatio="none">
          <line x1={poolStart * 100} y1="0" x2="0.2" y2="28" stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="99.8" y1="0" x2="99.8" y2="28" stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* o diferencial produtor → comprador, ampliado */}
        <div className="relative h-14">
          {zoom.map((s, i) => {
            const left = pos(s.from);
            const width = pos(s.to) - pos(s.from);
            const fill = FILL[s.id];
            const isDiscount = s.id === 'desconto';
            return (
              <div
                key={s.id}
                className="absolute inset-y-0 motion-safe:transition-[background-color,clip-path,transform,color] motion-safe:duration-500"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: sprout ? fill.bg : 'var(--muted)',
                  color: sprout ? fill.ink : FILL.custos.ink,
                  clipPath: sprout ? 'inset(0 1px 0 1px)' : 'inset(0 0 0 0)',
                  transform: sprout && isDiscount ? 'translateY(6px)' : 'translateY(0)',
                  transitionDelay: reduce ? '0ms' : `${sprout ? i * 90 : 0}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  borderRadius: i === 0 ? '2px 0 0 2px' : i === zoom.length - 1 ? '0 2px 2px 0' : undefined,
                }}
              >
                {isDiscount && (
                  <svg aria-hidden className={cn('absolute inset-0 h-full w-full motion-safe:transition-opacity motion-safe:duration-500', sprout ? 'opacity-100' : 'opacity-0')} preserveAspectRatio="none">
                    <defs>
                      <pattern id={`${uid}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="7" stroke="var(--world-ink)" strokeWidth="1.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#${uid}-hatch)`} />
                    <rect width="100%" height="100%" fill="none" stroke="var(--world-ink)" strokeWidth="2" />
                  </svg>
                )}
                <span
                  className={cn(
                    'absolute inset-0 hidden items-center px-2 text-[0.8125rem] font-medium leading-tight motion-safe:transition-opacity motion-safe:duration-300 sm:flex',
                    sprout ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden
                >
                  <span className={cn('truncate', isDiscount && 'rounded-xs bg-surface px-1 text-fg')}>{SHORT[s.id]}</span>
                </span>
              </div>
            );
          })}
          {/* bloco único da cadeia habitual */}
          <div
            aria-hidden
            className={cn('pointer-events-none absolute inset-0 flex items-center justify-center rounded-xs px-3 text-center text-sm font-medium motion-safe:transition-opacity motion-safe:duration-300', sprout ? 'opacity-0' : 'opacity-100')}
            style={{ color: FILL.custos.ink, background: 'var(--muted)', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {CHAIN_DIFFERENTIAL[world].label}: {unitPrice(world, pool)}
          </div>
        </div>
        {/* eixo ampliado: os limites de cada parte, em preço acumulado */}
        <div className="relative mt-3 h-5 font-mono text-xs text-muted tnum" aria-hidden>
          {[trad, ...zoom.map((s) => s.to)].map((v, i, arr) => {
            const x = pos(v);
            const show = sprout || i === 0 || i === arr.length - 1;
            return (
              <span
                key={i}
                className={cn('absolute top-0 whitespace-nowrap motion-safe:transition-opacity motion-safe:duration-300', show ? 'opacity-100' : 'opacity-0', i === 0 ? 'translate-x-0' : i === arr.length - 1 ? '-translate-x-full' : '-translate-x-1/2')}
                style={{ left: `${x}%` }}
              >
                {fmt(v)}
              </span>
            );
          })}
        </div>
      </div>

      {/* leitura: cada parte, por ordem */}
      <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2" id={`${uid}-d`}>
        {zoom.map((s) => (
          <div key={s.id} className="flex min-w-0 items-start gap-3">
            <span aria-hidden className="mt-1 inline-block size-3 shrink-0 overflow-hidden rounded-[2px]" style={{ background: s.id === 'desconto' ? 'transparent' : FILL[s.id].bg, border: s.id === 'desconto' ? '1px solid var(--world-ink)' : undefined }}>
              {s.id === 'desconto' && (
                <svg viewBox="0 0 12 12" className="block size-full">
                  <path d="M-2 4 L4 -2 M-2 10 L10 -2 M2 14 L14 2 M8 14 L14 8" stroke="var(--world-ink)" strokeWidth="1.3" />
                </svg>
              )}
            </span>
            <div className="min-w-0">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="font-mono text-[0.9375rem] text-fg tnum">
                {unitPrice(world, s.value)} <span className="whitespace-nowrap font-sans text-sm text-muted">· {pct(s.value / pool, 0)} do diferencial</span>
              </dd>
              <dd className="text-sm text-muted">{s.description}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="mt-5 border-t border-border pt-4">
        <p className="measure text-[0.9375rem] text-fg">
          <strong className="font-semibold">
            {pct(chain.captured, 0)} do {CHAIN_DIFFERENTIAL[world].label.charAt(0).toLowerCase() + CHAIN_DIFFERENTIAL[world].label.slice(1)} muda de mãos
          </strong>
          : {unitPrice(world, chain.discount)} ficam com o comprador, {unitPrice(world, chain.premium)} com o produtor e {unitPrice(world, chain.spread)} com o lote. Os outros {unitPrice(world, chain.costs)} pagam os custos do lote. O diferencial inclui {CHAIN_DIFFERENTIAL[world].contains}; não é a margem de um só intermediário.
        </p>
        {world === 'azeite' && (
          <p className="measure mt-2 text-sm text-muted">
            A tese original dos fundadores fala em captar {pct(FOUNDERS_THESIS.packagerMarginCaptured[0], 0).replace(' %', '')}–{pct(FOUNDERS_THESIS.packagerMarginCaptured[1], 0)} da margem do embalador. Está por validar: a margem líquida do embalador verificada é de {unitPrice(world, OLIVE_CHAIN_FACTS.packagerNetMargin[0])} a {unitPrice(world, OLIVE_CHAIN_FACTS.packagerNetMargin[1])} ({pct(OLIVE_CHAIN_FACTS.packagerNetMarginOfRetail[0], 1)} a {pct(OLIVE_CHAIN_FACTS.packagerNetMarginOfRetail[1], 1)} do preço de venda ao público) e, sozinha, não paga um desconto de {pct(FOUNDERS_THESIS.buyerDiscount[0], 0).replace(' %', '')}–{pct(FOUNDERS_THESIS.buyerDiscount[1], 0)} ao comprador. O piloto mede-o com cotações reais.
          </p>
        )}
        <p className="measure mt-2 text-sm text-muted">
          {model.note} O spread do lote divide-se em {pct(lot.economics.investorShare, 0)} para os co-financiadores ({unitPrice(world, chain.split.investors)}), {pct(lot.economics.reserveShare, 0)} para a reserva de primeira perda ({unitPrice(world, chain.split.reserve)}) e {pct(1 - lot.economics.investorShare - lot.economics.reserveShare, 0)} para a Sprout ({unitPrice(world, chain.split.sprout)}).
        </p>
        <RiskNote compact className="mt-3" />
      </div>
    </div>
  );
}
