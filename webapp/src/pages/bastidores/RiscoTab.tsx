import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, TriangleAlert } from 'lucide-react';
import { getWorld, HEDGE_TRIGGERS, MARKET_TODAY, REFUNDING_PLAYBOOKS, type WorldId } from '../../data';
import { LotGauge } from '../../components/game';
import { Badge, Card, CardHeader, Checkbox, CommodityChip, DataTable, Disclaimer, KeyValue, SegmentedControl, StatusPill, type Column } from '../../components/ui';
import { useData } from '../../state';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, kg, L, num, pct, plural, price } from '../../lib/format';
import { PRESSUPOSTOS, SCENARIO_IDS, scenario, stress, TRIGGERS, type LotRisk, type ScenarioId } from './metrics';
import { CycleCalendar, PriceRuler, ResultBar, signedEur, signedPct, windowOf } from './parts';

/* =====================================================================
   Risco: marcação a mercado por lote, gatilhos de cobertura com a
   distância ao disparo e teste de esforço. Momento focal: ao mudar de
   cenário, as extensões novas crescem no calendário agrícola.
   ===================================================================== */

const isScenario = (v: string | null): v is ScenarioId => SCENARIO_IDS.includes(v as ScenarioId);
const unitPrice = (w: WorldId, v: number) => price(v, w === 'agua' ? 'L' : 'kg', w === 'agua' ? 3 : 2);
const qty = (w: WorldId, v: number) => (w === 'agua' ? L(v) : kg(v));

function ActionChips({ r }: { r: LotRisk }) {
  return (
    <div className="flex flex-wrap gap-1">
      {r.triggerFired && <Badge tone="warn">Gatilho dispara</Badge>}
      {r.extension && <Badge tone="warn">Extensão</Badge>}
      {r.refunding && <Badge tone="crit">Refunding</Badge>}
      {!r.triggerFired && !r.extension && !r.refunding && r.lot.status === 'em-extensao' && <Badge tone="neutral">Já em extensão</Badge>}
    </div>
  );
}

export default function RiscoTab() {
  const { lots } = useData();
  const [params, setParams] = useSearchParams();
  // estado local (resposta imediata) espelhado no URL para poder partilhar o cenário
  const [sc, setSc] = useState<ScenarioId>(() => (isScenario(params.get('cenario')) ? (params.get('cenario') as ScenarioId) : 'base'));
  const [water, setWater] = useState(() => params.get('agua') === '1');
  const isPrice = sc === 'preco-15' || sc === 'preco-30';
  const update = (next: { cenario?: ScenarioId; agua?: boolean }) => {
    const c = next.cenario ?? sc;
    const a = next.agua ?? water;
    setSc(c);
    setWater(a);
    const p = new URLSearchParams(params);
    if (c === 'base') p.delete('cenario');
    else p.set('cenario', c);
    if (a && (c === 'preco-15' || c === 'preco-30')) p.set('agua', '1');
    else p.delete('agua');
    setParams(p, { replace: true });
  };

  const res = useMemo(() => stress(lots, sc, water && isPrice), [lots, sc, water, isPrice]);
  const rows = [...res.rows].sort((a, b) => (windowOf(a.lot).ext ?? windowOf(a.lot).end).localeCompare(windowOf(b.lot).ext ?? windowOf(b.lot).end));
  const delta = res.totalMargin - res.baseMargin;
  const ids = (list: LotRisk[]) => (list.length ? list.map((r) => r.lot.id).join(', ') : 'nenhum');

  const columns: Column<LotRisk>[] = [
    {
      key: 'lote',
      header: 'Lote',
      sortValue: (r) => r.lot.id,
      minWidth: 150,
      render: (r) => (
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <LotGauge kind={r.lot.world} value={r.Q ? r.S / r.Q : 0} size="xs" label={`Stock por vender do ${r.lot.id}`} />
          <div>
            <Link to={`/lote/${r.lot.id}#cobertura`} className="font-mono font-medium text-accent underline decoration-[color-mix(in_oklab,var(--accent)_40%,transparent)] underline-offset-[0.2em] hover:decoration-accent tnum">
              {r.lot.id}
            </Link>
            <p className="font-mono text-xs text-muted tnum">{qty(r.lot.world, r.S)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'cobertura',
      header: 'Cobertura',
      sortValue: (r) => r.h,
      render: (r) => (
        <div className="whitespace-nowrap">
          <div className="font-mono tnum">
            {r.h !== r.h0 ? (
              <>
                {pct(r.h0, 0)} → <strong className="font-semibold">{pct(r.h, 0)}</strong>
              </>
            ) : (
              pct(r.h, 0)
            )}
          </div>
          <div className="font-mono text-xs text-muted tnum">{r.lot.hedge.instrument === 'nenhuma' ? 'sem cobertura de preço' : `${qty(r.lot.world, Math.round(r.exposure))} expostos`}</div>
        </div>
      ),
    },
    { key: 'contrato', header: 'Contrato', align: 'right', mono: true, className: 'whitespace-nowrap', sortValue: (r) => r.lot.economics.buyerPrice, render: (r) => unitPrice(r.lot.world, r.lot.economics.buyerPrice) },
    {
      key: 'referencia',
      header: 'Referência',
      align: 'right',
      mono: true,
      className: 'whitespace-nowrap',
      sortValue: (r) => r.refChange,
      render: (r) => (
        <div>
          <div>{unitPrice(r.lot.world, r.market)}</div>
          <div className={cn('text-xs', r.refChange <= -0.15 ? 'text-warn-ink' : 'text-muted')}>{signedPct(r.refChange)} vs. entrada</div>
        </div>
      ),
    },
    { key: 'base', header: 'Base', align: 'right', mono: true, className: 'whitespace-nowrap', sortValue: (r) => r.basis, render: (r) => signedPct(r.basis) },
    {
      key: 'mtm',
      header: 'MTM do stock',
      align: 'right',
      mono: true,
      className: 'whitespace-nowrap',
      sortValue: (r) => r.unrealized,
      render: (r) => <span className={r.unrealized < -0.5 ? 'text-crit-ink' : undefined}>{signedEur(r.unrealized)}</span>,
    },
    {
      key: 'resultado',
      header: 'Resultado previsto',
      sortValue: (r) => r.result,
      minWidth: 190,
      render: (r) => (
        <div className="whitespace-nowrap">
          <ResultBar value={r.result} label={`Resultado previsto do ${r.lot.id}: ${signedPct(r.result)}`} />
          <div className="mt-0.5 text-xs text-muted">
            oferta {pct(r.lot.economics.expectedRange[0], 1)} a {pct(r.lot.economics.expectedRange[1], 1)}
          </div>
          <div className="mt-1">
            <ActionChips r={r} />
          </div>
        </div>
      ),
    },
  ];

  /* gatilhos */
  const azTriggers = TRIGGERS.filter((t) => t.def.status === 'armado' && t.threshold && getWorld(lots.find((l) => l.id === t.def.lotId)?.world ?? 'azeite').id === 'azeite');
  const marks = Object.values(
    azTriggers.reduce<Record<string, { value: number; label: string }>>((acc, t) => {
      const k = String(t.threshold);
      acc[k] = acc[k] ? { value: t.threshold!, label: `${acc[k].label}, ${t.def.lotId}` } : { value: t.threshold!, label: t.def.lotId };
      return acc;
    }, {}),
  );
  const azMarket = MARKET_TODAY.azeite * (1 + (res.scenario.price.azeite ?? 0));
  const otherTriggers = HEDGE_TRIGGERS.filter((t) => t.status !== 'armado');

  const instruments = (['azeite', 'agua', 'cafe'] as WorldId[]).map((w) => {
    const rs = res.base.filter((r) => r.lot.world === w);
    const stock = rs.reduce((s, r) => s + r.S, 0);
    const covered = rs.reduce((s, r) => s + r.S * r.h, 0);
    return { w, world: getWorld(w), coverage: stock ? covered / stock : 0, stock };
  });

  const affectedRows = [...res.extensions, ...res.refundings];
  const affected = new Set(affectedRows.map((r) => r.lot.id));
  /** Lotes que ativam cada playbook no cenário: preço no azeite (ou refunding), prazo na água. */
  const playbookHits = (id: string) => {
    const list =
      id === 'pb-azeite-preco'
        ? affectedRows.filter((r) => r.lot.world === 'azeite' && (isPrice || r.refunding))
        : id === 'pb-agua-prazo'
          ? affectedRows.filter((r) => r.lot.world === 'agua')
          : [];
    return [...new Set(list.map((r) => r.lot.id))];
  };

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="esforco-t">
        <div className="mb-4">
          <h2 id="esforco-t" className="text-[1.375rem] leading-tight">
            Teste de esforço
          </h2>
          <p className="measure mt-1 text-muted">Escolhe um cenário: a marcação a mercado, os gatilhos, o calendário e os playbooks abaixo passam a mostrar esse cenário.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <div className="w-max">
            <SegmentedControl<ScenarioId>
              label="Cenário de esforço"
              value={sc}
              onChange={(v) => update({ cenario: v })}
              options={SCENARIO_IDS.map((id) => ({ value: id, label: scenario(id, false).label }))}
            />
            </div>
          </div>
          <Checkbox
            label="Aplicar o choque de preço também à água"
            description={isPrice ? 'A água não tem cobertura de preço: o choque passa inteiro para a margem.' : 'Disponível nos cenários de preço.'}
            checked={water && isPrice}
            disabled={!isPrice}
            onChange={(e) => update({ agua: e.target.checked })}
          />
        </div>

        <Card className="mt-5" aria-live="polite">
          <p className="text-[0.9375rem] text-fg">
            <strong className="font-semibold">{res.scenario.label}.</strong> {res.scenario.description}
          </p>
          <KeyValue
            className="mt-4"
            columns={4}
            items={[
              { label: 'Margem bruta prevista do piloto', value: eur(res.totalMargin, { decimals: 0 }), mono: true, hint: sc === 'base' ? 'com as referências de hoje' : `${signedEur(delta)} face a hoje` },
              { label: 'Gatilhos de cobertura que disparam', value: num(res.triggers.length), mono: true, hint: ids(res.triggers) },
              { label: 'Lotes que entram em extensão', value: num(res.extensions.length), mono: true, hint: ids(res.extensions) },
              { label: 'Lotes em refunding', value: num(res.refundings.length), mono: true, hint: ids(res.refundings) },
            ]}
          />
          {res.prepImpact.length > 0 && (
            <ul className="mt-4 border-t border-border pt-3 text-sm text-muted">
              {res.prepImpact.map((p) => (
                <li key={p.lot.id}>
                  <span className="font-mono text-fg tnum">{p.lot.id}</span> (em preparação): volume previsto passa de {p.lot.unit === 'kg' ? kg(p.from) : `${num(p.from)} paletes`} para {p.lot.unit === 'kg' ? kg(p.to) : `${num(p.to)} paletes`}; o objetivo de financiamento é recalculado antes de abrir.
                </li>
              ))}
            </ul>
          )}
          {res.negative.length > 0 && (
            <p className="mt-3 text-sm text-muted">
              {plural(res.negative.length, 'lote fica', 'lotes ficam')} com resultado negativo para os co-financiadores depois da reserva de primeira perda: {ids(res.negative)}.
            </p>
          )}
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Janelas de liquidação no calendário agrícola"
          description="Cada lote sobre as bandas de colheita do seu mundo. No cenário escolhido, as extensões novas aparecem a tracejado e o refunding fica marcado no fim da janela."
        />
        <CycleCalendar
          caption={`Calendário das janelas de liquidação no cenário ${res.scenario.label}`}
          rows={rows.map((r) => ({ lot: r.lot, newExtension: r.extension, refunding: r.refunding }))}
        />
      </Card>

      <section aria-labelledby="mtm-t">
        <div className="mb-4">
          <h2 id="mtm-t" className="text-[1.375rem] leading-tight">
            Marcação a mercado por lote
          </h2>
          <p className="measure mt-1 text-muted">
            Preço contratado com o comprador contra a referência, base, cobertura e PnL do lote. O resultado previsto é o dos co-financiadores, em % do montante financiado, ao lado do intervalo anunciado na oferta e da ação que o cenário pede.
          </p>
        </div>
        <DataTable columns={columns} rows={rows} getRowId={(r) => r.lot.id} caption={`Marcação a mercado por lote, cenário ${res.scenario.label}`} rowClassName={(r) => (affected.has(r.lot.id) ? 'bg-[color-mix(in_oklab,var(--warn)_6%,var(--surface))]' : undefined)} />
        <p className="mt-2 text-sm text-muted">MTM do stock: margem não realizada do que falta vender, ao preço do cenário. Base: preço contratado face à referência de hoje (negativo = abaixo do mercado, como prometido ao comprador).</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader title="Gatilhos de cobertura do azeite" description="Distância entre a referência e o limiar de cada gatilho armado. Abaixo do limiar, a venda a prazo sobe para o nível do gatilho." />
          <PriceRuler min={3} max={5.2} unit="€/kg" today={MARKET_TODAY.azeite} stressed={azMarket} stressLabel={res.scenario.label} marks={marks} />
          <ul className="mt-5 divide-y divide-border">
            {azTriggers.map((t) => {
              const dist = (azMarket - t.threshold!) / azMarket;
              const fired = azMarket < t.threshold!;
              return (
                <li key={t.def.id} className="grid gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)_9rem] sm:items-center">
                  <span className="font-mono text-[0.9375rem] text-fg tnum">{t.def.lotId}</span>
                  <span className="text-sm text-muted">
                    {t.def.description}. Limiar {price(t.threshold!, 'kg')}.
                  </span>
                  <span className="flex items-center gap-2 sm:justify-end">
                    {fired ? (
                      <StatusPill tone="warn" label="Dispara" />
                    ) : (
                      <>
                        <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                          <span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[color-mix(in_oklab,var(--fg)_45%,var(--surface))] transition-transform duration-300" style={{ transform: `scaleX(${Math.min(1, dist / 0.2)})` }} />
                        </span>
                        <span className="font-mono text-sm text-fg tnum">a {pct(dist, 1)}</span>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
            {otherTriggers.map((t) => (
              <li key={t.id} className="grid gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)_9rem] sm:items-center">
                <span className="font-mono text-[0.9375rem] text-fg tnum">{t.lotId}</span>
                <span className="text-sm text-muted">
                  {t.description}. {t.threshold}; {t.current.toLowerCase().startsWith('executado') ? t.current.toLowerCase() : `hoje ${t.current}`} ({fmtDate(t.updatedAt)}).
                </span>
                <span className="sm:text-right">
                  <StatusPill tone={t.status === 'executado' ? 'ok' : 'neutral'} label={t.status === 'executado' ? 'Executado' : 'Inativo · Fase 2'} />
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Instrumentos por mundo" description="O que cada mercado permite cobrir e quanto do stock em ciclo está coberto hoje." />
          <ul className="divide-y divide-border">
            {instruments.map((it) => (
              <li key={it.w} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CommodityChip world={it.w} />
                  <span className="font-mono text-sm text-fg tnum">
                    {it.w === 'cafe' ? 'Fase 2 · sem exposição' : `${pct(it.coverage, 0)} do stock coberto`}
                  </span>
                </div>
                <p className="mt-2 font-medium text-fg">{it.world.hedge.label}</p>
                <p className="mt-0.5 text-sm text-muted">{it.world.hedge.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section aria-labelledby="playbooks-t">
        <div className="mb-4">
          <h2 id="playbooks-t" className="text-[1.375rem] leading-tight">
            Playbooks de refunding
          </h2>
          <p className="measure mt-1 text-muted">O que a equipa faz, por ordem, quando um lote entra em choque. Os passos são sequenciais e cada um tem dono e prazo.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {REFUNDING_PLAYBOOKS.map((pb) => {
            const hits = playbookHits(pb.id);
            return (
              <Card key={pb.id} as="article" className={cn(hits.length > 0 && 'border-[color-mix(in_oklab,var(--warn)_45%,var(--border))]')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-[1.0625rem] leading-tight">{pb.title}</h3>
                  <CommodityChip world={pb.world} />
                </div>
                <p className="mt-1.5 text-sm text-muted">Gatilho: {pb.trigger}</p>
                {hits.length > 0 && (
                  <p className="mt-2 flex items-start gap-2 text-sm font-medium text-warn-ink">
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                    <span>
                      Ativado neste cenário: <span className="font-mono tnum">{hits.join(', ')}</span>
                    </span>
                  </p>
                )}
                <ol className="mt-4 space-y-2">
                  {pb.steps.map((s) => (
                    <li key={s.order} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2">
                      <span className="inline-flex size-6 items-center justify-center rounded-full border border-border font-mono text-xs text-muted tnum">{s.order}</span>
                      <div className="min-w-0">
                        <p className="text-[0.9375rem] leading-snug text-fg">{s.title}</p>
                        <p className="text-sm text-muted">
                          {s.owner} · <span className="font-mono tnum">{s.sla}</span>
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-sm text-muted">
                  Aplica-se a: <span className="font-mono text-fg tnum">{pb.appliesTo.join(', ')}</span>
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <details className="group rounded-md border border-border bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium text-fg sm:px-5 [&::-webkit-details-marker]:hidden">
          Pressupostos do teste de esforço
          <ChevronDown aria-hidden className="size-4 text-muted transition-transform duration-200 group-open:rotate-180" strokeWidth={1.75} />
        </summary>
        <ul className="list-disc space-y-1.5 px-4 pb-4 pl-9 text-sm text-muted sm:px-5 sm:pl-10">
          {PRESSUPOSTOS.map((p) => (
            <li key={p} className="measure">
              {p}
            </li>
          ))}
        </ul>
        <Disclaimer className="mx-4 mb-4 sm:mx-5">Dados de demonstração, fictícios. A marcação a mercado usa os índices ilustrativos da app, não cotações reais.</Disclaimer>
      </details>
    </div>
  );
}
