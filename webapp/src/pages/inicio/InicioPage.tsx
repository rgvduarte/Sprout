import { useContext, useMemo, useState } from 'react';
import { ArrowRight, ServerCog } from 'lucide-react';
import { CampaignFeed, HarvestBand, KnowledgeLevelBadge, OriginSeal } from '../../components/game';
import { Button, ButtonLink, Card, CardHeader, Page, PageHeader, RiskNote, Section, SimulationLabel, TextLink } from '../../components/ui';
import { useData, useFeed, useGame, useRole } from '../../state';
import { GameContext } from '../../state/AppProvider';
import { CAMPAIGN, daysBetween, TODAY_DATE } from '../../lib/clock';
import { date as fmtDate, num, pct } from '../../lib/format';
import { plannedSettlement, windowOf } from '../carteira/positions';
import { LevelPanel } from './LevelPanel';
import { buildMissions } from './missions';
import { MissionList } from './MissionList';
import { MyLots } from './MyLots';
import { NovasMissoes } from './NovasMissoes';
import { SeasonCard } from './SeasonCard';

/* =====================================================================
   Início: abre na estação, não no dinheiro. A campanha, o que mexe nos
   produtores, os lotes do investidor como missões e o conhecimento.
   ===================================================================== */

const DAY = daysBetween(CAMPAIGN.start, TODAY_DATE) + 1;

export default function InicioPage() {
  const { isVisitor, isTeam } = useRole();
  const game = useGame();
  const data = useData();
  const feed = useFeed();
  const gameCtx = useContext(GameContext);
  const worldsVisited = useMemo(() => gameCtx?.profile.worldsVisited ?? [], [gameCtx?.profile.worldsVisited]);
  const [feedLimit, setFeedLimit] = useState(7);

  const approved = game.onboarding.status === 'aprovado';
  const active = data.positions.filter((p) => p.status !== 'liquidado');
  const hasLots = active.length > 0;

  const missions = useMemo(
    () => buildMissions({ game, lots: data.lots, positions: data.positions, liveEvents: feed.events, isVisitor, worldsVisited }),
    [game, data.lots, data.positions, feed.events, isVisitor, worldsVisited],
  );
  const goal = missions.find((m) => m.kind === 'aprendizagem');
  const listMissions = missions.filter((m) => m.kind !== 'aprendizagem');
  const nextStep = listMissions.find((m) => m.done < m.total && m.kind !== 'campanha');
  const nextStepLabel = nextStep?.steps.find((s) => !s.done);

  const settlements = active
    .map((p) => ({ p, at: plannedSettlement(p.lot) }))
    .filter((x): x is { p: (typeof active)[number]; at: string } => Boolean(x.at))
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, 2);

  const latestSeal = [...data.earnedSeals].sort((a, b) => (b.earned?.at ?? '').localeCompare(a.earned?.at ?? ''))[0];
  const lockedSeal = data.seals.find((s) => !s.earned && s.def.earnable !== 'compromisso');
  const lastRun = game.simRuns[0];

  const oliveProducers = 4;
  const description = isVisitor
    ? `A colheita começou: ${oliveProducers} lagares a moer e duas nascentes a encher stock para o verão. Explora os mundos e joga uma campanha com dinheiro fictício antes de pensares em investir.`
    : `Os lagares moem a primeira azeitona e as nascentes enchem stock para o verão. Aqui segues ${hasLots ? `os teus ${num(active.length)} lotes` : 'os lotes'}, o Diário dos produtores e as missões da campanha.`;

  return (
    <Page>
      <PageHeader
        title={`Dia ${DAY} da campanha 2026/27`}
        description={description}
        meta={
          <>
            <KnowledgeLevelBadge level={game.level} size="sm" />
            <span className="text-sm text-muted">
              <span className="font-mono text-fg tnum">{num(game.points)}</span> pts
            </span>
            {nextStepLabel && (
              <span className="text-sm text-muted">
                · próximo passo:{' '}
                <TextLink to={nextStepLabel.href} className="text-sm">
                  {nextStepLabel.label}
                  {nextStep?.kind === 'diligencia' ? ` (${nextStep.title.replace('Diligência do ', '')})` : ''}
                </TextLink>
              </span>
            )}
          </>
        }
        actions={
          isTeam ? (
            <ButtonLink to="/bastidores" variant="secondary" iconLeft={<ServerCog aria-hidden className="size-4" strokeWidth={1.75} />}>
              Bastidores
            </ButtonLink>
          ) : isVisitor && !approved ? (
            <ButtonLink to="/onboarding" variant="primary" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
              Pedir acesso ao piloto
            </ButtonLink>
          ) : undefined
        }
      />

      <SeasonCard />

      <div className="mt-10 flex min-w-0 flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-x-6">
        {/* coluna principal: os lotes (ou os primeiros passos) e as missões */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-10">
          {hasLots ? (
            <Section id="lotes" title="Os teus lotes" description="Cada lote é uma missão física: onde está a mercadoria e o que acontece a seguir." className="order-1 !mt-0 min-w-0 lg:order-none">
              <Card padding="md">
                <MyLots positions={data.positions} />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <RiskNote compact className="max-w-[46ch]" />
                  <ButtonLink to="/carteira" variant="secondary" size="sm" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
                    Abrir a carteira
                  </ButtonLink>
                </div>
              </Card>
            </Section>
          ) : approved ? (
            <Section id="lotes" title="Os teus lotes" className="order-1 !mt-0 min-w-0 lg:order-none">
              <Card padding="lg">
                <p className="font-medium text-fg">Ainda não financias nenhum lote.</p>
                <p className="measure mt-1 text-muted">Antes do primeiro compromisso, lê os fatores de risco de um lote aberto e joga uma campanha no simulador. As novas missões estão mais abaixo.</p>
                <ButtonLink to="/academia/simulador" variant="secondary" className="mt-4">
                  Abrir o simulador
                </ButtonLink>
              </Card>
            </Section>
          ) : (
            <Section id="comecar" title="Começa por aqui" description="Primeiro conhecer, depois decidir. Nada aqui pede dinheiro." className="order-1 !mt-0 min-w-0 lg:order-none">
              <Card padding="md">
                <MissionList missions={listMissions} limit={4} />
              </Card>
            </Section>
          )}

          {/* missões de conhecimento (quem já está aprovado) */}
          {approved && (
            <Section id="missoes" title="Missões de conhecimento" description="Diligência, campanha e selos. Os pontos vêm do que aprendes, nunca do que investes." className="order-3 !mt-0 min-w-0 lg:order-none">
              <Card padding="md">
                <MissionList missions={listMissions} limit={4} />
              </Card>
            </Section>
          )}

        </div>
        {/* coluna lateral: o Diário e o nível */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-10">
          {/* Diário de campanha */}
          <Section id="diario" title="Diário de campanha" description="Leituras e acontecimentos dos produtores, à medida que chegam." className="order-2 !mt-0 min-w-0 lg:order-none">
            <Card padding="md">
              <CampaignFeed events={data.events} live={{ paused: feed.paused, reason: feed.pauseReason }} limit={feedLimit} />
              <div className="mt-2 border-t border-border pt-2">
                <Button variant="ghost" size="sm" onClick={() => setFeedLimit((n) => (n > 7 ? 7 : 18))} aria-expanded={feedLimit > 7}>
                  {feedLimit > 7 ? 'Mostrar menos' : 'Mostrar mais acontecimentos'}
                </Button>
              </div>
            </Card>
          </Section>

          <Section id="nivel" title="Nível de conhecimento" className="order-4 !mt-0 min-w-0 lg:order-none">
            <Card padding="md">
              <LevelPanel goal={goal} />
            </Card>
          </Section>
        </div>
      </div>

      <Section id="novas" title="Novas missões" description="Lotes abertos a financiamento. Abre a jornada, lê a análise e os riscos antes de qualquer decisão.">
        <NovasMissoes lots={data.lots} />
        {!approved && (
          <p className="mt-4 text-sm text-muted">
            O piloto está fechado a investidores qualificados. Podes explorar todas as jornadas; comprometer capital pede registo e verificação.
          </p>
        )}
      </Section>

      <div className="mt-10 grid min-w-0 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {settlements.length > 0 ? (
          <Section id="liquidacoes" title="Próximas liquidações" description="A janela de 18 meses desenhada sobre o ano agrícola. A liquidação prevista é uma estimativa." className="!mt-0 min-w-0">
            <Card padding="md" className="space-y-8">
              {settlements.map(({ p, at }, i) => {
                const w = windowOf(p.lot);
                return (
                  <div key={p.id} className="min-w-0">
                    <p className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="min-w-0">
                        <span className="font-mono text-sm text-fg tnum">{p.lot.id}</span> <span className="text-sm text-muted">· {p.producer.nome}</span>
                      </span>
                      <span className="text-sm text-muted">
                        prevista a <span className="font-mono text-fg tnum">{fmtDate(at)}</span>
                      </span>
                    </p>
                    <HarvestBand world={p.lot.world} start={w.start} months={p.lot.settlement.windowMonths} extensionMonths={w.extEnd ? 6 : 0} markers={[{ date: at, label: 'Liquidação prevista' }]} legend={i === settlements.length - 1} />
                  </div>
                );
              })}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <RiskNote compact className="max-w-[52ch]" />
                <TextLink to="/carteira#calendario" className="text-sm">
                  Calendário completo
                </TextLink>
              </div>
            </Card>
          </Section>
        ) : (
          <Section id="caderno" title="O teu Caderno de colheita" className="!mt-0 min-w-0">
            <Card padding="md" className="flex flex-wrap items-center gap-6">
              {lockedSeal && <OriginSeal seal={lockedSeal.def} producer={lockedSeal.producer} region={lockedSeal.region} state="locked" size={104} />}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-fg">Ainda sem selos de origem.</p>
                <p className="mt-1 text-sm text-muted">
                  {lockedSeal ? `O selo ${lockedSeal.producer.nome} · ${lockedSeal.def.campanha} ganha-se só por diligência: ${lockedSeal.def.questIds.length} missões de conhecimento, sem compromisso.` : 'Os selos ganham-se por diligência ou por compromisso num lote.'}
                </p>
                <TextLink to="/caderno" className="mt-2 inline-block text-sm">
                  Abrir o Caderno de colheita
                </TextLink>
              </div>
            </Card>
          </Section>
        )}

        <div className="min-w-0 space-y-10">
          {latestSeal?.earned && (
            <Section id="selo" title="Último selo" className="!mt-0 min-w-0">
              <Card padding="md" className="flex flex-wrap items-center gap-5">
                <OriginSeal seal={latestSeal.def} producer={latestSeal.producer} region={latestSeal.region} state="earned" earnedBy={latestSeal.earned.by} earnedAt={latestSeal.earned.at} size={104} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg">{latestSeal.producer.nome}</p>
                  <p className="text-sm text-muted">
                    {latestSeal.region.nome} · campanha {latestSeal.def.campanha} · ganho por {latestSeal.earned.by === 'diligencia' ? 'diligência' : 'compromisso'} a{' '}
                    <span className="font-mono tnum">{fmtDate(latestSeal.earned.at)}</span>
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    <span className="font-mono text-fg tnum">{data.earnedSeals.length}</span> de <span className="font-mono tnum">{data.seals.length}</span> selos no Caderno.
                  </p>
                  <TextLink to="/caderno" className="mt-1 inline-block text-sm">
                    Abrir o Caderno de colheita
                  </TextLink>
                </div>
              </Card>
            </Section>
          )}
          <Section id="simulador" title="Joga uma campanha antes de investir" className="!mt-0 min-w-0">
            <Card padding="md">
              <p className="text-[0.9375rem] text-fg">18 meses de campanha em poucos minutos: choques de preço, colheitas fracas, vendas atrasadas, extensão e refunding. Há campanhas que acabam em perda, e é para isso que serve jogá-las.</p>
              {lastRun && (
                <div className="mt-3">
                  <SimulationLabel />
                  <p className="mt-1 text-sm text-muted">
                    Última simulação: resultado <span className="font-mono text-fg tnum">{pct(lastRun.result, 1, { sign: true })}</span>
                    {lastRun.extended ? ', com extensão' : ''}.
                  </p>
                </div>
              )}
              <ButtonLink to="/academia/simulador" variant="secondary" className="mt-4" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
                {lastRun ? 'Jogar outra campanha' : 'Abrir o simulador'}
              </ButtonLink>
            </Card>
          </Section>
        </div>
      </div>
    </Page>
  );
}
