import { cn } from '../../../lib/cn';

/* =====================================================================
   Ilustrações dos mini-jogos, desenhadas em SVG geométrico com as
   tintas dos mundos. Decorativas (aria-hidden): o texto diz o mesmo.
   ===================================================================== */

const LINE = 'color-mix(in oklab, var(--fg) 62%, var(--surface))';

/** Copo de prova do painel (azul escuro, para esconder a cor) + ramo de oliveira. */
export function PainelArt({ className, letter }: { className?: string; letter?: string }) {
  const glass = 'color-mix(in oklab, var(--c-agua) 48%, var(--rail))';
  return (
    <svg viewBox="0 0 96 96" aria-hidden className={cn('block', className)}>
      {/* ramo */}
      <path d="M58 86 C66 70 72 56 88 44" fill="none" stroke={LINE} strokeWidth="1.75" strokeLinecap="round" />
      {[
        [66, 69, -38],
        [72, 60, 22],
        [78, 53, -42],
        [84, 47, 18],
      ].map(([cx, cy, r], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="8.5" ry="2.6" transform={`rotate(${r} ${cx} ${cy})`} fill="color-mix(in oklab, var(--accent) 30%, var(--surface))" stroke="color-mix(in oklab, var(--accent) 70%, var(--fg))" strokeWidth="1" />
      ))}
      <ellipse cx="70" cy="76" rx="4.2" ry="5.4" transform="rotate(-20 70 76)" fill="var(--c-azeite)" />
      <ellipse cx="78" cy="66" rx="3.8" ry="5" transform="rotate(-24 78 66)" fill="color-mix(in oklab, var(--c-azeite) 70%, var(--fg))" />
      {/* copo */}
      <path d="M22 36 C12 48 11 72 24 82 L48 82 C61 72 60 48 50 36 Z" fill={glass} />
      <path d="M17 58 C17 68 20 75 26 79" fill="none" stroke="color-mix(in oklab, var(--rail-fg) 45%, transparent)" strokeWidth="1.75" strokeLinecap="round" />
      {/* vidro de relógio (tampa) */}
      <ellipse cx="36" cy="35.5" rx="18" ry="3.2" fill="var(--surface)" stroke={LINE} strokeWidth="1.5" />
      {letter && (
        <text x="36" y="66" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="15" fontWeight="600" fill="var(--rail-fg)">
          {letter}
        </text>
      )}
    </svg>
  );
}

/** Garrafa com estratos de água e a nascente por baixo. */
export function RotuloArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden className={cn('block', className)}>
      {/* estratos do aquífero */}
      {[78, 84, 90].map((y, i) => (
        <path key={y} d={`M4 ${y} C24 ${y - 4} 40 ${y + 3} 60 ${y - 1} S84 ${y - 3} 92 ${y}`} fill="none" stroke="var(--c-agua)" strokeOpacity={0.35 + i * 0.2} strokeWidth="1.5" />
      ))}
      {/* garrafa */}
      <path d="M41 8 h14 v8 c0 4 9 8 9 18 v38 c0 4 -3 6 -6 6 H38 c-3 0 -6 -2 -6 -6 V34 c0 -10 9 -14 9 -18 Z" fill="color-mix(in oklab, var(--c-agua) 10%, var(--surface))" stroke={LINE} strokeWidth="1.5" />
      <rect x="40" y="4" width="16" height="6" rx="1.5" fill="var(--c-agua)" />
      {/* água */}
      <path d="M33 40 c5 -2 10 2 15 0 s10 -2 15 0 V72 c0 3 -2 5 -5 5 H38 c-3 0 -5 -2 -5 -5 Z" fill="color-mix(in oklab, var(--c-agua) 32%, var(--surface))" />
      {/* rótulo */}
      <rect x="32" y="48" width="32" height="16" fill="var(--surface)" stroke={LINE} strokeWidth="1" />
      <line x1="36" x2="60" y1="53" y2="53" stroke="var(--c-agua)" strokeWidth="1.5" />
      <line x1="36" x2="54" y1="57.5" y2="57.5" stroke={LINE} strokeWidth="1" />
      <line x1="36" x2="57" y1="60.5" y2="60.5" stroke={LINE} strokeWidth="1" />
      {/* gota */}
      <path d="M78 20 c4 6 6 9 6 12 a6 6 0 0 1 -12 0 c0 -3 2 -6 6 -12 Z" fill="var(--c-agua)" />
    </svg>
  );
}

/** Ramo de cafeeiro com cerejas e uma saca de juta. */
export function CerejaArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden className={cn('block', className)}>
      {/* saca */}
      <path d="M48 40 c-4 -2 -3 -7 2 -7 h28 c5 0 6 5 2 7 c6 6 8 20 6 38 c-1 6 -5 8 -10 8 H52 c-5 0 -9 -2 -10 -8 c-2 -18 0 -32 6 -38 Z" fill="color-mix(in oklab, var(--c-cafe) 16%, var(--surface))" stroke={LINE} strokeWidth="1.5" />
      <path d="M50 41 h28" stroke={LINE} strokeWidth="1.25" />
      {[52, 58, 64, 70].map((y) => (
        <path key={y} d={`M47 ${y} h36`} stroke="color-mix(in oklab, var(--c-cafe) 35%, var(--surface))" strokeWidth="1" strokeDasharray="2 2" />
      ))}
      <text x="65" y="78" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="var(--c-cafe-ink)">
        60 kg
      </text>
      {/* ramo */}
      <path d="M6 30 C20 34 30 44 40 60" fill="none" stroke={LINE} strokeWidth="1.75" strokeLinecap="round" />
      <ellipse cx="18" cy="22" rx="10" ry="4" transform="rotate(-24 18 22)" fill="color-mix(in oklab, var(--accent) 28%, var(--surface))" stroke="color-mix(in oklab, var(--accent) 70%, var(--fg))" strokeWidth="1" />
      <ellipse cx="38" cy="40" rx="10" ry="3.6" transform="rotate(-50 38 40)" fill="color-mix(in oklab, var(--accent) 28%, var(--surface))" stroke="color-mix(in oklab, var(--accent) 70%, var(--fg))" strokeWidth="1" />
      {[
        [20, 38, 1],
        [27, 41, 0.75],
        [24, 48, 1],
        [31, 50, 0.55],
      ].map(([cx, cy, k], i) => (
        <circle key={i} cx={cx} cy={cy} r="4.6" fill={`color-mix(in oklab, var(--c-cafe) ${Math.round(k * 100)}%, var(--c-azeite))`} stroke="color-mix(in oklab, var(--c-cafe) 60%, var(--fg))" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

/** Pictogramas das etapas do café (24 × 24, traço 1,75). */
export function CoffeeStepGlyph({ step, className }: { step: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn('size-5 shrink-0', className)}>
      {step === 'colheita' && (
        <>
          <path d="M4 5c4 1 7 4 9 9" />
          <circle cx="9" cy="14" r="2.6" />
          <circle cx="14.5" cy="17.5" r="2.6" />
          <path d="M13 6c2-2.5 5-3 7-2-1 2-3.5 3-7 2z" />
        </>
      )}
      {step === 'processo' && (
        <>
          <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          <path d="M4 12c2.7-1.5 5.3 1.5 8 0s5.3-1.5 8 0" />
          <path d="M9 4v3M15 4v3" />
        </>
      )}
      {step === 'secagem' && (
        <>
          <path d="M3 20h18M5 20l2-6h10l2 6M9 14l-1 6M15 14l1 6M6 17h12" />
          <circle cx="17" cy="6" r="2.5" />
          <path d="M17 1.5v1M21.5 6h-1M20.2 2.8l-.7.7" />
        </>
      )}
      {step === 'descasque' && (
        <>
          <ellipse cx="12" cy="12" rx="5.5" ry="8" transform="rotate(30 12 12)" />
          <path d="M8.8 17.2c2.2-2 3-4.6 3.4-6.6.4-1.7 1.3-3.2 3-4.3" />
        </>
      )}
      {step === 'ensaque' && (
        <>
          <path d="M8 6c-1.5-.5-1-2.5.5-2.5h7c1.5 0 2 2 .5 2.5 2 2 3 6 2.5 12-.2 1.8-1.5 2.5-3 2.5H8.5c-1.5 0-2.8-.7-3-2.5C5 12 6 8 8 6z" />
          <path d="M8 6h8M7 12h10" />
        </>
      )}
      {step === 'torra' && (
        <>
          <path d="M5 10h12v4a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" />
          <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
          <path d="M9 3c-1 1.5 1 2 0 3.5M13 3c-1 1.5 1 2 0 3.5" />
          <path d="M4 21h14" />
        </>
      )}
    </svg>
  );
}
