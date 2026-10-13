import { getWorld } from '../../data';
import type { WorldId } from '../../data';
import { SeasonTrack } from '../../components/game';
import { Card, TextLink } from '../../components/ui';
import { CommodityGlyph } from '../../components/ui/Commodity';
import { CAMPAIGN, TODAY_DATE } from '../../lib/clock';
import { date as fmtDate, MONTHS_SHORT } from '../../lib/format';
import { ProducerTanks } from './ProducerTanks';

function phaseNow(world: WorldId) {
  const w = getWorld(world);
  const m = Number(TODAY_DATE.slice(5, 7));
  const ph = w.season.phases.find((p) => (p.startMonth <= p.endMonth ? m >= p.startMonth && m <= p.endMonth : m >= p.startMonth || m <= p.endMonth));
  return ph ? `${ph.label.toLowerCase()}, ${MONTHS_SHORT[ph.startMonth - 1]}.–${MONTHS_SHORT[ph.endMonth - 1]}.` : '';
}

function WorldRow({ world }: { world: 'azeite' | 'agua' }) {
  const w = getWorld(world);
  return (
    <div className="min-w-0" data-world={world}>
      <p className="mb-2 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-fg">
          <CommodityGlyph world={world} className="size-4 text-world-ink" />
          {w.nome}
        </span>
        <span className="text-muted">{phaseNow(world)}</span>
      </p>
      <SeasonTrack world={world} compact />
    </div>
  );
}

/** A estação: onde estamos no ano agrícola de cada mundo + os depósitos a encher. */
export function SeasonCard() {
  return (
    <Card padding="lg" className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-0">
      <section className="min-w-0 lg:pr-8" aria-labelledby="estacao-title">
        <h2 id="estacao-title" className="text-[1.1875rem] leading-tight">
          Onde estamos no ano agrícola
        </h2>
        <p className="mt-1 text-sm text-muted">
          Hoje, <span className="font-mono tnum text-fg">{fmtDate(TODAY_DATE)}</span>. A colheita do azeite corre até <span className="font-mono tnum text-fg">{fmtDate(CAMPAIGN.harvestEnd)}</span>; os lotes desta campanha começam a ser vendidos em fevereiro.
        </p>
        <div className="mt-5 space-y-5">
          <WorldRow world="azeite" />
          <WorldRow world="agua" />
          <div className="flex flex-wrap items-baseline gap-x-2 border-t border-border pt-4 text-sm" data-world="cafe">
            <span className="inline-flex items-center gap-1.5 font-semibold text-fg">
              <CommodityGlyph world="cafe" className="size-4 text-world-ink" />
              {getWorld('cafe').nome}
            </span>
            <span className="text-muted">Fase 2 · abre em 2027. A safra brasileira colhe-se de maio a setembro.</span>
            <TextLink to="/mercados/cafe" className="text-sm">
              Explorar as origens
            </TextLink>
          </div>
        </div>
      </section>
      <ProducerTanks className="min-w-0 border-border lg:border-l lg:pl-8" />
    </Card>
  );
}
