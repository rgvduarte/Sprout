import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Radio } from 'lucide-react';
import { fundedFraction, getProducersByRegion, getRegion, getRegionsByMap, getWorld, stageLabel } from '../../data';
import type { Producer, Region, RegionState, WorldId } from '../../data/types';
import { Badge, Divider, KeyValue, Meter, SegmentedControl, StatusPill, TextLink } from '../../components/ui';
import { CampaignFeed, LotGauge, TileMap, TileMapLegend } from '../../components/game';
import { cn } from '../../lib/cn';
import { monthYear, num, relative } from '../../lib/format';
import { useNow } from '../../lib/clock';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { useData, useFeed, useGame } from '../../state';
import { WORLD_ORDER } from './model';

/* =====================================================================
   Mapa das origens: as regiões acendem à medida que o investidor aprende
   (estuda a região, lê análises e riscos) e participa (financia um lote).
   ===================================================================== */

const STATE_LABEL: Record<RegionState, string> = { unexplored: 'Por explorar', learned: 'Aprendido', participated: 'Participado' };

export const regionsFor = (world: WorldId): Region[] => getRegionsByMap(getWorld(world).map).filter((r) => r.worlds.includes(world));

/** Contagem de regiões por estado, para um mundo. */
export function useRegionCounts(world: WorldId) {
  const { regionStates } = useData();
  const list = regionsFor(world);
  const count = (s: RegionState) => list.filter((r) => (regionStates[r.id] ?? 'unexplored') === s).length;
  return { total: list.length, participated: count('participated'), learned: count('learned'), unexplored: count('unexplored') };
}

function RegionStateBadge({ state, world }: { state: RegionState; world: WorldId }) {
  return (
    <Badge tone={state === 'unexplored' ? 'neutral' : world} dot>
      {STATE_LABEL[state]}
    </Badge>
  );
}

/** Lista de regiões em botões (telemóvel, e atalho de teclado). */
function RegionChips({ world, selectedId, onSelect }: { world: WorldId; selectedId?: string; onSelect: (id: string) => void }) {
  const { regionStates } = useData();
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Regiões">
      {regionsFor(world).map((r) => {
        const state = regionStates[r.id] ?? 'unexplored';
        const on = r.id === selectedId;
        return (
          <li key={r.id}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(r.id)}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-sm border px-3 text-sm transition-colors duration-150',
                on ? 'border-fg bg-surface-2 font-medium text-fg' : 'border-border bg-surface text-fg hover:bg-surface-2',
              )}
            >
              <span
                aria-hidden
                className={cn('size-2.5 rounded-full border', state === 'participated' ? 'border-world-ink bg-world' : state === 'learned' ? 'border-world-ink bg-world-soft' : 'border-border bg-surface')}
              />
              {r.nome}
              <span className="sr-only">· {STATE_LABEL[state]}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------ resumo: atlas */

export function OriginsAtlas({ world, onWorldChange }: { world: WorldId; onWorldChange: (w: WorldId) => void }) {
  const { regionStates, lots } = useData();
  const game = useGame();
  const wide = useMediaQuery('(min-width: 640px)', true);
  const [selected, setSelected] = useState<string | undefined>();
  const [lit, setLit] = useState<string | undefined>();
  const counts = useRegionCounts(world);
  const w = getWorld(world);
  const region = selected ? getRegion(selected) : undefined;
  const regionOk = region && region.worlds.includes(world) ? region : undefined;

  const select = (id: string) => {
    const before = regionStates[id] ?? 'unexplored';
    setSelected(id);
    setLit(before === 'unexplored' ? id : undefined);
    game.visitRegion(id);
  };

  const openHere = lots.filter((l) => l.world === world && (l.status === 'aberto' || l.status === 'fase-2'));
  const producers = regionOk ? getProducersByRegion(regionOk.id).filter((p) => p.world === world) : [];
  const regionLots = regionOk ? lots.filter((l) => l.regionId === regionOk.id && l.world === world && (l.status === 'aberto' || l.status === 'em-preparacao' || l.status === 'fase-2')) : [];
  const state = regionOk ? (regionStates[regionOk.id] ?? 'unexplored') : undefined;

  return (
    <div data-world={world} className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="atlas-t" className="text-[1.375rem] leading-tight">
            Mapa das origens
          </h2>
          <p className="mt-1 text-sm text-muted">Escolhe uma região para a estudar. Acende quando aprendes e enche quando participas.</p>
        </div>
      </div>
      <SegmentedControl
        className="mt-4"
        label="Mundo do mapa"
        value={world}
        onChange={(v) => {
          onWorldChange(v);
          setSelected(undefined);
          setLit(undefined);
        }}
        options={WORLD_ORDER.map((id) => ({ value: id, label: getWorld(id).commodity }))}
      />

      <div className={cn('mt-4', world === 'cafe' ? 'max-w-[440px]' : 'mx-auto max-w-[420px]')}>
        <TileMap map={w.map} world={world} states={regionStates} selectedId={regionOk?.id} onSelect={select} labels={wide} title={`Mapa das origens: ${w.nome}`} />
      </div>
      <TileMapLegend world={world} className="mt-3" />
      <p className="mt-2 text-sm text-muted">
        <span className="font-mono text-fg tnum">{counts.participated}</span> participadas · <span className="font-mono text-fg tnum">{counts.learned}</span> aprendidas ·{' '}
        <span className="font-mono text-fg tnum">{counts.unexplored}</span> por explorar, de {counts.total} regiões {world === 'cafe' ? 'de origem' : 'com este mundo'}.
      </p>
      {!wide && (
        <div className="mt-4">
          <RegionChips world={world} selectedId={regionOk?.id} onSelect={select} />
        </div>
      )}

      <Divider className="my-5" />
      <div aria-live="polite" className="min-h-28">
        {!regionOk ? (
          <div>
            <p className="font-medium text-fg">{world === 'cafe' ? 'Origens em due diligence para a Fase 2' : 'Regiões com missões abertas'}</p>
            {openHere.length ? (
              <ul className="mt-2 flex flex-col gap-1">
                {openHere.map((l) => {
                  const r = getRegion(l.regionId)!;
                  return (
                    <li key={l.id}>
                      <button type="button" onClick={() => select(r.id)} className="inline-flex min-h-11 items-center gap-2 text-left text-[0.9375rem] text-fg hover:underline">
                        <span className="font-medium">{r.nome}</span>
                        <span className="font-mono text-sm text-muted tnum">
                          {l.id}
                          {l.status === 'aberto' ? ` · ${Math.round(fundedFraction(l) * 100)} %` : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">Sem missões abertas neste mundo.</p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[1.125rem] leading-tight">
                {regionOk.nome}
                {regionOk.country && <span className="font-normal text-muted">, {regionOk.country}</span>}
              </h3>
              {state && <RegionStateBadge state={state} world={world} />}
            </div>
            {lit === regionOk.id && <p className="mt-1 text-sm font-medium text-world-ink">Região estudada: acendeu no teu mapa.</p>}
            <p className="mt-2 text-[0.9375rem] text-muted">{regionOk.description}</p>
            {producers.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2">
                {producers.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-[0.9375rem] text-fg">
                      <span className="font-medium">{p.nome}</span> <span className="text-muted">· {p.localidade}</span>
                    </span>
                    <TextLink to={`/mercados/${world}?regiao=${regionOk.id}#origens`} className="text-sm">
                      Ficha do produtor
                    </TextLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Sem produtores {world === 'cafe' ? 'em due diligence' : 'no piloto'} nesta região.</p>
            )}
            {regionLots.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {regionLots.map((l) => (
                  <li key={l.id}>
                    <Link to={`/lote/${l.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border bg-surface px-2.5 text-sm hover:bg-surface-2">
                      <span className="font-mono tnum">{l.id}</span>
                      <StatusPill status={l.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ mundo: explorador + ficha do produtor */

function sinceLabel(since: string) {
  return monthYear(`${since}-01`);
}

function ProducerSheet({ producer, world }: { producer: Producer; world: WorldId }) {
  const { telemetry, events, lots } = useData();
  const feed = useFeed();
  const now = useNow(20_000);
  const units = telemetry[producer.id] ?? producer.telemetry.units;
  const unitLbl = producer.telemetry.unitLabel;
  const total = units.reduce((s, u) => s + u.level, 0);
  const cap = units.reduce((s, u) => s + u.capacity, 0);
  const pEvents = events.filter((e) => e.producerId === producer.id);
  const lastTelemetry = pEvents.find((e) => e.kind === 'telemetria' || e.kind === 'engarrafamento' || e.kind === 'rececao');
  const pLots = lots.filter((l) => l.producerId === producer.id).sort((a, b) => b.id.localeCompare(a.id));
  const live = producer.telemetry.live;

  return (
    <article className="min-w-0" aria-labelledby={`p-${producer.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id={`p-${producer.id}`} className="text-[1.25rem] leading-tight">
          {producer.nome}
        </h3>
        <p className="text-sm text-muted">
          {producer.localidade} · no piloto desde <span className="font-mono tnum">{sinceLabel(producer.since)}</span>
        </p>
      </div>
      <p className="measure mt-2 text-[0.9375rem] text-fg">{producer.story}</p>
      <KeyValue
        className="mt-4"
        columns={2}
        items={[
          { label: world === 'agua' ? 'Água' : 'Variedades', value: producer.variedades.join(', ') },
          { label: 'Capacidade', value: producer.capacidade },
          {
            label: 'Certificações',
            value: (
              <span className="mt-0.5 flex flex-wrap gap-1.5">
                {producer.certifications.map((c) => (
                  <Badge key={c}>{c}</Badge>
                ))}
              </span>
            ),
          },
        ]}
      />

      <Divider />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[1.0625rem]">Telemetria</h4>
        <span className={cn('inline-flex items-center gap-1.5 text-sm', live ? 'text-ok-ink' : 'text-muted')}>
          <Radio aria-hidden className="size-4" strokeWidth={1.75} />
          {live ? (feed.paused ? 'Em direto · em pausa neste ecrã' : 'Em direto') : 'Por ligar · Fase 2'}
          {live && lastTelemetry && <span className="text-muted"> · última leitura {relative(lastTelemetry.at, now)}</span>}
        </span>
      </div>
      {live ? (
        <>
          <p className="mt-1 text-sm text-muted">
            <span className="font-mono text-fg tnum">
              {num(total)} {unitLbl}
            </span>{' '}
            de {num(cap)} {unitLbl} de capacidade.
          </p>
          <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {units.map((u) => (
              <li key={u.id}>
                <Meter value={u.capacity ? u.level / u.capacity : 0} label={u.label} valueLabel={`${num(u.level)} / ${num(u.capacity)} ${unitLbl}`} tone={world} size="sm" />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted">A leitura da tulha liga-se quando abrir o primeiro lote. Até lá, a due diligence publica amostras e análises no diário.</p>
      )}

      <Divider />
      <h4 className="text-[1.0625rem]">Lotes deste produtor</h4>
      {pLots.length ? (
        <ul className="mt-2 divide-y divide-border">
          {pLots.map((l) => (
            <li key={l.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <LotGauge kind={world} value={l.status === 'aberto' || l.status === 'fase-2' ? fundedFraction(l) : l.quantity ? l.stock / l.quantity : 0} size="xs" label={`${l.id}`} />
              <TextLink to={`/lote/${l.id}`} className="font-mono text-sm tnum">
                {l.id}
              </TextLink>
              <span className="text-sm text-muted">{stageLabel(world, l.stage)}</span>
              <StatusPill status={l.status} className="ml-auto" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">Ainda sem lotes.</p>
      )}

      <Divider />
      <h4 className="text-[1.0625rem]">Diário deste produtor</h4>
      <CampaignFeed className="mt-1" events={pEvents} compact limit={3} emptyText="Sem eventos registados." />
    </article>
  );
}

export function OriginsExplorer({ world, regionId, onSelect }: { world: WorldId; regionId: string; onSelect: (id: string) => void }) {
  const { regionStates } = useData();
  const wide = useMediaQuery('(min-width: 640px)', true);
  const w = getWorld(world);
  const region = getRegion(regionId)!;
  const producers = getProducersByRegion(region.id).filter((p) => p.world === world);
  const state = regionStates[region.id] ?? 'unexplored';
  const counts = useRegionCounts(world);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="min-w-0">
        <div className={cn(world === 'cafe' ? 'max-w-[460px]' : 'mx-auto max-w-[440px] lg:mx-0')}>
          <TileMap map={w.map} world={world} states={regionStates} selectedId={region.id} onSelect={onSelect} labels={wide} title={`Regiões de ${w.nome}`} />
        </div>
        <TileMapLegend world={world} className="mt-3" />
        <p className="mt-2 text-sm text-muted">
          <span className="font-mono text-fg tnum">{counts.participated + counts.learned}</span> de {counts.total} regiões já acesas no teu mapa.
        </p>
        {!wide && (
          <div className="mt-4">
            <RegionChips world={world} selectedId={region.id} onSelect={onSelect} />
          </div>
        )}
      </div>

      <div className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-5" aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-[1.375rem] font-bold leading-tight">
            {region.nome}
            {region.country && <span className="font-normal text-muted">, {region.country}</span>}
          </p>
          <RegionStateBadge state={state} world={world} />
        </div>
        <p className="mt-1 text-[0.9375rem] text-muted">{region.description}</p>
        <Divider />
        {producers.length ? (
          producers.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <Divider />}
              <ProducerSheet producer={p} world={world} />
            </div>
          ))
        ) : (
          <div>
            <p className="font-medium text-fg">Sem produtores {world === 'cafe' ? 'em due diligence' : 'no piloto'} nesta região.</p>
            <p className="mt-1 text-sm text-muted">
              Escolhe uma região com um ponto no mapa: é aí que há produtores. {world !== 'cafe' && 'As outras origens estão em avaliação para a campanha 2027/28.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {regionsFor(world)
                .filter((r) => getProducersByRegion(r.id).some((p) => p.world === world))
                .map((r) => (
                  <button key={r.id} type="button" onClick={() => onSelect(r.id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-border bg-surface px-3 text-sm text-fg hover:bg-surface-2">
                    {r.nome}
                    <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
