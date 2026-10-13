import { useContext } from 'react';
import { getLot, getProducer, getQuest, getRegion, LEVELS, MINI_GAMES, MODULES, QUESTS, SIM_COMPLETE_POINTS, stageLabel } from '../../data';
import type { CampaignEvent, EarnedSeal, LevelId, Lot, Producer, Region, WorldId } from '../../data/types';
import { GameContext } from '../../state/AppProvider';
import type { ProfileState } from '../../state';
import { toDate } from '../../lib/clock';
import { date as fmtDate, num } from '../../lib/format';
import { lotQuantityLabel } from '../../lib/physical';

/* =====================================================================
   Caderno de colheita: páginas por campanha, notas dos lotes que se
   acompanham, marcos de conhecimento e cartas de origem. Nada aqui
   depende de montantes.
   ===================================================================== */

export type CampaignId = '2025/26' | '2026/27' | '2027/28';

export interface CampaignDef {
  id: CampaignId;
  label: string;
  short: string;
  state: 'concluida' | 'em-curso' | 'fase-2';
  stateLabel: string;
  /** janela da campanha (out.–set.) */
  start: string;
  end: string;
  /** mundo cujas fases desenham a faixa do calendário */
  strip: WorldId;
  folio: [number, number];
}

export const CAMPAIGNS: CampaignDef[] = [
  { id: '2025/26', label: 'Campanha 2025/26', short: '2025/26', state: 'concluida', stateLabel: 'concluída', start: '2025-10-01', end: '2026-09-30', strip: 'azeite', folio: [1, 2] },
  { id: '2026/27', label: 'Campanha 2026/27', short: '2026/27', state: 'em-curso', stateLabel: 'em curso', start: '2026-10-01', end: '2027-09-30', strip: 'azeite', folio: [3, 4] },
  { id: '2027/28', label: 'Safra 2027/28', short: '2027/28', state: 'fase-2', stateLabel: 'Fase 2', start: '2026-10-01', end: '2027-09-30', strip: 'cafe', folio: [5, 6] },
];

export const getCampaign = (id: CampaignId) => CAMPAIGNS.find((c) => c.id === id)!;

/** Perfil completo do jogo (datas de módulos, mini-jogos, regiões visitadas). */
export function useProfile(): ProfileState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('Caderno fora do AppProvider');
  return ctx.profile;
}

const inWindow = (at: string, c: CampaignDef) => {
  const t = toDate(at).getTime();
  return t >= toDate(c.start).getTime() && t <= toDate(`${c.end}T23:59:59+01:00`).getTime();
};

/* ------------------------------------------------------------ o que se acompanha */

export interface Follow {
  lots: Set<string>;
  producers: Set<string>;
  /** lotes com posição (participação) */
  participated: Set<string>;
  studied: Set<string>;
}

export function followOf(profile: ProfileState, positionLotIds: string[], earned: EarnedSeal[], sealProducer: (sealId: string) => { producerId: string; campanha: string } | undefined, lots: Lot[]): Follow {
  const participated = new Set(positionLotIds);
  const studied = new Set<string>([...profile.analysesRead, ...Object.entries(profile.riskRead).filter(([, v]) => v.length > 0).map(([k]) => k)]);
  const set = new Set<string>([...participated, ...studied]);
  for (const e of earned) {
    if (e.lotId) set.add(e.lotId);
    const sp = sealProducer(e.sealId);
    if (sp) lots.filter((l) => l.producerId === sp.producerId && l.campanha === sp.campanha).forEach((l) => set.add(l.id));
  }
  const producers = new Set<string>();
  for (const id of set) {
    const lot = lots.find((l) => l.id === id);
    if (lot) producers.add(lot.producerId);
  }
  for (const e of earned) {
    const sp = sealProducer(e.sealId);
    if (sp) producers.add(sp.producerId);
  }
  return { lots: set, producers, participated, studied };
}

/* ------------------------------------------------------------ notas de campanha */

export interface Note {
  id: string;
  at: string;
  world: WorldId;
  lotId?: string;
  title: string;
  detail?: string;
  live?: boolean;
  /** nota tirada de um marco da jornada do lote */
  milestone?: boolean;
}

export function notesFor(c: CampaignDef, lots: Lot[], events: CampaignEvent[], f: Follow): Note[] {
  const out: Note[] = [];
  const seen = new Set<string>();
  const lotEvents = new Map<string, CampaignEvent[]>();
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    let include = false;
    if (e.lotId) {
      const lot = lots.find((l) => l.id === e.lotId) ?? getLot(e.lotId);
      include = Boolean(lot && lot.campanha === c.id && (f.lots.has(lot.id) || f.producers.has(lot.producerId)));
      if (include) lotEvents.set(e.lotId, [...(lotEvents.get(e.lotId) ?? []), e]);
    } else if (e.producerId && c.state !== 'fase-2') {
      const producer = getProducer(e.producerId);
      include = Boolean(producer && producer.fase === 1 && f.producers.has(e.producerId) && inWindow(e.at, c));
    } else if (e.producerId && c.state === 'fase-2') {
      include = Boolean(f.producers.has(e.producerId) && getProducer(e.producerId)?.fase === 2);
    }
    if (include) out.push({ id: e.id, at: e.at, world: e.world, lotId: e.lotId, title: e.title, detail: e.detail, live: e.live });
  }
  for (const lot of lots) {
    if (lot.campanha !== c.id || !f.lots.has(lot.id)) continue;
    for (const m of lot.milestones) {
      if (!m.done || !m.date) continue;
      const near = (lotEvents.get(lot.id) ?? []).some((e) => Math.abs(toDate(e.at).getTime() - toDate(m.date!).getTime()) < 1.5 * 86_400_000);
      if (near) continue;
      out.push({ id: `m-${lot.id}-${m.stage}`, at: m.date, world: lot.world, lotId: lot.id, title: `Etapa da jornada: ${stageLabel(lot.world, m.stage).toLowerCase()}`, detail: m.note, milestone: true });
    }
  }
  return out.sort((a, b) => toDate(b.at).getTime() - toDate(a.at).getTime());
}

/* ------------------------------------------------------------ marcos de conhecimento */

export interface KMilestone {
  id: string;
  at: string;
  kind: 'modulo' | 'missao' | 'minijogo' | 'simulador' | 'nivel';
  world: WorldId | 'geral';
  title: string;
  points?: number;
  level?: LevelId;
}

/** Linha do tempo do que foi aprendido, com a passagem de nível no dia em que aconteceu. */
export function knowledgeTimeline(profile: ProfileState): KMilestone[] {
  const items: KMilestone[] = [];
  for (const m of profile.modulesCompleted) {
    const mod = MODULES.find((x) => x.id === m.id);
    if (mod) items.push({ id: `mod-${m.id}`, at: m.at, kind: 'modulo', world: mod.world, title: `Módulo concluído: ${mod.title}`, points: mod.points });
  }
  for (const q of profile.questsCompleted) {
    const quest = getQuest(q.id);
    if (quest) items.push({ id: `q-${q.id}`, at: q.at, kind: 'missao', world: quest.world, title: `Missão cumprida: ${quest.title}`, points: quest.points });
  }
  for (const g of MINI_GAMES) {
    const r = profile.miniGames[g.id];
    if (!r) continue;
    const pts = Math.round((Math.min(r.bestScore, g.maxScore) / g.maxScore) * g.maxPoints);
    items.push({ id: `g-${g.id}`, at: r.at, kind: 'minijogo', world: g.world, title: `${g.title}: ${r.bestScore} de ${g.maxScore}`, points: pts });
  }
  if (profile.simRuns.length) {
    const first = [...profile.simRuns].sort((a, b) => toDate(a.at).getTime() - toDate(b.at).getTime())[0];
    items.push({ id: 'sim', at: first.at, kind: 'simulador', world: 'geral', title: 'Primeira campanha jogada no simulador, com dinheiro fictício', points: SIM_COMPLETE_POINTS });
  }
  items.sort((a, b) => toDate(a.at).getTime() - toDate(b.at).getTime() || (a.kind === 'modulo' ? -1 : 1));
  let acc = 0;
  const withLevels: KMilestone[] = [];
  for (const it of items) {
    const before = acc;
    acc += it.points ?? 0;
    withLevels.push(it);
    for (const l of LEVELS.slice(1)) {
      if (before < l.minPoints && acc >= l.minPoints) withLevels.push({ id: `lvl-${l.id}`, at: it.at, kind: 'nivel', world: 'geral', title: `Chegaste a ${l.nome}`, level: l.id });
    }
  }
  return withLevels;
}

export function milestonesFor(c: CampaignDef, all: KMilestone[]): KMilestone[] {
  const list = c.state === 'fase-2' ? all.filter((m) => m.world === 'cafe') : all.filter((m) => inWindow(m.at, c));
  return [...list].reverse();
}

/* ------------------------------------------------------------ cartas de origem */

export interface CardStat {
  label: string;
  value: string;
  mono?: boolean;
}

export interface CardView {
  lot: Lot;
  producer: Producer;
  region: Region;
  n: number;
  of: number;
  state: 'participado' | 'estudado' | 'bloqueado';
  stats: CardStat[];
  unlock?: { text: string; href?: string };
}

const param = (lot: Lot, id: string) => lot.analyses[0]?.params.find((p) => p.id === id);
const milestoneDate = (lot: Lot, stage: 'colhido') => lot.milestones.find((m) => m.stage === stage && m.done)?.date;

const fmtDay = (iso?: string) => (iso ? fmtDate(iso) : 'por registar');

export function statsFor(lot: Lot, producer: Producer, region: Region): CardStat[] {
  if (lot.world === 'azeite') {
    const ac = param(lot, 'acidez');
    const mf = param(lot, 'mf');
    return [
      { label: 'Região', value: region.nome },
      { label: 'Variedades', value: lot.title.replace(/^Virgem extra /, '').split(',')[0] },
      { label: 'Acidez', value: ac ? `${num(ac.value, 2)} %` : 'por analisar', mono: Boolean(ac) },
      { label: 'Frutado (mediana)', value: mf ? num(mf.value, 1) : 'por provar', mono: Boolean(mf) },
      { label: 'Extração', value: fmtDay(milestoneDate(lot, 'colhido')), mono: true },
      { label: 'Quantidade', value: lotQuantityLabel(lot), mono: true },
    ];
  }
  if (lot.world === 'agua') {
    const rs = param(lot, 'residuo');
    const ph = param(lot, 'ph');
    return [
      { label: 'Região', value: region.nome },
      { label: 'Tipo', value: producer.variedades[0]?.split(' · ')[0] ?? 'Água' },
      { label: 'Resíduo seco', value: rs ? `${num(rs.value)} mg/L` : 'por analisar', mono: Boolean(rs) },
      { label: 'pH', value: ph ? num(ph.value, 1) : 'por analisar', mono: Boolean(ph) },
      { label: 'Engarrafamento', value: fmtDay(milestoneDate(lot, 'colhido')), mono: true },
      { label: 'Quantidade', value: lotQuantityLabel(lot), mono: true },
    ];
  }
  const sca = param(lot, 'sca');
  const hum = param(lot, 'humidade');
  const processo = /natural/i.test(lot.product) ? 'Natural' : /lavado/i.test(lot.product) ? 'Lavado' : /honey/i.test(lot.product) ? 'Honey' : 'Por definir';
  return [
    { label: 'Origem', value: `${region.nome}, ${region.country ?? ''}`.replace(/, $/, '') },
    { label: 'Variedades', value: producer.variedades.join(' e ') },
    { label: 'Processo', value: processo },
    { label: 'Pontuação SCA', value: sca ? num(sca.value, 2) : 'por provar', mono: Boolean(sca) },
    { label: 'Humidade', value: hum ? `${num(hum.value, 1)} %` : 'por medir', mono: Boolean(hum) },
    { label: 'Quantidade', value: lotQuantityLabel(lot), mono: true },
  ];
}

const WORLD_ORDER: Record<WorldId, number> = { azeite: 0, agua: 1, cafe: 2 };

export function cardsFor(c: CampaignDef, lots: Lot[], f: Follow, analysesRead: string[]): CardView[] {
  const list = lots.filter((l) => l.campanha === c.id).sort((a, b) => WORLD_ORDER[a.world] - WORLD_ORDER[b.world] || a.id.localeCompare(b.id));
  return list.map((lot, i) => {
    const producer = getProducer(lot.producerId)!;
    const region = getRegion(lot.regionId)!;
    const state: CardView['state'] = f.participated.has(lot.id) ? 'participado' : analysesRead.includes(lot.id) ? 'estudado' : 'bloqueado';
    const unlock =
      state !== 'bloqueado'
        ? undefined
        : lot.analyses.length === 0
          ? { text: 'O boletim de análises ainda não foi publicado. A carta fica disponível quando for.' }
          : { text: 'Lê o boletim de análises do lote para ganhares a carta.', href: `/lote/${lot.id}#analises` };
    return { lot, producer, region, n: i + 1, of: list.length, state, stats: statsFor(lot, producer, region), unlock };
  });
}

/* ------------------------------------------------------------ regiões */

export function regionReasons(regionId: string, profile: ProfileState, f: Follow, lots: Lot[], earnedSealRegions: { regionId: string; label: string }[]): string[] {
  const reasons: string[] = [];
  const inRegion = lots.filter((l) => l.regionId === regionId);
  const part = inRegion.filter((l) => f.participated.has(l.id));
  if (part.length) reasons.push(`Co-financias ${part.map((l) => l.id).join(', ')}.`);
  for (const s of earnedSealRegions.filter((x) => x.regionId === regionId)) reasons.push(`Selo de origem ganho: ${s.label}.`);
  const read = inRegion.filter((l) => profile.analysesRead.includes(l.id));
  if (read.length) reasons.push(`Leste o boletim de análises de ${read.map((l) => l.id).join(', ')}.`);
  const risks = inRegion.filter((l) => (profile.riskRead[l.id] ?? []).length > 0);
  if (risks.length) reasons.push(`Abriste fatores de risco de ${risks.map((l) => l.id).join(', ')}.`);
  if (profile.regionsVisited.includes(regionId)) reasons.push('Visitaste a região no mapa de um mundo.');
  return reasons;
}

export const QUESTS_BY_WORLD = (w: WorldId) => QUESTS.filter((q) => q.world === w);
