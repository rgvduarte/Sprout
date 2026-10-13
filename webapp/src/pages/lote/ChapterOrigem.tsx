import { ArrowDown, ArrowRight, FlaskConical } from 'lucide-react';
import { fundedFraction, getQuestsByLot, ILLUSTRATIVE_LABEL, ILLUSTRATIVE_NOTE, isIllustrative, priceUnit, QUESTS, remainingToFund } from '../../data';
import { JourneyTrack, LotGauge } from '../../components/game';
import { Badge, Button, ButtonLink, CommodityChip, RiskNote, StatusPill } from '../../components/ui';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, num, pct, price as rawPrice, tidyText } from '../../lib/format';
import { lotQuantityLabel } from '../../lib/physical';
import { useGame, useRole, useTelemetry } from '../../state';
import { playedLotCard } from '../inicio/missions';
import { LOT_GOAL } from '../mercados/model';
import { isAgentLot, lotPhysicalDetail, priceDecimals, stockLabel } from './model';
import { CheckMark, NoBreakIds, useJourney, Wrap } from './shared';
import { Terrain } from './Terrain';

const price = (v: number, unit: string, d?: number) => tidyText(rawPrice(v, unit, d));

/* =====================================================================
   Capítulo 1 · Origem. Primeiro ecrã completo: o lote, a origem, a ficha,
   o medidor físico do objetivo do lote e a ação real. No cesto de água
   (modelo de agente) não há financiamento: a ficha mostra o preço ao
   comprador e a comissão.
   ===================================================================== */

export interface DiligenceItem {
  id: 'analise' | 'riscos' | 'simulador';
  title: string;
  done: boolean;
  points?: number;
  target: string;
  detail: string;
}

/** Missões de diligência do lote (as que existem como missões dão pontos; as outras só contam como checkpoints). */
export function useDiligence(): DiligenceItem[] {
  const { lot } = useJourney();
  const game = useGame();
  const quests = getQuestsByLot(lot.id);
  const qAnalise = quests.find((q) => q.criteria.type === 'analysis-read');
  const qRiscos = quests.find((q) => q.criteria.type === 'risk-read');
  const qSim = QUESTS.find((q) => q.criteria.type === 'sim-complete');
  const read = game.riskRead(lot.id).filter((id) => lot.riskFactors.some((r) => r.id === id)).length;
  const total = lot.riskFactors.length;
  return [
    {
      id: 'analise',
      title: qAnalise?.title ?? `Lê o boletim de análises do ${lot.id}`,
      done: game.hasReadAnalysis(lot.id),
      points: qAnalise?.points,
      target: 'colheita',
      detail: lot.analyses.length ? `${lot.analyses[0].category} · ${lot.analyses[0].lab.split(' · ')[0]}` : 'Boletim publicado antes da abertura',
    },
    {
      id: 'riscos',
      title: qRiscos?.title ?? `Lê os ${total} fatores de risco do ${lot.id}`,
      done: read >= total,
      points: qRiscos?.points,
      target: 'riscos',
      detail: `${read} de ${total} lidos`,
    },
    {
      id: 'simulador',
      title: 'Joga uma campanha com este lote no simulador',
      // a mesma regra do Início: só conta uma campanha jogada com a carta deste lote
      done: playedLotCard(game, lot),
      points: qSim && !game.isQuestDone(qSim.id) ? qSim.points : undefined,
      target: 'riscos',
      detail: 'Dinheiro fictício, 18 meses, com perdas possíveis',
    },
  ];
}

function MissionCaption() {
  const { lot } = useJourney();
  const f = fundedFraction(lot);
  if (isAgentLot(lot)) {
    const e = lot.economics;
    return (
      <div className="min-w-0 pb-2">
        <p className="font-display text-[1.25rem] font-semibold leading-tight text-fg">Cesto · sem financiamento</p>
        <p className="mt-2 text-sm text-muted">
          Stock engarrafado: <span className="whitespace-nowrap font-mono text-fg tnum">{stockLabel(lot)}</span> de <span className="whitespace-nowrap font-mono tnum">{stockLabel(lot, lot.quantity)}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          O engarrafador fatura e entrega; a Sprout recebe <span className="whitespace-nowrap font-mono text-fg tnum">{pct(e.commissionPct ?? 0, 0)}</span> de comissão. Não há capital de cofinanciadores neste lote.
        </p>
      </div>
    );
  }
  if (lot.status === 'aberto') {
    return (
      <div className="min-w-0 pb-2">
        <p className="font-display text-[1.25rem] font-semibold leading-tight text-fg">Objetivo do lote</p>
        <p className="text-sm text-world-ink">{LOT_GOAL[lot.world](lot)}</p>
        <p className="mt-2 whitespace-nowrap text-[2.25rem] font-semibold leading-none tracking-[-0.02em] text-fg pnum">{pct(f, 0)}</p>
        <p className="mt-1.5 text-sm text-muted">
          <span className="font-mono text-fg tnum">{num(lot.funding.coFinancers)}</span> cofinanciadores
        </p>
        <p className="mt-2 text-sm text-muted">
          <span className="whitespace-nowrap font-mono text-fg tnum">{eur(lot.funding.raised)}</span> de <span className="whitespace-nowrap font-mono tnum">{eur(lot.funding.goal)}</span>
        </p>
        <p className="text-sm text-muted">
          Por financiar: <span className="whitespace-nowrap font-mono text-fg tnum">{eur(remainingToFund(lot))}</span>
        </p>
      </div>
    );
  }
  if (lot.status === 'em-preparacao') {
    return (
      <div className="min-w-0 pb-2">
        <p className="font-display text-[1.25rem] font-semibold leading-tight text-fg">Lote por abrir</p>
        <p className="mt-2 text-sm text-muted">
          Abre a financiamento a <span className="font-mono text-fg tnum">{fmtDate(lot.funding.opensPlanned ?? lot.funding.opensAt)}</span>, depois de publicado o boletim de análises.
        </p>
        <p className="mt-2 text-sm text-muted">
          Objetivo: <span className="whitespace-nowrap font-mono text-fg tnum">{eur(lot.funding.goal)}</span>
        </p>
      </div>
    );
  }
  return (
    <div className="min-w-0 pb-2">
      <p className="font-display text-[1.25rem] font-semibold leading-tight text-fg">Financiamento completo</p>
      <p className="mt-2 text-sm text-muted">
        Fechou a <span className="font-mono text-fg tnum">{lot.funding.closedAt ? fmtDate(lot.funding.closedAt) : '—'}</span> com{' '}
        <span className="font-mono text-fg tnum">{num(lot.funding.coFinancers)}</span> cofinanciadores
      </p>
      <p className="text-sm text-muted">
        Montante financiado: <span className="whitespace-nowrap font-mono text-fg tnum">{eur(lot.funding.goal)}</span>
      </p>
    </div>
  );
}

/** Paisagem com os depósitos ao nível da telemetria: só este bloco re-renderiza a cada leitura ao vivo. */
function LiveTerrain() {
  const { lot, ctx } = useJourney();
  const telemetry = useTelemetry();
  return <Terrain world={lot.world} seed={lot.id} tanks={telemetry[lot.producerId]} crop label={`${ctx.copy.terrainLabel}: ${ctx.producer.nome}, ${ctx.region.nome}`} />;
}

function DiligenceList({ items }: { items: DiligenceItem[] }) {
  const { goTo } = useJourney();
  const done = items.filter((i) => i.done).length;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[1.0625rem]">Missões de diligência</h2>
        <p className="text-sm text-muted">
          <span className="font-mono text-fg tnum">
            {done}/{items.length}
          </span>{' '}
          cumpridas
        </p>
      </div>
      <ul className="mt-2 divide-y divide-world-line border-y border-world-line">
        {items.map((it) => (
          <li key={it.id} className="flex min-w-0 items-center gap-3 py-2">
            <CheckMark done={it.done} />
            <div className="min-w-0 flex-1">
              <p className={cn('text-[0.9375rem] font-medium leading-snug', it.done ? 'text-muted' : 'text-fg')}>
                <NoBreakIds text={it.title} />
                <span className="sr-only">{it.done ? ' · cumprida' : ' · por fazer'}</span>
              </p>
              <p className="text-sm text-muted">
                {it.points !== undefined && <span className="font-mono tnum">+{it.points} pts · </span>}
                {it.detail}
              </p>
            </div>
            {!it.done && (
              <button type="button" onClick={() => goTo(it.target)} className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-sm font-medium text-accent hover:underline" aria-label={`Fazer: ${it.title}`}>
                Fazer
                <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-muted">Os pontos vêm da diligência, nunca do montante.</p>
    </div>
  );
}

function SpecRow({ label, value, detail, mono = true }: { label: string; value: string; detail?: string; mono?: boolean }) {
  return (
    <div className="min-w-0 border-t border-world-line py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={cn('mt-0.5 text-[1.0625rem] text-fg', mono && 'font-mono tnum')}>{value}</dd>
      {detail && <dd className="mt-0.5 text-sm text-muted">{detail}</dd>}
    </div>
  );
}

/** Linhas da ficha do lote: a economia do lote, por modelo (principal: comprar, embalar e vender; agente: cesto com comissão). */
function specRows(lot: ReturnType<typeof useJourney>['lot'], win: ReturnType<typeof useJourney>['win']): { label: string; value: string; detail?: string; mono?: boolean }[] {
  const e = lot.economics;
  const unit = priceUnit(lot);
  const d = priceDecimals(lot);
  const quantity = { label: 'Quantidade', value: lotQuantityLabel(lot), detail: lotPhysicalDetail(lot) };
  const storage = { label: 'Armazenagem', value: lot.storage.container, detail: lot.storage.local, mono: false };
  if (isAgentLot(lot)) {
    return [
      quantity,
      { label: `Preço ao comprador · ${e.channelLabel}`, value: price(e.buyerPrice, unit, d), detail: e.priceBasis },
      { label: 'Comissão da Sprout', value: `${pct(e.commissionPct ?? 0, 0)} do valor de venda`, detail: 'Faturada ao engarrafador. A Sprout não compra nem guarda stock.', mono: false },
      { label: 'Financiamento', value: 'Nenhum', detail: 'O engarrafador fatura e entrega; o comprador paga-lhe a ele. Não há capital de cofinanciadores.', mono: false },
      { label: e.refLabel, value: price(e.refPrice, unit, d), detail: e.refNote },
      storage,
    ];
  }
  const acquisition =
    lot.world === 'azeite'
      ? `Aquisição ao lagar ${num(e.acquisitionPrice, d)} (índice de origem ${num(e.indexAtOpen, d)} + prémio ${num(e.producerPremium, d)}) + custos até à venda ${num(e.costsPerUnit, d)}${e.packingCost > 0 ? `, dos quais embalamento no co-packer ${num(e.packingCost, d)}` : ''}`
      : `Aquisição ${num(e.acquisitionPrice, d)} + custos até à venda ${num(e.costsPerUnit, d)}`;
  return [
    quantity,
    { label: `Preço ao comprador · ${e.channelLabel}`, value: price(e.buyerPrice, unit, d), detail: e.priceBasis },
    { label: 'Preço financiado', value: price(e.fundingPrice, unit, d), detail: acquisition },
    { label: 'Janela de liquidação', value: `${win.months} meses`, detail: `Liquidação prevista até ${fmtDate(win.end)} · extensão condicionada até ${lot.extension.maxMonths} meses` },
    { label: 'Investimento por cofinanciador', value: `${eur(lot.funding.minTicket)} a ${eur(lot.funding.maxTicket)}`, detail: 'Sem mercado secundário no piloto' },
    storage,
  ];
}

export function ChapterOrigem({ diligence }: { diligence: DiligenceItem[] }) {
  const { lot, ctx, win, positions, goTo, ending } = useJourney();
  const { isVisitor } = useRole();
  const agent = isAgentLot(lot);
  const colhido = lot.milestones.find((m) => m.stage === 'colhido');
  const mine = positions.reduce((s, p) => s + p.amount, 0);
  const illustrative = isIllustrative(lot);
  const gaugeValue = agent ? (lot.quantity > 0 ? Math.min(1, lot.stock / lot.quantity) : 0) : fundedFraction(lot);

  return (
    <section id="origem" data-chapter="Origem" aria-labelledby="origem-titulo" className="relative scroll-mt-6 overflow-hidden border-b border-world-line" style={{ background: 'color-mix(in oklab, var(--world) 8%, var(--bg))' }}>
      {/* 12 colunas só com espaço para elas (≥ 1280 px): entre 1024 e 1280, com o rail, o medidor e os números ficavam espremidos */}
      <Wrap className="grid gap-x-10 gap-y-7 pb-10 pt-7 xl:grid-cols-12 xl:pt-10">
        <div className="contents xl:col-span-7 xl:flex xl:flex-col xl:gap-7">
          {/* título */}
          <div className="order-1 min-w-0 xl:order-none">
            <h1 id="origem-titulo" tabIndex={-1} className="text-[clamp(2.125rem,3.7vw,3.375rem)] leading-[1.02] outline-none" style={{ letterSpacing: '-0.025em' }}>
              {lot.title}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[1.0625rem] text-muted">
              <span className="font-mono font-medium text-fg tnum">{lot.id}</span>
              <span aria-hidden>·</span>
              <span className="text-fg">{ctx.producer.nome}</span>
              <span aria-hidden>·</span>
              <span>
                {ctx.producer.localidade}, {ctx.region.nome}
              </span>
              <span aria-hidden>·</span>
              <span>Campanha {lot.campanha}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={lot.status} />
              <CommodityChip world={lot.world} label="world" />
              {illustrative && (
                <Badge tone="warn" icon={<FlaskConical aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />}>
                  {ILLUSTRATIVE_LABEL}
                </Badge>
              )}
              {ctx.producer.certifications.slice(0, 1).map((c) => (
                <span key={c} className="inline-flex min-h-6 items-center rounded-xs border border-world-line px-2 text-[0.8125rem] text-world-ink">
                  {c}
                </span>
              ))}
            </div>
            {illustrative && <p className="measure mt-3 text-sm text-muted">{ILLUSTRATIVE_NOTE}</p>}
            <p className="max-w-[62ch] mt-4 text-[1.0625rem] leading-relaxed text-fg">
              {lot.product}. {colhido?.note}
            </p>
          </div>

          {/* ficha */}
          <dl className="order-4 grid min-w-0 gap-x-8 sm:grid-cols-2 xl:order-none">
            {specRows(lot, win).map((r) => (
              <SpecRow key={r.label} label={r.label} value={r.value} detail={r.detail} mono={r.mono} />
            ))}
          </dl>

          {/* ação */}
          <div className="order-2 min-w-0 xl:order-none">
            <div className="flex flex-wrap gap-2">
              {ending === 'compromisso' && !isVisitor && (
                <Button variant="primary" size="lg" iconRight={<ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => goTo('compromisso')}>
                  {positions.some((p) => p.session) ? 'Ver o teu compromisso' : 'Comprometer capital'}
                </Button>
              )}
              {ending === 'compromisso' && isVisitor && (
                <>
                  <ButtonLink to={`/onboarding?lote=${lot.id}`} variant="primary" size="lg">
                    Pedir acesso ao piloto
                  </ButtonLink>
                  <Button variant="secondary" size="lg" onClick={() => goTo('compromisso')}>
                    Ver o ritual de compromisso
                  </Button>
                </>
              )}
              {ending !== 'compromisso' && (
                <Button variant="primary" size="lg" iconRight={<ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => goTo(ending)}>
                  {agent ? 'Ver como funciona o cesto' : lot.status === 'liquidado' ? 'Ver a liquidação' : lot.status === 'em-preparacao' ? 'Ver a abertura' : 'Acompanhar o lote'}
                </Button>
              )}
              <Button variant="secondary" size="lg" onClick={() => goTo('riscos')}>
                Ler os {lot.riskFactors.length} fatores de risco
              </Button>
            </div>
            {mine > 0 && (
              <p className="mt-3 text-sm text-muted">
                A tua posição neste lote: <span className="font-mono text-fg tnum">{eur(mine)}</span>
                {illustrative && ` · ${ILLUSTRATIVE_LABEL.toLowerCase()}`}
              </p>
            )}
            {!agent && <RiskNote compact className="mt-4" />}
          </div>
        </div>
        <div className="contents xl:col-span-5 xl:flex xl:flex-col xl:gap-8">
          {/* medidor do lote sobre a paisagem */}
          <div className="order-3 min-w-0 xl:order-none">
            <LiveTerrain />
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 pt-3">
                <MissionCaption />
              </div>
              <LotGauge
                kind={lot.world}
                value={gaugeValue}
                size="lg"
                animateOnMount
                label={agent ? `Stock engarrafado do lote ${lot.id}` : `Financiamento do lote ${lot.id}`}
                valueText={agent ? `${stockLabel(lot)} de ${stockLabel(lot, lot.quantity)}` : `${pct(gaugeValue, 1)} financiado`}
                className="w-[132px] shrink-0 sm:w-[180px] xl:w-[200px] [&_svg]:h-auto [&_svg]:w-full"
              />
            </div>
          </div>

          <div className="order-5 min-w-0 xl:order-none">
            <DiligenceList items={diligence} />
          </div>
        </div>
      </Wrap>

      <Wrap className="pb-10">
        <div className="border-t border-world-line pt-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[1.0625rem]">Jornada física do lote</h2>
            <p className="text-sm text-muted">Os marcos acendem quando o produtor regista o evento.</p>
          </div>
          <JourneyTrack lot={lot} compact />
        </div>
      </Wrap>
    </section>
  );
}
