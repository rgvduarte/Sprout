import { getWorld } from '../../data';
import type { WorldId } from '../../data/types';
import { TODAY_DATE } from '../../lib/clock';
import { lisbonParts, MONTHS_LONG, MONTHS_SHORT } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { CampaignDef, Note } from './model';

/* =====================================================================
   Faixa do calendário agrícola da página: as fases da campanha (colheita,
   armazenagem e vendas) e, mês a mês, quantas notas o caderno tem.
   Figura estática: a lista de notas por baixo é a sua tabela.
   ===================================================================== */

interface Cell {
  key: string;
  label: string;
  long: string;
  kind: 'antes' | 'mes' | 'depois';
  month?: number;
}

const SERIES: Record<WorldId, string> = { azeite: 'var(--series-azeite)', agua: 'var(--series-agua)', cafe: 'var(--series-cafe)' };

function ymOf(iso: string) {
  const p = lisbonParts(iso);
  return p.year * 12 + (p.month - 1);
}

export function CampaignStrip({ c, notes, className }: { c: CampaignDef; notes: Note[]; className?: string }) {
  const startP = lisbonParts(`${c.start}T12:00:00Z`);
  const first = startP.year * 12 + (startP.month - 1);
  const last = first + 11;
  const buckets = new Map<string, Note[]>();
  const keyFor = (n: Note) => {
    const ym = ymOf(n.at);
    return ym < first ? 'antes' : ym > last ? 'depois' : String(ym);
  };
  for (const n of notes) buckets.set(keyFor(n), [...(buckets.get(keyFor(n)) ?? []), n]);

  const months: Cell[] = Array.from({ length: 12 }, (_, i) => {
    const ym = first + i;
    const y = Math.floor(ym / 12);
    const m = (ym % 12) + 1;
    return { key: String(ym), label: MONTHS_SHORT[m - 1], long: `${MONTHS_LONG[m - 1]} de ${y}`, kind: 'mes', month: m };
  });
  const cells: Cell[] = [
    ...(buckets.has('antes') ? [{ key: 'antes', label: 'antes', long: 'antes da campanha', kind: 'antes' as const }] : []),
    ...months,
    ...(buckets.has('depois') ? [{ key: 'depois', label: 'depois', long: 'depois da campanha', kind: 'depois' as const }] : []),
  ];
  const lead = buckets.has('antes') ? 1 : 0;

  // fases do mundo que desenha a faixa
  const phases = getWorld(c.strip).season.phases;
  const phaseOf = (m: number) => phases.find((ph) => (ph.startMonth <= ph.endMonth ? m >= ph.startMonth && m <= ph.endMonth : m >= ph.startMonth || m <= ph.endMonth));
  const groups: { label: string; strong: boolean; from: number; span: number }[] = [];
  months.forEach((cell, i) => {
    const ph = phaseOf(cell.month!);
    const strong = ph?.kind === 'colheita';
    const g = groups[groups.length - 1];
    if (g && g.label === ph?.label) g.span++;
    else groups.push({ label: ph?.label ?? '', strong, from: i, span: 1 });
  });

  // marcador de hoje (só nas páginas cuja janela contém hoje)
  const today = lisbonParts(`${TODAY_DATE}T12:00:00Z`);
  const tYm = today.year * 12 + (today.month - 1);
  const showToday = c.state !== 'concluida' && tYm >= first && tYm <= last;
  const daysIn = new Date(Date.UTC(today.year, today.month, 0)).getUTCDate();
  const todayLeft = ((lead + (tYm - first) + (today.day - 0.5) / daysIn) / cells.length) * 100;

  const worlds = Array.from(new Set(notes.map((n) => n.world)));
  const summary = cells
    .filter((cell) => buckets.get(cell.key)?.length)
    .map((cell) => `${cell.long}: ${buckets.get(cell.key)!.length} ${buckets.get(cell.key)!.length === 1 ? 'nota' : 'notas'}`)
    .join('; ');
  const cols = { gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` };

  return (
    <figure className={cn('min-w-0', className)} data-world={c.strip}>
      <div role="img" aria-label={`${c.label}, de outubro a setembro. ${summary || 'Ainda sem notas.'}`} className="relative">
        {/* fases */}
        <div className="grid h-7 overflow-hidden rounded-sm border border-border" style={cols}>
          {lead === 1 && <div className="border-r border-border bg-surface-2" />}
          {groups.map((g) => (
            <div
              key={g.from}
              className="flex min-w-0 items-center overflow-hidden border-r border-border px-1.5 last:border-r-0"
              style={{ gridColumn: `span ${g.span}`, background: g.strong ? 'color-mix(in oklab, var(--world) 30%, var(--surface))' : 'color-mix(in oklab, var(--world) 10%, var(--surface))' }}
            >
              <span className="truncate text-xs font-medium text-world-ink">{g.label}</span>
            </div>
          ))}
          {buckets.has('depois') && <div className="border-l border-border bg-surface-2" />}
        </div>
        {/* notas por mês */}
        <div className="mt-1.5 grid" style={cols} aria-hidden>
          {cells.map((cell) => {
            const list = buckets.get(cell.key) ?? [];
            const shown = list.slice(0, 3);
            return (
              <div key={cell.key} className="flex min-h-[44px] min-w-0 flex-col items-center gap-[3px] pt-0.5">
                {shown.map((n) => (
                  <span key={n.id} className="size-2 shrink-0 rounded-full" style={{ background: SERIES[n.world], boxShadow: '0 0 0 2px var(--surface)' }} />
                ))}
                {list.length > 3 && <span className="font-mono text-[11px] leading-none text-muted tnum">+{list.length - 3}</span>}
              </div>
            );
          })}
        </div>
        <div className="grid" style={cols} aria-hidden>
          {cells.map((cell) => (
            <div key={cell.key} className={cn('truncate text-center font-mono text-[11px] text-muted', cell.kind !== 'mes' && 'italic')}>
              {cell.label}
            </div>
          ))}
        </div>
        {showToday && (
          <div className="pointer-events-none absolute -top-1 h-9 w-0" style={{ left: `${todayLeft}%` }} aria-hidden>
            <div className="absolute inset-y-0 -left-px w-0.5 bg-fg" />
            <span className="absolute -top-4 left-1 whitespace-nowrap text-[11px] font-medium text-fg">hoje</span>
          </div>
        )}
      </div>
      {worlds.length > 1 && (
        <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {worlds.map((w) => (
            <span key={w} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-full" style={{ background: SERIES[w] }} />
              Notas de {getWorld(w).commodity.toLowerCase()}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
