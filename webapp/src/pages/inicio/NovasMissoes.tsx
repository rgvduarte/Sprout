import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { fundedFraction, getProducer, getRegion, isInvestable, priceUnit } from '../../data';
import type { Lot, WorldId } from '../../data';
import { LotGauge } from '../../components/game';
import { ButtonLink, CommodityChip } from '../../components/ui';
import { useGame } from '../../state';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, monthYear, num, pct, price } from '../../lib/format';
import { stockFraction, unitWord } from '../carteira/positions';

/* =====================================================================
   Novas missões: lotes abertos a financiamento, cada um com o seu medidor
   físico. Sem escassez, sem contagens decrescentes: factos e a jornada.
   ===================================================================== */

export const MISSION_VERB: Record<WorldId, string> = {
  azeite: 'Missão: encher o depósito',
  agua: 'Missão: completar as paletes',
  cafe: 'Missão: encher as sacas',
};

function OpenLotCard({ lot }: { lot: Lot }) {
  const game = useGame();
  const producer = getProducer(lot.producerId);
  const region = getRegion(lot.regionId);
  const f = fundedFraction(lot);
  const fundedUnits = lot.quantity * f;
  const u = priceUnit(lot);
  const risks = game.riskRead(lot.id).length;
  const settle = lot.milestones.find((m) => m.stage === 'liquidado')?.planned ?? lot.settlement.plannedEnd;
  return (
    <article className="flex min-w-0 flex-col rounded-md border border-border bg-surface p-4 sm:p-5" data-world={lot.world} aria-labelledby={`nm-${lot.id}`}>
      <h3 id={`nm-${lot.id}`} className="text-[1.125rem] leading-snug">
        {MISSION_VERB[lot.world]}
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <CommodityChip world={lot.world} label="world" />
        <span className="font-mono text-sm text-muted tnum">{lot.id}</span>
      </div>
      <p className="mt-2 text-sm text-muted">
        {lot.title} · {producer?.nome}, {region?.nome}
      </p>
      <div className="mt-4 flex min-w-0 items-end gap-4">
        <LotGauge kind={lot.world} size="md" value={f} label={`Financiamento do lote ${lot.id}`} className="w-[104px] shrink-0 sm:w-[118px]" />
        <dl className="min-w-0 flex-1 space-y-2 pb-1 text-sm">
          <div>
            <dt className="text-muted">Financiado</dt>
            <dd className="font-mono text-fg tnum">
              {num(fundedUnits)} de {num(lot.quantity)} {unitWord(lot, lot.quantity)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Preço ao comprador</dt>
            <dd className="text-fg">
              <span className="font-mono tnum">{price(lot.economics.buyerPrice, u)}</span>
              <span className="text-muted"> · {pct(lot.economics.discountPct, 0)} abaixo da referência de </span>
              <span className="font-mono tnum">{price(lot.economics.refPrice, u)}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Co-financiadores</dt>
            <dd className="font-mono text-fg tnum">{num(lot.funding.coFinancers)}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 text-sm text-muted">
        Bilhete mínimo <span className="font-mono text-fg tnum">{eur(lot.funding.minTicket)}</span> · janela de 18 meses
        {settle && (
          <>
            {' '}
            · liquidação prevista <span className="font-mono text-fg tnum">{monthYear(settle)}</span>
          </>
        )}
      </p>
      <div className="mt-auto pt-4">
       <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-sm text-muted">
          Fatores de risco lidos{' '}
          <span className={cn('font-mono tnum', risks >= lot.riskFactors.length ? 'text-ok-ink' : 'text-fg')}>
            {risks}/{lot.riskFactors.length}
          </span>
        </span>
        <ButtonLink to={`/lote/${lot.id}`} variant="secondary" size="sm" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
          Ver a jornada
        </ButtonLink>
       </div>
      </div>
    </article>
  );
}

function UpcomingRow({ lot }: { lot: Lot }) {
  const producer = getProducer(lot.producerId);
  const fase2 = lot.status === 'fase-2';
  const s = stockFraction(lot);
  return (
    <li data-world={lot.world}>
      <Link to={`/lote/${lot.id}`} className="group flex min-h-16 min-w-0 items-center gap-3 rounded-sm px-2 py-2 no-underline hover:bg-surface-2">
        <LotGauge kind={lot.world} size="xs" value={fase2 ? 0 : s} label={fase2 ? `Lote ${lot.id}, ainda por colher` : `Produção do lote ${lot.id}`} className="w-9 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-sm text-fg tnum">{lot.id}</span>
            <span className="text-sm text-muted">{producer?.nome}</span>
          </span>
          <span className="block text-sm text-muted">
            {fase2 ? (
              'Fase 2 · abre em 2027. Explorável e jogável na Academia; ainda não investível.'
            ) : (
              <>
                {lot.world === 'agua' ? 'Engarrafamento' : 'Extração'} em curso: <span className="font-mono tnum">{num(lot.stock)}</span> de{' '}
                <span className="whitespace-nowrap">
                  <span className="font-mono tnum">{num(lot.quantity)}</span> {unitWord(lot, lot.quantity)}
                </span>
                {lot.funding.opensPlanned && (
                  <>
                    {' '}
                    · abre a <span className="font-mono tnum">{fmtDate(lot.funding.opensPlanned)}</span>
                  </>
                )}
              </>
            )}
          </span>
        </span>
        <ArrowRight aria-hidden className="size-4 shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-fg" strokeWidth={1.75} />
      </Link>
    </li>
  );
}

export function NovasMissoes({ lots }: { lots: Lot[] }) {
  const open = lots.filter(isInvestable).sort((a, b) => fundedFraction(b) - fundedFraction(a));
  const upcoming = lots.filter((l) => l.status === 'em-preparacao').sort((a, b) => (a.funding.opensPlanned ?? '').localeCompare(b.funding.opensPlanned ?? ''));
  const fase2 = lots.find((l) => l.id === 'CF-2027-001');
  return (
    <div className="min-w-0">
      {open.length === 0 ? (
        <p className="text-muted">Nenhum lote aberto hoje. Os próximos estão em preparação abaixo.</p>
      ) : (
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {open.map((l) => (
            <OpenLotCard key={l.id} lot={l} />
          ))}
        </div>
      )}
      <div className="mt-6">
        <h3 className="text-[1.0625rem]">Em preparação</h3>
        <p className="mt-0.5 text-sm text-muted">A mercadoria já existe; o financiamento abre depois da análise de laboratório.</p>
        <ul className="mt-2 grid min-w-0 gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((l) => (
            <UpcomingRow key={l.id} lot={l} />
          ))}
          {fase2 && <UpcomingRow lot={fase2} />}
        </ul>
      </div>
    </div>
  );
}
