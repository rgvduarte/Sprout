import { ArrowRight, PanelRightOpen } from 'lucide-react';
import { fundedFraction, priceUnit, stageLabel } from '../../data';
import { JourneyTrack, LotGauge } from '../../components/game';
import { Button, Card, CommodityChip, StatusPill, TextLink } from '../../components/ui';
import type { PositionView } from '../../state';
import { date as fmtDate, eur, pct, price } from '../../lib/format';
import { JourneyMini } from './JourneyMini';
import { nextMilestone, physicalShare, plannedSettlement, positionState, referenceChange, stockFraction, stockLabel, windowMonth, windowOf } from './positions';
import { ReflectionBand } from './ReflectionBand';

/* Uma posição como cartão de missão: mercadoria física, jornada com datas, prazos e factos. */

export function PositionCard({ p, onOpen }: { p: PositionView; onOpen: (p: PositionView) => void }) {
  const lot = p.lot;
  const st = positionState(p);
  const share = physicalShare(p);
  const next = nextMilestone(lot);
  const settle = plannedSettlement(lot);
  const w = windowOf(lot);
  const month = windowMonth(lot);
  const ref = referenceChange(lot);
  const u = priceUnit(lot);
  const isOpen = lot.status === 'aberto';
  const [low, high] = lot.economics.expectedRange;
  return (
    <Card as="article" padding="md" data-world={lot.world} aria-labelledby={`pos-${p.id}`} className="min-w-0">
      {p.status === 'aguarda-transferencia' && <ReflectionBand p={p} />}
      <div className={`grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-4 md:grid-cols-[132px_minmax(0,1fr)] md:gap-x-6 ${p.status === 'aguarda-transferencia' ? 'mt-5' : ''}`}>
        <figure className="row-span-1 flex min-w-0 flex-col items-center gap-1.5 md:row-span-2">
          <LotGauge
            kind={lot.world}
            size="md"
            value={isOpen ? fundedFraction(lot) : stockFraction(lot)}
            label={isOpen ? `Financiamento do lote ${lot.id}` : `Stock em armazém do lote ${lot.id}`}
            valueText={isOpen ? undefined : stockLabel(lot)}
            className="w-[72px] md:w-[124px]"
          />
          <figcaption className="hidden text-center text-xs leading-snug text-muted md:block">
            {isOpen ? `${pct(fundedFraction(lot), 0)} financiado` : `${stockLabel(lot)} em armazém`}
          </figcaption>
        </figure>

        <header className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CommodityChip world={lot.world} label="commodity" />
            <span className="font-mono text-sm text-fg tnum">{lot.id}</span>
            <StatusPill label={st.label} tone={st.tone} />
          </div>
          <h3 id={`pos-${p.id}`} className="mt-2 text-[1.1875rem] leading-snug">
            {p.producer.nome} · {lot.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            Campanha {lot.campanha} · {lot.storage.local}
          </p>
          {st.detail && <p className="mt-1 text-sm text-fg">{st.detail}</p>}
        </header>

        <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-6 xl:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-sm text-muted">Montante financiado</dt>
              <dd className="mt-0.5 font-mono text-fg tnum">{eur(p.amount)}</dd>
              <dd className="text-sm text-muted">
                {p.fundedAt ? `transferido a ${fmtDate(p.fundedAt)}` : `compromisso a ${fmtDate(p.committedAt)}`}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sm text-muted">A tua parte do lote</dt>
              <dd className="mt-0.5 font-mono text-fg tnum">{share.primary}</dd>
              <dd className="text-sm text-muted">{share.secondary}</dd>
              <dd className="text-sm text-muted">{pct(share.shareOfLot, 1)} do lote</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sm text-muted">Próximo marco</dt>
              <dd className="mt-0.5 text-fg">{next ? (next.stage === 'liquidado' ? 'Liquidação' : stageLabel(lot.world, next.stage)) : 'Jornada concluída'}</dd>
              <dd className="font-mono text-sm text-muted tnum">{next?.planned ? `prev. ${fmtDate(next.planned)}` : '—'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sm text-muted">Liquidação prevista</dt>
              <dd className="mt-0.5 font-mono text-fg tnum">{settle ? fmtDate(settle) : 'a definir'}</dd>
              <dd className="text-sm text-muted">
                {w.projected
                  ? 'a janela começa no fecho do financiamento'
                  : settle === (w.extEnd ?? w.end)
                    ? `mês ${month} de 18 · no fim da janela`
                    : `mês ${month} de 18 · janela até ${fmtDate(w.extEnd ?? w.end)}`}
              </dd>
            </div>
          </dl>

          <div className="mt-5 hidden md:block">
            <JourneyTrack lot={lot} compact orientation="horizontal" />
          </div>
          <div className="mt-5 md:hidden">
            <JourneyMini lot={lot} />
          </div>

          <div className="mt-5 grid gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-muted lg:grid-cols-2">
            <p>
              Referência de mercado hoje <span className="font-mono text-fg tnum">{price(ref.today, u)}</span>, na entrada <span className="font-mono text-fg tnum">{price(ref.entry, u)}</span>
              {Math.abs(ref.change) < 0.0005 ? ' (sem variação). ' : <> (<span className="font-mono text-fg tnum">{pct(ref.change, 1, { sign: true })}</span>). </>}
              {lot.hedge.coverage > 0 ? `${pct(lot.hedge.coverage, 0)} do volume com ${lot.hedge.label.toLowerCase()}.` : 'Sem cobertura de preço: o risco da água é de prazo, não de preço.'}
            </p>
            <p>
              Intervalo estimado na abertura do lote: <span className="font-mono text-fg tnum">{pct(low, 1, { sign: true })}</span> a <span className="font-mono text-fg tnum">{pct(high, 1, { sign: true })}</span> do capital em 18 meses. Estimativa, não garantida; pode haver perda.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Button variant="secondary" size="sm" onClick={() => onOpen(p)} iconLeft={<PanelRightOpen aria-hidden className="size-4" strokeWidth={1.75} />}>
              Rastreabilidade, análises e documentos
            </Button>
            <TextLink to={`/lote/${lot.id}`} className="inline-flex min-h-11 items-center gap-1 text-sm">
              Jornada do lote <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.75} />
            </TextLink>
          </div>
        </div>
      </div>
    </Card>
  );
}
