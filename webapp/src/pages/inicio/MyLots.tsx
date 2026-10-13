import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getRegion, ILLUSTRATIVE_LABEL, isIllustrative } from '../../data';
import { LotGauge } from '../../components/game';
import { CommodityGlyph } from '../../components/ui/Commodity';
import { StatusPill } from '../../components/ui';
import type { PositionView } from '../../state';
import { eur } from '../../lib/format';
import { JourneyMini } from '../carteira/JourneyMini';
import { byNextDate, physicalShare, positionState, stockFraction, stockLabel } from '../carteira/positions';

/* Os lotes do investidor como missões em curso: mercadoria física, etapa da jornada e próximo marco. */

function LotRow({ p }: { p: PositionView }) {
  const lot = p.lot;
  const st = positionState(p);
  const share = physicalShare(p);
  const region = getRegion(lot.regionId);
  const gaugeValue = lot.status === 'aberto' ? lot.funding.raised / lot.funding.goal : stockFraction(lot);
  return (
    <li data-world={lot.world} className="min-w-0">
      <Link
        to={`/lote/${lot.id}`}
        className="group grid min-w-0 grid-cols-[52px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-sm py-4 no-underline transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--surface-2)_60%,transparent)] sm:grid-cols-[64px_minmax(0,1fr)_minmax(0,1.1fr)] sm:px-2"
      >
        <LotGauge kind={lot.world} size="sm" value={gaugeValue} label={lot.status === 'aberto' ? `Financiamento do lote ${lot.id}` : `Stock em armazém do lote ${lot.id}`} valueText={lot.status === 'aberto' ? undefined : stockLabel(lot)} className="row-span-2 w-[52px] sm:row-span-1 sm:w-16" />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <CommodityGlyph world={lot.world} className="size-4 text-world-ink" />
            <span className="font-mono text-sm text-fg tnum">{lot.id}</span>
            <StatusPill label={st.label} tone={st.tone} />
          </p>
          <p className="mt-1 font-medium leading-snug text-fg">{p.producer.nome}</p>
          <p className="text-sm text-muted">
            {lot.title} · {region?.nome}
          </p>
          <p className="mt-1 text-sm text-muted">
            <span className="font-mono text-fg tnum">{eur(p.amount)}</span> financiados
          </p>
          {(isIllustrative(p) || isIllustrative(lot)) && <p className="text-xs font-medium text-warn-ink">{ILLUSTRATIVE_LABEL}</p>}
          <p className="text-sm text-muted">
            A tua parte: <span className="font-mono text-fg tnum">{share.primary}</span> {share.secondary}
          </p>
        </div>
        <div className="col-start-2 min-w-0 sm:col-start-auto sm:pt-1">
          <JourneyMini lot={lot} />
          <p className="mt-1 hidden items-center gap-1 text-sm font-medium text-accent group-hover:underline sm:inline-flex">
            Jornada do lote <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.75} />
          </p>
        </div>
      </Link>
    </li>
  );
}

export function MyLots({ positions }: { positions: PositionView[] }) {
  const active = positions.filter((p) => p.status !== 'liquidado').sort(byNextDate);
  return (
    <ul className="divide-y divide-border">
      {active.map((p) => (
        <LotRow key={p.id} p={p} />
      ))}
    </ul>
  );
}
