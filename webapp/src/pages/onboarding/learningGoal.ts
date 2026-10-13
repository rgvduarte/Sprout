import { useCallback, useSyncExternalStore } from 'react';
import type { LevelId, WorldId } from '../../data/types';
import type { ProfileId } from '../../state';

/* =====================================================================
   Objetivo de aprendizagem (última missão do registo). Em memória, por
   perfil. Mede-se só em pontos de conhecimento, nunca em dinheiro.
   ===================================================================== */

export interface LearningGoal {
  world: WorldId;
  level: LevelId;
  setAt: string;
}

const goals: Partial<Record<ProfileId, LearningGoal>> = {};
const listeners = new Set<() => void>();

export function setLearningGoal(profile: ProfileId, goal: LearningGoal | undefined) {
  goals[profile] = goal;
  listeners.forEach((l) => l());
}

export function useLearningGoal(profile: ProfileId): [LearningGoal | undefined, (g: LearningGoal | undefined) => void] {
  const goal = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => goals[profile],
    () => goals[profile],
  );
  const set = useCallback((g: LearningGoal | undefined) => setLearningGoal(profile, g), [profile]);
  return [goal, set];
}
