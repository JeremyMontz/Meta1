#!/usr/bin/env node
/**
 * tc-building-while-i-sleep — flagship case-study page contract  (Tier 1 · GH #456)
 * ----------------------------------------------------------------------------
 * Page-specific contract for writing/building-while-i-sleep.html, the flagship
 * case-study article (arc W5) built by the #288 pipeline it describes. Generic
 * article membership is owned elsewhere and auto-extends (tc-articles: ARTICLES
 * bijection + metadata shape + article slots; tc1-page-chrome: chrome,
 * SITE_INDEX, static description, favicon). This TC owns only what the #456
 * spec declares for THIS page and no group TC asserts.
 *
 * CONTRACT (all from the written #456 spec; implementation never read)
 *   P1. ARTICLES wiring + declared tag: window.ARTICLES contains a row whose
 *       href is "writing/building-while-i-sleep.html", and that row's tag is
 *       exactly "CASE STUDY". Tag VALUE is asserted — an explicit spec
 *       declaration ("this is a NEW tag value... Do not silently substitute an
 *       existing tag"), i.e. the human declared this element contract-worthy
 *       (#403 exception path). [Confidence: High · Retrieved from #456 spec]
 *   P2. Page file exists at writing/building-while-i-sleep.html.
 *   P3. Hero GIF wiring: the page embeds writing/overnight-318.gif via an <img>
 *       whose alt is non-empty, AND the asset file exists in the repo. Alt
 *       PRESENCE only; the alt copy itself stays editorial (#403).
 *   P4. Link map (8 targets, from the spec's link table): the page carries
 *       anchors resolving to — writing.html · graph/immune.html ·
 *       github.com/JeremyMontz/Meta1/pull/416 ·
 *       writing/evals-test-cases-theater.html ·
 *       writing/designing-for-restraint.html · issues 288, 318, 456.
 *       Matched by target suffix/substring, not literal href strings — the spec
 *       gives targets, not href forms, so relative/absolute/base-prefixed forms
 *       all satisfy. [Confidence: Medium · Inferred — matching idiom chosen to
 *       be form-agnostic; that hrefs RESOLVE is owned by Tier-0 check-links]
 *   P5. No em-dash invariant: the page source contains no U+2014 anywhere
 *       (spec authoring constraint: "introduce no em-dashes anywhere... keep it
 *       that way"). [Confidence: High · Retrieved from #456 spec]
 *
 * OUT OF SCOPE: locked-copy verbatim match (AC3 — human review at the Merge
 *   gate); all copy values incl. title/subtitle/date/dek (editorial, #403);
 *   recruiter-widget row (no test-enforced data source in the bench; in scope
 *   for the BUILD per spec, not a standing contract here); CASE STUDY
 *   rendering/filter behavior on writing.html (runtime, Tier 4).
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Run via tests/run.mjs.
 *
 * @highlight: Case-study flagship page: CASE STUDY tag, hero GIF, 8-link map, no-em-dash invariant
 * @covers: writing/building-while-i-sleep.html
 * @ignores: locked copy verbatim / all copy values — editorial
 * @ignores: alt-text exact wording — editorial
 * @ignores: recruiter-widget row — no bench-enforced data source; build-scope per #456
 * @ignores: CASE STUDY tag rendering & filters on writing.html — runtime / Tier 4
 * @ignores: chrome, SITE_INDEX, favicon, static description — owned: #298 (tc1)
 * @ignores: ARTICLES metadata shape & bijection — owned: #332 (tc-articles)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');

// data.js is pure window.* assignment → run under a shim (house pattern).
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-building-while-i-sleep');

const PAGE = 'writing/building-while-i-sleep.html';
const GIF = 'writing/overnight-318.gif';

// P1 — ARTICLES row + declared tag value
const data = loadWindow('data.js');
const row = (data.ARTICLES || []).find((a) => a.href === PAGE);
r.check(!!row, `ARTICLES has no row with href ${PAGE}`);
if (row) r.check(row.tag === 'CASE STUDY', `ARTICLES row tag is "${row.tag}", spec declares "CASE STUDY" (#456: do not silently substitute)`);

// P2 — page exists
r.check(existsSync(join(ROOT, PAGE)), `missing page file: ${PAGE}`);

if (existsSync(join(ROOT, PAGE))) {
  const html = rd(PAGE);

  // P3 — hero GIF wiring: <img> referencing the gif, with non-empty alt; asset exists
  r.check(existsSync(join(ROOT, GIF)), `missing GIF asset: ${GIF}`);
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const gifImg = imgs.find((t) => /overnight-318\.gif/.test(t));
  r.check(!!gifImg, `${PAGE}: no <img> embedding overnight-318.gif`);
  if (gifImg) r.check(/alt="[^"]+"/.test(gifImg), `${PAGE}: overnight-318.gif <img> has missing/empty alt`);

  // P4 — link map: anchor hrefs covering the 8 spec'd targets (form-agnostic)
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map((m) => m[1]);
  const strip = (h) => h.split('#')[0].split('?')[0];
  const targets = [
    ['writing.html (field notes)', (h) => /(^|\/)writing\.html$/.test(strip(h))],
    ['graph/immune.html', (h) => /graph\/immune\.html$/.test(strip(h))],
    ['PR #416', (h) => h.includes('github.com/JeremyMontz/Meta1/pull/416')],
    ['writing/evals-test-cases-theater.html', (h) => /evals-test-cases-theater\.html$/.test(strip(h))],
    ['writing/designing-for-restraint.html', (h) => /designing-for-restraint\.html$/.test(strip(h))],
    ['issue #288', (h) => /JeremyMontz\/Meta1\/issues\/288$/.test(strip(h))],
    ['issue #318', (h) => /JeremyMontz\/Meta1\/issues\/318$/.test(strip(h))],
    ['issue #456 (self-referential footnote)', (h) => /JeremyMontz\/Meta1\/issues\/456$/.test(strip(h))],
  ];
  for (const [label, test] of targets) {
    r.check(hrefs.some(test), `${PAGE}: link-map target not found: ${label}`);
  }

  // P5 — no em-dash anywhere in the page source
  const emIdx = html.indexOf('—');
  r.check(emIdx === -1, `${PAGE}: em-dash (U+2014) found at offset ${emIdx} — spec forbids em-dashes anywhere`);
}

r.done(`building-while-i-sleep: ARTICLES row ${row ? 'found' : 'MISSING'} · ${existsSync(join(ROOT, PAGE)) ? 'page present' : 'page MISSING'}`);
