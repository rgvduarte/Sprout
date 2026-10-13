/** Junta classes condicionais (sem dependências). Ignora tudo o que não for texto. */
export function cn(...parts: unknown[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}
