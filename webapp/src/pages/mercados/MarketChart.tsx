import { useMemo, useState } from 'react';
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { getMarketSeries, getWorld, MARKET_TODAY } from '../../data';
import type { Lot, MarketPoint, WorldId } from '../../data/types';
import { ChartFrame, ChartTooltipContent, SegmentedControl } from '../../components/ui';
import type { Column, LegendItem } from '../../components/ui';
import { cn } from '../../lib/cn';
import { date as fmtDate, MONTHS_SHORT, pct } from '../../lib/format';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { seriesColor, useTokens } from '../../lib/useTokens';
import { niceDomain, priceNumber, unitPrice } from './model';

/* =====================================================================
   Referência de mercado: 60 dias (resumo) e 24 meses + 60 dias (mundo),
   com o preço de venda ao comprador dos lotes abertos como faixa.
   Uma só escala, linha de 2 px, grelha em linha fina, rótulo só no fim.
   ===================================================================== */

type Range = '24m' | '60d';

const tickDay = (t: string) => {
  const [, m, d] = t.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
};
const tickMonth = (t: string) => {
  const [y, m] = t.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
};
const longLabel = (t: string) => (t.length > 7 ? fmtDate(t) : (() => {
  const [y, m] = t.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]}. ${y}`;
})());

function priceColumns(world: WorldId): Column<MarketPoint>[] {
  const unit = getWorld(world).priceUnit;
  return [
    { key: 't', header: 'Data', render: (r) => longLabel(r.t), sortValue: (r) => r.t, mono: true },
    { key: 'v', header: `€/${unit}`, align: 'right', mono: true, render: (r) => priceNumber(world, r.value), sortValue: (r) => r.value },
  ];
}

const AXIS_FONT = 12;

/* ------------------------------------------------------------ resumo: 60 dias */

/** Referência dos últimos 60 dias com o preço ao comprador do lote em destaque. */
export function MiniReferenceChart({ world, lot, className }: { world: WorldId; lot: Lot; className?: string }) {
  const tokens = useTokens();
  const series = getMarketSeries(world);
  const data = series.daily;
  const color = seriesColor(tokens, world);
  const buyer = lot.economics.buyerPrice;
  const values = data.map((d) => d.value);
  const { domain, ticks } = niceDomain(Math.min(...values, buyer), Math.max(...values), 3);
  const last = data[data.length - 1];
  const isPreview = lot.status === 'fase-2';
  const legend: LegendItem[] = [
    { label: 'Referência de mercado', color, kind: 'line' },
    { label: `${isPreview ? 'Preço indicativo' : 'Preço ao comprador'} · ${lot.id}`, color: tokens.fg, kind: 'line', dashed: true },
  ];
  const xTicks = ['2026-08-15', '2026-09-01', '2026-09-15', '2026-10-01'];
  const unit = getWorld(world).priceUnit;
  return (
    <ChartFrame
      className={className}
      title="Referência, 60 dias"
      description={`€/${unit} · índice ilustrativo`}
      legend={legend}
      height={176}
      table={{ caption: `${series.label}, últimos 60 dias`, rows: data, getRowId: (r) => r.t, columns: priceColumns(world) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 18, right: 26, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={tokens.chartGrid} vertical={false} />
          <XAxis dataKey="t" ticks={xTicks} tickFormatter={tickDay} tick={{ fill: tokens.chartAxis, fontSize: AXIS_FONT }} axisLine={{ stroke: tokens.chartGrid }} tickLine={false} />
          <YAxis domain={domain} ticks={ticks} width={unit === 'L' ? 44 : 38} tickFormatter={(v: number) => priceNumber(world, v)} tick={{ fill: tokens.chartAxis, fontSize: AXIS_FONT }} axisLine={false} tickLine={false} />
          <RTooltip cursor={{ stroke: tokens.chartAxis, strokeWidth: 1 }} content={<ChartTooltipContent valueFormatter={(v) => unitPrice(world, v)} labelFormatter={(l) => fmtDate(String(l))} />} />
          <ReferenceLine y={buyer} stroke={tokens.fg} strokeWidth={1.5} strokeDasharray="4 3" ifOverflow="extendDomain" />
          <Line type="monotone" dataKey="value" name="Referência" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: tokens.surface, strokeWidth: 2 }} isAnimationActive={false} />
          <ReferenceDot x={last.t} y={last.value} r={4} fill={color} stroke={tokens.surface} strokeWidth={2} label={{ value: priceNumber(world, last.value), position: 'top', fill: tokens.fg, fontSize: AXIS_FONT, fontFamily: tokens.fontMono }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------ mundo: 24 meses + 60 dias */

export interface ReferenceChartProps {
  world: WorldId;
  /** lotes abertos (ou de pré-visualização, no café) que desenham a faixa */
  lots: Lot[];
  /** chamado quando o utilizador compara um lote com a referência */
  onCompare?: (lot: Lot) => void;
}

export function ReferenceChart({ world, lots, onCompare }: ReferenceChartProps) {
  const tokens = useTokens();
  const wide = useMediaQuery('(min-width: 640px)', true);
  const [range, setRange] = useState<Range>('24m');
  const [compareId, setCompareId] = useState<string | null>(null);
  const series = getMarketSeries(world);
  const data = range === '24m' ? series.monthly : series.daily;
  const color = seriesColor(tokens, world);
  const unit = getWorld(world).priceUnit;
  const today = MARKET_TODAY[world];
  const buyers = lots.map((l) => l.economics.buyerPrice);
  const low = buyers.length ? Math.min(...buyers) : undefined;
  const high = buyers.length ? Math.max(...buyers) : undefined;
  const isPreview = lots.some((l) => l.status === 'fase-2');
  // Faixa só quando os lotes partilham a mesma referência de entrada (±2 %); se não, uma linha por lote.
  const refs = lots.map((l) => l.economics.refPrice);
  const isBand = lots.length > 1 && (Math.max(...refs) - Math.min(...refs)) / Math.max(...refs) <= 0.02 && high! - low! > 1e-9;
  const compare = lots.find((l) => l.id === compareId);

  const { domain, ticks } = useMemo(() => {
    const values = data.map((d) => d.value);
    return niceDomain(Math.min(...values, low ?? Infinity), Math.max(...values, high ?? -Infinity), 4);
  }, [data, low, high]);

  const xTicks = range === '24m' ? (wide ? ['2024-11', '2025-02', '2025-05', '2025-08', '2025-11', '2026-02', '2026-05', '2026-08'] : ['2024-11', '2025-05', '2025-11', '2026-05']) : wide ? ['2026-08-15', '2026-09-01', '2026-09-15', '2026-10-01'] : ['2026-08-15', '2026-09-15', '2026-10-01'];
  const first = data[0];
  const last = data[data.length - 1];
  const change = last.value / first.value - 1;
  const bandName = isPreview ? 'Preço indicativo dos lotes da Fase 2' : 'Preço ao comprador nos lotes abertos';

  const legend: LegendItem[] = [{ label: 'Referência de mercado', color, kind: 'line' }];
  if (low !== undefined)
    legend.push(
      isBand
        ? { label: `${bandName} (${priceNumber(world, low)}–${priceNumber(world, high!)})`, color: `color-mix(in oklab, ${color} 55%, ${tokens.surface})`, kind: 'rect' }
        : { label: `${bandName} (${lots.map((l) => priceNumber(world, l.economics.buyerPrice)).join(' e ')})`, color, kind: 'line', dashed: true },
    );
  if (compare) legend.push({ label: `${compare.id} · venda a ${priceNumber(world, compare.economics.buyerPrice)}`, color: tokens.fg, kind: 'line', dashed: true });

  const pick = (lot: Lot) => {
    const next = compareId === lot.id ? null : lot.id;
    setCompareId(next);
    if (next) onCompare?.(lot);
  };

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Período do gráfico"
          size="sm"
          value={range}
          onChange={setRange}
          options={[
            { value: '24m', label: '24 meses' },
            { value: '60d', label: '60 dias' },
          ]}
        />
        <p className="text-sm text-muted">
          {range === '24m' ? '24 meses' : '60 dias'}: <span className="font-mono text-fg tnum">{pct(change, 1, { sign: true })}</span>
        </p>
      </div>
      <ChartFrame
        title="Referência de mercado"
        description={`${series.label} · €/${unit} · ${range === '24m' ? 'mensal, nov. 2024 a out. 2026' : 'diário, 15/08 a 13/10/2026'}`}
        legend={legend}
        height={wide ? 272 : 236}
        table={{ caption: `${series.label}, ${range === '24m' ? '24 meses' : '60 dias'}`, rows: data, getRowId: (r) => r.t, columns: priceColumns(world) }}
        footnote={`${series.note} ${low !== undefined ? `${isBand ? 'A faixa marca' : lots.length > 1 ? 'As linhas tracejadas marcam' : 'A linha tracejada marca'} ${isPreview ? 'o preço indicativo' : 'o preço de venda ao comprador'} ${lots.length > 1 ? 'dos lotes' : 'do lote'} de hoje: o espaço até à linha da referência é o desconto.` : ''}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 28, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={tokens.chartGrid} vertical={false} />
            <XAxis dataKey="t" ticks={xTicks} tickFormatter={range === '24m' ? tickMonth : tickDay} tick={{ fill: tokens.chartAxis, fontSize: AXIS_FONT }} axisLine={{ stroke: tokens.chartGrid }} tickLine={false} />
            <YAxis domain={domain} ticks={ticks} width={unit === 'L' ? 46 : 40} tickFormatter={(v: number) => priceNumber(world, v)} tick={{ fill: tokens.chartAxis, fontSize: AXIS_FONT }} axisLine={false} tickLine={false} />
            <RTooltip cursor={{ stroke: tokens.chartAxis, strokeWidth: 1 }} content={<ChartTooltipContent valueFormatter={(v) => unitPrice(world, v)} labelFormatter={(l) => longLabel(String(l))} />} />
            {isBand && <ReferenceArea y1={low} y2={high} fill={color} fillOpacity={0.45} stroke={color} strokeOpacity={0.9} strokeWidth={1} ifOverflow="extendDomain" />}
            {!isBand &&
              lots
                .filter((l) => l.id !== compareId)
                .map((l) => <ReferenceLine key={l.id} y={l.economics.buyerPrice} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />)}
            {compare && (
              <ReferenceLine
                y={compare.economics.buyerPrice}
                stroke={tokens.fg}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                label={{ value: `${compare.id} · ${priceNumber(world, compare.economics.buyerPrice)}`, position: 'insideBottomLeft', fill: tokens.fg, fontSize: AXIS_FONT, fontFamily: tokens.fontMono }}
              />
            )}
            <Line type="monotone" dataKey="value" name="Referência" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: tokens.surface, strokeWidth: 2 }} isAnimationActive={false} />
            <ReferenceDot x={last.t} y={last.value} r={4} fill={color} stroke={tokens.surface} strokeWidth={2} label={{ value: priceNumber(world, last.value), position: 'top', fill: tokens.fg, fontSize: AXIS_FONT, fontFamily: tokens.fontMono }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
        {[
          { label: 'Hoje', value: unitPrice(world, today) },
          { label: 'Há 12 meses', value: unitPrice(world, series.monthly[series.monthly.length - 13].value) },
          { label: 'Mínimo em 24 meses', value: unitPrice(world, Math.min(...series.monthly.map((m) => m.value))) },
          { label: range === '24m' ? 'Variação, 24 meses' : 'Variação, 60 dias', value: pct(change, 1, { sign: true }) },
        ].map((it) => (
          <div key={it.label} className="min-w-0">
            <dt className="text-sm text-muted">{it.label}</dt>
            <dd className="mt-0.5 font-mono text-[0.9375rem] text-fg tnum">{it.value}</dd>
          </div>
        ))}
      </dl>

      {lots.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-medium text-fg" id={`cmp-${world}`}>
            {isPreview ? 'Compara um lote da Fase 2 com a referência' : 'Compara um lote aberto com a referência de hoje'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby={`cmp-${world}`}>
            {lots.map((l) => {
              const on = l.id === compareId;
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(l)}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-sm border px-3 text-sm transition-colors duration-150',
                    on ? 'border-accent bg-accent-soft text-fg' : 'border-border bg-surface text-fg hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] hover:bg-surface-2',
                  )}
                >
                  <span aria-hidden className={cn('inline-block h-0 w-4 border-t-2 border-dashed', on ? 'border-fg' : 'border-muted')} />
                  <span className="font-mono tnum">{l.id}</span>
                  <span className="text-muted">{unitPrice(world, l.economics.buyerPrice)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 min-h-12 text-sm text-muted" aria-live="polite">
            {compare ? (
              <>
                <span className="font-mono text-fg tnum">{compare.id}</span> {isPreview ? 'teria um preço indicativo de' : 'vende ao comprador a'}{' '}
                <span className="font-mono text-fg tnum">{unitPrice(world, compare.economics.buyerPrice)}</span>:{' '}
                <span className="font-mono text-fg tnum">{unitPrice(world, today - compare.economics.buyerPrice)}</span> ({pct(1 - compare.economics.buyerPrice / today, 1)}) abaixo da referência de hoje, {unitPrice(world, today)}. O desconto contratual é de {pct(compare.economics.discountPct, 0)} sobre {unitPrice(world, compare.economics.refPrice)}, a referência na abertura.
              </>
            ) : (
              'Escolhe um lote para ver o preço de venda contra a referência e quanto fica para o comprador.'
            )}
          </p>
        </div>
      )}
    </div>
  );
}
