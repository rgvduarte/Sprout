import { getQuest, MINI_GAMES, MODULES, QUESTS, SIM_COMPLETE_POINTS } from '../../data';
import type { MiniGameId } from '../../data/types';
import type { GameView } from '../../state';

/* Pontos de conhecimento por origem. Espelha knowledgePoints() da loja. */

export interface PointsSource {
  id: 'modulos' | 'missoes' | 'minijogos' | 'simulador';
  label: string;
  earned: number;
  max: number;
  detail: string;
}

export function miniGamePointsFor(id: MiniGameId, best: number | undefined): number {
  const g = MINI_GAMES.find((x) => x.id === id)!;
  return best ? Math.round((Math.min(best, g.maxScore) / g.maxScore) * g.maxPoints) : 0;
}

export function pointsBreakdown(game: GameView): PointsSource[] {
  const modulesDone = MODULES.filter((m) => game.isModuleDone(m.id));
  // a campanha simulada é uma missão (q-simulador), mas mostra-se na sua própria linha
  const SIM_QUEST = 'q-simulador';
  const quests = QUESTS.filter((q) => q.id !== SIM_QUEST);
  const questsDone = quests.filter((q) => game.isQuestDone(q.id));
  const simQuest = getQuest(SIM_QUEST);
  const simDone = simQuest ? game.isQuestDone(SIM_QUEST) : game.simRuns.length > 0;
  const simMax = (simQuest?.points ?? 0) + SIM_COMPLETE_POINTS;
  const games = MINI_GAMES.map((g) => ({ g, pts: miniGamePointsFor(g.id, game.miniGameBest(g.id)) }));
  const played = games.filter((x) => x.pts > 0).length;
  return [
    { id: 'modulos', label: 'Módulos', earned: modulesDone.reduce((s, m) => s + m.points, 0), max: MODULES.reduce((s, m) => s + m.points, 0), detail: `${modulesDone.length} de ${MODULES.length}` },
    { id: 'missoes', label: 'Missões', earned: questsDone.reduce((s, q) => s + q.points, 0), max: quests.reduce((s, q) => s + q.points, 0), detail: `${questsDone.length} de ${quests.length}` },
    { id: 'minijogos', label: 'Mini-jogos', earned: games.reduce((s, x) => s + x.pts, 0), max: MINI_GAMES.reduce((s, g) => s + g.maxPoints, 0), detail: `${played} de ${MINI_GAMES.length} jogados` },
    { id: 'simulador', label: 'Simulador', earned: (simDone ? simQuest?.points ?? 0 : 0) + (game.simRuns.length > 0 ? SIM_COMPLETE_POINTS : 0), max: simMax, detail: simDone ? 'campanha jogada' : 'por jogar' },
  ];
}
