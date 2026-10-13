import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { fundedFraction, getQuestsByWorld, getSealForLot, isInvestable, getWorld } from '../../data';
import type { Lot } from '../../data/types';
import { LotGauge, OriginSeal, QuestList } from '../../components/game';
import { ButtonLink, CommodityChip, Disclaimer, Page, StatusPill } from '../../components/ui';
import { date as fmtDate, eur, num, pct, price, tidyText } from '../../lib/format';
import { lotQuantityLabel } from '../../lib/physical';
import { useData, useGame } from '../../state';
import { lotContext } from './model';
import { Terrain } from './Terrain';

/* =====================================================================
   Estados amigáveis: lote desconhecido e lote da Fase 2 (café).
   ===================================================================== */

export function UnknownLot({ id }: { id?: string }) {
  const data = useData();
  const open = data.lots.filter(isInvestable);
  return (
    <Page width="narrow">
      <div className="flex flex-col items-start gap-4 py-8">
        <h1 className="text-[1.875rem] leading-tight">Não encontramos o lote {id ? <span className="font-mono">{id}</span> : 'pedido'}</h1>
        <p className="max-w-[62ch] text-muted">Os números de lote têm o formato AZ-2026-021 (azeite), AG-2026-007 (água) ou CF-2027-001 (café). Se vieste de uma ligação antiga, o lote pode ter mudado de número. Estes estão abertos a financiamento hoje:</p>
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {open.map((l) => {
          const ctx = lotContext(l);
          return (
            <li key={l.id}>
              <Link to={`/lote/${l.id}`} className="group flex min-h-16 items-center gap-4 py-3 no-underline" data-world={l.world}>
                <LotGauge kind={l.world} value={fundedFraction(l)} size="xs" label={`Financiamento do lote ${l.id}`} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-fg group-hover:underline">{l.title}</span>
                  <span className="block text-sm text-muted">
                    <span className="font-mono tnum">{l.id}</span> · {ctx.producer.nome} · {pct(fundedFraction(l), 0)} financiado
                  </span>
                </span>
                <ArrowRight aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink to="/mercados" variant="primary">
          Ver os mercados
        </ButtonLink>
        <ButtonLink to="/">Voltar ao início</ButtonLink>
      </div>
    </Page>
  );
}

export function PhaseTwoLot({ lot }: { lot: Lot }) {
  const ctx = lotContext(lot);
  const game = useGame();
  const data = useData();
  const world = getWorld(lot.world);
  const analysis = lot.analyses[0];
  const sealDef = getSealForLot(lot);
  const seal = sealDef ? data.seals.find((s) => s.def.id === sealDef.id) : undefined;
  const quests = getQuestsByWorld(lot.world);
  return (
    <div data-world={lot.world} className="min-w-0">
      <section aria-labelledby="fase2-titulo" style={{ background: 'color-mix(in oklab, var(--world) 8%, var(--bg))' }} className="border-b border-world-line">
        <Page className="grid gap-x-10 gap-y-6 pb-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <h1 id="fase2-titulo" className="text-[clamp(2rem,3.4vw,3rem)] leading-[1.04]" style={{ letterSpacing: '-0.022em' }}>
              {lot.title}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[1.0625rem] text-muted">
              <span className="font-mono font-medium text-fg tnum">{lot.id}</span>
              <span aria-hidden>·</span>
              <span className="text-fg">{ctx.producer.nome}</span>
              <span aria-hidden>·</span>
              <span>
                {ctx.producer.localidade}, {ctx.region.nome}
                {ctx.region.country ? ` (${ctx.region.country})` : ''}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill status={lot.status} />
              <CommodityChip world={lot.world} label="world" />
            </div>
            <p className="max-w-[62ch] mt-4 text-[1.0625rem] text-fg">
              {lot.product}. {world.faseLabel}: o mundo já se explora e joga, mas este lote não aceita compromissos. {lotQuantityLabel(lot)} previstas para a safra {lot.campanha}.
            </p>
            <h2 className="mt-8 text-[1.25rem]">Porque ainda não se pode financiar</h2>
            <ul className="max-w-[62ch] mt-2 list-disc space-y-1.5 pl-5 text-[0.9375rem] text-muted marker:text-world-ink">
              <li>O piloto da fase 1 financia só lotes de azeite (a água entra como cesto, sem financiamento), com investidores qualificados.</li>
              <li>A cobertura com futuros ICE KC e câmbio EUR/USD precisa de um corretor de futuros, a selecionar na Fase 2.</li>
              <li>
                A due diligence do produtor está em curso: amostra de pré-safra com{' '}
                <span className="font-mono text-fg tnum">{analysis ? num(analysis.params.find((p) => p.id === 'sca')?.value ?? 0, 2) : '—'}</span> pontos SCA.
              </li>
              <li>
                Abertura prevista a partir de <span className="font-mono text-fg tnum">{fmtDate(lot.funding.opensPlanned ?? lot.funding.opensAt)}</span>. Referência ilustrativa de hoje: {tidyText(price(lot.economics.refPrice, 'kg'))}.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink to="/mercados/cafe" variant="primary">
                Explorar A Plantação
              </ButtonLink>
              <ButtonLink to="/academia#cereja-chavena">Jogar Da cereja à chávena</ButtonLink>
              <ButtonLink to="/academia/simulador?lote=sim-cf-a">Simular uma campanha de café</ButtonLink>
            </div>
          </div>
          <div className="min-w-0 lg:col-span-5">
            <Terrain world="cafe" seed={lot.id} label={`Plantação e terreiro de ${ctx.producer.nome}`} />
            <div className="-mt-10 flex items-end justify-between gap-4">
              <div className="pb-2">
                <p className="font-display text-[1.25rem] font-semibold text-fg">Missão por abrir</p>
                <p className="text-sm text-muted">{world.faseLabel}</p>
                <p className="mt-1 text-sm text-muted">
                  Objetivo previsto: <span className="font-mono text-fg tnum">{eur(lot.funding.goal)}</span>
                </p>
              </div>
              <LotGauge kind="sacks" value={0} size="lg" label={`Lote ${lot.id}, ainda sem financiamento`} valueText="Fase 2, sem financiamento" className="w-[160px] shrink-0 sm:w-[200px] [&_svg]:h-auto [&_svg]:w-full" />
            </div>
          </div>
        </Page>
      </section>
      <Page className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <h2 className="text-[1.375rem]">Missões da origem</h2>
          <p className="mt-1 text-muted">Cumpre-as para ganhar o selo de origem por diligência, sem compromisso de capital.</p>
          <QuestList className="mt-3" quests={quests} isDone={game.isQuestDone} completedAt={game.questCompletedAt} />
        </div>
        <div className="min-w-0 lg:col-span-5">
          {seal && <OriginSeal seal={seal.def} producer={seal.producer} region={seal.region} state={seal.earned ? 'earned' : 'locked'} earnedBy={seal.earned?.by} earnedAt={seal.earned?.at} showCaption size={128} />}
          {analysis && (
            <div className="mt-8">
              <h2 className="text-[1.1875rem]">Amostra de due diligence</h2>
              <p className="text-sm text-muted">
                <span className="font-mono tnum">{analysis.reportId}</span> · {analysis.lab} · {fmtDate(analysis.date)}
              </p>
              <dl className="mt-3 divide-y divide-border border-y border-border text-sm">
                {analysis.params.map((p) => (
                  <div key={p.id} className="flex justify-between gap-4 py-2">
                    <dt className="text-muted">{p.label}</dt>
                    <dd className="font-mono text-fg tnum">
                      {num(p.value, p.id === 'sca' ? 2 : p.id === 'humidade' ? 1 : 0)}
                      {p.unit === '%' ? ' %' : p.unit ? ` ${p.unit}` : ''} <span className="text-muted">({p.limitLabel})</span>
                    </dd>
                  </div>
                ))}
              </dl>
              {analysis.note && <p className="mt-2 text-sm text-muted">{analysis.note}</p>}
            </div>
          )}
          <Disclaimer className="mt-8" title="Pré-visualização">
            Este lote mostra como será um lote de café na Fase 2. Não é uma oferta e não aceita compromissos.
          </Disclaimer>
        </div>
      </Page>
    </div>
  );
}
