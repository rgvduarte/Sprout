import { useSyncExternalStore } from 'react';
import type { WorldId } from '../data/types';

/**
 * Lê os tokens de cor (CSS custom properties) já resolvidos para o tema ativo.
 * Volta a ler quando muda data-theme no <html> ou prefers-color-scheme.
 * Usar nos gráficos (recharts) e em canvas — nunca hex soltos no código.
 */
export interface Tokens {
  bg: string;
  surface: string;
  surface2: string;
  fg: string;
  muted: string;
  border: string;
  accent: string;
  accentFg: string;
  accentSoft: string;
  rail: string;
  railFg: string;
  azeite: string;
  agua: string;
  cafe: string;
  seal: string;
  ok: string;
  warn: string;
  crit: string;
  info: string;
  seriesAzeite: string;
  seriesAgua: string;
  seriesCafe: string;
  chartGrid: string;
  chartAxis: string;
  chartRef: string;
  fontSans: string;
  fontMono: string;
  dark: boolean;
}

const MAP: Record<Exclude<keyof Tokens, 'dark' | 'fontSans' | 'fontMono'>, string> = {
  bg: '--bg',
  surface: '--surface',
  surface2: '--surface-2',
  fg: '--fg',
  muted: '--muted',
  border: '--border',
  accent: '--accent',
  accentFg: '--accent-fg',
  accentSoft: '--accent-soft',
  rail: '--rail',
  railFg: '--rail-fg',
  azeite: '--c-azeite',
  agua: '--c-agua',
  cafe: '--c-cafe',
  seal: '--seal',
  ok: '--ok',
  warn: '--warn',
  crit: '--crit',
  info: '--info',
  seriesAzeite: '--series-azeite',
  seriesAgua: '--series-agua',
  seriesCafe: '--series-cafe',
  chartGrid: '--chart-grid',
  chartAxis: '--chart-axis',
  chartRef: '--chart-ref',
};

const FALLBACK: Tokens = {
  bg: '#f4f5ef', surface: '#ffffff', surface2: '#eceee4', fg: '#1a1e16', muted: '#5b6352', border: '#d7dbcc',
  accent: '#3f5a1e', accentFg: '#ffffff', accentSoft: '#e1e8cf', rail: '#22301a', railFg: '#e9eedc',
  azeite: '#8c8a16', agua: '#2d6e8e', cafe: '#6e4a2c', seal: '#8e2b1f', ok: '#2e7d4f', warn: '#a86a12', crit: '#b42318', info: '#2d6e8e',
  seriesAzeite: '#8c8a16', seriesAgua: '#17709f', seriesCafe: '#8a4816', chartGrid: '#e3e6da', chartAxis: '#5b6352', chartRef: '#5b6352',
  fontSans: '"Public Sans", sans-serif', fontMono: '"IBM Plex Mono", monospace', dark: false,
};

let snapshot: Tokens = FALLBACK;
let key = '';
const listeners = new Set<() => void>();
let wired = false;

/** O CSS de produção vem minificado (#ffffff → #fff): devolve sempre #rrggbb para cálculos de contraste. */
function normalizeHex(value: string): string {
  const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i.exec(value);
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}${m[4] ? m[4] + m[4] : ''}`.toLowerCase() : value;
}

function read(): Tokens {
  if (typeof window === 'undefined') return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const out = { ...FALLBACK };
  for (const [k, v] of Object.entries(MAP)) {
    const value = normalizeHex(cs.getPropertyValue(v).trim());
    if (value) (out as Record<string, unknown>)[k] = value;
  }
  out.fontSans = cs.getPropertyValue('--font-sans').trim() || FALLBACK.fontSans;
  out.fontMono = cs.getPropertyValue('--font-mono').trim() || FALLBACK.fontMono;
  out.dark = cs.colorScheme.includes('dark');
  return out;
}

function refresh() {
  const next = read();
  const nextKey = JSON.stringify(next);
  if (nextKey !== key) {
    key = nextKey;
    snapshot = next;
    listeners.forEach((l) => l());
  }
}

function wire() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  refresh();
  const mo = new MutationObserver(() => refresh());
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => refresh());
}

function subscribe(listener: () => void) {
  wire();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!wired) wire();
  return snapshot;
}

export function useTokens(): Tokens {
  return useSyncExternalStore(subscribe, getSnapshot, () => FALLBACK);
}

/** Cor de série de gráfico de um mundo. */
export function seriesColor(tokens: Tokens, world: WorldId): string {
  return world === 'azeite' ? tokens.seriesAzeite : world === 'agua' ? tokens.seriesAgua : tokens.seriesCafe;
}

/** Cor de identidade (ilustrações, glifos) de um mundo. */
export function worldColor(tokens: Tokens, world: WorldId): string {
  return world === 'azeite' ? tokens.azeite : world === 'agua' ? tokens.agua : tokens.cafe;
}
