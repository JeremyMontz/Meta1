#!/usr/bin/env node
/**
 * Internal link check (CI)
 * ----------------------------------------------------------------------------
 * Verifies every internal href/src in the site's HTML resolves to a real file.
 * Encodes the two path conventions this site uses:
 *   "/Meta1/..."   GitHub Pages project base  -> resolve against repo root
 *   "/..."         site-absolute               -> resolve against repo root
 *   "foo" / "../"  relative                     -> resolve against file's dir
 *
 * Out of scope (internal-only, deterministic, no network):
 *   external links (http, mailto, tel, data, javascript:) and pure "#" anchors.
 * Files whose name starts with "_" are skipped (templates/partials that carry
 * [REPLACE] tokens by design).
 *
 * If the site ever moves to a custom domain, set PAGES_BASE to '/'.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, normalize, relative } from 'node:path';

const ROOT = process.cwd();
const PAGES_BASE = '/Meta1/';
const LINK_RE = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const EXTERNAL = /^(https?:|mailto:|tel:|data:|javascript:|#)/i;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === '.git') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.html') && !e.startsWith('_')) out.push(p);
  }
  return out;
}
const exists = (p) => { try { statSync(p); return true; } catch { return false; } };

const broken = [];
let checked = 0;
for (const file of walk(ROOT)) {
  const dir = dirname(file);
  for (const m of readFileSync(file, 'utf8').matchAll(LINK_RE)) {
    let u = m[1].trim();
    if (EXTERNAL.test(u)) continue;
    u = u.split('#')[0].split('?')[0];
    if (!u) continue;
    let target;
    if (u.startsWith(PAGES_BASE)) target = join(ROOT, u.slice(PAGES_BASE.length));
    else if (u.startsWith('/'))   target = join(ROOT, u.slice(1));
    else                          target = normalize(join(dir, u));
    checked++;
    if (!exists(target)) broken.push(`${relative(ROOT, file)}  ->  ${m[1]}`);
  }
}

console.log(`internal links checked: ${checked}`);
if (broken.length) {
  console.error(`\nbroken internal links: ${broken.length}`);
  for (const b of broken) console.error(`  x ${b}`);
  process.exit(1);
}
console.log('all internal links resolve.');
