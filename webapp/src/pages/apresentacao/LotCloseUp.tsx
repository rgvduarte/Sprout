import { motion, useTransform, type MotionValue } from 'motion/react';
import { Chapter, EASE_OUT, JourneyTrack, LotGauge } from '../../components/game';
import { RiskNote, TextLink } from '../../components/ui';
import { fundedFraction } from '../../data';
import type { TelemetryUnit } from '../../data/types';
import { useData, useFeed } from '../../state';
import { useNow } from '../../lib/clock';
import { eur, kg, num, pct, relative } from '../../lib/format';
import { physicalForAmount } from '../../lib/physical';
import { cn } from '../../lib/cn';
import { FOCUS_LOT_ID, FOCUS_PRODUCER_ID, LAGAR } from './model';
import { ChapterHead, Frame } from './parts';

/* =====================================================================
   3 · Um lote, de perto. Os depósitos do lagar enchem-se até à leitura real
   da telemetria, o IBC do lote enche-se até ao financiamento e a jornada
   acende os marcos cumpridos. A linha "ao vivo" segue o Diário de campanha.
   ===================================================================== */

export function LotChapter({ tall }: { tall: boolean }) {
  return (
    <Chapter id="lote" label="Um lote" heightVh={250} static={!tall} stickyClassName="pt-14 pb-4" className="bg-[color-mix(in_oklab,var(--c-azeite)_5%,var(--bg))]">
      {(progress) => <LotScene progress={progress} />}
    </Chapter>
  );
}

function LotScene({ progress }: { progress: MotionValue<number> }) {
  const { getLot, telemetry } = useData();
  const lot = getLot(FOCUS_LOT_ID)!;
  const units = telemetry[FOCUS_PRODUCER_ID] ?? [];
  const funded = fundedFraction(lot);
  const tanks = useTransform(progress, [0.02, 0.4], [0, 1]);
  const gauge = useTransform(progress, [0.3, 0.66], [0, funded]);
  const journey = useTransform(progress, [0.6, 0.9], [0, 1]);

  return (
    <Frame>
      <div data-world="azeite" className="min-w-0">
        <ChapterHead
          title="Um lote, de perto"
          lead={`O ${lot.id} são ${kg(lot.quantity)} de virgem extra ${LAGAR.variedades}, moídos a 05/10 no ${LAGAR.nome}, em ${LAGAR.localidade}. O azeite já existe e está medido; o que se financia é a compra e o caminho até ao comprador.`}
        />
        <div className="mt-8 grid min-w-0 gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <section aria-labelledby="apr-depositos" className="min-w-0">
            <h3 id="apr-depositos" className="text-[1.1875rem]">Depósitos do lagar, por telemetria</h3>
            <Tanks units={units} progress={tanks} lotKg={lot.quantity} />
            <LiveLine />
          </section>
          <section aria-labelledby="apr-missao" className="min-w-0">
            <h3 id="apr-missao" className="text-[1.1875rem]">Missão: encher o depósito</h3>
            <div className="mt-4 flex min-w-0 flex-col gap-6 sm:flex-row sm:items-end">
              <LotGauge kind="ibc" value={funded} progress={gauge} size="md" label={`Financiamento do lote ${lot.id}`} valueText={pct(funded)} className="shrink-0 self-start sm:self-auto [&_svg]:w-[176px]" />
              <FundingFacts />
            </div>
          </section>
        </div>
        <div className="mt-10 min-w-0">
          <h3 className="sr-only">Jornada do lote</h3>
          <JourneyTrack lot={lot} progress={journey} compact />
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------ depósitos */

const TANK = { w: 72, h: 150, gap: 30, top: 14, x0: 8 };

function Tanks({ units, progress, lotKg }: { units: TelemetryUnit[]; progress: MotionValue<number>; lotKg: number }) {
  const width = TANK.x0 * 2 + units.length * TANK.w + (units.length - 1) * TANK.gap;
  const lotUnits = ['D1', 'D2'];
  const bracketTo = TANK.x0 + 2 * TANK.w + TANK.gap;
  const height = TANK.top + TANK.h + 36;
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
  const { w, h, top } = TANK;
  const line = 'color-mix(in oklab, var(--fg) 55%, var(--surface))';
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} rx={6} fill="color-mix(in oklab, var(--fg) 5%, var(--surface))" stroke={inLot ? 'var(--world-ink)' : line} strokeWidth={inLot ? 1.75 : 1.25} />
      <motion.g style={{ scaleY: progress, transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
        <motion.rect
          x={x + 3}
          y={top + 3}
          width={w - 6}
          height={h - 6}
          rx={4}
          fill="var(--world)"
          opacity={0.9}
          initial={false}
          animate={{ scaleY: fraction }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        />
      </motion.g>
      {/* graduações a cada 25 % */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={x + 4} x2={x + 12} y1={top + h * (1 - t)} y2={top + h * (1 - t)} stroke={line} strokeWidth="1.25" />
      ))}
      <ellipse cx={x + w / 2} cy={top} rx={w / 2 - 2} ry={5} fill="var(--surface)" stroke={line} strokeWidth="1.25" />
    </g>
  );
}

/** Última leitura do lagar no Diário de campanha. */
function LiveLine() {
  const { events } = useData();
  const feed = useFeed();
  const nowValue = useNow(15_000);
  const latest = events.find((e) => e.producerId === FOCUS_PRODUCER_ID && (e.kind === 'telemetria' || e.kind === 'rececao'));
  if (!latest) return null;
  return (
    <p className="mt-5 flex min-w-0 max-w-[460px] items-start gap-2.5 text-sm" aria-live="polite">
      <span aria-hidden className={cn('mt-[0.4em] size-2 shrink-0 rounded-full', feed.paused ? 'bg-border' : 'bg-ok')} />
      <span className="min-w-0">
        <span className="font-medium text-fg">{latest.title}</span>
        <span className="text-muted">
          {' '}
          · {relative(latest.at, nowValue)} · {feed.paused ? (feed.pauseReason === 'reduced-motion' ? 'diário em pausa (movimento reduzido)' : 'diário em pausa') : 'ao vivo'}
        </span>
      </span>
    </p>
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
      <p className="mt-1 text-sm text-muted">financiado pelos co-financiadores</p>
      <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted">Montante financiado</dt>
        <dd className="font-mono text-fg tnum">
          {eur(f.raised)} de {eur(f.goal)}
        </dd>
        <dt className="text-muted">Co-financiadores</dt>
        <dd className="font-mono text-fg tnum">{num(f.coFinancers)}</dd>
        <dt className="text-muted">Bilhete mínimo</dt>
        <dd className="text-fg">
          <span className="font-mono tnum">{eur(f.minTicket)}</span> <span className="text-muted">= {ticket.primary}, {ticket.secondary}</span>
        </dd>
      </dl>
      <RiskNote compact className="mt-4" />
      <TextLink to={`/lote/${lot.id}`} className="mt-2 inline-flex min-h-11 items-center">
        Abrir a jornada do {lot.id}
      </TextLink>
    </div>
  );
}
