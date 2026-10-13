import { useEffect, useLayoutEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { Chapter, EASE_OUT, JourneyTrack, LotGauge } from '../../components/game';
import { RiskNote, TextLink } from '../../components/ui';
import { fundedFraction } from '../../data';
import type { TelemetryUnit } from '../../data/types';
import { useCampaignEvents, useData, useFeed, useTelemetry } from '../../state';
import { useNow } from '../../lib/clock';
import { date, eur, kg, num, pct, relative, tidyText } from '../../lib/format';
import { physicalForAmount } from '../../lib/physical';
import { cn } from '../../lib/cn';
import { FOCUS_LOT_ID, FOCUS_PRODUCER_ID, LAGAR } from './model';
import { ChapterHead, Frame, useRange } from './parts';

/* =====================================================================
   3 · Um lote, de perto. Os depósitos do lagar enchem-se até à leitura real
   da telemetria e o IBC do lote até ao financiamento enquanto o capítulo
   entra no ecrã: quando fica fixo, os desenhos já mostram o estado real.
   Com o capítulo fixo, a jornada acende os marcos cumpridos. Os números
   impressos são sempre os reais. Lote de demonstração, dados fictícios.
   ===================================================================== */

export function LotChapter({ tall }: { tall: boolean }) {
  return (
    <Chapter id="lote" label="Um lote" heightVh={170} static={!tall} stickyClassName="pt-14 pb-4" className="bg-[color-mix(in_oklab,var(--c-azeite)_5%,var(--bg))]">
      {(progress, rich) => <LotScene progress={progress} rich={rich} />}
    </Chapter>
  );
}

function LotScene({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const { getLot } = useData();
  const lot = getLot(FOCUS_LOT_ID)!;
  const funded = fundedFraction(lot);
  const milled = lot.milestones.find((m) => m.stage === 'colhido')?.date;

  // entrada do capítulo: do topo da secção no fundo do ecrã até ao topo (o momento em que fixa)
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    sectionRef.current = rootRef.current?.closest('section') ?? null;
  }, []);
  const { scrollYProgress: entry } = useScroll({ target: sectionRef, offset: ['start end', 'start start'] });
  const fillBase = rich ? entry : progress;
  const tanks = useRange(fillBase, [0.3, 0.9], [0, 1]);
  const gauge = useRange(fillBase, [0.45, 1], [0, funded]);
  const journey = useRange(progress, [0.05, 0.6], [0, 1]);

  return (
    <Frame>
      <div ref={rootRef} data-world="azeite" className="min-w-0">
        <ChapterHead
          title="Um lote, de perto"
          lead={`O ${lot.id} são ${kg(lot.quantity)} de virgem extra ${LAGAR.variedades}${milled ? `, moídos a ${date(milled).slice(0, 5)}` : ''} no ${LAGAR.nome}, em ${LAGAR.localidade}. O azeite já existe e está analisado; o que se financia é a compra, o embalamento e o caminho até ao cliente.`}
        />
        <p className="mt-3 max-w-[60ch] text-sm text-muted">Lote de demonstração, com dados fictícios. O piloto começa em fevereiro de 2027, com capital próprio.</p>
        <div className="mt-8 grid min-w-0 gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <section aria-labelledby="apr-depositos" className="min-w-0">
            <h3 id="apr-depositos" className="text-[1.1875rem]">Depósitos do lagar, por telemetria</h3>
            <Tanks progress={tanks} lotKg={lot.quantity} />
            <LiveLine />
          </section>
          <section aria-labelledby="apr-financiamento" className="min-w-0">
            <h3 id="apr-financiamento" className="text-[1.1875rem]">Financiamento do lote</h3>
            <div className="mt-4 flex min-w-0 flex-col gap-6 sm:flex-row sm:items-end">
              <LotGauge kind="ibc" value={funded} progress={gauge} size="md" label={`Financiamento do lote ${lot.id}`} valueText={pct(funded)} className="shrink-0 self-start sm:self-auto [&_svg]:w-[176px]" />
              <FundingFacts />
            </div>
          </section>
        </div>
        <div className="mt-10 min-w-0">
          <h3 className="sr-only">Jornada do lote</h3>
          {/* sem scroll, a jornada mostra o estado real (o componente só acende marcos quando o progresso muda) */}
          <JourneyTrack lot={lot} progress={rich ? journey : undefined} compact />
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------ depósitos */

const TANK = { w: 72, h: 150, gap: 30, top: 14, x0: 8 };

/** Widget de telemetria: só ele volta a desenhar a cada leitura do Diário. */
function Tanks({ progress, lotKg }: { progress: MotionValue<number>; lotKg: number }) {
  const telemetry = useTelemetry();
  const units: TelemetryUnit[] = telemetry[FOCUS_PRODUCER_ID] ?? [];
  const width = TANK.x0 * 2 + units.length * TANK.w + Math.max(0, units.length - 1) * TANK.gap;
  const lotUnits = ['D1', 'D2'];
  const bracketTo = TANK.x0 + 2 * TANK.w + TANK.gap;
  const height = TANK.top + TANK.h + 44;
  return (
    <figure className="mt-4 min-w-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full max-w-[460px]" role="img" aria-label={`Depósitos do ${LAGAR.nome}: ${units.map((u) => `${u.label} com ${kg(u.level)} de ${kg(u.capacity)}`).join('; ')}. O lote ${FOCUS_LOT_ID} ocupa os depósitos 1 e 2.`}>
        {units.map((u, i) => (
          <Tank key={u.id} unit={u} x={TANK.x0 + i * (TANK.w + TANK.gap)} progress={progress} inLot={lotUnits.includes(u.id)} />
        ))}
        {/* o lote nos depósitos 1 e 2 */}
        <path d={`M${TANK.x0} ${TANK.top + TANK.h + 14} v8 H${bracketTo} v-8`} fill="none" stroke="var(--world-ink)" strokeWidth="1.5" />
        <text x={TANK.x0} y={TANK.top + TANK.h + 36} fontSize="13" fontFamily="var(--font-sans)" fontWeight={600} fill="var(--fg)">
          {FOCUS_LOT_ID} · {kg(lotKg)}
        </text>
      </svg>
      <figcaption className="mt-3 grid max-w-[460px] grid-cols-4 gap-2 text-sm">
        {units.map((u) => (
          <div key={u.id} className="min-w-0">
            <p className="font-medium text-fg">{u.label.replace('Depósito ', 'D')}</p>
            <p className="font-mono text-[13px] text-fg tnum">{kg(u.level)}</p>
            <p className="text-[13px] text-muted">{u.level >= u.capacity ? 'cheio' : u.level === 0 ? 'vazio' : `${Math.round((u.level / u.capacity) * 100)} %`}</p>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

function Tank({ unit, x, progress, inLot }: { unit: TelemetryUnit; x: number; progress: MotionValue<number>; inLot: boolean }) {
  const fraction = unit.capacity ? Math.min(1, unit.level / unit.capacity) : 0;
  const reduce = useReducedMotion();
  // nível da telemetria (anima quando chega uma leitura) × enchimento da entrada
  const level = useMotionValue(fraction);
  useEffect(() => {
    if (reduce) {
      level.set(fraction);
      return;
    }
    const c = animate(level, fraction, { duration: 0.8, ease: EASE_OUT });
    return () => c.stop();
  }, [fraction, level, reduce]);
  const fill = useTransform([progress, level], ([p, l]: number[]) => p * l);
  const { w, h, top } = TANK;
  const line = 'color-mix(in oklab, var(--fg) 55%, var(--surface))';
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} rx={6} fill="color-mix(in oklab, var(--fg) 5%, var(--surface))" stroke={inLot ? 'var(--world-ink)' : line} strokeWidth={inLot ? 1.75 : 1.25} />
      <motion.rect x={x + 3} y={top + 3} width={w - 6} height={h - 6} rx={4} fill="var(--world)" opacity={0.9} style={{ scaleY: fill, originX: 0.5, originY: 1 }} />
      {/* graduações a cada 25 % */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={x + 4} x2={x + 12} y1={top + h * (1 - t)} y2={top + h * (1 - t)} stroke={line} strokeWidth="1.25" />
      ))}
      <ellipse cx={x + w / 2} cy={top} rx={w / 2 - 2} ry={5} fill="var(--surface)" stroke={line} strokeWidth="1.25" />
    </g>
  );
}

/** Última leitura do lagar no Diário de campanha (widget do Diário). */
function LiveLine() {
  const events = useCampaignEvents();
  const feed = useFeed();
  const nowValue = useNow(15_000);
  const latest = events.find((e) => e.producerId === FOCUS_PRODUCER_ID && (e.kind === 'telemetria' || e.kind === 'rececao'));
  if (!latest) return null;
  return (
    <div className="mt-5 min-w-0 max-w-[460px] border-t border-border pt-3 text-sm" aria-live="polite">
      <p className="flex items-center gap-2 text-[13px] text-muted">
        <span aria-hidden className={cn('size-2 shrink-0 rounded-full', feed.paused ? 'bg-border' : 'bg-ok')} />
        {feed.paused ? 'Diário em pausa' : 'Ao vivo, em demonstração'} · {relative(latest.at, nowValue)}
      </p>
      <p className="mt-1 font-medium text-fg">{latest.title}</p>
    </div>
  );
}

/* ------------------------------------------------------------ financiamento */

function FundingFacts() {
  const { getLot } = useData();
  const lot = getLot(FOCUS_LOT_ID)!;
  const f = lot.funding;
  const ticket = physicalForAmount(lot, f.minTicket);
  return (
    <div className="min-w-0 pb-1">
      <p className="font-display text-[2rem] font-bold leading-none text-fg">{pct(fundedFraction(lot))}</p>
      <p className="mt-1 text-sm text-muted">financiado pelos cofinanciadores</p>
      <dl className="mt-4 flex flex-col gap-2.5 text-sm">
        <div>
          <dt className="text-muted">Montante financiado</dt>
          <dd className="font-medium text-fg tnum">
            {eur(f.raised)} de {eur(f.goal)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Cofinanciadores</dt>
          <dd className="font-medium text-fg tnum">{num(f.coFinancers)}</dd>
        </div>
        <div>
          <dt className="text-muted">Investimento mínimo</dt>
          <dd className="font-medium text-fg tnum">
            {eur(f.minTicket)} <span className="font-normal text-muted">= {tidyText(`${ticket.primary}, ${ticket.secondary}`)}</span>
          </dd>
        </div>
      </dl>
      <RiskNote compact className="mt-4" />
      <TextLink to={`/lote/${lot.id}`} className="mt-2 inline-flex min-h-11 items-center">
        Abrir a jornada do {lot.id}
      </TextLink>
    </div>
  );
}
