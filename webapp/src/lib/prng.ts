/**
 * PRNG determinístico (mulberry32). Todos os dados de demonstração e eventos
 * "ao vivo" saem daqui, para que capturas de ecrã e números se repitam.
 */
export interface Rng {
  /** [0, 1) */
  next(): number;
  /** real em [min, max) */
  range(min: number, max: number): number;
  /** inteiro em [min, max] */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(p: number): boolean;
  /** normal aproximada (Box–Muller), média 0, desvio 1 */
  normal(): number;
  /** escolha ponderada */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
}

export function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed: number | string): Rng {
  let a = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
    normal: () => {
      const u = Math.max(next(), 1e-9);
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    weighted: (items, weight) => {
      const total = items.reduce((s, it) => s + weight(it), 0);
      let r = next() * total;
      for (const it of items) {
        r -= weight(it);
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    },
  };
  return rng;
}
