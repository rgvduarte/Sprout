/**
 * svg-charts.mjs — gráficos SVG em linha para os documentos do Sprout (impressão A4).
 *
 * Sem dependências; corre no browser (render-pdf.mjs) e em Node. Cada função recebe
 * dados + opções e devolve uma string <svg>. Segue a skill dataviz:
 *   - forma antes da cor; ênfase (uma série no acento, o resto em cinza) é a regra;
 *   - linhas de 2 px, marcadores r ≥ 4 com anel de 2 px da cor do papel;
 *   - barras ≤ 24 px de espessura, ponta de dados arredondada 4 px, quadrada na base;
 *   - 2 px de papel entre segmentos e barras adjacentes; nunca contornos à volta das marcas;
 *   - grelha e eixos em fio fino, sólidos, recessivos; um só eixo y;
 *   - texto em tinta (nunca na cor da série); rótulos diretos seletivos; legenda com ≥ 2 séries;
 *   - cores de série validadas com validate_palette.js (THEME.series).
 * Impressão: não há hover; cada marca leva <title> e cada figura deve ter os valores
 * acessíveis no texto, na legenda ou numa tabela.
 *
 * Unidades: 1 unidade SVG = 1 px CSS (96/polegada). Passar `width` igual à largura do
 * contentor (mm(…) converte milímetros) para o texto sair no tamanho certo em pt.
 *
 * Exporta: THEME, mm, fmt, makeFmt, lineChart, areaChart, barChart, groupedColumns,
 *          stackedBar, valueChain, timeline, renderAll.
 */

export const THEME = {
  ink: '#1A1E16',
  muted: '#5B6352',
  rule: '#D7DBCC',
  grid: '#E6E9DD',
  axis: '#AEB49F',
  paper: '#FFFFFF',
  panel: '#F4F5EF',
  accent: '#3F5A1E',
  accentSoft: '#E1E8CF',
  // Séries validadas (lightness, chroma, CVD, contraste) contra #FFFFFF.
  series: { azeite: '#8C8A16', agua: '#17709F', cafe: '#8A4816' },
  // Identidade dos mundos (não usar como série: água e café falham o piso de croma).
  world: { azeite: '#8C8A16', agua: '#2D6E8E', cafe: '#6E4A2C' },
  // Degraus neutros para contexto/de-ênfase (do mais escuro ao mais claro).
  neutral: ['#7D846F', '#A9AF9B', '#CDD1C1', '#E3E6DA'],
  status: { ok: '#2E7D4F', warn: '#A86A12', crit: '#B42318' },
  font: {
    body: "'Public Sans', 'Sprout Symbols', sans-serif",
    mono: "'IBM Plex Mono', 'Sprout Symbols', monospace",
    display: "'Archivo', 'Sprout Symbols', 'Public Sans', sans-serif",
  },
  fs: { tick: 6.8, label: 7.2, value: 7.2, title: 8 }, // pt
};

const PX_PER_MM = 96 / 25.4;
const PX_PER_PT = 96 / 72;
export const mm = (v) => v * PX_PER_MM;

/* ---------- Formatação pt-PT ------------------------------------------- */

const MINUS = '−';
const THIN = '\u2009'; // separador de milhares (1/5 em); em SVG não há quebra de linha
const NBSP = ' ';

/** Número pt-PT: vírgula decimal, milhares com espaço fino (a partir de 1 000), menos tipográfico. */
export function fmt(v, { dec = 0, prefix = '', suffix = '', sign = false, group = true } = {}) {
  if (v == null || Number.isNaN(v)) return '';
  const neg = v < 0;
  const abs = Math.abs(v);
  const k = 10 ** dec;
  let [int, frac] = (Math.round((abs + Number.EPSILON) * k) / k).toFixed(dec).split('.');
  if (group && int.length > 3) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  const body = frac ? `${int},${frac}` : int;
  const isZero = Number(int.replace(/\D/g, '')) === 0 && !/[1-9]/.test(frac || '');
  const s = neg && !isZero ? MINUS : sign && v > 0 && !isZero ? '+' : '';
  return `${s}${prefix}${body}${suffix}`;
}

/** Aceita uma função ou um objeto declarativo { dec, prefix, suffix, sign }. */
export function makeFmt(f, fallback = {}) {
  if (typeof f === 'function') return f;
  const o = { ...fallback, ...(f || {}) };
  return (v) => fmt(v, o);
}

const MONTHS_PT = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
export function fmtMonth(t, { year = true, short = false } = {}) {
  const d = new Date(t);
  const m = MONTHS_PT[d.getUTCMonth()];
  const y = d.getUTCFullYear();
  if (!year) return m;
  return short ? `${m} ${String(y).slice(2)}` : `${m} ${y}`;
}

/* ---------- Utilitários SVG --------------------------------------------- */

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = (v) => Math.round(v * 100) / 100;
const toT = (x) => (x instanceof Date ? x.getTime() : typeof x === 'string' ? Date.parse(x.length === 7 ? x + '-15' : x) : x);

/** Largura aproximada de texto (px) para decidir colocação de rótulos. */
export function textW(str, pt = THEME.fs.label, kind = 'body', weight = 400) {
  const px = pt * PX_PER_PT;
  const s = String(str);
  if (kind === 'mono') return s.length * 0.6 * px;
  let w = 0;
  for (const ch of s) {
    if (/[ilI.,:;'|!  ]/.test(ch)) w += 0.28;
    else if (/[mwMW€%]/.test(ch)) w += 0.82;
    else if (/[A-Z0-9]/.test(ch)) w += 0.62;
    else if (ch === ' ') w += 0.26;
    else w += 0.53;
  }
  return w * px * (weight >= 600 ? 1.05 : 1);
}

function text(x, y, str, { size = THEME.fs.label, fill = THEME.ink, anchor = 'start', weight = 400, mono = false, baseline = 'auto', italic = false, cls = '' } = {}) {
  const fam = mono ? THEME.font.mono : THEME.font.body;
  const extra = mono ? ';font-variant-numeric:tabular-nums' : '';
  const db = baseline === 'middle' ? ' dominant-baseline="central"' : baseline === 'hanging' ? ' dominant-baseline="hanging"' : '';
  return `<text x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}"${db}${cls ? ` class="${cls}"` : ''} style="font-family:${fam};font-size:${size}pt;font-weight:${weight}${italic ? ';font-style:italic' : ''}${extra}" fill="${fill}">${esc(str)}</text>`;
}

function svgOpen(w, h, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${r2(w)}" height="${r2(h)}" role="img" aria-label="${esc(label || '')}" style="overflow:visible">`;
}

/** Barra com ponta de dados arredondada (r) e base quadrada. dir: 'up'|'down'|'right'|'left'. */
function barPath(x, y, w, h, dir, r = 4) {
  if (w <= 0 || h <= 0) return '';
  const rr = Math.min(r, (dir === 'up' || dir === 'down' ? w : h) / 2, dir === 'up' || dir === 'down' ? h : w);
  const X = r2(x), Y = r2(y), W = r2(w), H = r2(h), R = r2(rr);
  switch (dir) {
    case 'up':
      return `M${X},${r2(Y + H)}V${r2(Y + R)}Q${X},${Y} ${r2(X + R)},${Y}H${r2(X + W - R)}Q${r2(X + W)},${Y} ${r2(X + W)},${r2(Y + R)}V${r2(Y + H)}Z`;
    case 'down':
      return `M${X},${Y}V${r2(Y + H - R)}Q${X},${r2(Y + H)} ${r2(X + R)},${r2(Y + H)}H${r2(X + W - R)}Q${r2(X + W)},${r2(Y + H)} ${r2(X + W)},${r2(Y + H - R)}V${Y}Z`;
    case 'left':
      return `M${r2(X + W)},${Y}H${r2(X + R)}Q${X},${Y} ${X},${r2(Y + R)}V${r2(Y + H - R)}Q${X},${r2(Y + H)} ${r2(X + R)},${r2(Y + H)}H${r2(X + W)}Z`;
    case 'right':
    default:
      return `M${X},${Y}H${r2(X + W - R)}Q${r2(X + W)},${Y} ${r2(X + W)},${r2(Y + R)}V${r2(Y + H - R)}Q${r2(X + W)},${r2(Y + H)} ${r2(X + W - R)},${r2(Y + H)}H${X}Z`;
  }
}

function linear(d0, d1, r0, r1) {
  const k = (r1 - r0) / (d1 - d0 || 1);
  const f = (v) => r0 + (v - d0) * k;
  f.invert = (p) => d0 + (p - r0) / k;
  return f;
}

/** Ticks "limpos" (1, 2, 2,5, 5 × 10^n). */
export function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const raw = span / count;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = [1, 2, 2.5, 5, 10].find((s) => s * p >= raw) * p;
  const out = [];
  for (let v = Math.ceil(min / m) * m; v <= max + m * 1e-9; v += m) out.push(Math.round(v / m) * m);
  return out;
}

/* ---------- Gráfico de linhas (e área) ---------------------------------- */

/**
 * lineChart({
 *   width, height, margin,
 *   x: { type: 'time'|'linear', min, max, ticks: [..], format },   // datas: 'AAAA-MM-DD' ou 'AAAA-MM'
 *   y: { min, max, ticks, format, unit },                            // unit: rótulo curto do eixo
 *   series: [{ name, color, points: [[x, y, { label, anchor, dx, dy }]...],
 *              markers: true|'ends'|false, area: false, endLabel: true|'texto', width: 2 }],
 *   bands: [{ y0, y1, label }], refLines: [{ y, label }], ariaLabel
 * })
 */
export function lineChart(o) {
  const W = o.width ?? mm(170);
  const H = o.height ?? mm(55);
  const series = o.series || [];
  const isTime = (o.x?.type ?? 'time') === 'time';
  const xs = series.flatMap((s) => s.points.map((p) => (isTime ? toT(p[0]) : p[0])));
  const ys = series.flatMap((s) => s.points.map((p) => p[1]));
  const xmin = o.x?.min != null ? (isTime ? toT(o.x.min) : o.x.min) : Math.min(...xs);
  const xmax = o.x?.max != null ? (isTime ? toT(o.x.max) : o.x.max) : Math.max(...xs);
  const yTicks = o.y?.ticks ?? niceTicks(Math.min(0, ...ys), Math.max(...ys), 4);
  const ymin = o.y?.min ?? Math.min(yTicks[0], ...ys);
  const ymax = o.y?.max ?? Math.max(yTicks[yTicks.length - 1], ...ys);
  const fy = makeFmt(o.y?.format, { dec: 0 });
  const fx = typeof o.x?.format === 'function' ? o.x.format
    : isTime ? (o.x?.format?.yearOnly ? (t) => String(new Date(t).getUTCFullYear()) : (t) => fmtMonth(t, o.x?.format || {}))
    : makeFmt(o.x?.format);

  const yLabW = Math.max(...yTicks.map((t) => textW(fy(t), THEME.fs.tick, 'mono'))) + 6;
  const endLabW = Math.max(0, ...series.filter((s) => s.endLabel).map((s) => textW(s.endLabel === true ? s.name : s.endLabel, THEME.fs.label) + 10));
  const m = { t: o.y?.unit ? 16 : 8, r: Math.max(8, endLabW), b: 18, l: yLabW, ...(o.margin || {}) };
  const sx = linear(xmin, xmax, m.l, W - m.r);
  const sy = linear(ymin, ymax, H - m.b, m.t);

  let g = svgOpen(W, H, o.ariaLabel);
  // bandas de referência (ex.: intervalo de custo de produção)
  for (const b of o.bands || []) {
    const y0 = sy(Math.max(b.y0, ymin)), y1 = sy(Math.min(b.y1, ymax));
    g += `<rect x="${r2(m.l)}" y="${r2(y1)}" width="${r2(W - m.r - m.l)}" height="${r2(y0 - y1)}" fill="${b.color || THEME.panel}"><title>${esc(b.label || '')}</title></rect>`;
    if (b.label) {
      const lx = b.labelAt != null ? sx(isTime ? toT(b.labelAt) : b.labelAt) : m.l + 4;
      const ly = b.labelPos === 'bottom' ? y0 - 4 : y1 + 9;
      g += text(lx, ly, b.label, { size: THEME.fs.tick, fill: THEME.muted, anchor: b.labelAnchor || 'start' });
    }
  }
  // grelha e eixo y
  for (const t of yTicks) {
    const y = sy(t);
    const base = t === 0 || t === ymin;
    g += `<line x1="${r2(m.l)}" x2="${r2(W - m.r)}" y1="${r2(y)}" y2="${r2(y)}" stroke="${base ? THEME.axis : THEME.grid}" stroke-width="${base ? 1 : 0.75}"/>`;
    g += text(m.l - 6, y, fy(t), { size: THEME.fs.tick, fill: THEME.muted, anchor: 'end', mono: true, baseline: 'middle' });
  }
  if (o.y?.unit) g += text(m.l - 6, m.t - 8, o.y.unit, { size: THEME.fs.tick, fill: THEME.muted, anchor: 'end' });
  // linhas de referência: fio fino na cor do eixo (nunca mais forte do que as séries), rótulo discreto
  for (const rl of o.refLines || []) {
    const y = sy(rl.y);
    g += `<line x1="${r2(m.l)}" x2="${r2(W - m.r)}" y1="${r2(y)}" y2="${r2(y)}" stroke="${THEME.axis}" stroke-width="0.75"/>`;
    if (rl.label) g += text(rl.labelAt === 'start' ? m.l + 3 : W - m.r, y - 4, rl.label, { size: THEME.fs.tick, fill: THEME.muted, anchor: rl.labelAt === 'start' ? 'start' : 'end' });
  }
  // eixo x
  const xTicks = (o.x?.ticks || niceTicks(xmin, xmax, 5)).map((t) => (isTime ? toT(t) : t));
  g += `<line x1="${r2(m.l)}" x2="${r2(W - m.r)}" y1="${r2(H - m.b)}" y2="${r2(H - m.b)}" stroke="${THEME.axis}" stroke-width="1"/>`;
  for (const t of xTicks) {
    const x = sx(t);
    g += `<line x1="${r2(x)}" x2="${r2(x)}" y1="${r2(H - m.b)}" y2="${r2(H - m.b + 3)}" stroke="${THEME.axis}" stroke-width="1"/>`;
    g += text(x, H - m.b + 12, fx(t), { size: THEME.fs.tick, fill: THEME.muted, anchor: 'middle', mono: !isTime });
  }
  // séries: áreas primeiro, depois linhas, depois marcadores e rótulos
  for (const s of series) {
    const pts = s.points.map((p) => [sx(isTime ? toT(p[0]) : p[0]), sy(p[1]), p]);
    if (s.area) {
      const base = sy(Math.max(ymin, 0));
      const d = `M${r2(pts[0][0])},${r2(base)}` + pts.map(([x, y]) => `L${r2(x)},${r2(y)}`).join('') + `L${r2(pts[pts.length - 1][0])},${r2(base)}Z`;
      g += `<path d="${d}" fill="${s.color || THEME.accent}" fill-opacity="0.1" stroke="none"/>`;
    }
  }
  for (const s of series) {
    const pts = s.points.map((p) => [sx(isTime ? toT(p[0]) : p[0]), sy(p[1])]);
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)},${r2(y)}`).join('');
    g += `<path d="${d}" fill="none" stroke="${s.color || THEME.accent}" stroke-width="${s.width ?? 2}" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}><title>${esc(s.name)}</title></path>`;
  }
  for (const s of series) {
    const fyS = makeFmt(s.format || o.y?.format, { dec: 0 });
    s.points.forEach((p, i) => {
      const x = sx(isTime ? toT(p[0]) : p[0]);
      const y = sy(p[1]);
      const isEnd = i === 0 || i === s.points.length - 1;
      const show = s.markers === true || (s.markers === 'ends' && isEnd) || (p[2] && p[2].marker);
      if (show) g += `<circle cx="${r2(x)}" cy="${r2(y)}" r="4" fill="${s.color || THEME.accent}" stroke="${THEME.paper}" stroke-width="2"><title>${esc(`${s.name}: ${fx(isTime ? toT(p[0]) : p[0])} ${fyS(p[1])}`)}</title></circle>`;
      const lab = p[2] && p[2].label;
      if (lab) {
        const anchor = p[2].anchor || 'middle';
        const dx = p[2].dx ?? 0;
        const dy = p[2].dy ?? -9;
        const lines = String(lab).split('\n');
        lines.forEach((ln, k) => {
          const ty = y + dy + k * 9.5 - (dy < 0 ? (lines.length - 1) * 9.5 : 0);
          const [val, ...rest] = ln.split(' · ');
          if (k === 0 && rest.length) {
            // "8,99 · jan. 2024": valor em mono, contexto em texto corrido, cinzento
            g += `<text x="${r2(x + dx)}" y="${r2(ty)}" text-anchor="${anchor}" style="font-size:${THEME.fs.value}pt" fill="${THEME.ink}">`
              + `<tspan style="font-family:${THEME.font.mono};font-weight:500;font-variant-numeric:tabular-nums">${esc(val)}</tspan>`
              + `<tspan dx="3.5" style="font-family:${THEME.font.body}" fill="${THEME.muted}">${esc(rest.join(' · '))}</tspan></text>`;
          } else {
            g += text(x + dx, ty, ln, { size: THEME.fs.value, anchor, weight: k === 0 ? 500 : 400, fill: k === 0 ? THEME.ink : THEME.muted, mono: k === 0 && /^[\d−+]/.test(ln) });
          }
        });
      }
    });
    if (s.endLabel) {
      const last = s.points[s.points.length - 1];
      const x = sx(isTime ? toT(last[0]) : last[0]);
      const y = sy(last[1]) + (s.endDy || 0);
      const lab = s.endLabel === true ? s.name : s.endLabel;
      if (s.endDy) g += `<line x1="${r2(x + 5)}" x2="${r2(x + 8)}" y1="${r2(sy(last[1]))}" y2="${r2(y)}" stroke="${THEME.axis}" stroke-width="0.75"/>`;
      g += text(x + 9, y, lab, { size: THEME.fs.label, baseline: 'middle', weight: s.emphasis ? 600 : 400 });
    }
  }
  return g + '</svg>';
}

/** Área de uma só série (lavagem a 10 %). */
export function areaChart(o) {
  return lineChart({ ...o, series: (o.series || []).map((s) => ({ area: true, ...s })) });
}

/* ---------- Barras horizontais (com barras flutuantes from→value) ------- */

/**
 * barChart({ width, data: [{ label, value, from?, color?, valueLabel?, sub? }],
 *            x: { min, max, ticks, format }, thickness: 12, rowGap: 10, labelWidth, ariaLabel })
 */
export function barChart(o) {
  const W = o.width ?? mm(170);
  const data = o.data || [];
  const th = Math.min(o.thickness ?? 12, 24);
  const rowH = th + (o.rowGap ?? 12) + (data.some((d) => d.sub) ? 8 : 0);
  const fx = makeFmt(o.x?.format, { dec: 2 });
  const labW = o.labelWidth ?? Math.min(W * 0.42, Math.max(...data.map((d) => textW(d.label, THEME.fs.label, 'body', d.emphasis ? 600 : 400))) + 10);
  // rótulos compridos partem em duas linhas (nunca são cortados)
  const wrap = (s, max, weight) => {
    if (textW(s, THEME.fs.label, 'body', weight) <= max) return [s];
    const words = s.split(' ');
    let best = [s], bestW = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      const w = Math.max(textW(a, THEME.fs.label, 'body', weight), textW(b, THEME.fs.label, 'body', weight));
      if (w < bestW) { bestW = w; best = [a, b]; }
    }
    return best;
  };
  const vals = data.flatMap((d) => [d.value, d.from ?? 0]);
  const ticks = o.x?.ticks ?? niceTicks(Math.min(0, ...vals), Math.max(...vals), 4);
  const xmin = o.x?.min ?? Math.min(ticks[0], ...vals);
  const xmax = o.x?.max ?? Math.max(ticks[ticks.length - 1], ...vals);
  const valW = Math.max(...data.map((d) => textW(d.valueLabel ?? fx(d.value), THEME.fs.value, 'mono'))) + 8;
  const m = { t: (o.refLines || []).some((r) => r.label) ? 13 : 4, r: valW, b: o.x?.hideAxis ? 2 : 16, l: labW };
  const H = m.t + data.length * rowH + m.b;
  const sx = linear(xmin, xmax, m.l, W - m.r);
  let g = svgOpen(W, H, o.ariaLabel);
  if (!o.x?.hideAxis) {
    for (const t of ticks) {
      const x = sx(t);
      g += `<line x1="${r2(x)}" x2="${r2(x)}" y1="${m.t}" y2="${r2(H - m.b)}" stroke="${t === 0 ? THEME.axis : THEME.grid}" stroke-width="${t === 0 ? 1 : 0.75}"/>`;
      g += text(x, H - m.b + 11, fx(t), { size: THEME.fs.tick, fill: THEME.muted, anchor: 'middle', mono: true });
    }
  }
  for (const rl of o.refLines || []) {
    const x = sx(rl.x);
    g += `<line x1="${r2(x)}" x2="${r2(x)}" y1="${m.t - 2}" y2="${r2(H - m.b)}" stroke="${THEME.muted}" stroke-width="0.75"/>`;
    if (rl.label) g += text(x, m.t - 4, rl.label, { size: THEME.fs.tick, fill: THEME.muted, anchor: 'middle' });
  }
  data.forEach((d, i) => {
    const yc = m.t + i * rowH + rowH / 2 - (d.sub ? 4 : 0);
    const a = sx(d.from ?? Math.max(0, xmin));
    const b = sx(d.value);
    const x0 = Math.min(a, b), w = Math.abs(b - a);
    const floating = d.from != null && d.from !== 0;
    const dir = d.value >= (d.from ?? 0) ? 'right' : 'left';
    const path = floating
      ? `M${r2(x0)},${r2(yc - th / 2)}h${r2(w)}v${r2(th)}h${r2(-w)}Z`
      : barPath(x0, yc - th / 2, w, th, dir, 4);
    g += `<path d="${path}" fill="${d.color || THEME.accent}"${floating ? ' rx="2"' : ''}><title>${esc(`${d.label}: ${d.valueLabel ?? fx(d.value)}`)}</title></path>`;
    const lines = wrap(d.label, labW - 10, d.emphasis ? 600 : 400);
    lines.forEach((ln, k) => {
      g += text(m.l - 8, yc + (k - (lines.length - 1) / 2) * 9.5, ln, { size: THEME.fs.label, anchor: 'end', baseline: 'middle', weight: d.emphasis ? 600 : 400 });
    });
    if (d.sub) g += text(m.l - 8, yc + 9.5, d.sub, { size: THEME.fs.tick, anchor: 'end', baseline: 'middle', fill: THEME.muted });
    // valor na ponta livre da barra: à direita se cresce para a direita, à esquerda se cresce para a esquerda
    const lab = d.valueLabel ?? fx(d.value);
    if (dir === 'left' && !d.labelRight) {
      g += text(Math.min(a, b) - 5, yc, lab, { size: THEME.fs.value, baseline: 'middle', mono: true, weight: d.emphasis ? 600 : 400, anchor: 'end' });
    } else {
      g += text(Math.max(a, b) + 5, yc, lab, { size: THEME.fs.value, baseline: 'middle', mono: true, weight: d.emphasis ? 600 : 400 });
    }
  });
  return g + '</svg>';
}

/* ---------- Colunas agrupadas (uma escala, uma base) -------------------- */

/**
 * groupedColumns({ width, height, categories: ['2027', ...],
 *   series: [{ name, color, values: [...], labelAt: [índices] }], y: { min, max, ticks, format, unit },
 *   refLines: [{ y, label }], ariaLabel })
 */
export function groupedColumns(o) {
  const W = o.width ?? mm(170);
  const H = o.height ?? mm(50);
  const cats = o.categories || [];
  const series = o.series || [];
  const all = series.flatMap((s) => s.values);
  const ticks = o.y?.ticks ?? niceTicks(Math.min(0, ...all), Math.max(0, ...all), 4);
  const ymin = o.y?.min ?? Math.min(ticks[0], ...all, 0);
  const ymax = o.y?.max ?? Math.max(ticks[ticks.length - 1], ...all, 0);
  const fy = makeFmt(o.y?.format, { dec: 0 });
  const fv = makeFmt(o.valueFormat || o.y?.format, { dec: 0 });
  const yLabW = Math.max(...ticks.map((t) => textW(fy(t), THEME.fs.tick, 'mono'))) + 6;
  const m = { t: o.y?.unit ? 14 : 8, r: 4, b: 16, l: yLabW, ...(o.margin || {}) };
  const sy = linear(ymin, ymax, H - m.b, m.t);
  const band = (W - m.l - m.r) / cats.length;
  const gap = 2;
  const bw = Math.min(o.barWidth ?? 24, (band * 0.62 - gap * (series.length - 1)) / series.length);
  const groupW = bw * series.length + gap * (series.length - 1);
  let g = svgOpen(W, H, o.ariaLabel);
  for (const t of ticks) {
    const y = sy(t);
    g += `<line x1="${r2(m.l)}" x2="${r2(W - m.r)}" y1="${r2(y)}" y2="${r2(y)}" stroke="${t === 0 ? THEME.axis : THEME.grid}" stroke-width="${t === 0 ? 1 : 0.75}"/>`;
    g += text(m.l - 6, y, fy(t), { size: THEME.fs.tick, fill: THEME.muted, anchor: 'end', mono: true, baseline: 'middle' });
  }
  if (o.y?.unit) g += text(m.l - 6, m.t - 8, o.y.unit, { size: THEME.fs.tick, fill: THEME.muted, anchor: 'end' });
  const y0 = sy(0);
  cats.forEach((c, i) => {
    const gx = m.l + i * band + (band - groupW) / 2;
    series.forEach((s, k) => {
      const v = s.values[i];
      if (v == null) return;
      const x = gx + k * (bw + gap);
      const y1 = sy(v);
      const up = v >= 0;
      g += `<path d="${barPath(x, Math.min(y0, y1), bw, Math.abs(y1 - y0), up ? 'up' : 'down', 3)}" fill="${s.color}"><title>${esc(`${s.name}, ${c}: ${fv(v)}`)}</title></path>`;
      if ((s.labelAt || []).includes(i)) {
        g += text(x + bw / 2, up ? y1 - 4 : y1 + 10, fv(v), { size: THEME.fs.value, anchor: 'middle', mono: true, weight: 500 });
      }
    });
    g += text(m.l + i * band + band / 2, H - m.b + 11, c, { size: THEME.fs.tick, fill: THEME.muted, anchor: 'middle', mono: true });
  });
  for (const rl of o.refLines || []) {
    const y = sy(rl.y);
    g += `<line x1="${r2(m.l)}" x2="${r2(W - m.r)}" y1="${r2(y)}" y2="${r2(y)}" stroke="${THEME.axis}" stroke-width="0.75"/>`;
    if (rl.label) g += text(W - m.r, y - 4, rl.label, { size: THEME.fs.tick, anchor: 'end', fill: THEME.muted });
  }
  return g + '</svg>';
}

/* ---------- Barra empilhada horizontal ---------------------------------- */

function segLabelColor(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // escolhe a tinta com mais contraste (tinta #1A1E16 tem luminância ~0,012)
  const cInk = (L + 0.05) / (0.0118 + 0.05);
  const cWhite = 1.05 / (L + 0.05);
  return cInk >= cWhite ? THEME.ink : '#FFFFFF';
}

/**
 * Desenha uma linha de segmentos numa escala dada; devolve { svg, spans } (spans = [x0, x1] por segmento).
 * Rótulos dentro do segmento só se couberem; senão vão para fora (acima/abaixo) com linha de chamada.
 */
function segmentRow({ x, y, width, th, segments, scaleMax, fv, outside = 'below', gap = 2, labelLines = 2, minInside = 0 }) {
  const total = scaleMax ?? segments.reduce((a, s) => a + s.value, 0);
  const k = width / total;
  let cx = x;
  let svg = '';
  const spans = [];
  const outsideLabels = [];
  segments.forEach((s, i) => {
    const w = s.value * k;
    const x0 = cx + (i ? gap / 2 : 0);
    const x1 = cx + w - (i < segments.length - 1 ? gap / 2 : 0);
    const isFirst = i === 0, isLast = i === segments.length - 1;
    const rr = 3;
    let d;
    if (isFirst && isLast) d = `M${r2(x0)},${r2(y)}h${r2(x1 - x0)}v${r2(th)}h${r2(x0 - x1)}Z`;
    else d = `M${r2(x0)},${r2(y)}H${r2(x1)}V${r2(y + th)}H${r2(x0)}Z`;
    if (isLast && !s.squareEnd) d = barPath(x0, y, x1 - x0, th, 'right', rr);
    svg += `<path d="${d}" fill="${s.color}"><title>${esc(`${s.label}: ${s.valueLabel ?? fv(s.value)}`)}</title></path>`;
    spans.push([x0, x1]);
    const name = s.label;
    const val = s.valueLabel ?? fv(s.value);
    const needW = Math.max(textW(name, THEME.fs.label, 'body', 500), textW(val, THEME.fs.value, 'mono')) + 8;
    const fits = x1 - x0 >= Math.max(needW, minInside) && th >= (labelLines === 2 ? 22 : 12);
    if (fits && !s.forceOutside) {
      const tc = s.textColor || segLabelColor(s.color);
      if (labelLines === 2) {
        svg += text(x0 + 4, y + th / 2 - 5, name, { size: THEME.fs.label, fill: tc, baseline: 'middle', weight: 500 });
        svg += text(x0 + 4, y + th / 2 + 6, val, { size: THEME.fs.value, fill: tc, baseline: 'middle', mono: true });
      } else {
        svg += text(x0 + 4, y + th / 2, `${name} ${val}`, { size: THEME.fs.label, fill: tc, baseline: 'middle' });
      }
    } else {
      outsideLabels.push({ cx: (x0 + x1) / 2, name, val, w: needW });
    }
    cx += w;
  });
  // rótulos de fora: da esquerda para a direita, cada um ao lado (nunca por cima) da sua linha de chamada,
  // que acaba 1,3 mm antes do texto. Desce/sobe de fila só quando o texto colide com outro da mesma fila;
  // uma linha nunca atravessa o texto de outra fila.
  const GAP = 5;            // px entre a linha de chamada e o texto (~1,3 mm)
  const PAD = 6;            // px mínimos entre dois textos na mesma fila
  const ROW = 20;
  const minX = 0, maxX = x + width;
  const boxes = [];         // { row, x0, x1 }
  const leads = [];         // { x, row }
  let maxRow = 0;
  const order = outsideLabels.map((L, i) => i).sort((a, b) => outsideLabels[a].cx - outsideLabels[b].cx);
  for (const i of order) {
    const L = outsideLabels[i];
    const w = Math.max(textW(L.name, THEME.fs.label, 'body', 500), textW(L.val, THEME.fs.value, 'mono'));
    let pick = null;
    for (let row = 0; row < 6 && !pick; row++) {
      for (const side of ['end', 'start']) {
        const b = side === 'end' ? [L.cx - GAP - w, L.cx - GAP] : [L.cx + GAP, L.cx + GAP + w];
        if (b[0] < minX || b[1] > maxX) continue;
        if (boxes.some((p) => p.row === row && b[0] < p.x1 + PAD && b[1] > p.x0 - PAD)) continue;
        if (boxes.some((p) => p.row < row && L.cx >= p.x0 - 2 && L.cx <= p.x1 + 2)) continue;
        if (leads.some((l) => l.row >= row && l.x >= b[0] - 2 && l.x <= b[1] + 2)) continue;
        pick = { row, side, b };
        break;
      }
    }
    if (!pick) pick = { row: 0, side: 'end', b: [L.cx - GAP - w, L.cx - GAP] };
    boxes.push({ row: pick.row, x0: pick.b[0], x1: pick.b[1] });
    leads.push({ x: L.cx, row: pick.row });
    maxRow = Math.max(maxRow, pick.row);
    const tx = pick.side === 'end' ? L.cx - GAP : L.cx + GAP;
    if (outside === 'below') {
      const ly = y + th + 6 + pick.row * ROW;
      svg += `<line x1="${r2(L.cx)}" x2="${r2(L.cx)}" y1="${r2(y + th + 1)}" y2="${r2(ly + 6)}" stroke="${THEME.axis}" stroke-width="0.75"/>`;
      svg += text(tx, ly + 9, L.name, { size: THEME.fs.label, anchor: pick.side, weight: 500 });
      svg += text(tx, ly + 18.5, L.val, { size: THEME.fs.value, anchor: pick.side, mono: true, fill: THEME.ink });
    } else {
      const ly = y - 6 - pick.row * ROW;
      svg += `<line x1="${r2(L.cx)}" x2="${r2(L.cx)}" y1="${r2(y - 1)}" y2="${r2(ly - 14)}" stroke="${THEME.axis}" stroke-width="0.75"/>`;
      svg += text(tx, ly - 11, L.name, { size: THEME.fs.label, anchor: pick.side, weight: 500 });
      svg += text(tx, ly - 1.5, L.val, { size: THEME.fs.value, anchor: pick.side, mono: true, fill: THEME.ink });
    }
  }
  return { svg, spans, outsideRows: outsideLabels.length ? maxRow + 1 : 0 };
}

/**
 * stackedBar({ width, rows: [{ label, segments: [{ label, value, color, valueLabel? }] }],
 *              thickness: 24, scaleMax, format, ariaLabel })
 */
export function stackedBar(o) {
  const W = o.width ?? mm(170);
  const th = Math.min(o.thickness ?? 24, 28);
  const fv = makeFmt(o.format, { dec: 2 });
  const labW = o.labelWidth ?? (o.rows.some((r) => r.label) ? Math.max(...o.rows.map((r) => textW(r.label || '', THEME.fs.label, 'body', 600))) + 10 : 0);
  const rowH = th + (o.rowGap ?? 34);
  const H = o.rows.length * rowH;
  const scaleMax = o.scaleMax ?? Math.max(...o.rows.map((r) => r.segments.reduce((a, s) => a + s.value, 0)));
  let g = svgOpen(W, H, o.ariaLabel);
  o.rows.forEach((r, i) => {
    const y = i * rowH + 2;
    if (r.label) g += text(labW - 8, y + th / 2, r.label, { size: THEME.fs.label, anchor: 'end', baseline: 'middle', weight: 600 });
    const res = segmentRow({ x: labW, y, width: W - labW, th, segments: r.segments, scaleMax, fv });
    g += res.svg;
  });
  return g + '</svg>';
}

/* ---------- Cadeia de valor em dois níveis (decomposição + ampliação) ---- */

/**
 * valueChain({
 *   width, unit: '€/kg', format: { dec: 2 },
 *   top:    { label, segments: [{ label, value, color, zoom: true? }] },   // ex.: preço de referência decomposto
 *   bottom: { label, segments: [...] },                                    // decomposição do segmento com zoom
 *   thickness: 26, ariaLabel
 * })
 * O segmento com `zoom: true` liga-se à barra de baixo por duas linhas finas.
 */
export function valueChain(o) {
  const W = o.width ?? mm(170);
  const th = Math.min(o.thickness ?? 26, 30);
  const fv = makeFmt(o.format, { dec: 2 });
  const labW = o.labelWidth ?? Math.max(textW(o.top.label, THEME.fs.label, 'body', 600), textW(o.bottom.label, THEME.fs.label, 'body', 600)) + 12;
  // 1.ª passagem só para saber quantas linhas de rótulos exteriores a barra de cima precisa
  const dry = segmentRow({ x: labW, y: 100, width: W - labW, th, segments: o.top.segments, fv, outside: 'above' });
  const topY = 26 + 20 * Math.max(0, dry.outsideRows - 1);
  const top = segmentRow({ x: labW, y: topY, width: W - labW, th, segments: o.top.segments, fv, outside: 'above' });
  const zoomIdx = o.top.segments.findIndex((s) => s.zoom);
  const linkH = o.linkHeight ?? 26;
  const botY = topY + th + linkH;
  const bot = segmentRow({ x: labW, y: botY, width: W - labW, th, segments: o.bottom.segments, fv, outside: 'below' });
  const H = botY + th + 8 + Math.max(1, bot.outsideRows) * 20 + 6;
  let g = svgOpen(W, H, o.ariaLabel);
  g += text(labW - 8, topY + th / 2 - 5, o.top.label, { size: THEME.fs.label, anchor: 'end', baseline: 'middle', weight: 600 });
  if (o.top.sub) g += text(labW - 8, topY + th / 2 + 6, o.top.sub, { size: THEME.fs.tick, anchor: 'end', baseline: 'middle', fill: THEME.muted, mono: true });
  g += text(labW - 8, botY + th / 2 - 5, o.bottom.label, { size: THEME.fs.label, anchor: 'end', baseline: 'middle', weight: 600 });
  if (o.bottom.sub) g += text(labW - 8, botY + th / 2 + 6, o.bottom.sub, { size: THEME.fs.tick, anchor: 'end', baseline: 'middle', fill: THEME.muted, mono: true });
  if (zoomIdx >= 0) {
    const [a, b] = top.spans[zoomIdx];
    const [c] = bot.spans[0];
    const d = bot.spans[bot.spans.length - 1][1];
    g += `<path d="M${r2(a)},${r2(topY + th + 1)}L${r2(c)},${r2(botY - 1)}M${r2(b)},${r2(topY + th + 1)}L${r2(d)},${r2(botY - 1)}" stroke="${THEME.axis}" stroke-width="0.75" fill="none"/>`;
  }
  g += top.svg + bot.svg;
  return g + '</svg>';
}

/* ---------- Linha temporal (faixas, barras e marcos) -------------------- */

/**
 * timeline({ width, start: 'AAAA-MM-DD', end, today?, todayLabel?,
 *   lanes: [{ label, items: [{ from, to, label, color, tone: 'solid'|'soft'|'outline' } | { at, label, kind: 'milestone' }] }],
 *   tick: 'month'|'quarter', ariaLabel })
 */
export function timeline(o) {
  const W = o.width ?? mm(170);
  const t0 = toT(o.start), t1 = toT(o.end);
  const lanes = o.lanes || [];
  const labW = o.labelWidth ?? Math.max(...lanes.map((l) => textW(l.label, THEME.fs.label, 'body', 600))) + 12;
  const laneH = o.laneHeight ?? 30;
  const barH = Math.min(o.barHeight ?? 13, 24);
  const m = { t: 16, b: 4 };
  const H = m.t + lanes.length * laneH + m.b;
  const sx = linear(t0, t1, labW, W - 6);
  let g = svgOpen(W, H, o.ariaLabel);
  // eixo de meses no topo
  const d = new Date(t0);
  d.setUTCDate(1);
  const step = o.tick === 'quarter' ? 3 : 1;
  for (let cur = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); cur <= t1; ) {
    const cd = new Date(cur);
    const x = sx(cur);
    if (cur >= t0) {
      const isJan = cd.getUTCMonth() === 0;
      g += `<line x1="${r2(x)}" x2="${r2(x)}" y1="${m.t - 3}" y2="${r2(H - m.b)}" stroke="${isJan ? THEME.axis : THEME.grid}" stroke-width="${isJan ? 1 : 0.75}"/>`;
      const showLabel = o.tick === 'quarter' ? true : cd.getUTCMonth() % 3 === 0;
      if (showLabel) g += text(x + 2, m.t - 6, isJan || cur === Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) ? fmtMonth(cur) : fmtMonth(cur, { year: false }), { size: THEME.fs.tick, fill: THEME.muted });
    }
    cd.setUTCMonth(cd.getUTCMonth() + step);
    cur = cd.getTime();
  }
  lanes.forEach((ln, i) => {
    const yc = m.t + i * laneH + laneH / 2;
    g += text(labW - 10, yc, ln.label, { size: THEME.fs.label, anchor: 'end', baseline: 'middle', weight: 600 });
    for (const it of ln.items) {
      if (it.kind === 'milestone') {
        const x = sx(toT(it.at));
        const s = 4.5;
        g += `<path d="M${r2(x)},${r2(yc - s)}L${r2(x + s)},${r2(yc)}L${r2(x)},${r2(yc + s)}L${r2(x - s)},${r2(yc)}Z" fill="${it.color || THEME.ink}" stroke="${THEME.paper}" stroke-width="1.5"><title>${esc(it.label)}</title></path>`;
        if (it.label) {
          const anchor = it.anchor || 'start';
          const tx = anchor === 'end' ? x - 8 : anchor === 'middle' ? x : x + 8;
          const ty = it.labelPos === 'below' ? yc + barH / 2 + 7 : it.labelPos === 'above' ? yc - barH / 2 - 3 : yc;
          g += text(tx, ty, it.label, { size: THEME.fs.tick, anchor, baseline: it.labelPos ? 'auto' : 'middle', weight: 500 });
        }
      } else {
        const xa = sx(Math.max(t0, toT(it.from)));
        const xb = sx(Math.min(t1, toT(it.to)));
        const col = it.color || THEME.accent;
        const tone = it.tone || 'solid';
        const fill = tone === 'solid' ? col : tone === 'soft' ? THEME.accentSoft : THEME.paper;
        const stroke = tone === 'outline' ? ` stroke="${col}" stroke-width="1"` : '';
        g += `<rect x="${r2(xa + 1)}" y="${r2(yc - barH / 2)}" width="${r2(Math.max(1, xb - xa - 2))}" height="${r2(barH)}" rx="2" fill="${fill}"${stroke}><title>${esc(it.label)}</title></rect>`;
        if (it.label) {
          const tw = textW(it.label, THEME.fs.tick, 'body', 500);
          const inside = tw + 8 <= xb - xa;
          const tc = tone === 'solid' ? segLabelColor(col) : THEME.ink;
          if (inside) g += text(xa + 5, yc, it.label, { size: THEME.fs.tick, baseline: 'middle', fill: tc, weight: 500 });
          else g += text(it.labelSide === 'left' ? xa - 4 : xb + 4, yc, it.label, { size: THEME.fs.tick, baseline: 'middle', anchor: it.labelSide === 'left' ? 'end' : 'start', weight: 500 });
        }
      }
    }
  });
  if (o.today) {
    const x = sx(toT(o.today));
    g += `<line x1="${r2(x)}" x2="${r2(x)}" y1="${m.t - 2}" y2="${r2(H - m.b)}" stroke="${THEME.ink}" stroke-width="1.25"/>`;
    g += text(x + 3, H - m.b - 2, o.todayLabel || 'hoje', { size: THEME.fs.tick, weight: 600 });
  }
  return g + '</svg>';
}

/* ---------- Ligação ao documento ---------------------------------------- */

const CHARTS = { lineChart, areaChart, barChart, groupedColumns, stackedBar, valueChain, timeline };

/**
 * Desenha todos os gráficos declarados no documento:
 *   <div data-chart="lineChart"><script type="application/json">{ ...spec }</script></div>
 * Larguras em falta usam a largura do contentor; alturas em mm via "heightMm".
 * Cores podem ser nomes de THEME: "accent", "series.azeite", "neutral.1", "status.crit".
 */
export function renderAll(root = globalThis.document) {
  if (!root) return 0;
  const resolveColor = (c) => {
    if (typeof c !== 'string' || c.startsWith('#')) return c;
    const v = c.split('.').reduce((a, k) => (a == null ? a : a[k]), THEME);
    return typeof v === 'string' ? v : c;
  };
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out = {};
      for (const [k, x] of Object.entries(v)) out[k] = k === 'color' || k === 'textColor' ? resolveColor(x) : walk(x);
      return out;
    }
    return v;
  };
  let n = 0;
  for (const el of root.querySelectorAll('[data-chart]')) {
    const fn = CHARTS[el.dataset.chart];
    const src = el.querySelector('script[type="application/json"]');
    if (!fn || !src) continue;
    const spec = walk(JSON.parse(src.textContent));
    if (spec.width == null) spec.width = el.clientWidth || mm(170);
    if (spec.widthMm != null) spec.width = mm(spec.widthMm);
    if (spec.heightMm != null) spec.height = mm(spec.heightMm);
    const holder = root.createElement('div');
    holder.className = 'chart-svg';
    holder.innerHTML = fn(spec);
    el.appendChild(holder);
    n++;
  }
  return n;
}
