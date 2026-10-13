#!/usr/bin/env node
/**
 * Converte dist-artifact/index.html (ficheiro único, vite-plugin-singlefile)
 * num FRAGMENTO HTML para Artifacts do claude.ai:
 *   <title> · <link> das fontes · <style> · <div id="root"></div> · <script type="module">
 * Sem doctype/html/head/body. Verifica < 5 MB e que não há URLs externos
 * além de fonts.googleapis.com / fonts.gstatic.com.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = resolve(root, 'dist-artifact/index.html');
const output = resolve(root, 'dist-artifact/sprout-artifact.html');
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

if (!existsSync(input)) {
  console.error(`✗ Não encontrei ${input}. Corre primeiro: vite build --mode artifact`);
  process.exit(1);
}

const html = readFileSync(input, 'utf8');

const pick = (re) => [...html.matchAll(re)].map((m) => m[0]);

const title = pick(/<title>[\s\S]*?<\/title>/gi)[0] ?? '<title>Sprout Investimento Agro</title>';
const fontLinks = pick(/<link\b[^>]*>/gi).filter((l) => /fonts\.(googleapis|gstatic)\.com/.test(l));
const styles = pick(/<style\b[^>]*>[\s\S]*?<\/style>/gi);
const scripts = pick(/<script\b[^>]*type=["']module["'][^>]*>[\s\S]*?<\/script>/gi);

if (!scripts.length) {
  console.error('✗ Nenhum <script type="module"> embutido encontrado. O build de artifact usou o vite-plugin-singlefile?');
  process.exit(1);
}
if (pick(/<script\b[^>]*\bsrc=/gi).length) {
  console.error('✗ Há scripts externos (src=) no build; o artifact tem de ser autocontido.');
  process.exit(1);
}

const fragment = [title, ...fontLinks, ...styles, '<div id="root"></div>', ...scripts].join('\n') + '\n';

/* ------------------------------------------------------------ verificações */
const bytes = Buffer.byteLength(fragment, 'utf8');
const problems = [];
if (bytes >= MAX_BYTES) problems.push(`tamanho ${(bytes / 1024 / 1024).toFixed(2)} MB ≥ 5 MB`);

// recursos externos: atributos src/href, url() em CSS, import()/from de URL absoluta
const resourceRefs = [
  ...fragment.matchAll(/\b(?:src|href)\s*=\s*["'](https?:)?\/\/([^/"']+)[^"']*["']/gi),
  ...styles.join('\n').matchAll(/url\(\s*["']?(https?:)?\/\/([^/"')]+)[^)]*\)/g),
  ...fragment.matchAll(/(?:import\s*\(|from\s*)["'](https?:)?\/\/([^/"']+)/gi),
  ...fragment.matchAll(/@import\s+["'](https?:)?\/\/([^/"']+)/gi),
].map((m) => m[2]);
const external = [...new Set(resourceRefs)].filter((h) => !ALLOWED_HOSTS.includes(h));
if (external.length) problems.push(`recursos externos não permitidos: ${external.join(', ')}`);

// informativo: outras strings http(s) no JS (namespaces SVG, mensagens de erro do React)
const otherUrls = new Set([...fragment.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1]).filter((h) => !ALLOWED_HOSTS.includes(h)));

writeFileSync(output, fragment);

console.log(`Fragmento: ${output}`);
console.log(`  tamanho: ${(bytes / 1024).toFixed(0)} KB (limite 5 120 KB)`);
console.log(`  fontes: ${fontLinks.length} <link>, estilos: ${styles.length}, scripts: ${scripts.length}`);
if (otherUrls.size) console.log(`  strings com URL no código (não são pedidos de rede): ${[...otherUrls].join(', ')}`);
if (problems.length) {
  console.error(`✗ ${problems.join('; ')}`);
  process.exit(1);
}
console.log('✓ Fragmento pronto para Artifact.');
