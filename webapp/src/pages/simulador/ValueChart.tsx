import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame, ChartTooltipContent } from '../../components/ui';
import { useTokens } from '../../lib/useTokens';
import { eur } from '../../lib/format';
import { WINDOW, monthLabel, monthShort } from './deck';
import type { SimRun } from './engine';
import { fe } from './parts';

interface Row {
  m: number;
  value: number | null;
  cf: number | null;
}

/**
 * Liquidação estimada da carteira fictícia, mês a mês: as tuas escolhas
 * contra a mesma campanha sem coberturas (forma de ênfase: uma linha forte,
 * a outra recessiva) e o capital investido como referência.
 */
export function ValueChart({ run, counterfactual, month, title = 'Liquidação estimada, mês a mês', height = 260 }: { run: SimRun; counterfactual?: SimRun; month: number; title?: string; height?: number }) {
  const t = useTokens();
  const lastMonth = run.months[run.months.length - 1]?.month ?? 0;
  const xMax = Math.max(WINDOW, month > WINDOW || run.complete ? lastMonth : WINDOW);
  const showCf = Boolean(counterfactual) && run.allocations.some((a) => a.hedged);

  const rows: Row[] = useMemo(
    () =>
      Array.from({ length: xMax + 1 }, (_, m) => ({
        m,
        value: m <= month ? (run.months.find((x) => x.month === m)?.value ?? null) : null,
        cf: showCf && m <= month ? (counterfactual!.months.find((x) => x.month === m)?.value ?? null) : null,
      })),
    [xMax, month, run, counterfactual, showCf],
  );

  // escala estável que não revela o futuro: à volta do capital, alarga se for preciso
  const seen = rows.flatMap((r) => [r.value, r.cf]).filter((v): v is number => v !== null);
  const lo = Math.min(run.invested * 0.82, ...seen);
  const hi = Math.max(run.invested * 1.14, ...seen);
  const step = run.invested >= 20000 ? 5000 : 2000;
  const domain: [number, number] = [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
  const yTicks = Array.from({ length: Math.round((domain[1] - domain[0]) / step) + 1 }, (_, i) => domain[0] + i * step);
  const current = rows[month]?.value;
  const tableRows = rows.filter((r) => r.value !== null);

  // linha de contexto: um passo do cinzento em direção à superfície (forma de ênfase)
  const ctx = `color-mix(in oklab, ${t.muted} 55%, ${t.surface})`;
  const legend = [
    { label: 'Com as tuas escolhas', color: t.accent },
    ...(showCf ? [{ label: 'A mesma campanha sem coberturas', color: ctx }] : []),
    { label: 'Capital investido', color: t.chartRef, dashed: true },
  ];

  return (
    <ChartFrame
      title={title}
      description={current !== null && current !== undefined ? `${monthLabel(month)} · ${fe(current)} fictícios, se o stock que falta se vendesse ao preço de hoje.` : 'Valor da carteira fictícia se o stock que falta se vendesse ao preço de cada mês.'}
      legend={legend}
      height={height}
      table={{
        caption: 'Liquidação estimada por mês, € fictícios',
        rows: tableRows,
        getRowId: (r) => String(r.m),
        columns: [
          { key: 'm', header: 'Mês', render: (r) => `${r.m} · ${monthLabel(r.m)}` },
          { key: 'v', header: 'Com as tuas escolhas', align: 'right', mono: true, render: (r) => (r.value === null ? '—' : fe(r.value)) },
          ...(showCf ? [{ key: 'cf', header: 'Sem coberturas', align: 'right' as const, mono: true, render: (r: Row) => (r.cf === null ? '—' : fe(r.cf)) }] : []),
        ],
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={t.chartGrid} vertical={false} />
          <XAxis
            dataKey="m"
            type="number"
            domain={[0, xMax]}
            ticks={Array.from({ length: Math.floor(xMax / 3) + 1 }, (_, i) => i * 3)}
            tickFormatter={(m: number) => (m === 0 ? 'out.' : monthShort(m))}
            tick={{ fill: t.chartAxis, fontSize: 12 }}
            axisLine={{ stroke: t.chartGrid }}
            tickLine={false}
          />
          <YAxis width={52} domain={domain} ticks={yTicks} interval={0} tick={{ fill: t.chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => eur(v, { compact: true })} />
          <ReferenceLine y={run.invested} stroke={t.chartRef} strokeDasharray="4 4" strokeWidth={1} ifOverflow="extendDomain" />
          <ReferenceLine x={WINDOW} stroke={t.chartGrid} strokeWidth={1} />
          <RTooltip
            cursor={{ stroke: t.chartAxis, strokeWidth: 1 }}
            content={<ChartTooltipContent valueFormatter={(v) => fe(v)} labelFormatter={(m) => `Mês ${m} · ${monthLabel(Number(m))}`} />}
          />
          {showCf && <Line type="linear" dataKey="cf" name="Sem coberturas" stroke={ctx} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls={false} />}
          <Line
            type="linear"
            dataKey="value"
            name="Com as tuas escolhas"
            stroke={t.accent}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: t.surface, strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
