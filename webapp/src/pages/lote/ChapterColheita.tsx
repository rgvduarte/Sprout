import { useCallback, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import { Check, FileText, Minus } from 'lucide-react';
import type { QualityAnalysis, QualityParam } from '../../data/types';
import { Chapter, LotGauge, SeasonTrack } from '../../components/game';
import { Badge, Button, Drawer, KeyValue } from '../../components/ui';
import { cn } from '../../lib/cn';
import { date as fmtDate, num } from '../../lib/format';
import { useFeed, useGame, useData } from '../../state';
import { stockLabel } from './model';
import { CheckMark, ChapterHeading, useDwell, useJourney, Wrap, CHROME_H } from './shared';

/* =====================================================================
   Capítulo 2 · Colheita e produção. O depósito enche com o scroll até ao
   stock real; o boletim de análises entra parâmetro a parâmetro ao lado
   dos limites legais. Chegar ao fim dá a missão "Lê o boletim".
   ===================================================================== */

const DECIMALS: Record<string, number> = {
  acidez: 2, peroxidos: 1, k232: 2, k268: 2, deltaK: 3, md: 1, mf: 1,
  residuo: 0, ph: 1, nitratos: 1, ecoli: 0, enterococos: 0, pseudomonas: 0,
  humidade: 1, cat1: 0, total: 0, sca: 2,
};

const fmtParam = (p: QualityParam, v: number) => `${num(v, DECIMALS[p.id] ?? 2)}${p.unit && p.unit !== '' && !p.unit.startsWith('ufc') && p.unit !== 'pts' ? (p.unit === '%' ? ' %' : '') : ''}`;

function ParamRow({ p, t }: { p: QualityParam; t: MotionValue<number> }) {
  const display = useTransform(t, (v) => (v <= 0.001 ? '—' : fmtParam(p, p.value * Math.min(1, v))));
  const bounded = p.comparator === '≤' && p.limit > 0;
  const ratio = bounded ? Math.min(1, p.value / (p.limit * 1.25)) : 0;
  const bar = useTransform(t, (v) => Math.min(1, v) * ratio);
  const unit = p.unit && p.unit !== '%' ? p.unit : '';
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_7.5rem_6rem_1.25rem]">
      <span className="min-w-0 text-[0.9375rem] text-fg">
        {p.label}
        {unit && <span className="text-sm text-muted"> · {unit}</span>}
      </span>
      <motion.span className="text-right font-mono text-[0.9375rem] font-medium text-fg tnum">{display}</motion.span>
      <span className="font-mono text-sm text-muted tnum sm:text-right">{p.limitLabel}</span>
      <span aria-hidden className="relative hidden h-1.5 rounded-full bg-[color-mix(in_oklab,var(--world)_14%,var(--surface-2))] sm:block">
        {bounded && (
          <>
            <motion.span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-world" style={{ scaleX: bar }} />
            <span className="absolute -top-1 bottom-[-4px] w-0.5 bg-fg" style={{ left: '80%' }} />
          </>
        )}
      </span>
      <span className="hidden justify-end sm:flex">
        {p.pass ? <Check aria-hidden className="size-4 text-ok-ink" strokeWidth={2.25} /> : <Minus aria-hidden className="size-4 text-crit-ink" strokeWidth={2.25} />}
      </span>
      <span className="sr-only">
        {p.label}: {fmtParam(p, p.value)} {unit}. Limite {p.limitLabel}. {p.pass ? 'Cumpre.' : 'Não cumpre.'}
      </span>
    </li>
  );
}

function AnalysisSheet({ analysis, progress }: { analysis: QualityAnalysis; progress: MotionValue<number> }) {
  const n = analysis.params.length;
  return (
    <ol aria-label={`Parâmetros do boletim ${analysis.reportId}`} className="divide-y divide-border border-y border-border">
      {analysis.params.map((p, i) => (
        <ParamRowTimed key={p.id} p={p} i={i} n={n} progress={progress} />
      ))}
    </ol>
  );
}

function ParamRowTimed({ p, i, n, progress }: { p: QualityParam; i: number; n: number; progress: MotionValue<number> }) {
  const a = 0.38 + (i / n) * 0.42;
  const b = a + 0.42 / n + 0.06;
  const t = useTransform(progress, [a, b], [0, 1], { clamp: true });
  return <ParamRow p={p} t={t} />;
}

function Telemetry() {
  const { lot, ctx } = useJourney();
  const data = useData();
  const feed = useFeed();
  const units = data.telemetry[lot.producerId] ?? [];
  if (!units.length || !ctx.producer.telemetry.live) return null;
  const unitLabel = ctx.producer.telemetry.unitLabel;
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm text-muted">
        <span aria-hidden className={cn('size-2 rounded-full', feed.paused ? 'bg-muted' : 'bg-ok')} />
        Telemetria de {ctx.producer.nome} · {feed.paused ? 'em pausa' : 'em direto'}
      </p>
      <ul className="mt-2 grid gap-1.5">
        {units.map((u) => {
          const f = u.capacity > 0 ? u.level / u.capacity : 0;
          return (
            <li key={u.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
              <span className="truncate text-muted">{u.label}</span>
              <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--world)_14%,var(--surface-2))]">
                <span className="block h-full origin-left rounded-full bg-world transition-transform duration-500 ease-out" style={{ transform: `scaleX(${f})` }} />
              </span>
              <span className="font-mono text-fg tnum">
                {num(u.level)} <span className="text-muted">/ {num(u.capacity)} {unitLabel}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ColheitaBody({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const { lot, ctx } = useJourney();
  const game = useGame();
  const [open, setOpen] = useState(false);
  const analysis = lot.analyses[lot.analyses.length - 1];
  const read = game.hasReadAnalysis(lot.id);
  const sheetRef = useRef<HTMLDivElement>(null);
  const firing = useRef(false);
  const stockFrac = lot.quantity > 0 ? Math.min(1, lot.stock / lot.quantity) : 0;
  const fill = useTransform(progress, [0.04, 0.4], [0, stockFrac], { clamp: true });
  const stockText = useTransform(fill, (v) => stockLabel(lot, Math.round(v * lot.quantity)));

  const markRead = useCallback(() => {
    if (!analysis || firing.current || game.hasReadAnalysis(lot.id)) return;
    firing.current = true;
    game.markAnalysisRead(lot.id);
  }, [analysis, game, lot.id]);

  useMotionValueEvent(progress, 'change', (v) => {
    if (rich && v > 0.88) markRead();
  });
  useDwell(sheetRef, !rich && Boolean(analysis) && !read, markRead, 1600);

  const quest = lot.analyses.length ? undefined : null;
  const colhido = lot.milestones.find((m) => m.stage === 'colhido');
  const analisado = lot.milestones.find((m) => m.stage === 'analisado');

  return (
    <Wrap className="min-w-0">
      <ChapterHeading id="colheita" n={2} title={ctx.copy.colheitaTitle} lead={ctx.copy.colheitaLead} />
      <SeasonTrack world={lot.world} className="mt-6 max-w-[920px]" />

      <div className="mt-7 grid min-w-0 gap-x-12 gap-y-8 lg:grid-cols-12">
        {/* depósito a encher até ao stock real */}
        <div className="min-w-0 lg:col-span-5">
          <div className="flex items-end gap-6">
            <LotGauge kind={lot.world} value={stockFrac} progress={fill} size="lg" label={`Stock físico do lote ${lot.id}`} valueText={stockLabel(lot)} className="w-[150px] shrink-0 sm:w-[200px] [&_svg]:h-auto [&_svg]:w-full" />
            <div className="min-w-0 pb-3">
              <p className="text-sm text-muted">Stock do lote {ctx.copy.stockWhere}</p>
              <motion.p className="mt-1 font-mono text-[1.75rem] font-medium leading-none text-fg tnum">{stockText}</motion.p>
              <p className="mt-2 text-sm text-muted">de {stockLabel(lot, lot.quantity)} · {lot.storage.local}</p>
              <dl className="mt-4 grid gap-1 text-sm">
                {colhido?.date && (
                  <div className="flex gap-2">
                    <dt className="text-muted">{ctx.world.journeyLabels.colhido}:</dt>
                    <dd className="font-mono text-fg tnum">{fmtDate(colhido.date)}</dd>
                  </div>
                )}
                {analisado?.date && (
                  <div className="flex gap-2">
                    <dt className="text-muted">{ctx.world.journeyLabels.analisado}:</dt>
                    <dd className="font-mono text-fg tnum">{fmtDate(analisado.date)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          <div className="mt-6">
            <Telemetry />
          </div>
        </div>

        {/* boletim de análises */}
        <div ref={sheetRef} id={rich ? undefined : 'analises'} className="min-w-0 scroll-mt-6 lg:col-span-7">
          {analysis ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[1.1875rem]">Boletim de análises</h3>
                  <p className="mt-0.5 text-sm text-muted">
                    <span className="font-mono tnum">{analysis.reportId}</span> · {analysis.lab.split(' · ')[0]} · {fmtDate(analysis.date)}
                  </p>
                </div>
                <Badge tone="ok" dot size="md">
                  {analysis.category}
                </Badge>
              </div>
              <div className="mt-3">
                <AnalysisSheet analysis={analysis} progress={progress} />
              </div>
              {analysis.panel && (
                <p className="mt-3 text-sm text-muted">
                  Painel de prova: {analysis.panel.atributos.join(', ').toLowerCase()} · mediana do frutado <span className="font-mono text-fg tnum">{num(analysis.panel.medianaFrutado, 1)}</span>, defeito <span className="font-mono text-fg tnum">{num(analysis.panel.medianaDefeito, 1)}</span>.
                  {analysis.note && ` ${analysis.note}`}
                </p>
              )}
              {!analysis.panel && analysis.note && <p className="mt-3 text-sm text-muted">{analysis.note}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-world-soft px-3 py-2.5">
                <p className="flex min-w-0 items-center gap-2.5 text-sm">
                  <CheckMark done={read} />
                  <span className={cn('min-w-0', read ? 'text-fg' : 'text-world-ink')}>
                    {read ? 'Missão cumprida: boletim lido' : 'Missão: lê o boletim até ao fim'}
                  </span>
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<FileText aria-hidden className="size-4" strokeWidth={1.75} />}
                  onClick={() => {
                    setOpen(true);
                    markRead();
                  }}
                >
                  Abrir boletim completo
                </Button>
              </div>
              <Drawer open={open} onClose={() => setOpen(false)} title={`Boletim ${analysis.reportId}`} description={`${analysis.lab} · ${fmtDate(analysis.date)}`} width="lg">
                <KeyValue
                  items={[
                    { label: 'Lote', value: lot.id, mono: true },
                    { label: 'Classificação', value: analysis.category },
                    { label: 'Referência legal', value: analysis.reference },
                    { label: 'Data da colheita da amostra', value: fmtDate(analysis.date), mono: true },
                  ]}
                />
                <table className="mt-6 w-full text-left text-sm">
                  <caption className="sr-only">Parâmetros e limites</caption>
                  <thead className="border-b border-border text-muted">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Parâmetro</th>
                      <th className="py-2 pr-3 text-right font-medium">Resultado</th>
                      <th className="py-2 pr-3 text-right font-medium">Limite</th>
                      <th className="py-2 text-right font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.params.map((p) => (
                      <tr key={p.id} className="border-b border-border">
                        <td className="py-2 pr-3">
                          {p.label}
                          {p.unit && p.unit !== '%' && <span className="text-muted"> · {p.unit}</span>}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono tnum">{fmtParam(p, p.value)}</td>
                        <td className="py-2 pr-3 text-right font-mono text-muted tnum">{p.limitLabel}</td>
                        <td className={cn('py-2 text-right', p.pass ? 'text-ok-ink' : 'text-crit-ink')}>{p.pass ? 'Cumpre' : 'Não cumpre'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {analysis.panel && (
                  <p className="mt-4 text-sm text-muted">
                    Atributos do painel: {analysis.panel.atributos.join(', ')}. {analysis.note}
                  </p>
                )}
                {lot.analyses.length > 1 && (
                  <p className="mt-4 text-sm text-muted">
                    Este lote tem {lot.analyses.length} boletins. Mostramos o mais recente; as reanálises fazem-se a cada 4 meses de armazenagem.
                  </p>
                )}
              </Drawer>
            </>
          ) : (
            <div className="rounded-sm border border-dashed border-world-line px-4 py-6">
              <h3 className="text-[1.1875rem]">Boletim por publicar</h3>
              <p className="measure mt-1 text-muted">
                O lote só abre a financiamento depois de o laboratório publicar a análise físico-química{lot.world === 'azeite' ? ' e o painel de prova' : ''}. Data prevista: <span className="font-mono text-fg tnum">{fmtDate(analisado?.planned ?? lot.funding.opensAt)}</span>.
              </p>
              {quest === null && null}
            </div>
          )}
        </div>
      </div>
    </Wrap>
  );
}

export function ChapterColheita({ label }: { label: string }) {
  const { rich } = useJourney();
  return (
    <div className="relative">
      {rich && <span id="analises" aria-hidden className="pointer-events-none absolute left-0 h-px w-px" style={{ top: '64%' }} />}
      <Chapter id="colheita" label={label} heightVh={230} static={!rich} className={cn(!rich && 'scroll-mt-6 border-b border-border')} stickyClassName="justify-center" >
        {(progress, isRich) => (
          <div style={isRich ? { paddingTop: CHROME_H } : undefined} className="min-w-0">
            <ColheitaBody progress={progress} rich={isRich} />
          </div>
        )}
      </Chapter>
    </div>
  );
}
