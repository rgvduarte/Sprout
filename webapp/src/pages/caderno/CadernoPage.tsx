import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getSeal, REGIONS, SEED_SEALS } from '../../data';
import type { WorldId } from '../../data/types';
import { Badge, Button, Page, PageHeader, Section, TextLink } from '../../components/ui';
import { KnowledgeLevelBadge, EASE_OUT } from '../../components/game';
import { useData, useGame, useRole, type ProfileId, type SealView } from '../../state';
import { CampaignTabs, MilestonesBlock, NotesPage, SealsPage, Spread } from './Notebook';
import { OriginCards } from './OriginCards';
import { OriginsMap, sealRegionLabels } from './OriginsMap';
import { SealDrawer } from './SealDrawer';
import { CAMPAIGNS, cardsFor, followOf, getCampaign, knowledgeTimeline, milestonesFor, notesFor, regionReasons, useProfile, type CampaignId } from './model';

/* =====================================================================
   Caderno de colheita: um caderno por campanha, com os selos de origem
   (lacre), as notas dos lotes acompanhados, os marcos de conhecimento,
   as cartas de origem e o mapa das regiões acesas. Sem montantes.
   ===================================================================== */

/** Selos já carimbados no caderno, por perfil. Os ganhos por diligência nesta sessão são carimbados ao abrir a página. */
const stamped: Record<ProfileId, Set<string>> = {
  demo: new Set(SEED_SEALS.map((s) => s.sealId)),
  visitante: new Set(),
};

export default function CadernoPage() {
  const { profileId } = useRole();
  const data = useData();
  const game = useGame();
  const profile = useProfile();
  const reduce = useReducedMotion();
  const [campaign, setCampaign] = useState<CampaignId>('2026/27');
  const [dir, setDir] = useState(0);
  const [openSealId, setOpenSealId] = useState<string | null>(null);
  const openSeal: SealView | null = (openSealId && data.seals.find((x) => x.def.id === openSealId)) || null;
  const [, force] = useState(0);

  const follow = useMemo(
    () =>
      followOf(
        profile,
        data.positions.map((p) => p.lotId),
        profile.seals,
        (id) => {
          const s = getSeal(id);
          return s ? { producerId: s.producerId, campanha: s.campanha } : undefined;
        },
        data.lots,
      ),
    [profile, data.positions, data.lots],
  );

  const c = getCampaign(campaign);
  const notes = useMemo(() => notesFor(c, data.lots, data.events, follow), [c, data.lots, data.events, follow]);
  const timeline = useMemo(() => knowledgeTimeline(profile), [profile]);
  const milestones = useMemo(() => milestonesFor(c, timeline), [c, timeline]);
  const allCards = useMemo(() => Object.fromEntries(CAMPAIGNS.map((x) => [x.id, cardsFor(x, data.lots, follow, profile.analysesRead)])) as Record<CampaignId, ReturnType<typeof cardsFor>>, [data.lots, follow, profile.analysesRead]);
  const cards = allCards[campaign];
  const campaignSeals = data.seals.filter((s) => s.def.campanha === campaign);

  const counts = Object.fromEntries(
    CAMPAIGNS.map((x) => {
      const list = data.seals.filter((s) => s.def.campanha === x.id);
      return [x.id, { earned: list.filter((s) => s.earned).length, total: list.length }];
    }),
  ) as Record<CampaignId, { earned: number; total: number }>;

  // selos ganhos por diligência que ainda não foram carimbados no caderno
  const seen = stamped[profileId];
  for (const s of data.earnedSeals) if (s.earned?.by !== 'diligencia') seen.add(s.def.id);
  const fresh = new Set(data.earnedSeals.filter((s) => !seen.has(s.def.id)).map((s) => s.def.id));
  const onStamped = useCallback(
    (id: string) => {
      stamped[profileId].add(id);
      force((n) => n + 1);
    },
    [profileId],
  );

  const select = (id: CampaignId) => {
    if (id === campaign) return;
    const from = CAMPAIGNS.findIndex((x) => x.id === campaign);
    const to = CAMPAIGNS.findIndex((x) => x.id === id);
    setDir(Math.sign(to - from));
    setCampaign(id);
  };
  const idx = CAMPAIGNS.findIndex((x) => x.id === campaign);
  const prev = CAMPAIGNS[idx - 1];
  const next = CAMPAIGNS[idx + 1];

  const earnedSealIds = data.earnedSeals.map((s) => s.def.id);
  const sealLabels = useMemo(() => sealRegionLabels(earnedSealIds), [earnedSealIds.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const reasonsFor = (regionId: string, world: WorldId) => regionReasons(regionId, profile, follow, data.lots.filter((l) => l.world === world), sealLabels.filter((x) => x.world === world));
  const initialRegion = useMemo(() => {
    const pick = (w: WorldId) => {
      const regions = REGIONS.filter((r) => r.worlds.includes(w));
      return (regions.find((r) => data.regionStates[r.id] === 'participated') ?? regions.find((r) => data.regionStates[r.id] === 'learned') ?? regions[0])?.id;
    };
    return { azeite: pick('azeite'), agua: pick('agua'), cafe: pick('cafe') };
    // só ao montar: depois a seleção é do utilizador
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lit = Object.values(data.regionStates).filter((s) => s !== 'unexplored').length;
  const cardsEarned = Object.values(allCards)
    .flat()
    .filter((x) => x.state !== 'bloqueado').length;
  const cardsTotal = Object.values(allCards).flat().length;
  const cardsHere = cards.filter((x) => x.state !== 'bloqueado').length;

  const emptyNotes =
    c.state === 'concluida' ? (
      'Não acompanhaste nenhum lote desta campanha.'
    ) : c.state === 'fase-2' ? (
      <>
        As notas da safra aparecem quando acompanhares uma origem de café: explora <TextLink to="/mercados/cafe">A Plantação</TextLink> e lê as amostras de pré-safra dos lotes{' '}
        <TextLink to="/lote/CF-2027-001#analises">CF-2027-001</TextLink> e <TextLink to="/lote/CF-2027-002#analises">CF-2027-002</TextLink>.
      </>
    ) : (
      <>
        Ainda não acompanhas nenhum lote desta campanha. As notas aparecem quando lês o boletim de um lote ou abres os fatores de risco, por exemplo no{' '}
        <TextLink to="/lote/AZ-2026-021#analises">AZ-2026-021</TextLink> ou no <TextLink to="/lote/AG-2026-007#analises">AG-2026-007</TextLink>.
      </>
    );

  return (
    <Page>
      <PageHeader
        title="Caderno de colheita"
        description="Os selos, as cartas e as regiões das origens que estudaste ou acompanhas, campanha a campanha. Nada aqui depende do montante investido."
        meta={
          <>
            <KnowledgeLevelBadge level={game.level} size="sm" />
            <Badge tone="seal">
              <span className="font-mono tnum">{data.earnedSeals.length}</span> de <span className="font-mono tnum">{data.seals.length}</span> selos
            </Badge>
            <Badge tone="neutral">
              <span className="font-mono tnum">{cardsEarned}</span> de <span className="font-mono tnum">{cardsTotal}</span> cartas
            </Badge>
            <Badge tone="neutral">
              <span className="font-mono tnum">{lit}</span> de <span className="font-mono tnum">{REGIONS.filter((r) => r.worlds.length > 0).length}</span> regiões acesas
            </Badge>
          </>
        }
      />

      <section aria-label="Caderno por campanha">
        <CampaignTabs current={campaign} onSelect={select} counts={counts} />
        <Spread campaign={campaign} dir={dir}>
          <div className="grid xl:grid-cols-2">
            <SealsPage
              c={c}
              seals={campaignSeals}
              onOpen={(x) => setOpenSealId(x.def.id)}
              fresh={fresh}
              onStamped={onStamped}
              questsDoneFor={(s) => s.def.questIds.filter((id) => game.isQuestDone(id)).length}
            >
              <MilestonesBlock c={c} milestones={milestones} />
            </SealsPage>
            <div className="min-w-0 border-t border-border xl:border-l xl:border-t-0 xl:border-dashed">
              <NotesPage c={c} notes={notes} emptyNotes={emptyNotes} />
            </div>
          </div>
        </Spread>
        <nav aria-label="Virar de campanha" className="mt-2 flex items-center justify-between gap-3">
          {prev ? (
            <Button variant="ghost" size="sm" onClick={() => select(prev.id)} iconLeft={<ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />}>
              {prev.label}
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button variant="ghost" size="sm" onClick={() => select(next.id)} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
              {next.label}
            </Button>
          ) : (
            <span />
          )}
        </nav>
      </section>

      <Section
        id="cartas"
        title={`Cartas de origem · ${c.short}`}
        description="Uma por lote: ganha-se ao co-financiar o lote ou ao ler o seu boletim de análises. São pessoais e intransmissíveis: não se vendem, não se trocam e não valem dinheiro."
        actions={
          <Badge tone="neutral">
            <span className="font-mono tnum">{cardsHere}</span> de <span className="font-mono tnum">{cards.length}</span> nesta página
          </Badge>
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={campaign} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.28, ease: EASE_OUT }}>
            <OriginCards cards={cards} />
          </motion.div>
        </AnimatePresence>
      </Section>

      <Section
        id="mapa"
        title="Mapa das origens"
        description="As regiões acendem quando aprendes sobre uma origem ou participas num lote dela. Escolher uma região aqui só mostra o detalhe; aprender faz-se nos mundos e nos lotes."
      >
        <OriginsMap reasonsFor={reasonsFor} initialRegion={initialRegion} />
      </Section>

      <SealDrawer seal={openSeal} campaign={openSeal ? getCampaign(openSeal.def.campanha as CampaignId) : null} onClose={() => setOpenSealId(null)} />
    </Page>
  );
}
