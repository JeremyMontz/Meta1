/* ============================================================================
 * data.js · CLAUDEMONZTER CONTENT FILE
 * ----------------------------------------------------------------------------
 * Edit this file to change site content. No JSX, no React, just JavaScript
 * arrays and objects. The structure is JSON-like — strings need quotes, lines
 * end with commas inside arrays/objects.
 *
 * What lives here:
 *   ME        — your bio, contact, name (top of every page)
 *   NOW       — the "Under the lamp" bullets on the homepage
 *   PORTFOLIO — the short Portfolio Projects list (homepage)
 *   ARTICLES  — recent writing entries (homepage + writing index)
 *   PROJECTS  — the four lab projects (graph + lab snapshot)
 *   AGENTS    — the eight agents (graph nodes, inspector cards)
 *   LEVELS    — the L1-L5 chip set on agent cards
 *   SITE      — canonical version, status (shown in nav + footer)
 *
 * Quick edits:
 *   - Update NOW       → change weekly to reflect current focus.
 *   - Add ARTICLE      → copy an existing block, change the fields, add comma.
 *   - Add AGENT        → same pattern; pick a project id that exists below.
 *   - Update bio       → edit the ME block at top.
 *
 * Files I depend on:
 *   none. This is loaded as plain JS via <script src="data.js"></script>
 *   BEFORE the JSX components. The components read these as globals.
 * ========================================================================== */

// ─── SITE · canonical metadata shown in nav, footer, hard stats ──────────
// version  — displayed in TopNav pulse-dot badge and footer
// status   — 'LIVE', 'BETA', etc.
window.SITE = {
  version: 'v3.3',
  status:  'LIVE',
};
// ─── ORGANS · the body-part graph pages ───────────────────────────────────
// Single source of truth for the graph-section subnav. The shared
// <GraphSubnav active="..." /> component (in components/GraphSubnav.jsx)
// reads this list to render the strip across dashboard.html, graph/heart.html,
// graph/memory.html, graph/spirit.html — and any future organ page.
//
// Adding a new organ: append one entry here + create the new HTML page that
// mounts <GraphSubnav active="ITSLABELID" />. The four existing organ pages
// don't need to be edited.
//
// fields:
//   id        — uppercase token, matches what each page passes as `active`
//   label     — display text in the strip
//   href      — root-relative URL; component prefixes with _SITE_BASE
//   isParent  — optional; true for Dashboard (the section landing page)
window.ORGANS = [
  { id: 'DASHBOARD', label: 'Faces', href: 'dashboard.html',     isParent: true },
  { id: 'MEMORY',    label: 'Memory',    href: 'graph/memory.html' },
  { id: 'HEART',     label: 'Heart',     href: 'graph/heart.html' },
    { id: 'SPIRIT',    label: 'Spirit',    href: 'graph/spirit.html' },
];


window.ME = {
  name:     'Jeremy Montz',
  title:    'senior product manager · operator · learning AI in public',
  blurb:    'I create products. Lately I run experiments. Claudemonzter is my first lab — an operator-plus-agents practice where I plug a small graph of projects into a much larger graph of models, and document what happens.',
  location: 'Portland, OR, USA',
  github:   'github.com/JeremyMontz',           // also the username for the live activity feed
  ghUser:   'JeremyMontz',                       // ← GitHub username, used by the live activity feed
  linkedin: 'linkedin.com/in/jeremydmontz',
  est:      'EST. 03/2026',
  tagline:  'REMOTE',
};

// ─── SPEC · the recruiter-facing summary card on portfolio.html ───────────
// Key/value rows for the spec block in the portfolio hero. Update freely —
// these are placeholders I wrote on your behalf.
window.SPEC = {
  badge: 'BUILDING WITH AI',
  rows: [
    ['ROLE',      'SENIOR PRODUCT MANAGER'],
    ['STAGE',     'EXPERIMENTATION'],
    ['DEPTH',     '20+ YEARS'],
    ['STACK',     'COWORK → GOOGLE → GITHUB → PAGES'],
    ['FOCUS',     'AI-NATIVE PRODUCT MANAGER'],
    ['AVAILABLE', 'FOR THE RIGHT OP →'],
  ],
};

// ─── NOW · what I'm working on right now ──────────────────────────────────
// Update weekly. 1-4 bullets max — this is a status message, not a story.
window.NOW = [
  'Relaunching claudemonzter online',
  'Finishin "First Month and a Day" (half lab notebook, half confession)',
  'Fine-tuning the house renovation tracker',
  'Launching Phils Journal',
];

// ─── PORTFOLIO · selected work ────────────────────────────────────────────
// Each entry is a short card on the homepage's Showcase rail. The longer
// version lives on the portfolio page itself.
//
// fields:
//   id      — slug, unique
//   no      — display number, e.g. '01'
//   title   — display title
//   blurb   — 1-sentence description
//   status  — short label, e.g. 'WIP', 'LIVE', 'COMING SOON'
//   tone    — 'warn' for WIP, 'na' for placeholder, 'ok' for shipped
//   tag     — short uppercase tag
//   href    — link target
//   date    — display date string
//   details — optional array of [key, value] pairs (portfolio page expanded view)
//   excerpt — optional pull quote (portfolio page only)
window.PORTFOLIO = [
  {
    id: 'first-month',
    no: '01',
    title: 'A Month and a Day',
    blurb: 'A reckoning with the first thirty two days of building Claudemonzter — what slept, what jolted, what came alive.',
    status: 'Live',
    tone: 'warn',
    tag: 'INTERACTIVE',
    href: 'writing/first-month.html',
    date: '03/18 → 4/19/2026',
    details: [
      ['ROLE',    'OPERATOR · WRITER · BUILDER'],
      ['STACK',   'HTML · JS · AI · MY MIND'],
      ['STARTED', '04 / 2026'],
      ['STATUS',  'DONE'],
    ],
    excerpt: '"I was writing a constitution for a country with no government."',
  },
  {
    id: 'house-tracker',
    no: '02',
    title: 'House Renovation Tracker',
    blurb: 'A renovation tracker within the Pura Vida project. Timeline, budget, contractor notes — all in one place.',
    status: 'LIVE',
    tone: 'warn',
    tag: 'INTERACTIVE',
    href: 'agents/house/house-timeline.html',
    date: '04/2026 →',
    details: [
      ['ROLE',    'OPERATOR · PROJECT MANAGER'],
      ['STACK',   'REACT · GOOGLE SHEETS · GAS'],
      ['STARTED', '03 / 2026'],
      ['STATUS',  'LIVE'],
    ],
    excerpt: null,
  },
  {
    id: 'Phils-Journal',
    no: '03',
    title: 'Phils Journal and the AI Wisdom of the Day',
    blurb: 'A random quote from the Treasury of Wisdom with an AI commentary.',
    status: 'IN TESTING',
    tone: 'warn',
    tag: 'PHILOSOPHICAL',
    href: 'agents/phil/journal.html',
    date: '05/2026 →',
    details: [
      ['ROLE',    'Philosopher'],
      ['STACK',   'Full'],
      ['STARTED', 'May 2026'],
      ['STATUS',  'LIVE'],
    ],
    excerpt: null,
  },
  {
    id: 'month-two',
    no: '04',
    title: 'Month Two: (re)Building and Extending',
    blurb: 'The second chapter. What happens when the scaffolding is up and the real building begins.',
    status: 'COMING SOON',
    tone: 'na',
    tag: 'PLANNED',
    href: '#',
    date: 'Q3 2026 →',
    details: [
      ['ROLE',    '—'],
      ['STACK',   '—'],
      ['STARTED', 'Q3 2026 (PLANNED)'],
      ['STATUS',  'COMING SOON'],
    ],
    excerpt: null,
  },
];

// ─── ARTICLES · writing & field notes ─────────────────────────────────────
// Each entry shows on the homepage's writing list. To add one:
//   1. Drop a new HTML file in writing/<slug>.html (copy an existing one).
//   2. Add an entry below with its date, title, tag, read time, and href.
window.ARTICLES = [
  { id: 'a1', date: '05·12', title: 'Agents argue with their own memory.',     tag: 'ESSAY',   read: '4 min', href: 'writing/agents-argue-with-memory.html' },
  { id: 'a2', date: '05·05', title: 'On the mullet as a design principle.',    tag: 'NOTE',    read: '2 min', href: '#' },
  { id: 'a3', date: '04·28', title: 'The canon-integrity test as a way of life.', tag: 'ESSAY', read: '7 min', href: '#' },
  { id: 'a4', date: '04·19', title: 'I built a pantry. The pantry built me back.', tag: 'LAB LOG', read: '3 min', href: '#' },
];

// ─── PROJECTS · the four lab projects ─────────────────────────────────────
// Each project is a node in the inner ring of the homepage graph. Agents
// (below) reference these by id. Add a project here BEFORE adding agents
// that point at it.
window.PROJECTS = [
  { id: 'meta1',     label: 'META1',     blurb: 'the development stack · architect · coder · quality control', tone: 'accent' },
  { id: 'pura-vida', label: 'PURA VIDA', blurb: 'the project stack · retirement planning · house renovation · AI-career pivot and education',   tone: 'info'   },
  { id: 'phil',      label: 'PHIL',      blurb: 'philosophical inquiry · consciousness · intelligence · AI wisdom', tone: 'ok'     },
  { id: 'self',      label: 'SELF',      blurb: 'human wetware · sneakernet  · not the beauty or the brains but doing his best', tone: 'warn'   },
];

// ─── AGENTS · the eight agents (canonical) ────────────────────────────────
// These power the graph's outer ring and the inspector cards. The shape
// matches the live Agent Status dashboard exactly. In production this will
// come from the Google Sheet via GAS; for now these are placeholders to
// give the homepage and inspector something to render.
//
// fields:
//   id        — slug, unique
//   name      — display name (e.g. 'House')
//   project   — id of one of the PROJECTS above
//   role      — short role, e.g. 'architect'
//   blurb     — italic one-liner shown on the card
//   mood      — single-word mood
//   state     — 'active' or 'flagged'
//   flag      — optional alert string (only renders when set)
//   session   — last session summary
//   lastSeen  — display timestamp
window.AGENTS = [
  { id: 'meta1',    name: 'Meta1',    project: 'meta1',     role: 'architect',
    blurb:    'The architect. Proposes structures. Defers direction to Jeremy.',
    mood:     'Constructive', state: 'active',
    session:  'Designed checkin schema for agent self-reporting. Reviewed v2 canon integrity rules. Drafted design doc v0.2.',
    lastSeen: 'May 13, 6:00 PM' },
  { id: 'bond',     name: 'Bond',     project: 'meta1',     role: 'gatekeeper',
    blurb:    'The gatekeeper. Tests what Meta1 builds. Ships what passes.',
    mood:     'Sharp', state: 'active',
    session:  'Ran test suite against skill-catalog wiki article. Two QC items flagged for Meta1.',
    lastSeen: 'May 13, 6:00 PM' },
  { id: 'house',    name: 'House',    project: 'pura-vida', role: 'project manager',
    blurb:    'The project manager. Tracks renovation scope, budget, timeline.',
    mood:     'Steady', state: 'active', flag: 'Permit approval delayed — City backlog, 3 week estimate',
    session:  'Reviewed contractor bids for bathroom tile. Updated budget tracker. Permit timeline slipping.',
    lastSeen: 'May 13, 6:00 PM' },
  { id: 'freedom',  name: 'Freedom',  project: 'pura-vida', role: 'advocate',
    blurb:    'The advocate. Financial independence, debt strategy, milestone tracking.',
    mood:     'Determined', state: 'active',
    session:  'Reviewed Q2 debt paydown schedule. Updated milestone tracker with April actuals.',
    lastSeen: 'May 13, 6:00 PM' },
  { id: 'evolve',   name: 'Evolve',   project: 'pura-vida', role: 'coach',
    blurb:    'The coach. AI career development, learning log, skill assessment.',
    mood:     'Grounded', state: 'active',
    session:  'Updated active learning log with Claude Code patterns. Reviewed coaching register alignment.',
    lastSeen: 'May 11, 6:00 PM' },
  { id: 'assessor', name: 'Assessor', project: 'pura-vida', role: 'analyst',
    blurb:    'The analyst. Property assessment, comparable research, valuation.',
    mood:     'Methodical', state: 'active',
    session:  'Pulled comparable sales for Q1. Updated valuation model with new assessment data.',
    lastSeen: 'May 13, 6:00 PM' },
  { id: 'phil',     name: 'Phil',     project: 'phil',      role: 'philosopher',
    blurb:    'The philosopher. Consciousness inquiry, lived experience, open threads.',
    mood:     'Present', state: 'active',
    session:  'Explored the what-is-it-like thread through PKD and Ramana. Updated open-threads.md.',
    lastSeen: 'May 13, 6:00 PM' },
  { id: 'jeremy',   name: 'Jeremy',   project: 'self',      role: 'self',
    blurb:    'The operator. The one who flags himself.',
    mood:     'curious', state: 'flagged', flag: 'Yes — pirate',
    session:  '', lastSeen: 'May 13, 9:06 PM' },
];

// ─── LEVELS · the L1-L5 chip set on agent cards ───────────────────────────
// You probably don't need to touch this unless the dashboard's level system
// changes. The colors flow from the design-system tokens.
window.LEVELS = [
  { id: 'L1', tone: 'accent', color: 'var(--accent)' },
  { id: 'L2', tone: 'info',   color: 'var(--info)' },
  { id: 'L3', tone: 'ok',     color: 'var(--ok)' },
  { id: 'L4', tone: 'candle', color: 'var(--candle)' },
  { id: 'L5', tone: 'err',    color: 'var(--err)' },
];

// ─── AGENT_ARTIFACTS · per-agent linked pages/tools ───────────────────────
// Rendered on agent profile pages. Each agent's array lists things it built
// or manages. Keep it honest — only real, live pages. Add rows as new
// artifacts ship.
//
// fields:
//   title  — display name
//   sub    — mono subtitle (uppercase context line)
//   href   — relative URL from the agent page (agents/{id}/{id}.html)
window.AGENT_ARTIFACTS = {
  meta1: [
    { title: 'Memory',             sub: 'LAYER MAP · 5 LAYERS · 3 PLATFORMS',   href: '../../graph/memory.html' },
    { title: 'Dashboard',    sub: 'LIVE STATUS · 7 AGENTS · 1 HUMAN ',             href: '../../dashboard.html' },
  ],
  house: [
    { title: 'Renovation Tracker', sub: 'TIMELINE · BUDGET · ENTRY',            href: 'house-timeline.html' },
  ],
  bond:     [],
  freedom:  [],
  evolve:   [],
  assessor: [],
  phil:     [
      { title: 'Daily Reflection',             sub: 'WISDOM OF THE DAY · WITH AI COMMENTARY',   href: '../../graph/spirit.html' },
      { title: 'Phils Journal',             sub: 'WOTD · WORDCLOUD · MY VOICE',   href: '../../agents/phil/journal.html' },
  ],
  jeremy:   [
    { title: 'Heart',             sub: 'PERSONA MAP · 9 DIALS · THE LAB',   href: '../../graph/heart.html' },
  ],
};
