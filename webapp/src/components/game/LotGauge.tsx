import { useEffect, useId, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import type { GaugeKind, WorldId } from '../../data/types';
import { cn } from '../../lib/cn';
import { EASE_OUT } from './motion';

/* =====================================================================
   LotGauge · o gesto-assinatura do produto. Cada lote mostra a sua
   mercadoria física a encher: um IBC de 1 000 kg (azeite), uma palete de
   packs de água, uma pilha de sacas de café.
   ===================================================================== */

const KIND_BY_WORLD: Record<WorldId, GaugeKind> = { azeite: 'ibc', agua: 'pallet', cafe: 'sacks' };
const WORLD_BY_KIND: Record<GaugeKind, WorldId> = { ibc: 'azeite', pallet: 'agua', sacks: 'cafe' };

const SIZE_PX = { xs: 40, sm: 64, md: 128, lg: 240, xl: 320 } as const;

export interface LotGaugeProps {
  /** tipo de mercadoria: 'ibc' | 'pallet' | 'sacks' ou o mundo */
  kind: GaugeKind | WorldId;
  /** 0–1: fração cheia (financiamento ou stock) */
  value: number;
  /** fatia destacada [de, até] em 0–1 (p.ex. o compromisso acabado de fazer) */
  highlight?: [number, number];
  size?: keyof typeof SIZE_PX;
  /** nome acessível, p.ex. "Financiamento do lote AZ-2026-021" */
  label: string;
  /** texto do valor para leitores de ecrã (por omissão "60 %") */
  valueText?: string;
  /** progresso ligado ao scroll (substitui `value` no desenho) */
  progress?: MotionValue<number>;
  /** enche a partir de 0 ao montar (momento focal) */
  animateOnMount?: boolean;
  /** graduações impressas (por omissão em lg/xl) */
  showScale?: boolean;
  caption?: ReactNode;
  className?: string;
}

function resolveKind(kind: GaugeKind | WorldId): GaugeKind {
  return kind in KIND_BY_WORLD ? KIND_BY_WORLD[kind as WorldId] : (kind as GaugeKind);
}

/** Valor animado: segue `value` (com transição) ou `progress` (scroll). */
function useFill(value: number, progress: MotionValue<number> | undefined, animateOnMount: boolean): MotionValue<number> {
  const reduce = useReducedMotion();
  const mv = useMotionValue(animateOnMount && !reduce ? 0 : value);
  useEffect(() => {
    if (progress) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration: 0.8, ease: EASE_OUT });
    return () => c.stop();
  }, [value, reduce, mv, progress]);
  const clamped = useTransform(progress ?? mv, (v) => Math.max(0, Math.min(1, v)));
  return clamped;
}

export function LotGauge({ kind, value, highlight, size = 'md', label, valueText, progress, animateOnMount = false, showScale, caption, className }: LotGaugeProps) {
  const k = resolveKind(kind);
  const world = WORLD_BY_KIND[k];
  const fill = useFill(value, progress, animateOnMount);
  const px = SIZE_PX[size];
  const scale = showScale ?? (size === 'lg' || size === 'xl');
  const text = valueText ?? `${Math.round(Math.max(0, Math.min(1, value)) * 100)} %`;
  const vbW = k === 'ibc' && scale ? 214 : 200;
  return (
    <figure className={cn('inline-flex min-w-0 flex-col items-center gap-2', className)} data-world={world}>
      <svg role="img" aria-label={`${label}: ${text}`} viewBox={`0 0 ${vbW} 224`} width={(px * vbW) / 200} height={(px * 224) / 200} className="block h-auto max-w-full overflow-visible">
        {k === 'ibc' && <IbcTank fill={fill} highlight={highlight} scale={scale} detail={size !== 'xs' && size !== 'sm'} />}
        {k === 'pallet' && <PalletStack fill={fill} highlight={highlight} detail={size !== 'xs'} />}
        {k === 'sacks' && <SackStack fill={fill} highlight={highlight} detail={size !== 'xs'} />}
      </svg>
      {caption && <figcaption className="text-center text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

/* ------------------------------------------------------------ peças comuns */

const INK = 'var(--world-ink)';
const BODY = 'var(--world)';
const LINE = 'color-mix(in oklab, var(--fg) 55%, var(--surface))';
const FAINT = 'color-mix(in oklab, var(--fg) 14%, var(--surface))';

function PalletBase() {
  return (
    <g>
      <rect x="8" y="198" width="184" height="7" rx="1" fill="var(--surface)" stroke={LINE} strokeWidth="1.5" />
      {[12, 85, 158].map((x) => (
        <rect key={x} x={x} y="205" width="30" height="11" rx="1" fill="var(--surface)" stroke={LINE} strokeWidth="1.5" />
      ))}
    </g>
  );
}

function HatchDefs({ id }: { id: string }) {
  return (
    <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="7" height="7" fill={BODY} />
      <line x1="0" y1="0" x2="0" y2="7" stroke={INK} strokeWidth="3" />
    </pattern>
  );
}

/* ------------------------------------------------------------ IBC */

const TANK = { x: 24, y: 30, w: 152, h: 162 };

function IbcTank({ fill, highlight, scale, detail }: { fill: MotionValue<number>; highlight?: [number, number]; scale: boolean; detail: boolean }) {
  const uid = useId().replace(/:/g, '');
  const levelY = useTransform(fill, (v) => TANK.y + TANK.h * (1 - v));
  const reduce = useReducedMotion();
  const hl = highlight ? [Math.max(0, highlight[0]), Math.min(1, highlight[1])] : null;
  return (
    <g>
      <defs>
        <clipPath id={`tank-${uid}`}>
          <rect x={TANK.x} y={TANK.y} width={TANK.w} height={TANK.h} rx="10" />
        </clipPath>
        <HatchDefs id={`hatch-${uid}`} />
      </defs>
      <PalletBase />
      {/* depósito interior (HDPE translúcido) */}
      <rect x={TANK.x} y={TANK.y} width={TANK.w} height={TANK.h} rx="10" fill="color-mix(in oklab, var(--fg) 4%, var(--surface))" stroke={LINE} strokeWidth="1.25" />
      <g clipPath={`url(#tank-${uid})`}>
        {/* líquido */}
        <motion.rect x={TANK.x} width={TANK.w} height={TANK.h + 4} fill={BODY} style={{ y: levelY }} opacity={0.9} />
        {/* menisco */}
        <motion.line x1={TANK.x} x2={TANK.x + TANK.w} stroke="color-mix(in oklab, var(--world) 55%, var(--surface))" strokeWidth="2" style={{ y: levelY }} y1={0} y2={0} />
        {hl && (
          <motion.rect
            x={TANK.x}
            width={TANK.w}
            fill={`url(#hatch-${uid})`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            y={TANK.y + TANK.h * (1 - hl[1])}
            height={Math.max(0, TANK.h * (hl[1] - hl[0]))}
          />
        )}
      </g>
      {/* graduações impressas no IBC */}
      {detail &&
        Array.from({ length: 9 }, (_, i) => (i + 1) / 10).map((t) => {
          const y = TANK.y + TANK.h * (1 - t);
          const major = Math.abs(t - 0.5) < 0.001 || Math.abs(t - 0.25) < 0.001 || Math.abs(t - 0.75) < 0.001;
          return <line key={t} x1={TANK.x + 4} x2={TANK.x + (major ? 16 : 10)} y1={y} y2={y} stroke={LINE} strokeWidth="1.25" />;
        })}
      {scale &&
        [0.25, 0.5, 0.75].map((t) => {
          const y = TANK.y + TANK.h * (1 - t);
          return (
            <g key={t}>
              <line x1="186" x2="191" y1={y} y2={y} stroke={LINE} strokeWidth="1.25" />
              <text x="194" y={y + 4} fontSize="11" fontFamily="var(--font-mono)" fill="var(--muted)">
                {Math.round(t * 100)}
              </text>
            </g>
          );
        })}
      {/* grade metálica */}
      <rect x="16" y="22" width="168" height="176" rx="3" fill="none" stroke={LINE} strokeWidth="2.25" />
      {detail && (
        <g stroke={LINE} strokeWidth="1.5">
          {[44, 72, 100, 128, 156].map((x) => (
            <line key={x} x1={x} y1="22" x2={x} y2="198" />
          ))}
          {[66, 110, 154].map((y) => (
            <line key={y} x1="16" y1={y} x2="184" y2={y} />
          ))}
        </g>
      )}
      {/* tampa e válvula */}
      <rect x="86" y="12" width="28" height="12" rx="2" fill="var(--surface)" stroke={LINE} strokeWidth="1.5" />
      <rect x="90" y="186" width="20" height="12" rx="2" fill="var(--surface)" stroke={LINE} strokeWidth="1.5" />
      <circle cx="100" cy="192" r="2.5" fill={LINE} />
    </g>
  );
}

/* ------------------------------------------------------------ discretos */

/** Converte o MotionValue em contagem inteira de unidades cheias (só re-renderiza quando muda). */
function useCount(fill: MotionValue<number>, total: number): number {
  const [count, setCount] = useState(() => Math.round(fill.get() * total));
  useMotionValueEvent(fill, 'change', (v) => {
    const c = Math.round(v * total);
    setCount((prev) => (prev === c ? prev : c));
  });
  return count;
}

const PACK = { cols: 4, rows: 5, w: 42, h: 33, gapX: 3, gapY: 3, x0: 12, yBottom: 196 };

function PalletStack({ fill, highlight, detail }: { fill: MotionValue<number>; highlight?: [number, number]; detail: boolean }) {
  const uid = useId().replace(/:/g, '');
  const total = PACK.cols * PACK.rows;
  const count = useCount(fill, total);
  const reduce = useReducedMotion();
  const hlFrom = highlight ? Math.round(highlight[0] * total) : -1;
  const hlTo = highlight ? Math.round(highlight[1] * total) : -1;
  return (
    <g>
      <defs>
        <HatchDefs id={`hatch-${uid}`} />
      </defs>
      <PalletBase />
      {Array.from({ length: total }, (_, i) => {
        const row = Math.floor(i / PACK.cols);
        const col = i % PACK.cols;
        const x = PACK.x0 + col * (PACK.w + PACK.gapX);
        const y = PACK.yBottom - (row + 1) * (PACK.h + PACK.gapY) + PACK.gapY;
        const filled = i < count;
        const hl = i >= hlFrom && i < hlTo;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={PACK.w}
              height={PACK.h}
              rx="3"
              fill={filled ? (hl ? `url(#hatch-${uid})` : BODY) : 'none'}
              stroke={filled ? INK : FAINT}
              strokeWidth={filled ? 1 : 1.25}
              style={{ transition: reduce ? undefined : 'fill 300ms cubic-bezier(0.16, 1, 0.3, 1), stroke 300ms' }}
            />
            {detail && filled && (
              <g stroke="color-mix(in oklab, var(--world) 45%, var(--surface))" strokeWidth="1.25">
                {/* três tampas visíveis e cinta do filme */}
                {[0.22, 0.5, 0.78].map((t) => (
                  <line key={t} x1={x + PACK.w * t} x2={x + PACK.w * t} y1={y + 4} y2={y + 10} />
                ))}
                <line x1={x + 3} x2={x + PACK.w - 3} y1={y + PACK.h * 0.62} y2={y + PACK.h * 0.62} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

const SACK = { w: 34, h: 38 };
const SACK_ROWS = [5, 4, 4, 3, 2];

function sackPath(x: number, y: number) {
  const { w, h } = SACK;
  return `M${x + 4} ${y + 7} Q${x + 1} ${y + h / 2} ${x + 4} ${y + h - 3} Q${x + w / 2} ${y + h + 1} ${x + w - 4} ${y + h - 3} Q${x + w - 1} ${y + h / 2} ${x + w - 4} ${y + 7} L${x + w - 7} ${y + 2} L${x + w / 2 + 3} ${y + 6} L${x + w / 2 - 3} ${y + 6} L${x + 7} ${y + 2} Z`;
}

function SackStack({ fill, highlight, detail }: { fill: MotionValue<number>; highlight?: [number, number]; detail: boolean }) {
  const uid = useId().replace(/:/g, '');
  const positions: { x: number; y: number }[] = [];
  SACK_ROWS.forEach((n, row) => {
    const width = n * SACK.w + (n - 1) * 2;
    const x0 = 100 - width / 2;
    for (let c = 0; c < n; c++) positions.push({ x: x0 + c * (SACK.w + 2), y: 196 - (row + 1) * (SACK.h - 2) });
  });
  const total = positions.length;
  const count = useCount(fill, total);
  const hlFrom = highlight ? Math.round(highlight[0] * total) : -1;
  const hlTo = highlight ? Math.round(highlight[1] * total) : -1;
  return (
    <g>
      <defs>
        <HatchDefs id={`hatch-${uid}`} />
      </defs>
      <PalletBase />
      {positions.map((p, i) => {
        const filled = i < count;
        const hl = i >= hlFrom && i < hlTo;
        return (
          <g key={i}>
            <path d={sackPath(p.x, p.y)} fill={filled ? (hl ? `url(#hatch-${uid})` : BODY) : 'none'} stroke={filled ? INK : FAINT} strokeWidth={filled ? 1 : 1.25} strokeLinejoin="round" />
            {detail && filled && <line x1={p.x + 9} x2={p.x + SACK.w - 9} y1={p.y + SACK.h * 0.55} y2={p.y + SACK.h * 0.55} stroke="color-mix(in oklab, var(--world) 40%, var(--surface))" strokeWidth="2" />}
          </g>
        );
      })}
    </g>
  );
}
