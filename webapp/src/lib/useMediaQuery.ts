import { useSyncExternalStore } from 'react';

/** Subscreve uma media query. Devolve `fallback` fora do browser. */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

/** ≥ 900px: rail fixo, capítulos fixos (sticky) e parallax ligados. */
export const useIsDesktop = () => useMediaQuery('(min-width: 900px)', true);

/** Separador do browser visível. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    (cb) => {
      document.addEventListener('visibilitychange', cb);
      return () => document.removeEventListener('visibilitychange', cb);
    },
    () => document.visibilityState === 'visible',
    () => true,
  );
}
