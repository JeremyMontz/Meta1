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


// ─── ABOUT_PAGES · the ABOUT-section breadcrumb ───────────────────────────
// Single source of truth for the shared <AboutSubnav active="..." /> component
// (components/AboutSubnav.jsx). Renders: About: The Human / The AI / Our History
// across about/human.html, about/ai.html, about/history.html — and any future
// about page. Adding one: append an entry here + create the page that mounts
// <AboutSubnav active="ITSID" />. Existing pages don't need editing.
//
//   id       — uppercase token, matches what each page passes as `active`
//   label    — display text in the strip
//   href     — root-relative URL; component prefixes with site base
//   isParent — optional; true for the section landing page (Human)
window.ABOUT_PAGES = [
  { id: 'HUMAN',   label: 'The Human', href: 'about/human.html',   isParent: true },
  { id: 'AI',      label: 'The AI',    href: 'about/ai.html' },
  { id: 'HISTORY', label: 'Our History', href: 'about/history.html' },
];

// ─── HISTORY · the month-by-month interactive graphs ──────────────────────
// Powers about/history.html. These are the INTERACTIVE scrollytelling graphs
// (kept distinct from written essays in ARTICLES) — they tell the operator +
// agents story month by month. href is root-relative; the page prefixes it
// with its site base. Use href '#' for not-yet-built months.
window.HISTORY = [
  { id: 'm1', month: 'MONTH 01', date: '04 · 2026', title: 'A Month and a Day',
    sub: 'INTERACTIVE · 32 DAYS · GRAPH', read: '7 min', href: 'writing/first-month.html' },
  { id: 'm2', month: 'MONTH 02', date: 'COMING SOON', title: 'Month Two',
    sub: 'INTERACTIVE · IN PROGRESS', read: '—', href: '#' },
  { id: 'm3', month: 'MONTH 03', date: 'COMING SOON', title: 'Month Three',
    sub: 'INTERACTIVE · PLANNED', read: '—', href: '#' },
];


window.ME = {
  name:     'Jeremy Montz',
  title:    'senior product manager · operator · learning AI in public',
  blurb:    'I create products. Lately I run experiments. Claudemonzter is my first lab — an operator-plus-agents practice where I plug a small graph of projects into a much larger graph of models, and document what happens.',
  location: 'Portland, OR, USA',
  github:   'github.com/JeremyMontz',
  ghUser:   'JeremyMontz',                       // ← GitHub org (repo owner)
  ghRepo:   'JeremyMontz/Meta1',                 // ← repo whose event stream feeds LIVE FROM THE LAB
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
  ['ROLE',      'SR. PM / PRODUCT OWNER'],
  ['DOMAINS',   'EDISCOVERY · SECURITY · DATA'],
  ['PRACTICE',  'ROADMAPS · AGILE · DASHBOARDS'],
  ['AI',        'HANDS-ON, IN PUBLIC'],
  ['PROOF',     'THIS SITE · SOLO + AGENTS'],
  ['AVAILABLE', 'OPEN TO AI-NATIVE ROLES'],
  ],
};

// ─── NOW · what I'm working on right now ──────────────────────────────────
// Update weekly. 1-4 bullets max — this is a status message, not a story.
window.NOW = [
  'Relaunched Claudemonzter online',
  'Published "First Month and a Day" (half lab notebook, half confession)',
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
//   excerpt — optional pull quote (portfolio page only). Kept on first-month
//             only — pull-quotes lose their punch when every card has one.
window.PORTFOLIO = [
  {
    id: 'first-month',
    no: '01',
    title: 'A Month and a Day',
    blurb: 'The first thirty two days of building Claudemonzter — what worked and what did not.',
    status: 'Live',
    tone: 'ok',
    tag: 'INTERACTIVE',
    href: 'writing/first-month.html',
    date: '4/19/2026',
    details: [
      ['ROLE',    'NO PRIOR AI EXPERIENCE'],
      ['STARTED', 'April 2026'],
    ],
    excerpt: '"I was writing a constitution for a country with no government."',
  },
  {
    id: 'house-tracker',
    no: '02',
    title: 'House Renovation Tracker',
    blurb: 'A home remodeling timeline and budget tracking application.',
    status: 'LIVE',
    tone: 'ok',
    tag: 'DATA INPUT',
    href: 'agents/house/house-timeline.html',
    date: '04/2026 →',
    details: [
      ['ROLE',    'PROJECT MEETS PRODUCT MANAGER'],
      ['STARTED', 'March 2026'],
        ],
    excerpt: null,
  },
  {
    id: 'heart',
    no: '03',
    title: 'Persona Matrix Modulates the Graph',
    blurb: 'The Heart of Claudemonzter. The dials that adjust character and output styles.',
    status: 'IN TESTING',
    tone: 'warn',
    tag: 'SKILL',
    href: 'graph/heart.html',
    date: 'May 2026 →',
    details: [
      ['ROLE',    'Mad Scientist · Experiment'],
      ['STARTED', 'May 2026'],
    ],
    excerpt: null,
  },
  {
    id: 'Phils-Journal',
    no: '04',
    title: 'Phils Journal and the AI Wisdom of the Day',
    blurb: 'A random quote from The Treasury of Traditional Wisdom, with AI commentary.',
    status: 'IN TESTING',
    tone: 'warn',
    tag: 'AUTOMATED',
    href: 'agents/phil/journal.html',
    date: '05/2026 →',
    details: [
      ['ROLE',    'Philosopher · Transparent'],
      ['STARTED', 'May 2026'],
    ],
    excerpt: null,
  },
];

// ─── ARTICLES · writing & field notes ─────────────────────────────────────
// Each entry shows on the homepage's writing list. To add one:
//   1. Drop a new HTML file in writing/<slug>.html (copy an existing one).
//   2. Add an entry below with its date, title, tag, read time, and href.
window.ARTICLES = [
  { id: 'a1', date: '03.25.26', title: 'Multi-agent orchestration and the constraint spectrum.', tag: 'ESSAY', read: '2 min', href: 'writing/multiagent-constraint.html' },
  { id: 'a2', date: '04.01.26', title: 'Adversarial validation and structured perspective expansion.', tag: 'ESSAY', read: '2 min', href: 'writing/adversarial-validation.html' },
  { id: 'a3', date: '04.08.26', title: 'Coordination tax and the specialization dividend.', tag: 'ESSAY', read: '2 min', href: 'writing/coordination-tax.html' },
  { id: 'a4', date: '04.29.26', title: 'Building a closed-loop adaptive coaching system.', tag: 'ESSAY', read: '2 min', href: 'writing/coaching-system.html' },
];

// ─── PROJECTS · the four lab projects ─────────────────────────────────────
// Each project is a node in the inner ring of the homepage graph. Agents
// (below) reference these by id. Add a project here BEFORE adding agents
// that point at it.
window.PROJECTS = [
  { id: 'meta1',     label: 'META1',     blurb: 'the development stack · architect · coder · quality control', tone: 'accent' },
  { id: 'pura-vida', label: 'PURA VIDA', blurb: 'the project stack · retirement planning · house renovation · AI-career pivot and education',   tone: 'info'   },
  { id: 'phil',      label: 'PHIL',      blurb: 'philosophical inquiry · consciousness · intelligence · AI wisdom', tone: 'ok'     },
  { id: 'self',      label: 'SELF',      blurb: 'human wetware · sneakernet  · one with heart', tone: 'warn'   },
];

// ─── AGENTS · the eight agents (identity only) ────────────────────────────
// These power the graph's outer ring. IDENTITY lives here; everything
// VOLATILE (status, mood, flags, session, last-seen) comes live from the
// checkin Sheet — never from this file. The inspector card, dashboard.html,
// and the agent pages all render from the same Sheet pipeline
// (components/agent-card.js). If the Sheet has no data, the card says
// NO DATA — there is no placeholder content by design.
//
// fields:
//   id        — slug, unique; also the agent page folder (agents/{id}/)
//               and the checkin tab mapping ({Name}Checkin / HumanCheckin)
//   name      — display name (e.g. 'House')
//   project   — id of one of the PROJECTS above
//   role      — short role, e.g. 'architect'
//   blurb     — italic one-liner (identity tagline, not status)
window.AGENTS = [
  { id: 'meta1',    name: 'Meta1',    project: 'meta1',     role: 'architect',
    blurb: 'The architect. Proposes structures. Defers direction to Jeremy.' },
  { id: 'bond',     name: 'Bond',     project: 'meta1',     role: 'gatekeeper',
    blurb: 'The gatekeeper. Tests what Meta1 builds. Ships what passes.' },
  { id: 'house',    name: 'House',    project: 'pura-vida', role: 'project manager',
    blurb: 'The project manager. Tracks renovation scope, budget, timeline.' },
  { id: 'freedom',  name: 'Freedom',  project: 'pura-vida', role: 'advocate',
    blurb: 'The advocate. Financial independence, debt strategy, milestone tracking.' },
  { id: 'evolve',   name: 'Evolve',   project: 'pura-vida', role: 'coach',
    blurb: 'The coach. AI career development, learning log, skill assessment.' },
  { id: 'assessor', name: 'Assessor', project: 'pura-vida', role: 'analyst',
    blurb: 'The analyst. Property assessment, comparable research, valuation.' },
  { id: 'phil',     name: 'Phil',     project: 'phil',      role: 'philosopher',
    blurb: 'The philosopher. Consciousness inquiry, lived experience, open threads.' },
  { id: 'jeremy',   name: 'Jeremy',   project: 'self',      role: 'self',
    blurb: 'The human. Still part of the graph.' },
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
  evolve:   [
    { title: 'A Month and a Day', sub: 'INTERACTIVE · 32 DAYS · GRAPH',            href: 'writing/first-month.html' },
  ],
  assessor: [
   { title: 'Adversarial validation and structured perspective expansion', sub: 'ESSAY · 2 min · Week 2',            href: 'writing/adversarial-validation.html' },
  ],
  phil:     [
      { title: 'Daily Reflection',             sub: 'WISDOM OF THE DAY · WITH AI COMMENTARY',   href: '../../graph/spirit.html' },
      { title: 'Phils Journal',             sub: 'WOTD · WORDCLOUD · MY VOICE',   href: '../../agents/phil/journal.html' },
  ],
  jeremy:   [
    { title: 'Heart',             sub: 'PERSONA MAP · 9 DIALS · THE LAB',   href: '../../graph/heart.html' },
  ],
};
