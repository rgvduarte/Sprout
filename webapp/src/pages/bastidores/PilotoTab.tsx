import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { fundedFraction, getProducer, PRODUCERS, stageLabel, type Lot } from '../../data';
import { CampaignFeed, LotGauge } from '../../components/game';
import { Card, CardHeader, DataTable, StatusPill, type Column } from '../../components/ui';
import { useData, useFeed } from '../../state';
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
  ORDER_FILL_NOTE,
  orderFill,
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
    <li className="grid items-start gap-x-8 gap-y-3 border-t border-border py-4 first:border-t-0 first:pt-1 md:grid-cols-[minmax(0,1fr)_11.5rem] xl:grid-cols-[minmax(0,1fr)_11.5rem_220px]">
      <div className="min-w-0">
        <h3 className="text-[1rem] leading-snug">{label}</h3>
        <p className="measure mt-1 text-sm text-muted">{note}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[1.5rem] font-semibold leading-tight text-fg pnum">{value}</p>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
        <StatusPill className="mt-2" tone={tone} label={toneLabel ?? TONE_LABEL[tone]} />
      </div>
      <div className="min-w-0 md:col-span-2 xl:col-span-1">{history}</div>
    </li>
  );
}

const pct0 = (v: number) => pct(v, 1);

function physicalStock(lot: Lot) {
  if (lot.unit === 'kg') return { now: kg(lot.stock), of: kg(lot.quantity) };
  const u = lot.unit === 'palete' ? 'paletes' : 'sacas';
  return { now: `${num(lot.stock)} ${u}`, of: `${num(lot.quantity)} ${u}` };
}

export default function PilotoTab() {
  const { lots, events, telemetry } = useData();
  const feed = useFeed();
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
  const fill = orderFill();
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
      minWidth: 230,
      render: (l) => {
        const open = l.status === 'aberto';
        const v = open ? fundedFraction(l) : l.quantity ? l.stock / l.quantity : 0;
        return (
          <div className="flex items-center gap-3">
            <LotGauge kind={l.world} value={v} size="xs" label={open ? `Financiamento do ${l.id}` : `Stock por vender do ${l.id}`} />
            <div className="min-w-0">
              <Link to={`/lote/${l.id}`} className="font-mono text-[0.9375rem] font-medium text-accent underline decoration-[color-mix(in_oklab,var(--accent)_40%,transparent)] underline-offset-[0.2em] hover:decoration-accent tnum">
                {l.id}
              </Link>
              <p className="truncate text-sm text-muted">{getProducer(l.producerId)?.nome}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'estado', header: 'Estado', sortValue: (l) => l.status, render: (l) => <StatusPill status={l.status} /> },
    { key: 'etapa', header: 'Etapa', sortValue: (l) => l.stage, render: (l) => stageLabel(l.world, l.stage) },
    {
      key: 'financiado',
      header: 'Financiado',
      align: 'right',
      mono: true,
      sortValue: (l) => l.funding.raised,
      render: (l) => (
        <div>
          <div>{eur(l.funding.raised)}</div>
          {l.status === 'aberto' && <div className="text-xs text-muted">de {eur(l.funding.goal)} · {pct(fundedFraction(l), 0)}</div>}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock por vender',
      align: 'right',
      mono: true,
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
    { key: 'co', header: 'Co-financiadores', align: 'right', mono: true, sortValue: (l) => l.funding.coFinancers, render: (l) => num(l.funding.coFinancers) },
  ];

  const liveProducers = PRODUCERS.filter((p) => p.fase === 1 && p.telemetry.live);
  const pilotEvents = events.filter((e) => e.world !== 'cafe');

  return (
    <div className="flex flex-col gap-10">
      <Card>
        <CardHeader title="Indicadores do piloto" description="Valor de hoje, alvo do desenho do piloto e os últimos seis períodos. Passa o cursor pelo histórico para ver cada valor." />
        <ul>
          <KpiRow
            label="Capital financiado vs. comprometido com produtores"
            note={`Compromisso de compra assumido nos ${cyc.length} lotes em ciclo e o que os co-financiadores já financiaram. A diferença é o que falta nos lotes abertos.`}
            value={eur(cap.financed)}
            sub={`de ${eur(cap.committed)} · ${pct(cap.financed / cap.committed, 1)}`}
            tone={cap.gap > 0 ? 'info' : 'ok'}
            toneLabel={cap.gap > 0 ? `${eur(cap.gap)} por financiar` : 'Tudo financiado'}
            history={<KpiHistory kind="columns" values={hist.financed} track={hist.committed} labels={HISTORY_LABELS} format={(v) => eur(v, { compact: true })} label="Capital financiado (coluna cheia) e comprometido (contorno)" />}
          />
          <KpiRow
            label="Lotes em ciclo"
            note="Lotes com capital comprometido e ainda por liquidar. Saem do ciclo quando o último pagamento chega aos co-financiadores."
            value={num(cyc.length)}
            sub={`${plural(counts.aberto, 'aberto', 'abertos')} · ${plural(counts.financiado, 'financiado', 'financiados')} · ${num(counts.extensao)} em extensão`}
            tone={counts.extensao > 0 ? 'info' : 'ok'}
            toneLabel={counts.extensao > 0 ? `${num(counts.extensao)} em extensão` : undefined}
            history={<KpiHistory kind="columns" values={hist.inCycle} labels={HISTORY_LABELS} format={(v) => num(v)} label="Lotes em ciclo no fim de cada mês" />}
          />
          <KpiRow
            label="Fill rate de encomendas B2B"
            note={`${ORDER_FILL_NOTE} Últimos 90 dias: ${fill.complete} de ${fill.orders} encomendas.`}
            value={pct(fill.value, 1)}
            sub="alvo ≥ 95,0 %"
            tone={fill.value >= 0.95 ? 'ok' : 'warn'}
            history={<KpiHistory kind="line" values={fill.history} target={0.95} labels={HISTORY_LABELS} format={pct0} label="Fill rate de encomendas por mês" />}
          />
          <KpiRow
            label="Financiamento dos lotes da campanha"
            note={fr.note}
            value={pct(fr.value, 0)}
            sub={`alvo ≥ ${pct(fr.target, 0)}`}
            tone={fr.value >= fr.target ? 'ok' : 'warn'}
            toneLabel={fr.value >= fr.target ? undefined : 'Abaixo do alvo'}
            history={<KpiHistory kind="line" values={fr.history} target={fr.target} labels={HISTORY_LABELS} format={pct0} label="Financiamento dos lotes por mês" />}
          />
          <KpiRow
            label="Variação de base: preço ao comprador vs. referência"
            note={`${base.note} O desenho do piloto fixa o desconto entre 10 % e 15 % abaixo da referência de mercado.`}
            value={pct(base.value, 1, { sign: true })}
            sub={`alvo ${pct(base.target, 0, { sign: true })} (banda −10 % a −15 %)`}
            tone={base.value <= -0.1 && base.value >= -0.15 ? 'ok' : 'warn'}
            history={<KpiHistory kind="line" values={base.history} target={base.target} labels={HISTORY_LABELS} format={(v) => pct(v, 1, { sign: true })} label="Desconto médio ao comprador por mês" />}
          />
          <KpiRow
            label="SLA de pagamento a produtores (D+2 úteis)"
            note={slaP.note}
            value={pct(slaP.value, 0)}
            sub={`alvo ≥ ${pct(slaP.target, 0)}`}
            tone={slaP.value >= slaP.target ? 'ok' : 'warn'}
            history={<KpiHistory kind="line" values={slaP.history} target={slaP.target} labels={HISTORY_LABELS} format={pct0} label="Pagamentos a produtores dentro do prazo por mês" />}
          />
          <KpiRow
            label="SLA de liquidação a investidores"
            note={slaI.note}
            value={pct(slaI.value, 0)}
            sub={`alvo ${pct(slaI.target, 0)}`}
            tone={slaI.value >= slaI.target ? 'ok' : 'warn'}
            history={<KpiHistory kind="line" values={slaI.history} target={slaI.target} labels={HISTORY_LABELS} format={pct0} label="Liquidações dentro da janela por mês" />}
          />
          <KpiRow
            label="Reconciliação diária e quebras"
            note={`${rec.note} Hoje: ${st.recon ? `conciliado às ${st.recon.at.slice(11, 16)}` : 'por executar (SLA até às 20:00)'}.`}
            value={`${num(rec.value)} de 30 dias`}
            sub={`${plural(recon.breaks.length, 'quebra', 'quebras')} · ${num(recon.open.length)} em aberto`}
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
            history={<KpiHistory kind="columns" values={kycHist} labels={KYC_WEEK_LABELS} format={(v) => plural(v, 'caso', 'casos')} label="Casos KYC abertos no fim de cada semana" />}
          />
          <KpiRow
            label="Prazo médio de venda de um lote"
            note={prazo.note}
            value={`${num(prazo.value, 1)} meses`}
            sub={`alvo ≤ ${num(prazo.target)} meses`}
            tone={prazo.value <= prazo.target ? 'ok' : 'warn'}
            history={<KpiHistory kind="line" values={prazo.history} target={prazo.target} labels={HISTORY_LABELS} format={(v) => `${num(v, 1)} meses`} label="Prazo médio de venda por mês" />}
          />
        </ul>
      </Card>

      <section aria-labelledby="ciclo-t">
        <div className="mb-4">
          <h2 id="ciclo-t" className="text-[1.375rem] leading-tight">
            Lotes em ciclo
          </h2>
          <p className="measure mt-1 text-muted">Cada lote com o seu medidor: nos abertos, o financiamento; nos restantes, o stock que falta vender.</p>
        </div>
        <DataTable columns={columns} rows={cyc} getRowId={(l) => l.id} caption="Lotes em ciclo no piloto" initialSort={{ key: 'janela', dir: 'asc' }} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader title="Diário operacional" description="Eventos dos produtores do piloto, mais recentes primeiro." />
          <CampaignFeed events={pilotEvents} live={{ paused: feed.paused, reason: feed.pauseReason }} limit={8} />
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
