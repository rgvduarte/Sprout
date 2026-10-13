import { useId, useState, type ReactNode } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { Chapter } from '../../components/game';
import { DataTable, SegmentedControl, type Column } from '../../components/ui';
import { eur, num } from '../../lib/format';
import { cn } from '../../lib/cn';
import { CHAIN, FOCUS_LOT_ID } from './model';
import { ChapterHead, Frame, useStep } from './parts';

/* =====================================================================
   2 · A cadeia hoje. O momento focal da página: a margem do embalador
   destaca-se e divide-se, com o scroll, em prémio ao produtor, custos do
   ciclo, spread que financia o ciclo e desconto ao comprador.
   Gráfico em HTML (texto nítido a qualquer largura), com legenda, dica por
   segmento (rato e teclado) e vista de tabela.
   ===================================================================== */

type SegId = 'producer' | 'packager' | 'premium' | 'cost' | 'spread' | 'discount';

const C = CHAIN;
const kgEur = (v: number) => `${num(v, 2)} €/kg`;

const SEG: Record<SegId, { name: string; color: string; who: string }> = {
  producer: { name: 'Preço ao produtor', color: 'var(--vc-producer)', who: 'O lagar recebe-o pelo azeite a granel.' },
  packager: { name: 'Margem do embalador', color: 'var(--vc-packager)', who: 'Fica no intermediário que compra ao lagar e vende ao comprador.' },
  premium: { name: 'Prémio ao produtor', color: 'var(--vc-premium)', who: `O lagar recebe ${kgEur(C.producerSprout)} em vez de ${kgEur(C.producerToday)}.` },
  cost: { name: 'Custos do ciclo', color: 'var(--vc-cost)', who: 'Análises, armazenagem, seguro, logística e cobertura de preço.' },
  spread: { name: 'Spread que financia o ciclo', color: 'var(--vc-spread)', who: `${Math.round(C.shares.investors * 100)} % co-financiadores · ${Math.round(C.shares.reserve * 100)} % reserva de primeira perda · ${Math.round(C.shares.ops * 100)} % operação.` },
  discount: { name: 'Desconto ao comprador', color: 'var(--vc-hatch)', who: `Fica no comprador B2B: paga ${kgEur(C.buyer)} em vez de ${kgEur(C.ref)}.` },
};

interface Seg {
  id: SegId;
  from: number;
  to: number;
}

const ROW_TODAY: Seg[] = [
  { id: 'producer', from: 0, to: C.producerToday },
  { id: 'packager', from: C.producerToday, to: C.ref },
];
const SPLIT_IDS: SegId[] = ['premium', 'cost', 'spread', 'discount'];
const splitSegs = (base: number): Seg[] => {
  let at = base;
  return SPLIT_IDS.map((id) => {
    const v = id === 'premium' ? C.premium : id === 'cost' ? C.costs : id === 'spread' ? C.spread : C.discount;
    const s = { id, from: at, to: at + v };
    at += v;
    return s;
  });
};
const ROW_SPROUT: Seg[] = [{ id: 'producer', from: 0, to: C.producerToday }, ...splitSegs(C.producerToday)];
const ZOOM: Seg[] = splitSegs(0);

const value = (s: Seg) => s.to - s.from;

/* ------------------------------------------------------------ capítulo */

export function ValueChainChapter({ tall }: { tall: boolean }) {
  return (
    <Chapter id="cadeia" label="A cadeia hoje" heightVh={240} static={!tall} stickyClassName="pt-14 pb-4">
      {(progress, rich) => <ValueChainScene progress={progress} rich={rich} />}
    </Chapter>
  );
}

const STEPS: { text: ReactNode }[] = [
  {
    text: (
      <>
        Hoje o lagar recebe <Fig>{kgEur(C.producerToday)}</Fig> e o comprador paga a referência de mercado, <Fig>{kgEur(C.ref)}</Fig>. A diferença, <Fig>{kgEur(C.packager)}</Fig>, é a margem do embalador.
      </>
    ),
  },
  {
    text: (
      <>
        A Sprout faz o trabalho do embalador por <Fig>{kgEur(C.costs)}</Fig>: análises, armazenagem, seguro, logística e cobertura de preço.
      </>
    ),
  },
  {
    text: (
      <>
        Os outros <Fig>{kgEur(C.redistributed)}</Fig>, {Math.round(C.capturedShare * 100)} % da margem do embalador, dividem-se: <Fig>{num(C.discount, 2)} €</Fig> ficam no comprador, <Fig>{num(C.premium, 2)} €</Fig> vão para o lagar e <Fig>{num(C.spread, 2)} €</Fig> são o spread que financia o ciclo.
      </>
    ),
  },
];

function Fig({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap font-medium text-fg tnum">{children}</span>;
}

function ValueChainScene({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const step = useStep(progress, (v) => (v < 0.3 ? 0 : v < 0.62 ? 1 : 2));
  return (
    <Frame>
      <div className="grid min-w-0 items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="min-w-0">
          <ChapterHead title="A cadeia hoje" lead="Entre o lagar e quem compra azeite a granel está um embalador. Em cada quilo vendido a 4,48 €, fica com 1,28 €." />
          <ol className="mt-8 flex flex-col gap-4" aria-label="Como se divide a margem">
            {STEPS.map((s, i) => {
              const active = rich && i === step;
              return (
                <li key={i} className={cn('flex gap-3 text-base leading-relaxed transition-colors duration-200', !rich || i <= step ? 'text-fg' : 'text-muted')} aria-current={active ? 'step' : undefined}>
                  <span aria-hidden className={cn('mt-[0.6em] size-2 shrink-0 rounded-full transition-colors duration-200', active ? 'bg-accent' : 'bg-border')} />
                  <span className="min-w-0">{s.text}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            No lote {FOCUS_LOT_ID} inteiro, {num(C.lotKg)} kg: {eur(C.discount * C.lotKg)} ficam nos compradores, mais {eur(C.premium * C.lotKg)} vão para o lagar e {eur(C.spread * C.lotKg)} de spread financiam o ciclo. O spread é uma previsão: se a referência cair, encolhe ou desaparece, e o capital pode ter perda.
          </p>
        </div>
        <ChainFigure progress={progress} />
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------ figura */

interface TableRow {
  id: string;
  label: string;
  today?: number;
  sprout?: number;
  note: string;
}

const TABLE_ROWS: TableRow[] = [
  { id: 'producer', label: 'Preço ao produtor', today: C.producerToday, sprout: C.producerSprout, note: `Com a Sprout inclui o prémio de ${kgEur(C.premium)}.` },
  { id: 'packager', label: 'Margem do embalador', today: C.packager, note: 'Deixa de existir na compra direta.' },
  { id: 'cost', label: 'Custos do ciclo', sprout: C.costs, note: SEG.cost.who },
  { id: 'spread', label: 'Spread que financia o ciclo', sprout: C.spread, note: SEG.spread.who },
  { id: 'discount', label: 'Desconto ao comprador', sprout: C.discount, note: `${Math.round(C.discountPct * 100)} % abaixo da referência.` },
  { id: 'buyer', label: 'Preço pago pelo comprador', today: C.ref, sprout: C.buyer, note: 'Referência de mercado hoje; com a Sprout, menos o desconto.' },
];

const TABLE_COLUMNS: Column<TableRow>[] = [
  { key: 'label', header: 'Componente', render: (r) => r.label, minWidth: 180 },
  { key: 'today', header: 'Hoje (€/kg)', render: (r) => (r.today === undefined ? '—' : num(r.today, 2)), align: 'right', mono: true },
  { key: 'sprout', header: 'Com a Sprout (€/kg)', render: (r) => (r.sprout === undefined ? '—' : num(r.sprout, 2)), align: 'right', mono: true },
  { key: 'note', header: 'Para quem', render: (r) => r.note, minWidth: 260 },
];

function ChainFigure({ progress }: { progress: MotionValue<number> }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const titleId = useId();
  return (
    <figure className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <figcaption id={titleId} className="min-w-0 flex-1">
          <span className="block font-display text-[1.125rem] font-semibold leading-tight text-fg">Um quilo de azeite virgem extra a granel</span>
          <span className="mt-1 block text-sm text-muted">€/kg · valores ilustrativos a partir do lote {FOCUS_LOT_ID}</span>
        </figcaption>
        <SegmentedControl
          label="Vista do gráfico"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'chart', label: 'Gráfico' },
            { value: 'table', label: 'Tabela' },
          ]}
        />
      </div>
      {view === 'chart' ? (
        <>
          <Legend />
          <ChainChart progress={progress} />
        </>
      ) : (
        <div className="mt-4">
          <DataTable columns={TABLE_COLUMNS} rows={TABLE_ROWS} getRowId={(r) => r.id} caption="Um quilo de azeite virgem extra a granel, hoje e com a Sprout (€/kg, ilustrativo)" framed={false} />
        </div>
      )}
      <p className="mt-4 text-sm text-muted">O preço de {kgEur(C.producerToday)} que o embalador paga hoje ao lagar é uma hipótese de trabalho. Referência de {kgEur(C.ref)} e desconto de {Math.round(C.discountPct * 100)} % do lote {FOCUS_LOT_ID}. Índice ilustrativo, dados fictícios.</p>
    </figure>
  );
}

function Swatch({ id }: { id: SegId }) {
  if (id === 'discount') {
    return (
      <span aria-hidden className="inline-block h-2.5 w-3.5 overflow-hidden rounded-[2px]">
        <Hatch />
      </span>
    );
  }
  return <span aria-hidden className="inline-block h-2.5 w-3.5 rounded-[2px]" style={{ background: SEG[id].color }} />;
}

function Legend() {
  const ids: SegId[] = ['producer', 'packager', 'premium', 'cost', 'spread', 'discount'];
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted" aria-label="Legenda">
      {ids.map((id) => (
        <li key={id} className="inline-flex items-center gap-2">
          <Swatch id={id} />
          {SEG[id].name}
        </li>
      ))}
    </ul>
  );
}

/** Tracejado a 45° para o desconto: dinheiro que o comprador deixa de pagar. */
function Hatch() {
  const id = useId().replace(/:/g, '');
  return (
    <svg aria-hidden className="block h-full w-full" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="color-mix(in oklab, var(--vc-hatch) 16%, var(--surface))" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--vc-hatch)" strokeWidth="1.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

type Tip = { row: 'a' | 'b' | 'z'; seg: Seg } | null;

function ChainChart({ progress }: { progress: MotionValue<number> }) {
  const [tip, setTip] = useState<Tip>(null);
  const hl = useTransform(progress, [0.04, 0.22], [0, 1]);
  const dimProducer = useTransform(hl, [0, 1], [1, 0.5]);
  const beam = useTransform(progress, [0.12, 0.3], [0, 1]);
  const split = useTransform(progress, [0.3, 0.66], [0, 1]);
  const oneBlockLabel = useTransform(split, [0, 0.3], [1, 0]);
  const build = useTransform(progress, [0.64, 0.9], [0, 1]);

  const bind = (row: 'a' | 'b' | 'z', seg: Seg) => ({
    tabIndex: 0,
    role: 'img' as const,
    'aria-label': `${SEG[seg.id].name}: ${kgEur(value(seg))}${row === 'a' ? ', hoje' : row === 'b' ? ', com a Sprout' : ''}. ${SEG[seg.id].who}`,
    onMouseEnter: () => setTip({ row, seg }),
    onMouseLeave: () => setTip(null),
    onFocus: () => setTip({ row, seg }),
    onBlur: () => setTip(null),
  });

  return (
    <div className="mt-5 min-w-0">
      <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-[6.75rem_minmax(0,1fr)]">
        {/* linha: hoje */}
        <RowLabel title="Hoje" sub={`comprador paga ${num(C.ref, 2)} €`} />
        <Track tip={tip?.row === 'a' ? tip.seg : null} total={C.ref}>
          {ROW_TODAY.map((s, i) => (
            <motion.div key={s.id} className={cn('absolute inset-y-0 outline-offset-2', i > 0 && 'border-l-2 border-surface', i === ROW_TODAY.length - 1 && 'rounded-r-[4px]')} style={{ left: pct(s.from, C.ref), width: pct(value(s), C.ref), background: SEG[s.id].color, opacity: s.id === 'producer' ? dimProducer : 1 }} {...bind('a', s)} />
          ))}
          <motion.span aria-hidden className="pointer-events-none absolute -inset-y-[5px] right-[-5px] rounded-[6px] border-2 border-fg" style={{ left: `calc(${pct(C.producerToday, C.ref)} - 3px)`, opacity: hl }} />
        </Track>

        {/* linha: com a Sprout */}
        <RowLabel title="Com a Sprout" sub={`comprador paga ${num(C.buyer, 2)} €`} className="mt-3 sm:mt-4" />
        <Track tip={tip?.row === 'b' ? tip.seg : null} total={C.ref} className="mt-1 sm:mt-4">
          {ROW_SPROUT.map((s, i) => (
            <SproutSegment key={s.id} seg={s} index={i} build={build} bind={bind('b', s)} />
          ))}
          {/* o que o comprador paga */}
          <span aria-hidden className="pointer-events-none absolute -bottom-2 -top-2 w-0.5 bg-fg" style={{ left: `calc(${pct(C.buyer, C.ref)} - 1px)` }} />
        </Track>

        {/* eixo */}
        <span className="hidden sm:block" />
        <Axis />

        {/* ampliação */}
        <span className="hidden sm:block" />
        <div className="relative h-10 min-w-0" aria-hidden>
          <motion.svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" style={{ opacity: beam }}>
            <polygon points={`${(C.producerToday / C.ref) * 100},0 100,0 100,40 0,40`} fill="color-mix(in oklab, var(--fg) 6%, transparent)" />
            <line x1={(C.producerToday / C.ref) * 100} y1="0" x2="0" y2="40" stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="100" y1="0" x2="100" y2="40" stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </motion.svg>
        </div>

        <RowLabel title="Ampliação" sub={`${num(C.producerToday, 2)}–${num(C.ref, 2)} €/kg`} />
        <div className="min-w-0">
          <Track tip={tip?.row === 'z' ? tip.seg : null} total={C.packager}>
            <div className="absolute inset-0 rounded-r-[4px]" style={{ background: SEG.packager.color }} />
            <motion.span aria-hidden className="pointer-events-none absolute inset-0 flex items-center px-3 text-[13px] font-medium text-surface" style={{ opacity: oneBlockLabel }}>
              <span className="truncate">Margem do embalador · {kgEur(C.packager)}</span>
            </motion.span>
            {ZOOM.map((s, i) => (
              <ZoomSegment key={s.id} seg={s} index={i} split={split} bind={bind('z', s)} />
            ))}
          </Track>
          <ZoomLabels split={split} />
        </div>
      </div>
    </div>
  );
}

function RowLabel({ title, sub, className }: { title: string; sub: string; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-baseline gap-2 sm:block', className)}>
      <span className="text-sm font-semibold text-fg">{title}</span>
      <span className="block text-xs text-muted tnum sm:mt-0.5">{sub}</span>
    </div>
  );
}

/** Pista de 24 px com a dica do segmento ativo por cima. */
function Track({ children, tip, total, className }: { children: ReactNode; tip: Seg | null; total: number; className?: string }) {
  const center = tip ? ((tip.from + tip.to) / 2 / total) * 100 : 0;
  return (
    <div className={cn('relative h-6 min-w-0', className)}>
      {children}
      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+10px)] z-20 w-max max-w-[260px] rounded-sm border border-border bg-surface px-3 py-2 text-sm shadow-pop"
          style={center < 18 ? { left: 0 } : center > 82 ? { right: 0 } : { left: `${center}%`, transform: 'translateX(-50%)' }}
        >
          <p className="flex items-center gap-2">
            <Swatch id={tip.id} />
            <span className="font-mono font-semibold text-fg tnum">{kgEur(value(tip))}</span>
            <span className="text-muted">{SEG[tip.id].name}</span>
          </p>
          <p className="mt-1 text-muted">{SEG[tip.id].who}</p>
        </div>
      )}
    </div>
  );
}

function SproutSegment({ seg, index, build, bind }: { seg: Seg; index: number; build: MotionValue<number>; bind: Record<string, unknown> }) {
  // os segmentos ganham cor por ordem, da esquerda para a direita
  const start = Math.max(0, (index - 1) * 0.2);
  const on = useTransform(build, [start, start + 0.4], [0, 1]);
  const last = seg.id === 'discount';
  return (
    <div className={cn('absolute inset-y-0 overflow-hidden outline-offset-2', index > 0 && 'border-l-2 border-surface', last && 'rounded-r-[4px]')} style={{ left: pct(seg.from, C.ref), width: pct(value(seg), C.ref) }} {...bind}>
      <div className="absolute inset-0" style={{ background: 'var(--vc-producer)' }} />
      <motion.div className="absolute inset-0" style={{ opacity: seg.id === 'producer' ? 1 : on }}>
        {last ? <Hatch /> : <div className="h-full w-full" style={{ background: SEG[seg.id].color }} />}
      </motion.div>
    </div>
  );
}

function ZoomSegment({ seg, index, split, bind }: { seg: Seg; index: number; split: MotionValue<number>; bind: Record<string, unknown> }) {
  const start = index * 0.16;
  const on = useTransform(split, [start, start + 0.46], [0, 1]);
  const last = seg.id === 'discount';
  return (
    <div className={cn('absolute inset-y-0 outline-offset-2', last && 'rounded-r-[4px]')} style={{ left: pct(seg.from, C.packager), width: pct(value(seg), C.packager) }} {...bind}>
      <motion.div className={cn('absolute inset-0 overflow-hidden', index > 0 && 'border-l-2 border-surface', last && 'rounded-r-[4px]')} style={{ opacity: on }}>
        {last ? <Hatch /> : <div className="h-full w-full" style={{ background: SEG[seg.id].color }} />}
      </motion.div>
    </div>
  );
}

/** Chave da ampliação: valor e nome de cada parte, pela ordem da barra. */
function ZoomLabels({ split }: { split: MotionValue<number> }) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4" aria-label="Partes da margem do embalador">
      {ZOOM.map((s, i) => (
        <ZoomKey key={s.id} seg={s} index={i} split={split} />
      ))}
    </ul>
  );
}

function ZoomKey({ seg, index, split }: { seg: Seg; index: number; split: MotionValue<number> }) {
  const start = index * 0.16;
  const on = useTransform(split, [start, start + 0.46], [0.25, 1]);
  return (
    <li className="flex min-w-0 items-start gap-2">
      <motion.span className="mt-[3px] inline-flex" style={{ opacity: on }}>
        <Swatch id={seg.id} />
      </motion.span>
      <span className="min-w-0">
        <span className="block font-mono font-semibold text-fg tnum">{kgEur(value(seg))}</span>
        <span className="block leading-snug text-muted">{SEG[seg.id].name}</span>
      </span>
    </li>
  );
}

function Axis() {
  const ticks = [0, 1, 2, 3, 4];
  return (
    <div className="relative mt-2 hidden h-5 min-w-0 sm:block" aria-hidden>
      <span className="absolute inset-x-0 top-0 h-px bg-[var(--chart-grid)]" />
      {ticks.map((t) => (
        <span key={t} className="absolute top-1 -translate-x-1/2 font-mono text-[11px] text-muted tnum" style={{ left: pct(t, C.ref) }}>
          {t} €
        </span>
      ))}
      <span className="absolute right-0 top-1 font-mono text-[11px] text-fg tnum">{num(C.ref, 2)}</span>
    </div>
  );
}

