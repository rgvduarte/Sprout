import { useId, useState, type ReactNode } from 'react';
import { motion, type MotionValue } from 'motion/react';
import { Chapter } from '../../components/game';
import { DataTable, SegmentedControl, type Column } from '../../components/ui';
import { eur, num, tidyText } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { FOUNDERS_THESIS, OLIVE_CHAIN_FACTS } from '../../data';
import { CHAIN, FOCUS_LOT_ID } from './model';
import { ChapterHead, Frame, useStep, useRange } from './parts';

/* =====================================================================
   2 · A cadeia hoje. O momento focal da página: o diferencial granel →
   embalado (embalamento, transporte e margens dos intermediários; a margem
   líquida do embalador é só uma parte) destaca-se e divide-se, com o
   scroll, em prémio ao produtor, embalamento no co-packer, outros custos,
   margem do lote e desconto ao comprador HoReCa.
   Números do business plan (cenário Recomendado); a referência HoReCa
   embalada está por validar no piloto.
   Gráfico em HTML (texto nítido a qualquer largura), com legenda, dica por
   segmento (rato e teclado) e vista de tabela.
   ===================================================================== */

type SegId = 'producer' | 'packager' | 'premium' | 'packing' | 'cost' | 'spread' | 'discount';

const C = CHAIN;
const kgEur = (v: number) => `${num(v, 2)} €/kg`;
const pctInt = (v: number) => `${Math.round(v * 100)} %`;
const [PM_LO, PM_HI] = C.packagerMargin;
const [PK_LO, PK_HI] = C.packingRange;
/** Onde começa a margem líquida do embalador dentro do diferencial: depois do custo de embalamento verificado (ponto médio). */
const PM_START = C.producerToday + (PK_LO + PK_HI) / 2;
const PM_RANGE = `${num(PM_LO, 2)}–${num(PM_HI, 2)} €/kg`;

const SEG: Record<SegId, { name: string; color: string; who: string }> = {
  producer: { name: 'Preço ao produtor', color: 'var(--vc-producer)', who: 'O lagar recebe-o quando vende a granel: é o índice de origem.' },
  packager: { name: 'Diferencial granel → embalado', color: 'var(--vc-packager)', who: 'Embalamento, transporte e as margens dos intermediários entre o lagar e o cliente HoReCa. A margem líquida do embalador é só uma parte.' },
  premium: { name: 'Prémio ao produtor', color: 'var(--vc-premium)', who: `O lagar recebe ${kgEur(C.producerSprout)} em vez de ${kgEur(C.producerToday)}.` },
  packing: { name: 'Embalamento', color: 'var(--vc-pack)', who: 'Pago a um embalador contratado (co-packer): garrafões de 5 L e vidro, rótulo e caixa.' },
  cost: { name: 'Outros custos do ciclo', color: 'var(--vc-cost)', who: 'Transporte e entregas, armazém, custódia, análises, seguro e provisões para perdas e crédito.' },
  spread: { name: 'Margem do lote', color: 'var(--vc-spread)', who: `${pctInt(C.shares.investors)} cofinanciadores · ${pctInt(C.shares.reserve)} reserva comum de primeira perda · ${pctInt(C.shares.ops)} operação.` },
  discount: { name: 'Desconto ao comprador', color: 'var(--vc-hatch)', who: `Fica no cliente HoReCa: paga ${kgEur(C.buyer)} em vez de ${kgEur(C.ref)}.` },
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
const SPLIT: { id: SegId; v: number }[] = [
  { id: 'premium', v: C.premium },
  { id: 'packing', v: C.packing },
  { id: 'cost', v: C.costs },
  { id: 'spread', v: C.spread },
  { id: 'discount', v: C.discount },
];
const splitSegs = (base: number): Seg[] => {
  let at = base;
  return SPLIT.map(({ id, v }) => {
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
        Hoje o lagar vende a granel ao índice de origem, <Fig>{kgEur(C.producerToday)}</Fig>, e o cliente HoReCa paga cerca de <Fig>{kgEur(C.ref)}</Fig> pelo azeite já embalado. A diferença, <Fig>{kgEur(C.differential)}</Fig>, paga embalamento, transporte e as margens dos intermediários. A margem líquida do embalador é só <Fig>{PM_RANGE}</Fig> dela.
      </>
    ),
  },
  {
    text: (
      <>
        A Sprout compra ao lagar com prémio e manda embalar num embalador contratado, por <Fig>{kgEur(C.packing)}</Fig>. Transporte, armazém, custódia, análises, seguro e provisões custam mais <Fig>{kgEur(C.costs)}</Fig>. O IBC selado é só onde o azeite espera pelo embalamento.
      </>
    ),
  },
  {
    text: (
      <>
        Os outros <Fig>{kgEur(C.redistributed)}</Fig> dividem-se: <Fig>{num(C.discount, 2)} €</Fig> ficam no cliente, <Fig>{num(C.premium, 2)} €</Fig> vão para o lagar e <Fig>{num(C.spread, 2)} €</Fig> são a margem do lote, a repartir entre cofinanciadores, reserva comum e operação.
      </>
    ),
  },
];

function Fig({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap font-medium text-fg tnum">{children}</span>;
}

function ValueChainScene({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const step = useStep(progress, (v) => (v < 0.3 ? 0 : v < 0.62 ? 1 : 2));
  const kg = C.lotKg;
  return (
    <Frame>
      <div className="grid min-w-0 items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="min-w-0">
          <ChapterHead title="A cadeia hoje" lead={`Entre o lagar e o cliente HoReCa há embalamento, transporte e intermediários. Em cada quilo que o cliente paga a ${kgEur(C.ref)}, o lagar recebe ${kgEur(C.producerToday)}.`} />
          <ol className="mt-8 flex flex-col gap-4" aria-label="Como se divide o diferencial">
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
            {tidyText(
              `No lote ${FOCUS_LOT_ID} inteiro, ${num(kg)} kg: ${eur(C.discount * kg)} ficam nos clientes, mais ${eur(C.premium * kg)} vão para o lagar e ${eur(C.spread * kg)} de margem remuneram o ciclo. A margem é uma previsão: se o índice de origem ou a referência caírem, encolhe ou desaparece, e o capital pode ter perda.`,
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {tidyText(
              `A referência de ${kgEur(C.ref)} está por validar: o piloto mede-a com cotações reais. A tese original dos fundadores, captar ${Math.round(FOUNDERS_THESIS.packagerMarginCaptured[0] * 100)}–${Math.round(FOUNDERS_THESIS.packagerMarginCaptured[1] * 100)} % da margem do embalador, também: a margem verificada, ${PM_RANGE}, não paga sozinha um desconto de ${Math.round(FOUNDERS_THESIS.buyerDiscount[0] * 100)}–${Math.round(FOUNDERS_THESIS.buyerDiscount[1] * 100)} %. Por isso o plano conta o embalamento como custo.`,
            )}
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
  today?: number | string;
  sprout?: number;
  note: string;
}

const TABLE_ROWS: TableRow[] = [
  { id: 'producer', label: 'Preço ao produtor', today: C.producerToday, sprout: C.producerSprout, note: `Hoje, o índice de origem a granel. Com a Sprout inclui o prémio de ${kgEur(C.premium)}.` },
  { id: 'packager', label: 'Diferencial granel → embalado', today: C.differential, note: 'Embalamento, transporte e margens dos intermediários. Com a Sprout abre-se nas linhas abaixo.' },
  { id: 'packager-margin', label: 'dos quais: margem líquida do embalador', today: `${num(PM_LO, 2)}–${num(PM_HI, 2)}`, note: `Valor verificado: ${OLIVE_CHAIN_FACTS.sourceShort}. O embalamento custa ${num(PK_LO, 2)}–${num(PK_HI, 2)} €/kg.` },
  { id: 'packing', label: 'Embalamento no co-packer', sprout: C.packing, note: SEG.packing.who },
  { id: 'cost', label: 'Outros custos do ciclo', sprout: C.costs, note: SEG.cost.who },
  { id: 'spread', label: 'Margem do lote', sprout: C.spread, note: SEG.spread.who },
  { id: 'discount', label: 'Desconto ao comprador', sprout: C.discount, note: `${pctInt(C.discountPct)} abaixo da referência.` },
  { id: 'buyer', label: 'Preço pago pelo cliente HoReCa', today: C.ref, sprout: C.buyer, note: 'Referência HoReCa embalada, a validar no piloto; com a Sprout, menos o desconto.' },
];

const TABLE_COLUMNS: Column<TableRow>[] = [
  { key: 'label', header: 'Componente', render: (r) => r.label, minWidth: 180 },
  { key: 'today', header: 'Hoje (€/kg)', render: (r) => (r.today === undefined ? '—' : typeof r.today === 'string' ? r.today : num(r.today, 2)), align: 'right', mono: true },
  { key: 'sprout', header: 'Com a Sprout (€/kg)', render: (r) => (r.sprout === undefined ? '—' : num(r.sprout, 2)), align: 'right', mono: true },
  { key: 'note', header: 'Para quem', render: (r) => tidyText(r.note), minWidth: 260 },
];

function ChainFigure({ progress }: { progress: MotionValue<number> }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const titleId = useId();
  const d = C.distributors;
  return (
    <figure className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-6" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <figcaption id={titleId} className="min-w-0 flex-1">
          <span className="block font-display text-[1.125rem] font-semibold leading-tight text-fg">Um quilo de azeite virgem extra, do lagar ao cliente HoReCa</span>
          <span className="mt-1 block text-sm text-muted">€/kg sem IVA · lote {FOCUS_LOT_ID}, dados fictícios</span>
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
          <DataTable columns={TABLE_COLUMNS} rows={TABLE_ROWS} getRowId={(r) => r.id} caption="Um quilo de azeite virgem extra, do lagar ao cliente HoReCa, hoje e com a Sprout (€/kg sem IVA)" framed={false} />
        </div>
      )}
      <p className="mt-4 max-w-[62ch] text-sm text-muted">
        {tidyText(
          `Índice de origem a granel em outubro de 2026: ${kgEur(C.producerToday)}. Referência HoReCa embalada de ${kgEur(C.ref)}: business plan, cenário Recomendado, a validar no piloto. Margem do embalador e custo de embalamento: ${OLIVE_CHAIN_FACTS.sourceShort}. No outro canal do plano, distribuidores e exportadores, não há desconto: ${kgEur(d.ref)} de preço de saída do embalador mais ${num(d.premium, 2)} € de prémio de origem, para uma margem de ${kgEur(d.margin)}.`,
        )}
      </p>
    </figure>
  );
}

function Swatch({ id }: { id: SegId | 'margin' }) {
  if (id === 'discount' || id === 'margin') {
    return (
      <span aria-hidden className="inline-block h-2.5 w-3.5 shrink-0 overflow-hidden rounded-[2px]">
        <Hatch tone={id} />
      </span>
    );
  }
  return <span aria-hidden className="inline-block h-2.5 w-3.5 shrink-0 rounded-[2px]" style={{ background: SEG[id].color }} />;
}

function Legend() {
  const ids: SegId[] = ['producer', 'packager', 'premium', 'packing', 'cost', 'spread', 'discount'];
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted" aria-label="Legenda">
      {ids.map((id) => (
        <li key={id} className="inline-flex items-center gap-2">
          <Swatch id={id} />
          {SEG[id].name}
        </li>
      ))}
      <li className="inline-flex items-center gap-2">
        <Swatch id="margin" />
        Margem líquida do embalador, dentro do diferencial
      </li>
    </ul>
  );
}

/**
 * Tracejado a 45°. 'discount': dinheiro que o comprador deixa de pagar
 * (traço escuro sobre fundo claro). 'margin': a margem líquida do embalador,
 * dentro do diferencial (traço claro sobre a cor do diferencial).
 */
function Hatch({ tone }: { tone: 'discount' | 'margin' }) {
  const id = `h${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const margin = tone === 'margin';
  return (
    <svg aria-hidden className="block h-full w-full" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill={margin ? 'var(--vc-packager)' : 'color-mix(in oklab, var(--vc-hatch) 16%, var(--surface))'} />
          <line x1="0" y1="0" x2="0" y2="5" stroke={margin ? 'color-mix(in oklab, var(--surface) 78%, var(--vc-packager))' : 'var(--vc-hatch)'} strokeWidth={margin ? 2 : 1.6} />
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
  // abaixo de 640 px os segmentos finos não são alvos de foco: a legenda e a tabela já os descrevem
  const focusable = useMediaQuery('(min-width: 640px)', true);
  const beam = useRange(progress, [0.12, 0.3], [0, 1]);
  const split = useRange(progress, [0.3, 0.66], [0, 1]);
  const oneBlockLabel = useRange(split, [0, 0.3], [1, 0]);
  const build = useRange(progress, [0.64, 0.9], [0, 1]);

  const bind = (row: 'a' | 'b' | 'z', seg: Seg) => ({
    tabIndex: focusable ? 0 : undefined,
    role: 'img' as const,
    'aria-label': `${SEG[seg.id].name}: ${kgEur(value(seg))}${row === 'a' ? ', hoje' : row === 'b' ? ', com a Sprout' : ''}. ${SEG[seg.id].who}`,
    onMouseEnter: () => setTip({ row, seg }),
    onMouseLeave: () => setTip(null),
    onFocus: () => setTip({ row, seg }),
    onBlur: () => setTip(null),
  });

  return (
    <div className="mt-5 min-w-0">
      <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
        {/* linha: hoje, com a chaveta da margem do embalador por cima */}
        <RowLabel title="Hoje" sub={`HoReCa paga ${num(C.ref, 2)} €`} className="sm:self-end" />
        <div className="min-w-0">
          <PackagerBracket />
          <Track tip={tip?.row === 'a' ? tip.seg : null} total={C.ref}>
            <TodaySegments progress={progress} bind={bind} />
          </Track>
        </div>

        {/* linha: com a Sprout */}
        <RowLabel title="Com a Sprout" sub={`HoReCa paga ${num(C.buyer, 2)} €`} className="mt-3 sm:mt-4" />
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
          <Track tip={tip?.row === 'z' ? tip.seg : null} total={C.differential}>
            <div className="absolute inset-0 rounded-r-[4px]" style={{ background: SEG.packager.color }} />
            <motion.span aria-hidden className="pointer-events-none absolute inset-0 flex items-center px-3 text-[13px] font-medium text-surface" style={{ opacity: oneBlockLabel }}>
              <span className="truncate">Diferencial granel → embalado · {kgEur(C.differential)}</span>
            </motion.span>
            {ZOOM.map((s, i) => (
              <ZoomSegment key={s.id} seg={s} index={i} split={split} bind={bind('z', s)} />
            ))}
          </Track>
        </div>
        {/* a chave ocupa a largura toda da figura: cinco partes com valor e nome */}
        <div className="min-w-0 sm:col-span-2">
          <ZoomLabels split={split} />
        </div>
      </div>
    </div>
  );
}

/**
 * Chaveta por cima da linha "Hoje", com rótulo direto: marca a margem
 * líquida do embalador dentro do diferencial. O rótulo alinha à direita com
 * a ponta da chaveta e quebra linha quando não cabe.
 */
function PackagerBracket() {
  const end = (PM_START + PM_HI) / C.ref;
  return (
    <div className="relative min-w-0 pb-3" aria-hidden>
      <p className="text-right text-xs leading-tight text-muted" style={{ marginRight: `${(1 - end) * 100}%` }}>
        margem líquida do embalador <span className="whitespace-nowrap font-medium text-fg tnum">{PM_RANGE}</span>
      </p>
      <span className="absolute bottom-1.5 h-1.5 rounded-t-[2px] border-x-[1.5px] border-t-[1.5px] border-fg" style={{ left: pct(PM_START, C.ref), width: pct(PM_HI, C.ref) }} />
    </div>
  );
}

/** Linha "Hoje": o preço ao produtor esbate-se e o diferencial ganha um contorno; dentro dele, a margem líquida do embalador verificada. */
function TodaySegments({ progress, bind }: { progress: MotionValue<number>; bind: (row: 'a', seg: Seg) => Record<string, unknown> }) {
  const dimProducer = useRange(progress, [0.04, 0.22], [1, 0.5]);
  const ring = useRange(progress, [0.04, 0.22], [0, 1]);
  return (
    <>
      {ROW_TODAY.map((s, i) => (
        <div key={s.id} className={cn('absolute inset-y-0 overflow-hidden outline-offset-2', i === ROW_TODAY.length - 1 && 'rounded-r-[4px]')} style={{ left: pct(s.from, C.ref), width: pct(value(s), C.ref) }} {...bind('a', s)}>
          <motion.div className="absolute inset-0" style={{ opacity: s.id === 'producer' ? dimProducer : 1 }}>
            <div className="h-full w-full" style={{ background: SEG[s.id].color }} />
          </motion.div>
          {i > 0 && <Gap />}
        </div>
      ))}
      <PackagerMarginBand />
      <span aria-hidden className="pointer-events-none absolute -inset-y-[5px] right-[-5px]" style={{ left: `calc(${pct(C.producerToday, C.ref)} - 3px)` }}>
        <motion.span className="absolute inset-0 rounded-[6px] border-2 border-fg" style={{ opacity: ring }} />
      </span>
    </>
  );
}

/** Sub-banda tracejada dentro do diferencial: a margem líquida do embalador verificada, depois do custo de embalamento. */
function PackagerMarginBand() {
  return (
    <span
      role="img"
      aria-label={`Dentro do diferencial: margem líquida do embalador, ${num(PM_LO, 2)} a ${num(PM_HI, 2)} €/kg (valor verificado), depois de ${num(PK_LO, 2)}–${num(PK_HI, 2)} €/kg de embalamento.`}
      className="pointer-events-none absolute inset-y-0 overflow-hidden"
      style={{ left: pct(PM_START, C.ref), width: pct(PM_HI, C.ref) }}
    >
      <Hatch tone="margin" />
      <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-surface" />
      <span aria-hidden className="absolute inset-y-0 right-0 w-px bg-surface" />
    </span>
  );
}

function RowLabel({ title, sub, className }: { title: string; sub: string; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-baseline gap-2 sm:block', className)}>
      <span className="text-sm font-semibold text-fg">{title}</span>
      <span className="block text-xs text-muted tnum sm:mt-0.5">{tidyText(sub)}</span>
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
          <p className="flex items-center gap-2 whitespace-nowrap">
            <Swatch id={tip.id} />
            <span className="font-mono font-semibold text-fg tnum">{kgEur(value(tip))}</span>
          </p>
          <p className="mt-0.5 font-medium text-fg">{SEG[tip.id].name}</p>
          <p className="mt-0.5 text-muted">{tidyText(SEG[tip.id].who)}</p>
        </div>
      )}
    </div>
  );
}

function SproutSegment({ seg, index, build, bind }: { seg: Seg; index: number; build: MotionValue<number>; bind: Record<string, unknown> }) {
  // os segmentos ganham cor por ordem, da esquerda para a direita; o último fica cheio com build = 1
  const start = Math.max(0, (index - 1) * 0.15);
  const on = useRange(build, [start, start + 0.4], [0, 1]);
  const last = seg.id === 'discount';
  return (
    <div className={cn('absolute inset-y-0 overflow-hidden outline-offset-2', last && 'rounded-r-[4px]')} style={{ left: pct(seg.from, C.ref), width: pct(value(seg), C.ref) }} {...bind}>
      <div className="absolute inset-0" style={{ background: 'var(--vc-producer)' }} />
      <motion.div className="absolute inset-0" style={{ opacity: seg.id === 'producer' ? 1 : on }}>
        {last ? <Hatch tone="discount" /> : <div className="h-full w-full" style={{ background: SEG[seg.id].color }} />}
      </motion.div>
      {index > 0 && <Gap />}
    </div>
  );
}

const ZOOM_STAGGER = 0.12;

function ZoomSegment({ seg, index, split, bind }: { seg: Seg; index: number; split: MotionValue<number>; bind: Record<string, unknown> }) {
  const start = index * ZOOM_STAGGER;
  const on = useRange(split, [start, start + 0.46], [0, 1]);
  const last = seg.id === 'discount';
  return (
    <div className={cn('absolute inset-y-0 outline-offset-2', last && 'rounded-r-[4px]')} style={{ left: pct(seg.from, C.differential), width: pct(value(seg), C.differential) }} {...bind}>
      <motion.div className={cn('absolute inset-0 overflow-hidden', last && 'rounded-r-[4px]')} style={{ opacity: on }}>
        {last ? <Hatch tone="discount" /> : <div className="h-full w-full" style={{ background: SEG[seg.id].color }} />}
        {index > 0 && <Gap />}
      </motion.div>
    </div>
  );
}

/** Espaço de 2 px na cor da superfície entre segmentos contíguos (dataviz). */
function Gap() {
  return <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-surface" />;
}

/** Chave da ampliação: valor e nome de cada parte, pela ordem da barra. */
function ZoomLabels({ split }: { split: MotionValue<number> }) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 xl:grid-cols-5" aria-label="Partes do diferencial granel → embalado">
      {ZOOM.map((s, i) => (
        <ZoomKey key={s.id} seg={s} index={i} split={split} />
      ))}
    </ul>
  );
}

function ZoomKey({ seg, index, split }: { seg: Seg; index: number; split: MotionValue<number> }) {
  const start = index * ZOOM_STAGGER;
  const on = useRange(split, [start, start + 0.46], [0.25, 1]);
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
  const ticks = [0, 1, 2, 3, 4, 5];
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
