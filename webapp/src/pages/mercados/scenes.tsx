import { useEffect, useMemo } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import type { WorldId } from '../../data/types';
import { cn } from '../../lib/cn';
import { EASE_OUT } from '../../components/game';

/* =====================================================================
   Paisagens dos mundos em axonometria isométrica, desenhadas em SVG com
   os tokens da paleta. Cada cena mostra a mercadoria física ao nível real
   da telemetria: depósitos do lagar, paletes no armazém, sacas na tulha.
   ===================================================================== */

type Pt = [number, number];
type Proj = (x: number, y: number, z?: number) => Pt;

const COS30 = Math.cos(Math.PI / 6);
const r1 = (n: number) => Math.round(n * 10) / 10;
const pts = (list: Pt[]) => list.map(([a, b]) => `${r1(a)},${r1(b)}`).join(' ');

function makeProj(ox: number, oy: number, u: number): Proj {
  return (x, y, z = 0) => [ox + (x - y) * COS30 * u, oy + (x + y) * 0.5 * u - z * u];
}

/** Semi-eixos do círculo de raio r (unidades do mundo) projetado no plano do chão. */
const ellipseAxes = (r: number, u: number) => ({ rx: r * Math.SQRT2 * COS30 * u, ry: r * Math.SQRT2 * 0.5 * u });

/* Tintas da cena: tudo a partir dos tokens, para o tema escuro funcionar sozinho. */
const INK = {
  line: 'color-mix(in oklab, var(--world-ink) 55%, var(--surface))',
  lineSoft: 'color-mix(in oklab, var(--world-ink) 28%, var(--surface))',
  groundTop: 'color-mix(in oklab, var(--world) 15%, var(--surface))',
  groundLeft: 'color-mix(in oklab, var(--world) 30%, var(--surface-2))',
  groundRight: 'color-mix(in oklab, var(--world) 46%, var(--surface-2))',
  wallLeft: 'color-mix(in oklab, var(--fg) 3%, var(--surface))',
  wallRight: 'color-mix(in oklab, var(--fg) 13%, var(--surface-2))',
  roof: 'color-mix(in oklab, var(--world-ink) 62%, var(--surface))',
  roofDark: 'color-mix(in oklab, var(--world-ink) 78%, var(--surface))',
  steel: 'color-mix(in oklab, var(--fg) 6%, var(--surface))',
  steelLine: 'color-mix(in oklab, var(--fg) 40%, var(--surface))',
  liquid: 'var(--world)',
  liquidTop: 'color-mix(in oklab, var(--world) 70%, var(--surface))',
  shadow: 'color-mix(in oklab, var(--fg) 10%, transparent)',
  wood: 'color-mix(in oklab, var(--fg) 24%, var(--surface-2))',
  opening: 'color-mix(in oklab, var(--fg) 55%, var(--surface))',
};

/* ------------------------------------------------------------ peças */

function IsoBox({ P, x, y, z = 0, w, d, h, top, left, right, stroke = INK.line, sw = 1 }: { P: Proj; x: number; y: number; z?: number; w: number; d: number; h: number; top: string; left: string; right: string; stroke?: string; sw?: number }) {
  const t = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const l = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const r = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  return (
    <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
      <polygon points={pts(l)} fill={left} />
      <polygon points={pts(r)} fill={right} />
      <polygon points={pts(t)} fill={top} />
    </g>
  );
}

/** Contorno orgânico (curva de nível) à volta de (cx, cy), à cota z. */
function contourPath(P: Proj, cx: number, cy: number, r: number, z: number, seed: number) {
  const n = 72;
  const list: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.07 * Math.sin(3 * a + seed) + 0.045 * Math.sin(5 * a + seed * 1.7) + 0.025 * Math.cos(7 * a + seed * 0.6);
    list.push(P(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k, z));
  }
  return `M${list.map(([a, b]) => `${r1(a)} ${r1(b)}`).join(' L')} Z`;
}

/** Modelo topográfico em camadas: o relevo desenhado como curvas de nível empilhadas. */
function TopoHill({ P, cx, cy, radii, step, seed, tone = 'world' }: { P: Proj; cx: number; cy: number; radii: number[]; step: number; seed: number; tone?: 'world' | 'neutral' }) {
  return (
    <g strokeLinejoin="round">
      {radii.map((r, i) => {
        const z = (i + 1) * step;
        const mix = tone === 'world' ? 14 + i * 7 : 6 + i * 5;
        const base = tone === 'world' ? 'var(--world)' : 'var(--fg)';
        return (
          <g key={i}>
            <path d={contourPath(P, cx, cy, r, z - step * 0.85, seed + i * 0.4)} fill={`color-mix(in oklab, ${base} ${mix + 14}%, var(--surface-2))`} stroke="none" />
            <path d={contourPath(P, cx, cy, r, z, seed + i * 0.4)} fill={`color-mix(in oklab, ${base} ${mix}%, var(--surface))`} stroke={INK.line} strokeWidth={0.9} />
          </g>
        );
      })}
    </g>
  );
}

/** Curvas de nível de fundo (fora da ilha): o terreno continua para lá do lote. */
function Contours({ P, cx, cy, radii, seed }: { P: Proj; cx: number; cy: number; radii: number[]; seed: number }) {
  return (
    <g fill="none" stroke={INK.lineSoft} strokeWidth={1}>
      {radii.map((r, i) => (
        <path key={i} d={contourPath(P, cx, cy, r, 0, seed + i * 0.9)} />
      ))}
    </g>
  );
}

/** Nível animado (0–1): segue o valor; enche de 0 ao montar se pedido. */
function useLevel(value: number, fromZero: boolean): MotionValue<number> {
  const reduce = useReducedMotion();
  const mv = useMotionValue(fromZero && !reduce ? 0 : value);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration: fromZero ? 0.75 : 0.8, ease: EASE_OUT, delay: fromZero ? 0.15 : 0 });
    return () => c.stop();
  }, [value, reduce, mv, fromZero]);
  return mv;
}

/** Depósito de inox em corte: o azeite à vista até ao nível lido pela telemetria. */
function SteelTank({ P, u, cx, cy, r, h, level, fromZero }: { P: Proj; u: number; cx: number; cy: number; r: number; h: number; level: number; fromZero: boolean }) {
  const { rx, ry } = ellipseAxes(r, u);
  const [bx, by] = P(cx, cy, 0);
  const [, ty] = P(cx, cy, h);
  const lv = useLevel(level, fromZero);
  const ly = useTransform(lv, (v) => by - Math.max(0, Math.min(1, v)) * (by - ty));
  const liquid = useTransform(ly, (y) => `M${r1(bx - rx + 2)} ${r1(y)} L${r1(bx - rx + 2)} ${r1(by)} A${r1(rx - 2)} ${r1(ry - 1.2)} 0 0 0 ${r1(bx + rx - 2)} ${r1(by)} L${r1(bx + rx - 2)} ${r1(y)} Z`);
  const showTop = useTransform(lv, (v) => (v > 0.01 ? 1 : 0));
  const body = `M${r1(bx - rx)} ${r1(ty)} L${r1(bx - rx)} ${r1(by)} A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(bx + rx)} ${r1(by)} L${r1(bx + rx)} ${r1(ty)} A${r1(rx)} ${r1(ry)} 0 0 1 ${r1(bx - rx)} ${r1(ty)} Z`;
  return (
    <g>
      <ellipse cx={bx + rx * 0.35} cy={by + ry * 0.3} rx={rx * 1.15} ry={ry * 1.05} fill={INK.shadow} />
      {/* pernas */}
      <line x1={bx - rx * 0.7} y1={by} x2={bx - rx * 0.7} y2={by + 6} stroke={INK.steelLine} strokeWidth={1.4} />
      <line x1={bx + rx * 0.7} y1={by} x2={bx + rx * 0.7} y2={by + 6} stroke={INK.steelLine} strokeWidth={1.4} />
      <path d={body} fill={INK.steel} stroke={INK.steelLine} strokeWidth={1} />
      <motion.path d={liquid} fill={INK.liquid} opacity={0.9} />
      <motion.ellipse cx={bx} cy={ly} rx={rx - 2} ry={ry - 1.2} fill={INK.liquidTop} style={{ opacity: showTop }} />
      {/* aros e tampa */}
      <path d={`M${r1(bx - rx)} ${r1(ty + (by - ty) * 0.33)} A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(bx + rx)} ${r1(ty + (by - ty) * 0.33)}`} fill="none" stroke={INK.steelLine} strokeWidth={0.8} opacity={0.7} />
      <path d={`M${r1(bx - rx)} ${r1(ty + (by - ty) * 0.66)} A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(bx + rx)} ${r1(ty + (by - ty) * 0.66)}`} fill="none" stroke={INK.steelLine} strokeWidth={0.8} opacity={0.7} />
      <ellipse cx={bx} cy={ty} rx={rx} ry={ry} fill={INK.wallLeft} stroke={INK.steelLine} strokeWidth={1} />
      <ellipse cx={bx} cy={ty - 1.5} rx={rx * 0.32} ry={ry * 0.32} fill={INK.steel} stroke={INK.steelLine} strokeWidth={0.9} />
    </g>
  );
}

/** IBC de 1 000 kg: cubo na grade, sobre palete, com o azeite à vista. */
function Ibc({ P, x, y, level = 1 }: { P: Proj; x: number; y: number; level?: number }) {
  const s = 1.7;
  const ph = 0.32;
  const h = 1.75;
  const lh = Math.max(0.05, Math.min(1, level)) * (h - 0.15);
  const faceL = (z0: number, z1: number) => [P(x, y + s, z0), P(x + s, y + s, z0), P(x + s, y + s, z1), P(x, y + s, z1)];
  const faceR = (z0: number, z1: number) => [P(x + s, y, z0), P(x + s, y + s, z0), P(x + s, y + s, z1), P(x + s, y, z1)];
  return (
    <g strokeLinejoin="round">
      <IsoBox P={P} x={x} y={y} w={s} d={s} h={ph} top={INK.wood} left={INK.wood} right={INK.wallRight} stroke={INK.steelLine} sw={0.8} />
      <polygon points={pts(faceL(ph, ph + h))} fill={INK.wallLeft} opacity={0.9} />
      <polygon points={pts(faceR(ph, ph + h))} fill={INK.steel} opacity={0.9} />
      <polygon points={pts(faceL(ph, ph + lh))} fill={INK.liquid} opacity={0.82} />
      <polygon points={pts(faceR(ph, ph + lh))} fill={INK.liquid} />
      <polygon points={pts([P(x, y, ph + h), P(x + s, y, ph + h), P(x + s, y + s, ph + h), P(x, y + s, ph + h)])} fill={INK.wallLeft} stroke={INK.steelLine} strokeWidth={0.8} />
      {/* grade */}
      <g stroke={INK.steelLine} strokeWidth={0.8} fill="none">
        <polygon points={pts(faceL(ph, ph + h))} />
        <polygon points={pts(faceR(ph, ph + h))} />
        {[0.33, 0.66].map((k) => (
          <g key={k}>
            <polyline points={pts([P(x + s * k, y + s, ph), P(x + s * k, y + s, ph + h)])} />
            <polyline points={pts([P(x + s, y + s * k, ph), P(x + s, y + s * k, ph + h)])} />
            <polyline points={pts([P(x, y + s, ph + h * k), P(x + s, y + s, ph + h * k), P(x + s, y, ph + h * k)])} />
          </g>
        ))}
      </g>
      {/* tampa */}
      {(() => {
        const [cx, cy] = P(x + s / 2, y + s / 2, ph + h);
        return <ellipse cx={cx} cy={cy} rx={3.4} ry={2} fill={INK.steel} stroke={INK.steelLine} strokeWidth={0.8} />;
      })()}
    </g>
  );
}

/** Oliveira: copa redonda, tronco curto e sombra. */
function OliveTree({ P, u, x, y, detail }: { P: Proj; u: number; x: number; y: number; detail: boolean }) {
  const [gx, gy] = P(x, y, 0);
  const [, ty] = P(x, y, 1.05);
  const [cx, cy] = P(x, y, 1.75);
  const cr = u * 0.98;
  return (
    <g>
      <ellipse cx={gx + u * 0.5} cy={gy + 1} rx={u * 1.05} ry={u * 0.5} fill={INK.shadow} />
      <line x1={gx} y1={gy} x2={gx} y2={ty} stroke={INK.roofDark} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={cr} fill="color-mix(in oklab, var(--world) 78%, var(--surface))" stroke={INK.line} strokeWidth={0.9} />
      <path d={`M${r1(cx - cr * 0.55)} ${r1(cy - cr * 0.15)} A${r1(cr * 0.62)} ${r1(cr * 0.62)} 0 0 1 ${r1(cx + cr * 0.15)} ${r1(cy - cr * 0.58)}`} fill="none" stroke="color-mix(in oklab, var(--world) 30%, var(--surface))" strokeWidth={1.2} strokeLinecap="round" />
      {detail && (
        <g fill={INK.roofDark}>
          <circle cx={cx + cr * 0.35} cy={cy + cr * 0.2} r={1.1} />
          <circle cx={cx - cr * 0.25} cy={cy + cr * 0.42} r={1.1} />
          <circle cx={cx + cr * 0.05} cy={cy + cr * 0.05} r={1} />
        </g>
      )}
    </g>
  );
}

/** Edifício de duas águas (lagar, casa da fazenda). */
function GableHouse({ P, x, y, w, d, h, rise, door = true, windows = 3 }: { P: Proj; x: number; y: number; w: number; d: number; h: number; rise: number; door?: boolean; windows?: number }) {
  const ridgeY = y + d / 2;
  const backRoof = [P(x, y, h), P(x + w, y, h), P(x + w, ridgeY, h + rise), P(x, ridgeY, h + rise)];
  const frontRoof = [P(x, ridgeY, h + rise), P(x + w, ridgeY, h + rise), P(x + w, y + d, h), P(x, y + d, h)];
  const gable = [P(x + w, y, h), P(x + w, y + d, h), P(x + w, ridgeY, h + rise)];
  const winW = Math.min(1.1, (w - 2) / (windows * 1.8));
  return (
    <g strokeLinejoin="round">
      <IsoBox P={P} x={x} y={y} w={w} d={d} h={h} top={INK.wallLeft} left={INK.wallLeft} right={INK.wallRight} />
      <polygon points={pts(gable)} fill={INK.wallRight} stroke={INK.line} strokeWidth={1} />
      <polygon points={pts(backRoof)} fill={INK.roofDark} stroke={INK.line} strokeWidth={1} />
      <polygon points={pts(frontRoof)} fill={INK.roof} stroke={INK.line} strokeWidth={1} />
      {/* fiadas do telhado */}
      <g stroke="color-mix(in oklab, var(--world-ink) 45%, var(--surface))" strokeWidth={0.7}>
        {Array.from({ length: Math.floor(w / 1.1) - 1 }, (_, i) => {
          const xx = x + (i + 1) * (w / Math.floor(w / 1.1));
          return <line key={i} x1={P(xx, ridgeY, h + rise)[0]} y1={P(xx, ridgeY, h + rise)[1]} x2={P(xx, y + d, h)[0]} y2={P(xx, y + d, h)[1]} />;
        })}
      </g>
      {/* janelas e porta na fachada (face y-max) */}
      <g fill={INK.opening}>
        {Array.from({ length: windows }, (_, i) => {
          const wx = x + 1 + i * ((w - 2) / windows) + 0.2;
          return <polygon key={i} points={pts([P(wx, y + d, h * 0.55), P(wx + winW, y + d, h * 0.55), P(wx + winW, y + d, h * 0.82), P(wx, y + d, h * 0.82)])} />;
        })}
        {door && <polygon points={pts([P(x + w - 2.3, y + d, 0), P(x + w - 0.9, y + d, 0), P(x + w - 0.9, y + d, h * 0.62), P(x + w - 2.3, y + d, h * 0.62)])} />}
      </g>
    </g>
  );
}

/** Palete de packs de água (6 × 1,5 L em filme), em camadas. */
function WaterPallet({ P, x, y, filled }: { P: Proj; x: number; y: number; filled: boolean }) {
  const s = 1.55;
  if (!filled) {
    return <polygon points={pts([P(x, y), P(x + s, y), P(x + s, y + s), P(x, y + s)])} fill="none" stroke={INK.lineSoft} strokeWidth={1} strokeDasharray="3 2.5" />;
  }
  return (
    <g>
      <IsoBox P={P} x={x} y={y} w={s} d={s} h={0.25} top={INK.wood} left={INK.wood} right={INK.wallRight} stroke={INK.steelLine} sw={0.7} />
      <IsoBox P={P} x={x} y={y} z={0.25} w={s} d={s} h={1.7} top="color-mix(in oklab, var(--world) 22%, var(--surface))" left="color-mix(in oklab, var(--world) 34%, var(--surface))" right="color-mix(in oklab, var(--world) 52%, var(--surface-2))" stroke={INK.line} sw={0.8} />
      <g stroke="color-mix(in oklab, var(--world-ink) 40%, var(--surface))" strokeWidth={0.6}>
        {[0.25 + 0.57, 0.25 + 1.14].map((z) => (
          <polyline key={z} fill="none" points={pts([P(x, y + s, z), P(x + s, y + s, z), P(x + s, y, z)])} />
        ))}
      </g>
    </g>
  );
}

/** Saca de juta de 60 kg (contorno tracejado = ainda por encher). */
function Sack({ P, x, y, z = 0, filled }: { P: Proj; x: number; y: number; z?: number; filled: boolean }) {
  const [cx, cy] = P(x, y, z + 0.55);
  const w = 15;
  const h = 10;
  const d = `M${r1(cx - w)} ${r1(cy - h * 0.2)} Q${r1(cx - w - 1.5)} ${r1(cy + h)} ${r1(cx)} ${r1(cy + h * 1.05)} Q${r1(cx + w + 1.5)} ${r1(cy + h)} ${r1(cx + w)} ${r1(cy - h * 0.2)} Q${r1(cx + w * 0.4)} ${r1(cy - h * 0.95)} ${r1(cx)} ${r1(cy - h * 0.7)} Q${r1(cx - w * 0.4)} ${r1(cy - h * 0.95)} ${r1(cx - w)} ${r1(cy - h * 0.2)} Z`;
  return filled ? (
    <g>
      <path d={d} fill="color-mix(in oklab, var(--world) 45%, var(--surface))" stroke={INK.line} strokeWidth={0.9} />
      <path d={`M${r1(cx - w * 0.6)} ${r1(cy + h * 0.15)} Q${r1(cx)} ${r1(cy + h * 0.4)} ${r1(cx + w * 0.6)} ${r1(cy + h * 0.15)}`} fill="none" stroke={INK.line} strokeWidth={0.7} />
    </g>
  ) : (
    <path d={d} fill="color-mix(in oklab, var(--surface) 70%, transparent)" stroke={INK.line} strokeWidth={0.9} strokeDasharray="3 2.5" />
  );
}

/* ------------------------------------------------------------ cenas */

export interface SceneProps {
  /** 'hero' mostra a ilha inteira; 'band' recorta uma faixa larga para o resumo */
  variant?: 'hero' | 'band';
  /** níveis (0–1) das unidades de armazenagem, lidos da telemetria */
  levels: number[];
  /** enche de 0 ao montar (momento focal do ecrã) */
  fillOnMount?: boolean;
  className?: string;
  /** descrição acessível da cena */
  label: string;
}

const U = 9;

function OlivalScene({ variant = 'hero', levels, fillOnMount = false, className, label }: SceneProps) {
  const P = useMemo(() => makeProj(300, 34, U), []);
  const trees = useMemo(() => {
    const list: Pt[] = [];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) list.push([3.2 + i * 2.6 + (j % 2) * 1.3, 12.6 + j * 2.5]);
    return list.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  }, []);
  const farRows = useMemo(() => {
    const list: Pt[] = [];
    for (let i = 0; i < 11; i++) for (let j = 0; j < 4; j++) list.push([19.5 + i * 1.5, 1.6 + j * 1.6]);
    return list;
  }, []);
  const tanks: { cx: number; cy: number }[] = [
    { cx: 32.2, cy: 10.6 },
    { cx: 35.4, cy: 10.6 },
    { cx: 32.2, cy: 13.8 },
    { cx: 35.4, cy: 13.8 },
  ];
  const vb = variant === 'band' ? '40 70 640 236' : '0 6 720 330';
  return (
    <svg viewBox={vb} role="img" aria-label={label} className={cn('block h-auto w-full', className)} preserveAspectRatio="xMidYMid meet">
      <Contours P={P} cx={8} cy={5} radii={[11, 14.5, 18.5, 23, 28]} seed={1.3} />
      {/* ilha de terreno */}
      <IsoBox P={P} x={0} y={0} z={-1.3} w={38} d={22} h={1.3} top={INK.groundTop} left={INK.groundLeft} right={INK.groundRight} stroke={INK.line} />
      <g stroke={INK.lineSoft} strokeWidth={0.8} fill="none">
        <polyline points={pts([P(0, 22, -0.55), P(38, 22, -0.55), P(38, 0, -0.55)])} />
      </g>
      <TopoHill P={P} cx={7.5} cy={5.2} radii={[6.4, 5, 3.6, 2.2]} step={0.55} seed={2.1} />
      {/* olival ao longe: linhas de plantação em grelha de pontos */}
      <g fill="color-mix(in oklab, var(--world) 70%, var(--surface))" stroke={INK.line} strokeWidth={0.6}>
        {farRows.map(([x, y], i) => {
          const [sx, sy] = P(x, y, 0.45);
          return <circle key={i} cx={sx} cy={sy} r={2.6} />;
        })}
      </g>
      {/* caminho de expedição */}
      <polygon points={pts([P(29.2, 17.1), P(38, 17.1), P(38, 18.5), P(29.2, 18.5)])} fill="color-mix(in oklab, var(--fg) 7%, var(--surface-2))" stroke={INK.lineSoft} strokeWidth={0.8} />
      {trees.map(([x, y], i) => (
        <OliveTree key={i} P={P} u={U} x={x} y={y} detail={variant === 'hero'} />
      ))}
      <GableHouse P={P} x={20.5} y={10.5} w={8.6} d={6.2} h={4.4} rise={1.9} />
      {tanks.map((t, i) => (
        <SteelTank key={i} P={P} u={U} cx={t.cx} cy={t.cy} r={1.25} h={5.4} level={levels[i] ?? 0} fromZero={fillOnMount} />
      ))}
      {[21.2, 23.3, 25.4, 27.5].map((x) => (
        <Ibc key={x} P={P} x={x} y={18.9} level={1} />
      ))}
    </svg>
  );
}

function NascenteScene({ variant = 'hero', levels, fillOnMount = false, className, label }: SceneProps) {
  const P = useMemo(() => makeProj(250, 54, U), []);
  const W = 36;
  const D = 18;
  const strata = [
    { z0: 0, z1: -1.1, fill: 'color-mix(in oklab, var(--fg) 12%, var(--surface-2))', name: 'solo' },
    { z0: -1.1, z1: -3.8, fill: 'color-mix(in oklab, var(--fg) 5%, var(--surface))', name: 'granito' },
    { z0: -3.8, z1: -6.6, fill: 'color-mix(in oklab, var(--world) 30%, var(--surface))', name: 'aquifero' },
    { z0: -6.6, z1: -8.6, fill: 'color-mix(in oklab, var(--fg) 17%, var(--surface-2))', name: 'base' },
  ];
  // armazém: 4 × 4 lugares de palete, ocupados ao nível da telemetria
  const slots: Pt[] = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) slots.push([25.4 + i * 2.1, 7.2 + j * 2.1]);
  const level = levels[0] ?? 0;
  const lv = useLevel(level, fillOnMount);
  const ordered = slots.map((s, i) => ({ s, i })).sort((a, b) => a.s[0] + a.s[1] - (b.s[0] + b.s[1]));
  const vb = variant === 'band' ? '6 10 520 300' : '0 0 560 330';
  return (
    <svg viewBox={vb} role="img" aria-label={label} className={cn('block h-auto w-full', className)} preserveAspectRatio="xMidYMid meet">
      <Contours P={P} cx={5} cy={4} radii={[9, 12.5, 16.5]} seed={0.4} />
      {/* bloco em corte com os estratos */}
      {strata.map((s) => (
        <g key={s.name} stroke={INK.line} strokeWidth={0.9} strokeLinejoin="round">
          <polygon points={pts([P(0, D, s.z1), P(W, D, s.z1), P(W, D, s.z0), P(0, D, s.z0)])} fill={s.fill} />
          <polygon points={pts([P(W, 0, s.z1), P(W, D, s.z1), P(W, D, s.z0), P(W, 0, s.z0)])} fill={`color-mix(in oklab, ${s.fill} 82%, var(--fg))`} />
        </g>
      ))}
      {/* poros do aquífero */}
      <g fill="var(--world-ink)" opacity={0.55}>
        {Array.from({ length: 34 }, (_, i) => {
          const x = 1 + ((i * 7.3) % 34);
          const z = -4.3 - ((i * 3.1) % 2);
          const [sx, sy] = P(x, D, z);
          return <circle key={i} cx={sx} cy={sy} r={1.2} />;
        })}
      </g>
      {/* fraturas do granito */}
      <g stroke={INK.lineSoft} strokeWidth={0.9} fill="none">
        {[4, 9, 15, 22, 28, 33].map((x, i) => (
          <polyline key={x} points={pts([P(x, D, -1.4), P(x + 0.8, D, -2.3 - (i % 2) * 0.4), P(x + 0.3, D, -3.4)])} />
        ))}
      </g>
      {/* topo do bloco */}
      <polygon points={pts([P(0, 0), P(W, 0), P(W, D), P(0, D)])} fill={INK.groundTop} stroke={INK.line} strokeWidth={1} />
      <TopoHill P={P} cx={6} cy={5} radii={[5.4, 4.2, 3, 1.8]} step={0.75} seed={3.4} tone="neutral" />
      {/* captação: furo até ao aquífero, visível no corte */}
      <g>
        <polygon points={pts([P(9.6, D, -5.9), P(10.4, D, -5.9), P(10.4, D, 0), P(9.6, D, 0)])} fill={INK.steel} stroke={INK.steelLine} strokeWidth={0.8} />
        <polygon points={pts([P(9.8, D, -5.8), P(10.2, D, -5.8), P(10.2, D, -0.2), P(9.8, D, -0.2)])} fill={INK.liquid} opacity={0.85} />
        <IsoBox P={P} x={9.2} y={16.6} w={1.4} d={1.4} h={1.2} top={INK.steel} left={INK.wallLeft} right={INK.wallRight} stroke={INK.steelLine} sw={0.8} />
      </g>
      {/* conduta até à linha de engarrafamento */}
      <polyline points={pts([P(10.6, 17.3, 0.35), P(15.5, 17.3, 0.35), P(15.5, 12.4, 0.35), P(16.5, 12.4, 0.35)])} fill="none" stroke={INK.liquid} strokeWidth={2.2} strokeLinejoin="round" />
      {/* nave de engarrafamento */}
      <IsoBox P={P} x={16.5} y={5.5} w={7.6} d={7.5} h={3.6} top={INK.wallLeft} left={INK.wallLeft} right={INK.wallRight} />
      <g stroke={INK.lineSoft} strokeWidth={0.8}>
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <polyline key={k} fill="none" points={pts([P(16.5 + k * 1.08, 5.5, 3.6), P(16.5 + k * 1.08, 13, 3.6)])} />
        ))}
      </g>
      <polygon points={pts([P(18, 13, 0), P(20.6, 13, 0), P(20.6, 13, 2.2), P(18, 13, 2.2)])} fill={INK.opening} />
      {/* garrafas à saída da linha */}
      {[21.4, 22.1, 22.8, 23.5].map((x) => {
        const [bx, by] = P(x, 13.9, 0);
        return (
          <g key={x}>
            <rect x={bx - 2.2} y={by - 12} width={4.4} height={12} rx={1.6} fill="color-mix(in oklab, var(--world) 38%, var(--surface))" stroke={INK.line} strokeWidth={0.7} />
            <rect x={bx - 1} y={by - 15} width={2} height={3.2} fill={INK.line} />
          </g>
        );
      })}
      {/* armazém de paletes */}
      <PalletGrid P={P} ordered={ordered} level={lv} />
    </svg>
  );
}

/** Lugares de palete que se ocupam à medida que o armazém enche. */
function PalletGrid({ P, ordered, level }: { P: Proj; ordered: { s: Pt; i: number }[]; level: MotionValue<number> }) {
  const n = ordered.length;
  return (
    <g>
      {ordered.map(({ s, i }) => (
        <PalletSlot key={i} P={P} at={s} index={i} n={n} level={level} />
      ))}
    </g>
  );
}

function PalletSlot({ P, at, index, n, level }: { P: Proj; at: Pt; index: number; n: number; level: MotionValue<number> }) {
  // o enchimento segue a ordem de arrumação (índice), não a profundidade de desenho
  const threshold = (index + 0.5) / n;
  const opacity = useTransform(level, (v) => (v >= threshold ? 1 : 0));
  return (
    <g>
      <WaterPallet P={P} x={at[0]} y={at[1]} filled={false} />
      <motion.g style={{ opacity }}>
        <WaterPallet P={P} x={at[0]} y={at[1]} filled />
      </motion.g>
    </g>
  );
}

function PlantacaoScene({ variant = 'hero', levels, className, label }: SceneProps) {
  const P = useMemo(() => makeProj(290, 40, U), []);
  const terraces = [
    { x: 1, y: 1, w: 24, d: 15, z: 0 },
    { x: 2.6, y: 2.3, w: 20.4, d: 11.2, z: 1.1 },
    { x: 4.2, y: 3.6, w: 16.8, d: 7.6, z: 2.2 },
    { x: 5.8, y: 4.9, w: 13.2, d: 4.2, z: 3.3 },
  ];
  const level = levels[0] ?? 0;
  const sacks: [number, number, number][] = [
    [31.2, 16.6, 0],
    [32.9, 16.6, 0],
    [34.6, 16.6, 0],
    [32, 16.2, 1.05],
    [33.7, 16.2, 1.05],
    [32.85, 15.8, 2.1],
  ];
  const vb = variant === 'band' ? '30 40 640 250' : '0 0 720 320';
  return (
    <svg viewBox={vb} role="img" aria-label={label} className={cn('block h-auto w-full', className)} preserveAspectRatio="xMidYMid meet">
      <Contours P={P} cx={12} cy={8} radii={[17, 21, 25.5]} seed={2.7} />
      <IsoBox P={P} x={0} y={0} z={-1.3} w={38} d={22} h={1.3} top={INK.groundTop} left={INK.groundLeft} right={INK.groundRight} stroke={INK.line} />
      {/* socalcos com cafeeiros em floração */}
      {terraces.map((t, k) => (
        <g key={k}>
          <IsoBox
            P={P}
            x={t.x}
            y={t.y}
            z={t.z}
            w={t.w}
            d={t.d}
            h={1.1}
            top={`color-mix(in oklab, var(--world) ${12 + k * 6}%, var(--surface))`}
            left={`color-mix(in oklab, var(--world) ${26 + k * 6}%, var(--surface-2))`}
            right={`color-mix(in oklab, var(--world) ${40 + k * 6}%, var(--surface-2))`}
          />
          <CoffeeRow P={P} from={[t.x + 0.9, t.y + t.d - 0.8]} to={[t.x + t.w - 0.9, t.y + t.d - 0.8]} z={t.z + 1.1} spacing={1.45} flowers={variant === 'hero'} />
          {k < 3 && <CoffeeRow P={P} from={[t.x + t.w - 0.8, t.y + 0.9]} to={[t.x + t.w - 0.8, t.y + t.d - 2.2]} z={t.z + 1.1} spacing={1.45} flowers={variant === 'hero'} />}
        </g>
      ))}
      {/* terreiro de secagem (vazio em outubro: a colheita no Brasil é de maio a setembro) */}
      <IsoBox P={P} x={26.5} y={4} w={10} d={9} h={0.25} top="color-mix(in oklab, var(--fg) 6%, var(--surface))" left={INK.wallLeft} right={INK.wallRight} stroke={INK.line} sw={0.9} />
      <g stroke={INK.lineSoft} strokeWidth={0.7}>
        {[1, 2, 3, 4].map((k) => (
          <polyline key={`a${k}`} fill="none" points={pts([P(26.5 + k * 2, 4, 0.25), P(26.5 + k * 2, 13, 0.25)])} />
        ))}
        {[1, 2, 3].map((k) => (
          <polyline key={`b${k}`} fill="none" points={pts([P(26.5, 4 + k * 2.25, 0.25), P(36.5, 4 + k * 2.25, 0.25)])} />
        ))}
      </g>
      <GableHouse P={P} x={27} y={14.6} w={4.6} d={4.2} h={2.8} rise={1.3} windows={1} />
      {/* sacas: tracejadas até haver café na tulha */}
      {sacks.map(([x, y, z], i) => (
        <Sack key={i} P={P} x={x} y={y} z={z} filled={level > (i + 0.5) / sacks.length} />
      ))}
    </svg>
  );
}

function CoffeeRow({ P, from, to, z, spacing, flowers }: { P: Proj; from: Pt; to: Pt; z: number; spacing: number; flowers: boolean }) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const n = Math.max(1, Math.floor(len / spacing));
  return (
    <g>
      {Array.from({ length: n + 1 }, (_, i) => {
        const x = from[0] + ((to[0] - from[0]) * i) / n;
        const y = from[1] + ((to[1] - from[1]) * i) / n;
        const [cx, cy] = P(x, y, z + 0.75);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={5.2} fill="color-mix(in oklab, var(--c-azeite-ink) 52%, var(--world))" stroke={INK.line} strokeWidth={0.7} />
            {flowers && (
              <g fill="var(--surface)">
                <circle cx={cx - 1.8} cy={cy - 1.5} r={0.95} />
                <circle cx={cx + 1.9} cy={cy - 0.4} r={0.95} />
                <circle cx={cx - 0.2} cy={cy + 1.9} r={0.95} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

export function WorldScene({ world, ...props }: SceneProps & { world: WorldId }) {
  return (
    <div data-world={world} className="min-w-0">
      {world === 'azeite' && <OlivalScene {...props} />}
      {world === 'agua' && <NascenteScene {...props} />}
      {world === 'cafe' && <PlantacaoScene {...props} />}
    </div>
  );
}
