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

  // Chapter 1 placeholders (four projects, unlabeled)
  proj1: { label: 'project?', kind: 'ghost', r: 12, italic: true },
  proj2: { label: 'project?', kind: 'ghost', r: 12, italic: true },
  proj3: { label: 'project?', kind: 'ghost', r: 12, italic: true },
  proj4: { label: 'project?', kind: 'ghost', r: 12, italic: true },

  // Future-persona ghosts around phil
  g1: { label: 'persona?', kind: 'ghost', r: 8, italic: true },
  g2: { label: 'persona?', kind: 'ghost', r: 8, italic: true },
  g3: { label: 'persona?', kind: 'ghost', r: 8, italic: true },

  // Inbox / voice / email (v3 real dataflow)
  voice : { label: 'voice prompt', kind: 'data', r: 11 },
  inbox : { label: 'inbox',        kind: 'data', r: 13 },
  email : { label: 'email',        kind: 'data', r: 11 },
};

/* ────────── POSITION HELPERS ──────────
 * Positions are normalized [0..1] of canvas, so they scale with
 * the viewport. Angle in radians from center (0=3 o'clock,
 * -π/2=12 o'clock, π/2=6 o'clock).
 */
const polar = (angle, dist) => ({
  x: 0.5 + Math.cos(angle) * dist,
  y: 0.5 + Math.sin(angle) * dist,
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
/* ────────── 0 — COLD OPEN ────────── */
{
  label: '00',
  nodes: {
    jeremy: { ...polar(0, 0), opacity: 1, r: 20 },
  },
  edges: [],
  fx: { introDot: true },
},

/* ────────── 1 — FIRST CONVERSATION ────────── */
{
  label: '01',
  nodes: {
    jeremy: { ...polar(0, 0), opacity: 1, r: 22 },
    proj1: { ...polar(-Math.PI/2, 0.22), opacity: 0.7 },
    proj2: { ...polar(0,           0.22), opacity: 0.7 },
    proj3: { ...polar(Math.PI/2,   0.22), opacity: 0.7 },
    proj4: { ...polar(Math.PI,     0.22), opacity: 0.7 },
  },
  edges: [
    { a: 'jeremy', b: 'proj1', style: 'dotted', opacity: 0.4 },
    { a: 'jeremy', b: 'proj2', style: 'dotted', opacity: 0.4 },
    { a: 'jeremy', b: 'proj3', style: 'dotted', opacity: 0.4 },
    { a: 'jeremy', b: 'proj4', style: 'dotted', opacity: 0.4 },
  ],
  fx: {},
},

/* ────────── 2 — THE BUILD (v1) ────────── */
{
  label: '02',
  nodes: {
    jeremy : { ...polar(Math.PI/2, 0.30), opacity: 1, r: 18 },
    meta1  : { ...polar(0, 0),            opacity: 1, r: 30 },
    bond   : { ...polar(CLOCK.ten,    0.28), opacity: 1 },
    evolve : { ...polar(CLOCK.twelve, 0.28), opacity: 1 },
    assess : { ...polar(-Math.PI/3,   0.28), opacity: 1 },
    house  : { ...polar(0,            0.32), opacity: 1 },
    freedom: { ...polar(Math.PI/3,    0.28), opacity: 1 },
    phil   : { ...polar(CLOCK.seven,  0.28), opacity: 1 },
    canon  : { ...polar(CLOCK.eight,  0.16), opacity: 0.8 },
    hshake : { ...polar(CLOCK.ten,    0.14), opacity: 0.8 },
    broadcast:{...polar(-Math.PI/6,   0.15), opacity: 0.8 },
  },
  edges: [
    { a: 'meta1', b: 'bond'    },
    { a: 'meta1', b: 'evolve'  },
    { a: 'meta1', b: 'assess'  },
    { a: 'meta1', b: 'house'   },
    { a: 'meta1', b: 'freedom' },
    { a: 'meta1', b: 'phil'    },
    { a: 'meta1', b: 'canon'   },
    { a: 'meta1', b: 'hshake'  },
    { a: 'meta1', b: 'broadcast' },
    { a: 'jeremy', b: 'meta1', style: 'dashed', opacity: 0.4 },
  ],
  fx: { countBadge: '80 files · 7 agents · hand-maintained' },
},

/* ────────── 3 — JEREMY AS THE NERVOUS SYSTEM ────────── */
{
  label: '03',
  nodes: {
    jeremy : { ...polar(0, 0),                opacity: 1, r: 32 },
    meta1  : { ...polar(CLOCK.twelve, 0.30),  opacity: 1 },
    bond   : { ...polar(CLOCK.ten,    0.32),  opacity: 1 },
    evolve : { ...polar(CLOCK.nine,   0.32),  opacity: 1 },
    assess : { ...polar(CLOCK.eight,  0.32),  opacity: 1 },
    house  : { ...polar(CLOCK.six,    0.30),  opacity: 1 },
    freedom: { ...polar(Math.PI/3,    0.32),  opacity: 1 },
    phil   : { ...polar(CLOCK.three,  0.32),  opacity: 1 },
  },
  edges: [
    { a: 'jeremy', b: 'meta1',   animated: true },
    { a: 'jeremy', b: 'bond',    animated: true },
    { a: 'jeremy', b: 'evolve',  animated: true },
    { a: 'jeremy', b: 'assess',  animated: true },
    { a: 'jeremy', b: 'house',   animated: true },
    { a: 'jeremy', b: 'freedom', animated: true },
    { a: 'jeremy', b: 'phil',    animated: true },
  ],
  fx: { nervousSystem: true },
},

/* ────────── 4 — AGENTIC THEATER (NADIR) ────────── */
{
  label: '04',
  nodes: {
    jeremy : { ...polar(0, 0),                opacity: 0.35, r: 20 },
    meta1  : { ...polar(CLOCK.twelve, 0.22),  opacity: 0.4 },
    bond   : { ...polar(CLOCK.ten,    0.26),  opacity: 0.4 },
    evolve : { ...polar(CLOCK.nine,   0.30),  opacity: 0.4 },
    assess : { ...polar(CLOCK.eight,  0.28),  opacity: 0.4 },
    house  : { ...polar(CLOCK.six,    0.26),  opacity: 0.4 },
    freedom: { ...polar(Math.PI/3,    0.30),  opacity: 0.4 },
    phil   : { ...polar(CLOCK.three,  0.24),  opacity: 0.4 },
    canon  : { ...polar(-Math.PI/4,   0.18),  opacity: 0.4 },
    hshake : { ...polar(Math.PI*0.9,  0.18),  opacity: 0.4 },
    broadcast:{...polar(Math.PI*0.4,  0.20),  opacity: 0.4 },
    crystalline: { ...polar(CLOCK.twelve, 0.42), opacity: 0.35 },
    federation : { ...polar(CLOCK.three,  0.42), opacity: 0.35 },
    dials      : { ...polar(CLOCK.ten,    0.44), opacity: 0.35 },
  },
  // noisy mess of edges — every node talks to every other
  edges: (() => {
    const ids = ['jeremy','meta1','bond','evolve','assess','house','freedom','phil','canon','hshake','broadcast'];
    const out = [];
    for (let i=0;i<ids.length;i++) for (let j=i+1;j<ids.length;j++) {
      out.push({ a: ids[i], b: ids[j], opacity: 0.18 });
    }
    return out;
  })(),
  fx: { theater: true, ghostShimmer: true },
},

/* ────────── 5 — RULES WITHOUT A RULES ENGINE ────────── */
{
  label: '05',
  nodes: {
    jeremy : { ...polar(0, 0),                opacity: 1, r: 22 },
    meta1  : { ...polar(CLOCK.twelve, 0.30),  opacity: 0.9 },
    bond   : { ...polar(CLOCK.ten,    0.32),  opacity: 0.9, color: '#ff4757' },
    evolve : { ...polar(CLOCK.nine,   0.32),  opacity: 0.9, color: '#ff4757' },
    assess : { ...polar(CLOCK.eight,  0.32),  opacity: 0.9, color: '#ff4757' },
    house  : { ...polar(CLOCK.six,    0.30),  opacity: 0.9, color: '#ff4757' },
    freedom: { ...polar(Math.PI/3,    0.32),  opacity: 0.9 },
    phil   : { ...polar(CLOCK.three,  0.32),  opacity: 0.9 },
  },
  edges: [
    { a: 'jeremy', b: 'meta1'   },
    { a: 'jeremy', b: 'bond',   style: 'broken' },
    { a: 'jeremy', b: 'evolve', style: 'broken' },
    { a: 'jeremy', b: 'assess', style: 'broken' },
    { a: 'jeremy', b: 'house',  style: 'broken' },
    { a: 'jeremy', b: 'freedom' },
    { a: 'jeremy', b: 'phil'    },
  ],
  fx: { rulesStamp: true },
},

/* ────────── 6 — SAME TRAP, NEW COMPUTER ────────── */
{
  label: '06',
  // Identical shape to chapter 2, different palette tint
  nodes: {
    jeremy : { ...polar(Math.PI/2, 0.30), opacity: 1, r: 18 },
    meta1  : { ...polar(0, 0),            opacity: 1, r: 30, color: '#8dd9ff' },
    bond   : { ...polar(CLOCK.ten,    0.28), opacity: 1, color: '#8dd9ff' },
    evolve : { ...polar(CLOCK.twelve, 0.28), opacity: 1, color: '#8dd9ff' },
    assess : { ...polar(-Math.PI/3,   0.28), opacity: 1, color: '#8dd9ff' },
    house  : { ...polar(0,            0.32), opacity: 1, color: '#8dd9ff' },
    freedom: { ...polar(Math.PI/3,    0.28), opacity: 1, color: '#8dd9ff' },
    phil   : { ...polar(CLOCK.seven,  0.28), opacity: 1, color: '#8dd9ff' },
  },
  edges: [
    { a: 'meta1', b: 'bond'    },
    { a: 'meta1', b: 'evolve'  },
    { a: 'meta1', b: 'assess'  },
    { a: 'meta1', b: 'house'   },
    { a: 'meta1', b: 'freedom' },
    { a: 'meta1', b: 'phil'    },
    { a: 'jeremy', b: 'meta1', style: 'dashed', opacity: 0.4 },
  ],
  fx: { cathedralSilhouette: true },
},

/* ────────── 7 — THE SIMPLIFICATION ────────── */
{
  label: '07',
  nodes: {
    jeremy : { ...polar(0, 0),                opacity: 1, r: 28 },
    evolve : { ...polar(CLOCK.twelve, 0.28),  opacity: 1, r: 18 },
    house  : { ...polar(CLOCK.eight,  0.28),  opacity: 1, r: 17 },
    freedom: { ...polar(Math.PI*0.35, 0.28),  opacity: 1, r: 17 },
  },
  edges: [
    { a: 'jeremy', b: 'evolve'  },
    { a: 'jeremy', b: 'house'   },
    { a: 'jeremy', b: 'freedom' },
  ],
  fx: { clearedRoom: true },
},

/* ────────── 8 — REAL DATAFLOW ────────── */
{
  label: '08',
  nodes: {
    jeremy : { ...polar(0, 0),                opacity: 1, r: 28 },
    evolve : { ...polar(CLOCK.twelve, 0.28),  opacity: 1 },
    house  : { ...polar(CLOCK.eight,  0.28),  opacity: 1 },
    freedom: { ...polar(Math.PI*0.35, 0.28),  opacity: 1 },
    voice  : { ...polar(-Math.PI*0.35,0.44),  opacity: 1 },
    inbox  : { ...polar(-Math.PI*0.2, 0.22),  opacity: 1 },
    email  : { ...polar(Math.PI*0.55, 0.40),  opacity: 1 },
  },
  edges: [
    { a: 'jeremy', b: 'evolve'  },
    { a: 'jeremy', b: 'house'   },
    { a: 'jeremy', b: 'freedom' },
    { a: 'voice',  b: 'inbox',  animated: true, style: 'flow' },
    { a: 'inbox',  b: 'jeremy', animated: true, style: 'flow' },
    { a: 'jeremy', b: 'email',  animated: true, style: 'flow' },
  ],
  fx: {},
},

/* ────────── 9 — ALL OF US ARE CLAUDEMONZTER ────────── */
{
  label: '09',
  nodes: {
    jeremy : { ...polar(0, 0),                opacity: 1, r: 30 },
    evolve : { ...polar(CLOCK.twelve, 0.28),  opacity: 1 },
    house  : { ...polar(CLOCK.eight,  0.28),  opacity: 1 },
    freedom: { ...polar(Math.PI*0.35, 0.28),  opacity: 1 },
    phil   : { ...polar(CLOCK.three,  0.32),  opacity: 1, r: 24 },
    g1     : { ...polar(CLOCK.three - 0.5, 0.45), opacity: 0.5 },
    g2     : { ...polar(CLOCK.three,       0.46), opacity: 0.5 },
    g3     : { ...polar(CLOCK.three + 0.5, 0.45), opacity: 0.5 },
  },
  edges: [
    { a: 'jeremy', b: 'evolve'  },
    { a: 'jeremy', b: 'house'   },
    { a: 'jeremy', b: 'freedom' },
    { a: 'jeremy', b: 'phil'    },
    { a: 'phil',   b: 'g1', style: 'dotted', opacity: 0.4 },
    { a: 'phil',   b: 'g2', style: 'dotted', opacity: 0.4 },
    { a: 'phil',   b: 'g3', style: 'dotted', opacity: 0.4 },
  ],
  fx: { jeremyStatusPill: true, ghostShimmer: true },
},

/* ────────── 10 — A DAY (homepage graph) ────────── */
{
  label: '10',
  nodes: {
    jeremy : { ...polar(0, 0),                opacity: 1, r: 30 },
    meta1  : { ...polar(CLOCK.ten,         0.28), opacity: 1 },
    bond   : { ...polar(CLOCK.ten - 0.18,  0.34), opacity: 1 },
    evolve : { ...polar(Math.PI*0.78,      0.28), opacity: 1 },
    assess : { ...polar(Math.PI*0.88,      0.36), opacity: 1 },
    house  : { ...polar(Math.PI*1.05,      0.28), opacity: 1 },
    freedom: { ...polar(Math.PI*1.15,      0.36), opacity: 1 },
    phil   : { ...polar(0,                 0.32), opacity: 1, r: 24 },
    g1     : { ...polar(-0.5,              0.44), opacity: 0.55 },
    g2     : { ...polar(0,                 0.46), opacity: 0.55 },
    g3     : { ...polar(0.5,               0.44), opacity: 0.55 },
  },
  edges: [
    { a: 'jeremy', b: 'meta1'   },
    { a: 'jeremy', b: 'bond'    },
    { a: 'jeremy', b: 'evolve'  },
    { a: 'jeremy', b: 'assess'  },
    { a: 'jeremy', b: 'house'   },
    { a: 'jeremy', b: 'freedom' },
    { a: 'jeremy', b: 'phil'    },
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
    case 'human': return 'var(--bolt)';
    case 'party': return '#ff6ec7';
    case 'ghost': return 'var(--violet-200)';
    case 'data' : return '#8dd9ff';
    default     : return 'var(--violet-300)';
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
    const a = live[e.a], b = live[e.b];
    if (!a || !b) continue;
    const style = e.style || 'solid';
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.setAttribute('stroke', EDGE_COLOR[style] || EDGE_COLOR.solid);
    line.setAttribute('stroke-width', style === 'flow' ? 1.6 : 1.2);
    line.setAttribute('stroke-opacity', e.opacity != null ? e.opacity : (style === 'dotted' ? 0.4 : 0.55));
    if (style === 'dashed' || style === 'adversary') line.setAttribute('stroke-dasharray', '5 5');
    else if (style === 'dotted') line.setAttribute('stroke-dasharray', '2 5');
    else if (style === 'broken') line.setAttribute('stroke-dasharray', '3 3 10 3');
    if (e.animated) {
      line.setAttribute('stroke-dasharray', '4 6');
      line.classList.add('edge-flow');
    }
    edgesG.appendChild(line);
    e._el = line;
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
    const px = spec.x * W;
    const py = spec.y * H;
    n.tx = px; n.ty = py;
    if (n.opacity === 0) { n.x = W/2 + (px - W/2) * 0.2; n.y = H/2 + (py - H/2) * 0.2; }
    n.targetOpacity = spec.opacity != null ? spec.opacity : 1;
    n.targetR = spec.r != null ? spec.r : nDef.r;
    n.targetColor = spec.color || null;
    if (spec.kind) n.kind = spec.kind;
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

  // update edges live
  const ch = CHAPTERS[currentChapter];
  if (ch) {
    for (const e of ch.edges || []) {
      if (!e._el) continue;
      const a = live[e.a], b = live[e.b];
      if (!a || !b) continue;
      e._el.setAttribute('x1', a.x); e._el.setAttribute('y1', a.y);
      e._el.setAttribute('x2', b.x); e._el.setAttribute('y2', b.y);
      // fade edge opacity with endpoints
      const minOp = Math.min(a.opacity, b.opacity);
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
  chapterLabelEl.textContent = label;
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
  for (let i = 0; i < CHAPTERS.length; i++) {
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
  // scroll panel into view
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
