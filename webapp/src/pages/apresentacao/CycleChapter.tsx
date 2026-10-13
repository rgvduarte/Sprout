import { useId, type ReactNode } from 'react';
import { motion, type MotionValue } from 'motion/react';
import { Chapter, HarvestBand } from '../../components/game';
import { getLot } from '../../data';
import { addMonths } from '../../lib/clock';
import { date, kg, lisbonParts, monthYear, num, pct, tidyText } from '../../lib/format';
import { cn } from '../../lib/cn';
import { CYCLE, FOCUS_LOT_ID } from './model';
import { ChapterHead, Frame, useStep, useRange } from './parts';

/* =====================================================================
   4 · O ciclo. O cursor percorre a janela do lote sobre a campanha agrícola
   (compra → armazenagem → embalamento e vendas → cobrança e liquidação).
   A liquidação esperada é ao fim de uma campanha; os 18 meses são o limite
   da janela e, aí, desenha-se a bifurcação: liquidação, extensão
   condicionada ou refinanciamento da armazenagem. Sem lotes passados como
   prova: as regras são as do lote em foco (dados fictícios).
   ===================================================================== */

const focus = getLot(FOCUS_LOT_ID)!;
const eco = focus.economics;
const kgEur = (v: number) => `${num(v, 2)} €/kg`;
const planned = (stage: string) => focus.milestones.find((m) => m.stage === stage)?.planned;

/** Meses inteiros (arredondados) desde o início da janela até uma data. */
function monthsSinceStart(iso: string): number {
  const a = lisbonParts(CYCLE.start);
  const b = lisbonParts(iso);
  return Math.round((b.year - a.year) * 12 + (b.month - a.month) + (b.day - a.day) / 30);
}

const M_SALES = monthsSinceStart(planned('em-venda') ?? addMonths(CYCLE.start, 3));
const M_SHIPPED = monthsSinceStart(planned('expedido') ?? addMonths(CYCLE.start, 9));
const M_EXPECTED = monthsSinceStart(CYCLE.expected);

const PHASES = [
  { n: 1, name: 'Compra', from: 0, to: 1, text: `A Sprout paga o lagar; os ${kg(focus.quantity)} passam para ${focus.storage.containers} IBC selados com o número do lote.` },
  { n: 2, name: 'Armazenagem', from: 1, to: M_SALES, text: 'IBC em nave fresca, a 15–18 °C, com custódia independente e inventário mensal.' },
  { n: 3, name: 'Embalamento e vendas', from: M_SALES, to: M_SHIPPED, text: `Embalado por tranches no co-packer; ${pct(focus.hedge.coverage, 0)} vendido a prazo a ${kgEur(eco.buyerPrice)}, o resto ao preço do mês.` },
  { n: 4, name: 'Cobrança e liquidação', from: M_SHIPPED, to: M_EXPECTED, text: `Os clientes pagam para a conta segregada; liquidação esperada a ${date(CYCLE.expected)}.` },
  { n: 5, name: 'Folga da janela', from: M_EXPECTED, to: CYCLE.months, text: `Se as vendas ou a cobrança atrasarem, o lote liquida até ${date(CYCLE.end)}.` },
] as const;

const PHASE_TONE = [34, 54, 76, 100, 14];

/* posição de uma data na faixa de meses da HarvestBand (mesmo cálculo do componente) */
const FIRST = lisbonParts(`${CYCLE.start.slice(0, 7)}-01`);
const TOTAL_CELLS = CYCLE.months + CYCLE.extensionMonths + 1;
function positionOf(iso: string): number {
  const p = lisbonParts(iso);
  const idx = (p.year - FIRST.year) * 12 + (p.month - FIRST.month);
  const dim = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
  return (idx + (p.day - 1) / dim) / TOTAL_CELLS;
}
const atMonth = (m: number) => positionOf(addMonths(CYCLE.start, m));
const FORK_X = atMonth(CYCLE.months);

export function CycleChapter({ tall }: { tall: boolean }) {
  return (
    <Chapter id="ciclo" label="O ciclo" heightVh={230} static={!tall} stickyClassName="pt-14 pb-4">
      {(progress, rich) => <CycleScene progress={progress} rich={rich} />}
    </Chapter>
  );
}

function CycleScene({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const cursor = useRange(progress, [0.06, 0.78], [0, 1]);
  const fork = useRange(progress, [0.76, 0.94], [0, 1]);
  const month = useStep(cursor, (v) => Math.round(Math.max(0, Math.min(1, v)) * CYCLE.months));
  const activePhase = rich ? (month >= CYCLE.months ? PHASES.length - 1 : PHASES.findIndex((p) => month >= p.from && month < p.to)) : -1;
  const forkOn = useStep(fork, (v) => (v > 0.02 ? 1 : 0));

  return (
    <Frame>
      <div data-world="azeite" className="min-w-0">
        <ChapterHead
          title="Uma campanha, numa janela de 18 meses"
          lead={`Do fecho do financiamento à liquidação, esperada no mês ${num(M_EXPECTED)}, ao fim de uma campanha. O mês ${CYCLE.months} é o limite da janela: aí há três caminhos previstos em contrato.`}
        />

        <p className="mt-6 font-mono text-sm text-fg tnum" aria-hidden={rich ? true : undefined}>
          {rich ? (
            <>
              Mês {month} de {CYCLE.months} · {monthYear(addMonths(CYCLE.start, month))}
              <span className="text-muted"> · {month >= CYCLE.months ? 'fim da janela' : PHASES[activePhase]?.name}</span>
            </>
          ) : (
            <>
              Janela de {date(CYCLE.start)} a {date(CYCLE.end)} · liquidação esperada a {date(CYCLE.expected)} · lote {FOCUS_LOT_ID}
            </>
          )}
        </p>

        {/* faixa das fases, alinhada com a janela */}
        <div className="relative mt-3 h-8 min-w-0" aria-hidden>
          {PHASES.map((p, i) => {
            const a = atMonth(p.from);
            const b = atMonth(p.to);
            const on = activePhase === -1 || activePhase === i;
            return (
              <div key={p.n} className="absolute bottom-0 top-0" style={{ left: `${a * 100}%`, width: `calc(${(b - a) * 100}% - 2px)` }}>
                <span className={cn('block font-mono text-xs tnum transition-colors duration-200', on ? 'text-fg' : 'text-muted')}>{p.n}</span>
                <span
                  className={cn('absolute inset-x-0 bottom-0 h-2.5 rounded-[2px] transition-opacity duration-200', i === PHASES.length - 1 && 'border border-dashed border-world-ink')}
                  style={{ background: `color-mix(in oklab, var(--world-ink) ${PHASE_TONE[i]}%, var(--surface))`, opacity: on ? 1 : 0.35 }}
                />
              </div>
            );
          })}
        </div>
        <HarvestBand world="azeite" start={CYCLE.start} months={CYCLE.months} extensionMonths={CYCLE.extensionMonths} progress={rich ? cursor : undefined} legend={false} className="mt-6" />
        <BandLegend />

        {/* fases à esquerda, bifurcação do mês 18 à direita; a nota de perda fica por baixo das fases (no telemóvel, depois da bifurcação) */}
        <div className="mt-7 grid min-w-0 gap-y-6 md:grid-cols-[minmax(0,var(--fork))_minmax(0,1fr)] md:grid-rows-[auto_1fr]" style={{ ['--fork' as string]: `${FORK_X * 100}%` }}>
          <ol className="grid min-w-0 gap-x-5 gap-y-5 sm:grid-cols-2 md:col-start-1 md:row-start-1 md:pr-6 xl:grid-cols-5" aria-label="Fases da janela">
            {PHASES.map((p, i) => (
              <li key={p.n} className="min-w-0">
                <p className={cn('font-semibold transition-colors duration-200', activePhase === -1 || activePhase === i ? 'text-fg' : 'text-muted')}>
                  <span className="mr-1.5 font-mono text-sm tnum text-muted">{p.n}</span>
                  {p.name}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted tnum">
                  {monthYear(addMonths(CYCLE.start, p.from))} – {monthYear(addMonths(CYCLE.start, p.to))}
                </p>
                <p className="mt-1.5 text-sm leading-snug text-muted">{tidyText(p.text)}</p>
              </li>
            ))}
          </ol>
          <div className="min-w-0 md:col-start-2 md:row-span-2 md:row-start-1">
            <Fork progress={fork} drawn={!rich || forkOn === 1} />
          </div>
          <p className="measure min-w-0 text-sm leading-relaxed text-muted md:col-start-1 md:row-start-2 md:pr-6">
            <strong className="font-semibold text-fg">Nenhum caminho garante o capital.</strong>{' '}
            {tidyText(
              `Com ${pct(focus.hedge.coverage, 0)} vendido a prazo, o lote fica sem margem se o índice de origem descer de ${num(CYCLE.indexAtOpen, 2)} para ${kgEur(CYCLE.breakEvenIndexLot)} e a referência embalada o acompanhar; abaixo disso, perde capital. A reserva comum só cobre perdas até ao saldo que tiver.`,
            )}
          </p>
        </div>
      </div>
    </Frame>
  );
}

function Fork({ progress, drawn }: { progress: MotionValue<number>; drawn: boolean }) {
  const hatchId = `h${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const stem = useRange(progress, [0, 0.5], [0, 1]);
  const items = [
    {
      title: 'Liquidação',
      when: `esperada a ${date(CYCLE.expected)}`,
      body: `Vendido e cobrado dentro da janela, que fecha a ${date(CYCLE.end)}.`,
      swatch: <span aria-hidden className="inline-block h-2.5 w-4 rounded-[2px] bg-world-ink" />,
    },
    {
      title: 'Extensão condicionada',
      when: `até ${date(CYCLE.extendedEnd)}`,
      body: `Uma vez, até ${CYCLE.extensionMonths} meses, se no mês ${CYCLE.months} o índice de origem estiver 15 % ou mais abaixo do da abertura (${num(CYCLE.indexAtOpen, 2)} → ${kgEur(CYCLE.indexFloor)}) ou mais de 30 % do stock por vender.`,
      swatch: (
        <svg aria-hidden className="h-2.5 w-4 shrink-0 overflow-hidden rounded-[2px] border border-world-ink">
          <defs>
            <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--world-ink)" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${hatchId})`} />
        </svg>
      ),
    },
    {
      title: 'Refinanciamento da armazenagem',
      when: 'plano de resposta do lote',
      body: `Com o índice 15 % abaixo do da abertura durante 10 dias úteis, a Sprout pode propor uma nova ronda, a ${pct(CYCLE.refundingCostPct, 1)} do lote. Pode não recuperar a perda.`,
      swatch: <span aria-hidden className="inline-block h-2.5 w-4 rounded-[2px] border border-world-ink" />,
    },
  ];
  return (
    <div className="relative min-w-0 pl-5">
      <span className="sr-only">No fim da janela, três caminhos:</span>
      <motion.span aria-hidden className="absolute bottom-3 left-0 top-0 w-0.5 origin-top bg-world-ink" style={{ scaleY: drawn ? 1 : stem }} />
      <ul className="flex flex-col gap-4">
        {items.map((it, i) => (
          <ForkItem key={it.title} index={i} progress={progress} drawn={drawn} {...it} />
        ))}
      </ul>
    </div>
  );
}

function ForkItem({ index, progress, drawn, title, when, body, swatch }: { index: number; progress: MotionValue<number>; drawn: boolean; title: string; when: string; body: ReactNode; swatch: ReactNode }) {
  const start = 0.2 + index * 0.22;
  const tick = useRange(progress, [start, start + 0.3], [0, 1]);
  return (
    <li className="relative min-w-0">
      <motion.span aria-hidden className="absolute -left-5 top-[0.7em] h-0.5 w-4 origin-left bg-world-ink" style={{ scaleX: drawn ? 1 : tick }} />
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-fg">
        {swatch}
        {title}
        <span className="font-mono text-xs font-normal text-muted tnum">{when}</span>
      </p>
      <p className="mt-1 text-sm leading-snug text-muted">{typeof body === 'string' ? tidyText(body) : body}</p>
    </li>
  );
}

/** Legenda da faixa: as mesmas amostras da HarvestBand, numa linha. */
function BandLegend() {
  const hatchId = `h${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
      <li className="inline-flex items-center gap-1.5">
        <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: 'color-mix(in oklab, var(--world) 26%, var(--surface))' }} />
        Colheita e extração
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: 'color-mix(in oklab, var(--world) 9%, var(--surface))' }} />
        Armazenagem e vendas
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span aria-hidden className="inline-block h-2 w-4 rounded-[2px] bg-world-ink" />
        Janela de {CYCLE.months} meses
      </li>
      <li className="inline-flex items-center gap-1.5">
        <svg aria-hidden className="h-2.5 w-4 overflow-hidden rounded-[2px] border border-world-ink">
          <defs>
            <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--world-ink)" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${hatchId})`} />
        </svg>
        Extensão de {CYCLE.extensionMonths} meses
      </li>
    </ul>
  );
}
