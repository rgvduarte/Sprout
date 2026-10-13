import { useId } from 'react';
import { getWorld } from '../../data';
import type { SeasonPhase, WorldId } from '../../data';
import { CommodityGlyph } from '../../components/ui/Commodity';
import type { PositionView } from '../../state';
import { TODAY_DATE } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, lisbonParts, MONTHS_SHORT } from '../../lib/format';
import { plannedSettlement, windowOf } from './positions';

/* =====================================================================
   Calendário de liquidação: as janelas de 18 meses de todos os lotes num
   só eixo, desenhadas sobre as bandas do ano agrícola de cada mundo, com
   a linha de hoje. Cada linha abre a gaveta do lote.
   ===================================================================== */

interface Cell {
  y: number;
  m: number;
}

const monthIndex = (iso: string) => {
  const p = lisbonParts(iso);
  return p.year * 12 + (p.month - 1);
};

function inPhase(ph: SeasonPhase, m: number) {
  return ph.startMonth <= ph.endMonth ? m >= ph.startMonth && m <= ph.endMonth : m >= ph.startMonth || m <= ph.endMonth;
}
const strongKinds = new Set(['colheita', 'engarrafamento']);
const isStrong = (world: WorldId, m: number) => {
  const ph = getWorld(world).season.phases.find((p) => inPhase(p, m));
  return Boolean(ph && strongKinds.has(ph.kind));
};

const BG_STRONG = 'color-mix(in oklab, var(--world) 24%, var(--surface))';
const BG_LIGHT = 'color-mix(in oklab, var(--world) 8%, var(--surface))';

function Hatch({ id }: { id: string }) {
  return (
    <svg aria-hidden className="block h-full w-full" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--world-ink)" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function SettlementCalendar({ positions, onOpen }: { positions: PositionView[]; onOpen: (p: PositionView) => void }) {
  const uid = useId().replace(/:/g, '');
  const rows = positions
    .filter((p) => p.status !== 'liquidado')
    .map((p) => ({ p, w: windowOf(p.lot), settle: plannedSettlement(p.lot) }))
    .sort((a, b) => a.w.start.localeCompare(b.w.start));
  if (!rows.length) return null;

  const first = Math.min(...rows.map((r) => monthIndex(r.w.start)), monthIndex(TODAY_DATE));
  const last = Math.max(...rows.map((r) => monthIndex(r.w.extEnd ?? r.w.end)));
  const cells: Cell[] = Array.from({ length: last - first + 1 }, (_, i) => ({ y: Math.floor((first + i) / 12), m: ((first + i) % 12) + 1 }));
  const n = cells.length;
  const pos = (iso: string) => {
    const p = lisbonParts(iso);
    const idx = p.year * 12 + (p.month - 1) - first;
    const dim = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
    return Math.max(0, Math.min(1, (idx + (p.day - 1) / dim) / n));
  };
  const today = pos(TODAY_DATE);
  const labelEvery = n > 20 ? 3 : 2;

  return (
    <div className="min-w-0">
      <div className="relative sm:mt-6">
        <p aria-hidden className="relative mb-1 h-4 sm:hidden">
          <span className="absolute -translate-x-1/2 font-mono text-xs text-fg" style={{ left: `${today * 100}%` }}>
            hoje
          </span>
        </p>
        <ol className="space-y-4">
          {rows.map(({ p, w, settle }) => {
            const a = pos(w.start);
            const b = pos(w.end);
            const c = w.extEnd ? pos(w.extEnd) : b;
            const s = settle ? pos(settle) : undefined;
            const elapsed = Math.max(a, Math.min(b, today));
            const summary = `${p.lot.id}, ${p.producer.nome}: janela de ${fmtDate(w.start)} a ${fmtDate(w.end)}${w.extEnd ? `, estendida até ${fmtDate(w.extEnd)}` : ''}${settle ? `; liquidação prevista a ${fmtDate(settle)}` : ''}.`;
            return (
              <li key={p.id} data-world={p.lot.world} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpen(p)}
                  aria-label={`${summary} Abrir detalhes do lote.`}
                  className="group grid w-full min-w-0 items-center gap-x-4 gap-y-1.5 rounded-sm text-left sm:grid-cols-[11rem_minmax(0,1fr)]"
                >
                  <span className="flex min-w-0 items-baseline gap-2 sm:block">
                    <span className="flex items-center gap-1.5 font-mono text-sm text-fg tnum group-hover:underline">
                      <CommodityGlyph world={p.lot.world} className="size-3.5 text-world-ink" />
                      {p.lot.id}
                    </span>
                    <span className="block truncate text-xs text-muted">{p.producer.nome}</span>
                  </span>
                  <span className="relative block h-9 min-w-0">
                    {/* bandas do ano agrícola do mundo do lote */}
                    <span aria-hidden className="absolute inset-0 flex overflow-hidden rounded-xs border border-border">
                      {cells.map((cell, i) => (
                        <span key={i} className="h-full flex-1 border-r border-[color-mix(in_oklab,var(--border)_55%,transparent)] last:border-r-0" style={{ background: isStrong(p.lot.world, cell.m) ? BG_STRONG : BG_LIGHT }} />
                      ))}
                    </span>
                    {/* janela: parte decorrida cheia, resto a meia tinta; projetada = contorno */}
                    {w.projected ? (
                      <span aria-hidden className="absolute top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-xs border border-world-ink" style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }}>
                        <Hatch id={`pj-${uid}-${p.id}`} />
                      </span>
                    ) : (
                      <>
                        <span aria-hidden className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-xs bg-[color-mix(in_oklab,var(--world-ink)_38%,var(--surface))]" style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }} />
                        <span aria-hidden className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-l-xs bg-world-ink transition-[filter] duration-150 group-hover:brightness-110" style={{ left: `${a * 100}%`, width: `${(elapsed - a) * 100}%` }} />
                      </>
                    )}
                    {w.extEnd && (
                      <span aria-hidden className="absolute top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-r-xs border border-world-ink" style={{ left: `${b * 100}%`, width: `${(c - b) * 100}%` }}>
                        <Hatch id={`ex-${uid}-${p.id}`} />
                      </span>
                    )}
                    {/* hoje (telemóvel: marca por linha; ecrãs largos: linha contínua) */}
                    <span aria-hidden className="absolute -inset-y-1 w-0.5 -translate-x-1/2 bg-fg sm:hidden" style={{ left: `${today * 100}%` }} />
                    {/* liquidação prevista */}
                    {s !== undefined && (
                      <span aria-hidden className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-surface bg-fg" style={{ left: `${s * 100}%` }} />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {/* linha de hoje, sobre todas as linhas */}
        <div aria-hidden className="pointer-events-none absolute inset-y-[-6px] left-[calc(11rem+1rem)] right-0 hidden sm:block">
          <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-fg" style={{ left: `${today * 100}%` }}>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-xs text-fg">hoje</span>
          </div>
        </div>
      </div>
      {/* eixo dos meses */}
      <div aria-hidden className="mt-2 flex sm:ml-[calc(11rem+1rem)]">
        {cells.map((cell, i) => {
          const show = i % labelEvery === 0;
          return (
            <span key={i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap font-mono text-[11px] leading-4 text-muted">
              <span className={cn('block', !show && 'invisible')}>{MONTHS_SHORT[cell.m - 1]}</span>
              {(cell.m === 1 || i === 0) && <span className="block text-fg">{cell.y}</span>}
            </span>
          );
        })}
      </div>
      {/* legenda */}
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" data-world="azeite">
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-2.5 w-5 rounded-xs bg-world-ink" />
          Janela de 18 meses, decorrida
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-2.5 w-5 rounded-xs bg-[color-mix(in_oklab,var(--world-ink)_38%,var(--surface))]" />
          Por decorrer
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block size-2.5 rotate-45 bg-fg" />
          Liquidação prevista
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: BG_STRONG }} />
          Colheita ou engarrafamento
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: BG_LIGHT }} />
          Armazenagem e vendas
        </li>
      </ul>
    </div>
  );
}
