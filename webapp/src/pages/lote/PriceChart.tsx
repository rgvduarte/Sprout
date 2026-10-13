import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { getMarketSeries, priceUnit } from '../../data';
import type { Lot } from '../../data/types';
import { DrawPath, useMapRange } from '../../components/game';
import { ChartFrame } from '../../components/ui';
import { MONTHS_SHORT, num, pct, price } from '../../lib/format';
import { seriesColor, useTokens } from '../../lib/useTokens';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { priceDecimals } from './model';
import { useWidth } from './shared';

/* =====================================================================
   Referência de mercado vs preço do lote. A linha da referência desenha-se
   com o scroll; depois entram os três níveis do lote (referência na
   abertura, venda B2B, custo financiado) e as bandas de desconto e margem.
   Sem previsões de mercado: à direita de "hoje" só há os preços do lote.
   ===================================================================== */

const ORIGIN = { y: 2024, m: 11 };

/** meses (fracionários) desde 1 de novembro de 2024 */
function monthsSince(iso: string): number {
  const [y, m, d = 15] = iso.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return (y - ORIGIN.y) * 12 + (m - ORIGIN.m) + (d - 1) / days;
}

function niceTicks(min: number, max: number): { lo: number; hi: number; ticks: number[] } {
  const steps = [0.005, 0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2];
  const span = max - min;
  const step = steps.find((s) => span / s <= 6) ?? 2;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { lo, hi, ticks };
}

interface Row {
  t: string;
  ref: number;
}

export function PriceChart({ lot, end, progress, today = '2026-10-13' }: { lot: Lot; end: string; progress: MotionValue<number>; today?: string }) {
  const tokens = useTokens();
  const uid = useId().replace(/:/g, '');
  const boxRef = useRef<HTMLDivElement>(null);
  const width = useWidth(boxRef, 720);
  const wide = useMediaQuery('(min-width: 640px)');
  const series = getMarketSeries(lot.world);
  const unit = priceUnit(lot);
  const dec = priceDecimals(lot);
  const e = lot.economics;
  const rows: Row[] = series.monthly.map((p) => ({ t: p.t, ref: p.value }));
  const color = seriesColor(tokens, lot.world);

  const H = 340;
  const M = { top: 20, right: wide ? 168 : 12, bottom: 30, left: dec === 3 ? 48 : 40 };
  const pw = Math.max(120, width - M.left - M.right);
  const ph = H - M.top - M.bottom;

  const open = lot.funding.opensAt;
  const x0 = monthsSince(open);
  const xEnd = monthsSince(end) + 0.2;
  const xToday = monthsSince(today);
  const values = [...rows.map((r) => r.ref), e.refPrice, e.buyerPrice, e.fundingPrice];
  const { lo, hi, ticks } = niceTicks(Math.min(...values) * 0.97, Math.max(...values) * 1.01);
  const X = (m: number) => M.left + (m / xEnd) * pw;
  const Y = (v: number) => M.top + (1 - (v - lo) / (hi - lo)) * ph;

  const histPath = rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${X(monthsSince(r.t) + 0.5).toFixed(1)},${Y(r.ref).toFixed(1)}`).join(' ');
  const lineAt = (v: number) => `M${X(x0).toFixed(1)},${Y(v).toFixed(1)} H${X(xEnd).toFixed(1)}`;

  const histP = useMapRange(progress, [0.02, 0.5], [0, 1]);
  const levelsP = useMapRange(progress, [0.45, 0.72], [0, 1]);
  const bandW = useMapRange(progress, [0.5, 0.8], [0, X(xEnd) - X(x0)]);
  const labelsO = useMapRange(progress, [0.7, 0.86], [0, 1]);
  const histO = useTransform(histP, (v) => (v > 0.005 ? 1 : 0));
  const levelsO = useTransform(levelsP, (v) => (v > 0.005 ? 1 : 0));

  // ticks do eixo x: janeiros (e julhos em ecrãs largos)
  const xTicks: { m: number; label: string; major: boolean }[] = [];
  for (let k = 0; k <= xEnd; k++) {
    const mm = ((ORIGIN.m - 1 + k) % 12) + 1;
    const yy = ORIGIN.y + Math.floor((ORIGIN.m - 1 + k) / 12);
    if (mm === 1) xTicks.push({ m: k, label: String(yy), major: true });
    else if (mm === 7 && wide && pw > 420) xTicks.push({ m: k, label: MONTHS_SHORT[6], major: false });
  }

  /* --------------------------------------------- hover e teclado */
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const nPoints = rows.length + 1; // +1: o lote (à direita de hoje)
  const onMove = (ev: PointerEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const px = ev.clientX - r.left;
    const m = ((px - M.left) / pw) * xEnd;
    if (m > xToday + 0.6) return setHover(rows.length);
    let best = 0;
    rows.forEach((row, i) => {
      if (Math.abs(monthsSince(row.t) + 0.5 - m) < Math.abs(monthsSince(rows[best].t) + 0.5 - m)) best = i;
    });
    setHover(best);
  };
  const onKey = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      setHover((h) => Math.max(0, Math.min(nPoints - 1, (h ?? nPoints - 1) + (ev.key === 'ArrowRight' ? 1 : -1))));
    } else if (ev.key === 'Escape') setHover(null);
  };
  const isLot = hover === rows.length;
  const hovRow = hover !== null && !isLot ? rows[hover] : null;
  const hx = hovRow ? X(monthsSince(hovRow.t) + 0.5) : isLot ? X(Math.min(xEnd, xToday + (xEnd - xToday) / 2)) : 0;
  const monthLabel = (t: string) => `${MONTHS_SHORT[Number(t.slice(5, 7)) - 1]}. ${t.slice(0, 4)}`;

  const tableRows = rows.map((r) => ({ ...r, lot: monthsSince(r.t) >= Math.floor(x0) }));
  const fmt = (v: number) => price(v, unit, dec);
  const discount = e.refPrice - e.buyerPrice;

  return (
    <ChartFrame
      title={<>Referência de mercado e preços do lote <span className="whitespace-nowrap">{lot.id}</span></>}
      description={`${series.label}, ${series.unit}. Índice ilustrativo, dados fictícios. À direita de hoje só estão os preços do lote, não uma previsão de mercado.`}
      height={H}
      legend={[
        { label: 'Referência de mercado', color },
        { label: 'Referência na abertura', color, dashed: true },
        { label: 'Venda B2B do lote', color: tokens.fg },
        { label: 'Custo do lote financiado', color: tokens.chartAxis },
        { label: 'Desconto ao comprador', color: `color-mix(in oklab, ${color} 45%, transparent)`, kind: 'rect' },
        { label: 'Margem bruta', color: `color-mix(in oklab, ${color} 22%, transparent)`, kind: 'rect' },
      ]}
      table={{
        caption: `Referência mensal e preços do lote ${lot.id}`,
        rows: tableRows,
        getRowId: (r) => r.t,
        columns: [
          { key: 't', header: 'Mês', render: (r) => monthLabel(r.t), sortValue: (r) => r.t },
          { key: 'ref', header: `Referência (${series.unit})`, align: 'right', mono: true, render: (r) => num(r.ref, dec), sortValue: (r) => r.ref },
          { key: 'buy', header: 'Venda B2B do lote', align: 'right', mono: true, render: (r) => (r.lot ? num(e.buyerPrice, dec) : '—') },
          { key: 'cost', header: 'Custo do lote', align: 'right', mono: true, render: (r) => (r.lot ? num(e.fundingPrice, dec) : '—') },
        ],
      }}
      footnote={`Abertura do lote a ${open.split('-').reverse().join('/')}: referência ${fmt(e.refPrice)}, venda B2B ${fmt(e.buyerPrice)} (−${pct(e.discountPct, 0)}), custo ${fmt(e.fundingPrice)}.`}
    >
      <div
        ref={boxRef}
        className="relative h-full w-full touch-pan-y outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        tabIndex={0}
        role="group"
        aria-label={`Gráfico de preços do lote ${lot.id}. Setas esquerda e direita percorrem os meses; a última posição mostra os preços do lote.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setHover(null);
        }}
      >
        <svg width={width} height={H} className="block overflow-visible" aria-hidden>
          <defs>
            <pattern id={`desc-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeOpacity={0.5} strokeWidth="1.6" />
            </pattern>
            <clipPath id={`bands-${uid}`}>
              <motion.rect x={X(x0)} y={0} height={H} width={bandW} />
            </clipPath>
          </defs>
          {/* grelha */}
          {ticks.map((v) => (
            <g key={v}>
              <line x1={M.left} x2={M.left + pw} y1={Y(v)} y2={Y(v)} stroke={tokens.chartGrid} strokeWidth={1} />
              <text x={M.left - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fontFamily={tokens.fontMono} fill={tokens.chartAxis}>
                {num(v, dec === 3 ? 2 : v % 1 === 0 ? 0 : 1)}
              </text>
            </g>
          ))}
          <line x1={M.left} x2={M.left + pw} y1={M.top + ph} y2={M.top + ph} stroke={tokens.chartAxis} strokeOpacity={0.5} strokeWidth={1} />
          {xTicks.map((tk) => (
            <text key={tk.m} x={X(tk.m)} y={H - 8} textAnchor="middle" fontSize="11" fontFamily={tokens.fontMono} fill={tk.major ? tokens.fg : tokens.chartAxis}>
              {tk.label}
            </text>
          ))}
          {/* bandas do lote */}
          <g clipPath={`url(#bands-${uid})`}>
            <rect x={X(x0)} width={X(xEnd) - X(x0)} y={Y(e.refPrice)} height={Math.max(0, Y(e.buyerPrice) - Y(e.refPrice))} fill={`url(#desc-${uid})`} />
            <rect x={X(x0)} width={X(xEnd) - X(x0)} y={Y(e.buyerPrice)} height={Math.max(0, Y(e.fundingPrice) - Y(e.buyerPrice))} fill={color} fillOpacity={0.16} />
          </g>
          {/* hoje */}
          <line x1={X(xToday)} x2={X(xToday)} y1={M.top - 6} y2={M.top + ph} stroke={tokens.fg} strokeWidth={1} />
          <text x={X(xToday)} y={M.top - 9} textAnchor="middle" fontSize="11" fontFamily={tokens.fontMono} fill={tokens.fg}>
            hoje
          </text>
          {/* referência histórica */}
          <motion.g style={{ opacity: histO }}>
            <DrawPath d={histPath} progress={histP} stroke={color} strokeWidth={2} />
          </motion.g>
          {/* níveis do lote */}
          <motion.path d={lineAt(e.refPrice)} stroke={color} strokeWidth={1.5} strokeDasharray="5 4" fill="none" style={{ opacity: levelsP }} />
          <motion.g style={{ opacity: levelsO }}>
            <DrawPath d={lineAt(e.buyerPrice)} progress={levelsP} stroke={tokens.fg} strokeWidth={2} />
            <DrawPath d={lineAt(e.fundingPrice)} progress={levelsP} stroke={tokens.chartAxis} strokeWidth={2} />
            <circle cx={X(x0)} cy={Y(e.refPrice)} r={4} fill={color} stroke={tokens.surface} strokeWidth={2} />
          </motion.g>
          {/* rótulos diretos */}
          <motion.g style={{ opacity: labelsO }}>
            {wide && (
              <>
                <text x={X(xEnd) + 10} y={Y(e.refPrice) + 4} fontSize="12" fill={tokens.fg}>
                  Referência na abertura <tspan fontFamily={tokens.fontMono}>{num(e.refPrice, dec)}</tspan>
                </text>
                <text x={X(xEnd) + 10} y={Y(e.buyerPrice) + 4} fontSize="12" fill={tokens.fg} fontWeight={600}>
                  Venda B2B <tspan fontFamily={tokens.fontMono}>{num(e.buyerPrice, dec)}</tspan>
                </text>
                <text x={X(xEnd) + 10} y={Y(e.fundingPrice) + 4} fontSize="12" fill={tokens.muted}>
                  Custo do lote <tspan fontFamily={tokens.fontMono}>{num(e.fundingPrice, dec)}</tspan>
                </text>
              </>
            )}
            {Y(e.buyerPrice) - Y(e.refPrice) >= 15 && X(xEnd) - X(x0) > 150 && (
              <text x={(X(x0) + X(xEnd)) / 2 + (wide ? 30 : 10)} y={(Y(e.refPrice) + Y(e.buyerPrice)) / 2 + 4} textAnchor="middle" fontSize="11" fill={tokens.fg} paintOrder="stroke" stroke={tokens.surface} strokeWidth={3}>
                desconto {pct(e.discountPct, 0)} · {num(discount, dec)} {`€/${unit}`}
              </text>
            )}
            {Y(e.fundingPrice) - Y(e.buyerPrice) >= 15 && X(xEnd) - X(x0) > 150 && (
              <text x={(X(x0) + X(xEnd)) / 2 + (wide ? 30 : 10)} y={(Y(e.buyerPrice) + Y(e.fundingPrice)) / 2 + 4} textAnchor="middle" fontSize="11" fill={tokens.fg} paintOrder="stroke" stroke={tokens.surface} strokeWidth={3}>
                margem bruta {num(e.grossMargin, dec)} {`€/${unit}`}
              </text>
            )}
          </motion.g>
          {/* cursor */}
          {hover !== null && (
            <g>
              <line x1={hx} x2={hx} y1={M.top} y2={M.top + ph} stroke={tokens.fg} strokeOpacity={0.5} strokeWidth={1} />
              {hovRow && <circle cx={hx} cy={Y(hovRow.ref)} r={4.5} fill={color} stroke={tokens.surface} strokeWidth={2} />}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[180px] rounded-sm border border-border bg-surface px-3 py-2 text-sm shadow-pop"
            style={{ left: Math.min(Math.max(8, hx + 12), width - 200) }}
            aria-hidden
          >
            {hovRow ? (
              <>
                <div className="font-mono text-xs text-muted tnum">{monthLabel(hovRow.t)}</div>
                <div className="mt-1 flex items-center gap-2">
                  <svg aria-hidden width="12" height="4">
                    <line x1="1" y1="2" x2="11" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="font-mono font-medium text-fg tnum">{fmt(hovRow.ref)}</span>
                  <span className="text-muted">referência</span>
                </div>
              </>
            ) : (
              <>
                <div className="font-mono text-xs text-muted tnum">Lote {lot.id}</div>
                {[
                  { v: e.refPrice, l: 'referência na abertura', c: color, dash: true },
                  { v: e.buyerPrice, l: 'venda B2B', c: tokens.fg },
                  { v: e.fundingPrice, l: 'custo do lote', c: tokens.chartAxis },
                ].map((it) => (
                  <div key={it.l} className="mt-1 flex items-center gap-2">
                    <svg aria-hidden width="12" height="4">
                      <line x1="1" y1="2" x2="11" y2="2" stroke={it.c} strokeWidth="2" strokeLinecap="round" strokeDasharray={it.dash ? '3 2' : undefined} />
                    </svg>
                    <span className="font-mono font-medium text-fg tnum">{fmt(it.v)}</span>
                    <span className="text-muted">{it.l}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {focused && hover !== null ? (hovRow ? `${monthLabel(hovRow.t)}: referência ${fmt(hovRow.ref)}` : `Lote ${lot.id}: referência na abertura ${fmt(e.refPrice)}, venda B2B ${fmt(e.buyerPrice)}, custo ${fmt(e.fundingPrice)}`) : ''}
        </span>
      </div>
    </ChartFrame>
  );
}
