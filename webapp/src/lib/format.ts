import { TZ, toDate, now as clockNow } from './clock';

/**
 * Formatação pt-PT. Agrupamento de milhares sempre ativo ("1 234,56 €"),
 * datas no fuso de Lisboa ("13/10/2026"), unidades físicas do produto.
 */
const LOCALE = 'pt-PT';

const nfCache = new Map<string, Intl.NumberFormat>();
function nf(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, { useGrouping: 'always', ...options } as Intl.NumberFormatOptions);
    nfCache.set(key, f);
  }
  return f;
}

/** Montante em euros. `decimals` 0 ou 2 (por omissão 0 a partir de 1 000 €, 2 abaixo). */
export function eur(value: number, opts: { decimals?: number; sign?: boolean; compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(value) >= 10_000) {
    const abs = Math.abs(value);
    const [div, suffix] = abs >= 1_000_000 ? [1_000_000, ' M€'] : [1_000, ' k€'];
    const body = nf({ maximumFractionDigits: abs / div >= 100 ? 0 : 1, minimumFractionDigits: 0 }).format(abs / div);
    const s = value < 0 ? '−' : opts.sign && value > 0 ? '+' : '';
    return `${s}${body}${suffix}`;
  }
  const decimals = opts.decimals ?? (Math.abs(value) >= 1000 ? 0 : 2);
  const body = nf({ style: 'currency', currency: 'EUR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Math.abs(value));
  const s = value < 0 ? '−' : opts.sign && value > 0 ? '+' : '';
  return `${s}${body}`;
}

/** Preço unitário com 2–3 casas: "3,53 €/kg", "0,222 €/L". */
export function price(value: number, unit: string, decimals?: number): string {
  const d = decimals ?? (value < 1 ? 3 : 2);
  return `${nf({ minimumFractionDigits: d, maximumFractionDigits: d }).format(value)} €/${unit}`;
}

export function num(value: number, decimals = 0): string {
  return nf({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

/** Percentagem a partir de fração: pct(0.125) → "12,5 %". */
export function pct(fraction: number, decimals = 1, opts: { sign?: boolean } = {}): string {
  const body = nf({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Math.abs(fraction * 100));
  const s = fraction < 0 ? '−' : opts.sign && fraction > 0 ? '+' : '';
  return `${s}${body} %`;
}

/** Pontos percentuais: pp(0.012) → "1,2 p.p." */
export function pp(fraction: number, decimals = 1): string {
  return `${num(fraction * 100, decimals)} p.p.`;
}

export const kg = (value: number, decimals = 0) => `${num(value, decimals)} kg`;
export const t = (kgValue: number, decimals = 1) => `${num(kgValue / 1000, decimals)} t`;
export const L = (litres: number, decimals = 0) => `${num(litres, decimals)} L`;

/* -------------------------------------------------------------- datas */

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function dtf(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let f = dtfCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, ...options });
    dtfCache.set(key, f);
  }
  return f;
}

export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;
export const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'] as const;

/** Partes da data no fuso de Lisboa. month 1–12. */
export function lisbonParts(input: string | Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = dtf({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(toDate(input));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

/** "13/10/2026" */
export const date = (input: string | Date) => dtf({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(toDate(input));
/** "13 de outubro de 2026" */
export const dateLong = (input: string | Date) => dtf({ day: 'numeric', month: 'long', year: 'numeric' }).format(toDate(input));
/** "13 out." */
export function dateShort(input: string | Date): string {
  const p = lisbonParts(input);
  return `${p.day} ${MONTHS_SHORT[p.month - 1]}.`;
}
/** "out. 2026" */
export function monthYear(input: string | Date): string {
  const p = lisbonParts(input);
  return `${MONTHS_SHORT[p.month - 1]}. ${p.year}`;
}
/** "10:00" */
export const time = (input: string | Date) => dtf({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(toDate(input));
/** "13/10/2026, 10:00" */
export const dateTime = (input: string | Date) => `${date(input)}, ${time(input)}`;

/** Tempo relativo curto: "agora", "há 2 min", "há 3 h", "ontem", "há 4 dias", depois data. */
export function relative(input: string | Date, reference: Date = clockNow()): string {
  const diff = reference.getTime() - toDate(input).getTime();
  const future = diff < 0;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  const h = Math.round(abs / 3_600_000);
  const d = Math.round(abs / 86_400_000);
  if (abs < 45_000) return 'agora';
  if (min < 60) return future ? `daqui a ${min} min` : `há ${min} min`;
  if (h < 24) return future ? `daqui a ${h} h` : `há ${h} h`;
  if (d === 1) return future ? 'amanhã' : 'ontem';
  if (d < 14) return future ? `daqui a ${d} dias` : `há ${d} dias`;
  return date(input);
}

/* ------------------------------------------------- tradução física */

/** Densidade do azeite (kg/L) a 20 °C. */
export const OLIVE_DENSITY = 0.916;

/** Palete de água de 1,5 L: 6 garrafas por pack, 84 packs por palete. */
export const PALETE = { garrafaL: 1.5, garrafasPorPack: 6, packsPorPalete: 84, garrafas: 504, litros: 756 } as const;

/** Saca de café verde. */
export const SACA_KG = 60;

/** IBC de azeite. */
export const IBC_KG = 1000;

/** Quantos kg compra um montante a um preço por kg (tudo incluído). */
export const eurToKg = (amount: number, pricePerKg: number) => (pricePerKg > 0 ? amount / pricePerKg : 0);
export const kgToLitres = (kgValue: number, density = OLIVE_DENSITY) => kgValue / density;
/** kgToBottles(1240) → garrafas de 0,75 L de azeite. */
export const kgToBottles = (kgValue: number, bottleL = 0.75, density = OLIVE_DENSITY) => Math.floor(kgToLitres(kgValue, density) / bottleL);
/** Paletes de água financiadas por um montante, a um preço por litro tudo incluído. */
export const eurToPaletes = (amount: number, pricePerLitre: number) => (pricePerLitre > 0 ? amount / (pricePerLitre * PALETE.litros) : 0);
/** Sacas de 60 kg financiadas por um montante, a um preço por kg tudo incluído. */
export const eurToSacas = (amount: number, pricePerKg: number, sacaKg = SACA_KG) => (pricePerKg > 0 ? amount / (pricePerKg * sacaKg) : 0);

/** Plural simples: plural(1, 'lote', 'lotes') → "1 lote". */
export function plural(n: number, singular: string, pluralForm: string, decimals = 0): string {
  return `${num(n, decimals)} ${Math.abs(n) === 1 ? singular : pluralForm}`;
}
