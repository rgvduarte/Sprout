import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useEdgeFade } from '../../lib/useEdgeFade';
import { EmptyState } from './Display';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** conteúdo da célula */
  render: (row: T) => ReactNode;
  /** valor para ordenar (ativa a ordenação nesta coluna) */
  sortValue?: (row: T) => number | string;
  align?: 'left' | 'right' | 'center';
  /** números/IDs: mono tabular */
  mono?: boolean;
  /** largura mínima (px) */
  minWidth?: number;
  /** esconder o cabeçalho visual (fica acessível) */
  srHeader?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** legenda da tabela (acessível; visível se captionVisible) */
  caption: string;
  captionVisible?: boolean;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  empty?: { title: string; body?: ReactNode; action?: ReactNode };
  /** altura máxima com cabeçalho fixo (px) */
  maxHeight?: number;
  dense?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  className?: string;
  /** borda e fundo próprios (por omissão sim); dentro de um Card use framed={false} */
  framed?: boolean;
}

/**
 * Tabela ordenável com cabeçalho fixo e contentor próprio de scroll horizontal
 * (a página nunca faz scroll lateral). Densa: 14 px, algarismos tabulares.
 */
export function DataTable<T>({ columns, rows, getRowId, caption, captionVisible, initialSort, empty, maxHeight, dense = true, onRowClick, rowClassName, className, framed = true }: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort);
  const scrollRef = useRef<HTMLDivElement>(null);
  // com colunas fora de vista, a margem esbate-se do lado onde há mais (a tabela não parece cortada)
  const fade = useEdgeFade(scrollRef);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'pt-PT') * dir;
    });
  }, [rows, columns, sort]);

  if (!rows.length && empty) return <EmptyState title={empty.title} body={empty.body} action={empty.action} className={className} />;

  return (
    <div className={cn('min-w-0', framed && 'rounded-md border border-border bg-surface', !framed && '-mx-4 sm:mx-0', className)}>
      <div ref={scrollRef} className="overflow-x-auto" style={{ ...(maxHeight ? { maxHeight, overflowY: 'auto' as const } : undefined), ...fade }} tabIndex={0} role="region" aria-label={caption}>
        <table className={cn('w-full border-collapse text-left', dense ? 'text-sm' : 'text-[0.9375rem]')}>
          <caption className={captionVisible ? 'px-4 pb-1 pt-3 text-left text-sm text-muted' : 'sr-only'}>{caption}</caption>
          <thead className="sticky top-0 z-[1] bg-surface-2">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const ariaSort = active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : c.sortValue ? 'none' : undefined;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={ariaSort}
                    style={c.minWidth ? { minWidth: c.minWidth } : undefined}
                    className={cn('whitespace-nowrap border-b border-border px-3 py-0 font-medium text-muted first:pl-4 last:pr-4', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => setSort(active ? { key: c.key, dir: sort!.dir === 'desc' ? 'asc' : 'desc' } : { key: c.key, dir: 'desc' })}
                        className={cn('inline-flex h-10 items-center gap-1 hover:text-fg', c.align === 'right' && 'flex-row-reverse', active && 'text-fg')}
                      >
                        <span className={c.srHeader ? 'sr-only' : undefined}>{c.header}</span>
                        {active ? sort!.dir === 'asc' ? <ArrowUp aria-hidden className="size-3.5" /> : <ArrowDown aria-hidden className="size-3.5" /> : <ArrowUpDown aria-hidden className="size-3.5 opacity-50" />}
                      </button>
                    ) : (
                      <span className={cn('inline-flex h-10 items-center', c.srHeader && 'sr-only')}>{c.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('border-b border-border last:border-b-0', onRowClick && 'cursor-pointer hover:bg-surface-2', rowClassName?.(row))}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-3 align-middle first:pl-4 last:pr-4',
                      dense ? 'py-2.5' : 'py-3.5',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.mono && 'font-mono tnum',
                      c.className,
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
