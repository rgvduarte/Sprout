import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getLot, getProducersByWorld, getWorld, isWorldId } from '../../data';
import type { Lot, WorldId } from '../../data/types';
import { ButtonLink, Card, CardHeader, CommodityChip, CommodityGlyph, Page, PageHeader, RiskNote, Section, StatusPill } from '../../components/ui';
import { CampaignFeed, SeasonTrack } from '../../components/game';
import { useCampaignEvents, useData, useGame } from '../../state';
import { ReferenceChart } from './MarketChart';
import { HedgePill, MissionList, RunningLotsTable } from './MissionBoard';
import { LearnWorld } from './Learn';
import { OriginsExplorer, regionsFor } from './Origins';
import { LiveWorldFigure } from './scenes';
import { ValueChain } from './ValueChain';
import { CHAIN, chainFor, miniGameFor, openLots, upcomingLots, WORLD_ORDER } from './model';

/* =====================================================================
   /mercados/:mundo · o mundo: paisagem, estação, missões (lotes), origens
   e produtores, preço e cadeia de valor, e o que aprender.
   ===================================================================== */

export default function MundoPage() {
  const { mundo } = useParams();
  if (!isWorldId(mundo)) return <UnknownWorld slug={mundo ?? ''} />;
  return <World key={mundo} world={mundo} />;
}

const PREP: Record<WorldId, string> = { azeite: 'no Olival', agua: 'na Nascente', cafe: 'na Plantação' };

/** Diário do mundo: só este bloco re-renderiza a cada leitura ao vivo. */
function WorldDiary({ world }: { world: WorldId }) {
  const events = useCampaignEvents();
  const worldEvents = useMemo(() => events.filter((e) => e.world === world), [events, world]);
  return <CampaignFeed events={worldEvents} live={world !== 'cafe'} limit={3} compact />;
}

function World({ world }: { world: WorldId }) {
  const w = getWorld(world);
  const { lots } = useData();
  const game = useGame();
  const [params] = useSearchParams();
  const { visitWorld, visitRegion, completeQuest } = game;

  // Entrar no mundo conta como visita (missão "Explora as origens de café").
  useEffect(() => {
    visitWorld(world);
  }, [world, visitWorld]);

  // cestos de água desta campanha (modelo de agente: sem financiamento) entram na mesma lista, com o seu estado
  const cestos = useMemo(() => lots.filter((l) => l.world === world && l.status === 'cesto' && !l.illustrative), [lots, world]);
  const missions = useMemo(() => [...openLots(lots, world), ...upcomingLots(lots, world), ...cestos], [lots, world, cestos]);
  const open = openLots(lots, world);
  const running = lots
    .filter((l) => l.world === world && (['financiado', 'em-extensao', 'liquidado'].includes(l.status) || (l.status === 'cesto' && l.illustrative)))
    .sort((a, b) => b.id.localeCompare(a.id));
  const chainLot = lots.find((l) => l.id === CHAIN[world].lotId) ?? (getLot(CHAIN[world].lotId) as Lot);
  const chain = chainFor(world, chainLot);
  const mg = miniGameFor(world);

  const regionIds = regionsFor(world).map((r) => r.id);
  const defaultRegion = (open[0] ?? missions[0])?.regionId ?? getProducersByWorld(world)[0]?.regionId ?? regionIds[0];
  const fromParam = params.get('regiao');
  const [regionId, setRegionId] = useState(fromParam && regionIds.includes(fromParam) ? fromParam : defaultRegion);
  const selectRegion = (id: string) => {
    setRegionId(id);
    visitRegion(id);
  };
  // Vinda do atlas com ?regiao=: abrir a ficha conta como estudar a região.
  useEffect(() => {
    if (fromParam && regionIds.includes(fromParam)) visitRegion(fromParam);
    // só ao entrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preview = !w.investable;

  return (
    <div data-world={world} className="min-w-0">
      <Page>
        {/* ------------------------------------------------ paisagem e estação */}
        <section className="overflow-hidden rounded-md border border-world-line bg-world-soft" aria-labelledby="mundo-h1">
          <div className="grid items-center lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="min-w-0 p-5 sm:p-7 lg:py-8 lg:pr-4">
              <nav aria-label="Caminho" className="mb-3 text-sm text-muted">
                <Link to="/mercados" className="underline decoration-[color-mix(in_oklab,var(--muted)_50%,transparent)] underline-offset-[0.2em] hover:text-fg">
                  Mercados
                </Link>
                <span aria-hidden> / </span>
                <span className="text-fg">{w.nome}</span>
              </nav>
              <PageHeader
                className="pb-0 pt-0"
                title={<span id="mundo-h1">{w.nome}</span>}
                description={w.description}
                meta={
                  <>
                    <CommodityChip world={world} size="md" />
                    {preview ? <StatusPill label={w.faseLabel!} tone="cafe" /> : <StatusPill label="Piloto fechado · Fase 1" tone="accent" />}
                    <HedgePill world={world} />
                  </>
                }
              />
              <SeasonTrack world={world} className="mt-6" />
              {preview && (
                <p className="measure mt-5 text-[0.9375rem] text-fg">
                  <strong className="font-semibold">O financiamento só abre na Fase 2, depois de um go/no-go próprio.</strong> Até lá podes percorrer as origens, jogar {mg.title} e simular uma campanha de café com dinheiro fictício.
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <ButtonLink to={{ pathname: `/mercados/${world}`, hash: '#missoes' }} variant="primary">
                  {preview ? `Lotes em pré-visualização (${missions.length})` : `Missões abertas (${open.length})`}
                </ButtonLink>
                {preview ? (
                  <ButtonLink to="/academia/simulador">Simular uma campanha</ButtonLink>
                ) : (
                  <ButtonLink to={`/academia#${mg.id}`}>Jogar {mg.title}</ButtonLink>
                )}
              </div>
            </div>
            <div className="min-w-0 px-3 pb-5 lg:px-5 lg:py-6">
              <LiveWorldFigure world={world} variant="hero" captionClassName="mt-1 px-2 text-sm text-world-ink" />
              <div className="mx-2 mt-4 border-t border-world-line pt-3">
                <p className="text-sm font-medium text-fg">Diário {w.nome.startsWith('O ') ? 'do' : 'da'} {w.nome.replace(/^(O|A) /, '')}</p>
                <WorldDiary world={world} />
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ missões */}
        <Section
          id="missoes"
          title={preview ? 'Lotes em pré-visualização' : world === 'agua' ? 'Cestos desta campanha' : 'Lotes abertos'}
          description={
            preview
              ? 'Lotes em due diligence para a Fase 2. Podes abrir a jornada e jogá-los no simulador; ainda não se financiam.'
              : world === 'agua'
                ? 'Na água a Sprout é agente: junta encomendas de HoReCa num cesto, o engarrafador fatura e entrega, e a Sprout recebe uma comissão. Não há lotes para financiar; podes abrir a jornada de cada cesto.'
                : 'Cada lote tem um objetivo físico: os IBC de azeite que o financiamento dos cofinanciadores compra ao lagar. Nos lotes em preparação, o medidor mostra o stock que o produtor já tem.'
          }
          className="mt-12"
        >
          <Card>
            <MissionList lots={missions} emptyText="Sem lotes abertos neste mundo. O próximo abre com a campanha." />
            {world !== 'agua' && (
              <div className="mt-5 border-t border-border pt-4">
                <RiskNote />
              </div>
            )}
          </Card>
          {running.length > 0 && (
            <Card className="mt-6">
              <CardHeader title="Em curso e liquidados" description="O medidor mostra o stock que ainda está em armazenagem. Os resultados liquidados são os efetivos, incluindo perdas." />
              <RunningLotsTable lots={running} world={world} />
            </Card>
          )}
        </Section>

        {/* ------------------------------------------------ origens e produtores */}
        <Section id="origens" title="Origens e produtores" description="Escolhe uma região no mapa para abrir a ficha do produtor, a telemetria e os lotes.">
          <OriginsExplorer world={world} regionId={regionId} onSelect={selectRegion} />
        </Section>

        {/* ------------------------------------------------ preço e cadeia */}
        <Section
          id="mercado"
          title="Preço e margem"
          description={world === 'azeite' ? 'O índice de origem (granel) mostra o risco de preço; as referências embaladas e a cadeia mostram de onde vem o preço ao comprador.' : 'A referência de mercado mostra o risco de preço; a cadeia mostra de onde vem o preço ao comprador.'}
        >
          <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
            <Card>
              <ReferenceChart
                world={world}
                lots={open}
                onCompare={() => {
                  if (world === 'azeite' && !game.isQuestDone('q-comparar-preco')) completeQuest('q-comparar-preco');
                }}
              />
            </Card>
            <Card id="cadeia">
              <ValueChain world={world} chain={chain} />
            </Card>
          </div>
        </Section>

        {/* ------------------------------------------------ aprender */}
        <Section id="aprender" title={`Aprender ${PREP[world]}`} description="O que precisas de saber para ler uma análise, um contrato ou um diário deste mundo.">
          <LearnWorld world={world} />
        </Section>

        <nav aria-label="Outros mundos" className="mt-12 flex flex-wrap gap-2 border-t border-border pt-6">
          {WORLD_ORDER.filter((id) => id !== world).map((id) => (
            <ButtonLink key={id} to={`/mercados/${id}`} variant="secondary" iconLeft={<CommodityGlyph world={id} />} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
              {getWorld(id).nome}
            </ButtonLink>
          ))}
          <ButtonLink to="/mercados" variant="ghost">
            Todos os mercados
          </ButtonLink>
        </nav>
      </Page>
    </div>
  );
}

/* ------------------------------------------------------------ mundo desconhecido */

function UnknownWorld({ slug }: { slug: string }) {
  return (
    <Page width="narrow">
      <PageHeader title="Este mundo não existe" description={<>Não há nenhum mercado chamado «{slug}». Os três mundos são estes:</>} />
      <ul className="divide-y divide-border rounded-md border border-border bg-surface">
        {WORLD_ORDER.map((id) => {
          const w = getWorld(id);
          return (
            <li key={id} data-world={id}>
              <Link to={`/mercados/${id}`} className="group flex min-h-16 items-center gap-4 px-4 py-4 hover:bg-surface-2 sm:px-5">
                <span aria-hidden className="text-world-ink">
                  <CommodityGlyph world={id} className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.1875rem] font-bold text-fg">{w.nome}</span>
                  <span className="block text-sm text-muted">{w.tagline}</span>
                </span>
                <ArrowRight aria-hidden className="size-5 shrink-0 text-muted group-hover:text-fg" strokeWidth={1.75} />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted">
        Se vieste de uma ligação antiga, o mundo pode ter mudado de nome. <Link to="/mercados" className="text-accent underline underline-offset-[0.2em]">Ver todos os mercados</Link>.
      </p>
    </Page>
  );
}
