import { getProducer, getQuestsByLot, getSeal, isInvestable, LEVELS, MODULES, QUESTS } from '../../data';
import type { CampaignEvent, LevelId, Lot, WorldId } from '../../data';
import type { GameView, PositionView } from '../../state';
import { num } from '../../lib/format';

/* =====================================================================
   Motor de missões do Início. Gatilhos: conhecimento, diligência e eventos
   físicos da campanha. Nunca depósitos, montantes ou volume.
   ===================================================================== */

export type MissionKind = 'acesso' | 'diligencia' | 'selo' | 'campanha' | 'aprendizagem';

export const MISSION_KIND_LABEL: Record<MissionKind, string> = {
  acesso: 'Primeiros passos',
  diligencia: 'Diligência',
  selo: 'Selo por diligência',
  campanha: 'Missão de campanha',
  aprendizagem: 'Objetivo de aprendizagem',
};

export interface MissionStep {
  id: string;
  label: string;
  done: boolean;
  href: string;
  /** progresso parcial [feito, total] (p.ex. fatores de risco) */
  count?: [number, number];
}

export interface Mission {
  id: string;
  kind: MissionKind;
  title: string;
  /** linha de contexto: lote, produtor, região */
  context?: string;
  world?: WorldId;
  steps: MissionStep[];
  /** unidades cumpridas / total (para a barra) */
  done: number;
  total: number;
  /** o que se ganha (conhecimento, selos, acesso; nunca dinheiro) */
  reward?: string;
  /** rótulo da linha de recompensa ("Ganhas", "Porquê", "Nota") */
  rewardLabel?: string;
  /** passo seguinte */
  href: string;
  /** texto do valor da barra */
  valueText: string;
  /** missão viva: avança com eventos do Diário */
  live?: boolean;
}

/** Vantagens de nível: conhecimento e acesso, nunca vantagens financeiras. */
export const LEVEL_PERKS: Record<LevelId, string> = {
  aprendiz: 'Academia, mini-jogos e Simulador de campanha.',
  provador: 'Relatório técnico completo de cada lote: reanálises, inventários mensais e fotografias dos contentores selados.',
  lagareiro: 'Prova guiada online com o mestre lagareiro, com amostras da campanha em curso.',
  mestre: 'Visita ao lagar durante a campanha, com a equipa de operações.',
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

function finish(m: Omit<Mission, 'done' | 'total' | 'href' | 'valueText'> & { href?: string; valueText?: string }): Mission {
  const total = sum(m.steps.map((s) => s.count?.[1] ?? 1));
  const done = sum(m.steps.map((s) => (s.count ? Math.min(s.count[0], s.count[1]) : s.done ? 1 : 0)));
  const next = m.steps.find((s) => !s.done);
  return { ...m, done, total, href: m.href ?? next?.href ?? m.steps[0]?.href ?? '/academia', valueText: m.valueText ?? `${num(done)} de ${num(total)}` };
}

/** Diligência de um lote aberto: boletim, fatores de risco, uma campanha no simulador. */
function lotDiligence(lot: Lot, game: GameView): Mission {
  const producer = getProducer(lot.producerId);
  const quests = getQuestsByLot(lot.id);
  const seal = quests.map((q) => q.sealId).find(Boolean);
  const sealDef = seal ? getSeal(seal) : undefined;
  const points = sum(quests.map((q) => q.points));
  const risks = game.riskRead(lot.id).length;
  const steps: MissionStep[] = [];
  if (lot.analyses.length) steps.push({ id: 'analise', label: 'Lê o boletim de análises', done: game.hasReadAnalysis(lot.id), href: `/lote/${lot.id}#analises` });
  steps.push({ id: 'riscos', label: `Abre os ${lot.riskFactors.length} fatores de risco`, done: risks >= lot.riskFactors.length, count: [risks, lot.riskFactors.length], href: `/lote/${lot.id}#riscos` });
  steps.push({ id: 'sim', label: 'Joga esta campanha no simulador', done: game.simRuns.length > 0, href: '/academia/simulador' });
  const rewardParts: string[] = [];
  if (points) rewardParts.push(`+${points} pontos de conhecimento`);
  if (sealDef && sealDef.earnable !== 'compromisso' && producer) rewardParts.push(`selo de origem ${producer.nome} · ${sealDef.campanha}`);
  return finish({
    id: `dd-${lot.id}`,
    kind: 'diligencia',
    title: `Diligência do ${lot.id}`,
    context: `${producer?.nome ?? ''} · ${lot.title}`,
    world: lot.world,
    steps,
    reward: rewardParts.length ? rewardParts.join(' e ') : 'Os fatores de risco lidos são obrigatórios antes de qualquer compromisso neste lote.',
    rewardLabel: rewardParts.length ? 'Ganhas' : 'Porquê',
  });
}

export interface MissionInput {
  game: GameView;
  lots: Lot[];
  positions: PositionView[];
  /** eventos ao vivo desta sessão (só os gerados pela telemetria) */
  liveEvents: CampaignEvent[];
  isVisitor: boolean;
  /** mundos já visitados pelo perfil ativo */
  worldsVisited: WorldId[];
  /** motivo de pausa da telemetria, se estiver parada */
  feedPaused?: 'reduced-motion' | 'hidden' | 'disabled' | null;
}

/** Leituras de telemetria precisas para a missão de campanha. */
export const CAMPAIGN_READINGS = 3;

export function buildMissions({ game, lots, positions, liveEvents, isVisitor, worldsVisited, feedPaused }: MissionInput): Mission[] {
  const out: Mission[] = [];

  /* primeiros passos (visitante e investidores por aprovar) */
  if (isVisitor || game.onboarding.status !== 'aprovado') {
    const worlds: { id: WorldId; nome: string }[] = [
      { id: 'azeite', nome: 'O Olival' },
      { id: 'agua', nome: 'A Nascente' },
      { id: 'cafe', nome: 'A Plantação' },
    ];
    out.push(
      finish({
        id: 'acesso-mundos',
        kind: 'acesso',
        title: 'Explora os três mundos',
        context: 'Mapa de origens, vocabulário e estação de cada mercado',
        steps: worlds.map((w) => ({ id: w.id, label: `Visita ${w.nome}`, done: worldsVisited.includes(w.id), href: `/mercados/${w.id}` })),
        reward: 'As regiões de cada mundo acendem no teu mapa à medida que as exploras.',
      }),
    );
    const st = game.onboarding.status;
    out.push(
      finish({
        id: 'acesso-verificacao',
        kind: 'acesso',
        title: 'Conclui a verificação',
        context: 'Registo, KYC/KYB e avaliação de adequação',
        steps: [
          { id: 'registo', label: 'Começa o registo', done: st !== 'nao-iniciado', href: '/onboarding' },
          { id: 'envio', label: 'Envia a documentação', done: st === 'em-analise' || st === 'aprovado', href: '/onboarding' },
          { id: 'aprovado', label: 'Classificação como investidor qualificado', done: st === 'aprovado', href: '/onboarding' },
        ],
        reward: st === 'bloqueado' ? 'O piloto está fechado a investidores qualificados. Podes continuar a aprender e a jogar no simulador.' : 'Acesso aos lotes do piloto, só para investidores qualificados.',
      }),
    );
  }

  /* missão de campanha: acompanhar a extração em direto */
  const readings = liveEvents.filter((e) => e.kind === 'telemetria' && e.world === 'azeite').length;
  out.push(
    finish({
      id: 'campanha-extracao',
      kind: 'campanha',
      title: 'Acompanha a primeira extração da campanha',
      context:
        feedPaused === 'reduced-motion'
          ? 'Telemetria em pausa com movimento reduzido: a missão avança quando as leituras voltarem.'
          : 'Leituras dos depósitos dos lagares, no Diário de campanha',
      world: 'azeite',
      live: true,
      steps: [{ id: 'leituras', label: `${CAMPAIGN_READINGS} leituras de telemetria em direto`, done: readings >= CAMPAIGN_READINGS, count: [readings, CAMPAIGN_READINGS], href: '/#diario' }],
      reward: 'As missões de campanha não dão pontos: registam o que acompanhaste nesta sessão.',
      rewardLabel: 'Nota',
    }),
  );

  /* diligência dos lotes abertos (onde ainda não há compromisso) */
  const held = new Set(positions.map((p) => p.lotId));
  const open = lots
    .filter((l) => isInvestable(l) && !held.has(l.id))
    .sort((a, b) => getQuestsByLot(b.id).length - getQuestsByLot(a.id).length || b.funding.raised / b.funding.goal - a.funding.raised / a.funding.goal);
  for (const lot of open) out.push(lotDiligence(lot, game));

  /* selos por diligência */
  for (const sealId of ['seal-serraverde-2627', 'seal-altomogiana-2728']) {
    const seal = getSeal(sealId);
    const producer = seal && getProducer(seal.producerId);
    if (!seal || !producer) continue;
    const quests = seal.questIds.map((id) => QUESTS.find((q) => q.id === id)!).filter(Boolean);
    out.push(
      finish({
        id: `selo-${sealId}`,
        kind: 'selo',
        title: `Selo ${producer.nome} · ${seal.campanha}`,
        context: seal.world === 'cafe' ? 'Fase 2 · abre em 2027. Ganha-se só por conhecimento.' : `Ganha-se por diligência, sem compromisso.`,
        world: seal.world,
        steps: quests.map((q) => ({ id: q.id, label: q.title, done: game.isQuestDone(q.id), href: q.href })),
        reward: `+${sum(quests.map((q) => q.points))} pontos e o selo de lacre no Caderno de colheita`,
      }),
    );
  }

  /* objetivo de aprendizagem: o próximo nível */
  if (game.nextLevel) {
    const next = game.nextLevel;
    const pending = MODULES.filter((m) => !game.isModuleDone(m.id)).slice(0, 3);
    out.push(
      finish({
        id: `nivel-${next.id}`,
        kind: 'aprendizagem',
        title: `Chegar a ${next.nome}`,
        context: next.description,
        steps: pending.map((m) => ({ id: m.id, label: `${m.title} · +${m.points} pts`, done: false, href: `/academia#${m.id}` })),
        valueText: `${num(game.points)} de ${num(next.minPoints)} pts`,
        reward: LEVEL_PERKS[next.id],
      }),
    );
    // a barra deste objetivo mede pontos, não passos
    const last = out[out.length - 1];
    const base = game.level.minPoints;
    last.done = game.points - base;
    last.total = next.minPoints - base;
  }

  return out;
}

export const levelAfter = (id: LevelId) => {
  const i = LEVELS.findIndex((l) => l.id === id);
  return LEVELS[i + 1];
};
