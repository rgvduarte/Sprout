import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { fundedFraction, getProducer, ILLUSTRATIVE_LABEL, isIllustrative, PRODUCERS, stageLabel, type Lot } from '../../data';
import { CampaignFeed, LotGauge } from '../../components/game';
import { Badge, Card, CardHeader, DataTable, StatusPill, type Column } from '../../components/ui';
import { useCampaignEvents, useData, useTelemetry } from '../../state';
import { daysBetween, TODAY_DATE } from '../../lib/clock';
import { date as fmtDate, eur, kg, num, pct, plural } from '../../lib/format';
import {
  capital,
  capitalHistory,
  cycleLots,
  HISTORY_LABELS,
  kpi,
  KYC_SLA_DAYS,
  KYC_WEEK_LABELS,
  kycBacklogHistory,
  OPEN_KYC,
  recon,
} from './metrics';
import { KpiHistory, windowOf } from './parts';
import { lastDecision, useBastidores } from './store';
import { kycStatusAfter, useKycCases } from './useCases';

/* =====================================================================
   Piloto: indicadores com histórico curto, lotes em ciclo com o seu
   medidor físico, diário operacional e telemetria dos produtores.
   ===================================================================== */

type Tone = 'ok' | 'warn' | 'info';
const TONE_LABEL: Record<Tone, string> = { ok: 'No alvo', warn: 'Pede atenção', info: 'Acompanhar' };

interface KpiRowProps {
  label: string;
  note: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone: Tone;
  toneLabel?: string;
  history: ReactNode;
}

function KpiRow({ label, note, value, sub, tone, toneLabel, history }: KpiRowProps) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_minmax(0,11rem)] items-start gap-x-4 gap-y-3 border-t border-border py-4 first:border-t-0 first:pt-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,13.75rem)] sm:gap-x-6 xl:grid-cols-[minmax(0,1fr)_11.5rem_13.75rem] xl:gap-x-8">
      <div className="col-span-2 min-w-0 xl:col-span-1">
        <h3 className="text-[1rem] leading-snug">{label}</h3>
        <p className="max-w-[60ch] mt-1 text-sm text-muted">{note}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[1.3125rem] font-semibold leading-tight text-fg pnum sm:text-[1.5rem]">{value}</p>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
        <StatusPill className="mt-2 max-w-full" tone={tone} label={toneLabel ?? TONE_LABEL[tone]} />
      </div>
      <div className="min-w-0">{history}</div>
    </li>
  );
}

const pct0 = (v: number) => pct(v, 1);

function physicalStock(lot: Lot) {
  if (lot.unit === 'kg') return { now: kg(lot.stock), of: kg(lot.quantity) };
  const u = lot.unit === 'palete' ? 'paletes' : 'sacas';
  return { now: `${num(lot.stock)} ${u}`, of: `${num(lot.quantity)} ${u}` };
}

/** Um lote em ciclo numa linha empilhada (ecrãs estreitos): medidor, ID, estado e dois números. */
function StackedLot({ lot: l }: { lot: Lot }) {
  const open = l.status === 'aberto';
  const v = open ? fundedFraction(l) : l.quantity ? l.stock / l.quantity : 0;
  const w = windowOf(l);
  const s = physicalStock(l);
  return (
    <li className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <LotGauge kind={l.world} value={v} size="xs" label={open ? `Financiamento do ${l.id}` : `Stock por vender do ${l.id}`} />
        <div className="min-w-0">
          <Link to={`/lote/${l.id}`} className="font-mono text-[0.9375rem] font-medium text-accent underline decoration-[color-mix(in_oklab,var(--accent)_40%,transparent)] underline-offset-[0.2em] hover:decoration-accent tnum">
            {l.id}
          </Link>
          <p className="text-sm text-muted">{getProducer(l.producerId)?.nome}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusPill status={l.status} />
        <span className="text-sm text-muted">{stageLabel(l.world, l.stage)}</span>
        {isIllustrative(l) && <span className="text-xs text-muted">ilustrativo</span>}
      </div>
      <dl className="mt-2.5 grid grid-cols-2 gap-x-4 text-sm">
        <div className="min-w-0">
          <dt className="text-muted">{open ? 'Financiado' : 'Stock por vender'}</dt>
          <dd className="font-mono text-fg tnum">{open ? eur(l.funding.raised) : s.now}</dd>
          <dd className="font-mono text-xs text-muted tnum">{open ? `${pct(fundedFraction(l), 0)} de ${eur(l.funding.goal)}` : `de ${s.of}`}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted">Fim da janela</dt>
          <dd className="font-mono text-fg tnum">{fmtDate(w.ext ?? w.end)}</dd>
          <dd className="text-xs text-muted">{w.ext ? 'com extensão' : open ? 'prevista' : `${num(l.funding.coFinancers)} cofinanciadores`}</dd>
        </div>
      </dl>
    </li>
  );
}

export default function PilotoTab() {
  const { lots } = useData();
  const events = useCampaignEvents();
  const telemetry = useTelemetry();
  const st = useBastidores();
  const cases = useKycCases();

  const cap = capital(lots);
  const hist = useMemo(() => capitalHistory(lots), [lots]);
  const cyc = cycleLots(lots);
  const counts = {
    aberto: cyc.filter((l) => l.status === 'aberto').length,
    financiado: cyc.filter((l) => l.status === 'financiado').length,
    extensao: cyc.filter((l) => l.status === 'em-extensao').length,
  };
  const fe = kpi('fill-rate-encomendas');
  const fr = kpi('fill-rate');
  const base = kpi('base');
  const slaP = kpi('sla-produtor');
  const slaI = kpi('sla-investidor');
  const rec = kpi('reconciliacao');
  const prazo = kpi('prazo-venda');

  const openCases = cases.filter((c) => OPEN_KYC.includes(kycStatusAfter(c, lastDecision(st, c.id))));
  const oldest = openCases.reduce((m, c) => Math.max(m, daysBetween(c.submittedAt, TODAY_DATE)), 0);
  const kycHist = kycBacklogHistory();
  kycHist[kycHist.length - 1] = openCases.length;

  const columns: Column<Lot>[] = [
    {
      key: 'lote',
      header: 'Lote',
      sortValue: (l) => l.id,
      minWidth: 200,
      render: (l) => {
        const open = l.status === 'aberto';
        const v = open ? fundedFraction(l) : l.quantity ? l.stock / l.quantity : 0;
        return (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <LotGauge kind={l.world} value={v} size="xs" label={open ? `Financiamento do ${l.id}` : `Stock por vender do ${l.id}`} />
            <div className="min-w-0">
              <Link to={`/lote/${l.id}`} className="font-mono text-[0.9375rem] font-medium text-accent underline decoration-[color-mix(in_oklab,var(--accent)_40%,transparent)] underline-offset-[0.2em] hover:decoration-accent tnum">
                {l.id}
              </Link>
              <p className="truncate text-sm text-muted">{getProducer(l.producerId)?.nome}</p>
              {isIllustrative(l) && <p className="text-xs text-muted">ilustrativo</p>}
            </div>
          </div>
        );
      },
    },
    { key: 'estado', header: 'Estado', sortValue: (l) => l.status, render: (l) => <StatusPill status={l.status} /> },
    { key: 'etapa', header: 'Etapa', className: 'whitespace-nowrap', sortValue: (l) => l.stage, render: (l) => stageLabel(l.world, l.stage) },
    {
      key: 'financiado',
      header: 'Financiado',
      align: 'right',
      mono: true,
      className: 'whitespace-nowrap',
      sortValue: (l) => l.funding.raised,
      render: (l) => (
        <div>
          <div>{eur(l.funding.raised)}</div>
          <div className="text-xs text-muted">
            {l.status === 'aberto' ? `de ${eur(l.funding.goal)} · ${pct(fundedFraction(l), 0)} · ` : ''}
            {num(l.funding.coFinancers)} cofin.
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock por vender',
      align: 'right',
      mono: true,
      className: 'whitespace-nowrap',
      sortValue: (l) => (l.quantity ? l.stock / l.quantity : 0),
      render: (l) => {
        const s = physicalStock(l);
        return (
          <div>
            <div>{s.now}</div>
            <div className="text-xs text-muted">de {s.of}</div>
          </div>
        );
      },
    },
    {
      key: 'janela',
      header: 'Fim da janela',
      align: 'right',
      mono: true,
      className: 'whitespace-nowrap',
      sortValue: (l) => windowOf(l).ext ?? windowOf(l).end,
      render: (l) => {
        const w = windowOf(l);
        return (
          <div>
            <div>{fmtDate(w.ext ?? w.end)}</div>
            <div className="text-xs text-muted">{w.ext ? 'com extensão' : l.status === 'aberto' ? 'prevista' : w.early ? `liquida a ${fmtDate(w.early)}` : '18 meses'}</div>
          </div>
        );
      },
    },
  ];

  const liveProducers = PRODUCERS.filter((p) => p.fase === 1 && p.telemetry.live);
  const pilotEvents = events.filter((e) => e.world !== 'cafe');

  return (
    <div className="flex flex-col gap-10">
      <Card>
        <CardHeader
          title="Indicadores do piloto"
          description="Valor de hoje, alvo do desenho do piloto e os últimos seis períodos. Passa o cursor pelo histórico para ver cada valor; num ecrã tátil, os dois últimos aparecem por baixo."
          actions={<Badge tone="warn">{ILLUSTRATIVE_LABEL}</Badge>}
        />
        <ul>
          <KpiRow
            label="Capital financiado vs. comprometido com produtores"
            note={`Compromisso de compra assumido nos ${cyc.length} lotes em ciclo e o que os cofinanciadores já financiaram. A diferença é o que falta nos lotes abertos. Os cestos de água não entram: não têm capital.`}
            value={eur(cap.financed)}
            sub={`de ${eur(cap.committed)} (${pct(cap.financed / cap.committed, 1)}); faltam ${eur(cap.gap)}`}
            tone={cap.gap > 0 ? 'info' : 'ok'}
            toneLabel={cap.gap > 0 ? plural(cap.openLots.length, 'lote aberto', 'lotes abertos') : 'Tudo financiado'}
            history={<KpiHistory kind="columns" values={hist.financed} track={hist.committed} labels={HISTORY_LABELS} format={(v) => eur(v, { compact: true })} label="Capital financiado (coluna cheia) e comprometido (contorno)" />}
          />
          <KpiRow
            label="Lotes em ciclo"
            note="Lotes com capital comprometido e ainda por liquidar. Saem do ciclo quando o último pagamento chega aos cofinanciadores."
            value={num(cyc.length)}
            sub={`${plural(counts.aberto, 'aberto', 'abertos')} · ${plural(counts.financiado, 'financiado', 'financiados')} · ${num(counts.extensao)} em extensão`}
            tone={counts.extensao > 0 ? 'info' : 'ok'}
            toneLabel={counts.extensao > 0 ? `${num(counts.extensao)} em extensão` : undefined}
            history={<KpiHistory kind="columns" values={hist.inCycle} labels={HISTORY_LABELS} format={(v) => num(v)} label="Lotes em ciclo no fim de cada mês" />}
          />
          <KpiRow
            label="Fill rate de encomendas"
            note={`${fe.note} Em agosto, 2 paletes do AG-2026-002 chegaram com película rasgada e foram recusadas na receção.`}
            value={pct(fe.value, 1)}
            sub={`alvo ≥ ${pct(fe.target, 1)}`}
            tone={fe.value >= fe.target ? 'ok' : 'warn'}
            history={<KpiHistory kind="line" values={fe.history} target={fe.target} labels={HISTORY_LABELS} format={pct0} label="Fill rate de encomendas por mês" />}
          />
          <KpiRow
            label="Taxa de financiamento dos lotes"
            note={fr.note}
            value={pct(fr.value, 0)}
            sub={`alvo ≥ ${pct(fr.target, 0)}`}
            tone={fr.value >= fr.target ? 'ok' : 'warn'}
            toneLabel={fr.value >= fr.target ? undefined : 'Abaixo do alvo'}
            history={<KpiHistory kind="line" values={fr.history} target={fr.target} labels={HISTORY_LABELS} format={pct0} label="Volume financiado sobre oferecido, por mês" />}
          />
          <KpiRow
            label="Desconto na HoReCa face à referência embalada"
            note={base.note}
            value={pct(base.value, 1, { sign: true })}
            sub={`alvo ${pct(base.target, 0, { sign: true })} (banda −8 % a −12 %)`}
            tone={base.value <= -0.08 && base.value >= -0.12 ? 'ok' : 'warn'}
            history={<KpiHistory kind="line" values={base.history} target={base.target} labels={HISTORY_LABELS} format={(v) => pct(v, 1, { sign: true })} label="Desconto médio na HoReCa por mês" />}
          />
          <KpiRow
            label={slaP.label}
            note={slaP.note}
            value={pct(slaP.value, 0)}
            sub={`alvo ${pct(slaP.target, 0)}`}
            tone={slaP.value >= slaP.target ? 'ok' : 'warn'}
            history={<KpiHistory kind="line" values={slaP.history} target={slaP.target} labels={HISTORY_LABELS} format={pct0} label="Pagamentos a produtores em 30 dias ou menos, por mês" />}
          />
          <KpiRow
            label={slaI.label}
            note={slaI.note}
            value={pct(slaI.value, 0)}
            sub={`alvo ${pct(slaI.target, 0)}`}
            tone={slaI.value >= slaI.target ? 'ok' : 'warn'}
            history={<KpiHistory kind="line" values={slaI.history} target={slaI.target} labels={HISTORY_LABELS} format={pct0} label="Liquidações dentro da janela por mês" />}
          />
          <KpiRow
            label="Reconciliação diária e quebras"
            note={`${rec.note} Hoje: ${st.recon ? `conciliado às ${st.recon.at.slice(11, 16)}` : 'por executar (SLA até às 20:00)'}.`}
            value={`${num(rec.value)} dias`}
            sub={`de 30 sem diferença em aberto · ${plural(recon.breaks.length, 'quebra', 'quebras')}`}
            tone={recon.open.length === 0 ? 'ok' : 'warn'}
            toneLabel={recon.open.length === 0 ? 'Sem quebras em aberto' : undefined}
            history={<KpiHistory kind="line" values={rec.history} target={rec.target} labels={HISTORY_LABELS} format={(v) => `${num(v)} dias`} label="Dias reconciliados sem diferença em aberto, por mês" />}
          />
          <KpiRow
            label="KYC/KYB por decidir"
            note={`Casos de investidores à espera de decisão de Compliance, incluindo registos feitos em /onboarding nesta sessão. Prazo interno: ${KYC_SLA_DAYS} dias por caso.`}
            value={num(openCases.length)}
            sub={openCases.length ? `o mais antigo tem ${plural(oldest, 'dia', 'dias')}` : 'fila vazia'}
            tone={oldest > KYC_SLA_DAYS ? 'warn' : 'ok'}
            toneLabel={oldest > KYC_SLA_DAYS ? 'Fora do prazo' : undefined}
            history={<KpiHistory kind="columns" values={kycHist} labels={KYC_WEEK_LABELS} ticks="ends" showLast format={(v) => plural(v, 'caso', 'casos')} label="Casos KYC abertos no fim de cada semana" />}
          />
          <KpiRow
            label="Prazo médio de venda de um lote"
            note={prazo.note}
            value={`${num(prazo.value, 1)} meses`}
            sub={`alvo ≤ ${num(prazo.target)} meses`}
            tone={prazo.status === 'ok' ? 'ok' : 'warn'}
            toneLabel={prazo.status === 'ok' ? undefined : 'Acima do alvo'}
            history={<KpiHistory kind="line" values={prazo.history} target={prazo.target} labels={HISTORY_LABELS} format={(v) => `${num(v, 1)} meses`} label="Prazo médio de venda por mês" />}
          />
        </ul>
      </Card>

      <section aria-labelledby="ciclo-t">
        <div className="mb-4">
          <h2 id="ciclo-t" className="text-[1.375rem] leading-tight">
            Lotes em ciclo
          </h2>
          <p className="measure mt-1 text-muted">
            Cada lote com o seu medidor: nos abertos, o financiamento; nos restantes, o stock que falta vender. Os lotes marcados «ilustrativo» são histórico ilustrativo, com dados fictícios: o piloto só começa em fevereiro de 2027.
          </p>
        </div>
        {/* tabela quando cabe; num contentor estreito, uma linha empilhada por lote (nada cortado) */}
        <div className="@container">
          <div className="hidden @min-[54rem]:block">
            <DataTable columns={columns} rows={cyc} getRowId={(l) => l.id} caption="Lotes em ciclo no piloto" initialSort={{ key: 'janela', dir: 'asc' }} />
          </div>
          <ul className="divide-y divide-border rounded-md border border-border bg-surface @min-[54rem]:hidden" aria-label="Lotes em ciclo no piloto">
            {[...cyc].sort((x, y) => (windowOf(x).ext ?? windowOf(x).end).localeCompare(windowOf(y).ext ?? windowOf(y).end)).map((l) => (
              <StackedLot key={l.id} lot={l} />
            ))}
          </ul>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader title="Diário operacional" description="Eventos dos produtores do piloto, mais recentes primeiro." />
          <CampaignFeed events={pilotEvents} live limit={8} />
        </Card>
        <Card>
          <CardHeader title="Telemetria dos produtores" description="Nível dos depósitos e armazéns, atualizado a cada leitura." />
          <ul className="divide-y divide-border">
            {liveProducers.map((p) => {
              const units = telemetry[p.id] ?? p.telemetry.units;
              const unit = p.telemetry.unitLabel;
              return (
                <li key={p.id} className="py-3 first:pt-0 last:pb-0" data-world={p.world}>
                  <p className="font-medium text-fg">{p.nome}</p>
                  <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-3">
                    {units.map((u) => (
                      <li key={u.id} className="flex items-center gap-2">
                        <LotGauge kind={p.world} value={u.capacity ? u.level / u.capacity : 0} size="xs" label={`${p.nome}, ${u.label}`} valueText={unit === 'kg' ? `${kg(u.level)} de ${kg(u.capacity)}` : `${num(u.level)} de ${num(u.capacity)} ${unit}`} />
                        <div className="text-sm leading-tight">
                          <div className="text-muted">{u.label}</div>
                          <div className="font-mono text-fg tnum">{unit === 'kg' ? kg(u.level) : `${num(u.level)} ${unit}`}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
