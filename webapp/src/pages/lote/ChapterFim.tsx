import { ArrowRight } from 'lucide-react';
import { fundedFraction, stageLabel } from '../../data';
import { CampaignFeed, JourneyTrack, LotGauge } from '../../components/game';
import { ButtonLink, RiskNote, StatusPill } from '../../components/ui';
import { date as fmtDate, eur, pct } from '../../lib/format';
import { physicalForAmount } from '../../lib/physical';
import { useData, useFeed } from '../../state';
import { SampleRequest } from './CommitDone';
import { containersFor, stockLabel, type ChapterId } from './model';
import { ChapterHeading, useJourney, Wrap } from './shared';

/* =====================================================================
   Último capítulo dos lotes sem compromisso possível: acompanhamento
   (financiado ou em extensão), liquidação, ou abertura (em preparação).
   ===================================================================== */

function YourPosition() {
  const { lot, positions } = useJourney();
  const amount = positions.reduce((s, p) => s + p.amount, 0);
  if (!amount) {
    return <p className="text-sm text-muted">Não tens posição neste lote. Podes acompanhá-lo como qualquer outro: a jornada e o diário são públicos para quem está no piloto.</p>;
  }
  const phys = physicalForAmount(lot, amount);
  const first = positions[0];
  return (
    <div>
      <h3 className="text-[1.1875rem]">A tua posição</h3>
      <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Montante financiado</dt>
          <dd className="font-mono text-[1.0625rem] text-fg tnum">{eur(amount)}</dd>
        </div>
        <div>
          <dt className="text-muted">A tua fração</dt>
          <dd className="font-mono text-[1.0625rem] text-fg tnum">{pct(phys.shareOfLot, 1)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Em mercadoria</dt>
          <dd className="text-fg">
            {phys.primary}
            {lot.world === 'azeite' && ` · ${containersFor(lot, phys.base)}`} · {phys.secondary}
          </dd>
        </div>
        {first?.fundedAt && (
          <div className="sm:col-span-2">
            <dt className="text-muted">Transferência recebida</dt>
            <dd className="font-mono text-fg tnum">{fmtDate(first.fundedAt)}</dd>
          </div>
        )}
      </dl>
      <ButtonLink to="/carteira" variant="secondary" size="sm" className="mt-3" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
        Ver na Carteira
      </ButtonLink>
      {lot.status !== 'liquidado' && lot.stock > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <SampleRequest />
        </div>
      )}
    </div>
  );
}

export function ChapterFim({ id, label }: { id: ChapterId; label: string }) {
  const { lot, ctx, win } = useJourney();
  const data = useData();
  const feed = useFeed();
  const events = data.events.filter((e) => e.lotId === lot.id);
  const next = lot.milestones.find((m) => !m.done);
  const stockFrac = lot.quantity > 0 ? Math.min(1, lot.stock / lot.quantity) : 0;
  const settled = lot.status === 'liquidado';
  const prep = lot.status === 'em-preparacao';
  const lead = settled
    ? `Ciclo fechado a ${fmtDate(lot.settlement.settledAt ?? win.end)}. O resultado é o que foi pago aos co-financiadores, depois de custos e reserva.`
    : prep
      ? `O lote ainda não abriu a financiamento. Abre a ${fmtDate(lot.funding.opensPlanned ?? lot.funding.opensAt)}, depois de publicado o boletim de análises e contratada a cobertura.`
      : `Missão concluída · financiamento completo. O lote está ${stageLabel(lot.world, lot.stage).toLowerCase()}; os marcos acendem quando o produtor regista o evento.`;
  const lastNote = lot.milestones.filter((m) => m.done).slice(-1)[0];

  return (
    <section id={id} data-chapter={label} aria-labelledby={`${id}-titulo`} className="scroll-mt-6 py-14 sm:py-20">
      <Wrap>
        <ChapterHeading id={id} n={6} title={label} lead={lead} />

        {settled && (
          <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4 border-y border-border py-5">
            <div>
              <p className="text-sm text-muted">Resultado pago aos co-financiadores</p>
              <p className="mt-1 text-[2rem] font-semibold leading-none text-fg pnum">{pct(lot.settlement.settledResult ?? 0, 1, { sign: true })}</p>
              <p className="mt-1 text-sm text-muted">do capital, em {lot.settlement.settledAt ? fmtDate(lot.settlement.settledAt) : '—'}</p>
            </div>
            <p className="max-w-[62ch] min-w-0 flex-1 text-[0.9375rem] text-fg">{lot.milestones.find((m) => m.stage === 'liquidado')?.note}</p>
          </div>
        )}

        {win.extended && !settled && (
          <div className="mt-8 rounded-sm bg-[color-mix(in_oklab,var(--warn)_12%,var(--surface))] px-4 py-3">
            <p className="font-medium text-fg">Em extensão até {fmtDate(win.extEnd)}</p>
            <p className="mt-1 text-sm text-fg">{lastNote?.note}</p>
          </div>
        )}

        <div className="mt-8 grid min-w-0 gap-x-12 gap-y-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <h3 className="text-[1.1875rem]">Jornada física</h3>
            <JourneyTrack lot={lot} className="mt-4" />
            {next && !settled && (
              <p className="mt-4 text-sm text-muted">
                Próximo marco: <span className="font-medium text-fg">{ctx.world.journeyLabels[next.stage]}</span>
                {next.planned && (
                  <>
                    , previsto para <span className="font-mono text-fg tnum">{fmtDate(next.planned)}</span>
                  </>
                )}
                .
              </p>
            )}
            <div className="mt-10">
              <h3 className="text-[1.1875rem]">Diário do lote</h3>
              <CampaignFeed className="mt-2" events={events} limit={6} live={settled ? undefined : { paused: feed.paused, reason: feed.pauseReason }} linkLots={false} emptyText="Ainda sem eventos registados para este lote." />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-10 lg:col-span-5">
            {!prep && (
              <div className="flex items-end gap-5">
                <LotGauge kind={lot.world} value={settled ? 0 : stockFrac} size="md" label={`Stock físico do lote ${lot.id}`} valueText={stockLabel(lot)} className="w-[120px] shrink-0 [&_svg]:h-auto [&_svg]:w-full" />
                <div className="min-w-0 pb-1">
                  <StatusPill status={lot.status} />
                  <p className="mt-2 font-mono text-[1.25rem] text-fg tnum">{stockLabel(lot)}</p>
                  <p className="text-sm text-muted">
                    {settled ? 'Stock vendido e expedido.' : `em stock de ${stockLabel(lot, lot.quantity)} · ${lot.storage.local}`}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Financiado a <span className="font-mono text-fg tnum">{pct(fundedFraction(lot), 0)}</span> · {lot.funding.coFinancers} co-financiadores
                  </p>
                </div>
              </div>
            )}
            {prep ? (
              <div>
                <h3 className="text-[1.1875rem]">O que falta para abrir</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted marker:text-world-ink">
                  <li>Boletim de análises do laboratório acreditado ({lot.milestones.find((m) => m.stage === 'analisado')?.planned ? `previsto a ${fmtDate(lot.milestones.find((m) => m.stage === 'analisado')!.planned!)}` : 'por agendar'}).</li>
                  <li>Cobertura: {lot.hedge.counterparty === 'A contratar' ? 'contraparte a contratar antes da abertura' : lot.hedge.label.toLowerCase()}.</li>
                  <li>
                    Stock em produção: {stockLabel(lot)} de {stockLabel(lot, lot.quantity)}.
                  </li>
                </ul>
                <p className="mt-3 text-sm text-muted">Não há reservas nem lista de espera: quando abrir, as condições são as mesmas para todos os co-financiadores.</p>
                <ButtonLink to={`/mercados/${lot.world}`} variant="secondary" className="mt-3">
                  Ver {ctx.world.nome}
                </ButtonLink>
              </div>
            ) : (
              <YourPosition />
            )}
            <RiskNote />
          </div>
        </div>
      </Wrap>
    </section>
  );
}
