import { MINI_GAMES, MODULES, QUESTS, SIM_COMPLETE_POINTS } from '../../data';
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
  const questsDone = QUESTS.filter((q) => game.isQuestDone(q.id));
  const games = MINI_GAMES.map((g) => ({ g, pts: miniGamePointsFor(g.id, game.miniGameBest(g.id)) }));
  const played = games.filter((x) => x.pts > 0).length;
  return [
    { id: 'modulos', label: 'Módulos', earned: modulesDone.reduce((s, m) => s + m.points, 0), max: MODULES.reduce((s, m) => s + m.points, 0), detail: `${modulesDone.length} de ${MODULES.length}` },
    { id: 'missoes', label: 'Missões', earned: questsDone.reduce((s, q) => s + q.points, 0), max: QUESTS.reduce((s, q) => s + q.points, 0), detail: `${questsDone.length} de ${QUESTS.length}` },
    { id: 'minijogos', label: 'Mini-jogos', earned: games.reduce((s, x) => s + x.pts, 0), max: MINI_GAMES.reduce((s, g) => s + g.maxPoints, 0), detail: `${played} de ${MINI_GAMES.length} jogados` },
    { id: 'simulador', label: 'Simulador', earned: game.simRuns.length > 0 ? SIM_COMPLETE_POINTS : 0, max: SIM_COMPLETE_POINTS, detail: game.simRuns.length > 0 ? 'campanha jogada' : 'por jogar' },
  ];
}
