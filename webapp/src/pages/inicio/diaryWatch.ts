import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';
import type { CampaignEvent } from '../../data/types';

/* =====================================================================
   Missão de campanha "Acompanha a primeira extração": só contam as
   leituras dos lagares que estiveram à vista no Diário do Início (pelo
   menos ~1 s com o Diário no ecrã). Esperar noutra página não conta.
   Fica na sessão (por papel), como o resto do progresso de jogo.
   ===================================================================== */

const seen = new Map<string, Set<string>>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Leitura de telemetria de um lagar, gerada ao vivo nesta sessão. */
export const isOliveReading = (e: CampaignEvent) => Boolean(e.live) && e.kind === 'telemetria' && e.world === 'azeite';

function markSeen(key: string, ids: string[]) {
  const set = seen.get(key) ?? new Set<string>();
  const before = set.size;
  ids.forEach((id) => set.add(id));
  seen.set(key, set);
  if (set.size !== before) emit();
}

/** Número de leituras dos lagares vistas no Diário por este papel. */
export function useReadingsSeen(key: string): number {
  return useSyncExternalStore(
    subscribe,
    () => seen.get(key)?.size ?? 0,
    () => 0,
  );
}

/**
 * Observa o Diário: enquanto estiver à vista (≥ 35 % dele ou metade do
 * ecrã), as leituras que mostra contam como vistas depois de 1 s.
 */
export function useWatchDiary(ref: RefObject<HTMLElement | null>, key: string, shown: CampaignEvent[], dwellMs = 1000) {
  const visible = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(shown);
  latest.current = shown;

  const arm = () => {
    window.clearTimeout(timer.current);
    if (!visible.current) return;
    timer.current = window.setTimeout(() => {
      if (visible.current) markSeen(key, latest.current.filter(isOliveReading).map((e) => e.id));
    }, dwellMs);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting && (entry.intersectionRatio >= 0.35 || entry.intersectionRect.height >= window.innerHeight * 0.5);
        arm();
      },
      { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer.current);
    };
    // arm lê refs; o observador só depende do elemento e da chave
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, key, dwellMs]);

  // uma leitura nova com o Diário à vista conta depois do mesmo tempo de leitura
  const ids = shown.filter(isOliveReading).map((e) => e.id).join('|');
  useEffect(() => {
    arm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
}
