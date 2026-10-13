import { ArrowDown, ArrowRight } from 'lucide-react';
import { fundedFraction, remainingToFund, getQuest, getQuestsByLot, priceUnit } from '../../data';
import type { Quest } from '../../data/types';
import { JourneyTrack, LotGauge } from '../../components/game';
import { Button, ButtonLink, CommodityChip, RiskNote, StatusPill } from '../../components/ui';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, num, pct, price } from '../../lib/format';
import { lotQuantityLabel } from '../../lib/physical';
import { useData, useGame, useRole } from '../../state';
import { lotPhysicalDetail, priceDecimals } from './model';
import { CheckMark, NoBreakIds, useJourney, Wrap } from './shared';
import { Terrain } from './Terrain';

/* =====================================================================
   Capítulo 1 · Origem. Primeiro ecrã completo: o lote, a origem, a ficha,
   o medidor físico da missão e a ação real.
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
  const qSim = getQuest('q-simulador') as Quest;
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
      title: 'Joga esta campanha no simulador',
      done: game.isQuestDone(qSim.id),
      points: qSim.points,
      target: 'riscos',
      detail: 'Dinheiro fictício, 18 meses, com perdas possíveis',
    },
  ];
}

function MissionCaption() {
  const { lot, ctx } = useJourney();
  const f = fundedFraction(lot);
  if (lot.status === 'aberto') {
    return (
      <div className="min-w-0 pb-2">
        <p className="font-display text-[1.25rem] font-semibold leading-tight text-fg">{ctx.copy.mission}</p>
        <p className="mt-2 text-[2.25rem] font-semibold leading-none tracking-[-0.02em] text-fg pnum">{pct(f, 0)}</p>
        <p className="mt-1.5 text-sm text-muted">
          <span className="font-mono text-fg tnum">{num(lot.funding.coFinancers)}</span> co-financiadores
        </p>
        <p className="mt-2 text-sm text-muted">
          <span className="font-mono text-fg tnum">{eur(lot.funding.raised)}</span> de <span className="font-mono tnum">{eur(lot.funding.goal)}</span>
        </p>
        <p className="text-sm text-muted">
          Por financiar: <span className="font-mono text-fg tnum">{eur(remainingToFund(lot))}</span>
        </p>
      </div>
    );
  }
  if (lot.status === 'em-preparacao') {
    return (
      <div className="min-w-0 pb-2">
        <p className="font-display text-[1.25rem] font-semibold leading-tight text-fg">Missão por abrir</p>
        <p className="mt-2 text-sm text-muted">
          Abre a financiamento a <span className="font-mono text-fg tnum">{fmtDate(lot.funding.opensPlanned ?? lot.funding.opensAt)}</span>, depois de publicado o boletim de análises.
        </p>
        <p className="mt-2 text-sm text-muted">
          Objetivo: <span className="font-mono text-fg tnum">{eur(lot.funding.goal)}</span>
        </p>
      </div>
    );
  }
  return (
    <div className="min-w-0 pb-2">
      <p className="font-display text-[1.25rem] font-semibold leading-tight text-fg">Missão concluída</p>
      <p className="mt-1 text-sm font-medium text-fg">Financiamento completo</p>
      <p className="mt-2 text-sm text-muted">
        Fechou a <span className="font-mono text-fg tnum">{lot.funding.closedAt ? fmtDate(lot.funding.closedAt) : '—'}</span> com{' '}
        <span className="font-mono text-fg tnum">{num(lot.funding.coFinancers)}</span> co-financiadores
      </p>
      <p className="text-sm text-muted">
        Montante financiado: <span className="font-mono text-fg tnum">{eur(lot.funding.goal)}</span>
      </p>
    </div>
  );
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

export function ChapterOrigem({ diligence }: { diligence: DiligenceItem[] }) {
  const { lot, ctx, win, positions, goTo } = useJourney();
  const { isVisitor } = useRole();
  const data = useData();
  const e = lot.economics;
  const unit = priceUnit(lot);
  const d = priceDecimals(lot);
  const colhido = lot.milestones.find((m) => m.stage === 'colhido');
  const mine = positions.reduce((s, p) => s + p.amount, 0);
  // o medidor fica ao lado da paisagem (nada do desenho fica escondido)
  const overlap = false;

  return (
    <section id="origem" data-chapter="Origem" aria-labelledby="origem-titulo" className="relative scroll-mt-6 overflow-hidden border-b border-world-line" style={{ background: 'color-mix(in oklab, var(--world) 8%, var(--bg))' }}>
      <Wrap className="grid gap-x-10 gap-y-7 pb-10 pt-7 lg:grid-cols-12 lg:pt-10">
        <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-7">
        {/* título */}
        <div className="order-1 min-w-0 lg:order-none">
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
            {ctx.producer.certifications.slice(0, 1).map((c) => (
              <span key={c} className="inline-flex h-6 items-center rounded-xs border border-world-line px-2 text-[0.8125rem] text-world-ink">
                {c}
              </span>
            ))}
          </div>
          <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-fg">
            {lot.product}. {colhido?.note}
          </p>
        </div>

        {/* ficha */}
        <dl className="order-4 grid min-w-0 gap-x-8 sm:grid-cols-2 lg:order-none">
          <SpecRow label="Quantidade" value={lotQuantityLabel(lot)} detail={lotPhysicalDetail(lot)} />
          <SpecRow label="Preço de venda ao comprador B2B" value={price(e.buyerPrice, unit, d)} detail={`${pct(e.discountPct, 0)} abaixo da referência de ${price(e.refPrice, unit, d)}`} />
          <SpecRow label="Custo do lote financiado" value={price(e.fundingPrice, unit, d)} detail={`Aquisição ${num(e.acquisitionPrice, d)} + custos ${num(e.costsPerUnit, d)} (análises, armazenagem, seguro, logística, cobertura)`} />
          <SpecRow label="Janela de liquidação" value={`${win.months} meses`} detail={`Liquidação prevista até ${fmtDate(win.end)} · extensão condicionada até ${lot.extension.maxMonths} meses`} />
          <SpecRow label="Bilhete por co-financiador" value={`${eur(lot.funding.minTicket)} a ${eur(lot.funding.maxTicket)}`} detail="Sem mercado secundário no piloto" />
          <SpecRow label="Armazenagem" value={lot.storage.container} detail={lot.storage.local} mono={false} />
        </dl>

        {/* ação */}
        <div className="order-2 min-w-0 lg:order-none">
          <div className="flex flex-wrap gap-2">
            {lot.status === 'aberto' && !isVisitor && (
              <Button variant="primary" size="lg" iconRight={<ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => goTo('compromisso')}>
                Comprometer capital
              </Button>
            )}
            {lot.status === 'aberto' && isVisitor && (
              <>
                <ButtonLink to="/onboarding" variant="primary" size="lg">
                  Pedir acesso ao piloto
                </ButtonLink>
                <Button variant="secondary" size="lg" onClick={() => goTo('compromisso')}>
                  Ver o ritual de compromisso
                </Button>
              </>
            )}
            {lot.status !== 'aberto' && (
              <Button variant="primary" size="lg" iconRight={<ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => goTo(lot.status === 'liquidado' ? 'liquidacao' : lot.status === 'em-preparacao' ? 'abertura' : 'acompanhamento')}>
                {lot.status === 'liquidado' ? 'Ver a liquidação' : lot.status === 'em-preparacao' ? 'Ver a abertura' : 'Acompanhar o lote'}
              </Button>
            )}
            <Button variant="secondary" size="lg" onClick={() => goTo('riscos')}>
              Ler os {lot.riskFactors.length} fatores de risco
            </Button>
          </div>
          {mine > 0 && (
            <p className="mt-3 text-sm text-muted">
              A tua posição neste lote: <span className="font-mono text-fg tnum">{eur(mine)}</span>
            </p>
          )}
          <RiskNote compact className="mt-4" />
        </div>

        </div>
        <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-8">
        {/* medidor da missão sobre a paisagem */}
        <div className="order-3 min-w-0 lg:order-none">
          <Terrain world={lot.world} seed={lot.id} tanks={data.telemetry[lot.producerId]} crop label={`${ctx.copy.terrainLabel}: ${ctx.producer.nome}, ${ctx.region.nome}`} />
          <div className={cn('relative', !overlap && 'flex items-end justify-between gap-4')}>
            <div className={cn('min-w-0 pt-3', overlap && 'pr-[156px] sm:pr-[216px] xl:pr-[256px]')}>
              <MissionCaption />
            </div>
            <LotGauge
              kind={lot.world}
              value={fundedFraction(lot)}
              size="lg"
              animateOnMount
              label={`Financiamento do lote ${lot.id}`}
              valueText={`${pct(fundedFraction(lot), 1)} financiado`}
              className={cn(overlap ? 'absolute bottom-0 right-0 w-[148px] sm:w-[200px] xl:w-[240px]' : 'w-[132px] shrink-0 sm:w-[180px] xl:w-[200px]', '[&_svg]:h-auto [&_svg]:w-full')}
            />
          </div>
        </div>

        <div className="order-5 min-w-0 lg:order-none">
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
