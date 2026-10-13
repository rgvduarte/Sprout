/** localStorage com try/catch: em janelas privadas, pré-visualizações e artifacts pode falhar. */
export function readStorage<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = window.localStorage.getItem(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* armazenamento indisponível: preferência fica só nesta sessão */
  }
}

export const STORAGE_KEYS = { role: 'sprout.role', theme: 'sprout.theme', diario: 'sprout.diario' } as const;
