import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { DataTable, type Column } from './DataTable';
import { SegmentedControl } from './Form';

export interface LegendItem {
  label: string;
  /** cor CSS (use tokens: var(--series-azeite), useTokens()) */
  color: string;
  kind?: 'line' | 'rect' | 'dot';
  /** traço tracejado = projeção/referência */
  dashed?: boolean;
}

export interface ChartFrameProps<T> {
  title: ReactNode;
  description?: ReactNode;
  /** legenda (obrigatória com ≥ 2 séries) */
  legend?: LegendItem[];
  /** equivalente acessível do gráfico (vista de tabela) */
  table?: { columns: Column<T>[]; rows: T[]; getRowId: (row: T) => string; caption: string };
  /** altura do gráfico INCLUINDO a faixa do eixo x */
  height?: number;
  footnote?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Moldura de gráfico: título, legenda, alternância Gráfico/Tabela e nota.
 * Regras (dataviz): uma só escala no eixo y, marcas finas, grelha em linha fina
 * e contínua, texto nunca na cor da série, tooltip nunca é o único acesso ao valor.
 */
export function ChartFrame<T>({ title, description, legend, table, height = 260, footnote, actions, children, className }: ChartFrameProps<T>) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <figure className={cn('min-w-0', className)}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <figcaption className="min-w-0 flex-1">
          <span className="block font-display text-[1.0625rem] font-semibold leading-tight text-fg">{title}</span>
          {description && <span className="mt-1 block text-sm text-muted">{description}</span>}
        </figcaption>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {table && (
            <SegmentedControl
              label="Vista do gráfico"
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: 'chart', label: 'Gráfico' },
                { value: 'table', label: 'Tabela' },
              ]}
            />
          )}
        </div>
      </div>
      {legend && legend.length > 0 && view === 'chart' && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Legenda">
          {legend.map((l) => (
            <li key={l.label} className="inline-flex items-center gap-2">
              {l.kind === 'rect' ? (
                <span aria-hidden className="inline-block size-2.5 rounded-[2px]" style={{ background: l.color }} />
              ) : l.kind === 'dot' ? (
                <span aria-hidden className="inline-block size-2.5 rounded-full" style={{ background: l.color }} />
              ) : (
                <svg aria-hidden width="18" height="6" className="shrink-0">
                  <line x1="1" y1="3" x2="17" y2="3" stroke={l.color} strokeWidth="2" strokeLinecap="round" strokeDasharray={l.dashed ? '3 3' : undefined} />
                </svg>
              )}
              {l.label}
            </li>
          ))}
        </ul>
      )}
      {view === 'chart' ? (
        <div className="w-full min-w-0" style={{ height }}>
          {children}
        </div>
      ) : (
        table && <DataTable columns={table.columns} rows={table.rows} getRowId={table.getRowId} caption={table.caption} maxHeight={height + 60} />
      )}
      {footnote && <p className="mt-2 text-sm text-muted">{footnote}</p>}
    </figure>
  );
}

/* ------------------------------------------------------------ tooltip recharts */

interface TooltipEntry {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  stroke?: string;
  fill?: string;
  dataKey?: string | number;
}

export interface ChartTooltipContentProps {
  active?: boolean;
  payload?: readonly TooltipEntry[] | TooltipEntry[];
  label?: string | number;
  /** formata o valor de cada série */
  valueFormatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string | number) => string;
}

/**
 * Conteúdo de tooltip para recharts: valor primeiro (forte), nome da série depois,
 * com chave de traço da cor da série. Uso: <Tooltip content={<ChartTooltipContent … />} />
 */
export function ChartTooltipContent({ active, payload, label, valueFormatter, labelFormatter }: ChartTooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="min-w-[160px] rounded-sm border border-border bg-surface px-3 py-2 text-sm shadow-pop">
      {label !== undefined && <div className="mb-1.5 font-mono text-xs text-muted tnum">{labelFormatter ? labelFormatter(label) : String(label)}</div>}
      <ul className="flex flex-col gap-1">
        {payload.map((p, i) => {
          const v = Array.isArray(p.value) ? p.value[p.value.length - 1] : p.value;
          const num = typeof v === 'number' ? v : Number(v);
          const color = p.color ?? p.stroke ?? p.fill ?? 'var(--muted)';
          return (
            <li key={`${p.dataKey ?? i}`} className="flex items-center gap-2">
              <svg aria-hidden width="12" height="4" className="shrink-0">
                <line x1="1" y1="2" x2="11" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="font-mono font-medium text-fg tnum">{valueFormatter ? valueFormatter(num, String(p.name ?? '')) : String(v)}</span>
              <span className="truncate text-muted">{p.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
