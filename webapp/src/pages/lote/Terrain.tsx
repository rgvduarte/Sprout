import type { ReactNode } from 'react';
import type { TelemetryUnit, WorldId } from '../../data/types';
import { ParallaxLayer } from '../../components/game';
import { createRng } from '../../lib/prng';
import { cn } from '../../lib/cn';

/* =====================================================================
   Paisagens da origem, desenhadas em SVG geométrico nas tintas do mundo:
   curvas de nível, socalcos com olival em grelha de pontos e o lagar
   (azeite); serra, estratos do aquífero e captação (água); plantação em
   socalcos e terreiro (café). Camadas de fundo com parallax decorativo.
   ===================================================================== */

const W = 520;
const H = 300;
const GROUND = 262;

const FAINT = 'color-mix(in oklab, var(--world-ink) 22%, transparent)';
const LINE = 'color-mix(in oklab, var(--world-ink) 48%, transparent)';
const INK = 'color-mix(in oklab, var(--world-ink) 80%, transparent)';
const SOFT = 'color-mix(in oklab, var(--world) 20%, transparent)';
const BODY = 'var(--world)';
const PAPER = 'var(--surface)';

/** Curva fechada suave (Catmull-Rom) a partir de pontos. */
function smoothClosed(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

/** Curva aberta suave por pontos. */
function smoothOpen(pts: [number, number][]): string {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Curvas de nível de uma colina: anéis concêntricos com ondulação determinística. */
function contours(seed: string, cx: number, cy: number, rings: number, rx0: number, ry0: number, step: [number, number]): string[] {
  const rng = createRng(seed);
  const phase = rng.range(0, Math.PI * 2);
  return Array.from({ length: rings }, (_, k) => {
    const n = 14;
    const pts: [number, number][] = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const wob = 1 + 0.08 * Math.sin(a * 3 + phase + k * 0.4) + 0.05 * Math.sin(a * 5 - phase) + rng.range(-0.02, 0.02);
      return [cx + (rx0 + k * step[0]) * wob * Math.cos(a), cy + (ry0 + k * step[1]) * wob * Math.sin(a)];
    });
    return smoothClosed(pts);
  });
}

function Layer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={cn('absolute inset-0 h-full w-full overflow-visible', className)} aria-hidden>
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------ azeite */

function OliveBack({ seed }: { seed: string }) {
  const rings = contours(`${seed}-colina`, 380, 150, 8, 40, 18, [30, 14]);
  const rings2 = contours(`${seed}-colina-2`, 90, 120, 5, 30, 14, [26, 11]);
  return (
    <Layer>
      {rings.map((d, i) => (
        <path key={`a${i}`} d={d} fill="none" stroke={i % 4 === 0 ? LINE : FAINT} strokeWidth={1} />
      ))}
      {rings2.map((d, i) => (
        <path key={`b${i}`} d={d} fill="none" stroke={FAINT} strokeWidth={1} />
      ))}
    </Layer>
  );
}

function OliveTerraces({ seed }: { seed: string }) {
  const rng = createRng(`${seed}-socalcos`);
  const rows = 5;
  return (
    <Layer>
      {Array.from({ length: rows }, (_, i) => {
        const y = 120 + i * 27;
        const amp = 10 - i * 1.4;
        const wall: [number, number][] = Array.from({ length: 9 }, (_, k) => [-10 + k * 67, y + amp * Math.sin(k * 0.8 + i * 0.9)]);
        const d = smoothOpen(wall);
        const trees: ReactNode[] = [];
        for (let x = 6 + (i % 2) * 9; x < W; x += 19) {
          const t = x / 67 + 10 / 67;
          const yy = y + amp * Math.sin(t * 0.8 + i * 0.9) - 7 + rng.range(-1, 1);
          const r = 3.4 + rng.range(-0.5, 0.6) - i * 0.12;
          trees.push(<circle key={x} cx={x} cy={yy} r={Math.max(2.4, r)} fill={BODY} opacity={0.55 + i * 0.09} />);
        }
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={LINE} strokeWidth={1.25} />
            {trees}
          </g>
        );
      })}
    </Layer>
  );
}

function Lagar({ tanks }: { tanks?: TelemetryUnit[] }) {
  const units = (tanks?.length ? tanks : [{ id: 'D1', label: 'Depósito 1', capacity: 1, level: 0.6 }]).slice(0, 4);
  return (
    <Layer>
      {/* chão */}
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth={1.25} />
      {/* lagar */}
      <g transform={`translate(30 ${GROUND - 78})`}>
        <path d="M0 30 L60 0 L120 30 Z" fill={PAPER} stroke={INK} strokeWidth={1.25} strokeLinejoin="round" />
        <rect x="6" y="30" width="108" height="48" fill={PAPER} stroke={INK} strokeWidth={1.25} />
        <rect x="48" y="48" width="24" height="30" fill={SOFT} stroke={INK} strokeWidth={1.1} />
        {[16, 86].map((x) => (
          <rect key={x} x={x} y="42" width="18" height="12" fill="none" stroke={LINE} strokeWidth={1.1} />
        ))}
        <rect x="90" y="4" width="10" height="20" fill={PAPER} stroke={INK} strokeWidth={1.1} />
      </g>
      {/* depósitos de inox com o nível real da telemetria */}
      {units.map((u, i) => {
        const x = 168 + i * 30;
        const h = 58;
        const top = GROUND - h;
        const lvl = u.capacity > 0 ? Math.max(0, Math.min(1, u.level / u.capacity)) : 0;
        return (
          <g key={u.id}>
            <rect x={x} y={top} width={22} height={h} rx={3} fill={PAPER} stroke={INK} strokeWidth={1.1} />
            <rect x={x + 2} y={top + 2 + (h - 4) * (1 - lvl)} width={18} height={(h - 4) * lvl} rx={2} fill={BODY} opacity={0.85} style={{ transition: 'y 600ms cubic-bezier(0.16,1,0.3,1), height 600ms cubic-bezier(0.16,1,0.3,1)' }} />
            <ellipse cx={x + 11} cy={top} rx={11} ry={3} fill={PAPER} stroke={INK} strokeWidth={1.1} />
          </g>
        );
      })}
    </Layer>
  );
}

/* ------------------------------------------------------------ água */

function WaterBack({ seed }: { seed: string }) {
  const rng = createRng(`${seed}-serra`);
  const ridges = Array.from({ length: 6 }, (_, k) => {
    const pts: [number, number][] = [];
    for (let x = -20; x <= W + 20; x += 40) {
      const peak = Math.exp(-((x - 300) ** 2) / (2 * 120 ** 2)) * (110 - k * 14) + Math.exp(-((x - 80) ** 2) / (2 * 70 ** 2)) * (50 - k * 6);
      pts.push([x, 150 - Math.max(0, peak) + k * 4 + rng.range(-2, 2)]);
    }
    return smoothOpen(pts);
  });
  return (
    <Layer>
      {ridges.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={i === 0 ? LINE : FAINT} strokeWidth={1} />
      ))}
    </Layer>
  );
}

function Strata({ seed }: { seed: string }) {
  const rng = createRng(`${seed}-estratos`);
  const band = (y: number, amp: number) => {
    const pts: [number, number][] = [];
    for (let x = -20; x <= W + 20; x += 52) pts.push([x, y + amp * Math.sin(x / 70 + rng.range(-0.2, 0.2))]);
    return smoothOpen(pts);
  };
  const b1 = band(176, 3);
  const b2 = band(206, 5);
  const b3 = band(236, 4);
  const dots: ReactNode[] = [];
  for (let x = 8; x < W; x += 14) {
    for (let y = 182; y < 202; y += 9) dots.push(<circle key={`${x}-${y}`} cx={x + ((y / 9) % 2) * 7} cy={y + rng.range(-1, 1)} r={1.2} fill={LINE} />);
  }
  return (
    <Layer>
      <defs>
        <clipPath id={`aquifero-${seed}`}>
          <path d={`${b2} L${W + 20} ${H} L-20 ${H} Z`} />
        </clipPath>
        <pattern id={`xisto-${seed}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={FAINT} strokeWidth="1.2" />
        </pattern>
      </defs>
      {dots}
      {/* aquífero: água a correr entre camadas */}
      <g clipPath={`url(#aquifero-${seed})`}>
        <rect x="0" y="196" width={W} height="44" fill={SOFT} />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${20 + i * 58} ${220 + (i % 2) * 6} h22`} stroke={BODY} strokeWidth={1.6} strokeLinecap="round" />
        ))}
        <rect x="0" y="238" width={W} height={H - 238} fill={`url(#xisto-${seed})`} />
      </g>
      <path d={b1} fill="none" stroke={LINE} strokeWidth={1.1} />
      <path d={b2} fill="none" stroke={INK} strokeWidth={1.1} />
      <path d={b3} fill="none" stroke={LINE} strokeWidth={1.1} />
    </Layer>
  );
}

function Engarrafamento() {
  const groundY = 160;
  return (
    <Layer>
      <path d={`M0 ${groundY} H${W}`} stroke={INK} strokeWidth={1.25} />
      {/* captação: furo do aquífero à linha */}
      <path d={`M372 222 V${groundY}`} stroke={INK} strokeWidth={2.4} />
      <circle cx="372" cy="222" r="4" fill={BODY} />
      {/* nave de engarrafamento com cobertura em dente de serra */}
      <g transform={`translate(300 ${groundY - 56})`}>
        <path d="M0 18 L18 0 L18 18 L36 0 L36 18 L54 0 L54 18 L72 0 L72 18 L90 0 L90 18 L108 0 L108 18" fill="none" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
        <rect x="0" y="18" width="128" height="38" fill={PAPER} stroke={INK} strokeWidth={1.25} />
        <rect x="10" y="40" width="30" height="16" fill={SOFT} stroke={LINE} strokeWidth={1} />
        {/* garrafas na linha */}
        {Array.from({ length: 6 }, (_, i) => (
          <g key={i} transform={`translate(${50 + i * 11} 30)`}>
            <rect x="0" y="4" width="7" height="16" rx="2.5" fill={BODY} opacity={0.75} />
            <rect x="2" y="0" width="3" height="4" fill={INK} />
          </g>
        ))}
      </g>
      {/* paletes prontas */}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${444 + i * 34} ${groundY - 26})`}>
          <rect x="0" y="0" width="28" height="20" rx="2" fill={BODY} opacity={0.8} />
          <path d="M3 6 H25 M3 13 H25" stroke={PAPER} strokeWidth={1} opacity={0.6} />
          <rect x="-1" y="20" width="30" height="5" fill={PAPER} stroke={INK} strokeWidth={1} />
        </g>
      ))}
      {/* nascente à saída da serra */}
      <path d="M120 156 q10 -16 22 -2 q8 10 18 0" fill="none" stroke={BODY} strokeWidth={1.8} strokeLinecap="round" />
    </Layer>
  );
}

/* ------------------------------------------------------------ café */

function CoffeeTerraces({ seed }: { seed: string }) {
  const rng = createRng(`${seed}-cafezal`);
  return (
    <Layer>
      {Array.from({ length: 5 }, (_, i) => {
        const y = 112 + i * 28;
        const pts: [number, number][] = Array.from({ length: 9 }, (_, k) => [-10 + k * 67, y + (12 - i * 2) * Math.sin(k * 0.7 + i)]);
        const shrubs: ReactNode[] = [];
        for (let x = 8 + (i % 2) * 8; x < W; x += 17) {
          const yy = y + (12 - i * 2) * Math.sin(((x + 10) / 67) * 0.7 + i) - 7;
          shrubs.push(
            <g key={x}>
              <circle cx={x} cy={yy} r={4} fill="color-mix(in oklab, var(--ok) 45%, transparent)" />
              {rng.chance(0.55) && <circle cx={x + 2} cy={yy + 1.5} r={1.4} fill={BODY} />}
            </g>,
          );
        }
        return (
          <g key={i}>
            <path d={smoothOpen(pts)} fill="none" stroke={LINE} strokeWidth={1.2} />
            {shrubs}
          </g>
        );
      })}
    </Layer>
  );
}

function Terreiro() {
  return (
    <Layer>
      <path d={`M0 ${GROUND} H${W}`} stroke={INK} strokeWidth={1.25} />
      <g transform={`translate(40 ${GROUND - 20})`}>
        {Array.from({ length: 6 }, (_, c) =>
          Array.from({ length: 2 }, (_, r) => <rect key={`${c}-${r}`} x={c * 30} y={r * 9} width={28} height={8} fill={SOFT} stroke={LINE} strokeWidth={0.9} />),
        )}
      </g>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${300 + i * 30} ${GROUND} q-2 -22 4 -26 h18 q6 4 4 26 z`} fill={BODY} opacity={0.8} stroke={INK} strokeWidth={1} />
      ))}
    </Layer>
  );
}

/* ------------------------------------------------------------ cena */

export function Terrain({ world, seed, tanks, className, label, crop }: { world: WorldId; seed: string; tanks?: TelemetryUnit[]; className?: string; label: string; crop?: boolean }) {
  return (
    <div className={cn('relative w-full overflow-hidden', crop ? 'aspect-[520/190] sm:aspect-[520/300]' : 'aspect-[520/300]', className)} role="img" aria-label={label} data-world={world}>
      {world === 'azeite' && (
        <>
          <ParallaxLayer distance={26} className="absolute inset-0">
            <OliveBack seed={seed} />
          </ParallaxLayer>
          <ParallaxLayer distance={12} className="absolute inset-0">
            <OliveTerraces seed={seed} />
          </ParallaxLayer>
          <Lagar tanks={tanks} />
        </>
      )}
      {world === 'agua' && (
        <>
          <ParallaxLayer distance={24} className="absolute inset-0">
            <WaterBack seed={seed} />
          </ParallaxLayer>
          <Strata seed={seed} />
          <Engarrafamento />
        </>
      )}
      {world === 'cafe' && (
        <>
          <ParallaxLayer distance={24} className="absolute inset-0">
            <OliveBack seed={`${seed}-cafe`} />
          </ParallaxLayer>
          <ParallaxLayer distance={10} className="absolute inset-0">
            <CoffeeTerraces seed={seed} />
          </ParallaxLayer>
          <Terreiro />
        </>
      )}
    </div>
  );
}
