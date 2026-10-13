import { useCallback } from 'react';
import { LEVELS } from '../../data';
import type { LearningFocus, LevelId } from '../../data/types';
import { useGame, type ProfileId } from '../../state';

/* =====================================================================
   Objetivo de aprendizagem (última missão do registo). Vive na loja
   partilhada (useGame().learningGoal), a mesma que a Academia e o Início
   leem. Mede-se só em pontos de conhecimento, nunca em dinheiro.
   ===================================================================== */

export interface LearningGoal {
  /** mundo por onde começa, ou 'risco' (escolhido na Academia) */
  focus: LearningFocus;
  /** nível a alcançar; sem escolha explícita, o próximo nível */
  level: LevelId;
  setAt: string;
}

/** O perfil é sempre o ativo; o argumento fica por compatibilidade com as chamadas existentes. */
export function useLearningGoal(_profile?: ProfileId): [LearningGoal | undefined, (g: { focus: LearningFocus; level: LevelId } | undefined) => void] {
  const game = useGame();
  const g = game.learningGoal;
  const fallbackLevel = (game.nextLevel ?? LEVELS[LEVELS.length - 1]).id;
  const goal: LearningGoal | undefined = g ? { focus: g.focus, level: g.level ?? fallbackLevel, setAt: g.setAt } : undefined;
  const { setLearningGoal } = game;
  const set = useCallback((next: { focus: LearningFocus; level: LevelId } | undefined) => setLearningGoal(next ?? null), [setLearningGoal]);
  return [goal, set];
}
