/* ============================================================
 * FIRST MONTH — Case study graph engine
 *
 * Renders a single SVG canvas driven by a state machine of
 * chapters. Each chapter declares which nodes exist, where they
 * sit, and what effects are playing. transitionTo() interpolates
 * between two states over ~700ms.
 *
 * Design notes:
 *  - One superset of nodes + edges declared up front. Each
 *    chapter "state" is a partial override (opacity, position,
 *    radius, color, dashed, pulsing). Nodes not in the chapter
 *    fade to opacity 0 so they don't vanish abruptly.
 *  - Jeremy is always present; his position and role shift.
 *  - Effects are flags on the state: theater wash, rules stamp,
 *    nervous-system pulses, ghost-roadmap shimmer.
 *  - Dragging is allowed but nodes spring back to their chapter
 *    anchor via weak forces.
 * ============================================================ */

const svg     = document.getElementById('graphSvg');
const substrateG = document.getElementById('substrateLayer');
const edgesG  = document.getElementById('edges');
const nodesG  = document.getElementById('nodes');
const fxG     = document.getElementById('fxLayer');
const fxText  = document.getElementById('fxText');
const wrap    = document.getElementById('graphWrap');

let W = wrap.clientWidth;
let H = wrap.clientHeight;
function resize() {
  W = wrap.clientWidth; H = wrap.clientHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  // re-anchor current chapter on resize
  if (currentChapter != null) applyChapterAnchors(CHAPTERS[currentChapter]);
}
window.addEventListener('resize', resize);

/* ────────── NODE CATALOG ──────────
 * Every node that ever appears in any chapter. Chapters pick
 * subsets and override position/size/opacity/color.
 */
const NODE_DEFS = {
  jeremy : { label: 'Jeremy',    kind: 'human',   r: 24, italic: true },
  meta1  : { label: 'Meta1',     kind: 'agent',   r: 20 },
  bond   : { label: 'Bond',      kind: 'agent',   r: 18 },
  evolve : { label: 'Evolve',    kind: 'agent',   r: 18 },
  assess : { label: 'Assessor',  kind: 'agent',   r: 18 },
  house  : { label: 'House',     kind: 'agent',   r: 17 },
  freedom: { label: 'Freedom',   kind: 'agent',   r: 17 },
  phil   : { label: 'Phil',      kind: 'party',   r: 22, italic: true },

  // v1 extras (dissolve by v3)
  canon  : { label: 'Canon',       kind: 'agent', r: 14 },
  hshake : { label: 'Handshake',   kind: 'agent', r: 14 },
  broadcast:{label: 'Broadcast',   kind: 'agent', r: 14 },

  // Ghost roadmap nodes (appear in theater, fade in v3)
  crystalline: { label: 'Crystalline', kind: 'ghost', r: 13 },
  federation : { label: 'Federation',  kind: 'ghost', r: 13 },
  dials      : { label: 'Dials',       kind: 'ghost', r: 11 },

  // Center monster — the whole system as one node
  claudemonzter: { label: 'Claudemonzter', kind: 'monster', r: 30 },

  // External platform — Claude.ai, the substrate where the conversation begins
  claudeai: { label: 'Claude.ai', kind: 'platform', r: 24 },

  // Chapter 1 placeholders (four projects, unlabeled)
  proj1: { label: 'project', kind: 'ghost', r: 12, italic: true },
  proj2: { label: 'project', kind: 'ghost', r: 12, italic: true },
  proj3: { label: 'project', kind: 'ghost', r: 12, italic: true },
  proj4: { label: 'project', kind: 'ghost', r: 12, italic: true },

  // Future-persona ghosts around phil
  g1: { label: 'persona', kind: 'ghost', r: 8, italic: true },
  g2: { label: 'persona', kind: 'ghost', r: 8, italic: true },
  g3: { label: 'persona', kind: 'ghost', r: 8, italic: true },

  // Inbox / voice / email (v3 real dataflow)
  voice : { label: 'voice prompt', kind: 'data', r: 11 },
  inbox : { label: 'inbox',        kind: 'data', r: 13 },
  email : { label: 'email',        kind: 'data', r: 11 },

  // Ch 9 intake surfaces + wiki on disk
  web   : { label: 'web',    kind: 'data', r: 11 },
  gmail : { label: 'gmail',  kind: 'data', r: 11 },
  github: { label: 'github', kind: 'data', r: 11 },
  wiki  : { label: 'wiki',   kind: 'data', r: 13 },
};

/* ────────── POSITION HELPERS ──────────
 * Positions are normalized [0..1] of canvas, so they scale with
 * the viewport. Angle in radians from center (0=3 o'clock,
 * -π/2=12 o'clock, π/2=6 o'clock).
 */
const polar = (angle, dist) => ({
  // x centered at 0.45 (not 0.5) — leaves more room on the right for node labels
  x: 0.45 + Math.cos(angle) * dist,
  y: 0.5  + Math.sin(angle) * dist,
});

const CLOCK = {
  twelve : -Math.PI/2,
  ten    : -Math.PI*2/3,
  nine   : Math.PI,
  eight  : Math.PI * 0.84,
  seven  : Math.PI * 0.72,
  six    : Math.PI/2,
  three  : 0,
};

/* ────────── CHAPTERS ──────────
 * Each chapter:
 *   nodes: { id: { x, y, r?, opacity?, color?, kind?, label? } }
 *   edges: [ { a, b, style?: 'solid'|'dashed'|'dotted'|'broken'|'adversary', opacity?, animated? } ]
 *   fx:    { theater?, rulesStamp?, nervousSystem?, cathedralSilhouette?, ghostShimmer? }
 *   label: chapter number text
 */
const CHAPTERS = [
/* ────────── 0 — HERO / STANDARD (title view) ──────────
 * Template all chapter graphs subtract from.
 *   Center : Claudemonzter (purple, r=30)
 *   Left   : Bond(11) Freedom(10) House(8) Assessor(7)
 *   Bottom-right: Evolve(5)
 *   Top-right: Meta1(1) Jeremy(2 — green)
 *   Right  : Phil(3) + persona ghosts orbiting outward
 * Clock angles (radians, screen y-down):
 *   12=-π/2 · 1=-π/3 · 2=-π/6 · 3=0 · 5=π/3
 *    6=π/2  · 7=2π/3 · 8=5π/6 · 9=π · 10=-5π/6 · 11=-2π/3
 */
{
  label: '',
  hero: true,
  nodes: {
    claudemonzter: { ...polar(0, 0),               opacity: 1, r: 30 },

    // Agents clustered left + top + bottom; Phil on the right
    bond   : { ...polar(-Math.PI*2/3, 0.32), opacity: 1 },  // 11 o'clock
    freedom: { ...polar(-Math.PI*5/6, 0.32), opacity: 1 },  // 10 o'clock  (H/F swappable)
    house  : { ...polar( Math.PI*5/6, 0.32), opacity: 1 },  //  8 o'clock  (H/F swappable)
    assess : { ...polar( Math.PI*2/3, 0.32), opacity: 1 },  //  7 o'clock
    evolve : { ...polar( Math.PI/3,   0.32), opacity: 1 },  //  5 o'clock
    meta1  : { ...polar(-Math.PI/3,   0.32), opacity: 1 },  //  1 o'clock

    // Jeremy — green, matched to Phil's size, at 2 o'clock
    jeremy : { ...polar(-Math.PI/6,   0.32), opacity: 1, r: 24 },

    // Phil + persona ghosts on the right at 3 o'clock (v2 standard placement)
    phil   : { ...polar( 0,           0.32), opacity: 1, r: 24 },
    g1     : { ...polar(-0.5,         0.46), opacity: 0.55 },
    g2     : { ...polar( 0,           0.48), opacity: 0.55 },
    g3     : { ...polar( 0.5,         0.46), opacity: 0.55 },
  },
  edges: [
    // Center spokes — Jeremy and Phil edges tinted to match their nodes
    { a: 'claudemonzter', b: 'jeremy',  color: 'var(--bolt)' },
    { a: 'claudemonzter', b: 'phil',    color: 'var(--ether)' },
    { a: 'claudemonzter', b: 'meta1'   },
    { a: 'claudemonzter', b: 'bond'    },
    { a: 'claudemonzter', b: 'house'   },
    { a: 'claudemonzter', b: 'evolve'  },
    { a: 'claudemonzter', b: 'assess'  },
    { a: 'claudemonzter', b: 'freedom' },
    // Internal tensions
    { a: 'meta1',  b: 'bond',   style: 'adversary' },
    { a: 'evolve', b: 'assess', style: 'adversary' },
    // Phil's persona orbit
    { a: 'phil',   b: 'g1',     style: 'dotted', opacity: 0.4 },
    { a: 'phil',   b: 'g2',     style: 'dotted', opacity: 0.4 },
    { a: 'phil',   b: 'g3',     style: 'dotted', opacity: 0.4 },
  ],
  fx: { ghostShimmer: true },
},

/* ────────── 1 — COLD OPEN (first conversation, two nodes) ────────── */
{
  label: '01',
  nodes: {
    jeremy   : { ...polar(0, 0),                opacity: 1, r: 24 },
    // Claude.ai at 10:30 (between 10 and 11) — angle = -3π/4
    claudeai : { ...polar(-3*Math.PI/4, 0.32),  opacity: 1, r: 24 },
  },
  edges: [
    { a: 'jeremy', b: 'claudeai', animated: true },
  ],
  fx: {},
},

/* ────────── 2 — FIRST CONVERSATION (four projects surface, Claude.ai persists) ────────── */
{
  label: '02',
  nodes: {
    jeremy   : { ...polar(0, 0),                opacity: 1, r: 22 },
    claudeai : { ...polar(-3*Math.PI/4, 0.32),  opacity: 1, r: 24 },  // stays at 10:30
    // Four implied projects around Jeremy — ghost-style (faint, smaller)
    proj1: { ...polar(-Math.PI/2, 0.22), opacity: 0.7 },  // 12
    proj2: { ...polar(0,           0.22), opacity: 0.7 },  // 3
    proj3: { ...polar(Math.PI/2,   0.22), opacity: 0.7 },  // 6
    proj4: { ...polar(Math.PI,     0.22), opacity: 0.7 },  // 9
  },
  edges: [
    // Claude.ai stays connected, animated
    { a: 'jeremy', b: 'claudeai', animated: true },
    // Jeremy-to-projects: now animated (formerly dotted in v2)
    { a: 'jeremy', b: 'proj1', animated: true },
    { a: 'jeremy', b: 'proj2', animated: true },
    { a: 'jeremy', b: 'proj3', animated: true },
    { a: 'jeremy', b: 'proj4', animated: true },
  ],
  fx: {},
},

/* ────────── 3 — v1 BUILD on CLAUDE.AI (template minus bond/assess/meta1-ring) ────────── */
{
  label: '03',
  nodes: {
    // Center renamed "Meta1" (same pink monster node, repurposed as the hub)
    claudemonzter: { ...polar(0, 0),               opacity: 1, r: 30, label: 'Meta1' },

    // Jeremy closer to center (matches Ch 04) — gives the substrate line room to breathe
    jeremy : { ...polar(-Math.PI/2,              0.18), opacity: 1, r: 24 },  // 12, closer
    // Ring of 4 agents at outer distance — clockwise from where Jeremy used to be
    phil   : { ...polar(-Math.PI/2 + 2*Math.PI/5, 0.32), opacity: 1, r: 24 },  // ~2:24
    evolve : { ...polar(-Math.PI/2 + 4*Math.PI/5, 0.32), opacity: 1 },         // ~4:48
    house  : { ...polar(-Math.PI/2 + 6*Math.PI/5, 0.32), opacity: 1 },         // ~7:12
    freedom: { ...polar(-Math.PI/2 + 8*Math.PI/5, 0.32), opacity: 1 },         // ~9:36
  },
  edges: [
    // All hub spokes — red, dotted, animated (Ch 3 has no green yet)
    { a: 'claudemonzter', b: 'jeremy',  color: '#ff4757', style: 'dotted', animated: true },
    { a: 'claudemonzter', b: 'phil',    color: '#ff4757', style: 'dotted', animated: true },
    { a: 'claudemonzter', b: 'evolve',  color: '#ff4757', style: 'dotted', animated: true },
    { a: 'claudemonzter', b: 'house',   color: '#ff4757', style: 'dotted', animated: true },
    { a: 'claudemonzter', b: 'freedom', color: '#ff4757', style: 'dotted', animated: true },
    // Jeremy reaching up to the substrate — also red, dotted, animated
    { a: 'jeremy', b: '__substrate__', color: '#ff4757', style: 'dotted', animated: true },
  ],
  substrate: { era: 'cloud', density: 0.15, label: 'claude.ai' },
  fx: {},
},

/* ────────── 4 — v2 BUILD on GOOGLE DRIVE (adds Assessor; all spokes dotted+animated) ────────── */
{
  label: '04',
  nodes: {
    // Center renamed "Meta1" — still the hub
    claudemonzter: { ...polar(0, 0), opacity: 1, r: 30, label: 'Meta1' },

    // Jeremy closer to center now — leaves room for the substrate line to breathe
    jeremy : { ...polar(-Math.PI/2,   0.18), opacity: 1, r: 24 },  // 12, closer in

    // Ring agents — most at near-hero positions; Evolve & Assessor pulled close
    phil   : { ...polar( 0,           0.32), opacity: 1, r: 24 },  //  3 (hero pos)
    evolve : { ...polar( Math.PI/3,   0.32), opacity: 1 },         //  5 (hero pos)
    assess : { ...polar( Math.PI/2,   0.32), opacity: 1 },         //  6 (close to evolve; hero is 7)
    house  : { ...polar( Math.PI*5/6, 0.32), opacity: 1 },         //  8 (hero pos)
    freedom: { ...polar(-Math.PI*5/6, 0.32), opacity: 1 },         // 10 (hero pos)
  },
  edges: [
    // Hub spokes — all green dotted+animated. Single exception: assessor↔evolve.
    { a: 'claudemonzter', b: 'jeremy',  color: 'var(--bolt)', style: 'dotted', animated: true },
    { a: 'claudemonzter', b: 'phil',    color: 'var(--bolt)', style: 'dotted', animated: true },
    { a: 'claudemonzter', b: 'evolve',  color: 'var(--bolt)', style: 'dotted', animated: true },
    { a: 'claudemonzter', b: 'assess',  color: 'var(--bolt)', style: 'dotted', animated: true },
    { a: 'claudemonzter', b: 'house',   color: 'var(--bolt)', style: 'dotted', animated: true },
    { a: 'claudemonzter', b: 'freedom', color: 'var(--bolt)', style: 'dotted', animated: true },
    // Adversarial peer: Assessor ↔ Evolve — red, called out against the green field
    { a: 'assess', b: 'evolve', color: '#ff4757', style: 'dotted', animated: true, width: 3.6 },
    // Jeremy reaching to the substrate — green now (was red in Ch 03)
    { a: 'jeremy', b: '__substrate__', color: 'var(--bolt)', style: 'dotted', animated: true },
  ],
  substrate: { era: 'cloud', density: 0.45, label: 'google drive', color: 'var(--ether)' },
  fx: {},
},

/* ────────── 5 — THE BOTTLENECK (system on overload) ──────────
 * Same shape as Ch 04. Full mesh: every node connects to every other.
 * All edges red, broken, animated. Substrate dense and red. Visual chaos.
 */
{
  label: '05',
  nodes: {
    claudemonzter: { ...polar(0, 0), opacity: 1, r: 30, label: 'Meta1' },
    jeremy : { ...polar(-Math.PI/2,   0.18), opacity: 1, r: 24 },  // 12, close
    phil   : { ...polar( 0,           0.32), opacity: 1, r: 24 },  // 3
    evolve : { ...polar( Math.PI/3,   0.32), opacity: 1 },         // 5
    assess : { ...polar( Math.PI/2,   0.32), opacity: 1 },         // 6
    house  : { ...polar( Math.PI*5/6, 0.32), opacity: 1 },         // 8
    freedom: { ...polar(-Math.PI*5/6, 0.32), opacity: 1 },         // 10
  },
  // Full mesh — every node to every other. All red broken animated.
  edges: (() => {
    const ids = ['claudemonzter','jeremy','phil','evolve','assess','house','freedom'];
    const out = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        out.push({ a: ids[i], b: ids[j], color: '#ff4757', style: 'broken', animated: true });
      }
    }
    // Jeremy reaching to the (now red) substrate — same style
    out.push({ a: 'jeremy', b: '__substrate__', color: '#ff4757', style: 'broken', animated: true });
    return out;
  })(),
  substrate: { era: 'cloud', density: 0.65, label: 'google drive', color: '#ff4757' },
  fx: {},
},

/* ────────── 6 — RULES WITHOUT A RULES ENGINE (agentic theater) ──────────
 * Same shape as Ch 5 + Bond. All agents go RED (the theater is the agents themselves).
 * Jeremy stays green. Hub spokes are subtle (dotted, not animated). Two callouts
 * keep the broken+animated treatment: evolve↔assess and bond↔meta1.
 */
{
  label: '06',
  nodes: {
    // Center: Meta1 — now red (it's part of the theater)
    claudemonzter: { ...polar(0, 0), opacity: 1, r: 30, label: 'Meta1', color: '#ff4757' },

    // Jeremy — only non-red node, stays green; close to center
    jeremy : { ...polar(-Math.PI/4,   0.32), opacity: 1, r: 24 },  // 1:30 (mirror of Bond)

    // Ring agents (all red, agentic theater) — Bond joins at 11 (hero position)
    bond   : { ...polar(-Math.PI*2/3, 0.32), opacity: 1, color: '#ff4757' },  // 11
    freedom: { ...polar(-Math.PI*5/6, 0.32), opacity: 1, color: '#ff4757' },  // 10
    house  : { ...polar( Math.PI*5/6, 0.32), opacity: 1, color: '#ff4757' },  //  8
    assess : { ...polar( Math.PI/2,   0.32), opacity: 1, color: '#ff4757' },  //  6
    evolve : { ...polar( Math.PI/3,   0.32), opacity: 1, color: '#ff4757' },  //  5
    phil   : { ...polar( 0,           0.32), opacity: 1, r: 24, color: '#ff4757' },  // 3
  },
  edges: [
    // Hub spokes — uniformly red dotted, not animated. The red IS the theater.
    { a: 'claudemonzter', b: 'jeremy',  color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'phil',    color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'evolve',  color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'assess',  color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'house',   color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'freedom', color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'bond',    color: '#ff4757', style: 'dotted' },
    // Peer connections — same subtle treatment
    { a: 'assess', b: 'evolve', color: '#ff4757', style: 'dotted' },
    { a: 'jeremy', b: 'bond',   color: '#ff4757', style: 'dotted' },
  ],
  substrate: { era: 'cloud', density: 0.65, label: 'google drive', color: '#ff4757' },
  fx: {},
},

/* ────────── 7 — THE NADIR (Jeremy joins the theater) ──────────
 * Same shape as Ch 06. All nodes red INCLUDING Jeremy (extremity).
 * Triangle callout: meta1 ↔ bond ↔ jeremy ↔ meta1 — broken, animated, thick.
 * Assessor ↔ evolve simplified back to subtle dotted (wrong emphasis here).
 */
{
  label: '07',
  nodes: {
    claudemonzter: { ...polar(0, 0), opacity: 1, r: 30, label: 'Meta1', color: '#ff4757', pulse: true },
    // Jeremy — now red too. The human has been pulled in.
    jeremy : { ...polar(-Math.PI/4,   0.32), opacity: 1, r: 24, color: '#ff4757', pulse: true },  // 1:30
    bond   : { ...polar(-Math.PI*2/3, 0.32), opacity: 1, color: '#ff4757', pulse: true },  // 11
    freedom: { ...polar(-Math.PI*5/6, 0.32), opacity: 1, color: '#ff4757' },  // 10
    house  : { ...polar( Math.PI*5/6, 0.32), opacity: 1, color: '#ff4757' },  //  8
    assess : { ...polar( Math.PI/2,   0.32), opacity: 1, color: '#ff4757' },  //  6
    evolve : { ...polar( Math.PI/3,   0.32), opacity: 1, color: '#ff4757' },  //  5
    phil   : { ...polar( 0,           0.32), opacity: 1, r: 24, color: '#ff4757' },  // 3
  },
  edges: [
    // Subtle hub spokes — red dotted, not animated
    { a: 'claudemonzter', b: 'phil',    color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'evolve',  color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'assess',  color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'house',   color: '#ff4757', style: 'dotted' },
    { a: 'claudemonzter', b: 'freedom', color: '#ff4757', style: 'dotted' },
    // Assess ↔ Evolve — subtle now (wrong emphasis here)
    { a: 'assess', b: 'evolve', color: '#ff4757', style: 'dotted' },
    // The broken triangle: meta1 ↔ bond ↔ jeremy ↔ meta1
    { a: 'claudemonzter', b: 'bond',   color: '#ff4757', style: 'broken', animated: true, width: 3.6 },
    { a: 'claudemonzter', b: 'jeremy', color: '#ff4757', style: 'broken', animated: true, width: 3.6 },
    { a: 'bond',          b: 'jeremy', color: '#ff4757', style: 'broken', animated: true, width: 3.6 },
  ],
  substrate: { era: 'cloud', density: 0.65, label: 'google drive', color: '#ff4757' },
  fx: {},
},

/* ────────── 8 — NEW COMPUTER (vibe shift: local substrate, Claudemonzter writes to disk) ──────────
 * Standard hero template + standard colors. No persona ghosts yet.
 * Bond is ghost/gray here (QA hasn't been built into the new system yet).
 * NEW: claudemonzter ↔ substrate — thick green animated. Everything saves to disk now.
 */
{
  label: '08',
  nodes: {
    claudemonzter: { ...polar(0, 0), opacity: 1, r: 30, color: 'var(--bolt)', pulse: true },
    // Bond — ghosted (gray, slightly faded)
    bond   : { ...polar(-Math.PI*2/3, 0.32), opacity: 0.55, color: '#8a8f9c' },  // 11
    freedom: { ...polar(-Math.PI*5/6, 0.32), opacity: 1 },  // 10
    house  : { ...polar( Math.PI*5/6, 0.32), opacity: 1 },  //  8
    assess : { ...polar( Math.PI*2/3, 0.32), opacity: 1 },  //  7
    evolve : { ...polar( Math.PI/3,   0.32), opacity: 1 },  //  5
    meta1  : { ...polar(-Math.PI/3,   0.32), opacity: 1 },  //  1
    jeremy : { ...polar(-Math.PI/6,   0.32), opacity: 1, r: 24 },  // 2
    phil   : { ...polar( 0,           0.32), opacity: 1, r: 24 },  // 3
  },
  edges: [
    // Center spokes — all green like Jeremy's, except Bond (ghosted)
    { a: 'claudemonzter', b: 'jeremy',  color: 'var(--bolt)' },
    { a: 'claudemonzter', b: 'phil',    color: 'var(--bolt)' },
    { a: 'claudemonzter', b: 'meta1',   color: 'var(--bolt)' },
    { a: 'claudemonzter', b: 'house',   color: 'var(--bolt)' },
    { a: 'claudemonzter', b: 'evolve',  color: 'var(--bolt)' },
    { a: 'claudemonzter', b: 'assess',  color: 'var(--bolt)' },
    { a: 'claudemonzter', b: 'freedom', color: 'var(--bolt)' },
    // Bond's two edges — same gray color. Bond-spoke solid; meta1↔bond dotted.
    { a: 'claudemonzter', b: 'bond',  color: '#8a8f9c' },
    { a: 'meta1',         b: 'bond',  color: '#8a8f9c', style: 'dotted' },
    // Assessor↔Evolve — same ghost treatment as bond↔meta1
    { a: 'assess', b: 'evolve', color: '#8a8f9c', style: 'dotted' },
    // NEW: Claudemonzter writes directly to disk — thick green animated line down to substrate
    { a: 'claudemonzter', b: '__substrate__', color: 'var(--bolt)', animated: true, width: 5 },
  ],
  substrate: { era: 'local', density: 0.12, label: 'always-on PC', color: 'var(--bolt)' },
  fx: {},
},

/* ────────── 9 — MAKING PROGRESS (template + intake surfaces + wiki) ──────────
 * Standard hero template (no persona ghosts yet). Inbox at 12 with four intake
 * surfaces above (web, gmail, voice, github). Wiki node lives inside the bottom
 * substrate band. Two substrates: top (legacy cloud — both labels) + bottom (local).
 */
{
  label: '09',
  nodes: {
    claudemonzter: { ...polar(0, 0), opacity: 1, r: 30 },
    // Ring agents (template positions; bond is back to default color)
    bond   : { ...polar(-Math.PI*2/3, 0.32), opacity: 1 },  // 11
    freedom: { ...polar(-Math.PI*5/6, 0.32), opacity: 1 },  // 10
    house  : { ...polar( Math.PI*5/6, 0.32), opacity: 1 },  //  8
    assess : { ...polar( Math.PI*2/3, 0.32), opacity: 1 },  //  7
    evolve : { ...polar( Math.PI/3,   0.32), opacity: 1 },  //  5
    meta1  : { ...polar(-Math.PI/3,   0.32), opacity: 1 },  //  1
    jeremy : { ...polar(-Math.PI/6,   0.32), opacity: 1, r: 24 },  // 2
    phil   : { ...polar( 0,           0.32), opacity: 1, r: 24 },  // 3

    // Inbox at 12 o'clock (new node on the ring)
    inbox  : { ...polar(-Math.PI/2,   0.32), opacity: 1, r: 14 },

    // Intake surfaces — fan above inbox at outer distance 0.50
    web    : { ...polar(-Math.PI/2 - 0.40, 0.50), opacity: 1 },
    gmail  : { ...polar(-Math.PI/2 - 0.13, 0.50), opacity: 1 },
    voice  : { ...polar(-Math.PI/2 + 0.13, 0.50), opacity: 1, label: 'voice capture' },
    github : { ...polar(-Math.PI/2 + 0.40, 0.50), opacity: 1 },

    // Wiki — INSIDE the bottom substrate band, centered below Claudemonzter
    wiki   : { x: 0.45, y: 0.93, opacity: 1, r: 13, noZoom: true },
  },
  edges: [
    // Template hub spokes
    { a: 'claudemonzter', b: 'jeremy',  color: 'var(--bolt)'  },
    { a: 'claudemonzter', b: 'phil',    color: 'var(--ether)' },
    { a: 'claudemonzter', b: 'meta1'   },
    { a: 'claudemonzter', b: 'bond'    },
    { a: 'claudemonzter', b: 'house'   },
    { a: 'claudemonzter', b: 'evolve'  },
    { a: 'claudemonzter', b: 'assess'  },
    { a: 'claudemonzter', b: 'freedom' },
    // Internal tensions back
    { a: 'meta1',  b: 'bond',   style: 'adversary' },
    { a: 'evolve', b: 'assess', style: 'adversary' },

    // New: inbox connects to claudemonzter (flow — green animated)
    { a: 'claudemonzter', b: 'inbox', animated: true, style: 'flow' },

    // Intake → inbox (animated dotted style; flow color)
    { a: 'web',    b: 'inbox', animated: true, style: 'flow' },
    { a: 'gmail',  b: 'inbox', animated: true, style: 'flow' },
    { a: 'voice',  b: 'inbox', animated: true, style: 'flow' },
    { a: 'github', b: 'inbox', animated: true, style: 'flow' },

    // Wiki ↔ claudemonzter (the disk persistence)
    { a: 'claudemonzter', b: 'wiki', animated: true, style: 'flow' },
  ],
  // Per-chapter zoom — pulls all nodes inward so the intake fan fits without clipping.
  zoom: 0.82,
  // TWO substrates: top (legacy cloud — both labels) + bottom (local). All same light green.
  substrate: [
    { era: 'cloud', density: 0.35, label: ['claude.ai', 'google drive'], color: 'var(--bolt)' },
    { era: 'local', density: 0.25, label: 'always-on PC',                color: 'var(--bolt)' },
  ],
  fx: {},
},

/* ────────── 10 — AN EXTRA DAY (destination — standard template with persona hints) ──────────
 * Identical to hero/standard. The article closes on the same image it opened with.
 * Personas around Phil at faint opacity = "hints" — direction of travel, not yet built.
 */
{
  label: '10',
  nodes: {
    claudemonzter: { ...polar(0, 0),               opacity: 1, r: 30 },
    bond   : { ...polar(-Math.PI*2/3, 0.32), opacity: 1 },  // 11
    freedom: { ...polar(-Math.PI*5/6, 0.32), opacity: 1 },  // 10
    house  : { ...polar( Math.PI*5/6, 0.32), opacity: 1 },  //  8
    assess : { ...polar( Math.PI*2/3, 0.32), opacity: 1 },  //  7
    evolve : { ...polar( Math.PI/3,   0.32), opacity: 1 },  //  5
    meta1  : { ...polar(-Math.PI/3,   0.32), opacity: 1 },  //  1
    jeremy : { ...polar(-Math.PI/6,   0.32), opacity: 1, r: 24 },  // 2
    phil   : { ...polar( 0,           0.32), opacity: 1, r: 24 },  // 3
    g1     : { ...polar(-0.5,         0.46), opacity: 0.55 },
    g2     : { ...polar( 0,           0.48), opacity: 0.55 },
    g3     : { ...polar( 0.5,         0.46), opacity: 0.55 },
  },
  edges: [
    { a: 'claudemonzter', b: 'jeremy',  color: 'var(--bolt)'  },
    { a: 'claudemonzter', b: 'phil',    color: 'var(--ether)' },
    { a: 'claudemonzter', b: 'meta1'   },
    { a: 'claudemonzter', b: 'bond'    },
    { a: 'claudemonzter', b: 'house'   },
    { a: 'claudemonzter', b: 'evolve'  },
    { a: 'claudemonzter', b: 'assess'  },
    { a: 'claudemonzter', b: 'freedom' },
    { a: 'meta1',  b: 'bond',   style: 'adversary' },
    { a: 'evolve', b: 'assess', style: 'adversary' },
    { a: 'phil',   b: 'g1',     style: 'dotted', opacity: 0.4 },
    { a: 'phil',   b: 'g2',     style: 'dotted', opacity: 0.4 },
    { a: 'phil',   b: 'g3',     style: 'dotted', opacity: 0.4 },
  ],
  fx: { ghostShimmer: true },
},
];

/* ────────── LIVE STATE ──────────
 * Each active node keeps its own {x,y,vx,vy,tx,ty} so we can
 * animate + drag. tx/ty = target (anchor from chapter).
 */
const live = {};  // id -> { x, y, vx, vy, tx, ty, r, opacity, color, el... }
let currentChapter = null;
const EDGE_COLOR = {
  solid     : 'var(--violet-300)',
  dashed    : 'var(--violet-300)',
  dotted    : 'var(--violet-200)',
  broken    : '#ff4757',
  adversary : '#ff6ec7',
  flow      : 'var(--bolt)',
};

/* ────────── RENDER ────────── */
function ensureLive(id) {
  if (!live[id]) {
    const def = NODE_DEFS[id];
    // birth at center, fade in
    live[id] = {
      id,
      x: W/2, y: H/2, vx: 0, vy: 0, tx: W/2, ty: H/2,
      r: def.r, opacity: 0, color: null,
      kind: def.kind, label: def.label, italic: def.italic,
      el: null,
    };
  }
  return live[id];
}

function nodeColor(n) {
  if (n.color) return n.color;
  switch (n.kind) {
    case 'human'   : return 'var(--bolt)';
    case 'party'   : return 'var(--ether)';   // Phil — teal/cyan
    case 'ghost'   : return 'var(--violet-200)';
    case 'data'    : return '#8dd9ff';
    case 'monster' : return '#ff6ec7';        // Claudemonzter — pink
    case 'platform': return '#f5c56a';        // Claude.ai — amber
    default        : return 'var(--violet-300)';
  }
}

function renderAll() {
  // Build SVG for each live node if not already
  for (const id in live) {
    const n = live[id];
    if (!n.el) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `node node-${n.kind}`);
      g.setAttribute('data-id', id);
      g.style.cursor = 'grab';

      const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      halo.setAttribute('class', 'halo');
      g.appendChild(halo);

      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('class', 'core');
      g.appendChild(core);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'node-label');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = n.label;
      g.appendChild(label);

      nodesG.appendChild(g);
      n.el = g;
      n.halo = halo;
      n.core = core;
      n.lbl = label;

      attachDrag(g, id);
    }
    // Update attrs
    const c = nodeColor(n);
    n.core.setAttribute('cx', n.x);
    n.core.setAttribute('cy', n.y);
    n.core.setAttribute('r', n.r);
    n.core.setAttribute('fill', c);
    n.core.setAttribute('fill-opacity', 0.15);
    n.core.setAttribute('stroke', c);
    n.core.setAttribute('stroke-width', 1.3);

    n.halo.setAttribute('cx', n.x);
    n.halo.setAttribute('cy', n.y);
    n.halo.setAttribute('r', n.r * 1.9);
    n.halo.setAttribute('fill', c);
    n.halo.setAttribute('fill-opacity', 0.12);
    n.halo.setAttribute('filter', 'url(#softGlow)');

    if (n.lbl.textContent !== n.label) n.lbl.textContent = n.label;
    n.el.classList.toggle('pulse-red', !!n.pulse);
    n.lbl.setAttribute('x', n.x);
    n.lbl.setAttribute('y', n.y + n.r + 18);
    n.lbl.setAttribute('fill', c);
    n.lbl.setAttribute('font-family', n.kind === 'ghost' || n.kind === 'data'
      ? "var(--font-mono)" : "var(--font-display)");
    n.lbl.setAttribute('font-size', n.r > 22 ? 15 : 12);
    n.lbl.setAttribute('font-style', n.italic ? 'italic' : 'normal');
    n.lbl.setAttribute('font-weight', n.kind === 'human' || n.kind === 'party' ? '600' : '400');

    n.el.setAttribute('opacity', n.opacity);
  }
}

function renderEdges(state) {
  edgesG.innerHTML = '';
  for (const e of (state.edges || [])) {
    // Resolve endpoints — '__substrate__' targets the substrate band
    let a = (e.a === '__substrate__') ? null : live[e.a];
    let b = (e.b === '__substrate__') ? null : live[e.b];
    if (e.a === '__substrate__' && _substrateMidY != null && b) {
      a = { x: b.x, y: _substrateMidY };
    }
    if (e.b === '__substrate__' && _substrateMidY != null && a) {
      b = { x: a.x, y: _substrateMidY };
    }
    if (!a || !b) continue;

    const style = e.style || 'solid';
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.setAttribute('stroke', e.color || EDGE_COLOR[style] || EDGE_COLOR.solid);
    line.setAttribute('stroke-width', e.width != null ? e.width : (style === 'flow' ? 1.6 : 1.2));
    line.setAttribute('stroke-opacity', e.opacity != null ? e.opacity : (style === 'dotted' ? 0.4 : 0.55));
    if (style === 'dashed' || style === 'adversary') line.setAttribute('stroke-dasharray', '5 5');
    else if (style === 'dotted') line.setAttribute('stroke-dasharray', '2 5');
    else if (style === 'broken') line.setAttribute('stroke-dasharray', '3 3 10 3');
    if (e.animated) {
      // preserve dotted/broken dasharrays; otherwise use flow pattern
      if (style !== 'dotted' && style !== 'broken') line.setAttribute('stroke-dasharray', '4 6');
      line.classList.add('edge-flow');
    }
    edgesG.appendChild(line);
    e._el = line;
  }
}

/* ────────── SUBSTRATE ──────────
 * Faint X-hatch band at top (cloud) or bottom (local) of canvas.
 * Represents the file-system substrate (Claude.ai FS, Google Drive, local C:).
 * Density controls hatch spacing: low density = wider gaps, high density = tighter weave.
 * Chapters opt in via `substrate: { era, density, label?, color? }`.
 */
const SUBSTRATE_HEIGHT_FRAC = 0.12;  // ~12% of canvas height per band

// module-level: y of each substrate mid-line (null when none active)
let _substrateMidY = null;     // back-compat — picks bottom if present, else top
let _substrateMidYTop = null;
let _substrateMidYBot = null;

function applySubstrate(state) {
  substrateG.innerHTML = '';
  _substrateMidY = null;
  _substrateMidYTop = null;
  _substrateMidYBot = null;
  const sub = state.substrate;
  if (!sub) return;
  const list = Array.isArray(sub) ? sub : [sub];
  for (const cfg of list) _renderSubstrateBand(cfg);
  // back-compat for existing __substrate__ edges: prefer the band that exists
  _substrateMidY = _substrateMidYBot != null ? _substrateMidYBot : _substrateMidYTop;
}

function _renderSubstrateBand(sub) {
  const bandH   = H * SUBSTRATE_HEIGHT_FRAC;
  const isTop   = sub.era !== 'local';
  const bandY   = isTop ? 0 : H - bandH;
  if (isTop && _substrateMidYTop == null) _substrateMidYTop = bandY + bandH / 2;
  if (!isTop && _substrateMidYBot == null) _substrateMidYBot = bandY + bandH / 2;
  const density = Math.max(0, Math.min(1, sub.density || 0));
  const spacing = 38 - 30 * density;
  const stroke  = sub.color || (isTop ? '#f5c56a' : 'var(--bolt)');
  const opacity = 0.22;

  const uid = Math.random().toString(36).slice(2, 8);
  const pid = `hatchPattern-${uid}`;
  const gid = `subFade-${uid}`;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  // X-hatch pattern: two diagonals
  const pat = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
  pat.setAttribute('id', pid);
  pat.setAttribute('x', 0); pat.setAttribute('y', 0);
  pat.setAttribute('width', spacing); pat.setAttribute('height', spacing);
  pat.setAttribute('patternUnits', 'userSpaceOnUse');
  for (const coords of [[0,0,spacing,spacing],[0,spacing,spacing,0]]) {
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('x1', coords[0]); ln.setAttribute('y1', coords[1]);
    ln.setAttribute('x2', coords[2]); ln.setAttribute('y2', coords[3]);
    ln.setAttribute('stroke', stroke);
    ln.setAttribute('stroke-width', 0.6);
    ln.setAttribute('stroke-opacity', opacity);
    pat.appendChild(ln);
  }
  defs.appendChild(pat);

  // Fade gradient — stronger on inner edge
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.setAttribute('id', gid);
  grad.setAttribute('x1', '0'); grad.setAttribute('y1', isTop ? '0' : '1');
  grad.setAttribute('x2', '0'); grad.setAttribute('y2', isTop ? '1' : '0');
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0');
  stop1.setAttribute('stop-color', 'var(--bg)'); stop1.setAttribute('stop-opacity', '0');
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '1');
  stop2.setAttribute('stop-color', 'var(--bg)'); stop2.setAttribute('stop-opacity', '0.85');
  grad.appendChild(stop1); grad.appendChild(stop2);
  defs.appendChild(grad);

  substrateG.appendChild(defs);

  // Rect filled with hatch pattern
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', 0);
  rect.setAttribute('y', bandY);
  rect.setAttribute('width', W);
  rect.setAttribute('height', bandH);
  rect.setAttribute('fill', `url(#${pid})`);
  substrateG.appendChild(rect);

  // Fade overlay
  const fade = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  fade.setAttribute('x', 0);
  fade.setAttribute('y', bandY);
  fade.setAttribute('width', W);
  fade.setAttribute('height', bandH);
  fade.setAttribute('fill', `url(#${gid})`);
  substrateG.appendChild(fade);

  // Corner label(s) — accept string OR array (array places left+right)
  if (sub.label) {
    const labels = Array.isArray(sub.label) ? sub.label : [sub.label];
    labels.forEach((lbl, i) => {
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      // single: right corner; multiple: alternate left/right then offset
      const leftSide = labels.length > 1 && i % 2 === 0;
      txt.setAttribute('x', leftSide ? 12 : W - 12);
      txt.setAttribute('y', isTop ? 18 : H - 10);
      txt.setAttribute('text-anchor', leftSide ? 'start' : 'end');
      txt.setAttribute('fill', stroke);
      txt.setAttribute('fill-opacity', 0.5);
      txt.setAttribute('font-family', 'var(--font-mono)');
      txt.setAttribute('font-size', 10);
      txt.setAttribute('letter-spacing', '0.15em');
      txt.textContent = String(lbl).toUpperCase();
      substrateG.appendChild(txt);
    });
  }
}

/* ────────── CHAPTER TRANSITION ────────── */
function applyChapterAnchors(ch) {
  const active = ch.nodes || {};
  // update/add
  for (const id in active) {
    const nDef = NODE_DEFS[id];
    if (!nDef) continue;
    const n = ensureLive(id);
    const spec = active[id];
    // position is normalized [0..1]; convert to px
    let px = spec.x * W;
    let py = spec.y * H;
    // Per-chapter zoom: scales positions toward center, leaves radii/labels intact.
    // Nodes can opt out via { noZoom: true } — used for substrate-pinned nodes.
    if (ch.zoom != null && ch.zoom !== 1 && !spec.noZoom) {
      const cx = 0.45 * W;
      const cy = 0.5  * H;
      px = cx + (px - cx) * ch.zoom;
      py = cy + (py - cy) * ch.zoom;
    }
    n.tx = px; n.ty = py;
    if (n.opacity === 0) { n.x = W/2 + (px - W/2) * 0.2; n.y = H/2 + (py - H/2) * 0.2; }
    n.targetOpacity = spec.opacity != null ? spec.opacity : 1;
    n.targetR = spec.r != null ? spec.r : nDef.r;
    n.targetColor = spec.color || null;
    n.color = spec.color || null;  // apply immediately (color isn't lerped)
    if (spec.kind) n.kind = spec.kind;
    n.pulse = !!spec.pulse;  // per-chapter pulse flag (toggles .pulse-red class in render)
    // label override (resets to NODE_DEFS label if not overridden)
    n.label = spec.label || nDef.label;
  }
  // nodes not in chapter fade out
  for (const id in live) {
    if (!(id in active)) {
      live[id].targetOpacity = 0;
    }
  }
}

function transitionTo(idx) {
  const ch = CHAPTERS[idx];
  if (!ch) return;
  currentChapter = idx;
  applyChapterAnchors(ch);
  applySubstrate(ch);
  renderEdges(ch);
  applyFx(ch.fx || {});
  updateChapterLabel(ch.label);
  try { localStorage.setItem('fm_chapter', idx); } catch(e) {}
}

/* ────────── ANIMATION LOOP ──────────
 * Spring toward target position + opacity + radius + color.
 */
function lerp(a, b, t) { return a + (b - a) * t; }

function tick() {
  const LERP_POS = 0.14;
  const LERP_OPACITY = 0.08;
  const LERP_R = 0.15;

  for (const id in live) {
    const n = live[id];
    // spring to anchor
    if (!n.dragging) {
      n.x = lerp(n.x, n.tx, LERP_POS);
      n.y = lerp(n.y, n.ty, LERP_POS);
    } else {
      // during drag: user controls position
    }
    if (n.targetOpacity != null) n.opacity = lerp(n.opacity, n.targetOpacity, LERP_OPACITY);
    if (n.targetR != null)       n.r       = lerp(n.r, n.targetR, LERP_R);
  }
  renderAll();

  // update edges live (substrate endpoint follows its anchored node)
  const ch = CHAPTERS[currentChapter];
  if (ch) {
    for (const e of ch.edges || []) {
      if (!e._el) continue;
      let a = (e.a === '__substrate__') ? null : live[e.a];
      let b = (e.b === '__substrate__') ? null : live[e.b];
      if (e.a === '__substrate__' && _substrateMidY != null && b) a = { x: b.x, y: _substrateMidY, opacity: 1 };
      if (e.b === '__substrate__' && _substrateMidY != null && a) b = { x: a.x, y: _substrateMidY, opacity: 1 };
      if (!a || !b) continue;
      e._el.setAttribute('x1', a.x); e._el.setAttribute('y1', a.y);
      e._el.setAttribute('x2', b.x); e._el.setAttribute('y2', b.y);
      const minOp = Math.min(a.opacity != null ? a.opacity : 1, b.opacity != null ? b.opacity : 1);
      const baseOp = e.opacity != null ? e.opacity : (e.style === 'dotted' ? 0.4 : 0.55);
      e._el.setAttribute('stroke-opacity', baseOp * minOp);
    }
  }

  requestAnimationFrame(tick);
}

/* ────────── DRAG ────────── */
function attachDrag(g, id) {
  let start = null;
  g.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    const pt = toSvgPt(ev);
    const n = live[id];
    n.dragging = true;
    start = { mx: pt.x - n.x, my: pt.y - n.y };
    g.setPointerCapture(ev.pointerId);
    g.style.cursor = 'grabbing';
  });
  g.addEventListener('pointermove', (ev) => {
    const n = live[id];
    if (!n.dragging) return;
    const pt = toSvgPt(ev);
    n.x = pt.x - start.mx;
    n.y = pt.y - start.my;
  });
  g.addEventListener('pointerup', (ev) => {
    const n = live[id];
    n.dragging = false;
    g.releasePointerCapture(ev.pointerId);
    g.style.cursor = 'grab';
  });
}
function toSvgPt(ev) {
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  const ctm = svg.getScreenCTM().inverse();
  return pt.matrixTransform(ctm);
}

/* ────────── FX ────────── */
function applyFx(fx) {
  fxG.innerHTML = '';
  fxText.textContent = '';
  fxText.style.opacity = 0;
  document.body.classList.toggle('theater', !!fx.theater);
  document.body.classList.toggle('cathedral', !!fx.cathedralSilhouette);
  document.body.classList.toggle('cleared', !!fx.clearedRoom);

  if (fx.theater) {
    fxText.textContent = 'theater';
    fxText.style.opacity = 1;
  }
  if (fx.rulesStamp) {
    // Draw an "X" over the scene with a rule-paragraph underlay
    const rules = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rules.setAttribute('class', 'rules-stamp');
    for (let i=0; i<8; i++) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      t.setAttribute('x', W*0.18);
      t.setAttribute('y', H*0.12 + i*22);
      t.setAttribute('width', W*0.64);
      t.setAttribute('height', 9);
      t.setAttribute('fill', 'var(--violet-200)');
      t.setAttribute('opacity', 0.12);
      rules.appendChild(t);
    }
    // big red X
    const x1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    x1.setAttribute('x1', W*0.18); x1.setAttribute('y1', H*0.12);
    x1.setAttribute('x2', W*0.82); x1.setAttribute('y2', H*0.88);
    x1.setAttribute('stroke', '#ff4757'); x1.setAttribute('stroke-width', 6);
    x1.setAttribute('opacity', 0.55);
    const x2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    x2.setAttribute('x1', W*0.82); x2.setAttribute('y1', H*0.12);
    x2.setAttribute('x2', W*0.18); x2.setAttribute('y2', H*0.88);
    x2.setAttribute('stroke', '#ff4757'); x2.setAttribute('stroke-width', 6);
    x2.setAttribute('opacity', 0.55);
    rules.appendChild(x1); rules.appendChild(x2);
    fxG.appendChild(rules);
  }
  if (fx.countBadge) {
    fxText.textContent = fx.countBadge;
    fxText.style.opacity = 0.75;
    fxText.classList.add('badge');
  } else {
    fxText.classList.remove('badge');
  }
  if (fx.jeremyStatusPill) {
    // add a small status pill near jeremy, absolutely positioned
    setTimeout(() => {
      const j = live.jeremy;
      if (!j) return;
      const pill = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      pill.setAttribute('class', 'status-pill');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', j.x + 32); rect.setAttribute('y', j.y - 12);
      rect.setAttribute('width', 88); rect.setAttribute('height', 22);
      rect.setAttribute('rx', 11);
      rect.setAttribute('fill', 'var(--bolt)'); rect.setAttribute('fill-opacity', 0.12);
      rect.setAttribute('stroke', 'var(--bolt)');
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', j.x + 76); txt.setAttribute('y', j.y + 3);
      txt.setAttribute('fill', 'var(--bolt)');
      txt.setAttribute('font-family', 'var(--font-mono)');
      txt.setAttribute('font-size', 10);
      txt.setAttribute('text-anchor', 'middle');
      txt.textContent = '● node · mood ok';
      pill.appendChild(rect); pill.appendChild(txt);
      fxG.appendChild(pill);
    }, 500);
  }
}

/* ────────── CHAPTER NAV UI ────────── */
const chapterLabelEl = document.getElementById('chapterLabel');
const chapterTotalEl = document.getElementById('chapterTotal');
const chapterDotsEl  = document.getElementById('chapterDots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function updateChapterLabel(label) {
  const badge = document.querySelector('.chapter-badge');
  const isHero = CHAPTERS[currentChapter] && CHAPTERS[currentChapter].hero;
  if (badge) badge.classList.toggle('is-hidden', !!isHero);
  chapterLabelEl.textContent = label;
  // total = number of story chapters (exclude hero at index 0)
  chapterTotalEl.textContent = String(CHAPTERS.length - 1).padStart(2, '0');
  for (const d of chapterDotsEl.children) {
    d.classList.toggle('active', +d.dataset.idx === currentChapter);
  }
  // reflect in panels
  for (const panel of document.querySelectorAll('.chapter')) {
    panel.classList.toggle('is-current', +panel.dataset.idx === currentChapter);
  }
}

function buildDots() {
  chapterDotsEl.innerHTML = '';
  // skip hero (CHAPTERS[0]); dots are story chapters only
  for (let i = 1; i < CHAPTERS.length; i++) {
    const d = document.createElement('button');
    d.className = 'dot';
    d.dataset.idx = i;
    d.setAttribute('aria-label', `Chapter ${CHAPTERS[i].label}`);
    d.addEventListener('click', () => goTo(i));
    chapterDotsEl.appendChild(d);
  }
}
function goTo(i) {
  i = Math.max(0, Math.min(CHAPTERS.length - 1, i));
  transitionTo(i);
  if (i === 0) {
    // hero — scroll to title/hero card
    const hero = document.querySelector('.case-hero');
    if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  // scroll chapter panel into view
  const panel = document.querySelector(`.chapter[data-idx="${i}"]`);
  if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
prevBtn.addEventListener('click', () => goTo(currentChapter - 1));
nextBtn.addEventListener('click', () => goTo(currentChapter + 1));
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goTo(currentChapter + 1); }
  if (e.key === 'ArrowLeft')                   { e.preventDefault(); goTo(currentChapter - 1); }
});

/* ────────── SCROLL-DRIVEN CHAPTER SWITCH ────────── */
const observer = new IntersectionObserver((entries) => {
  // pick entry most in view
  let best = null;
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
  }
  if (best) {
    const idx = +best.target.dataset.idx;
    if (idx !== currentChapter) transitionTo(idx);
  }
}, { threshold: [0.5, 0.75], rootMargin: '-20% 0px -30% 0px' });

document.querySelectorAll('.chapter').forEach(c => observer.observe(c));

// Hero observer — when title/hero card is in view, transition to hero state (index 0)
const heroEl = document.querySelector('.case-hero');
if (heroEl) {
  const heroObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio > 0.3) {
        if (currentChapter !== 0) transitionTo(0);
      }
    }
  }, { threshold: [0.3, 0.6], rootMargin: '0px 0px -30% 0px' });
  heroObs.observe(heroEl);
}

/* ────────── INIT ────────── */
buildDots();
let startIdx = 0;
try {
  const saved = parseInt(localStorage.getItem('fm_chapter'), 10);
  if (!isNaN(saved) && saved >= 0 && saved < CHAPTERS.length) startIdx = saved;
} catch (e) {}

// Delay one frame so resize grabs dimensions
requestAnimationFrame(() => {
  resize();
  transitionTo(startIdx);
  // Scroll to current chapter panel
  const panel = document.querySelector(`.chapter[data-idx="${startIdx}"]`);
  if (panel && startIdx !== 0) panel.scrollIntoView({ behavior: 'instant', block: 'center' });
  tick();
});
