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
  // coroa de oliveira à volta da data (o glifo de Mestre, desenhado grande)
  const leaf = (x: number, y: number, r: number) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="3.2" transform="rotate(${r} ${x} ${y})" fill="none" stroke="${c.accent}" stroke-width="1.25"/>`;
  const wreath = [
    `<path d="M262 338 C236 330 230 300 246 282" fill="none" stroke="${c.accent}" stroke-width="1.25"/>`,
    `<path d="M338 338 C364 330 370 300 354 282" fill="none" stroke="${c.accent}" stroke-width="1.25"/>`,
    leaf(244, 322, -70),
    leaf(238, 304, -95),
    leaf(244, 288, -120),
    leaf(356, 322, 70),
    leaf(362, 304, 95),
    leaf(356, 288, 120),
  ].join('');
  return `<svg ${standalone ? 'xmlns="http://www.w3.org/2000/svg" ' : ''}viewBox="0 0 600 400" width="100%" style="display:block" font-family="${sans}">
<rect width="600" height="400" fill="${c.paper}"/>
<rect x="16" y="16" width="568" height="368" fill="${c.bg}" stroke="${c.border}"/>
<rect x="26" y="26" width="548" height="348" fill="none" stroke="${c.accent}" stroke-width="1.5"/>
<text x="300" y="72" text-anchor="middle" font-family="${display}" font-stretch="87.5%" font-weight="700" font-size="14" letter-spacing="1.5" fill="${c.muted}">SPROUT · ACADEMIA</text>
<text x="300" y="124" text-anchor="middle" font-family="${display}" font-stretch="87.5%" font-weight="700" font-size="32" fill="${c.fg}">Certificado de ${esc(level)}</text>
<text x="300" y="162" text-anchor="middle" font-size="13" fill="${c.muted}">atribuído a</text>
<text x="300" y="194" text-anchor="middle" font-family="${display}" font-stretch="87.5%" font-weight="600" font-size="23" fill="${c.fg}">${esc(name)}</text>
<line x1="180" x2="420" y1="210" y2="210" stroke="${c.border}"/>
<text x="300" y="236" text-anchor="middle" font-size="13" fill="${c.fg}">por <tspan font-family="${mono}">${points}</tspan> pontos de conhecimento em módulos,</text>
<text x="300" y="254" text-anchor="middle" font-size="13" fill="${c.fg}">missões de diligência e mini-jogos sobre azeite, água e café</text>
${wreath}
<text x="300" y="314" text-anchor="middle" font-family="${mono}" font-size="13" fill="${c.fg}">${esc(date)}</text>
<text x="300" y="352" text-anchor="middle" font-size="10" fill="${c.muted}">Atesta conteúdos concluídos na Academia Sprout.</text>
<text x="300" y="365" text-anchor="middle" font-size="10" fill="${c.muted}">Não é uma certificação profissional nem uma qualificação de investidor.</text>
</svg>`;
}
