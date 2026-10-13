import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Lock, RotateCcw } from 'lucide-react';
import { getRegion, getRegionsByMap, getWorld } from '../../data';
import type { Lot, Producer, WorldId } from '../../data/types';
import { Button, CommodityGlyph, TextLink } from '../../components/ui';
import { EASE_OUT } from '../../components/game';
import { dateShort, num } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { CardView } from './model';

/* =====================================================================
   Cartas de origem: uma por lote acompanhado, com dados reais do boletim.
   Viram-se para mostrar a ficha. Pessoais e intransmissíveis: não se
   vendem, não se trocam, não valem dinheiro.
   ===================================================================== */

/* ------------------------------------------------------------ ilustrações (geradas dos dados do lote) */

const SQRT3 = Math.sqrt(3);

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/** Mapa de mosaico da origem: o mapa inteiro, apagado, com a região do lote a cheio. */
function RegionMark({ regionId, x, y, w, h }: { regionId: string; x: number; y: number; w: number; h: number }) {
  const region = getRegion(regionId);
  if (!region) return null;
  const all = getRegionsByMap(region.map).flatMap((r) => r.tiles.map((t) => ({ ...t, own: r.id === regionId })));
  const cols = Math.max(...all.map((t) => t.col)) + 1.5;
  const rows = Math.max(...all.map((t) => t.row)) + 1;
  const r = Math.min(w / (cols * SQRT3), h / (rows * 1.5 + 0.5));
  return (
    <g transform={`translate(${x} ${y})`}>
      {all.map((t) => (
        <polygon
          key={`${t.col}-${t.row}`}
          points={hexPoints(r * SQRT3 * (t.col + 0.5 + (t.row % 2 ? 0.5 : 0)), r * (1 + t.row * 1.5), r - 0.6)}
          fill={t.own ? 'var(--world)' : 'color-mix(in oklab, var(--world) 14%, var(--surface))'}
          stroke={t.own ? 'var(--world-ink)' : 'none'}
          strokeWidth="0.8"
        />
      ))}
    </g>
  );
}

/** Iniciais das variedades ("Verdeal e Cobrançosa" → "VC"). */
function varietyInitials(lot: Lot, producer: Producer): string {
  const fromTitle = lot.title.replace(/^(Virgem extra|Água mineral natural|Água de nascente|Arábica (natural|lavado),?)\s*/i, '');
  const words = (fromTitle || producer.variedades.join(' ')).split(/[\s,]+/).filter((w) => w.length > 2 && !/^(e|de|da|do|colheita|precoce|1,5|L)$/i.test(w));
  const letters = words.map((w) => w[0].toUpperCase()).join('').slice(0, 3);
  return letters || producer.initials;
}

const UNIT_WORD: Record<WorldId, [string, string]> = { azeite: ['IBC', 'IBC'], agua: ['palete', 'paletes'], cafe: ['saca', 'sacas'] };

/** Unidade física do lote, pelo contentor onde está hoje (um lote por financiar pode ainda estar no depósito do lagar). */
function unitWordOf(lot: Lot): [string, string] {
  const c = lot.storage.container.toLowerCase();
  if (c.startsWith('ibc')) return ['IBC', 'IBC'];
  if (c.startsWith('depósito')) return ['depósito', 'depósitos'];
  if (c.startsWith('palete')) return ['palete', 'paletes'];
  if (c.startsWith('saca')) return ['saca', 'sacas'];
  return UNIT_WORD[lot.world];
}

/**
 * Arte da carta, gerada dos dados: o mapa da origem com a região acesa, as iniciais das
 * variedades, a data de extração ou engarrafamento e uma fila com as unidades físicas do lote.
 */
export function CardArt({ lot, producer, className, muted }: { lot: Lot; producer: Producer; className?: string; muted?: boolean }) {
  const world = lot.world;
  const units = lot.storage.containers;
  const perMark = units > 60 ? 20 : 1;
  const marks = Math.min(40, Math.ceil(units / perMark));
  const perRow = 20;
  const cell = 6.4;
  const harvest = lot.milestones.find((m) => m.stage === 'colhido');
  const day = harvest?.date ?? harvest?.planned;
  const isPt = getRegion(lot.regionId)?.map === 'pt';
  return (
    <svg viewBox="0 0 160 110" className={cn('block h-auto w-full', muted && 'opacity-50 grayscale', className)} aria-hidden data-world={world}>
      <rect width="160" height="110" fill="color-mix(in oklab, var(--world) 7%, var(--surface))" />
      {isPt ? <RegionMark regionId={lot.regionId} x={8} y={6} w={40} h={68} /> : <RegionMark regionId={lot.regionId} x={6} y={10} w={70} h={30} />}
      <text x={isPt ? 58 : 84} y={isPt ? 34 : 30} fontSize="26" fontWeight={700} fontFamily="var(--font-display)" fill="var(--world-ink)" style={{ fontStretch: '87.5%' }}>
        {varietyInitials(lot, producer)}
      </text>
      <text x={isPt ? 58 : 84} y={isPt ? 48 : 44} fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--fg)">
        {day ? `${world === 'agua' ? 'engarrafado' : world === 'cafe' ? 'colheita' : 'extração'} ${dateShort(day)}` : lot.campanha}
      </text>
      <text x={isPt ? 58 : 84} y={isPt ? 59 : 55} fontSize="8.5" fontFamily="var(--font-sans)" fill="var(--muted)">
        {producer.localidade}
      </text>
      <g transform="translate(8 80)">
        {Array.from({ length: marks }, (_, i) => (
          <rect key={i} x={(i % perRow) * (cell + 1)} y={Math.floor(i / perRow) * (cell + 1)} width={cell} height={cell} rx={world === 'cafe' ? 2.5 : 0.8} fill="var(--world)" opacity={0.85} />
        ))}
      </g>
      <text x="152" y="104" textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="var(--world-ink)">
        {`${num(units)} ${units === 1 ? unitWordOf(lot)[0] : unitWordOf(lot)[1]}${perMark > 1 ? ` · ■ = ${perMark}` : ''}`}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------ carta */

const STATE_TEXT: Record<CardView['state'], string> = {
  participado: 'Cofinancias este lote',
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
      {/* arte a toda a largura da carta, entre filetes (uma janela, não um cartão dentro do cartão) */}
      <div className="mt-2 border-y border-world-line">
        <CardArt lot={lot} producer={producer} />
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <p className="font-mono text-sm text-fg tnum">{lot.id}</p>
        <p className="mt-0.5 font-display text-[1.0625rem] font-semibold leading-tight text-fg" style={{ fontStretch: '87.5%' }}>
          {producer.nome}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {region.nome} · {lot.campanha}
        </p>
        <p className="mt-auto pt-2 text-xs font-medium text-world-ink">
          {STATE_TEXT[card.state]}
          {card.state === 'participado' && lot.illustrative && <span className="font-normal text-muted"> · histórico ilustrativo</span>}
        </p>
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
  const shown = card.stats.filter((x) => x.label !== 'Região').slice(0, 3);
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
        <div className="-mx-3 mt-2 border-y border-border">
          <CardArt lot={lot} producer={producer} muted />
        </div>
        <p className="mt-2.5 font-mono text-sm text-fg tnum">{lot.id}</p>
        <p className="mt-0.5 text-[0.9375rem] font-medium leading-tight text-fg">{producer.nome}</p>
        <dl className="mt-2 flex flex-col gap-1 text-xs text-muted">
          {shown.map((x) => (
            <div key={x.label} className="flex min-w-0 items-baseline justify-between gap-2">
              <dt className="shrink-0">{x.label}</dt>
              <dd className={cn('truncate text-right', x.mono && 'font-mono tnum')} title={x.value}>
                {x.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-auto flex items-start gap-1.5 pt-2 text-xs text-muted">
          <Lock aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={1.75} />
          <span>{card.unlock?.text}</span>
        </p>
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
