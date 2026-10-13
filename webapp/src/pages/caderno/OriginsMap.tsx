import { useState } from 'react';
import { getProducersByRegion, getRegion, getRegionsByWorld, getWorld, SEALS } from '../../data';
import type { RegionState, WorldId } from '../../data/types';
import { ButtonLink, Card, CommodityGlyph, SegmentedControl, StatusPill } from '../../components/ui';
import { OriginSeal, TileMap, TileMapLegend } from '../../components/game';
import { useData } from '../../state';
import { cn } from '../../lib/cn';

/* =====================================================================
   Mapa das origens: as regiões acendem com o que se aprende ou com a
   participação num lote. A seleção aqui só mostra; aprender faz-se nos
   mundos e nos lotes.
   ===================================================================== */

const STATE_LABEL: Record<RegionState, string> = { unexplored: 'Por explorar', learned: 'Aprendido', participated: 'Participado' };

export function OriginsMap({ reasonsFor, initialRegion }: { reasonsFor: (regionId: string) => string[]; initialRegion: Partial<Record<WorldId, string>> }) {
  const { regionStates, seals } = useData();
  const [world, setWorld] = useState<WorldId>('azeite');
  const [selected, setSelected] = useState<Partial<Record<WorldId, string>>>(initialRegion);
  const regions = getRegionsByWorld(world);
  const regionId = selected[world] && regions.some((r) => r.id === selected[world]) ? selected[world]! : regions[0]?.id;
  const region = regionId ? getRegion(regionId) : undefined;
  const state = (regionId && regionStates[regionId]) || 'unexplored';
  const producers = regionId ? getProducersByRegion(regionId).filter((p) => p.world === world) : [];
  const regionSeals = seals.filter((s) => s.def.regionId === regionId && s.def.world === world);
  const reasons = regionId ? reasonsFor(regionId) : [];
  const lit = regions.filter((r) => regionStates[r.id] && regionStates[r.id] !== 'unexplored').length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start" data-world={world}>
      <Card padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl<WorldId>
            label="Mundo do mapa"
            value={world}
            onChange={setWorld}
            options={(['azeite', 'agua', 'cafe'] as WorldId[]).map((w) => ({ value: w, label: getWorld(w).commodity, icon: <CommodityGlyph world={w} className="size-4" /> }))}
          />
          <p className="text-sm text-muted">
            <span className="font-mono text-fg tnum">
              {lit} de {regions.length}
            </span>{' '}
            regiões acesas em {getWorld(world).nome}
          </p>
        </div>
        <TileMap
          key={world}
          map={world === 'cafe' ? 'cafe' : 'pt'}
          world={world}
          states={regionStates}
          selectedId={regionId}
          onSelect={(id) => setSelected((s) => ({ ...s, [world]: id }))}
          className="mx-auto mt-6 max-w-[560px]"
          title={world === 'cafe' ? 'Mapa das origens de café' : `Mapa das regiões de ${getWorld(world).commodity.toLowerCase()} em Portugal`}
        />
        <TileMapLegend world={world} className="mt-4 justify-center" />
      </Card>

      <Card padding="lg" as="section" aria-live="polite" aria-labelledby="caderno-regiao">
        {region ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 id="caderno-regiao" className="text-[1.25rem] leading-tight">
                  {region.nome}
                  {region.country ? <span className="text-muted">, {region.country}</span> : null}
                </h3>
                <p className="mt-1 text-sm text-muted">{region.description}</p>
              </div>
              <StatusPill label={STATE_LABEL[state]} tone={state === 'unexplored' ? 'neutral' : world} />
            </div>

            <h4 className="mt-6 text-[0.9375rem] font-semibold">Porque está assim</h4>
            {reasons.length ? (
              <ul className="mt-1.5 flex flex-col gap-1 text-[0.9375rem] text-fg">
                {reasons.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-world" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-[0.9375rem] text-muted">
                Ainda não estudaste esta origem. Acende-a ao abrir a ficha de um produtor no mundo, ao ler o boletim de um lote ou ao cumprir uma missão desta região.
              </p>
            )}

            <h4 className="mt-6 text-[0.9375rem] font-semibold">Produtores</h4>
            {producers.length ? (
              <ul className="mt-1.5 divide-y divide-border">
                {producers.map((p) => (
                  <li key={p.id} className="py-2">
                    <p className="font-medium text-fg">{p.nome}</p>
                    <p className="text-sm text-muted">
                      {p.localidade} · {p.capacidade}
                      {p.fase === 2 ? ' · Fase 2' : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-muted">Sem produtores mapeados nesta região, por agora.</p>
            )}

            {regionSeals.length > 0 && (
              <>
                <h4 className="mt-6 text-[0.9375rem] font-semibold">Selos desta região</h4>
                <ul className="mt-2 flex flex-wrap gap-3">
                  {regionSeals.map((s) => (
                    <li key={s.def.id} className="flex items-center gap-2">
                      <OriginSeal seal={s.def} producer={s.producer} region={s.region} state={s.earned ? 'earned' : 'locked'} size={56} earnedBy={s.earned?.by} earnedAt={s.earned?.at} />
                      <span className="text-sm">
                        <span className="block text-fg">{s.producer.nome}</span>
                        <span className={cn('block text-xs', s.earned ? 'text-seal-ink' : 'text-muted')}>
                          {s.def.campanha} · {s.earned ? 'ganho' : 'por ganhar'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-6">
              <ButtonLink to={`/mercados/${world}`} variant="secondary" size="sm">
                Explorar {getWorld(world).nome}
              </ButtonLink>
            </div>
          </>
        ) : (
          <p className="text-muted">Escolhe uma região no mapa.</p>
        )}
      </Card>
    </div>
  );
}

/** Seals by region for reasons, avoiding repeated lookups. */
export const sealRegionLabels = (earnedIds: string[]) =>
  SEALS.filter((s) => earnedIds.includes(s.id)).map((s) => ({ regionId: s.regionId, label: `${getProducersByRegion(s.regionId).find((p) => p.id === s.producerId)?.nome ?? s.producerId} · ${s.campanha}` }));
