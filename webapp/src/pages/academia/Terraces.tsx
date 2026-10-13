import { useEffect, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LEVELS, TOTAL_KNOWLEDGE_POINTS } from '../../data';
import { LevelGlyph } from '../../components/game';
import { cn } from '../../lib/cn';
import { num } from '../../lib/format';

/* =====================================================================
   Socalcos do conhecimento. Cada socalco é um nível; as oliveiras
   plantam-se à medida que se ganham pontos de conhecimento. É o
   momento focal da Academia: ao ganhar pontos, as árvores novas crescem.
   ===================================================================== */

const VB_W = 640;
const VB_H = 250;
const COL_W = 152;
const X0 = 16;
const TREES = 12; // 6 colunas × 2 filas por socalco
const surfaceY = (i: number) => 196 - 46 * i;
const colX = (i: number) => X0 + i * COL_W;

/** Árvores plantadas em cada socalco, de 0 a 12. */
function treesPerTerrace(points: number): number[] {
  return LEVELS.map((l, i) => {
    const next = LEVELS[i + 1]?.minPoints ?? TOTAL_KNOWLEDGE_POINTS;
    const span = next - l.minPoints;
    const f = Math.max(0, Math.min(1, (points - l.minPoints) / span));
    return Math.round(f * TREES);
  });
}

function treePos(terrace: number, k: number) {
  const col = Math.floor(k / 2);
  const back = k % 2 === 1;
  const left = colX(terrace) + (terrace === 0 ? 14 : 22);
  const step = (COL_W - 34) / 6;
  return { x: left + col * step + (back ? step / 2 : 4), y: surfaceY(terrace) - (back ? 21 : 9), r: back ? 6 : 7.5, back };
}

export function Terraces({ points, className }: { points: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const trees = treesPerTerrace(points);
  const levelIdx = LEVELS.reduce((acc, l, i) => (points >= l.minPoints ? i : acc), 0);
  const total = trees.reduce((s, n) => s + n, 0);
  const prevTotal = useRef<number | null>(null);
  const mounted = prevTotal.current === null;
  const grownFrom = prevTotal.current ?? 0;
  useEffect(() => {
    prevTotal.current = total;
  }, [total]);

  // posição do marcador no socalco atual
  const cur = LEVELS[levelIdx];
  const nextMin = LEVELS[levelIdx + 1]?.minPoints ?? TOTAL_KNOWLEDGE_POINTS;
  const frac = Math.max(0, Math.min(1, (points - cur.minPoints) / (nextMin - cur.minPoints)));
  const markerX = colX(levelIdx) + 26 + frac * (COL_W - 46);
  const markerY = surfaceY(levelIdx);

  const hill = `M0,${VB_H - 12} L0,${surfaceY(0) + 14} L${X0},${surfaceY(0)} ${LEVELS.map((_, i) => (i === 0 ? '' : `L${colX(i)},${surfaceY(i - 1)} L${colX(i)},${surfaceY(i)}`)).join(' ')} L${colX(4)},${surfaceY(3)} L${VB_W},${surfaceY(3) + 10} L${VB_W},${VB_H - 12} Z`;

  const nextLabel = LEVELS[levelIdx + 1];
  const summary = `Socalcos do conhecimento: nível ${cur.nome}, ${num(points)} pontos de ${num(TOTAL_KNOWLEDGE_POINTS)}.${nextLabel ? ` Faltam ${num(nextLabel.minPoints - points)} pontos para ${nextLabel.nome}.` : ''}`;

  let gi = -1;
  return (
    <figure className={cn('min-w-0', className)}>
      <svg role="img" aria-label={summary} viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-auto w-full overflow-visible">
        <defs>
          <clipPath id={`hill-${uid}`}>
            <path d={hill} />
          </clipPath>
        </defs>
        {/* corpo da encosta */}
        <path d={hill} fill="color-mix(in oklab, var(--accent) 7%, var(--surface-2))" />
        {/* curvas de nível (decorativas) */}
        <g clipPath={`url(#hill-${uid})`} fill="none" stroke="color-mix(in oklab, var(--fg) 13%, var(--surface-2))" strokeWidth="1">
          <path d="M-10,226 C110,214 210,232 330,220 S540,204 660,214" />
          <path d="M120,214 C220,196 300,214 410,198 S560,176 660,186" />
          <path d="M260,196 C340,176 420,192 500,170 S600,148 660,156" />
          <path d="M400,168 C450,150 520,160 560,134 S620,112 660,118" />
        </g>
        {/* superfícies e muros de xisto */}
        {LEVELS.map((l, i) => {
          const x = colX(i);
          const y = surfaceY(i);
          const reached = points >= l.minPoints;
          return (
            <g key={l.id}>
              <rect x={i === 0 ? X0 : x} y={y} width={COL_W + (i === 3 ? 0 : 0)} height={7} fill={reached ? 'color-mix(in oklab, var(--accent) 22%, var(--surface-2))' : 'color-mix(in oklab, var(--fg) 8%, var(--surface-2))'} />
              <line x1={i === 0 ? X0 : x} x2={x + COL_W} y1={y} y2={y} stroke="color-mix(in oklab, var(--fg) 45%, var(--surface))" strokeWidth="1.25" />
              {i > 0 && <SchistWall x={x} top={y} bottom={surfaceY(i - 1)} />}
            </g>
          );
        })}
        {/* oliveiras */}
        {LEVELS.map((l, i) =>
          Array.from({ length: TREES }, (_, k) => {
            const p = treePos(i, k);
            const on = k < trees[i];
            if (on) gi += 1;
            const order = gi;
            const grow = on && !reduce && (mounted || order >= grownFrom);
            const delay = mounted ? order * 0.018 : Math.max(0, order - grownFrom) * 0.06;
            return on ? (
              <motion.g
                key={`${l.id}-${k}-on`}
                initial={grow ? { scale: 0.2, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: mounted ? 0.5 : 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              >
                <line x1={p.x} x2={p.x} y1={p.y + p.r - 1} y2={p.y + p.r + (p.back ? 3 : 5)} stroke="color-mix(in oklab, var(--fg) 55%, var(--surface))" strokeWidth="1.5" />
                <circle cx={p.x} cy={p.y} r={p.r} fill={p.back ? 'color-mix(in oklab, var(--accent) 78%, var(--surface))' : 'var(--accent)'} />
              </motion.g>
            ) : (
              <g key={`${l.id}-${k}-off`}>
                <circle cx={p.x} cy={p.y + p.r - 1.5} r={1.6} fill="color-mix(in oklab, var(--fg) 30%, var(--surface))" />
                <circle cx={p.x} cy={p.y} r={p.r - 1} fill="none" stroke="color-mix(in oklab, var(--fg) 24%, var(--surface))" strokeWidth="1" strokeDasharray="2 2.4" />
              </g>
            );
          }),
        )}
        {/* marcador: estás aqui */}
        <motion.g
          initial={false}
          animate={{ x: markerX, y: markerY }}
          transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <line x1={0} x2={0} y1={-2} y2={-52} stroke="var(--fg)" strokeWidth="1.75" />
          <path d="M0,-52 L22,-45 L0,-38 Z" fill="var(--fg)" />
          <circle cx={0} cy={-1} r={3} fill="var(--fg)" />
        </motion.g>
      </svg>
      <ol className="mt-2 grid grid-cols-4 gap-2" style={{ paddingInline: `${(X0 / VB_W) * 100}%` }} aria-label="Níveis de conhecimento">
        {LEVELS.map((l, i) => {
          const state = i < levelIdx ? 'feito' : i === levelIdx ? 'atual' : 'por-alcancar';
          return (
            <li key={l.id} className="min-w-0" aria-current={state === 'atual' ? 'step' : undefined}>
              <span className={cn('flex items-center gap-1.5 text-sm font-medium leading-tight', state === 'por-alcancar' ? 'text-muted' : 'text-fg')}>
                <LevelGlyph level={l.id} className={cn('hidden size-4 sm:block', state === 'por-alcancar' ? 'text-muted' : 'text-accent')} />
                {l.nome}
              </span>
              <span className="mt-0.5 block font-mono text-xs text-muted tnum">
                {num(l.minPoints)} pts{state === 'feito' && ' · feito'}
                {state === 'atual' && ' · aqui'}
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

/** Muro de pedra seca: fiadas de xisto entre dois socalcos. */
function SchistWall({ x, top, bottom }: { x: number; top: number; bottom: number }) {
  const w = 10;
  const rows: number[] = [];
  for (let y = top + 6; y < bottom; y += 6) rows.push(y);
  return (
    <g>
      <rect x={x} y={top} width={w} height={bottom - top} fill="color-mix(in oklab, var(--fg) 16%, var(--surface-2))" />
      {rows.map((y, r) => (
        <g key={y} stroke="color-mix(in oklab, var(--fg) 34%, var(--surface-2))" strokeWidth="0.9">
          <line x1={x} x2={x + w} y1={y} y2={y} />
          <line x1={x + (r % 2 ? 3 : 6.5)} x2={x + (r % 2 ? 3 : 6.5)} y1={y - 6} y2={y} />
        </g>
      ))}
      <line x1={x} x2={x} y1={top} y2={bottom} stroke="color-mix(in oklab, var(--fg) 45%, var(--surface))" strokeWidth="1.25" />
    </g>
  );
}
