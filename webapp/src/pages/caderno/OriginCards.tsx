import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { getWorld } from '../../data';
import type { WorldId } from '../../data/types';
import { Button, CommodityGlyph, TextLink } from '../../components/ui';
import { EASE_OUT } from '../../components/game';
import { createRng } from '../../lib/prng';
import { cn } from '../../lib/cn';
import type { CardView } from './model';

/* =====================================================================
   Cartas de origem: uma por lote acompanhado, com dados reais do boletim.
   Viram-se para mostrar a ficha. Pessoais e intransmissíveis: não se
   vendem, não se trocam, não valem dinheiro.
   ===================================================================== */

/* ------------------------------------------------------------ ilustrações */

function OliveArt({ seed }: { seed: string }) {
  const rng = createRng(seed);
  const trees: { x: number; y: number; r: number }[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      const x = 10 + col * 15 + (row % 2) * 7 + rng.range(-1.6, 1.6);
      const y = 22 + row * 14 + Math.sin((x / 160) * Math.PI * 1.4) * 5 + rng.range(-1.2, 1.2);
      if (x > 104 && y > 58) continue;
      trees.push({ x, y, r: rng.range(2.3, 3.1) });
    }
  }
  return (
    <>
      <rect width="160" height="110" fill="color-mix(in oklab, var(--world) 9%, var(--surface))" />
      {[16, 44, 72, 100].map((y, i) => (
        <path key={y} d={`M0 ${y} C 40 ${y - 9 + i}, 90 ${y + 9}, 160 ${y - 5}`} fill="none" stroke="var(--world-line)" strokeWidth="1" />
      ))}
      {trees.map((t, i) => (
        <circle key={i} cx={t.x} cy={t.y} r={t.r} fill="var(--world)" opacity={0.88} />
      ))}
      {/* IBC de 1 000 kg na grade, sobre palete */}
      <g transform="translate(116 64)">
        <rect x="0" y="0" width="34" height="32" fill="var(--surface)" stroke="var(--world-ink)" strokeWidth="1.25" />
        <rect x="1.5" y="9" width="31" height="21.5" fill="var(--world)" opacity="0.8" />
        {[11.3, 22.6].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="32" stroke="var(--world-ink)" strokeWidth="0.9" />
        ))}
        {[10.6, 21.3].map((y) => (
          <line key={y} x1="0" y1={y} x2="34" y2={y} stroke="var(--world-ink)" strokeWidth="0.9" />
        ))}
        <rect x="-1" y="32" width="36" height="4" fill="var(--world-ink)" />
      </g>
    </>
  );
}

function WaterArt({ seed }: { seed: string }) {
  const rng = createRng(seed);
  const bands = [40, 57, 74, 91];
  const pores = Array.from({ length: 26 }, () => ({ x: rng.range(4, 156), y: rng.range(62, 106), r: rng.range(0.8, 1.6) }));
  return (
    <>
      <rect width="160" height="110" fill="var(--surface)" />
      {bands.map((y, i) => (
        <path
          key={y}
          d={`M0 ${y} C 40 ${y - 4 + rng.range(-2, 2)}, 100 ${y + 5}, 160 ${y - 2} L160 110 L0 110 Z`}
          fill={`color-mix(in oklab, var(--world) ${14 + i * 11}%, var(--surface))`}
          stroke="var(--world-line)"
          strokeWidth="0.8"
        />
      ))}
      {pores.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="var(--surface)" opacity="0.75" />
      ))}
      {/* captação */}
      <line x1="34" y1="104" x2="34" y2="33" stroke="var(--world-ink)" strokeWidth="2" />
      <rect x="29" y="28" width="10" height="5" fill="var(--world-ink)" />
      {/* garrafa de 1,5 L */}
      <g transform="translate(104 4)">
        <path d="M12 0 h8 v5 c0 2 5 4 5 9 v19 c0 2 -1 3 -3 3 h-12 c-2 0 -3 -1 -3 -3 v-19 c0 -5 5 -7 5 -9 z" fill="var(--surface)" stroke="var(--world-ink)" strokeWidth="1.2" />
        <path d="M8 17 h16 v16 c0 2 -1 2.5 -2.5 2.5 h-11 c-1.5 0 -2.5 -0.5 -2.5 -2.5 z" fill="var(--world)" opacity="0.7" />
      </g>
      <g transform="translate(128 12)">
        <path d="M9 0 h6 v4 c0 2 4 3 4 7 v15 c0 2 -1 2.5 -2.5 2.5 h-9 c-1.5 0 -2.5 -0.5 -2.5 -2.5 v-15 c0 -4 4 -5 4 -7 z" fill="var(--surface)" stroke="var(--world-ink)" strokeWidth="1.1" />
        <path d="M6 13 h12 v13 c0 1.5 -1 2 -2 2 h-8 c-1 0 -2 -0.5 -2 -2 z" fill="var(--world)" opacity="0.7" />
      </g>
    </>
  );
}

function CoffeeArt({ seed }: { seed: string }) {
  const rng = createRng(seed);
  const clusters = Array.from({ length: 9 }, (_, i) => ({ x: 14 + i * 11 + rng.range(-3, 3), y: 30 + Math.sin(i * 0.8) * 10 + rng.range(-3, 3) }));
  return (
    <>
      <rect width="160" height="110" fill="var(--surface)" />
      <path d="M-10 110 C 30 40, 90 40, 130 110 Z" fill="color-mix(in oklab, var(--world) 12%, var(--surface))" />
      <path d="M50 110 C 90 54, 150 50, 180 110 Z" fill="color-mix(in oklab, var(--world) 20%, var(--surface))" />
      {[70, 80, 90, 100].map((y) => (
        <path key={y} d={`M${(110 - y) * 0.9 + 4} ${y} Q 60 ${y - 14}, ${118 - (110 - y) * 0.6} ${y}`} fill="none" stroke="var(--world-line)" strokeWidth="1" />
      ))}
      {/* ramo com cerejas */}
      <path d="M4 26 C 40 18, 80 40, 112 24" fill="none" stroke="var(--world-ink)" strokeWidth="1.4" />
      {clusters.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y + 4} r="3.3" fill="var(--world)" />
          <circle cx={c.x + 5} cy={c.y + 6} r="3.3" fill="var(--world)" opacity="0.75" />
        </g>
      ))}
      {/* saca de 60 kg */}
      <g transform="translate(118 62)">
        <path d="M6 6 C 2 14, 0 28, 3 40 h28 c3 -12 1 -26 -3 -34 z" fill="color-mix(in oklab, var(--world) 32%, var(--surface))" stroke="var(--world-ink)" strokeWidth="1.2" />
        <path d="M6 6 c 4 -4 18 -4 22 0" fill="none" stroke="var(--world-ink)" strokeWidth="1.2" />
        <path d="M12 3 l5 4 l5 -4" fill="none" stroke="var(--world-ink)" strokeWidth="1.2" />
        <line x1="8" y1="22" x2="26" y2="22" stroke="var(--world-ink)" strokeWidth="0.8" strokeDasharray="2 2" />
      </g>
    </>
  );
}

export function CardArt({ world, seed, className, muted }: { world: WorldId; seed: string; className?: string; muted?: boolean }) {
  return (
    <svg viewBox="0 0 160 110" className={cn('block h-auto w-full', muted && 'opacity-45 grayscale', className)} aria-hidden data-world={world}>
      {world === 'azeite' && <OliveArt seed={seed} />}
      {world === 'agua' && <WaterArt seed={seed} />}
      {world === 'cafe' && <CoffeeArt seed={seed} />}
    </svg>
  );
}

/* ------------------------------------------------------------ carta */

const STATE_TEXT: Record<CardView['state'], string> = {
  participado: 'Co-financias este lote',
  estudado: 'Leste o boletim de análises',
  bloqueado: 'Por desbloquear',
};

function Front({ card }: { card: CardView }) {
  const { lot, producer, region } = card;
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-world-line bg-surface">
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <span className="inline-flex min-w-0 items-center gap-1 truncate text-xs font-medium text-world-ink">
          <CommodityGlyph world={lot.world} className="size-3.5" />
          {getWorld(lot.world).nome}
        </span>
        <span className="font-mono text-xs text-muted tnum">
          {String(card.n).padStart(2, '0')}/{String(card.of).padStart(2, '0')}
        </span>
      </div>
      <div className="mx-3 mt-2 overflow-hidden rounded-sm border border-world-line">
        <CardArt world={lot.world} seed={lot.id} />
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <p className="font-mono text-sm text-fg tnum">{lot.id}</p>
        <p className="mt-0.5 font-display text-[1.0625rem] font-semibold leading-tight text-fg" style={{ fontStretch: '87.5%' }}>
          {producer.nome}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {region.nome} · {lot.campanha}
        </p>
        <p className="mt-auto pt-2 text-xs font-medium text-world-ink">{STATE_TEXT[card.state]}</p>
      </div>
    </div>
  );
}

function Back({ card }: { card: CardView }) {
  return (
    <div className="flex h-full flex-col rounded-md border border-world-line bg-world-soft px-3 py-2.5">
      <p className="flex items-center justify-between gap-2 text-xs text-world-ink">
        <span className="whitespace-nowrap font-mono tnum">{card.lot.id}</span>
        <span className="font-medium">Ficha</span>
      </p>
      <dl className="mt-2 flex flex-col gap-1.5">
        {card.stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-xs text-world-ink">{s.label}</dt>
            <dd className={cn('truncate text-sm leading-snug text-fg', s.mono && 'font-mono tnum')} title={s.value}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
      <TextLink to={`/lote/${card.lot.id}`} className="mt-auto pt-2 text-sm">
        Abrir o lote
      </TextLink>
    </div>
  );
}

function FlipCard({ card }: { card: CardView }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  const label = `Carta ${card.lot.id}, ${card.producer.nome}`;
  return (
    <div className="flex h-full min-w-0 flex-col" data-world={card.lot.world}>
      <div className="flex-1 [perspective:1100px]">
        {reduce ? (
          <div className="grid h-full">
            <div className={cn('[grid-area:1/1] transition-opacity duration-150', flipped ? 'pointer-events-none opacity-0' : 'opacity-100')} inert={flipped} aria-hidden={flipped}>
              <Front card={card} />
            </div>
            <div className={cn('[grid-area:1/1] transition-opacity duration-150', flipped ? 'opacity-100' : 'pointer-events-none opacity-0')} inert={!flipped} aria-hidden={!flipped}>
              <Back card={card} />
            </div>
          </div>
        ) : (
          <motion.div
            className="grid h-full [transform-style:preserve-3d]"
            initial={false}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a')) return;
              setFlipped((f) => !f);
            }}
          >
            <div className="[backface-visibility:hidden] [grid-area:1/1]" style={{ WebkitBackfaceVisibility: 'hidden' }} inert={flipped} aria-hidden={flipped}>
              <Front card={card} />
            </div>
            <div className="[backface-visibility:hidden] [grid-area:1/1] [transform:rotateY(180deg)]" style={{ WebkitBackfaceVisibility: 'hidden' }} inert={!flipped} aria-hidden={!flipped}>
              <Back card={card} />
            </div>
          </motion.div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 w-full"
        aria-pressed={flipped}
        aria-label={flipped ? `${label}: ver a frente` : `${label}: ver a ficha`}
        iconLeft={<RotateCcw aria-hidden className="size-4" strokeWidth={1.75} />}
        onClick={() => setFlipped((f) => !f)}
      >
        {flipped ? 'Ver a frente' : 'Ver a ficha'}
      </Button>
    </div>
  );
}

function LockedCard({ card }: { card: CardView }) {
  const { lot, producer } = card;
  return (
    <div className="flex h-full min-w-0 flex-col" data-world={lot.world}>
      <div className="flex flex-1 flex-col rounded-md border border-dashed border-[color-mix(in_oklab,var(--fg)_26%,var(--border))] bg-surface p-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <CommodityGlyph world={lot.world} className="size-3.5" />
            Por ganhar
          </span>
          <span className="font-mono tnum">
            {String(card.n).padStart(2, '0')}/{String(card.of).padStart(2, '0')}
          </span>
        </div>
        <div className="mt-2 overflow-hidden rounded-sm border border-border">
          <CardArt world={lot.world} seed={lot.id} muted />
        </div>
        <p className="mt-2.5 font-mono text-sm text-fg tnum">{lot.id}</p>
        <p className="mt-0.5 text-[0.9375rem] font-medium leading-tight text-fg">{producer.nome}</p>
        <p className="mt-auto pt-2 text-xs text-muted">{card.unlock?.text}</p>
      </div>
      <div className="mt-1 flex min-h-9 items-center justify-center">
        {card.unlock?.href ? (
          <TextLink to={card.unlock.href} className="inline-flex min-h-9 items-center text-sm">
            Ler o boletim
          </TextLink>
        ) : (
          <span className="text-sm text-muted">Boletim por publicar</span>
        )}
      </div>
    </div>
  );
}

export function OriginCards({ cards }: { cards: CardView[] }) {
  const sorted = useMemo(() => [...cards].sort((a, b) => (a.state === 'bloqueado' ? 1 : 0) - (b.state === 'bloqueado' ? 1 : 0) || a.n - b.n), [cards]);
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {sorted.map((c) => (
        <li key={c.lot.id} className="min-w-0">
          {c.state === 'bloqueado' ? <LockedCard card={c} /> : <FlipCard card={c} />}
        </li>
      ))}
    </ul>
  );
}
