import { useId } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { Chapter, HarvestBand } from '../../components/game';
import { getLot, REFUNDING_PLAYBOOKS } from '../../data';
import { addMonths } from '../../lib/clock';
import { date, lisbonParts, monthYear, pct } from '../../lib/format';
import { cn } from '../../lib/cn';
import { CYCLE, FOCUS_LOT_ID } from './model';
import { ChapterHead, Frame, useStep } from './parts';

/* =====================================================================
   4 · O ciclo de 18 meses. O cursor percorre a janela do lote sobre a
   campanha agrícola (compra → armazenagem → vendas B2B → liquidação) e,
   no mês 18, desenha a bifurcação: liquidação, extensão ou refunding.
   ===================================================================== */

const PHASES = [
  { n: 1, name: 'Compra', from: 0, to: 1, text: 'O financiamento fecha e a Sprout paga o lagar. Os 24 000 kg passam para 24 IBC selados com o número do lote.' },
  { n: 2, name: 'Armazenagem', from: 1, to: 3, text: 'IBC em nave fresca e sem luz, a 15–18 °C. Inventário mensal com fotografia e reanálise a cada 4 meses.' },
  { n: 3, name: 'Vendas B2B', from: 3, to: 11, text: CYCLE.forwardNote },
  { n: 4, name: 'Cobrança e liquidação', from: 11, to: 18, text: `Os compradores pagam para a conta segregada. Depois da reconciliação, a liquidação aos co-financiadores está prevista para ${date(CYCLE.end)}.` },
] as const;

const PHASE_TONE = [34, 54, 76, 100];

const extended = getLot('AZ-2025-017');
const lossCase = getLot('AZ-2025-009');
const playbook = REFUNDING_PLAYBOOKS.find((p) => p.id === getLot(FOCUS_LOT_ID)?.refundingPlaybookId);

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
    <Chapter id="ciclo" label="18 meses" heightVh={230} static={!tall} stickyClassName="pt-14 pb-4">
      {(progress, rich) => <CycleScene progress={progress} rich={rich} />}
    </Chapter>
  );
}

function CycleScene({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const cursor = useTransform(progress, [0.06, 0.78], [0, 1]);
  const fork = useTransform(progress, [0.76, 0.94], [0, 1]);
  const month = useStep(cursor, (v) => Math.round(Math.max(0, Math.min(1, v)) * CYCLE.months));
  const activePhase = rich ? (month >= CYCLE.months ? 3 : PHASES.findIndex((p) => month >= p.from && month < p.to)) : -1;
  const forkOn = useStep(fork, (v) => (v > 0.02 ? 1 : 0));

  return (
    <Frame>
      <div data-world="azeite" className="min-w-0">
        <ChapterHead
          title="O ciclo de 18 meses"
          lead="Do fecho do financiamento à liquidação prevista, desenhado sobre a campanha agrícola. Se o mês 18 chega com o preço em baixo ou stock por vender, o contrato prevê dois caminhos, e nenhum deles garante o capital."
        />

        <p className="mt-8 font-mono text-sm text-fg tnum" aria-hidden={rich ? true : undefined}>
          {rich ? (
            <>
              Mês {month} de {CYCLE.months} · {monthYear(addMonths(CYCLE.start, month))}
              <span className="text-muted"> · {month >= CYCLE.months ? 'fim da janela' : PHASES[activePhase]?.name}</span>
            </>
          ) : (
            <>
              Janela de {date(CYCLE.start)} a {date(CYCLE.end)} · lote {FOCUS_LOT_ID}
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
                  className="absolute inset-x-0 bottom-0 h-2.5 rounded-[2px] transition-opacity duration-200"
                  style={{ background: `color-mix(in oklab, var(--world-ink) ${PHASE_TONE[i]}%, var(--surface))`, opacity: on ? 1 : 0.35 }}
                />
              </div>
            );
          })}
        </div>
        <HarvestBand world="azeite" start={CYCLE.start} months={CYCLE.months} extensionMonths={CYCLE.extensionMonths} progress={rich ? cursor : undefined} className="mt-2" />

        <div className="mt-8 grid min-w-0 gap-x-6 gap-y-8 md:grid-cols-[minmax(0,var(--fork))_minmax(0,1fr)]" style={{ ['--fork' as string]: `${FORK_X * 100}%` }}>
          <ol className="grid min-w-0 gap-x-5 gap-y-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Fases da janela">
            {PHASES.map((p, i) => (
              <li key={p.n} className="min-w-0">
                <p className={cn('font-semibold transition-colors duration-200', activePhase === -1 || activePhase === i ? 'text-fg' : 'text-muted')}>
                  <span className="mr-1.5 font-mono text-sm tnum text-muted">{p.n}</span>
                  {p.name}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted tnum">
                  {monthYear(addMonths(CYCLE.start, p.from))} – {monthYear(addMonths(CYCLE.start, p.to))}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
              </li>
            ))}
          </ol>
          <Fork progress={fork} drawn={!rich || forkOn === 1} />
        </div>

        {lossCase?.settlement.settledResult !== undefined && (
          <p className="measure mt-8 text-sm leading-relaxed text-muted">
            <strong className="font-semibold text-fg">Nenhum caminho garante o capital.</strong> O {lossCase.id} liquidou a {date(lossCase.settlement.settledAt!)} com {pct(lossCase.settlement.settledResult, 1, { sign: true })}, depois de a reserva de primeira perda absorver 5 % do valor do lote.
          </p>
        )}
      </div>
    </Frame>
  );
}

function Fork({ progress, drawn }: { progress: MotionValue<number>; drawn: boolean }) {
  const hatchId = useId().replace(/:/g, '');
  const stem = useTransform(progress, [0, 0.5], [0, 1]);
  const items = [
    {
      title: 'Liquidação prevista',
      when: date(CYCLE.end),
      body: 'O lote está vendido e cobrado dentro da janela.',
      swatch: <span aria-hidden className="inline-block h-2.5 w-4 rounded-[2px] bg-world-ink" />,
    },
    {
      title: 'Extensão condicionada',
      when: `até ${date(CYCLE.extendedEnd)}`,
      body: `Uma vez, até ${CYCLE.extensionMonths} meses, se no mês 18 a referência estiver 15 % ou mais abaixo da entrada ou mais de 30 % do stock estiver por vender.${extended?.settlement.extendedTo ? ` Hoje: ${extended.id}, estendido até ${date(extended.settlement.extendedTo)}.` : ''}`,
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
      title: 'Refunding',
      when: 'playbook do lote',
      body: `${playbook ? `Gatilho: ${playbook.trigger.charAt(0).toLowerCase()}${playbook.trigger.slice(1)} ` : ''}Cobertura seguinte, revisão da reserva e, se preciso, uma nova ronda que refinancia a armazenagem. Custa ${pct(CYCLE.refundingCostPct, 1)} do lote e pode não recuperar a perda.`,
      swatch: <span aria-hidden className="inline-block h-2.5 w-4 rounded-[2px] border border-world-ink" />,
    },
  ];
  return (
    <div className="relative min-w-0 pl-5">
      <span className="sr-only">No mês 18, três caminhos:</span>
      <motion.span aria-hidden className="absolute bottom-3 left-0 top-0 w-0.5 origin-top bg-world-ink" style={{ scaleY: drawn ? 1 : stem }} />
      <ul className="flex flex-col gap-5">
        {items.map((it, i) => (
          <ForkItem key={it.title} index={i} progress={progress} drawn={drawn} {...it} />
        ))}
      </ul>
    </div>
  );
}

function ForkItem({ index, progress, drawn, title, when, body, swatch }: { index: number; progress: MotionValue<number>; drawn: boolean; title: string; when: string; body: string; swatch: React.ReactNode }) {
  const start = 0.2 + index * 0.22;
  const tick = useTransform(progress, [start, start + 0.3], [0, 1]);
  return (
    <li className="relative min-w-0">
      <motion.span aria-hidden className="absolute -left-5 top-[0.7em] h-0.5 w-4 origin-left bg-world-ink" style={{ scaleX: drawn ? 1 : tick }} />
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-fg">
        {swatch}
        {title}
        <span className="font-mono text-xs font-normal text-muted tnum">{when}</span>
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </li>
  );
}
