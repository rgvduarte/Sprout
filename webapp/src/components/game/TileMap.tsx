import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { getProducersByRegion, getRegionsByMap } from '../../data';
import type { MapId, Region, RegionState, WorldId } from '../../data/types';
import { cn } from '../../lib/cn';

/* =====================================================================
   Mapa de mosaico das origens. Hexágonos desenhados (não é um contorno
   geográfico): Portugal norte→sul para azeite e água; arquipélago de
   origens para o café. Estados: por explorar / aprendido / participado.
   ===================================================================== */

const STATE_LABEL: Record<RegionState, string> = {
  unexplored: 'por explorar',
  learned: 'aprendido',
  participated: 'participado',
};

export interface TileMapProps {
  map: MapId;
  /** estado de cada região (useData().regionStates) */
  states: Record<string, RegionState>;
  /** mundo que tinge o mapa; regiões sem esse mundo ficam inativas */
  world?: WorldId;
  selectedId?: string;
  onSelect?: (regionId: string) => void;
  /** rótulos das regiões ao lado do mapa (PT) ou por país (café) */
  labels?: boolean;
  className?: string;
  /** legenda acessível do mapa */
  title?: string;
}

interface Geo {
  region: Region;
  tiles: { cx: number; cy: number }[];
  cx: number;
  cy: number;
  active: boolean;
}

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

export function TileMap({ map, states, world, selectedId, onSelect, labels: labelsProp = true, className, title }: TileMapProps) {
  const reduce = useReducedMotion();
  // Os rótulos SVG escalam com o viewBox: abaixo de ~80 % do tamanho natural ficam
  // com menos de 11 px. Nesse caso saem do SVG e passam a lista HTML por baixo.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [renderedW, setRenderedW] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || !labelsProp) return;
    setRenderedW(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setRenderedW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [labelsProp]);
  const naturalW = useMemo(() => {
    if (!labelsProp) return 0;
    const R0 = map === 'pt' ? 28 : 22;
    const W0 = Math.sqrt(3) * R0;
    const regions = getRegionsByMap(map);
    const maxCol = Math.max(...regions.flatMap((r) => r.tiles.map((t) => t.col + (t.row % 2 ? 0.5 : 0))));
    const longest = Math.max(...regions.map((r) => r.nome.length));
    return map === 'pt' ? (maxCol + 1) * W0 + longest * 6.9 * 2 + 46 : (maxCol + 1) * W0 + 30;
  }, [map, labelsProp]);
  const labels = labelsProp && (renderedW === null || renderedW >= naturalW * 0.8);
  const htmlLabels = labelsProp && !labels;
  const R = map === 'pt' ? 28 : 22;
  const W = Math.sqrt(3) * R;
  const VS = R * 1.5;
  const tint = world ?? (map === 'cafe' ? 'cafe' : 'azeite');
  const CHAR = 6.9; // largura média de um carácter a 13 px

  const layout = useMemo(() => {
    const regions = getRegionsByMap(map);
    // rótulos do mar (oeste) à esquerda, os restantes à direita
    const westOf = (r: Region) => map === 'pt' && r.tiles.every((t) => t.col === 0);
    const leftW = map === 'pt' && labels ? Math.max(...regions.filter(westOf).map((r) => r.nome.length)) * CHAR + 22 : 6;
    const geo: Geo[] = regions.map((region) => {
      const tiles = region.tiles.map((t) => ({ cx: leftW + W / 2 + t.col * W + (t.row % 2 === 1 ? W / 2 : 0), cy: 6 + R + t.row * VS }));
      const cx = tiles.reduce((s, t) => s + t.cx, 0) / tiles.length;
      const cy = tiles.reduce((s, t) => s + t.cy, 0) / tiles.length;
      return { region, tiles, cx, cy, active: !world || region.worlds.includes(world) };
    });
    const mapRight = Math.max(...geo.flatMap((g) => g.tiles.map((t) => t.cx))) + W / 2;
    const mapLeft = leftW;
    const mapBottom = Math.max(...geo.flatMap((g) => g.tiles.map((t) => t.cy))) + R;

    type Lab = { id: string; side: 'left' | 'right'; ax: number; ay: number; y: number; text: string };
    const labs: Lab[] = [];
    if (map === 'pt' && labels) {
      for (const side of ['left', 'right'] as const) {
        const group = geo
          .filter((g) => (side === 'left') === westOf(g.region))
          .map((g) => {
            // o mosaico mais exterior e mais perto do centro da região ancora o rótulo
            const score = (t: { cx: number; cy: number }) => (side === 'left' ? -t.cx : t.cx) - Math.abs(t.cy - g.cy) * 0.9;
            const edge = g.tiles.reduce((a, b) => (score(b) > score(a) ? b : a));
            return { id: g.region.id, side, ax: edge.cx + (side === 'left' ? -W / 2 + 3 : W / 2 - 3), ay: edge.cy, y: edge.cy, text: g.region.nome };
          })
          .sort((a, b) => a.ay - b.ay);
        let prev = -Infinity;
        for (const l of group) {
          l.y = Math.max(l.ay, prev + 19);
          prev = l.y;
          labs.push(l);
        }
      }
    }
    const rightW = map === 'pt' && labels ? Math.max(...labs.filter((l) => l.side === 'right').map((l) => l.text.length)) * CHAR + 24 : 6;
    const width = Math.ceil(mapRight + rightW + (map === 'cafe' && labels ? 24 : 0));
    const height = Math.ceil(Math.max(mapBottom + 6, ...labs.map((l) => l.y + 10)) + (map === 'cafe' && labels ? 28 : 0));
    return { geo, labs, mapLeft, mapRight, mapBottom, width, height };
  }, [map, W, R, VS, world, labels]);

  const { geo, labs, mapLeft, mapRight, mapBottom, width, height } = layout;
  const focusables = geo.filter((g) => g.active);
  const [focusId, setFocusId] = useState<string | undefined>(selectedId ?? focusables[0]?.region.id);
  const refs = useRef<Record<string, SVGGElement | null>>({});

  const move = (from: Geo, dx: number, dy: number) => {
    let best: Geo | undefined;
    let bestScore = Infinity;
    for (const g of focusables) {
      if (g === from) continue;
      const vx = g.cx - from.cx;
      const vy = g.cy - from.cy;
      const dist = Math.hypot(vx, vy);
      const dot = (vx * dx + vy * dy) / (dist || 1);
      if (dot < 0.35) continue;
      const score = dist * (2 - dot);
      if (score < bestScore) {
        bestScore = score;
        best = g;
      }
    }
    if (best) {
      setFocusId(best.region.id);
      refs.current[best.region.id]?.focus();
    }
  };

  const onKey = (e: KeyboardEvent, g: Geo) => {
    const dirs: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    if (dirs[e.key]) {
      e.preventDefault();
      move(g, ...dirs[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(g.region.id);
    }
  };

  const countries = map === 'cafe' ? Array.from(new Set(geo.map((g) => g.region.country!))) : [];

  return (
    <div ref={wrapRef} className={cn('min-w-0', className)} data-world={tint}>
      <svg
        role="group"
        aria-label={title ?? (map === 'pt' ? 'Mapa das regiões de origem em Portugal' : 'Mapa das origens de café')}
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full"
        style={{ maxWidth: width }}
      >
        <defs>
          <pattern id={`contour-${map}`} width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="1" fill="var(--world-ink)" opacity="0.55" />
          </pattern>
        </defs>
        {/* fios dos rótulos (por baixo dos mosaicos) */}
        {labs.map((l) => {
          const edgeX = l.side === 'left' ? mapLeft - 4 : mapRight + 4;
          const textX = l.side === 'left' ? mapLeft - 12 : mapRight + 12;
          return <polyline key={`w-${l.id}`} points={`${l.ax},${l.ay} ${edgeX},${l.ay} ${textX - (l.side === 'left' ? -2 : 2)},${l.y}`} fill="none" stroke="var(--border)" strokeWidth="1" />;
        })}
        {geo.map((g) => {
          const state = states[g.region.id] ?? 'unexplored';
          const selected = g.region.id === selectedId;
          const focused = g.region.id === focusId;
          const producers = getProducersByRegion(g.region.id).filter((p) => !world || p.world === world);
          const name = `${g.region.nome}${g.region.country ? `, ${g.region.country}` : ''} · ${STATE_LABEL[state]}${producers.length ? ` · ${producers.length} ${producers.length === 1 ? 'produtor' : 'produtores'}` : ''}`;
          const fill = !g.active
            ? 'color-mix(in oklab, var(--fg) 4%, var(--surface))'
            : state === 'participated'
              ? 'var(--world)'
              : state === 'learned'
                ? 'color-mix(in oklab, var(--world) 22%, var(--surface))'
                : 'var(--surface)';
          const stroke = !g.active ? 'color-mix(in oklab, var(--fg) 12%, var(--surface))' : state === 'unexplored' ? 'color-mix(in oklab, var(--fg) 26%, var(--surface))' : 'var(--world-ink)';
          const dotTile = g.tiles.reduce((a, b) => (Math.hypot(b.cx - g.cx, b.cy - g.cy) < Math.hypot(a.cx - g.cx, a.cy - g.cy) ? b : a));
          return (
            <g
              key={g.region.id}
              ref={(el) => {
                refs.current[g.region.id] = el;
              }}
              role={g.active ? 'button' : undefined}
              aria-label={g.active ? name : undefined}
              aria-pressed={g.active && onSelect ? selected : undefined}
              aria-hidden={g.active ? undefined : true}
              tabIndex={g.active ? (focused ? 0 : -1) : undefined}
              onFocus={() => setFocusId(g.region.id)}
              onKeyDown={g.active ? (e) => onKey(e, g) : undefined}
              onClick={g.active ? () => onSelect?.(g.region.id) : undefined}
              className={cn('group/tile outline-none', g.active && onSelect && 'cursor-pointer')}
            >
              <title>{name}</title>
              {g.tiles.map((t, i) => (
                <g key={i}>
                  <polygon
                    points={hexPoints(t.cx, t.cy, R - 1.5)}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={1.25}
                    className={g.active && onSelect ? 'group-hover/tile:[stroke-width:2.25]' : undefined}
                    style={{ transition: reduce ? undefined : 'fill 450ms cubic-bezier(0.16,1,0.3,1), stroke 450ms' }}
                  />
                  {g.active && state === 'learned' && <polygon points={hexPoints(t.cx, t.cy, R * 0.6)} fill={`url(#contour-${map})`} stroke="var(--world-ink)" strokeOpacity="0.45" strokeWidth="1" />}
                  {g.active && state === 'participated' && <polygon points={hexPoints(t.cx, t.cy, R * 0.6)} fill="none" stroke="color-mix(in oklab, var(--world) 40%, var(--surface))" strokeWidth="1.25" />}
                </g>
              ))}
              {g.active && producers.length > 0 && (
                <circle cx={dotTile.cx} cy={dotTile.cy} r={4} fill={state === 'participated' ? 'var(--surface)' : 'var(--world-ink)'} stroke={state === 'participated' ? 'var(--world-ink)' : 'none'} strokeWidth="1.5" />
              )}
              {(selected || focused) &&
                g.tiles.map((t, i) => (
                  <motion.polygon
                    key={`s${i}`}
                    points={hexPoints(t.cx, t.cy, R - 1.5)}
                    fill="none"
                    stroke={selected ? 'var(--fg)' : 'var(--accent)'}
                    strokeWidth={selected ? 2.5 : 2}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className={!selected ? 'hidden group-focus-visible/tile:inline' : undefined}
                  />
                ))}
            </g>
          );
        })}
        {labs.map((l) => {
          const g = geo.find((x) => x.region.id === l.id)!;
          const selected = l.id === selectedId;
          return (
            <text
              key={`t-${l.id}`}
              x={l.side === 'left' ? mapLeft - 12 : mapRight + 12}
              y={l.y + 4.5}
              textAnchor={l.side === 'left' ? 'end' : 'start'}
              fontSize="13"
              fontFamily="var(--font-sans)"
              fill={g.active ? 'var(--fg)' : 'var(--muted)'}
              fontWeight={selected ? 650 : 400}
              aria-hidden
            >
              {l.text}
            </text>
          );
        })}
        {labels &&
          map === 'cafe' &&
          countries.map((country) => {
            const members = geo.filter((g) => g.region.country === country);
            const xs = members.flatMap((g) => g.tiles.map((t) => t.cx));
            const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
            return (
              <text key={country} x={cx} y={mapBottom + 22} textAnchor="middle" fontSize="13" fontFamily="var(--font-sans)" fontWeight={600} fill="var(--fg)" aria-hidden>
                {country}
              </text>
            );
          })}
      </svg>
      {htmlLabels && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Regiões do mapa">
          {geo
            .filter((g) => g.active)
            .map((g) => {
              const state = states[g.region.id] ?? 'unexplored';
              const selected = g.region.id === selectedId;
              const dot = (
                <span
                  aria-hidden
                  className="inline-block size-2.5 shrink-0 rounded-full border border-world-ink"
                  style={{ background: state === 'participated' ? 'var(--world)' : state === 'learned' ? 'color-mix(in oklab, var(--world) 30%, var(--surface))' : 'var(--surface)' }}
                />
              );
              const label = (
                <>
                  {dot}
                  {g.region.nome}
                  <span className="sr-only"> · {STATE_LABEL[state]}</span>
                </>
              );
              return (
                <li key={g.region.id}>
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => onSelect(g.region.id)}
                      aria-pressed={selected}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-1.5 rounded-sm border px-2.5 text-sm transition-colors duration-150',
                        selected ? 'border-fg bg-surface-2 font-medium text-fg' : 'border-border bg-surface text-fg hover:bg-surface-2',
                      )}
                    >
                      {label}
                    </button>
                  ) : (
                    <span className="inline-flex min-h-8 items-center gap-1.5 px-1 text-sm text-fg">{label}</span>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

/** Legenda dos estados do mapa. */
export function TileMapLegend({ world = 'azeite', className }: { world?: WorldId; className?: string }) {
  const items: { state: RegionState; label: string; desc: string }[] = [
    { state: 'unexplored', label: 'Por explorar', desc: 'Ainda não estudaste esta origem.' },
    { state: 'learned', label: 'Aprendido', desc: 'Leste análises, riscos ou fizeste missões desta origem.' },
    { state: 'participated', label: 'Participado', desc: 'Financias um lote desta origem.' },
  ];
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted', className)} data-world={world}>
      {items.map((it) => (
        <li key={it.state} className="inline-flex items-center gap-2" title={it.desc}>
          <svg aria-hidden width="18" height="20" viewBox="0 0 18 20">
            <polygon
              points={hexPoints(9, 10, 8.5)}
              fill={it.state === 'participated' ? 'var(--world)' : it.state === 'learned' ? 'color-mix(in oklab, var(--world) 22%, var(--surface))' : 'var(--surface)'}
              stroke={it.state === 'unexplored' ? 'var(--border)' : 'var(--world-ink)'}
              strokeWidth="1.25"
            />
          </svg>
          {it.label}
        </li>
      ))}
    </ul>
  );
}
