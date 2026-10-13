import { TODAY_DATE, toDate } from '../../lib/clock';

/* =====================================================================
   Validações do registo (cliente). Mensagens dizem o problema e a saída.
   ===================================================================== */

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** Prefixos de NIF de pessoa singular (1, 2, 3; 45 não residentes). */
const NIF_SINGULAR = ['1', '2', '3', '45'];
/** Prefixos de NIPC (pessoas coletivas, Estado, heranças, fundos, não residentes). */
const NIF_COLETIVA = ['5', '6', '70', '71', '72', '74', '75', '77', '78', '79', '90', '91', '98', '99'];

/** Algarismo de controlo módulo 11 (NIF e NIPC usam o mesmo algoritmo). */
export function nifChecksumOk(digits: string): boolean {
  if (!/^\d{9}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(digits[i]) * (9 - i);
  const r = sum % 11;
  const check = r < 2 ? 0 : 11 - r;
  return check === Number(digits[8]);
}

export function validateNif(raw: string, kind: 'singular' | 'coletiva'): string | null {
  const d = onlyDigits(raw);
  const name = kind === 'singular' ? 'NIF' : 'NIPC';
  if (!d) return `Indica o ${name}.`;
  if (d.length !== 9) return `O ${name} tem 9 algarismos; escreveste ${d.length}.`;
  const prefixes = kind === 'singular' ? NIF_SINGULAR : NIF_COLETIVA;
  if (!prefixes.some((p) => d.startsWith(p)))
    return kind === 'singular'
      ? 'Este número não é de pessoa singular (começa por 1, 2, 3 ou 45). Se investes por uma empresa, escolhe «Pessoa coletiva» no passo 1.'
      : 'Este número não é um NIPC (começa por 5, 6, 7 ou 9). Confirma na certidão permanente.';
  if (!nifChecksumOk(d)) return `O algarismo de controlo do ${name} não bate certo. Confirma os 9 algarismos.`;
  return null;
}

export const formatNif = (raw: string) => {
  const d = onlyDigits(raw).slice(0, 9);
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
};

/* ------------------------------------------------------------ IBAN */

/** Países da zona SEPA com o comprimento do IBAN. */
const IBAN_LENGTH: Record<string, number> = {
  PT: 25, ES: 24, FR: 27, DE: 22, NL: 18, IT: 27, BE: 16, LU: 20, IE: 22, AT: 20, FI: 18, GR: 27, SK: 24, SI: 19, EE: 20,
  LV: 21, LT: 20, MT: 31, CY: 28, HR: 21, PL: 28, CZ: 24, HU: 28, RO: 24, BG: 22, SE: 24, DK: 18, NO: 15, IS: 26, LI: 21,
  CH: 21, MC: 27, SM: 27, AD: 24,
};

function mod97(numeric: string): number {
  let r = 0;
  for (const ch of numeric) r = (r * 10 + Number(ch)) % 97;
  return r;
}

export function ibanChecksumOk(iban: string): boolean {
  const s = iban.replace(/\s+/g, '').toUpperCase();
  const rearranged = s.slice(4) + s.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  return /^\d+$/.test(numeric) && mod97(numeric) === 1;
}

export function validateIban(raw: string): string | null {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (!s) return 'Indica o IBAN da conta de onde vais transferir.';
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(s)) return 'O IBAN começa pelas duas letras do país e dois algarismos, por exemplo PT50.';
  const cc = s.slice(0, 2);
  const len = IBAN_LENGTH[cc];
  if (!len) return 'No piloto só aceitamos contas em bancos da zona SEPA.';
  if (s.length !== len) return `Um IBAN ${cc} tem ${len} posições; este tem ${s.length}. Falta ou sobra algum algarismo.`;
  if (!ibanChecksumOk(s)) return 'O IBAN não passa na verificação de controlo (módulo 97). Confirma os algarismos.';
  return null;
}

export const formatIban = (raw: string) =>
  raw
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/(.{4})(?=.)/g, '$1 ');

/* ------------------------------------------------------------ morada e contacto */

export function validatePostal(raw: string, pais: string): string | null {
  const s = raw.trim();
  if (!s) return 'Indica o código postal.';
  if (pais === 'PT' && !/^\d{4}-\d{3}$/.test(s)) return 'Em Portugal o código postal tem o formato 0000-000.';
  return null;
}

export function formatPostal(raw: string, pais: string): string {
  if (pais !== 'PT') return raw;
  const d = onlyDigits(raw).slice(0, 7);
  return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
}

export function validateEmail(raw: string): string | null {
  const s = raw.trim();
  if (!s) return 'Indica um email de contacto.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return 'Este email não parece completo (falta o @ ou o domínio).';
  return null;
}

export function validatePhone(raw: string): string | null {
  const s = raw.replace(/[\s-]/g, '');
  if (!s) return 'Indica um telefone de contacto.';
  if (s.startsWith('+351') || /^[29]\d{8}$/.test(s)) {
    const d = s.replace(/^\+351/, '');
    if (!/^[29]\d{8}$/.test(d)) return 'Um número português tem 9 algarismos e começa por 9 (móvel) ou 2 (fixo).';
    return null;
  }
  if (!/^\+\d{8,15}$/.test(s)) return 'Indica o número com o indicativo do país, por exemplo +34 612 345 678.';
  return null;
}

export function validateRequired(raw: string, message: string): string | null {
  return raw.trim() ? null : message;
}

/** "17041979" → "17/04/1979" enquanto se escreve. */
export function formatDateInput(raw: string): string {
  const d = onlyDigits(raw).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "17/04/1979" → "1979-04-17" (ou null se não for uma data real). */
export function parseDateInput(raw: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm}-${dd}`;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(dd) || d.getUTCMonth() + 1 !== Number(mm)) return null;
  return iso;
}

export function validateBirth(raw: string): string | null {
  if (!raw) return 'Indica a data de nascimento.';
  const iso = parseDateInput(raw);
  if (!iso) return 'Escreve a data no formato dd/mm/aaaa, por exemplo 17/04/1979.';
  const d = toDate(iso);
  const today = toDate(TODAY_DATE);
  const adult = new Date(d);
  adult.setUTCFullYear(adult.getUTCFullYear() + 18);
  if (adult > today) return 'É preciso ter 18 anos ou mais para abrir conta.';
  if (d.getUTCFullYear() < 1900) return 'Confirma o ano de nascimento.';
  return null;
}

/* ------------------------------------------------------------ certidão permanente */

export function formatCertidao(raw: string): string {
  const d = onlyDigits(raw).slice(0, 12);
  return d.replace(/(\d{4})(?=\d)/g, '$1-');
}

export function validateCertidao(raw: string): string | null {
  const d = onlyDigits(raw);
  if (!d) return 'Indica o código de acesso à certidão permanente.';
  if (d.length !== 12) return `O código da certidão permanente tem 12 algarismos (0000-0000-0000); escreveste ${d.length}.`;
  return null;
}

/* ------------------------------------------------------------ ficheiros */

export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Lê os primeiros bytes para confirmar o formato (não confia só na extensão). */
export async function sniffFile(file: File): Promise<{ ok: boolean; kind?: 'PDF' | 'JPEG' | 'PNG'; message?: string }> {
  if (file.size > MAX_FILE_BYTES) return { ok: false, message: `O ficheiro tem ${(file.size / 1024 / 1024).toFixed(1).replace('.', ',')} MB; o máximo é 10 MB.` };
  if (file.size === 0) return { ok: false, message: 'O ficheiro está vazio.' };
  try {
    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const is = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
    if (is(0x25, 0x50, 0x44, 0x46)) return { ok: true, kind: 'PDF' };
    if (is(0xff, 0xd8, 0xff)) return { ok: true, kind: 'JPEG' };
    if (is(0x89, 0x50, 0x4e, 0x47)) return { ok: true, kind: 'PNG' };
  } catch {
    return { ok: false, message: 'Não foi possível ler o ficheiro. Tenta outra vez.' };
  }
  return { ok: false, message: 'Aceitamos PDF, JPEG ou PNG. Este ficheiro não é nenhum destes formatos.' };
}

export function fileSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
