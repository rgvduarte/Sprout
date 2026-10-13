import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PRODUCERS, getRegion } from '../../data';
import type { Producer, TelemetryUnit } from '../../data';
import { LotGauge, EASE_OUT } from '../../components/game';
import { TextLink } from '../../components/ui';
import { useData, useFeed } from '../../state';
import { cn } from '../../lib/cn';
import { num } from '../../lib/format';

/* =====================================================================
   "Agora nos produtores": os depósitos de inox dos lagares e os armazéns
   das nascentes, ao nível da telemetria. Cada leitura do Diário mexe aqui.
   É o momento focal do Início: a campanha a encher.
   ===================================================================== */

const LINE = 'color-mix(in oklab, var(--fg) 50%, var(--surface))';

/** Depósito de inox (cilindro com fundo cónico e pernas), cheio até ao nível. */
function Tank({ unit, delay }: { unit: TelemetryUnit; delay: number }) {
  const reduce = useReducedMotion();
  const clip = `tank-${useId().replace(/:/g, '')}`;
  const v = unit.capacity > 0 ? Math.max(0, Math.min(1, unit.level / unit.capacity)) : 0;
  const [mounted, setMounted] = useState(reduce);
  const [entered, setEntered] = useState(reduce);
  useEffect(() => {
    if (reduce) return;
    const t = window.setTimeout(() => setMounted(true), 30);
    return () => window.clearTimeout(t);
  }, [reduce]);
  const shown = mounted ? v : 0;
  const full = v >= 0.999;
  return (
    <svg
      role="img"
      aria-label={`${unit.label}: ${num(unit.level)} de ${num(unit.capacity)} kg${full ? ', cheio' : ''}`}
      viewBox="0 0 26 60"
      className="block h-[60px] w-[26px] shrink-0 overflow-visible"
    >
      <title>{`${unit.label} · ${num(unit.level)} / ${num(unit.capacity)} kg`}</title>
      <defs>
        <clipPath id={clip}>
          <path d="M3 7 L23 7 L23 44 L13 51 L3 44 Z" />
        </clipPath>
      </defs>
      <path d="M3 7 L23 7 L23 44 L13 51 L3 44 Z" fill="color-mix(in oklab, var(--fg) 4%, var(--surface))" />
      <g clipPath={`url(#${clip})`}>
        <motion.rect
          x="3"
          y="7"
          width="20"
          height="44"
          fill="var(--c-azeite)"
          initial={false}
          animate={{ scaleY: shown }}
          style={{ originY: 1 }}
          transition={{ duration: reduce ? 0 : 0.7, delay: reduce || entered ? 0 : delay, ease: EASE_OUT }}
          onAnimationComplete={() => mounted && setEntered(true)}
        />
      </g>
      {/* corpo, tampa e pernas */}
      <path d="M3 7 L23 7 L23 44 L13 51 L3 44 Z" fill="none" stroke={LINE} strokeWidth="1.25" strokeLinejoin="round" />
      <ellipse cx="13" cy="7" rx="10" ry="2.6" fill="var(--surface)" stroke={LINE} strokeWidth="1.25" />
      <path d="M5 45.5 L4 59 M21 45.5 L22 59" stroke={LINE} strokeWidth="1.25" strokeLinecap="round" />
      {/* visor de nível */}
      <line x1="20" y1="12" x2="20" y2="40" stroke={LINE} strokeWidth="0.75" opacity="0.6" />
    </svg>
  );
}

function useDelta(total: number) {
  const prev = useRef(total);
  const [delta, setDelta] = useState<{ value: number; key: number } | null>(null);
  useEffect(() => {
    const d = total - prev.current;
    prev.current = total;
    if (d <= 0) return;
    setDelta({ value: d, key: Date.now() });
    const t = window.setTimeout(() => setDelta(null), 3200);
    return () => window.clearTimeout(t);
  }, [total]);
  return delta;
}

function ProducerBlock({ producer, units, index }: { producer: Producer; units: TelemetryUnit[]; index: number }) {
  const reduce = useReducedMotion();
  const isOlive = producer.telemetry.kind === 'depositos';
  const total = units.reduce((s, u) => s + u.level, 0);
  const capacity = units.reduce((s, u) => s + u.capacity, 0);
  const delta = useDelta(total);
  const unitWord = isOlive ? 'kg' : 'paletes';
  const region = getRegion(producer.regionId);
  return (
    <li className="min-w-0 py-3 first:pt-0 last:pb-0 sm:py-0" data-world={producer.world}>
      <p className="truncate text-sm font-medium leading-tight text-fg">{producer.nome}</p>
      <p className="truncate text-xs leading-5 text-muted">
        {producer.localidade} · {region?.nome}
      </p>
      <div className="mt-2 flex items-end gap-3">
        {isOlive ? (
          <div className="flex items-end gap-1.5" aria-label={`${units.length} depósitos`} role="group">
            {units.map((u, i) => (
              <Tank key={u.id} unit={u} delay={Math.min(0.35, 0.03 * (index * 4 + i))} />
            ))}
          </div>
        ) : (
          <LotGauge kind="pallet" size="sm" value={capacity ? total / capacity : 0} label={`Armazém de ${producer.nome}`} valueText={`${num(total)} de ${num(capacity)} paletes`} animateOnMount={!reduce} />
        )}
        <div className="min-w-0 pb-0.5">
          <p className="font-mono text-sm leading-tight text-fg tnum">
            {num(total)} {unitWord}
          </p>
          <p className="text-xs leading-5 text-muted">{isOlive ? `em ${units.length} depósitos` : `de ${num(capacity)} no armazém`}</p>
          <p className="h-5 text-xs leading-5" aria-hidden>
            <AnimatePresence>
              {delta && (
                <motion.span
                  key={delta.key}
                  className="inline-block font-mono tnum text-world-ink"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                  +{num(delta.value)} {unitWord}
                </motion.span>
              )}
            </AnimatePresence>
          </p>
        </div>
      </div>
    </li>
  );
}

const LIVE = PRODUCERS.filter((p) => p.fase === 1 && p.telemetry.kind !== 'nenhuma');

export function ProducerTanks({ className }: { className?: string }) {
  const { telemetry } = useData();
  const feed = useFeed();
  const olive = LIVE.filter((p) => p.world === 'azeite');
  const water = LIVE.filter((p) => p.world === 'agua');
  const oliveTotal = olive.reduce((s, p) => s + (telemetry[p.id] ?? []).reduce((a, u) => a + u.level, 0), 0);
  return (
    <section className={cn('min-w-0', className)} aria-labelledby="agora-title">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="agora-title" className="text-[1.1875rem] leading-tight">
          Agora nos produtores
        </h2>
        <p className="flex items-center gap-2 text-sm text-muted">
          <span aria-hidden className={cn('size-2 rounded-full', feed.paused ? 'bg-muted' : 'bg-ok')} />
          {feed.paused ? (feed.pauseReason === 'reduced-motion' ? 'Telemetria em pausa (movimento reduzido)' : 'Telemetria em pausa') : 'Telemetria em direto'}
        </p>
      </div>
      <p className="mb-4 text-sm text-muted">
        <span className="font-mono text-fg tnum">{num(oliveTotal)} kg</span> de azeite novo nos depósitos dos{' '}
        <TextLink to="/mercados/azeite">{olive.length} lagares</TextLink>{' '}
        do piloto. Cada leitura entra no Diário de campanha.
      </p>
      <ul className="grid min-w-0 grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5 sm:divide-y-0">
        {olive.map((p, i) => (
          <ProducerBlock key={p.id} producer={p} units={telemetry[p.id] ?? p.telemetry.units} index={i} />
        ))}
        {water.map((p, i) => (
          <ProducerBlock key={p.id} producer={p} units={telemetry[p.id] ?? p.telemetry.units} index={olive.length + i} />
        ))}
      </ul>
    </section>
  );
}
