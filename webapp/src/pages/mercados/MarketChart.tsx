import { useMemo, useState } from 'react';
import { CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { getMarketSeries, getWorld, MARKET_TODAY, referenceToday } from '../../data';
import type { Lot, MarketPoint, WorldId } from '../../data/types';
import { ChartFrame, ChartTooltipContent, SegmentedControl } from '../../components/ui';
import type { Column, LegendItem } from '../../components/ui';
import { cn } from '../../lib/cn';
import { date as fmtDate, lowerInitial, MONTHS_SHORT, pct } from '../../lib/format';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { seriesColor, useTokens } from '../../lib/useTokens';
import { niceDomain, priceNumber, unitPrice } from './model';

/* =====================================================================
   Mercado de cada mundo: 60 dias (resumo) e 24 meses + 60 dias (mundo).
   No azeite o índice é granel e as referências do canal são produto
   embalado: nunca se comparam entre si. Os lotes abertos aparecem como
   linhas com rótulo direto. Uma só escala, grelha fina, rótulo no fim.
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

/* ------------------------------------------------------------ séries */

interface ChartRow {
  t: string;
  value: number;
  horeca?: number;
  embalador?: number;
}

/**
 * Linhas do gráfico de um mundo. No azeite, o índice é granel e as referências
 * HoReCa e de saída do embalador são preço embalado, derivadas do índice com a
 * diferença de hoje constante (a mesma regra dos dados); nas outras vistas só há
 * a série do mundo.
 */
function chartRows(world: WorldId, range: Range): ChartRow[] {
  const series = getMarketSeries(world);
  const base = range === '24m' ? series.monthly : series.daily;
  const refs = series.references ?? [];
  const today = MARKET_TODAY[world];
  return base.map((p, i) => {
    const row: ChartRow = { t: p.t, value: p.value };
    for (const r of refs) {
      const v = range === '24m' ? r.monthly[i]?.value : Math.round((p.value + (r.today - today)) * 100) / 100;
      if (v !== undefined) row[r.id] = v;
    }
    return row;
  });
}

/** Rótulo de fim de linha que não colide com a própria linha: por cima se a linha sobe para o ponto, por baixo se desce. */
function endLabelPosition(values: number[]): 'top' | 'bottom' {
  const n = values.length;
  return n < 2 || values[n - 2] <= values[n - 1] ? 'top' : 'bottom';
}

/** O que o lote paga ou recebe na mesma base do índice do mundo (granel com granel, verde com verde, água com água). */
function comparableLevel(lot: Lot): { value: number; label: string } {
  const e = lot.economics;
  if (lot.world === 'azeite') return { value: e.acquisitionPrice, label: 'Aquisição ao lagar (índice + prémio)' };
  if (lot.status === 'fase-2') return { value: e.buyerPrice, label: 'Preço indicativo à torrefação' };
  return { value: e.buyerPrice, label: 'Preço ao comprador' };
}

/* ------------------------------------------------------------ resumo: 60 dias */

/**
 * Índice dos últimos 60 dias com o nível do lote na mesma base: no azeite a
 * aquisição ao lagar (granel), nunca o preço embalado ao comprador.
 */
export function MiniReferenceChart({ world, lot, className }: { world: WorldId; lot: Lot; className?: string }) {
  const tokens = useTokens();
  const series = getMarketSeries(world);
  const data = series.daily;
  const color = seriesColor(tokens, world);
  const level = comparableLevel(lot);
  const values = data.map((d) => d.value);
  const { domain, ticks } = niceDomain(Math.min(...values, level.value), Math.max(...values, level.value), 3);
  const last = data[data.length - 1];
  const legend: LegendItem[] = [
    { label: series.label, color, kind: 'line' },
    { label: `${level.label} · ${lot.id}`, color: tokens.fg, kind: 'line', dashed: true },
  ];
  const xTicks = ['2026-08-15', '2026-09-01', '2026-09-15', '2026-10-01'];
  const unit = getWorld(world).priceUnit;
  return (
    <ChartFrame
      className={className}
      title={world === 'azeite' ? 'Índice de origem, 60 dias' : 'Referência, 60 dias'}
      description={`€/${unit} · índice ilustrativo${world === 'azeite' ? ' · granel' : ''}`}
      legend={legend}
      height={176}
      table={{ caption: `${series.label}, últimos 60 dias`, rows: data, getRowId: (r) => r.t, columns: priceColumns(world) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 18, right: 30, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={tokens.chartGrid} vertical={false} />
          <XAxis dataKey="t" ticks={xTicks} tickFormatter={tickDay} tick={{ fill: tokens.chartAxis, fontSize: AXIS_FONT }} axisLine={{ stroke: tokens.chartGrid }} tickLine={false} />
          <YAxis domain={domain} ticks={ticks} width={unit === 'L' ? 44 : 38} tickFormatter={(v: number) => priceNumber(world, v)} tick={{ fill: tokens.chartAxis, fontSize: AXIS_FONT }} axisLine={false} tickLine={false} />
          <RTooltip cursor={{ stroke: tokens.chartAxis, strokeWidth: 1 }} content={<ChartTooltipContent valueFormatter={(v) => unitPrice(world, v)} labelFormatter={(l) => fmtDate(String(l))} />} />
          <ReferenceLine y={level.value} stroke={tokens.fg} strokeWidth={1.5} strokeDasharray="4 3" ifOverflow="extendDomain" />
          <Line type="monotone" dataKey="value" name={series.label} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: tokens.surface, strokeWidth: 2 }} isAnimationActive={false} />
          <ReferenceDot
            x={last.t}
            y={last.value}
            r={4}
            fill={color}
            stroke={tokens.surface}
            strokeWidth={2}
            label={{ value: priceNumber(world, last.value), position: endLabelPosition(values), offset: 9, fill: tokens.fg, fontSize: AXIS_FONT, fontFamily: tokens.fontMono }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------ mundo: 24 meses + 60 dias */

export interface ReferenceChartProps {
  world: WorldId;
  /** lotes abertos (ou de pré-visualização, no café) que desenham as linhas de preço */
  lots: Lot[];
  /** chamado quando o utilizador compara um lote com a referência */
  onCompare?: (lot: Lot) => void;
}

/** Amostra de linha (legenda e botões): SVG, nunca um traço de texto. */
function LineSwatch({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg aria-hidden width="18" height="6" className="shrink-0">
      <line x1="1" y1="3" x2="17" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={dashed ? '4 3' : undefined} />
    </svg>
  );
}

export function ReferenceChart({ world, lots, onCompare }: ReferenceChartProps) {
  const tokens = useTokens();
  const wide = useMediaQuery('(min-width: 640px)', true);
  const [range, setRange] = useState<Range>('24m');
  const [compareId, setCompareId] = useState<string | null>(null);
  const series = getMarketSeries(world);
  const data = useMemo(() => chartRows(world, range), [world, range]);
  const refs = series.references ?? [];
  const color = seriesColor(tokens, world);
  const unit = getWorld(world).priceUnit;
  const today = MARKET_TODAY[world];
  const isPreview = lots.some((l) => l.status === 'fase-2');
  const compare = lots.find((l) => l.id === compareId);
  const refColor: Record<string, string> = { horeca: tokens.fg, embalador: tokens.chartAxis };

  const { domain, ticks } = useMemo(() => {
    const values = data.flatMap((d) => [d.value, d.horeca, d.embalador].filter((v): v is number => v !== undefined));
    const lotValues = lots.map((l) => l.economics.buyerPrice);
    return niceDomain(Math.min(...values, ...lotValues), Math.max(...values, ...lotValues), 4);
  }, [data, lots]);

  const xTicks = range === '24m' ? (wide ? ['2024-11', '2025-02', '2025-05', '2025-08', '2025-11', '2026-02', '2026-05', '2026-08'] : ['2024-11', '2025-05', '2025-11', '2026-05']) : wide ? ['2026-08-15', '2026-09-01', '2026-09-15', '2026-10-01'] : ['2026-08-15', '2026-09-15', '2026-10-01'];
  const first = data[0];
  const last = data[data.length - 1];
  const change = last.value / first.value - 1;

  const legend: LegendItem[] = [
    { label: `${series.label}${world === 'azeite' ? ' (granel)' : ''}`, color, kind: 'line' },
    ...refs.map((r) => ({ label: `${r.label} (embalado)`, color: refColor[r.id] ?? tokens.fg, kind: 'line' as const })),
  ];
  if (lots.length) legend.push({ label: isPreview ? 'Preço indicativo dos lotes da Fase 2' : 'Preço ao comprador dos lotes abertos', color, kind: 'line', dashed: true });

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
          {world === 'azeite' ? 'Índice de origem, ' : ''}
          {range === '24m' ? '24 meses' : '60 dias'}: <span className="font-mono text-fg tnum">{pct(change, 1, { sign: true })}</span>
        </p>
      </div>
      <ChartFrame
        title={world === 'azeite' ? 'Índice de origem e referências embaladas' : 'Referência de mercado'}
        description={`${series.label} · €/${unit} · ${range === '24m' ? 'mensal, nov. 2024 a out. 2026' : 'diário, 15/08 a 13/10/2026'}`}
        legend={legend}
        height={wide ? 296 : 248}
        table={{
          caption: `${series.label}, ${range === '24m' ? '24 meses' : '60 dias'}`,
          rows: data,
          getRowId: (r) => r.t,
          columns: [
            { key: 't', header: 'Data', render: (r) => longLabel(r.t), sortValue: (r) => r.t, mono: true },
            { key: 'v', header: world === 'azeite' ? 'Índice (granel)' : `€/${unit}`, align: 'right', mono: true, render: (r) => priceNumber(world, r.value), sortValue: (r) => r.value },
            ...refs.map((ref) => ({ key: ref.id, header: ref.label, align: 'right' as const, mono: true, render: (r: ChartRow) => (r[ref.id] !== undefined ? priceNumber(world, r[ref.id]!) : '—') })),
          ],
        }}
        footnote={`${series.note}${refs.length ? ' As referências embaladas são derivadas do índice e é contra elas que se mede o preço ao comprador; o granel nunca se compara com o preço embalado.' : ''}${lots.length ? ` As linhas tracejadas marcam ${isPreview ? 'o preço indicativo' : 'o preço ao comprador'} de cada lote, com o rótulo à direita.` : ''}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: wide ? 112 : 28, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={tokens.chartGrid} vertical={false} />
            <XAxis dataKey="t" ticks={xTicks} tickFormatter={range === '24m' ? tickMonth : tickDay} tick={{ fill: tokens.chartAxis, fontSize: AXIS_FONT }} axisLine={{ stroke: tokens.chartGrid }} tickLine={false} />
            <YAxis domain={domain} ticks={ticks} width={unit === 'L' ? 46 : 40} tickFormatter={(v: number) => priceNumber(world, v)} tick={{ fill: tokens.chartAxis, fontSize: AXIS_FONT }} axisLine={false} tickLine={false} />
            <RTooltip cursor={{ stroke: tokens.chartAxis, strokeWidth: 1 }} content={<ChartTooltipContent valueFormatter={(v) => unitPrice(world, v)} labelFormatter={(l) => longLabel(String(l))} />} />
            {lots.map((l) => {
              const on = l.id === compareId;
              return (
                <ReferenceLine
                  key={l.id}
                  y={l.economics.buyerPrice}
                  stroke={on ? tokens.fg : color}
                  strokeWidth={on ? 2 : 1.5}
                  strokeDasharray="4 3"
                  ifOverflow="extendDomain"
                  label={wide ? { value: `${l.id} ${priceNumber(world, l.economics.buyerPrice)}`, position: 'right', fill: tokens.fg, fontSize: AXIS_FONT, fontFamily: tokens.fontMono } : undefined}
                />
              );
            })}
            {refs.map((r) => (
              <Line key={r.id} type="monotone" dataKey={r.id} name={r.label} stroke={refColor[r.id] ?? tokens.fg} strokeWidth={1.5} dot={false} activeDot={{ r: 3.5, stroke: tokens.surface, strokeWidth: 2 }} isAnimationActive={false} />
            ))}
            <Line type="monotone" dataKey="value" name={series.label} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: tokens.surface, strokeWidth: 2 }} isAnimationActive={false} />
            <ReferenceDot
              x={last.t}
              y={last.value}
              r={4}
              fill={color}
              stroke={tokens.surface}
              strokeWidth={2}
              label={{ value: priceNumber(world, last.value), position: endLabelPosition(data.map((d) => d.value)), offset: 9, fill: tokens.fg, fontSize: AXIS_FONT, fontFamily: tokens.fontMono }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
        {[
          { label: world === 'azeite' ? 'Índice hoje' : 'Hoje', value: unitPrice(world, today) },
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
            {isPreview ? 'Compara um lote da Fase 2 com a referência do seu canal' : 'Compara um lote aberto com a referência do seu canal'}
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
                  <LineSwatch color={on ? tokens.fg : color} dashed />
                  <span className="font-mono tnum">{l.id}</span>
                  <span className="text-muted">{unitPrice(world, l.economics.buyerPrice)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 min-h-12 text-sm text-muted" aria-live="polite">
            {compare ? (
              <>
                <span className="font-mono text-fg tnum">{compare.id}</span> · {lowerInitial(compare.economics.channelLabel)}: {isPreview ? 'preço indicativo' : 'vende ao comprador a'}{' '}
                <span className="font-mono text-fg tnum">{unitPrice(world, compare.economics.buyerPrice)}</span>, {compare.economics.priceBasis}. Hoje, com o índice a{' '}
                <span className="font-mono text-fg tnum">{unitPrice(world, today)}</span>, a {lowerInitial(compare.economics.refLabel)} está em{' '}
                <span className="font-mono text-fg tnum">{unitPrice(world, referenceToday(compare))}</span>.
              </>
            ) : (
              'Escolhe um lote para ver o preço de venda contra a referência do canal em que é vendido.'
            )}
          </p>
        </div>
      )}
    </div>
  );
}
