import { memo, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { getMarketSeries, priceUnit } from '../../data';
import type { Lot } from '../../data/types';
import { DrawPath, useMapRange } from '../../components/game';
import { ChartFrame, type LegendItem } from '../../components/ui';
import { lowerInitial, MONTHS_SHORT, num, pct, price } from '../../lib/format';
import { seriesColor, useTokens } from '../../lib/useTokens';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { isAgentLot, priceDecimals } from './model';
import { useWidth } from './shared';

/* =====================================================================
   Preços do lote sobre o mercado. No azeite há duas camadas que nunca se
   comparam entre si: o índice de origem (granel, o que o lagar recebe) e a
   referência do canal (produto embalado, a que se mede o preço ao
   comprador). À direita de "hoje" só há os preços do lote, nunca uma
   previsão. Os desenhos acompanham o scroll; os valores estão sempre lá.

   Escada do lote (da abertura ao fim da janela):
     aquisição ao lagar (índice + prémio) → + custos até à venda (com o
     embalamento no co-packer) = preço financiado → + margem bruta = preço
     ao comprador ← desconto ← referência do canal.
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

/** Afasta rótulos verticalmente (mínimo `gap` px), mantendo a ordem. */
function spread<T extends { y: number }>(items: T[], gap: number, top: number, bottom: number): T[] {
  const out = [...items].sort((a, b) => a.y - b.y).map((it) => ({ ...it }));
  for (let i = 1; i < out.length; i++) if (out[i].y - out[i - 1].y < gap) out[i].y = out[i - 1].y + gap;
  const overflow = out.length ? out[out.length - 1].y - bottom : 0;
  if (overflow > 0) {
    out[out.length - 1].y -= overflow;
    for (let i = out.length - 2; i >= 0; i--) if (out[i + 1].y - out[i].y < gap) out[i].y = out[i + 1].y - gap;
  }
  if (out.length && out[0].y < top) out[0].y = top;
  return out;
}

interface Row {
  t: string;
  index: number;
  channel?: number;
}

export const PriceChart = memo(function PriceChart({ lot, end, progress, today = '2026-10-13' }: { lot: Lot; end: string; progress: MotionValue<number>; today?: string }) {
  const tokens = useTokens();
  const uid = useId().replace(/:/g, '');
  const boxRef = useRef<HTMLDivElement>(null);
  const width = useWidth(boxRef, 720);
  const wide = useMediaQuery('(min-width: 640px)');
  const series = getMarketSeries(lot.world);
  const unit = priceUnit(lot);
  const dec = priceDecimals(lot);
  const e = lot.economics;
  const agent = isAgentLot(lot);
  const color = seriesColor(tokens, lot.world);
  // azeite: a referência do canal (embalado) é outra série, derivada do índice de origem (granel)
  const channelSeries = series.references?.find((r) => r.id === (e.channel === 'horeca' ? 'horeca' : 'embalador'));
  const rows: Row[] = series.monthly.map((p, i) => ({ t: p.t, index: p.value, channel: channelSeries?.monthly[i]?.value }));
  const indexLabel = series.label;
  const channelLabel = channelSeries?.label ?? e.refLabel;

  // a escada do lote (níveis horizontais da abertura ao fim da janela)
  const levels = agent
    ? [
        { id: 'ref', v: e.refPrice, label: 'Referência na abertura', stroke: color, dash: '5 4', w: 1.5 },
        { id: 'buyer', v: e.buyerPrice, label: 'Preço ao comprador', stroke: tokens.fg, w: 2 },
      ]
    : [
        ...(e.discountPct > 0 || e.refPrice !== e.buyerPrice ? [{ id: 'ref', v: e.refPrice, label: 'Referência na abertura', stroke: color, dash: '5 4', w: 1.5 }] : []),
        { id: 'buyer', v: e.buyerPrice, label: 'Preço ao comprador', stroke: tokens.fg, w: 2 },
        { id: 'funding', v: e.fundingPrice, label: 'Preço financiado', stroke: tokens.chartAxis, w: 2 },
        { id: 'acq', v: e.acquisitionPrice, label: lot.world === 'azeite' ? 'Aquisição ao lagar' : 'Aquisição', stroke: color, dash: '1 4', w: 2 },
      ];

  const H = 360;
  const M = { top: 22, right: wide ? 196 : 12, bottom: 30, left: dec === 3 ? 48 : 40 };
  const pw = Math.max(120, width - M.left - M.right);
  const ph = H - M.top - M.bottom;

  const open = lot.funding.opensAt;
  const x0 = monthsSince(open);
  const xEnd = monthsSince(end) + 0.2;
  const xToday = monthsSince(today);
  const values = [...rows.map((r) => r.index), ...rows.flatMap((r) => (r.channel !== undefined ? [r.channel] : [])), ...levels.map((l) => l.v)].filter((v) => v > 0);
  const { lo, hi, ticks } = niceTicks(Math.min(...values) * 0.96, Math.max(...values) * 1.02);
  const X = (m: number) => M.left + (m / xEnd) * pw;
  const Y = (v: number) => M.top + (1 - (v - lo) / (hi - lo)) * ph;

  const pathOf = (pick: (r: Row) => number | undefined) =>
    rows
      .filter((r) => pick(r) !== undefined)
      .map((r, i) => `${i === 0 ? 'M' : 'L'}${X(monthsSince(r.t) + 0.5).toFixed(1)},${Y(pick(r)!).toFixed(1)}`)
      .join(' ');
  const indexPath = pathOf((r) => r.index);
  const channelPath = channelSeries ? pathOf((r) => r.channel) : '';
  const lineAt = (v: number) => `M${X(x0).toFixed(1)},${Y(v).toFixed(1)} H${X(xEnd).toFixed(1)}`;

  // só os desenhos acompanham o scroll; números e rótulos estão sempre visíveis
  const histP = useMapRange(progress, [0.02, 0.5], [0, 1]);
  const levelsP = useMapRange(progress, [0.45, 0.72], [0, 1]);
  const bandW = useMapRange(progress, [0.5, 0.8], [0, X(xEnd) - X(x0)]);
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
  const bandMid = (a: number, b: number) => (Y(a) + Y(b)) / 2 + 4;
  const bandFits = (a: number, b: number) => Math.abs(Y(b) - Y(a)) >= 15 && X(xEnd) - X(x0) > 150;
  const labelX = (X(x0) + X(xEnd)) / 2 + (wide ? 30 : 10);
  const rightLabels = spread(
    levels.map((l) => ({ ...l, y: Y(l.v) + 4 })),
    15,
    M.top,
    M.top + ph,
  );

  const legend: LegendItem[] = [
    { label: indexLabel, color },
    ...(channelSeries ? [{ label: `${channelLabel} (embalado)`, color: tokens.fg, dashed: true }] : []),
    { label: 'Preço ao comprador', color: tokens.fg },
    ...(!agent ? [{ label: 'Preço financiado', color: tokens.chartAxis }, { label: lot.world === 'azeite' ? 'Aquisição ao lagar (índice + prémio)' : 'Aquisição', color, dotted: true }] : []),
    ...(discount > 0.0005 ? [{ label: 'Desconto ao comprador', color, kind: 'hatch' as const }] : []),
    ...(!agent ? [{ label: 'Margem bruta', color: `color-mix(in oklab, ${color} 30%, transparent)`, kind: 'rect' as const }, { label: e.packingCost > 0 ? 'Custos até à venda (com o co-packer)' : 'Custos até à venda', color: `color-mix(in oklab, ${tokens.chartAxis} 22%, transparent)`, kind: 'rect' as const }] : []),
  ];

  return (
    <ChartFrame
      title={
        <>
          Mercado e preços do lote <span className="whitespace-nowrap">{lot.id}</span>
        </>
      }
      description={`${series.label}, ${series.unit}${channelSeries ? `, e ${lowerInitial(channelLabel)} (produto embalado, derivada do índice)` : ''}. Índice ilustrativo, dados fictícios. À direita de hoje só estão os preços do lote, não uma previsão de mercado.`}
      height={H}
      legend={legend}
      table={{
        caption: `Mercado mensal e preços do lote ${lot.id}`,
        rows: tableRows,
        getRowId: (r) => r.t,
        columns: [
          { key: 't', header: 'Mês', render: (r) => monthLabel(r.t), sortValue: (r) => r.t },
          { key: 'index', header: `${indexLabel} (${series.unit})`, align: 'right', mono: true, render: (r) => num(r.index, dec), sortValue: (r) => r.index },
          ...(channelSeries ? [{ key: 'channel', header: channelLabel, align: 'right' as const, mono: true, render: (r: (typeof tableRows)[number]) => (r.channel !== undefined ? num(r.channel, dec) : '—') }] : []),
          { key: 'buy', header: 'Preço ao comprador', align: 'right', mono: true, render: (r) => (r.lot ? num(e.buyerPrice, dec) : '—') },
          ...(!agent ? [{ key: 'cost', header: 'Preço financiado', align: 'right' as const, mono: true, render: (r: (typeof tableRows)[number]) => (r.lot ? num(e.fundingPrice, dec) : '—') }] : []),
        ],
      }}
      footnote={
        agent
          ? `Abertura do lote a ${open.split('-').reverse().join('/')}: ${lowerInitial(e.refLabel)} ${fmt(e.refPrice)}, preço ao comprador ${fmt(e.buyerPrice)} (${pct(e.discountPct, 0)} abaixo). A Sprout recebe ${pct(e.commissionPct ?? 0, 0)} de comissão; não há preço financiado.`
          : `Abertura do lote a ${open.split('-').reverse().join('/')}: ${lot.world === 'azeite' ? `índice de origem ${fmt(e.indexAtOpen)}, aquisição ao lagar ${fmt(e.acquisitionPrice)}, ` : ''}preço financiado ${fmt(e.fundingPrice)}, preço ao comprador ${fmt(e.buyerPrice)} (${e.priceBasis}).`
      }
    >
      <div
        ref={boxRef}
        className="relative h-full w-full touch-pan-y rounded-xs"
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
              <text x={M.left - 8} y={Y(v) + 4} textAnchor="end" fontSize="12" fontFamily={tokens.fontMono} fill={tokens.chartAxis}>
                {num(v, dec === 3 ? 2 : v % 1 === 0 ? 0 : 1)}
              </text>
            </g>
          ))}
          <line x1={M.left} x2={M.left + pw} y1={M.top + ph} y2={M.top + ph} stroke={tokens.chartAxis} strokeOpacity={0.5} strokeWidth={1} />
          {xTicks.map((tk) => (
            <text key={tk.m} x={X(tk.m)} y={H - 8} textAnchor="middle" fontSize="12" fontFamily={tokens.fontMono} fill={tk.major ? tokens.fg : tokens.chartAxis}>
              {tk.label}
            </text>
          ))}
          {/* bandas do lote: desconto (referência → comprador), margem (comprador → financiado), custos (financiado → aquisição) */}
          <g clipPath={`url(#bands-${uid})`}>
            {discount > 0.0005 && <rect x={X(x0)} width={X(xEnd) - X(x0)} y={Y(e.refPrice)} height={Math.max(0, Y(e.buyerPrice) - Y(e.refPrice))} fill={`url(#desc-${uid})`} />}
            {!agent && (
              <>
                <rect x={X(x0)} width={X(xEnd) - X(x0)} y={Y(e.buyerPrice)} height={Math.max(0, Y(e.fundingPrice) - Y(e.buyerPrice))} fill={color} fillOpacity={0.2} />
                <rect x={X(x0)} width={X(xEnd) - X(x0)} y={Y(e.fundingPrice)} height={Math.max(0, Y(e.acquisitionPrice) - Y(e.fundingPrice))} fill={tokens.chartAxis} fillOpacity={0.1} />
              </>
            )}
          </g>
          {/* hoje */}
          <line x1={X(xToday)} x2={X(xToday)} y1={M.top - 6} y2={M.top + ph} stroke={tokens.fg} strokeWidth={1} />
          <text x={X(xToday)} y={M.top - 9} textAnchor="middle" fontSize="12" fontFamily={tokens.fontMono} fill={tokens.fg}>
            hoje
          </text>
          {/* séries de mercado */}
          <motion.g style={{ opacity: histO }}>
            <DrawPath d={indexPath} progress={histP} stroke={color} strokeWidth={2} />
            {channelPath && (
              <motion.path d={channelPath} fill="none" stroke={tokens.fg} strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round" style={{ pathLength: histP }} />
            )}
          </motion.g>
          {/* escada do lote */}
          <motion.g style={{ opacity: levelsO }}>
            {levels.map((l) =>
              l.dash ? (
                <motion.path key={l.id} d={lineAt(l.v)} stroke={l.stroke} strokeWidth={l.w} strokeDasharray={l.dash} strokeLinecap="round" fill="none" style={{ opacity: levelsP }} />
              ) : (
                <DrawPath key={l.id} d={lineAt(l.v)} progress={levelsP} stroke={l.stroke} strokeWidth={l.w} />
              ),
            )}
            <circle cx={X(x0)} cy={Y(agent ? e.refPrice : e.acquisitionPrice)} r={4} fill={color} stroke={tokens.surface} strokeWidth={2} />
          </motion.g>
          {/* rótulos com os valores: sempre visíveis (só os desenhos acompanham o scroll) */}
          <g>
            {wide &&
              rightLabels.map((l) => (
                <text key={l.id} x={X(xEnd) + 10} y={l.y} fontSize="12" fill={l.id === 'buyer' ? tokens.fg : l.id === 'funding' || l.id === 'acq' ? tokens.muted : tokens.fg} fontWeight={l.id === 'buyer' ? 600 : 400}>
                  {l.label} <tspan fontFamily={tokens.fontMono}>{num(l.v, dec)}</tspan>
                </text>
              ))}
            {discount > 0.0005 && bandFits(e.refPrice, e.buyerPrice) && (
              <text x={labelX} y={bandMid(e.refPrice, e.buyerPrice)} textAnchor="middle" fontSize="12" fill={tokens.fg} paintOrder="stroke" stroke={tokens.surface} strokeWidth={3}>
                desconto {pct(e.discountPct, 0)} · {num(discount, dec)} {`€/${unit}`}
              </text>
            )}
            {!agent && bandFits(e.buyerPrice, e.fundingPrice) && (
              <text x={labelX} y={bandMid(e.buyerPrice, e.fundingPrice)} textAnchor="middle" fontSize="12" fill={tokens.fg} paintOrder="stroke" stroke={tokens.surface} strokeWidth={3}>
                margem bruta {num(e.grossMargin, dec)} {`€/${unit}`}
              </text>
            )}
            {!agent && bandFits(e.fundingPrice, e.acquisitionPrice) && (
              <text x={labelX} y={bandMid(e.fundingPrice, e.acquisitionPrice)} textAnchor="middle" fontSize="12" fill={tokens.fg} paintOrder="stroke" stroke={tokens.surface} strokeWidth={3}>
                custos até à venda {num(e.costsPerUnit, dec)} {`€/${unit}`}
                {e.packingCost > 0 ? ` (co-packer ${num(e.packingCost, dec)})` : ''}
              </text>
            )}
          </g>
          {/* cursor */}
          {hover !== null && (
            <g>
              <line x1={hx} x2={hx} y1={M.top} y2={M.top + ph} stroke={tokens.fg} strokeOpacity={0.5} strokeWidth={1} />
              {hovRow && <circle cx={hx} cy={Y(hovRow.index)} r={4.5} fill={color} stroke={tokens.surface} strokeWidth={2} />}
              {hovRow?.channel !== undefined && <circle cx={hx} cy={Y(hovRow.channel)} r={4} fill={tokens.surface} stroke={tokens.fg} strokeWidth={1.5} />}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-2 z-10 min-w-[200px] rounded-sm border border-border bg-surface px-3 py-2 text-sm shadow-pop" style={{ left: Math.min(Math.max(8, hx + 12), width - 220) }} aria-hidden>
            {hovRow ? (
              <>
                <div className="font-mono text-xs text-muted tnum">{monthLabel(hovRow.t)}</div>
                <div className="mt-1 flex items-center gap-2">
                  <svg aria-hidden width="12" height="4">
                    <line x1="1" y1="2" x2="11" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="font-mono font-medium text-fg tnum">{fmt(hovRow.index)}</span>
                  <span className="text-muted">{lot.world === 'azeite' ? 'índice (granel)' : 'referência'}</span>
                </div>
                {hovRow.channel !== undefined && (
                  <div className="mt-1 flex items-center gap-2">
                    <svg aria-hidden width="12" height="4">
                      <line x1="1" y1="2" x2="11" y2="2" stroke={tokens.fg} strokeOpacity={0.6} strokeWidth="2" strokeDasharray="3 2" />
                    </svg>
                    <span className="font-mono font-medium text-fg tnum">{fmt(hovRow.channel)}</span>
                    <span className="text-muted">embalado</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="font-mono text-xs text-muted tnum">Lote {lot.id}</div>
                {levels.map((l) => (
                  <div key={l.id} className="mt-1 flex items-center gap-2">
                    <svg aria-hidden width="12" height="4">
                      <line x1="1" y1="2" x2="11" y2="2" stroke={l.stroke} strokeWidth="2" strokeLinecap="round" strokeDasharray={l.dash} />
                    </svg>
                    <span className="font-mono font-medium text-fg tnum">{fmt(l.v)}</span>
                    <span className="text-muted">{l.label.toLowerCase()}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {focused && hover !== null
            ? hovRow
              ? `${monthLabel(hovRow.t)}: ${lowerInitial(indexLabel)} ${fmt(hovRow.index)}${hovRow.channel !== undefined ? `, ${lowerInitial(channelLabel)} ${fmt(hovRow.channel)}` : ''}`
              : `Lote ${lot.id}: ${levels.map((l) => `${l.label.toLowerCase()} ${fmt(l.v)}`).join(', ')}`
            : ''}
        </span>
      </div>
    </ChartFrame>
  );
});
