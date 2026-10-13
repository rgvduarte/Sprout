/* =====================================================================
   Certificado de Provador em SVG. Dentro da app usa os tokens (segue o
   tema); a versão descarregada leva as cores do tema claro escritas,
   porque o ficheiro vive fora da app.
   ===================================================================== */

const LIGHT = {
  bg: '#FFFFFF',
  paper: '#F4F5EF',
  fg: '#1A1E16',
  muted: '#5B6352',
  border: '#D7DBCC',
  accent: '#3F5A1E',
  azeite: '#8C8A16',
};

const VARS = {
  bg: 'var(--surface)',
  paper: 'var(--bg)',
  fg: 'var(--fg)',
  muted: 'var(--muted)',
  border: 'var(--border)',
  accent: 'var(--accent)',
  azeite: 'var(--c-azeite)',
};

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function certificateSvg({ name, level, points, date, standalone }: { name: string; level: string; points: number; date: string; standalone?: boolean }): string {
  const c = standalone ? LIGHT : VARS;
  const display = "Archivo, 'Archivo Narrow', 'Arial Narrow', sans-serif";
  const sans = "'Public Sans', 'Segoe UI', Arial, sans-serif";
  const mono = "'IBM Plex Mono', Menlo, Consolas, monospace";
  // ramo de oliveira em coroa (o glifo de Mestre, desenhado grande)
  const leaves = [
    [118, 250, -60],
    [112, 222, -40],
    [114, 194, -20],
    [122, 168, 0],
  ]
    .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="4.5" transform="rotate(${r} ${x} ${y})" fill="none" stroke="${c.accent}" stroke-width="1.5"/>`)
    .join('');
  const leavesR = [
    [482, 250, 60],
    [488, 222, 40],
    [486, 194, 20],
    [478, 168, 0],
  ]
    .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="13" ry="4.5" transform="rotate(${r} ${x} ${y})" fill="none" stroke="${c.accent}" stroke-width="1.5"/>`)
    .join('');
  return `<svg ${standalone ? 'xmlns="http://www.w3.org/2000/svg" ' : ''}viewBox="0 0 600 400" width="100%" style="display:block" font-family="${sans}">
<rect width="600" height="400" fill="${c.paper}"/>
<rect x="16" y="16" width="568" height="368" fill="${c.bg}" stroke="${c.border}"/>
<rect x="26" y="26" width="548" height="348" fill="none" stroke="${c.accent}" stroke-width="1.5"/>
<path d="M132 280 C100 240 104 176 140 146" fill="none" stroke="${c.accent}" stroke-width="1.5"/>
<path d="M468 280 C500 240 496 176 460 146" fill="none" stroke="${c.accent}" stroke-width="1.5"/>
${leaves}${leavesR}
<text x="300" y="70" text-anchor="middle" font-family="${display}" font-stretch="87.5%" font-weight="700" font-size="15" letter-spacing="1.5" fill="${c.muted}">SPROUT · ACADEMIA</text>
<text x="300" y="128" text-anchor="middle" font-family="${display}" font-stretch="87.5%" font-weight="700" font-size="34" fill="${c.fg}">Certificado de ${esc(level)}</text>
<text x="300" y="172" text-anchor="middle" font-size="14" fill="${c.muted}">atribuído a</text>
<text x="300" y="206" text-anchor="middle" font-family="${display}" font-stretch="87.5%" font-weight="600" font-size="24" fill="${c.fg}">${esc(name)}</text>
<line x1="170" x2="430" y1="222" y2="222" stroke="${c.border}"/>
<text x="300" y="250" text-anchor="middle" font-size="13" fill="${c.fg}">por <tspan font-family="${mono}">${points}</tspan> pontos de conhecimento em módulos, missões de diligência</text>
<text x="300" y="268" text-anchor="middle" font-size="13" fill="${c.fg}">e mini-jogos da Academia: azeite, água e café.</text>
<text x="300" y="318" text-anchor="middle" font-family="${mono}" font-size="13" fill="${c.fg}">${esc(date)}</text>
<text x="300" y="352" text-anchor="middle" font-size="10.5" fill="${c.muted}">Atesta conteúdos concluídos na Academia. Não é uma certificação profissional nem uma qualificação de investidor.</text>
</svg>`;
}
