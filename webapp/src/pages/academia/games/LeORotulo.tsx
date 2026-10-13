import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, X } from 'lucide-react';
import { Button } from '../../../components/ui';
import { WATER_LABELS } from '../../../data';
import type { WaterLabel } from '../../../data/types';
import { createRng } from '../../../lib/prng';
import { cn } from '../../../lib/cn';
import { num } from '../../../lib/format';
import { mineralizacaoTotal, SALINITY, salinityOf, WATER_EXTRA, WATER_QUESTION, type SalinityClass, type WaterField } from '../content';
import { Choice, EASE, Pips, ResultPanel, shuffle, Verdict, useFinishGame, type FinishResult } from './kit';

/* =====================================================================
   Lê o rótulo (água). Cinco rótulos: classe pela mineralização total
   (uso português: hipossalina a hipersalina) e uma pergunta sobre o
   que o rótulo pode ou tem de dizer (Diretiva 2009/54/CE).
   Um rótulo conta quando as duas respostas estão certas.
   ===================================================================== */

interface Answer {
  salinity?: SalinityClass;
  q2?: number;
}

export function LeORotulo() {
  const [round, setRound] = useState(0);
  return <RotuloGame key={round} round={round} onReplay={() => setRound((r) => r + 1)} />;
}

function RotuloGame({ round, onReplay }: { round: number; onReplay: () => void }) {
  const labels = useMemo(() => (round === 0 ? WATER_LABELS : shuffle(WATER_LABELS, createRng(`rotulo-${round}`))), [round]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<FinishResult | null>(null);
  const finish = useFinishGame('le-o-rotulo');

  const isRight = (w: WaterLabel) => {
    const a = answers[w.id];
    return a?.salinity === salinityOf(mineralizacaoTotal(w)) && a?.q2 === WATER_QUESTION[w.id].correct;
  };
  const end = () => {
    setResult(finish(labels.filter(isRight).length));
  };

  if (result) {
    return (
      <ResultPanel result={result} title="Rótulos lidos sem erros" onReplay={onReplay}>
        <h4 className="mb-2 text-base">Os cinco rótulos</h4>
        <ul className="divide-y divide-border border-y border-border">
          {labels.map((w) => {
            const ok = isRight(w);
            const mt = mineralizacaoTotal(w);
            return (
              <li key={w.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 py-3">
                <span aria-hidden className={cn('mt-0.5 inline-flex size-6 items-center justify-center rounded-full', ok ? 'bg-[color-mix(in_oklab,var(--ok)_16%,var(--surface))] text-ok-ink' : 'bg-[color-mix(in_oklab,var(--crit)_10%,var(--surface))] text-crit-ink')}>
                  {ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-fg">
                    {w.marca} · {SALINITY.find((s) => s.id === salinityOf(mt))!.label.toLowerCase()} ({num(mt)} mg/L)
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{WATER_QUESTION[w.id].explanation}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </ResultPanel>
    );
  }

  const w = labels[idx];
  const a = answers[w.id] ?? {};
  const mt = mineralizacaoTotal(w);
  const rightClass = salinityOf(mt);
  const q = WATER_QUESTION[w.id];
  const q1Done = a.salinity !== undefined;
  const q2Done = a.q2 !== undefined;
  const highlight = new Set<WaterField>([...(q1Done ? (['mt'] as WaterField[]) : []), ...(q2Done ? q.fields : [])]);
  const last = idx === labels.length - 1;

  return (
    <div className="min-w-0">
      <Pips
        label="Rótulos"
        className="mb-5"
        items={labels.map((x, i) => {
          const ax = answers[x.id];
          const finished = ax?.salinity !== undefined && ax?.q2 !== undefined;
          return { id: x.id, label: String(i + 1), state: finished ? (isRight(x) ? 'right' : 'wrong') : i === idx ? 'current' : 'todo' };
        })}
      />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <WaterLabelCard w={w} highlight={highlight} />
        <div className="min-w-0">
          <fieldset>
            <legend className="mb-2 font-medium text-fg">Pela mineralização total, esta água é…</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SALINITY.map((s) => (
                <Choice
                  key={s.id}
                  state={!q1Done ? 'idle' : s.id === a.salinity ? (a.salinity === rightClass ? 'right' : 'wrong') : s.id === rightClass ? 'missed' : 'dim'}
                  disabled={q1Done}
                  onClick={() => setAnswers((x) => ({ ...x, [w.id]: { ...x[w.id], salinity: s.id } }))}
                  hint={s.range}
                >
                  {s.label}
                </Choice>
              ))}
            </div>
          </fieldset>
          <SalinityRuler value={mt} revealed={q1Done} />
          {q1Done && (
            <Verdict className="mt-4" ok={a.salinity === rightClass} title={a.salinity === rightClass ? `Certo: ${SALINITY.find((s) => s.id === rightClass)!.label.toLowerCase()}.` : `É ${SALINITY.find((s) => s.id === rightClass)!.label.toLowerCase()}.`}>
              Mineralização total de {num(mt)} mg/L: a soma dos iões dissolvidos e da sílica. A menção europeia usa outro número, o resíduo seco ({num(w.residuoSeco)} mg/L):{' '}
              {w.residuoSeco <= 50 ? '«muito pouco mineralizada» (até 50).' : w.residuoSeco <= 500 ? '«pouco mineralizada» (até 500).' : w.residuoSeco > 1500 ? '«rica em sais minerais» (acima de 1 500).' : 'sem menção de mineralização (entre 500 e 1 500).'}
            </Verdict>
          )}

          {q1Done && (
            <motion.fieldset className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
              <legend className="mb-2 font-medium text-fg">{q.prompt}</legend>
              <div className="grid gap-2">
                {q.options.map((o, i) => (
                  <Choice
                    key={i}
                    state={!q2Done ? 'idle' : i === a.q2 ? (a.q2 === q.correct ? 'right' : 'wrong') : i === q.correct ? 'missed' : 'dim'}
                    disabled={q2Done}
                    onClick={() => setAnswers((x) => ({ ...x, [w.id]: { ...x[w.id], q2: i } }))}
                  >
                    {o}
                  </Choice>
                ))}
              </div>
            </motion.fieldset>
          )}
          {q2Done && (
            <div className="mt-4">
              <Verdict ok={a.q2 === q.correct} title={a.q2 === q.correct ? 'Certo.' : 'Não é essa.'}>
                {q.explanation}
              </Verdict>
              <Button className="mt-4" onClick={() => (last ? end() : setIdx((i) => i + 1))} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
                {last ? 'Ver o resultado' : 'Rótulo seguinte'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ rótulo */

function WaterLabelCard({ w, highlight }: { w: WaterLabel; highlight: Set<WaterField> }) {
  const x = WATER_EXTRA[w.id];
  const mt = mineralizacaoTotal(w);
  const anions: [string, number, WaterField?][] = [
    ['Bicarbonato (HCO₃⁻)', w.bicarbonato, 'bicarbonato'],
    ...(x.carbonato ? ([['Carbonato (CO₃²⁻)', x.carbonato]] as [string, number][]) : []),
    ['Cloreto (Cl⁻)', x.cloreto],
    ['Sulfato (SO₄²⁻)', x.sulfato],
    ['Nitrato (NO₃⁻)', x.nitrato],
    ['Fluoreto (F⁻)', w.fluoreto, 'fluoreto'],
  ];
  const cations: [string, number, WaterField?][] = [
    ['Sódio (Na⁺)', w.sodio, 'sodio'],
    ['Potássio (K⁺)', x.potassio],
    ['Cálcio (Ca²⁺)', w.calcio],
    ['Magnésio (Mg²⁺)', w.magnesio],
    ['Sílica (SiO₂)', w.silica],
  ];
  const fmt = (v: number) => new Intl.NumberFormat('pt-PT', { maximumFractionDigits: v < 1 ? 2 : 1, useGrouping: true }).format(v).replace(/\s/g, '\u00a0');
  const row = ([label, v, field]: [string, number, WaterField?]) => (
    <div key={label} className={cn('flex items-baseline justify-between gap-3 px-2 py-1 transition-colors duration-300', field && highlight.has(field) && 'rounded-xs bg-world-soft font-semibold')}>
      <dt className="min-w-0 truncate text-fg">{label}</dt>
      <dd className="font-mono text-fg tnum">{fmt(v)}</dd>
    </div>
  );
  const key = (label: string, value: string, field: WaterField) => (
    <div className={cn('rounded-xs px-2 py-1.5 transition-colors duration-300', highlight.has(field) && 'bg-world-soft')}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn('font-mono text-[0.9375rem] text-fg tnum', highlight.has(field) && 'font-semibold')}>{value}</dd>
    </div>
  );
  return (
    <article aria-label={`Rótulo de ${w.marca}`} className="min-w-0 self-start rounded-md border border-world-line bg-surface lg:sticky lg:top-20">
      <header className="flex items-start gap-3 border-b border-world-line px-4 py-3.5">
        <BottleMark className="h-14 w-8 shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-[1.375rem] font-bold leading-tight text-world-ink">{w.marca}</p>
          <p className={cn('mt-0.5 inline-block rounded-xs px-1 text-sm font-medium uppercase tracking-[0.04em] text-fg transition-colors duration-300', highlight.has('tipo') && 'bg-world-soft')}>Água {w.tipo}</p>
          <p className="text-sm text-muted">Origem: {w.origem}</p>
        </div>
      </header>
      <div className="px-2 py-3">
        <p className="px-2 text-xs font-medium uppercase tracking-[0.04em] text-muted">Composição química média (mg/L)</p>
        <div className="mt-1.5 grid gap-x-4 text-sm sm:grid-cols-2">
          <dl>{anions.map(row)}</dl>
          <dl>{cations.map(row)}</dl>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-1 border-t border-world-line pt-3 sm:grid-cols-4">
          {key('Mineralização total', `${num(mt)} mg/L`, 'mt')}
          {key('Resíduo seco a 180 °C', `${num(w.residuoSeco)} mg/L`, 'residuo')}
          {key('pH', num(w.ph, 1), 'ph')}
          {w.co2Livre ? key('CO₂ livre', `${num(w.co2Livre)} mg/L`, 'co2') : key('CO₂ livre', 'não tem', 'co2')}
        </dl>
      </div>
    </article>
  );
}

function BottleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 56" aria-hidden className={className}>
      <rect x="11" y="1" width="10" height="5" rx="1.2" fill="var(--c-agua)" />
      <path d="M12 6h8v5c0 3 6 5 6 12v26c0 3-2 5-5 5H11c-3 0-5-2-5-5V23c0-7 6-9 6-12z" fill="color-mix(in oklab, var(--c-agua) 10%, var(--surface))" stroke="color-mix(in oklab, var(--fg) 55%, var(--surface))" strokeWidth="1.25" />
      <path d="M6.6 30c3-1.5 6 1.5 9.4 0s6.4-1.5 9.4 0V49c0 2.5-1.8 4.2-4.4 4.2H11c-2.6 0-4.4-1.7-4.4-4.2z" fill="color-mix(in oklab, var(--c-agua) 34%, var(--surface))" />
    </svg>
  );
}

/* ------------------------------------------------------------ régua */

/** Régua das quatro classes (bandas ordinais, um só tom). O marcador cai na banda certa ao responder. */
function SalinityRuler({ value, revealed }: { value: number; revealed: boolean }) {
  const reduce = useReducedMotion();
  const idx = SALINITY.findIndex((s) => s.id === salinityOf(value));
  const band = SALINITY[idx];
  const within = Math.max(0.04, Math.min(0.96, (Math.min(value, band.to) - band.from) / (band.to - band.from)));
  const pos = ((idx + within) / SALINITY.length) * 100;
  return (
    <div className="mt-4" aria-hidden>
      <div className="relative pt-7">
        {revealed && (
          <motion.div
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${pos}%` }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <span className="whitespace-nowrap rounded-xs bg-fg px-1.5 font-mono text-xs leading-5 text-bg tnum">{num(value)} mg/L</span>
            <span className="h-2.5 w-0.5 bg-fg" />
          </motion.div>
        )}
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-xs">
          {SALINITY.map((s, i) => (
            <span key={s.id} className="flex-1" style={{ background: `color-mix(in oklab, var(--c-agua) ${[14, 32, 54, 78][i]}%, var(--surface))` }} />
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-4 gap-0.5 text-xs leading-tight text-muted">
          {SALINITY.map((s) => (
            <span key={s.id} className="min-w-0">
              <span className="block text-fg">{s.label}</span>
              <span className="font-mono tnum">{s.range}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
