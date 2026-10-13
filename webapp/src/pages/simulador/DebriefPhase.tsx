import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Pencil, RefreshCw, Repeat, ShieldOff, Shield } from 'lucide-react';
import { ILLUSTRATIVE_LABEL, RESERVE_POOL, SIM_RULES, STATUS_LABEL, STATUS_TONE, fundedFraction, getQuest, isIllustrative } from '../../data';
import { Button, Card, CardHeader, DataTable, Disclaimer, RiskNote, StatusPill, type Column } from '../../components/ui';
import { LevelProgress, LotGauge } from '../../components/game';
import { useData, useGame } from '../../state';
import { cn } from '../../lib/cn';
import { eur, pct } from '../../lib/format';
import { getSimLot, monthLabel, shortName } from './deck';
import { simulateFull, type Allocation, type LotFinal, type SimRun } from './engine';
import { nextSeed } from './store';
import { ValueChart } from './ValueChart';
import { fe, fes, fpct, SimBand } from './parts';

export interface DebriefProps {
  run: SimRun;
  reviewing: boolean;
  pointsAwarded: number;
  streak: number;
  onReplay: (seed: number, allocations: Allocation[]) => void;
  onEdit: () => void;
}

interface Delta {
  id: string;
  title: string;
  text: string;
  delta: number;
}

export function DebriefPhase({ run, reviewing, pointsAwarded, streak, onReplay, onEdit }: DebriefProps) {
  const game = useGame();
  const f = run.final!;
  const { seed, allocations, decisions } = run;
  const hedgeable = allocations.filter((a) => getSimLot(a.simLotId)!.hedge.available);
  const anyHedged = allocations.some((a) => a.hedged);
  const extended = f.lots.filter((l) => l.extended);
  const refunded = f.lots.filter((l) => l.refunded);

  /* ---------------- contrafactuais (mesma semente) ---------------- */
  const cf = useMemo(() => {
    const noHedge = anyHedged ? simulateFull(seed, allocations.map((a) => ({ ...a, hedged: false })), decisions) : undefined;
    const allHedge = hedgeable.some((a) => !a.hedged) ? simulateFull(seed, allocations.map((a) => ({ ...a, hedged: Boolean(getSimLot(a.simLotId)!.hedge.available) })), decisions) : undefined;
    const noReserve = simulateFull(seed, allocations, decisions, { reserve: false });
    const declinedExt = Object.entries(decisions).some(([k, v]) => k.endsWith(':extensao') && v === 'recusar');
    const declinedRef = Object.entries(decisions).some(([k, v]) => k.endsWith(':refunding') && v === 'recusar');
    const noExt = extended.length ? simulateFull(seed, allocations, decisions, { force: { extensao: 'recusar' } }) : undefined;
    const withExt = declinedExt ? simulateFull(seed, allocations, decisions, { force: { extensao: 'aprovar' } }) : undefined;
    const noRef = refunded.length ? simulateFull(seed, allocations, decisions, { force: { refunding: 'recusar' } }) : undefined;
    const withRef = declinedRef ? simulateFull(seed, allocations, decisions, { force: { refunding: 'aprovar' } }) : undefined;
    return { noHedge, allHedge, noReserve, noExt, withExt, noRef, withRef };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, allocations, decisions]);

  const value = f.value;
  const did: Delta[] = [];
  if (cf.noHedge) {
    const d = value - cf.noHedge.final!.value;
    did.push({ id: 'cobertura', title: 'Coberturas', delta: d, text: d >= 0 ? `Valeram ${fe(d)} face à mesma campanha sem elas.` : `Custaram ${fe(-d)}: o preço não caiu o suficiente para pagar o seu custo. É o preço do seguro.` });
  }
  const dRes = value - cf.noReserve.final!.value;
  const reserveIn = f.lots.reduce((s, l) => s + l.reserveIn, 0);
  did.push({
    id: 'reserva',
    title: 'Reserva comum de primeira perda',
    delta: dRes,
    text:
      (dRes > 0.5 ? `Absorveu ${fe(dRes)} de perdas em ${f.lots.filter((l) => l.reserveUsed > 0.5).map((l) => shortName(l.simLotId)).join(', ')}${f.reserveExhausted ? ' e esgotou-se' : ''}.` : 'Não foi usada: nenhum lote acabou em perda.') +
      (reserveIn > 0.5 ? ` Os lotes com ganho entregaram-lhe ${fe(reserveIn)} (${pct(SIM_RULES.shares.reserve, 0)} da margem).` : ''),
  });
  if (cf.noExt) {
    const d = value - cf.noExt.final!.value;
    did.push({ id: 'extensao', title: 'Extensão', delta: d, text: d >= 0 ? `Esperar ${extended.length > 1 ? 'os meses de extensão' : `mais ${extended[0].settledAt - 18} meses`} valeu ${fe(d)} face a vender tudo no mês 18.` : `Esperar custou ${fe(-d)}: a armazenagem e o preço não compensaram face à venda de fecho no mês 18.` });
  }
  if (cf.noRef) {
    const d = value - cf.noRef.final!.value;
    did.push({ id: 'refunding', title: 'Refunding', delta: d, text: d >= 0 ? `Parar as vendas 4 meses valeu ${fe(d)}: o preço recuperou parte do choque.` : `Custou ${fe(-d)}: o preço não recuperou o suficiente para pagar a ronda.` });
  }

  const alt: Delta[] = [];
  if (cf.allHedge) {
    const names = hedgeable.filter((a) => !a.hedged).map((a) => shortName(a.simLotId)).join(', ');
    const d = cf.allHedge.final!.value - value;
    alt.push({ id: 'mais-cobertura', title: `Com cobertura também em ${names}`, delta: d, text: d >= 0 ? `Terias mais ${fe(d)}.` : `Terias menos ${fe(-d)}: nesta campanha a cobertura não compensava o custo.` });
  }
  if (cf.withExt) {
    const d = cf.withExt.final!.value - value;
    alt.push({ id: 'com-extensao', title: 'Aceitando a extensão proposta', delta: d, text: d >= 0 ? `Terias mais ${fe(d)}.` : `Terias menos ${fe(-d)}.` });
  }
  if (cf.withRef) {
    const d = cf.withRef.final!.value - value;
    alt.push({ id: 'com-refunding', title: 'Aprovando o refunding proposto', delta: d, text: d >= 0 ? `Terias mais ${fe(d)}.` : `Terias menos ${fe(-d)}.` });
  }

  /* ---------------- o que mais pesou ---------------- */
  const events = run.months.flatMap((m) => m.events);
  const worst = [...events].map((e) => ({ e, sum: e.hits.reduce((s, h) => s + h.impact, 0), saved: e.hits.reduce((s, h) => s + (h.hedgeSaved ?? 0), 0) })).sort((a, b) => a.sum - b.sum)[0];
  const reserveUsed = f.lots.reduce((s, l) => s + l.reserveUsed, 0);
  const losers = f.lots.filter((l) => l.result < -0.0005);

  const lossLine = f.result < 0 ? 'A campanha acabou em perda.' : losers.length ? `A carteira fechou positiva, mas ${losers.length === 1 ? 'um lote acabou' : `${losers.length} lotes acabaram`} em perda.` : 'Nenhum lote acabou em perda nesta campanha.';

  const hedgeToggle = anyHedged ? allocations.map((a) => ({ ...a, hedged: false })) : allocations.map((a) => ({ ...a, hedged: Boolean(getSimLot(a.simLotId)!.hedge.available) }));

  return (
    <div className="flex flex-col gap-8">
      {/* ---------------- resumo ---------------- */}
      <section aria-labelledby="balanco-title" className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="balanco-title" className="text-[1.625rem] leading-tight sm:text-[1.875rem]">
            Balanço da campanha
          </h2>
          <p className="font-mono text-sm text-muted tnum">
            Semente {seed} · {run.end} meses · {allocations.length} lotes{reviewing ? ' · a rever' : ''}
          </p>
        </div>
        <p className="measure mt-3 text-[1.125rem] leading-relaxed text-fg">
          Investiste <strong className="font-semibold">{fe(run.invested)}</strong> fictícios em {allocations.length} lotes. A campanha fechou com <strong className="font-semibold">{fe(value)}</strong>,{' '}
          <strong className="font-semibold">{fpct(f.result)}</strong>, depois de {run.end} meses. {lossLine}
        </p>
        <p className="measure mt-2 text-[1.0625rem] text-muted">
          {worst && worst.sum < -0.5 ? (
            <>
              O que mais pesou: <span className="text-fg">{worst.e.event.title.toLowerCase()}</span> em {monthLabel(worst.e.month)}, {fes(worst.sum)} nos teus lotes.
              {worst.saved > 0.5 && <> A cobertura evitou {fe(worst.saved)} desse efeito.</>}
            </>
          ) : (
            'Não houve choques adversos com peso nos teus lotes.'
          )}
          {reserveUsed > 0.5 && (
            <>
              {' '}
              A reserva comum absorveu {fe(reserveUsed)}
              {f.reserveExhausted ? ' e ficou a zero: o resto da perda foi dos cofinanciadores' : ''}.
            </>
          )}{' '}
          A queda máxima a meio da campanha foi de {pct(f.maxDrawdown, 1)}.
        </p>
        <SimBand compact className="mt-3" />
      </section>

      {/* ---------------- lotes ---------------- */}
      <section aria-labelledby="lotes-balanco" className="min-w-0">
        <h3 id="lotes-balanco" className="mb-3 text-[1.25rem]">
          Lote a lote
        </h3>
        <DataTable columns={lotColumns} rows={f.lots} getRowId={(l) => l.simLotId} caption="Resultado de cada lote, em € fictícios" />
        <p className="mt-2 text-sm text-muted">
          Num lote com ganho: investido + {pct(SIM_RULES.shares.investors, 0)} do resultado bruto = liquidação; os outros {pct(SIM_RULES.shares.sprout, 0)} vão para a Sprout e {pct(SIM_RULES.shares.reserve, 0)} para a reserva comum. Num lote com perda: investido + resultado bruto + o que a reserva ainda tinha = liquidação. Vendas inclui devoluções por força maior. Os custos base (compra, embalamento, logística, custódia, análises, seguros) já estão no preço de entrada; aqui estão só os custos extra.
        </p>
      </section>

      {/* ---------------- o que mudou ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card padding="md" aria-labelledby="mecanismos-title">
          <CardHeader title={<span id="mecanismos-title">O que cada mecanismo fez</span>} description="A mesma campanha, com a mesma semente, sem esse mecanismo." />
          <DeltaList rows={did} />
          {hedgeable.length === 0 && <p className="mt-3 text-sm text-muted">Os teus lotes eram de água: não havia cobertura para escolher.</p>}
          {alt.length > 0 && (
            <>
              <h4 className="mb-2 mt-6 text-[1rem]">E se tivesses escolhido de outra forma</h4>
              <DeltaList rows={alt} />
            </>
          )}
        </Card>
        <Card padding="md">
          <ValueChart run={run} counterfactual={cf.noHedge} month={run.end} title="A campanha inteira" height={240} />
        </Card>
      </div>

      {/* ---------------- e se? ---------------- */}
      <section aria-labelledby="ese-title" className="min-w-0">
        <h3 id="ese-title" className="text-[1.25rem]">
          E se?
        </h3>
        <p className="measure mt-1 text-muted">Joga outra vez para ver o que muda. A mesma semente repete os mesmos acontecimentos; outra semente traz outra campanha.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button iconLeft={<RefreshCw aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => onReplay(nextSeed(seed), allocations)}>
            Outra campanha, os mesmos lotes
          </Button>
          <Button
            variant="secondary"
            disabled={hedgeable.length === 0}
            title={hedgeable.length === 0 ? 'Sem lotes com cobertura disponível.' : undefined}
            iconLeft={anyHedged ? <ShieldOff aria-hidden className="size-4" strokeWidth={1.75} /> : <Shield aria-hidden className="size-4" strokeWidth={1.75} />}
            onClick={() => onReplay(seed, hedgeToggle)}
          >
            {anyHedged ? 'Esta campanha sem coberturas' : 'Esta campanha com coberturas'}
          </Button>
          <Button variant="secondary" iconLeft={<Repeat aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => onReplay(seed, allocations)}>
            Rejogar esta campanha
          </Button>
          <Button variant="ghost" iconLeft={<Pencil aria-hidden className="size-4" strokeWidth={1.75} />} onClick={onEdit}>
            Mudar a distribuição
          </Button>
        </div>
        {hedgeable.length === 0 && <p className="mt-2 text-sm text-muted">Sem lotes de azeite ou café, não há cobertura para comparar.</p>}
        {streak >= 3 && (
          <p className="measure mt-4 rounded-sm bg-surface-2 px-4 py-3 text-[0.9375rem] text-fg">
            Já jogaste {streak} campanhas seguidas. Cada semente é só uma campanha possível: correr mais não diz mais sobre o futuro de um lote real. Talvez seja altura de ler um lote aberto com calma.
          </p>
        )}
      </section>

      {/* ---------------- decisão real ---------------- */}
      <RealDecision />

      {/* ---------------- conhecimento e regras ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card padding="md" aria-labelledby="pontos-title">
          <CardHeader title={<span id="pontos-title">Conhecimento</span>} />
          {reviewing ? (
            <p className="text-[0.9375rem] text-muted">Estás a rever uma campanha antiga: rever não dá pontos.</p>
          ) : pointsAwarded > 0 ? (
            <p className="text-[0.9375rem] text-fg">
              <span className="font-mono tnum">+{pointsAwarded}</span> pontos de conhecimento pela missão «{getQuest('q-simulador')?.title}», cumprida ao abrires este balanço.
            </p>
          ) : (
            <p className="text-[0.9375rem] text-muted">Esta corrida não deu pontos. O simulador dá pontos uma vez, pela missão de completar uma campanha e ler o balanço. O resultado nunca conta.</p>
          )}
          <LevelProgress points={game.points} compact className="mt-4" />
        </Card>
        <Disclaimer kind="regulatorio" title="Porque existe este simulador" boxed>
          O Regulamento (UE) 2020/1503 (ECSP), no art. 21.º, obriga as plataformas de financiamento colaborativo a pedir aos investidores não sofisticados uma simulação da capacidade de suportar perdas, calculada como 10 % do património líquido. O piloto da Sprout é só para investidores profissionais e qualificados e não é uma plataforma ECSP, mas segue o mesmo espírito: antes de comprometer dinheiro real, joga campanhas que podem acabar em perda. Este simulador não substitui esse teste nem esse cálculo, não é aconselhamento e não prevê resultados.
        </Disclaimer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ tabela de lotes */

const lotColumns: Column<LotFinal>[] = [
  {
    key: 'lote',
    header: 'Lote',
    minWidth: 190,
    render: (l) => (
      <span className="flex flex-col">
        <span className="font-medium text-fg">{shortName(l.simLotId)}</span>
        <span className="text-muted">{getSimLot(l.simLotId)!.hedge.available ? (l.hedged ? 'com cobertura' : 'sem cobertura') : 'sem cobertura disponível'}</span>
      </span>
    ),
  },
  { key: 'inv', header: 'Investido', align: 'right', mono: true, render: (l) => fe(l.amount) },
  { key: 'vendas', header: 'Vendas', align: 'right', mono: true, render: (l) => fe(l.revenue + l.refunds) },
  { key: 'custos', header: 'Custos extra', align: 'right', mono: true, render: (l) => fe(l.costHedge + l.costEvents + l.costExtension + l.costRefunding) },
  { key: 'bruto', header: 'Resultado bruto', align: 'right', mono: true, render: (l) => fes(l.gross) },
  { key: 'sprout', header: 'Sprout', align: 'right', mono: true, render: (l) => (l.sprout > 0.5 ? fes(-l.sprout) : '—') },
  { key: 'reserva', header: 'Reserva comum', align: 'right', mono: true, render: (l) => (l.reserveUsed > 0.5 ? fes(l.reserveUsed) : l.reserveIn > 0.5 ? fes(-l.reserveIn) : '—') },
  { key: 'liq', header: 'Liquidação', align: 'right', mono: true, render: (l) => <span className="font-semibold">{fe(l.value)}</span> },
  { key: 'res', header: 'Resultado', align: 'right', mono: true, render: (l) => fpct(l.result) },
  {
    key: 'quando',
    header: 'Liquidou',
    minWidth: 120,
    render: (l) => (
      <span className="flex flex-col">
        <span className="font-mono tnum">{monthLabel(l.settledAt)}</span>
        <span className="text-muted">{l.extended ? 'com extensão' : l.fireSale ? 'venda de fecho' : `mês ${l.settledAt}`}</span>
      </span>
    ),
  },
];

/* ------------------------------------------------------------ barras divergentes */

function DeltaList({ rows }: { rows: Delta[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.delta)));
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((r) => {
        const w = (Math.abs(r.delta) / max) * 50;
        const pos = r.delta >= 0;
        return (
          <li key={r.id} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-fg">{r.title}</span>
              <span className="shrink-0 font-mono text-fg tnum">{fes(r.delta)}</span>
            </div>
            <div className="relative mt-1.5 h-2.5 rounded-full bg-surface-2" aria-hidden>
              <span className="absolute inset-y-[-3px] left-1/2 w-px bg-muted" />
              {Math.abs(r.delta) >= 0.5 && <span className={cn('absolute inset-y-0', pos ? 'left-1/2 rounded-r-full bg-accent' : 'right-1/2 rounded-l-full bg-warn')} style={{ width: `${Math.max(1, w)}%` }} />}
            </div>
            <p className="mt-1 text-sm text-muted">{r.text}</p>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------ lotes reais */

const LOSS_LOT = RESERVE_POOL.entries.find((e) => e.amount < 0);

const REAL = [
  { id: 'AZ-2026-021', anchor: '#cobertura', text: 'Lote aberto de azeite para HoReCa: 40 % vendido a prazo. Vê a que índice de origem o resto começa a perder, como fizeste aqui com a cobertura.' },
  { id: 'AZ-2026-024', anchor: '#cobertura', text: 'Lote aberto para distribuidores: 85 % vendido antes da compra. A margem é fina e o risco passa a ser o comprador cumprir.' },
  { id: 'AZ-2025-017', anchor: '', text: 'Um lote em extensão depois de o comprador do contrato cancelar metade das entregas: é assim que a extensão aparece na jornada e no calendário.' },
  {
    id: 'AZ-2025-009',
    anchor: '',
    text: LOSS_LOT
      ? `Um lote que liquidou com perda: a reserva comum absorveu ${eur(-LOSS_LOT.amount, { decimals: 0 })}, tudo o que tinha, e o resto ficou com os cofinanciadores.`
      : 'Um lote que liquidou com perda, depois de a reserva comum se esgotar.',
  },
];

function RealDecision() {
  const { getLot } = useData();
  return (
    <section aria-labelledby="real-title" className="min-w-0">
      <h3 id="real-title" className="text-[1.25rem]">
        O que isto quer dizer numa decisão real
      </h3>
      <p className="measure mt-1 text-muted">O simulador usa as regras dos lotes reais: a mesma partilha, a mesma reserva comum e os mesmos gatilhos. Antes de decidir, lê a jornada do lote: análises, cobertura, fatores de risco e calendário. Os lotes de campanhas anteriores são {ILLUSTRATIVE_LABEL.toLowerCase()}.</p>
      <ul className="mt-4 grid gap-x-6 gap-y-1 md:grid-cols-2">
        {REAL.map((r) => {
          const lot = getLot(r.id);
          if (!lot) return null;
          return (
            <li key={r.id} className="border-b border-border" data-world={lot.world}>
              <Link to={`/lote/${r.id}${r.anchor}`} className="group grid min-h-11 grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-3 no-underline">
                <LotGauge kind={lot.world} value={fundedFraction(lot)} size="sm" showScale={false} className="w-12" label={`Financiamento do ${lot.id}`} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[0.9375rem] font-medium text-fg">{lot.id}</span>
                    <StatusPill label={STATUS_LABEL[lot.status]} tone={STATUS_TONE[lot.status]} />
                    {isIllustrative(lot) && <span className="text-xs text-muted">{ILLUSTRATIVE_LABEL}</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{r.text}</span>
                </span>
                <ArrowRight aria-hidden className="size-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-fg" strokeWidth={1.75} />
              </Link>
            </li>
          );
        })}
      </ul>
      <RiskNote compact className="mt-4" />
    </section>
  );
}
