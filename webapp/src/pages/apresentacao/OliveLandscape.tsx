import { useMemo, type ReactNode } from 'react';
import { ParallaxLayer } from '../../components/game';
import { createRng } from '../../lib/prng';
import { cn } from '../../lib/cn';
import { clamp01 } from './model';

/* =====================================================================
   Paisagem do olival, desenhada à mão em SVG geométrico: curvas de nível,
   filas de oliveiras como grelha de pontos em perspetiva, o lagar (moega de
   receção, tapete elevador, venezianas, porta de cargas) com os quatro
   depósitos de inox, IBC de 1 000 kg numa palete e o camião (cabina e caixa)
   que sai para o cliente. Três camadas com o mesmo viewBox; as duas do fundo
   têm parallax decorativo (desligado < 900 px e com movimento reduzido).
   ===================================================================== */

export const LS_W = 1440;
export const LS_H = 520;

/** Colunas das etiquetas (em fração da largura) e x dos fios que lhes chegam. */
export const LABEL_COLUMNS = [0.57, 0.7133, 0.8567] as const;
const LEADER_X = LABEL_COLUMNS.map((c) => Math.round(c * LS_W) + 3);
/**
 * Topo comum das etiquetas (y no viewBox): as três alinham pelo topo, numa só
 * linha, e o fio de cada uma sobe pela margem esquerda até ao título.
 */
export const LABEL_TOP_Y = 66;

const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const farY = (x: number) => 338 - 160 * Math.pow(smooth(0.22, 1, x / LS_W), 1.35) + 6 * Math.sin((x / LS_W) * 8.5);
const midY = (x: number) => 396 - 96 * Math.pow(smooth(0.3, 1, x / LS_W), 1.25) + 4 * Math.sin((x / LS_W) * 11 + 0.6);
const nearY = (x: number) => 446 - 18 * smooth(0.45, 1, x / LS_W);

function ridge(fn: (x: number) => number, step = 16): string {
  let d = `M0,${fn(0).toFixed(1)}`;
  for (let x = step; x <= LS_W; x += step) d += ` L${x},${fn(x).toFixed(1)}`;
  return d;
}
const filled = (fn: (x: number) => number) => `${ridge(fn)} L${LS_W},${LS_H} L0,${LS_H} Z`;

interface Tree {
  x: number;
  y: number;
  r: number;
}

function useTrees() {
  return useMemo(() => {
    const rng = createRng('olival-apresentacao');
    // filas no monte do meio: mais pequenas e juntas ao longe
    const mid: Tree[][] = [];
    for (let row = 0; row < 5; row++) {
      const dx = 15 + row * 3.4;
      const list: Tree[] = [];
      for (let x = 8 + (row % 2) * (dx / 2); x < LS_W; x += dx) {
        const y = midY(x) + 9 + row * 10.5 + rng.range(-0.6, 0.6);
        if (y > nearY(x) - 4) continue;
        list.push({ x: x + rng.range(-1.6, 1.6), y, r: 2.3 + row * 0.55 + rng.range(-0.2, 0.3) });
      }
      mid.push(list);
    }
    // primeiro plano, à esquerda do lagar
    const near: Tree[][] = [];
    [
      { off: 22, r: 7, dx: 30 },
      { off: 50, r: 10, dx: 44 },
    ].forEach((spec, row) => {
      const list: Tree[] = [];
      for (let x = 14 + row * 12; x < 700 - spec.r * 3; x += spec.dx) {
        list.push({ x: x + rng.range(-2, 2), y: nearY(x) + spec.off + rng.range(-1, 1), r: spec.r + rng.range(-0.6, 0.8) });
      }
      near.push(list);
    });
    return { mid, near };
  }, []);
}

export interface Deposit {
  id: string;
  fraction: number;
}

export interface OliveLandscapeProps {
  /** frações de enchimento dos quatro depósitos do lagar (telemetria) */
  deposits: Deposit[];
  /** mostra os fios até às etiquetas (vista larga) */
  leaders?: boolean;
  /** recorte do viewBox: 'full' (≥ 1100 px) ou 'crop' (telemóvel e tablet) */
  crop?: boolean;
  /** sobreposição (etiquetas em HTML posicionadas em % do viewBox) */
  children?: ReactNode;
  className?: string;
}

export function OliveLandscape({ deposits, leaders = true, crop = false, children, className }: OliveLandscapeProps) {
  const { mid, near } = useTrees();
  const viewBox = crop ? '520 190 920 330' : `0 0 ${LS_W} ${LS_H}`;
  const aspect = crop ? '920 / 330' : `${LS_W} / ${LS_H}`;
  const layer = 'absolute inset-0 h-full w-full';
  const contours = [16, 32, 48, 66];

  return (
    <div className={cn('relative w-full overflow-hidden', className)} style={{ aspectRatio: aspect }}>
      {/* fundo: monte distante com curvas de nível */}
      <ParallaxLayer distance={26} className={layer}>
        <svg viewBox={viewBox} preserveAspectRatio="xMidYMax meet" className="block h-full w-full" aria-hidden>
          <path d={filled(farY)} fill="var(--ls-far)" />
          {contours.map((off, i) => (
            <path key={off} d={ridge((x) => farY(x) + off + i * 2, 24)} fill="none" stroke="var(--ls-contour)" strokeWidth="1" opacity={0.9 - i * 0.16} />
          ))}
        </svg>
      </ParallaxLayer>

      {/* meio: o monte com o olival em filas */}
      <ParallaxLayer distance={12} className={layer}>
        <svg viewBox={viewBox} preserveAspectRatio="xMidYMax meet" className="block h-full w-full" aria-hidden>
          <path d={filled(midY)} fill="var(--ls-mid)" />
          {mid.map((row, i) => (
            <g key={i} fill={i < 2 ? 'var(--ls-canopy-far)' : 'var(--ls-canopy)'}>
              {row.map((t, j) => (
                <circle key={j} cx={t.x.toFixed(1)} cy={t.y.toFixed(1)} r={t.r.toFixed(2)} />
              ))}
            </g>
          ))}
        </svg>
      </ParallaxLayer>

      {/* primeiro plano: campo, lagar, depósitos, IBC, estrada e camião */}
      <svg viewBox={viewBox} preserveAspectRatio="xMidYMax meet" className={cn(layer, 'block')} aria-hidden>
        <path d={filled(nearY)} fill="var(--ls-near)" />
        {/* estrada até ao comprador */}
        <path d="M818 447 C 900 452, 1010 458, 1110 455 S 1320 446, 1440 445" fill="none" stroke="var(--ls-road)" strokeWidth="9" strokeLinecap="round" />
        {/* oliveiras do primeiro plano */}
        {near.map((row, i) => (
          <g key={i}>
            {row.map((t, j) => (
              <g key={j}>
                <line x1={t.x} y1={t.y + t.r * 0.5} x2={t.x + 0.6} y2={t.y + t.r + 6} stroke="var(--ls-trunk)" strokeWidth={i ? 2 : 1.5} strokeLinecap="round" />
                <ellipse cx={t.x} cy={t.y} rx={t.r * 1.18} ry={t.r} fill="var(--ls-canopy)" />
              </g>
            ))}
          </g>
        ))}
        <Lagar />
        <Deposits deposits={deposits} />
        <IbcStack />
        <Truck />
        {leaders && (
          <g stroke="var(--ls-line)" strokeWidth="1" fill="var(--ls-line)">
            <line x1={LEADER_X[0]} y1={348} x2={LEADER_X[0]} y2={LABEL_TOP_Y + 4} />
            <circle cx={LEADER_X[0]} cy={350} r="2.5" stroke="none" />
            <line x1={LEADER_X[1]} y1={356} x2={LEADER_X[1]} y2={LABEL_TOP_Y + 4} />
            <circle cx={LEADER_X[1]} cy={358} r="2.5" stroke="none" />
            <line x1={LEADER_X[2]} y1={396} x2={LEADER_X[2]} y2={LABEL_TOP_Y + 4} />
            <circle cx={LEADER_X[2]} cy={398} r="2.5" stroke="none" />
          </g>
        )}
      </svg>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ objetos */

const STROKE = { stroke: 'var(--ls-line)', strokeWidth: 1.5, strokeLinejoin: 'round' as const };

function Lagar() {
  // o vértice do telhado fica no fio da primeira etiqueta
  const ax = LEADER_X[0];
  const x0 = ax - 64;
  const wall = 'color-mix(in oklab, var(--fg) 4%, var(--surface))';
  const dark = 'color-mix(in oklab, var(--fg) 18%, var(--surface))';
  return (
    <g>
      {/* chaminé do aquecimento das termobatedeiras */}
      <rect x={x0 + 96} y={352} width={9} height={24} fill="var(--surface)" {...STROKE} />
      {/* nave: paredes e telhado de duas águas, baixo */}
      <rect x={x0} y={382} width={128} height={62} fill={wall} {...STROKE} />
      <polygon points={`${x0 - 8},384 ${ax},354 ${x0 + 136},384`} fill={dark} {...STROKE} />
      {/* venezianas de ventilação na empena */}
      <rect x={ax - 9} y={364} width={18} height={14} rx={1} fill="var(--surface)" {...STROKE} strokeWidth={1.1} />
      {[367.5, 371, 374.5].map((y) => (
        <line key={y} x1={ax - 7} x2={ax + 7} y1={y} y2={y} stroke="var(--ls-line)" strokeWidth="1" />
      ))}
      {/* porta de cargas de enrolar */}
      <rect x={x0 + 70} y={402} width={40} height={42} fill={dark} {...STROKE} />
      {[409, 416, 423, 430, 437].map((y) => (
        <line key={y} x1={x0 + 72} x2={x0 + 108} y1={y} y2={y} stroke="var(--ls-line)" strokeWidth="0.9" opacity={0.7} />
      ))}
      {/* venezianas da nave */}
      <rect x={x0 + 14} y={398} width={30} height={16} rx={1} fill="var(--surface)" {...STROKE} strokeWidth={1.1} />
      {[402, 406, 410].map((y) => (
        <line key={y} x1={x0 + 16} x2={x0 + 42} y1={y} y2={y} stroke="var(--ls-line)" strokeWidth="1" />
      ))}
      {/* moega de receção da azeitona e tapete elevador até à nave */}
      <path d={`M${x0 - 46} 408 H${x0 - 14} L${x0 - 22} 424 H${x0 - 38} Z`} fill="var(--ls-steel)" {...STROKE} />
      <path d={`M${x0 - 40} 424 V444 M${x0 - 20} 424 V444`} stroke="var(--ls-line)" strokeWidth="1.5" />
      <path d={`M${x0 - 30} 418 L${x0 + 4} 390`} stroke="var(--ls-line)" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${x0 - 30} 418 L${x0 + 4} 390`} stroke="var(--surface)" strokeWidth="2.2" strokeLinecap="round" />
      {[0.3, 0.55, 0.8].map((t) => (
        <circle key={t} cx={x0 - 44 + 26 * t + 4} cy={410 + 2} r={2.2} fill="var(--ls-canopy)" />
      ))}
    </g>
  );
}

function Deposits({ deposits }: { deposits: Deposit[] }) {
  const top = 372;
  const h = 70;
  return (
    <g>
      {deposits.map((d, i) => {
        const x = 896 + i * 23;
        const lh = h * clamp01(d.fraction);
        return (
          <g key={d.id}>
            <rect x={x} y={top} width={20} height={h} rx={2} fill="var(--ls-steel)" {...STROKE} />
            {lh > 0 && <rect x={x + 1.5} y={top + h - lh} width={17} height={Math.max(0, lh - 1.5)} fill="var(--c-azeite)" opacity="0.85" style={{ transition: 'y 600ms cubic-bezier(0.16,1,0.3,1), height 600ms cubic-bezier(0.16,1,0.3,1)' }} />}
            <ellipse cx={x + 10} cy={top} rx={10} ry={3.2} fill="var(--surface)" {...STROKE} />
          </g>
        );
      })}
    </g>
  );
}

function IbcStack() {
  const cx = LEADER_X[1];
  const cube = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={36} height={36} rx={2} fill="var(--ls-steel)" {...STROKE} />
      <rect x={x + 2} y={y + 5} width={32} height={29} fill="var(--c-azeite)" opacity="0.88" />
      <path d={`M${x + 12} ${y}V${y + 36}M${x + 24} ${y}V${y + 36}M${x} ${y + 18}H${x + 36}`} stroke="var(--ls-line)" strokeWidth="1" />
      <rect x={x + 13} y={y - 4} width={10} height={5} rx={1} fill="var(--surface)" {...STROKE} strokeWidth={1.25} />
    </g>
  );
  return (
    <g>
      <rect x={cx - 41} y={433} width={80} height={9} rx={1} fill="var(--surface)" {...STROKE} />
      {cube(cx - 38, 396)}
      {cube(cx + 0, 396)}
      {cube(cx - 18, 359)}
    </g>
  );
}

function Truck() {
  const ax = LEADER_X[2];
  const x0 = ax - 40;
  const cab = x0 + 70;
  return (
    <g>
      {/* chassis */}
      <rect x={x0 - 2} y={433} width={100} height={4} rx={1} fill="var(--ls-line)" />
      {/* caixa de carga, com as portas de trás */}
      <rect x={x0} y={396} width={66} height={37} rx={2} fill="var(--surface)" {...STROKE} />
      <path d={`M${x0 + 6} 396 V433 M${x0 + 33} 400 V429`} stroke="var(--ls-line)" strokeWidth="1" opacity={0.75} />
      <path d={`M${x0 + 2} 425 H${x0 + 64}`} stroke="var(--ls-line)" strokeWidth="1" opacity={0.5} />
      {/* cabina separada da caixa, com para-brisas inclinado */}
      <path d={`M${cab} 433 V408 Q${cab} 405 ${cab + 3} 405 H${cab + 15} L${cab + 25} 419 V433 Z`} fill="color-mix(in oklab, var(--accent) 22%, var(--surface))" {...STROKE} />
      <path d={`M${cab + 4} 409 H${cab + 14} L${cab + 20} 418 H${cab + 4} Z`} fill="var(--ls-steel)" {...STROKE} strokeWidth={1.1} />
      <path d={`M${cab + 10} 422 H${cab + 15}`} stroke="var(--ls-line)" strokeWidth="1.2" />
      {[x0 + 14, x0 + 50, cab + 15].map((wx) => (
        <circle key={wx} cx={wx} cy={441} r={6} fill="var(--ls-line)" stroke="var(--surface)" strokeWidth="1.5" />
      ))}
    </g>
  );
}
