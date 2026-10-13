import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
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

export function TileMap({ map, states, world, selectedId, onSelect, labels = true, className, title }: TileMapProps) {
  const reduce = useReducedMotion();
  const R = map === 'pt' ? 30 : 25;
  const W = Math.sqrt(3) * R;
  const VS = R * 1.5;
  const pad = 6;
  const tint = world ?? (map === 'cafe' ? 'cafe' : 'azeite');

  const geo: Geo[] = useMemo(() => {
    return getRegionsByMap(map).map((region) => {
      const tiles = region.tiles.map((t) => ({ cx: pad + W / 2 + t.col * W + (t.row % 2 === 1 ? W / 2 : 0), cy: pad + R + t.row * VS }));
      const cx = tiles.reduce((s, t) => s + t.cx, 0) / tiles.length;
      const cy = tiles.reduce((s, t) => s + t.cy, 0) / tiles.length;
      return { region, tiles, cx, cy, active: !world || region.worlds.includes(world) };
    });
  }, [map, W, R, VS, world]);

  const maxX = Math.max(...geo.flatMap((g) => g.tiles.map((t) => t.cx))) + W / 2 + pad;
  const maxY = Math.max(...geo.flatMap((g) => g.tiles.map((t) => t.cy))) + R + pad;
  const labelX = maxX + 14;
  const width = map === 'pt' && labels ? labelX + 150 : maxX;
  const height = map === 'cafe' && labels ? maxY + 34 : maxY;

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
    <div className={cn('min-w-0 max-w-full overflow-x-auto', className)} data-world={tint}>
      <svg role="group" aria-label={title ?? (map === 'pt' ? 'Mapa das regiões de origem em Portugal' : 'Mapa das origens de café')} viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block max-w-none">
        <defs>
          <pattern id={`contour-${map}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1" fill="var(--world-ink)" opacity="0.55" />
          </pattern>
        </defs>
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
          const stroke = !g.active ? 'color-mix(in oklab, var(--fg) 10%, var(--surface))' : state === 'unexplored' ? 'var(--border)' : 'var(--world-ink)';
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
              className={cn('outline-none', g.active && onSelect && 'cursor-pointer', g.active && '[&:hover_polygon.tile]:brightness-[0.97]')}
            >
              <title>{name}</title>
              {g.tiles.map((t, i) => (
                <g key={i}>
                  <polygon className="tile" points={hexPoints(t.cx, t.cy, R - 1.5)} fill={fill} stroke={stroke} strokeWidth={1.25} style={{ transition: reduce ? undefined : 'fill 450ms cubic-bezier(0.16,1,0.3,1), stroke 450ms' }} />
                  {g.active && state === 'learned' && <polygon points={hexPoints(t.cx, t.cy, R * 0.62)} fill={`url(#contour-${map})`} stroke="var(--world-ink)" strokeOpacity="0.5" strokeWidth="1" />}
                  {g.active && state === 'participated' && <polygon points={hexPoints(t.cx, t.cy, R * 0.62)} fill="none" stroke="color-mix(in oklab, var(--world) 45%, var(--surface))" strokeWidth="1.25" />}
                </g>
              ))}
              {g.active && producers.length > 0 && (
                <circle cx={g.cx} cy={g.cy} r={4} fill={state === 'participated' ? 'var(--surface)' : 'var(--world-ink)'} stroke={state === 'participated' ? 'var(--world-ink)' : 'none'} strokeWidth="1.5" />
              )}
              {/* seleção e foco */}
              {(selected || focused) &&
                g.tiles.map((t, i) => (
                  <motion.polygon
                    key={`s${i}`}
                    points={hexPoints(t.cx, t.cy, R - 1.5)}
                    fill="none"
                    stroke={selected ? 'var(--fg)' : 'var(--accent)'}
                    strokeWidth={selected ? 2.5 : 2}
                    strokeDasharray={focused && !selected ? '4 3' : undefined}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className={focused && !selected ? 'hidden [g:focus-visible_&]:inline' : undefined}
                  />
                ))}
              {/* rótulo PT à direita com fio */}
              {labels && map === 'pt' && (
                <>
                  <line x1={Math.max(...g.tiles.map((t) => t.cx)) + W / 2 - 2} x2={labelX - 4} y1={g.cy} y2={g.cy} stroke="var(--border)" strokeWidth="1" />
                  <text x={labelX} y={g.cy + 4.5} fontSize="13" fontFamily="var(--font-sans)" fill={g.active ? 'var(--fg)' : 'var(--muted)'} fontWeight={selected ? 600 : 400}>
                    {g.region.nome}
                  </text>
                </>
              )}
            </g>
          );
        })}
        {labels &&
          map === 'cafe' &&
          countries.map((country) => {
            const members = geo.filter((g) => g.region.country === country);
            const cx = members.reduce((s, g) => s + g.cx, 0) / members.length;
            const bottom = Math.max(...members.flatMap((g) => g.tiles.map((t) => t.cy))) + R + 18;
            return (
              <text key={country} x={cx} y={bottom} textAnchor="middle" fontSize="13" fontFamily="var(--font-sans)" fontWeight={600} fill="var(--fg)">
                {country}
              </text>
            );
          })}
      </svg>
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
