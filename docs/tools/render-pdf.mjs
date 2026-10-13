#!/usr/bin/env node
/**
 * render-pdf.mjs — HTML -> PDF A4 com o Chromium do Playwright.
 *
 * Uso:
 *   node render-pdf.mjs <input.html> <output.pdf> [--expect-pages N] [--no-typeset] [--strict]
 *
 * O que faz:
 *   1. Serve por HTTP local (127.0.0.1, porta aleatória) a pasta comum ao documento e a
 *      docs/tools, para que ../tools/print.css, as fontes em node_modules e os módulos ES
 *      (svg-charts.mjs) carreguem sem as restrições de file://.
 *   2. Emula media print, espera pela rede, por document.fonts.ready e, se <html> tiver
 *      data-await-ready, até o documento marcar data-ready="1" (gráficos desenhados).
 *   3. Tipografia pt-PT (desligável com --no-typeset): espaço inseparável entre número e
 *      unidade (%, €, kg, t, dias...), separador de milhares U+202F, e após palavras de uma
 *      letra (a, e, o, à, é) para não ficarem no fim da linha.
 *   4. Verificações antes de imprimir: glifos fora das fontes da marca, elementos que
 *      transbordam a largura útil, folhas (.sheet) mais altas do que a página.
 *   5. Gera o PDF (A4, printBackground, preferCSSPageSize) e imprime o número de páginas.
 *
 * Código de saída: 0 ok; 1 erro; 2 avisos com --strict ou páginas != --expect-pages.
 * Navegadores: usa os já instalados (PLAYWRIGHT_BROWSERS_PATH, ex.: /opt/pw-browsers).
 * Nunca correr "playwright install".
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
};

function parseArgs(argv) {
  const opts = { typeset: true, strict: false, expectPages: null, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-typeset') opts.typeset = false;
    else if (a === '--strict') opts.strict = true;
    else if (a === '--expect-pages') opts.expectPages = Number(argv[++i]);
    else if (a === '-h' || a === '--help') opts.help = true;
    else opts.positional.push(a);
  }
  return opts;
}

function commonDir(a, b) {
  const pa = path.resolve(a).split(path.sep);
  const pb = path.resolve(b).split(path.sep);
  const out = [];
  for (let i = 0; i < Math.min(pa.length, pb.length) && pa[i] === pb[i]; i++) out.push(pa[i]);
  return out.join(path.sep) || path.sep;
}

function startServer(root) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      const rel = decodeURIComponent(url.pathname);
      const file = path.resolve(root, '.' + rel);
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      const st = await stat(file);
      if (!st.isFile()) { res.writeHead(404).end(); return; }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/* Corre dentro da página: tipografia pt-PT nos nós de texto. */
function typesetInPage() {
  const NBSP = ' ';
  const NNBSP = ' ';
  const units = '(?:%|€|M€|k€|mil\\b|kg\\b|kt\\b|t\\b|L\\b|hl\\b|dias\\b|dia\\b|meses\\b|mês\\b|anos\\b|ano\\b|semanas\\b|p\\.p\\.|p\\.b\\.|h\\b|min\\b|FTE\\b|paletes\\b|clientes\\b|lotes\\b|lagares\\b|garrafas\\b|sacas\\b|USD\\b|°C)';
  const reUnit = new RegExp('(\\d)[ \\u00A0](?=' + units + ')', 'g');
  const reThousands = /\b(\d{1,3})((?:[  ]\d{3})+)(?!\d)/g;
  const reShort = /(?<=^|[\s(\u00A0])([aeoAEOàÀéÉ]|§|n\.º|n\.os|art\.|arts\.|al\.|p\.|pp\.|Dir\.|Reg\.|DL|CSC|CVM|LGT|CC)[ ](?=\S)/g;
  const reEuroLead = /(€)[ ](?=\d)/g;
  const skip = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'svg', 'SVG']);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      for (let p = n.parentNode; p && p !== document.body; p = p.parentNode) {
        if (skip.has(p.nodeName) || (p.classList && p.classList.contains('no-typeset'))) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n, changed = 0;
  while ((n = walker.nextNode())) {
    const before = n.nodeValue;
    let t = before
      .replace(reThousands, (m, a, rest) => a + rest.replace(/[  ]/g, NNBSP))
      .replace(reUnit, '$1' + NBSP)
      .replace(reEuroLead, '$1' + NBSP)
      .replace(reShort, (m, w) => w + NBSP);
    if (t !== before) { n.nodeValue = t; changed++; }
  }
  return changed;
}

/* Corre dentro da página: verificações de glifos e de transbordo. */
function checksInPage() {
  const warnings = [];
  // 1. Glifos: o que as fontes da marca + "Sprout Symbols" cobrem.
  const ok = /[\u0000-ɏəʻ-˜̀-ͯḀ-ỿ -⁯€™←-↙−∕≈≠≤≥﻿]/u;
  const text = document.body.innerText;
  const bad = new Map();
  for (const ch of text) if (!ok.test(ch)) bad.set(ch, (bad.get(ch) || 0) + 1);
  for (const [ch, c] of bad) warnings.push(`glifo fora das fontes da marca: "${ch}" U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} (${c}x)`);

  // 2. Geometria: largura e altura útil da página a partir de print.css.
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--page-content-w);height:var(--page-content-h)';
  document.body.appendChild(probe);
  const W = probe.getBoundingClientRect().width;
  const H = probe.getBoundingClientRect().height;
  probe.remove();
  const bodyLeft = document.body.getBoundingClientRect().left;

  const describe = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.');
    const t = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    return t ? `${s} "${t}"` : s;
  };

  let over = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right - bodyLeft > W + 1 || r.left - bodyLeft < -1) {
      if (over++ < 8) warnings.push(`transborda a largura útil (${(r.right - bodyLeft - W).toFixed(1)}px): ${describe(el)}`);
    }
    if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible' && el.clientWidth > 0) {
      if (over++ < 8) warnings.push(`conteúdo cortado na horizontal: ${describe(el)}`);
    }
  }
  if (over > 8) warnings.push(`… e mais ${over - 8} elementos a transbordar`);

  // 3. Folhas de página fixa: cada .sheet tem de caber numa página.
  const sheets = [...document.querySelectorAll('.sheet')];
  sheets.forEach((s, i) => {
    const h = s.getBoundingClientRect().height;
    if (h > H + 0.5) warnings.push(`folha ${i + 1} (${describe(s).slice(0, 40)}) tem ${(h / H * 100).toFixed(1)}% da altura útil: vai partir para a página seguinte`);
  });
  const fill = sheets.map((s) => Math.round(s.getBoundingClientRect().height / H * 100));
  return { warnings, sheets: sheets.length, fill, W, H };
}

function countPdfPages(buf) {
  const s = buf.toString('latin1');
  const m = s.match(/\/Type\s*\/Page(?!s)/g);
  return m ? m.length : 0;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || opts.positional.length < 2) {
    console.log('Uso: node render-pdf.mjs <input.html> <output.pdf> [--expect-pages N] [--no-typeset] [--strict]');
    process.exit(opts.help ? 0 : 1);
  }
  const input = path.resolve(opts.positional[0]);
  const output = path.resolve(opts.positional[1]);
  await stat(input);

  const root = commonDir(path.dirname(input), TOOLS_DIR);
  const server = await startServer(root);
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/${path.relative(root, input).split(path.sep).map(encodeURIComponent).join('/')}`;

  const browser = await chromium.launch();
  let exitCode = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    page.on('requestfailed', (r) => consoleErrors.push(`pedido falhou: ${r.url()}`));
    page.on('response', (r) => { if (r.status() >= 400) consoleErrors.push(`HTTP ${r.status()}: ${r.url()}`); });

    await page.emulateMedia({ media: 'print' });
    await page.goto(url, { waitUntil: 'networkidle' });

    // Largura do viewport = largura útil da página, para medir como no PDF.
    const contentW = await page.evaluate(() => {
      const p = document.createElement('div');
      p.style.cssText = 'position:absolute;width:var(--page-content-w)';
      document.body.appendChild(p);
      const w = p.getBoundingClientRect().width; p.remove();
      return Math.round(w);
    });
    if (contentW > 0) await page.setViewportSize({ width: contentW, height: 1123 });

    await page.evaluate(async () => {
      if (document.documentElement.hasAttribute('data-await-ready')) {
        const t0 = Date.now();
        while (document.documentElement.dataset.ready !== '1') {
          if (Date.now() - t0 > 15000) throw new Error('data-ready não chegou a "1" em 15 s');
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      await document.fonts.ready;
    });

    const fontsLoaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}${f.style === 'italic' ? ' it' : ''}`));
    if (opts.typeset) {
      const n = await page.evaluate(typesetInPage);
      console.log(`tipografia: ${n} nós de texto ajustados`);
    }
    await page.evaluate(() => document.fonts.ready);

    const chk = await page.evaluate(checksInPage);
    const warnings = [...consoleErrors.map((e) => `consola: ${e}`), ...chk.warnings];

    const pdf = await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      tagged: true,
      outline: true,
    });
    const pages = countPdfPages(pdf);

    console.log(`fontes carregadas: ${[...new Set(fontsLoaded)].join(', ') || 'nenhuma'}`);
    if (chk.sheets) console.log(`folhas (.sheet): ${chk.sheets}; ocupação da altura útil: ${chk.fill.map((f) => f + '%').join(' · ')}`);
    for (const w of warnings) console.log(`AVISO ${w}`);
    console.log(`${path.relative(process.cwd(), output) || output}: ${pages} página${pages === 1 ? '' : 's'}`);

    const expected = opts.expectPages ?? (chk.sheets || null);
    if (expected && pages !== expected) {
      console.log(`AVISO esperadas ${expected} páginas, saíram ${pages}`);
      exitCode = 2;
    }
    if (opts.strict && warnings.length) exitCode = 2;
  } finally {
    await browser.close();
    server.close();
  }
  process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
