import { useEffect, useState } from 'react';

/**
 * Relógio simulado. "Hoje" é sempre 13/10/2026, 10:00 em Lisboa (WEST, UTC+1),
 * para capturas de ecrã determinísticas. O tempo avança a partir daí ao ritmo real
 * desde o arranque da app, para que "há 2 min" faça sentido no Diário de campanha.
 */
export const TZ = 'Europe/Lisbon';
export const TODAY_ISO = '2026-10-13T10:00:00+01:00';
export const TODAY = new Date(TODAY_ISO);
export const TODAY_DATE = '2026-10-13';

const boot = typeof performance !== 'undefined' ? performance.now() : 0;

export function now(): Date {
  const elapsed = typeof performance !== 'undefined' ? performance.now() - boot : 0;
  return new Date(TODAY.getTime() + elapsed);
}

/** Re-renderiza a cada `intervalMs` com a hora simulada. */
export function useNow(intervalMs = 30_000): Date {
  const [value, setValue] = useState(now);
  useEffect(() => {
    const id = window.setInterval(() => setValue(now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return value;
}

/** Aceita 'YYYY-MM-DD', ISO completo ou Date. Datas simples ficam ao meio-dia de Lisboa. */
export function toDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return new Date(`${input}T12:00:00Z`);
  if (/^\d{4}-\d{2}$/.test(input)) return new Date(`${input}-15T12:00:00Z`);
  return new Date(input);
}

export const DAY_MS = 86_400_000;

export function daysBetween(a: string | Date, b: string | Date): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY_MS);
}

/** Soma meses a uma data 'YYYY-MM-DD' e devolve 'YYYY-MM-DD' (dia limitado ao fim do mês). */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${String(nm).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

/** Meses (fracionários) entre duas datas. */
export function monthsBetween(a: string | Date, b: string | Date): number {
  return daysBetween(a, b) / 30.4375;
}

/** Campanha agrícola em curso (azeite): colheita out–jan, armazenagem e vendas fev–set. */
export const CAMPAIGN = {
  id: '2026/27',
  label: 'Campanha 2026/27',
  start: '2026-10-01',
  harvestEnd: '2027-01-31',
  end: '2027-09-30',
  phaseLabel: 'colheita em curso',
} as const;

/** Fração (0–1) da campanha decorrida numa data. */
export function campaignProgress(at: string | Date = TODAY): number {
  const total = daysBetween(CAMPAIGN.start, CAMPAIGN.end);
  return Math.min(1, Math.max(0, daysBetween(CAMPAIGN.start, at) / total));
}
