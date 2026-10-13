import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { ArrowRight, MapPin } from 'lucide-react';
import { fundedFraction, getLot, getProducer, getWorld } from '../../data';
import type { Lot, WorldId } from '../../data/types';
import { Badge, Button, ButtonLink, Card, CardHeader, CommodityChip, Page, PageHeader, RiskNote, StatusPill, TextLink } from '../../components/ui';
import { CampaignFeed, LotGauge, SeasonTrack } from '../../components/game';
import { cn } from '../../lib/cn';
import { date as fmtDate, plural } from '../../lib/format';
import { useData, useFeed } from '../../state';
import { MiniReferenceChart } from './MarketChart';
import { OriginsAtlas } from './Origins';
import { useSceneLevels, WorldScene } from './scenes';
import { CHAIN, chainFor, marginSentence, miniGameFor, openLots, upcomingLots } from './model';

/* =====================================================================
   /mercados · os três mundos lado a lado, por peso no piloto: o Olival
   à frente, a Nascente ao lado, a Plantação (Fase 2) em faixa. À direita,
   o mapa das origens e o diário de campanha.
   ===================================================================== */

const ENTER: Record<WorldId, string> = { azeite: 'Entrar no Olival', agua: 'Entrar na Nascente', cafe: 'Entrar na Plantação' };

type Layout = 'lead' | 'split' | 'band';

function useWorldNumbers(world: WorldId) {
  const { lots } = useData();
  const chainLot = lots.find((l) => l.id === CHAIN[world].lotId) ?? (getLot(CHAIN[world].lotId) as Lot);
  return { chainLot, chain: chainFor(world, chainLot), open: openLots(lots, world), upcoming: upcomingLots(lots, world) };
}

function WorldHeading({ world, onMap }: { world: WorldId; onMap: (w: WorldId) => void }) {
  const w = getWorld(world);
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h2 className="text-[1.625rem] leading-none sm:text-[1.875rem]">
          <Link to={`/mercados/${world}`} className="hover:underline">
            {w.nome}
          </Link>
        </h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <CommodityChip world={world} />
          {w.investable ? <StatusPill label="Piloto · Fase 1" tone="accent" /> : <StatusPill label={w.faseLabel!} tone="cafe" />}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => onMap(world)} iconLeft={<MapPin aria-hidden className="size-4" strokeWidth={1.75} />}>
          Ver no mapa
        </Button>
        <ButtonLink to={`/mercados/${world}`} variant="secondary" size="sm" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
          {ENTER[world]}
        </ButtonLink>
      </div>
    </div>
  );
}

/** As missões abertas do mundo, com o medidor de cada lote. */
function OpenMissions({ world, open, upcoming }: { world: WorldId; open: Lot[]; upcoming: Lot[] }) {
  const preview = world === 'cafe';
  const mg = miniGameFor(world);
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted">{preview ? 'Missões' : 'Missões abertas'}</p>
      <p className="mt-0.5 text-fg">
        {preview ? (
          <>
            <span className="font-medium">Nenhuma para financiar.</span> {plural(open.length, 'lote', 'lotes')} em pré-visualização da Fase 2.
          </>
        ) : (
          <>
            <span className="font-medium">{plural(open.length, 'lote aberto', 'lotes abertos')}</span>
            {upcoming.length > 0 && <span className="text-muted"> · {plural(upcoming.length, 'em preparação', 'em preparação')}</span>}
          </>
        )}
      </p>
      <ul className="mt-2 flex flex-col">
        {open.map((l) => (
          <li key={l.id}>
            <Link to={`/lote/${l.id}`} className="group -mx-2 flex min-h-11 items-center gap-3 rounded-sm px-2 py-1.5 hover:bg-surface-2">
              <LotGauge kind={world} value={fundedFraction(l)} size="xs" label={`Financiamento do ${l.id}`} />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-sm text-fg tnum">{l.id}</span>
                <span className="block truncate text-sm text-muted">{getProducer(l.producerId)?.nome}</span>
              </span>
              <span className="shrink-0 font-mono text-sm text-fg tnum">{preview ? 'Fase 2' : `${Math.round(fundedFraction(l) * 100)} %`}</span>
            </Link>
          </li>
        ))}
        {upcoming.map((l) => (
          <li key={l.id} className="flex min-h-11 items-center gap-3 py-1.5">
            <LotGauge kind={world} value={l.quantity ? l.stock / l.quantity : 0} size="xs" label={`Stock do ${l.id} a encher`} />
            <span className="min-w-0 flex-1 text-sm text-muted">
              <TextLink to={`/lote/${l.id}`} className="font-mono tnum">
                {l.id}
              </TextLink>{' '}
              abre a <span className="font-mono text-fg tnum">{fmtDate(l.funding.opensPlanned ?? l.funding.opensAt)}</span>
            </span>
          </li>
        ))}
      </ul>
      {preview && (
        <p className="mt-2 text-sm text-muted">
          Joga <TextLink to={`/academia#${mg.id}`}>{mg.title}</TextLink> ou <TextLink to="/academia/simulador">simula uma campanha</TextLink> enquanto a Fase 2 não abre.
        </p>
      )}
    </div>
  );
}

function Margin({ world, sentence }: { world: WorldId; sentence: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted">Como se captura a margem</p>
      <p className="mt-0.5 text-[0.9375rem] text-fg">{sentence}</p>
      <TextLink to={{ pathname: `/mercados/${world}`, hash: '#cadeia' }} className="mt-1 inline-block text-sm">
        Ver a cadeia completa
      </TextLink>
    </div>
  );
}

function WorldPanel({ world, layout, onMap, fillOnMount, className }: { world: WorldId; layout: Layout; onMap: (w: WorldId) => void; fillOnMount?: boolean; className?: string }) {
  const w = getWorld(world);
  const scene = useSceneLevels(world);
  const { chainLot, chain, open, upcoming } = useWorldNumbers(world);
  const sentence = marginSentence(world, chain);
  const art = (
    <figure className="m-0 min-w-0">
      <WorldScene world={world} variant="band" levels={scene.levels} label={scene.label} fillOnMount={fillOnMount} />
      <figcaption className="px-4 pb-3 text-sm text-world-ink">{scene.caption}</figcaption>
    </figure>
  );

  if (layout === 'lead') {
    return (
      <Card as="article" padding="none" data-world={world} className={cn('overflow-hidden', className)} aria-label={w.nome}>
        <div className="border-b border-world-line bg-world-soft pt-2">{art}</div>
        <div className="p-5 sm:p-6">
          <WorldHeading world={world} onMap={onMap} />
          <p className="measure mt-3 text-[0.9375rem] text-muted">{w.tagline}</p>
          <div className="mt-6 grid min-w-0 gap-x-8 gap-y-6 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <MiniReferenceChart world={world} lot={chainLot} />
            <div className="flex min-w-0 flex-col gap-5">
              <Margin world={world} sentence={sentence} />
              <OpenMissions world={world} open={open} upcoming={upcoming} />
            </div>
          </div>
          <SeasonTrack world={world} className="mt-6" />
        </div>
      </Card>
    );
  }

  if (layout === 'split') {
    return (
      <Card as="article" padding="none" data-world={world} className={cn('overflow-hidden', className)} aria-label={w.nome}>
        <div className="grid md:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
          <div className="flex flex-col justify-center border-b border-world-line bg-world-soft pt-3 md:border-b-0 md:border-r">{art}</div>
          <div className="min-w-0 p-5 sm:p-6">
            <WorldHeading world={world} onMap={onMap} />
            <p className="mt-3 text-[0.9375rem] text-muted">{w.tagline}</p>
            <div className="mt-5">
              <Margin world={world} sentence={sentence} />
            </div>
          </div>
        </div>
        <div className="border-t border-border p-5 sm:p-6">
          <div className="grid min-w-0 gap-x-8 gap-y-6 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <MiniReferenceChart world={world} lot={chainLot} />
            <OpenMissions world={world} open={open} upcoming={upcoming} />
          </div>
          <SeasonTrack world={world} className="mt-6" />
        </div>
      </Card>
    );
  }

  return (
    <Card as="article" padding="none" data-world={world} className={cn('grid overflow-hidden lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]', className)} aria-label={w.nome}>
      <div className="flex flex-col justify-center border-b border-world-line bg-world-soft pt-3 lg:border-b-0 lg:border-r">{art}</div>
      <div className="min-w-0 p-5 sm:p-6">
        <WorldHeading world={world} onMap={onMap} />
        <p className="measure mt-3 text-[0.9375rem] text-muted">{w.tagline}</p>
        <div className="mt-6 grid min-w-0 gap-x-8 gap-y-6 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-5">
            <Margin world={world} sentence={sentence} />
            <OpenMissions world={world} open={open} upcoming={upcoming} />
          </div>
          <div className="min-w-0">
            <MiniReferenceChart world={world} lot={chainLot} />
            <SeasonTrack world={world} className="mt-6" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MercadosPage() {
  const reduce = useReducedMotion();
  const { events } = useData();
  const feed = useFeed();
  const [atlasWorld, setAtlasWorld] = useState<WorldId>('azeite');
  const atlasRef = useRef<HTMLElement>(null);

  const showOnMap = (world: WorldId) => {
    setAtlasWorld(world);
    const el = atlasRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  };

  return (
    <Page>
      <PageHeader
        title="Mercados"
        description={<span className="block max-w-[58ch]">Três mundos, o mesmo ciclo: a Sprout compra o lote ao produtor, vende-o 10–15 % abaixo da referência a compradores B2B e liquida aos co-financiadores numa janela de 18 meses.</span>}
        meta={
          <>
            <Badge tone="accent" dot>
              Piloto fechado: azeite e água
            </Badge>
            <Badge tone="cafe" dot>
              Café: Fase 2, abre em 2027
            </Badge>
            <Badge>Só investidores qualificados</Badge>
          </>
        }
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-12 xl:items-start">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-7">
          <WorldPanel world="azeite" layout="lead" onMap={showOnMap} fillOnMount />
          <WorldPanel world="agua" layout="split" onMap={showOnMap} fillOnMount />
        </div>

        <div className="flex min-w-0 flex-col gap-6 xl:col-span-5">
          <aside ref={atlasRef} tabIndex={-1} aria-labelledby="atlas-t" className="min-w-0 scroll-mt-20 rounded-md">
            <Card as="div">
              <OriginsAtlas world={atlasWorld} onWorldChange={setAtlasWorld} />
            </Card>
          </aside>
          <Card as="section" aria-labelledby="diario-t">
            <CardHeader id="diario-t" title="Diário de campanha" description="Telemetria e eventos dos produtores dos três mundos." />
            <CampaignFeed events={events} live={{ paused: feed.paused, reason: feed.pauseReason }} limit={12} compact />
          </Card>
        </div>

        <WorldPanel world="cafe" layout="band" onMap={showOnMap} className="xl:col-span-12" />
      </div>

      <RiskNote className="mt-8 max-w-[80ch]" />
    </Page>
  );
}
