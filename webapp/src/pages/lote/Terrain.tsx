import { useId, type ReactNode } from 'react';
import type { TelemetryUnit, WorldId } from '../../data/types';
import { ParallaxLayer } from '../../components/game';
import { createRng } from '../../lib/prng';
import { cn } from '../../lib/cn';

/* =====================================================================
   Paisagens da origem como blocos-diagrama axonométricos, desenhados nas
   tintas do mundo: o corte do terreno mostra as camadas (xisto, granito,
   aquífero), a face de cima mostra o que lá se faz (olival em socalcos e
   lagar com os depósitos ao nível da telemetria; captação e nave de
   engarrafamento; cafezal e terreiro). Ao fundo, curvas de nível com
   parallax decorativo.
   ===================================================================== */

const W = 520;
const H = 300;
const L = 240;
const D = 150;
const T = 48;
const C30 = 0.866;

const FAINT = 'color-mix(in oklab, var(--world-ink) 20%, transparent)';
const LINE = 'color-mix(in oklab, var(--world-ink) 45%, transparent)';
const INK = 'color-mix(in oklab, var(--world-ink) 78%, transparent)';
const PAPER = 'var(--surface)';
const BODY = 'var(--world)';
const tint = (pct: number, base = 'var(--world)') => `color-mix(in oklab, ${base} ${pct}%, var(--surface))`;

type P3 = [number, number, number];
type Iso = (x: number, y: number, z: number) => [number, number];

const makeIso = (ox: number, oy: number): Iso => (x, y, z) => [ox + (x - y) * C30, oy + (x + y) * 0.5 - z];
const fx = (n: number) => n.toFixed(1);

function poly(iso: Iso, pts: P3[]): string {
  return `M${pts.map((p) => iso(...p).map(fx).join(',')).join(' L')} Z`;
}

/** Elipse (círculo no chão em axonometria) como sub-caminho, para juntar muitas num só <path>. */
function isoDot(iso: Iso, x: number, y: number, z: number, r: number): string {
  const [cx, cy] = iso(x, y, z);
  const rx = r * 1.22;
  const ry = r * 0.7;
  return `M${fx(cx - rx)},${fx(cy)} a${fx(rx)},${fx(ry)} 0 1,0 ${fx(2 * rx)},0 a${fx(rx)},${fx(ry)} 0 1,0 ${fx(-2 * rx)},0`;
}

/** Curva fechada suave (Catmull-Rom). */
function smoothClosed(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${fx(pts[0][0])},${fx(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${fx(p1[0] + (p2[0] - p0[0]) / 6)},${fx(p1[1] + (p2[1] - p0[1]) / 6)} ${fx(p2[0] - (p3[0] - p1[0]) / 6)},${fx(p2[1] - (p3[1] - p1[1]) / 6)} ${fx(p2[0])},${fx(p2[1])}`;
  }
  return `${d} Z`;
}

function smoothOpen(pts: [number, number][]): string {
  let d = `M${fx(pts[0][0])},${fx(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${fx(p1[0] + (p2[0] - p0[0]) / 6)},${fx(p1[1] + (p2[1] - p0[1]) / 6)} ${fx(p2[0] - (p3[0] - p1[0]) / 6)},${fx(p2[1] - (p3[1] - p1[1]) / 6)} ${fx(p2[0])},${fx(p2[1])}`;
  }
  return d;
}

function Layer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={cn('absolute inset-0 h-full w-full overflow-visible', className)} aria-hidden>
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------ fundo */

function Contours({ seed }: { seed: string }) {
  const rng = createRng(`${seed}-colina`);
  const phase = rng.range(0, Math.PI * 2);
  const ring = (cx: number, cy: number, k: number, rx0: number, ry0: number, sx: number, sy: number) =>
    smoothClosed(
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const wob = 1 + 0.08 * Math.sin(a * 3 + phase + k * 0.4) + 0.05 * Math.sin(a * 5 - phase);
        return [cx + (rx0 + k * sx) * wob * Math.cos(a), cy + (ry0 + k * sy) * wob * Math.sin(a)] as [number, number];
      }),
    );
  return (
    <Layer>
      {Array.from({ length: 8 }, (_, k) => (
        <path key={`a${k}`} d={ring(410, 70, k, 34, 14, 26, 11)} fill="none" stroke={k % 4 === 0 ? LINE : FAINT} strokeWidth={1} />
      ))}
      {Array.from({ length: 5 }, (_, k) => (
        <path key={`b${k}`} d={ring(120, 40, k, 30, 12, 24, 9)} fill="none" stroke={FAINT} strokeWidth={1} />
      ))}
    </Layer>
  );
}

function Ridges({ seed }: { seed: string }) {
  const rng = createRng(`${seed}-serra`);
  return (
    <Layer>
      {Array.from({ length: 6 }, (_, k) => {
        const pts: [number, number][] = [];
        for (let x = -20; x <= W + 20; x += 40) {
          const peak = Math.exp(-((x - 380) ** 2) / (2 * 110 ** 2)) * (86 - k * 12) + Math.exp(-((x - 120) ** 2) / (2 * 70 ** 2)) * (40 - k * 5);
          pts.push([x, 110 - Math.max(0, peak) + k * 5 + rng.range(-2, 2)]);
        }
        return <path key={k} d={smoothOpen(pts)} fill="none" stroke={k === 0 ? LINE : FAINT} strokeWidth={1} />;
      })}
    </Layer>
  );
}

/* ------------------------------------------------------------ bloco de terreno */

interface Stratum {
  /** cota do topo da camada (≤ 0) */
  z: number;
  amp: number;
  fill: string;
  pattern?: 'xisto' | 'granito' | 'rocha' | 'agua';
}

const STRATA: Record<WorldId, Stratum[]> = {
  azeite: [
    { z: 0, amp: 0, fill: tint(34) },
    { z: -8, amp: 2, fill: tint(16), pattern: 'xisto' },
    { z: -31, amp: 2.5, fill: tint(9, 'var(--fg)'), pattern: 'rocha' },
  ],
  agua: [
    { z: 0, amp: 0, fill: tint(20, 'var(--ok)') },
    { z: -7, amp: 1.5, fill: tint(8, 'var(--fg)'), pattern: 'granito' },
    { z: -20, amp: 2.5, fill: tint(30), pattern: 'agua' },
    { z: -34, amp: 2, fill: tint(12, 'var(--fg)'), pattern: 'rocha' },
  ],
  cafe: [
    { z: 0, amp: 0, fill: tint(42) },
    { z: -10, amp: 2.5, fill: tint(22), pattern: 'granito' },
    { z: -32, amp: 2, fill: tint(10, 'var(--fg)'), pattern: 'rocha' },
  ],
};

/** ponto na face da frente (s ≤ L) ou da direita (s > L) do bloco */
const facePoint = (s: number, z: number): P3 => (s <= L ? [s, D, z] : [L, D - (s - L), z]);

function Block({ iso, world, uid, children }: { iso: Iso; world: WorldId; uid: string; children?: ReactNode }) {
  const layers = STRATA[world];
  const boundary = (i: number, s: number) => {
    if (i >= layers.length) return -T;
    const l = layers[i];
    return l.z + (l.z === 0 ? 0 : l.amp * Math.sin(s / 38 + i * 1.7));
  };
  const steps = Array.from({ length: Math.ceil((L + D) / 10) + 1 }, (_, k) => Math.min(L + D, k * 10));
  const layerPath = (i: number) => {
    const top = steps.map((s) => iso(...facePoint(s, boundary(i, s))));
    const bottom = [...steps].reverse().map((s) => iso(...facePoint(s, boundary(i + 1, s))));
    return `M${[...top, ...bottom].map((p) => p.map(fx).join(',')).join(' L')} Z`;
  };
  const aquifer = layers.findIndex((l) => l.pattern === 'agua');
  return (
    <g>
      <defs>
        <pattern id={`xisto-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
          <line x1="0" y1="0" x2="7" y2="0" stroke={LINE} strokeWidth="1" />
        </pattern>
        <pattern id={`rocha-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={FAINT} strokeWidth="1.2" />
        </pattern>
        <pattern id={`granito-${uid}`} width="9" height="7" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill={LINE} />
          <circle cx="6.5" cy="5.5" r="0.9" fill={LINE} />
        </pattern>
      </defs>
      {/* camadas no corte (frente e direita) */}
      {layers.map((l, i) => (
        <g key={i}>
          <path d={layerPath(i)} fill={l.fill} />
          {l.pattern && l.pattern !== 'agua' && <path d={layerPath(i)} fill={`url(#${l.pattern}-${uid})`} />}
        </g>
      ))}
      {/* água a correr no aquífero */}
      {aquifer >= 0 && (
        <path
          d={Array.from({ length: 11 }, (_, k) => {
            const s = 14 + k * 38;
            const z = (boundary(aquifer, s) + boundary(aquifer + 1, s)) / 2;
            const a = iso(...facePoint(s, z));
            const b = iso(...facePoint(Math.min(L + D, s + 16), z));
            return `M${a.map(fx).join(',')} L${b.map(fx).join(',')}`;
          }).join(' ')}
          stroke={BODY}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      )}
      {/* sombra da face direita */}
      <path d={poly(iso, [[L, 0, 0], [L, D, 0], [L, D, -T], [L, 0, -T]])} fill="color-mix(in oklab, var(--fg) 9%, transparent)" />
      {/* face de cima */}
      <path d={poly(iso, [[0, 0, 0], [L, 0, 0], [L, D, 0], [0, D, 0]])} fill={STRATA[world][0].fill} />
      {children}
      {/* arestas */}
      <path
        d={`${poly(iso, [[0, 0, 0], [L, 0, 0], [L, D, 0], [0, D, 0]])} M${iso(0, D, 0).map(fx).join(',')} L${iso(0, D, -T).map(fx).join(',')} L${iso(L, D, -T).map(fx).join(',')} L${iso(L, 0, -T).map(fx).join(',')} L${iso(L, 0, 0).map(fx).join(',')} M${iso(L, D, 0).map(fx).join(',')} L${iso(L, D, -T).map(fx).join(',')}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </g>
  );
}

/* ------------------------------------------------------------ peças */

/** Casa de duas águas com cumeeira ao longo de x. */
function Gabled({ iso, x0, y0, w, d, h, r, door = true }: { iso: Iso; x0: number; y0: number; w: number; d: number; h: number; r: number; door?: boolean }) {
  const x1 = x0 + w;
  const y1 = y0 + d;
  const ym = y0 + d / 2;
  return (
    <g strokeLinejoin="round">
      <path d={poly(iso, [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]])} fill={PAPER} stroke={INK} strokeWidth={1} />
      <path d={poly(iso, [[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, ym, h + r], [x1, y0, h]])} fill={tint(7, 'var(--fg)')} stroke={INK} strokeWidth={1} />
      <path d={poly(iso, [[x0, y0, h], [x1, y0, h], [x1, ym, h + r], [x0, ym, h + r]])} fill={tint(40)} stroke={INK} strokeWidth={1} />
      <path d={poly(iso, [[x0, y1, h], [x1, y1, h], [x1, ym, h + r], [x0, ym, h + r]])} fill={tint(58)} stroke={INK} strokeWidth={1} />
      {door && <path d={poly(iso, [[x0 + w * 0.42, y1, 0], [x0 + w * 0.58, y1, 0], [x0 + w * 0.58, y1, h * 0.62], [x0 + w * 0.42, y1, h * 0.62]])} fill={tint(30)} stroke={INK} strokeWidth={0.9} />}
      <path
        d={[0.12, 0.72].map((t) => poly(iso, [[x0 + w * t, y1, h * 0.42], [x0 + w * (t + 0.14), y1, h * 0.42], [x0 + w * (t + 0.14), y1, h * 0.72], [x0 + w * t, y1, h * 0.72]])).join(' ')}
        fill="none"
        stroke={LINE}
        strokeWidth={0.9}
      />
    </g>
  );
}

/** Depósito de inox (cilindro) com visor de nível ao valor da telemetria. */
function Tank({ iso, x, y, r, h, level }: { iso: Iso; x: number; y: number; r: number; h: number; level: number }) {
  const [bx, by] = iso(x, y, 0);
  const ty = by - h;
  const rx = r * 1.22;
  const ry = r * 0.7;
  const lv = Math.max(0, Math.min(1, level));
  const gx = bx + rx * 0.15;
  return (
    <g>
      <path d={`M${fx(bx - rx)},${fx(ty)} L${fx(bx - rx)},${fx(by)} A${fx(rx)},${fx(ry)} 0 0,0 ${fx(bx + rx)},${fx(by)} L${fx(bx + rx)},${fx(ty)} Z`} fill={PAPER} stroke={INK} strokeWidth={1} />
      <path d={`M${fx(bx - rx)},${fx(ty)} a${fx(rx)},${fx(ry)} 0 1,0 ${fx(2 * rx)},0 a${fx(rx)},${fx(ry)} 0 1,0 ${fx(-2 * rx)},0`} fill={tint(6, 'var(--fg)')} stroke={INK} strokeWidth={1} />
      {/* visor */}
      <path d={`M${fx(gx)},${fx(by + ry - 3)} V${fx(ty + 3)}`} stroke={FAINT} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${fx(gx)},${fx(by + ry - 3)} V${fx(by + ry - 3 - (h - 6) * lv)}`} stroke={BODY} strokeWidth={3} strokeLinecap="round" style={{ transition: 'd 600ms cubic-bezier(0.16,1,0.3,1)' }} />
    </g>
  );
}

/** Caixa simples (palete embalada, saca). */
function Box({ iso, x0, y0, w, d, h, fill }: { iso: Iso; x0: number; y0: number; w: number; d: number; h: number; fill: string }) {
  const x1 = x0 + w;
  const y1 = y0 + d;
  return (
    <g strokeLinejoin="round">
      <path d={poly(iso, [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]])} fill={fill} stroke={INK} strokeWidth={0.9} />
      <path d={poly(iso, [[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]])} fill={`color-mix(in oklab, ${fill} 82%, var(--fg))`} stroke={INK} strokeWidth={0.9} />
      <path d={poly(iso, [[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]])} fill={`color-mix(in oklab, ${fill} 70%, var(--surface))`} stroke={INK} strokeWidth={0.9} />
    </g>
  );
}

/* ------------------------------------------------------------ mundos */

function OliveTop({ iso, seed, tanks }: { iso: Iso; seed: string; tanks?: TelemetryUnit[] }) {
  const rng = createRng(`${seed}-olival`);
  const lagar = { x0: 22, y0: 96, w: 70, d: 44 };
  const inLagar = (x: number, y: number) => x > lagar.x0 - 12 && x < 178 && y > lagar.y0 - 12;
  let shadows = '';
  let canopies = '';
  let walls = '';
  for (let j = 0; j < 11; j++) {
    const y = 9 + j * 13.4;
    if (j < 10) walls += `M${iso(0, y + 6, 0).map(fx).join(',')} L${iso(L, y + 6, 0).map(fx).join(',')} `;
    for (let x = 12 + (j % 2) * 8; x < L - 6; x += 16) {
      if (inLagar(x, y)) continue;
      const jx = x + rng.range(-1.5, 1.5);
      shadows += isoDot(iso, jx + 1.5, y + 1.5, 0, 4.2);
      canopies += isoDot(iso, jx, y, 4.5, 4.4 + rng.range(-0.5, 0.5));
    }
  }
  const units = (tanks?.length ? tanks : [{ id: 'D1', label: '', capacity: 1, level: 0.7 }, { id: 'D2', label: '', capacity: 1, level: 0.4 }]).slice(0, 4);
  return (
    <g>
      <path d={walls} stroke={LINE} strokeWidth={1} />
      <path d={shadows} fill="color-mix(in oklab, var(--fg) 12%, transparent)" />
      <path d={canopies} fill={BODY} opacity={0.88} />
      <Gabled iso={iso} {...lagar} h={30} r={15} />
      {units.map((u, i) => (
        <Tank key={u.id} iso={iso} x={108 + i * 18} y={122} r={7} h={34} level={u.capacity > 0 ? u.level / u.capacity : 0} />
      ))}
    </g>
  );
}

function WaterTop({ iso }: { iso: Iso }) {
  const plant = { x0: 92, y0: 94, w: 88, d: 42, h: 26 };
  const x1 = plant.x0 + plant.w;
  const y1 = plant.y0 + plant.d;
  const teeth = 4;
  const tw = plant.w / teeth;
  let slopes = '';
  let glass = '';
  let gables = '';
  for (let i = 0; i < teeth; i++) {
    const xa = plant.x0 + i * tw;
    slopes += poly(iso, [[xa, plant.y0, plant.h], [xa + tw, plant.y0, plant.h + 9], [xa + tw, y1, plant.h + 9], [xa, y1, plant.h]]) + ' ';
    glass += poly(iso, [[xa + tw, plant.y0, plant.h], [xa + tw, y1, plant.h], [xa + tw, y1, plant.h + 9], [xa + tw, plant.y0, plant.h + 9]]) + ' ';
    gables += poly(iso, [[xa, y1, plant.h], [xa + tw, y1, plant.h + 9], [xa + tw, y1, plant.h]]) + ' ';
  }
  const pipeX = 140;
  const [ax, ay] = iso(pipeX, D, 0);
  const [bx, by] = iso(pipeX, D, -27);
  const [px, py] = iso(pipeX, y1, 0);
  // nascente: lagoa e escorrência
  const springs = [isoDot(iso, 46, 40, 0, 11), isoDot(iso, 46, 40, 0, 6)].join(' ');
  return (
    <g strokeLinejoin="round">
      <path d={springs} fill="none" stroke={BODY} strokeWidth={1.4} />
      <path d={`M${iso(56, 48, 0).map(fx).join(',')} Q${iso(80, 80, 0).map(fx).join(',')} ${iso(96, 92, 0).map(fx).join(',')}`} fill="none" stroke={BODY} strokeWidth={1.4} strokeDasharray="3 3" />
      {/* captação: do aquífero à nave */}
      <path d={`M${fx(bx)},${fx(by)} L${fx(ax)},${fx(ay)} L${fx(px)},${fx(py)}`} stroke={INK} strokeWidth={2.4} fill="none" />
      <path d={isoDot(iso, pipeX, D, -27, 2.6)} fill={BODY} />
      {/* nave de engarrafamento */}
      <path d={poly(iso, [[plant.x0, y1, 0], [x1, y1, 0], [x1, y1, plant.h], [plant.x0, y1, plant.h]])} fill={PAPER} stroke={INK} strokeWidth={1} />
      <path d={poly(iso, [[x1, plant.y0, 0], [x1, y1, 0], [x1, y1, plant.h], [x1, plant.y0, plant.h]])} fill={tint(7, 'var(--fg)')} stroke={INK} strokeWidth={1} />
      <path d={gables} fill={PAPER} stroke={INK} strokeWidth={1} />
      <path d={slopes} fill={tint(36)} stroke={INK} strokeWidth={1} />
      <path d={glass} fill={tint(12)} stroke={INK} strokeWidth={0.9} />
      {/* janela da linha com garrafas */}
      <path d={poly(iso, [[plant.x0 + 10, y1, 7], [plant.x0 + 64, y1, 7], [plant.x0 + 64, y1, 17], [plant.x0 + 10, y1, 17]])} fill={tint(14)} stroke={LINE} strokeWidth={0.9} />
      <path
        d={Array.from({ length: 7 }, (_, i) => {
          const [gx, gy] = iso(plant.x0 + 15 + i * 7.5, y1, 8);
          return `M${fx(gx)},${fx(gy)} v-7`;
        }).join(' ')}
        stroke={BODY}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* paletes prontas */}
      <Box iso={iso} x0={194} y0={100} w={18} d={16} h={13} fill={tint(62)} />
      <Box iso={iso} x0={216} y0={100} w={18} d={16} h={13} fill={tint(62)} />
      <Box iso={iso} x0={194} y0={120} w={18} d={16} h={13} fill={tint(62)} />
    </g>
  );
}

function CoffeeTop({ iso, seed }: { iso: Iso; seed: string }) {
  const rng = createRng(`${seed}-cafezal`);
  let shrubs = '';
  let cherries = '';
  let walls = '';
  for (let j = 0; j < 11; j++) {
    const y = 8 + j * 13;
    if (j < 10) walls += `M${iso(0, y + 6, 0).map(fx).join(',')} L${iso(L, y + 6, 0).map(fx).join(',')} `;
    for (let x = 10 + (j % 2) * 7; x < L - 6; x += 14) {
      if (x > 96 && y > 76) continue;
      shrubs += isoDot(iso, x, y, 3.5, 4);
      if (rng.chance(0.6)) cherries += isoDot(iso, x + 1.5, y + 2, 4.5, 1.3);
    }
  }
  const t = { x0: 104, y0: 90, w: 90, d: 48 };
  let grid = poly(iso, [[t.x0, t.y0, 0], [t.x0 + t.w, t.y0, 0], [t.x0 + t.w, t.y0 + t.d, 0], [t.x0, t.y0 + t.d, 0]]);
  for (let k = 1; k < 6; k++) grid += ` M${iso(t.x0 + (t.w / 6) * k, t.y0, 0).map(fx).join(',')} L${iso(t.x0 + (t.w / 6) * k, t.y0 + t.d, 0).map(fx).join(',')}`;
  for (let k = 1; k < 3; k++) grid += ` M${iso(t.x0, t.y0 + (t.d / 3) * k, 0).map(fx).join(',')} L${iso(t.x0 + t.w, t.y0 + (t.d / 3) * k, 0).map(fx).join(',')}`;
  return (
    <g>
      <path d={walls} stroke={LINE} strokeWidth={1} />
      <path d={shrubs} fill="color-mix(in oklab, var(--ok) 55%, var(--surface))" />
      <path d={cherries} fill={BODY} />
      <path d={grid} fill={tint(18)} stroke={LINE} strokeWidth={0.9} />
      <Box iso={iso} x0={204} y0={104} w={12} d={10} h={11} fill={tint(70)} />
      <Box iso={iso} x0={218} y0={104} w={12} d={10} h={11} fill={tint(70)} />
      <Box iso={iso} x0={208} y0={118} w={12} d={10} h={11} fill={tint(70)} />
    </g>
  );
}

/* ------------------------------------------------------------ cena */

export function Terrain({
  world,
  seed,
  tanks,
  className,
  label,
  crop,
  align = 'center',
}: {
  world: WorldId;
  seed: string;
  tanks?: TelemetryUnit[];
  className?: string;
  label: string;
  crop?: boolean;
  /** 'left' deixa espaço à direita (para o medidor pousar na paisagem) */
  align?: 'left' | 'center';
}) {
  const uid = useId().replace(/:/g, '');
  const iso = makeIso(align === 'left' ? 150 : 221, 36);
  return (
    <div className={cn('relative w-full overflow-hidden', crop ? 'aspect-[520/220] sm:aspect-[520/300]' : 'aspect-[520/300]', className)} role="img" aria-label={label} data-world={world}>
      <ParallaxLayer distance={22} className="absolute inset-0">
        {world === 'agua' ? <Ridges seed={seed} /> : <Contours seed={seed} />}
      </ParallaxLayer>
      <Layer>
        <Block iso={iso} world={world} uid={uid}>
          {world === 'azeite' && <OliveTop iso={iso} seed={seed} tanks={tanks} />}
          {world === 'agua' && <WaterTop iso={iso} />}
          {world === 'cafe' && <CoffeeTop iso={iso} seed={seed} />}
        </Block>
      </Layer>
    </div>
  );
}
