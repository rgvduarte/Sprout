import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { OriginSealDef, Producer, Region } from '../../data/types';
import { hashString, createRng } from '../../lib/prng';
import { cn } from '../../lib/cn';
import { date as fmtDate } from '../../lib/format';
import { CommodityGlyphPaths } from '../ui/Commodity';
import { EASE_OUT } from './motion';

/* =====================================================================
   Selo de origem: um selo de lacre por produtor × região × campanha.
   Ganho por compromisso num lote OU por missões de diligência da origem.
   A cor --seal é exclusiva do lacre.
   ===================================================================== */

/** Contorno irregular do lacre, determinístico por id. */
function waxPath(seed: string, r = 50, cx = 60, cy = 60): string {
  const rng = createRng(hashString(seed));
  const n = 30;
  const phase1 = rng.range(0, Math.PI * 2);
  const phase2 = rng.range(0, Math.PI * 2);
  const drips = [rng.int(0, n - 1), rng.int(0, n - 1), rng.int(0, n - 1)];
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    let rr = r + 2.2 * Math.sin(a * 3 + phase1) + 1.4 * Math.sin(a * 7 + phase2) + rng.range(-0.8, 0.8);
    if (drips.includes(i)) rr += rng.range(2.5, 5);
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as const;
  });
  // Catmull-Rom → Bézier fechado
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return `${d} Z`;
}

export interface OriginSealProps {
  seal: OriginSealDef;
  producer: Pick<Producer, 'nome'>;
  region: Pick<Region, 'nome'>;
  state: 'earned' | 'locked';
  /** px */
  size?: number;
  earnedBy?: 'compromisso' | 'diligencia';
  earnedAt?: string;
  /** mostra o nome do produtor e o estado por baixo */
  showCaption?: boolean;
  className?: string;
}

export function OriginSeal({ seal, producer, region, state, size = 112, earnedBy, earnedAt, showCaption, className }: OriginSealProps) {
  const uid = useId().replace(/:/g, '');
  const path = waxPath(seal.id);
  const earned = state === 'earned';
  const rim = `${region.nome.toUpperCase()} · ${seal.campanha}`;
  const label = earned
    ? `Selo de origem ${producer.nome}, ${region.nome}, campanha ${seal.campanha}: ganho${earnedBy ? ` por ${earnedBy === 'compromisso' ? 'compromisso' : 'diligência'}` : ''}${earnedAt ? ` a ${fmtDate(earnedAt)}` : ''}.`
    : `Selo de origem ${producer.nome}, ${region.nome}, campanha ${seal.campanha}: por ganhar.`;

  return (
    <figure className={cn('inline-flex min-w-0 flex-col items-center gap-2', className)} data-world={seal.world}>
      <svg role="img" aria-label={label} viewBox="0 0 120 120" width={size} height={size} className="block shrink-0 overflow-visible">
        <defs>
          <path id={`rim-${uid}`} d="M60,60 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" />
        </defs>
        {earned ? (
          <g>
            <path d={path} fill="var(--seal)" />
            <path d={path} fill="none" stroke="var(--seal-deep)" strokeWidth="1" opacity="0.6" />
            {/* brilho do lacre (material, não decoração) */}
            <path d="M28,40 A38,38 0 0 1 52,22" fill="none" stroke="var(--seal-on)" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
            <circle cx="60" cy="60" r="47" fill="none" stroke="var(--seal-deep)" strokeWidth="1.5" />
            <circle cx="60" cy="60" r="31" fill="none" stroke="var(--seal-deep)" strokeWidth="1.25" />
            <text fontSize="8.2" letterSpacing="1.5" fontFamily="var(--font-display)" fontWeight={700} fill="var(--seal-on)" style={{ fontStretch: '87.5%' }}>
              <textPath href={`#rim-${uid}`} startOffset="50%" textAnchor="middle">
                {rim}
              </textPath>
            </text>
            <text x="60" y="64" textAnchor="middle" fontSize="22" fontFamily="var(--font-display)" fontWeight={700} fill="var(--seal-on)" style={{ fontStretch: '87.5%' }}>
              {seal.initials}
            </text>
            <g transform="translate(53 69) scale(0.58)" fill="none" stroke="var(--seal-on)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <CommodityGlyphPaths world={seal.world} />
            </g>
          </g>
        ) : (
          <g>
            {/* em relevo: o lugar do selo, ainda por ganhar */}
            <path d={path} fill="color-mix(in oklab, var(--fg) 3%, var(--surface))" />
            <path d={path} fill="none" stroke="color-mix(in oklab, var(--fg) 22%, var(--surface))" strokeWidth="1.25" transform="translate(0.6 0.9)" />
            <path d={path} fill="none" stroke="var(--surface)" strokeWidth="1.25" transform="translate(-0.6 -0.9)" />
            <circle cx="60" cy="60" r="47" fill="none" stroke="color-mix(in oklab, var(--fg) 16%, var(--surface))" strokeWidth="1.25" />
            <circle cx="60" cy="60" r="31" fill="none" stroke="color-mix(in oklab, var(--fg) 14%, var(--surface))" strokeWidth="1" />
            <text fontSize="8.2" letterSpacing="1.5" fontFamily="var(--font-display)" fontWeight={700} fill="color-mix(in oklab, var(--fg) 38%, var(--surface))" style={{ fontStretch: '87.5%' }} aria-hidden>
              <textPath href={`#rim-${uid}`} startOffset="50%" textAnchor="middle">
                {rim}
              </textPath>
            </text>
            <text x="60" y="64" textAnchor="middle" fontSize="22" fontFamily="var(--font-display)" fontWeight={700} fill="color-mix(in oklab, var(--fg) 30%, var(--surface))" style={{ fontStretch: '87.5%' }} aria-hidden>
              {seal.initials}
            </text>
          </g>
        )}
      </svg>
      {showCaption && (
        <figcaption className="max-w-[180px] text-center">
          <span className="block text-sm font-medium leading-tight text-fg">{producer.nome}</span>
          <span className="block font-mono text-xs text-muted tnum">
            {region.nome} · {seal.campanha}
          </span>
          <span className={cn('mt-0.5 block text-xs', earned ? 'text-seal-ink' : 'text-muted')}>
            {earned
              ? `Ganho por ${earnedBy === 'diligencia' ? 'diligência' : 'compromisso'}${earnedAt ? ` · ${fmtDate(earnedAt)}` : ''}`
              : seal.earnable === 'diligencia'
                ? `Por ganhar · ${seal.questIds.length} missões`
                : seal.earnable === 'ambos'
                  ? `Por ganhar · compromisso ou ${seal.questIds.length} missões`
                  : 'Por ganhar · compromisso num lote'}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

/* ------------------------------------------------------------ WaxSealStamp */

export interface WaxSealStampProps extends Omit<OriginSealProps, 'state'> {
  /** false: lugar em relevo; true: o lacre é carimbado (anima uma vez) */
  stamped: boolean;
  onStamped?: () => void;
}

/**
 * O carimbo do selo de lacre no ritual de compromisso: o selo cai, assenta
 * com uma pequena compressão e deixa uma marca que se espalha. Uma vez.
 */
export function WaxSealStamp({ stamped, onStamped, size = 128, ...props }: WaxSealStampProps) {
  const reduce = useReducedMotion();
  const [played, setPlayed] = useState(false);
  const first = useRef(stamped);
  useEffect(() => {
    if (stamped && !played) {
      const t = window.setTimeout(() => {
        setPlayed(true);
        onStamped?.();
      }, reduce ? 200 : 650);
      return () => window.clearTimeout(t);
    }
  }, [stamped, played, reduce, onStamped]);
  const animateIn = stamped && !first.current;

  return (
    <div className="relative inline-flex flex-col items-center" style={{ minWidth: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* o lugar em relevo fica por baixo */}
        <div className="absolute inset-0">
          <OriginSeal {...props} showCaption={false} size={size} state="locked" />
        </div>
        <AnimatePresence>
          {stamped && (
            <motion.div
              key="wax"
              className="absolute inset-0"
              initial={animateIn ? (reduce ? { opacity: 0 } : { opacity: 0, scale: 1.45, rotate: -10, y: -14 }) : false}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: [1.45, 0.96, 1], rotate: [-10, 1, 0], y: [-14, 0, 0] }}
              transition={reduce ? { duration: 0.2 } : { duration: 0.52, times: [0, 0.78, 1], ease: EASE_OUT }}
            >
              <OriginSeal {...props} showCaption={false} size={size} state="earned" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* marca do carimbo */}
        {stamped && animateIn && !reduce && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-seal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 0.55, 0], scale: [0.9, 1.05, 1.3] }}
            transition={{ duration: 0.6, delay: 0.38, ease: EASE_OUT }}
          />
        )}
      </div>
      {props.showCaption && (
        <p className="mt-2 max-w-[200px] text-center">
          <span className="block text-sm font-medium leading-tight text-fg">{props.producer.nome}</span>
          <span className="block font-mono text-xs text-muted tnum">
            {props.region.nome} · {props.seal.campanha}
          </span>
        </p>
      )}
      <span className="sr-only" aria-live="polite">
        {stamped ? `Selo de lacre aplicado: ${props.producer.nome}, ${props.seal.campanha}.` : ''}
      </span>
    </div>
  );
}
