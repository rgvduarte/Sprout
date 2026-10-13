#!/usr/bin/env node
/**
 * Capturas de ecrã com Playwright (Chromium em /opt/pw-browsers; nunca corre "playwright install").
 *
 *   node scripts/shot.mjs --base http://localhost:5173 --routes "/,/mercados" --out DIR
 *        [--widths 1440,390] [--themes light,dark] [--role investidor|visitante|equipa]
 *        [--scroll-steps N] [--reduced-motion]
 *
 * Rotas em hash (#/mercados). Papel e tema via localStorage antes de carregar
 * (+ emulateMedia). Espera pela rede + 600 ms, percorre a página uma vez (para
 * as entradas abaixo da dobra) e grava <slug>_<largura>_<tema>[_<papel>].png.
 * Com --scroll-steps N grava também N capturas do viewport (_s<k>.png).
 * Mostra erros de consola e assinala scroll horizontal. Sai com 0 e um resumo.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

function parseArgs(argv) {
  const out = { widths: '1440,390', themes: 'light', routes: '/', out: 'shots', base: 'http://localhost:5173', scrollSteps: 0, reducedMotion: false, role: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--base') out.base = next();
    else if (a === '--routes') out.routes = next();
    else if (a === '--out') out.out = next();
    else if (a === '--widths') out.widths = next();
    else if (a === '--themes') out.themes = next();
    else if (a === '--role') out.role = next();
    else if (a === '--scroll-steps') out.scrollSteps = Number(next()) || 0;
    else if (a === '--reduced-motion') out.reducedMotion = true;
    else if (a === '--help' || a === '-h') {
      console.log('Uso: node scripts/shot.mjs --base URL --routes "/,/mercados" --out DIR [--widths 1440,390] [--themes light,dark] [--role investidor|visitante|equipa] [--scroll-steps N] [--reduced-motion]');
      process.exit(0);
    }
  }
  return out;
}

const args = parseArgs(process.argv);
const routes = args.routes.split(',').map((r) => r.trim()).filter(Boolean);
const widths = args.widths.split(',').map(Number).filter(Boolean);
const themes = args.themes.split(',').map((t) => t.trim()).filter((t) => ['light', 'dark'].includes(t));
const outDir = resolve(args.out);
mkdirSync(outDir, { recursive: true });

const slugOf = (route) => (route === '/' ? 'inicio' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '').toLowerCase());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fontes do Google via proxy HTTPS do ambiente (se existir); localhost fica sempre fora do proxy.
const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;
process.env.PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK = '1';
const browser = await chromium.launch({
  ...(proxyServer ? { proxy: { server: proxyServer, bypass: 'localhost,127.0.0.1' } } : {}),
});

const summary = [];
try {
  for (const width of widths) {
    for (const theme of themes) {
      const height = width <= 480 ? 844 : 900;
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
        colorScheme: theme,
        reducedMotion: args.reducedMotion ? 'reduce' : 'no-preference',
        hasTouch: width <= 480,
        isMobile: width <= 480,
      });
      await context.addInitScript(
        ([th, role]) => {
          try {
            window.localStorage.setItem('sprout.theme', th);
            if (role) window.localStorage.setItem('sprout.role', role);
          } catch {
            /* sem armazenamento */
          }
        },
        [theme, args.role],
      );
      for (const route of routes) {
        const page = await context.newPage();
        const errors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
        page.on('response', (res) => {
          if (res.status() >= 400) errors.push(`HTTP ${res.status()} ${res.url().slice(0, 160)}`);
        });
        page.on('requestfailed', (req) => errors.push(`pedido falhou: ${req.url().slice(0, 160)} (${req.failure()?.errorText ?? '?'})`));
        await page.emulateMedia({ colorScheme: theme, reducedMotion: args.reducedMotion ? 'reduce' : 'no-preference' });
        const url = `${args.base.replace(/\/$/, '')}/#${route}`;
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
        } catch (e) {
          errors.push(`goto: ${e.message.split('\n')[0]}`);
        }
        await sleep(600);
        // percorrer uma vez para disparar entradas abaixo da dobra
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < total; y += Math.round(height * 0.8)) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await sleep(120);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(450);

        const overflow = await page.evaluate(() => {
          const vw = window.innerWidth;
          const sw = document.documentElement.scrollWidth;
          if (sw <= vw + 1) return null;
          const offenders = [];
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.right > vw + 1 && r.width > 0) {
              let p = el.parentElement;
              let clipped = false;
              while (p) {
                const s = getComputedStyle(p);
                if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && p.getBoundingClientRect().right <= vw + 1) {
                  clipped = true;
                  break;
                }
                p = p.parentElement;
              }
              if (!clipped) offenders.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 3).join('.') : ''} (→${Math.round(r.right)}px)`);
            }
            if (offenders.length >= 5) break;
          }
          return { scrollWidth: sw, viewport: vw, offenders };
        });

        const base = `${slugOf(route)}_${width}_${theme}${args.role ? '_' + args.role : ''}`;
        const file = resolve(outDir, `${base}.png`);
        await page.screenshot({ path: file, fullPage: true });
        const files = [file];

        if (args.scrollSteps > 0) {
          const h = await page.evaluate(() => document.documentElement.scrollHeight);
          const step = Math.max(1, Math.floor((h - height) / args.scrollSteps));
          for (let k = 1; k <= args.scrollSteps; k++) {
            await page.evaluate((yy) => window.scrollTo(0, yy), Math.min(h - height, step * k));
            await sleep(350);
            const f = resolve(outDir, `${base}_s${k}.png`);
            await page.screenshot({ path: f });
            files.push(f);
          }
        }

        summary.push({ route, width, theme, files: files.length, errors, overflow });
        await page.close();
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(`\nCapturas em ${outDir}`);
for (const s of summary) {
  const flags = [];
  if (s.errors.length) flags.push(`${s.errors.length} erro(s) de consola`);
  if (s.overflow) flags.push(`SCROLL HORIZONTAL ${s.overflow.scrollWidth}px > ${s.overflow.viewport}px`);
  console.log(`${flags.length ? '!' : '✓'} ${s.route} · ${s.width}px · ${s.theme} · ${s.files} ficheiro(s)${flags.length ? ' · ' + flags.join(' · ') : ''}`);
  for (const e of s.errors) console.log(`    consola: ${e.slice(0, 300)}`);
  if (s.overflow) for (const o of s.overflow.offenders) console.log(`    excede: ${o}`);
}
const bad = summary.filter((s) => s.errors.length || s.overflow).length;
console.log(`\n${summary.length} captura(s), ${bad} com avisos.`);
process.exit(0);
