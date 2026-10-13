import { Link } from 'react-router-dom';
import { getWorld } from '../../data';
import type { JourneyStage, Lot, WorldId } from '../../data';
import { SeasonTrack } from '../../components/game';
import { Badge, Card, TextLink } from '../../components/ui';
import { CommodityGlyph } from '../../components/ui/Commodity';
import { useData } from '../../state';
import { CAMPAIGN, daysBetween, TODAY_DATE } from '../../lib/clock';
import { dateShort, date as fmtDate, MONTHS_SHORT } from '../../lib/format';
import { ProducerTanks } from './ProducerTanks';

const STAGE_PHRASE: Record<WorldId, Record<JourneyStage, string>> = {
  azeite: { colhido: 'moenda', analisado: 'boletim de análises', 'em-deposito': 'IBC selados com o número do lote', 'em-venda': 'início das vendas', expedido: 'expedição ao comprador', liquidado: 'liquidação prevista' },
  agua: { colhido: 'engarrafamento', analisado: 'boletim de análises', 'em-deposito': 'paletes em armazém', 'em-venda': 'início das vendas', expedido: 'expedição ao comprador', liquidado: 'liquidação prevista' },
  cafe: { colhido: 'colheita', analisado: 'classificação SCA', 'em-deposito': 'sacas em armazém', 'em-venda': 'início das vendas', expedido: 'embarque', liquidado: 'liquidação prevista' },
};

interface AgendaItem {
  date: string;
  lot: Lot;
  text: string;
  mine: boolean;
}

/** Próximos marcos físicos e de financiamento, de todos os lotes, nas próximas semanas. */
function useAgenda(limit = 5, horizonDays = 50): AgendaItem[] {
  const { lots, positions } = useData();
  const mine = new Set(positions.map((p) => p.lotId));
  const items: AgendaItem[] = [];
  for (const lot of lots) {
    if (lot.status === 'fase-2' || lot.status === 'liquidado') continue;
    for (const m of lot.milestones) {
      if (m.done || !m.planned) continue;
      const d = daysBetween(TODAY_DATE, m.planned);
      if (d >= 0 && d <= horizonDays) items.push({ date: m.planned, lot, text: STAGE_PHRASE[lot.world][m.stage], mine: mine.has(lot.id) });
    }
    if (lot.status === 'em-preparacao' && lot.funding.opensPlanned) {
      const d = daysBetween(TODAY_DATE, lot.funding.opensPlanned);
      if (d >= 0 && d <= horizonDays) items.push({ date: lot.funding.opensPlanned, lot, text: 'abre a financiamento', mine: false });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || Number(b.mine) - Number(a.mine) || a.lot.id.localeCompare(b.lot.id)).slice(0, limit);
}

function Agenda() {
  const items = useAgenda();
  if (!items.length) return null;
  return (
    <div className="mt-6 border-t border-border pt-4">
      <h3 className="text-[1rem]">Próximos marcos da campanha</h3>
      <ol className="mt-2">
        {items.map((it) => (
          <li key={`${it.lot.id}-${it.text}`} data-world={it.lot.world}>
            <Link to={`/lote/${it.lot.id}`} className="group flex min-h-11 items-center gap-3 rounded-sm text-sm no-underline hover:bg-surface-2 sm:px-1">
              <span className="w-[4.5rem] shrink-0 font-mono text-fg tnum">{dateShort(it.date)}</span>
              <CommodityGlyph world={it.lot.world} className="size-4 text-world-ink" />
              <span className="min-w-0 flex-1 text-muted">
                <span className="font-mono text-fg tnum">{it.lot.id}</span> · {it.text}
              </span>
              {it.mine && <Badge tone="accent">na tua carteira</Badge>}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

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
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm" data-world="cafe">
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
        <Agenda />
      </section>
      <ProducerTanks className="min-w-0 border-border lg:border-l lg:pl-8" />
    </Card>
  );
}
