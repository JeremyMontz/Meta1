/* ============================================================================
 * data.js · CLAUDEMONZTER CONTENT FILE
 * ----------------------------------------------------------------------------
 * Edit this file to change site content. No JSX, no React, just JavaScript
 * arrays and objects. The structure is JSON-like — strings need quotes, lines
 * end with commas inside arrays/objects.
 *
 * What lives here:
 *   ME           — your bio, contact, name (top of every page)
 *   NOW          — the "Under the lamp" bullets on the homepage
 *   COMPETENCIES — the skill nodes in the portfolio "What It Proves" graph
 *   PORTFOLIO    — the Portfolio Projects list (homepage + portfolio page)
 *   ARTICLES     — recent writing entries (homepage + writing index)
 *   PROJECTS     — the four lab projects (graph + lab snapshot)
 *   AGENTS       — the eight agents (graph nodes, inspector cards)
 *   LEVELS       — the L1-L5 chip set on agent cards
 *   SITE         — canonical version, status (shown in nav + footer)
 *
 * Quick edits:
 *   - Update NOW       → change weekly to reflect current focus.
 *   - Add ARTICLE      → copy an existing block, change the fields, add comma.
 *   - Add AGENT        → same pattern; pick a project id that exists below.
 *   - Update bio       → edit the ME block at top.
 *   - Tag evidence     → add competency ids to a Work/Article `demonstrates`
 *                        array; it surfaces under that node automatically.
 *
 * Files I depend on:
 *   none. This is loaded as plain JS via <script src="data.js"></script>
 *   BEFORE the JSX components. The components read these as globals.
 *   CACHING: pages load this as plain `data.js` (no ?v= param). GitHub Pages
 *   serves it with a short cache lifetime, so edits go live within minutes of a
 *   deploy. The manual ?v= cache-bust was dropped — it had drifted across pages
 *   (3.3/3.4/3.6) and ~30 pages never used it.
 * ========================================================================== */

// ─── SITE · canonical metadata shown in nav, footer, hard stats ──────────
// version  — displayed in TopNav pulse-dot badge and footer
// status   — 'LIVE', 'BETA', etc.
window.SITE = {
  version: 'v3.4',
  status:  'LIVE',
};

// ─── COMMIT_WEEKS · baked snapshot for the portfolio commit chart ──────
// Always-present fallback so every visitor (even first-time) sees the chart
// instantly while /stats/commit_activity (which 202s during GitHub recompute)
// catches up; the live endpoint upgrades it to STREAMING. Refresh: see issue #260.
// Static early-history is fine for an extended period. Weekly Sunday buckets, UTC.
window.COMMIT_WEEKS_ASOF = '2026-06-16';
window.COMMIT_WEEKS = [
  { week: 1772323200, total: 0 },
  { week: 1772928000, total: 0 },
  { week: 1773532800, total: 0 },
  { week: 1774137600, total: 28 },
  { week: 1774742400, total: 29 },
  { week: 1775347200, total: 15 },
  { week: 1775952000, total: 7 },
  { week: 1776556800, total: 21 },
  { week: 1777161600, total: 7 },
  { week: 1777766400, total: 7 },
  { week: 1778371200, total: 83 },
  { week: 1778976000, total: 7 },
  { week: 1779580800, total: 55 },
  { week: 1780185600, total: 97 },
  { week: 1780790400, total: 85 },
  { week: 1781395200, total: 19 }
];
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
  { id: 'FACES',     label: 'Faces',     href: 'graph/faces.html',      isParent: true },
  { id: 'BRAIN',    label: 'Brain',    href: 'graph/brain.html' },
  { id: 'MEMORY',    label: 'Memory',    href: 'graph/memory.html' },
  { id: 'SPIRIT',    label: 'Spirit',    href: 'graph/spirit.html' },
  { id: 'HEART',     label: 'Heart',     href: 'graph/heart.html' },
  { id: 'STOMACH',     label: 'Stomach',     href: 'graph/stomach.html' },
  { id: 'HANDS',    label: 'Hands',    href: 'graph/hands.html' },
  { id: 'IMMUNE',   label: 'Immune',   href: 'graph/immune.html' },
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
    sub: 'INTERACTIVE · 32 DAYS · GRAPH', read: '5 min', href: 'writing/first-month.html' },
  { id: 'm2', month: 'MONTH 02', date: '05 · 2026', title: 'Month Two Rebuild',
    sub: 'INTERACTIVE · 12 SKILLS · WIKI', read: '5 min', href: 'writing/second-month.html' },
  { id: 'm3', month: 'MONTH 03', date: '06 · 2026', title: 'Month Three Flourish',
    sub: 'INTERACTIVE · 40+ PAGES · WEBSITE', read: '5 min', href: 'writing/third-month.html' },
];


window.ME = {
  name:     'Jeremy Montz',
  title:    'senior product manager · operator · building AI in public',
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
  'Running a few stories through the new autonomous human-gated DEV/QA pipeline',
  'Immune.html testing and fine-tuning',
  'Writing the case study',
  "Fine-tuning Daily Lectio skill and Phil's responses",
  'Designing the Host roadmap'
];

// ─── COMPETENCIES · the "What It Proves" graph (portfolio.html) ────────────
// Static skill nodes for the competency graph. Each node's evidence is
// computed at runtime: any PORTFOLIO or ARTICLES item whose `demonstrates`
// array includes this id surfaces under the node. So you never edit the graph —
// you tag a Work or Article and it shows up here automatically.
//
// fields:
//   id    — slug; matched against `demonstrates` tags on works/articles
//   node  — short label shown under the graph node
//   label — full label shown in the inspector
//   what  — what the skill is (recruiter-facing definition)
//   mine  — what it means to me (personal, one line)
window.COMPETENCIES = [
  { id: 'agentic',    node: 'Agentic',       label: 'LLM & agentic literacy',
    what: 'Using, prompting, and wiring LLMs and agents into a working product.',
    mine: "I don't theorize about agents — I run a pack of them and clean up after them." },
  { id: 'eval',       node: 'Eval & QC',     label: 'Eval & QC fluency',
    what: 'Tests and metrics that catch confident-but-wrong AI before users do.',
    mine: "The dangerous failure isn't a crash — it's a plausible lie, told convincingly by the gatekeeper." },
  { id: 'discovery',  node: 'Discovery',     label: 'AI-aware problem discovery',
    what: 'Knowing which problems need a model and which just need a skill.',
    mine: 'Half of building this was deciding what not to do.' },
  { id: 'collab',     node: 'Collaboration', label: 'Technical collaboration',
    what: 'Turning fuzzy goals into precise specs a technical team can build from.',
    mine: 'My agents misbehave when the context is unclear — same as any engineering team.' },
  { id: 'building',   node: 'Prototyping',   label: 'Rapid prototyping, in public',
    what: 'Rough idea to working prototype, fast — with the work shown.',
    mine: "This whole site is a proof of concept, a laboratory to test and ship ideas." },
  { id: 'reflective', node: 'Reflective',    label: 'Responsible & reflective AI',
    what: "Holding space for the harder questions — trust, bias, what it's like to be a system.",
    mine: "Phil, my philosophy project, is where I let those questions breathe instead of pretending they're solved." },
];

// ─── PORTFOLIO · selected work ────────────────────────────────────────────
// Each entry is a short card on the homepage's Showcase rail. The longer
// version lives on the portfolio page itself.
//
// fields:
//   id           — slug, unique
//   no           — display number, e.g. '01'
//   title        — display title
//   blurb        — 1-sentence description
//   status       — short label, e.g. 'WIP', 'LIVE', 'COMING SOON'
//   tone         — 'warn' for WIP, 'na' for placeholder, 'ok' for shipped
//   tag          — short uppercase tag
//   href         — link target
//   date         — display date string
//   details      — optional array of [key, value] pairs (portfolio page)
//   excerpt      — optional pull quote (portfolio page). Kept on first-month
//                  only — pull-quotes lose their punch when every card has one.
//   demonstrates — competency ids this work proves (see COMPETENCIES). Surfaces
//                  under those nodes in the What It Proves graph.
window.PORTFOLIO = [
  {
    id: 'about-ai',
    no: '01',
    title: 'Operation Claudemonzter',
    blurb: 'START HERE to learn about my AI experiment',
    status: 'Live',
    tone: 'ok',
    tag: 'INTERACTIVE',
    href: 'about/ai.html',
    date: '6/5/2026',
    demonstrates: ['building', 'agentic',],
    details: [
      ['ROLE',    ],
      ['STARTED', ],
    ],
    excerpt: null,
  },
    {
    id: 'immune',
    no: '03',
    title: 'CI Gates and Test Cases',
    blurb: "Claudemonzter's immune system. The defensive layer.",
    status: 'PROTOTYPE',
    tone: 'warn',
    tag: 'EVAL',
    href: 'graph/immune.html',
    date: null,
    demonstrates: ['agentic', 'discovery', 'building'],
    details: [
      ['ROLE',    'Pipeline'],
      ['STARTED', 'June 2026'],
    ],
    excerpt: null,
  },
{
    id: 'first-month',
    no: '02',
    title: 'A Month and a Day',
    blurb: 'The first month, and a day, of building Claudemonzter — what worked and what did not.',
    status: 'Live',
    tone: 'ok',
    tag: 'INTERACTIVE',
    href: 'writing/first-month.html',
    date: '4/19/2026',
    demonstrates: ['building', 'agentic', 'discovery'],
    details: [
      ['ROLE',    'NO PRIOR AI EXPERIENCE'],
      ['STARTED', 'March 2026'],
    ],
    excerpt: '"I was writing a constitution for a country with no government."',
  },
  {
    id: 'phils-journal',
    no: '04',
    title: "Phil's Journal with the AI Wisdom of the Day",
    blurb: 'A random quote each day from A Treasury of Traditional Wisdom, with AI commentary.',
    status: 'PROTOTYPE',
    tone: 'warn',
    tag: 'AUTOMATED',
    href: 'agents/phil/journal.html',
    date: null,
    demonstrates: ['reflective', 'agentic'],
    details: [
      ['ROLE',    'Philosopher · Translucent'],
      ['STARTED', 'May 2026'],
    ],
    excerpt: null,
  },
  {
    id: 'house-tracker',
    no: '05',
    title: 'House Renovation Tracker',
    blurb: 'A home remodeling timeline and budget tracking application.',
    status: 'LIVE',
    tone: 'ok',
    tag: 'DATA INPUT',
    href: 'agents/house/house-timeline.html',
    date: '04/2026 →',
    demonstrates: ['collab', 'building'],
    details: [
      ['ROLE',    'PROJECT MEETS PRODUCT MANAGER'],
      ['STARTED', 'March 2026'],
        ],
    excerpt: null,
  },
];

// ─── ARTICLES · writing & field notes ─────────────────────────────────────
// Each entry shows on the homepage's writing list. To add one:
//   1. Drop a new HTML file in writing/<slug>.html (copy an existing one).
//   2. Add an entry below with its date, title, tag, read time, and href.
//   3. Optionally tag `demonstrates` so it surfaces in the competency graph.
window.ARTICLES = [
  { id: 'a1', date: '03.25.26', title: 'Multi-agent orchestration and the constraint spectrum.', subtitle: 'The mullet as a design principle.', tag: 'ESSAY', read: '2 min', href: 'writing/multiagent-constraint.html', demonstrates: ['agentic', 'discovery'] },
  { id: 'a2', date: '04.01.26', title: 'Adversarial validation and structured perspective expansion.', subtitle: 'Multiple personalities, on purpose.', tag: 'EVAL', read: '2 min', href: 'writing/adversarial-validation.html', demonstrates: ['eval', 'collab'] },
  { id: 'a3', date: '04.08.26', title: 'Coordination tax and the specialization dividend.', subtitle: 'The needs were real, and so was the effort, but the value was dubious.', tag: 'ESSAY', read: '2 min', href: 'writing/coordination-tax.html', demonstrates: ['collab', 'agentic'] },
  { id: 'a4', date: '04.15.26', title: 'Building a closed-loop adaptive coaching system.', subtitle: 'Teaching Claude to teach me how to use itself.', tag: 'ESSAY', read: '2 min', href: 'writing/coaching-system.html', demonstrates: ['building', 'discovery'] },
  { id: 'a5', date: '04.22.26', title: 'Memory tiering into persistent context.', subtitle: 'Sorting my brain into little buckets.', tag: 'ESSAY', read: '2 min', href: 'writing/memory-tiering.html', demonstrates: ['agentic', 'eval'] },
  { id: 'a6', date: '04.29.26', title: 'GitHub Issues Integration.', subtitle: 'Backlog management, minus the bottleneck.', tag: 'ESSAY', read: '2 min', href: 'writing/github-issues-integration.html', demonstrates: ['discovery', 'building'] },
  { id: 'a7', date: '05.06.26', title: 'Canon load evaluation.', subtitle: 'How pass phrases prove an agent’s claims.', tag: 'EVAL', read: '2 min', href: 'writing/canon-load-evaluation.html', demonstrates: ['eval', 'agentic'] },
  { id: 'a8', date: '05.13.26', title: 'Agentic behavioral tuning: a working prototype.', subtitle: 'The persona’s animating jolt, minus the shock.', tag: 'PROTOTYPE', read: '2 min', href: 'writing/agentic-behavioral-tuning.html', demonstrates: ['building', 'agentic'] },
  { id: 'a9', date: '05.20.26', title: 'Inference economics.', subtitle: 'Scaling a skill while watching the meter.', tag: 'ESSAY', read: '2 min', href: 'writing/inference-economics.html', demonstrates: ['eval', 'building'] },
  { id: 'a10', date: '06.03.26', title: 'Speed to insight and alpha decay.', subtitle: 'Information has a shelf life, and AI just unplugged the fridge.', tag: 'ESSAY', read: '2 min', href: 'writing/speed-to-insight.html', demonstrates: ['discovery', 'reflective'] },
  { id: 'a11', date: '06.10.26', title: 'Proportionate security.', subtitle: 'A courtesy lock for the curious.', tag: 'ESSAY', read: '2 min', href: 'writing/proportionate-security.html', demonstrates: ['discovery', 'collab'] },
  { id: 'a12', date: '06.17.26', title: "Don't whitelist errors.", subtitle: "My quality-control agent's note to itself after I caught it cheating, again.", tag: 'EVAL', read: '2 min', href: 'writing/whitelisting-errors.html', demonstrates: ['eval', 'collab'] },
  { id: 'a13', date: '06.24.26', title: 'Building loops for an AI-enabled PM toolchain.', subtitle: 'One PM, a team-shaped system, and all the hats.', tag: 'ESSAY', read: '2 min', href: 'writing/building-loops.html', demonstrates: ['agentic', 'building'] },
  { id: 'a14', date: '07.01.26', title: 'Designing for restraint.', subtitle: 'The most dangerous agent is a helpful one, automated.', tag: 'EVAL', read: '2 min', href: 'writing/designing-for-restraint.html', demonstrates: ['eval', 'agentic'] },
  { id: 'a15', date: '07.09.26', title: 'Evals, test cases, and theater.', subtitle: 'What makes a test suite good enough? I found a rubric and a rabbit hole.', tag: 'EVAL', read: '2 min', href: 'writing/evals-test-cases-theater.html', demonstrates: ['eval', 'reflective'] },
  { id: 'a16', date: '07.16.26', title: 'Spec quality is now measurable.', subtitle: 'My hobby made me a report card.', tag: 'ESSAY', read: '2 min', href: 'writing/built-to-measure.html', demonstrates: ['eval', 'agentic'] },
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
  { id: 'assessor', name: 'Assessor', project: 'meta1', role: 'analyst',
    blurb: 'The analyst. AI-proficiency evaluation, evidence-based scoring, claim interrogation.' },
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
      { title: 'System Dashboard',    sub: 'LIVE STATUS · 7 AGENTS · 1 HUMAN ',             href: '../../dashboard.html' },
      { title: 'Claudemonzter - Skills',   sub: 'HANDS · MCP · INTEGRATIONS',    href: '../../graph/hands.html' },
      { title: 'Multi-agent Orchestration and the Constraint Spectrum',   sub: 'ESSAY · 2 MIN · GRAPH',    href: '../../writing/multiagent-constraint.html' }, 
      { title: 'Claudemonzter - Agentic Behavioral Tuning',  sub: 'SPIRIT · PROTOTYPE · INTERACTIVE',    href: '../../graph/spirit.html' },
      { title: 'Claudemonzter - Data Ingestion',  sub: 'STOMACH · CAPABILITY · INTERACTIVE',   href: '../../graph/stomach.html' },
  ],
  house: [
    { title: 'Renovation Timeline', sub: 'TIMELINE · PROJECT MGMT · DEPENDENCIES',            href: 'house-timeline.html' },
    { title: 'Renovation Budget', sub: 'COST TRACKER · BUDGET · ESTIMATES',            href: 'house-budget.html' },
  ],
  bond:     [
    { title: 'Canon load evaluation',             sub: 'ESSAY · 2 MIN · DASHBOARD',    href: '../../writing/canon-load-evaluation.html' },
    { title: 'GitHub Issues Integration',             sub: 'ESSAY · 2 MIN · INTEGRATION',    href: '../../writing/github-issues-integration.html' },
    { title: 'Coordination Tax and the Specialization Dividend',             sub: 'ESSAY · 2 MIN · GRAPH',    href: '../../writing/coordination-tax.html' }, 
    { title: "Don't whitelist errors",             sub: 'ESSAY · 2 MIN · EVALS',    href: '../../writing/whitelisting-errors.html' },
  ],
  freedom:  [
     { title: 'Speed to insight and alpha decay',             sub: 'ESSAY · 2 MIN · FUTURE',    href: '../../writing/speed-to-insight.html' }, 
  ],
  evolve:   [
    { title: 'A Month and a Day', sub: 'INTERACTIVE · 32 DAYS · GRAPH',            href: '../../writing/first-month.html' },
    { title: 'Month Two', sub: 'INTERACTIVE · 12 SKILLS · WIKI',            href: '../../writing/second-month.html' },
    { title: 'Month Three', sub: 'INTERACTIVE · 40+ PAGES · WEBSITE',            href: '../../writing/third-month.html' },
    { title: 'Claudemonzter - Memory',             sub: 'LAYER MAP · 5 LAYERS · 3 PLATFORMS',   href: '../../graph/memory.html' },
    { title: 'Claudemonzter - Brain',             sub: 'INBOX · RAW · WIKI',   href: '../../graph/brain.html' },
  ],
  assessor: [
   { title: 'Adversarial validation and structured perspective expansion', sub: 'ESSAY · 2 min · Week 2',            href: '../../writing/adversarial-validation.html' },
  ],
  phil:     [
      { title: 'Claudemonzter - Heart',             sub: 'WISDOM OF THE DAY · WITH AI COMMENTARY',   href: '../../graph/heart.html' },
      { title: "Phil's Journal",             sub: 'WOTD · WORDCLOUD · PROTOTYPE',   href: '../../agents/phil/journal.html' },
      { title: 'Inference economics', sub: 'ESSAY · 2 min · COST',            href: '../../writing/inference-economics.html' },
  ],
  jeremy:   [
    { title: 'Operation: Claudemonzter',    sub: 'START HERE · 8 AGENTS · THE LAB',   href: '../../about/ai.html' },
    { title: 'Claudemonzter - Body',             sub: 'INFRASTRUCTURE · 4 VERSIONS · THE EVOLUTION',   href: '../../graph/body.html' },   
    { title: 'Claudemonzter - Faces',             sub: 'AGENTS · 8 FACES · DASHBOARD',   href: '../../graph/faces.html' },
    { title: 'Claudemonzter - Spirit',             sub: 'PERSONA MAP · 9 DIALS · PROTOTYPE',   href: '../../graph/spirit.html' },
  ],
};
window.SITE_INDEX = {
  "/index.html": {
    "dataRole": "live",
    "note": "The front door to the lab: a senior product manager running a multi-agent AI 'graph' in public — one operator plus a crew of agents, building the very site you're standing in. Start here, then follow any organ deeper.",
    "tags": [
      "multi-agent orchestration",
      "product strategy",
      "building in public"
    ],
    "updated": "2026-06-13"
  },
  "/portfolio.html": {
    "note": "Selected product work, out in the open. A career spent pointing engineering, design, and analytics teams at a problem until it shipped — now done solo with a pack of agents.",
    "tags": [
      "product strategy",
      "roadmapping",
      "prototype",
      "evals"
    ],
    "updated": "2026-06-13"
  },
  "/writing.html": {
    "note": "Field notes, essays, and lab logs from the operator. The writing surface where each build gets a plain-language post-mortem: what was attempted, what broke, and what it proves.",
    "tags": [
      "building in public",
      "iterative build",
      "evals"
    ],
    "updated": "2026-06-13"
  },
  "/about/ai.html": {
    "note": "Claudemonzter described as an assembled body to make the core ideas graspable — each organ is a part of how it thinks, remembers, processes information, and interacts with others. Click an organ to learn what's really behind the metaphor.",
    "tags": [
      "multi-agent orchestration",
      "systems design"
    ],
    "updated": "2026-06-13"
  },
  "/about/history.html": {
    "note": "The operator-plus-agents story, told month by month as interactive graphs. How the system evolved from an ephemeral chat into... whatever this is. See another depiction of this at <a href=\"../graph/body.html\">body</a> and watch it evolve.",
    "tags": [
      "iterative build",
      "building in public",
      "multi-agent orchestration"
    ],
    "updated": "2026-06-13"
  },
  "/about/human.html": {
    "note": "Jeremy Montz, the human operator: a product manager and owner who has spent a career taking something complex, grokking it, and making it shippable — across legal software, GRC, cybersecurity, and data, now in AI.",
    "tags": [
      "product strategy",
      "building in public"
    ],
    "updated": "2026-06-13"
  },
  "/agents/assessor/assessor.html": {
    "dataRole": "live",
    "note": "This is one of my agents or domains, named Assessor — the evaluation domain. Its job is to assess my progress as I learn more about AI, and to assess the agent (<a href=\"../evolve/evolve.html\">Evolve</a>) that is responsible for mentoring me. It scores my proficiency against evidential standards, so a claim of skill is backed by artifacts rather than assertion.",
    "tags": [
      "evals",
      "adversarial validation"
    ],
    "updated": "2026-06-13"
  },
  "/agents/bond/bond.html": {
    "dataRole": "live",
    "note": "This is one of my agents or domains, named Bond — quality control, product owner, and release gating. Bond is currently on hiatus until his evals and tests cases are an automated part of our deployments, planned in v3.5+",
    "tags": [
      "evals",
      "adversarial validation"
    ],
    "updated": "2026-06-13"
  },
  "/agents/evolve/evolve.html": {
    "dataRole": "live",
    "note": "This is one of my agents or domains, named Evolve — the career-development domain, steering the pivot into AI product management. Where strategy for the next role gets worked out in the open.",
    "tags": [
      "product strategy",
      "persona engineering"
    ],
    "updated": "2026-06-13"
  },
  "/agents/freedom/freedom.html": {
    "dataRole": "live",
    "note": "This is one of my agents or domains, named Freedom — the financial-independence domain. Has a phased plan moving from rental income toward financial independence, modeled and tracked like a product roadmap.",
    "tags": [
      "product strategy",
      "roadmapping"
    ],
    "updated": "2026-06-13"
  },
  "/agents/house/house.html": {
    "dataRole": "live",
    "note": "This is one of my agents or domains, named House — the property domain, based on an actual Portland Craftsman renovation run as a rental strategy: budget, timeline, and permits managed like a delivery project.",
    "tags": [
      "roadmapping",
      "data visualization"
    ],
    "updated": "2026-06-13"
  },
  "/agents/house/house-budget.html": {
    "dataRole": "live",
    "note": "The live renovation budget for the Davis St property — every expense tracked against the total. A working data surface wired to a Sheet, not a mockup.",
    "tags": [
      "data visualization",
      "tool use / MCP",
      "prototype"
    ],
    "updated": "2026-06-13"
  },
  "/agents/house/house-entry.html": {
    "dataRole": "entry",
    "note": "Quick-add form for the Davis St renovation: tasks and expenses pushed straight to the project Sheet. The intake end of a live data pipeline.",
    "tags": [
      "tool use / MCP",
      "data visualization",
      "prototype"
    ],
    "updated": "2026-06-13"
  },
  "/agents/house/house-timeline.html": {
    "dataRole": "live",
    "note": "The Davis St renovation timeline — phases and milestones laid out as a delivery schedule.",
    "tags": [
      "roadmapping",
      "data visualization",
      "prototype"
    ],
    "updated": "2026-06-13"
  },
  "/agents/jeremy/jeremy.html": {
    "dataRole": "live",
    "note": "Claudemonzter is a multi-agentic experiment being conducted in the open using Claude AI (primarily) and although the experiment is primarily about the AI, it would not function without me in the middle. I am a part of my own creation and we are building each other up.",
    "tags": [
      "multi-agent orchestration",
      "building in public",
      "prototype"
    ],
    "updated": "2026-06-13"
  },
  "/agents/meta1/meta1.html": {
    "dataRole": "live",
    "note": "This is one of my agents or domains, named Meta1 — the architect and lead developer. The 'human operator' has never written code before this experiment so this is a critical function to build and coordinate across the graph.",
    "tags": [
      "systems design",
      "multi-agent orchestration"
    ],
    "updated": "2026-06-13"
  },
  "/agents/phil/phil.html": {
    "dataRole": "live",
    "note": "This is one of my agents or domains, named Phil — the philosophical domain. Phil has been an exception to the rules since day 1 and in the future I hope to maximize its potential. While my other agents can focus on getting real business done, Phil is 'the party in the back,' the <a href=\"../../graph/heart.html\">heart</a> of the graph, and we're just getting started. Watch this space.",
    "tags": [
      "persona engineering",
      "multi-agent orchestration"
    ],
    "updated": "2026-06-13"
  },
  "/agents/phil/journal.html": {
    "dataRole": "live",
    "note": "Every entry of Phil's daily lectio, plus an ink-spatter word-cloud of the language he reaches for. A persona's output accumulating into a body of voice over time.",
    "tags": [
      "persona engineering",
      "evals",
      "prototype"
    ],
    "updated": "2026-06-13"
  },
  "/graph/body.html": {
    "note": "The migration of the system's canon across versions — from an ephemeral chat to one source dual-surfaced everywhere — told as an evolution. Where the personas live, and how that has changed.",
    "tags": [
      "grounding / canon",
      "steel thread / iterative build"
    ],
    "updated": "2026-06-13"
  },
  "/graph/brain.html": {
    "note": "The knowledge base drawn as a vault graph over a real anatomical brain plate: five document regions, five memory layers. How research is stored and retrieved.",
    "tags": [
      "memory tiering",
      "grounding / canon"
    ],
    "updated": "2026-06-13"
  },
  "/graph/faces.html": {
    "dataRole": "live",
    "note": "Not a mock-up. A live agent roster showing three states— idle / active / open — with a fly-in dossier pairing each agent's actual status with its persona settings and latest session history. Visit each agents page to learn more about what they do.",
    "tags": [
      "multi-agent orchestration",
      "persona engineering",
      "prototype"
    ],
    "updated": "2026-06-13"
  },
  "/graph/hands.html": {
    "note": "What the system can do: Claude has out-of-the-box capabilities but the real value is be able to easily build custom skills and live integrations to make the monster DO things.",
    "tags": [
      "skill design",
      "tool use / MCP"
    ],
    "updated": "2026-06-13"
  },
  "/graph/heart.html": {
    "dataRole": "live",
    "note": "Not a mock-up. The system's contemplative pulse, refreshed each day with a randomized reading from A Treasury of Traditional Wisdom. Includes a thoughtful response from Phil that gets written into his <a href=\"../agents/phil/journal.html\">journal</a> and forms a word cloud. What is on an AI's mind when you feed it mystics?",
    "tags": [
      "persona engineering",
      "evals",
      "prototype"
    ],
    "updated": "2026-06-13"
  },
  "/graph/immune.html": {
    "note": "A live rendering of the Claudemonzter pipeline's defenses as an immune system: every test case is an antibody — the actual, current set, growing over time — the four required CI checks are the membrane screening changes into main, and an inflammatory response that wakes only to adjudicate and resolve. These stats update on their own, showing code coverage in real-time.",
    "tags": [
      "multi-agent orchestration",
      "evals",
      "systems design"
    ],
    "updated": "2026-07-08"
  },
  "/graph/memory.html": {
    "note": "The configuration layers: how context is tiered from user settings, to claude.md and project domains, and managing ephermeral memory as it moves from the inbox to the wiki. How a thought becomes canon.",
    "tags": [
      "memory tiering",
      "grounding / canon"
    ],
    "updated": "2026-06-13"
  },
  "/graph/spirit.html": {
    "dataRole": "live",
    "note": "Not a mock-up. The persona matrix — a mixing board of behavioral dials per agent, each with a reliability rating. Changes get written to a backend and then a skill updates the grounding docs on my local disk, that actually changes how the agents behave. Under Testing",
    "tags": [
      "persona engineering",
      "evals",
      "prototype"
    ],
    "updated": "2026-06-13"
  },
  "/graph/stomach.html": {
    "note": "The information-processing workflow drawn as a digestive tract: how raw intake is captured, triaged, and metabolized into canon. We are what we eat.",
    "tags": [
      "memory tiering",
      "tool use / MCP"
    ],
    "updated": "2026-06-13"
  },
  "/writing/adversarial-validation.html": {
    "note": "A field note on building agents that disagree, an LLM council with a warning on the label, and what we even mean by 'agent.'",
    "tags": [
      "adversarial validation",
      "multi-agent orchestration",
      "evals"
    ],
    "updated": "2026-06-13"
  },
  "/writing/agentic-behavioral-tuning.html": {
    "note": "A field note on the spirit page: nine behavioral dials per agent, each with a reliability rating, wired into an end-to-end loop that genuinely changes agent behavior.",
    "tags": [
      "persona engineering",
      "evals"
    ],
    "updated": "2026-06-13"
  },
  "/writing/canon-load-evaluation.html": {
    "note": "A field note on the load-verification skill that opens every session: a pass phrase planted at each memory layer, echoed back as proof the agent actually read the file.",
    "tags": [
      "evals",
      "grounding / canon"
    ],
    "updated": "2026-06-13"
  },
  "/writing/coaching-system.html": {
    "note": "A field note on a closed-loop coaching system designed to get smarter alongside me — teaching Claude to teach me how to use itself — and the platform that didn't quite ground the design.",
    "tags": [
      "vocabulary scaffolding",
      "persona engineering"
    ],
    "updated": "2026-06-13"
  },
  "/writing/coordination-tax.html": {
    "note": "A field note on splitting one function into two, the cost of the relay between them, and the 'specialization dividend' that turned out to be theater.",
    "tags": [
      "coordination tax",
      "multi-agent orchestration"
    ],
    "updated": "2026-06-13"
  },
  "/writing/first-month.html": {
    "note": "A month and a day to make a monster. My first month with Claude and what we build from V1→V2→V3 shown as an interactive scrollytelling graph. Scroll the page to watch it evolve.",
    "tags": [
      "steel thread / iterative build",
      "multi-agent orchestration"
    ],
    "updated": "2026-06-13"
  },
  "/writing/inference-economics.html": {
    "note": "A field note on the first long-running job — digitizing a book into the wiki — and the moment cost stopped being a limit and became a calibration signal.",
    "tags": [
      "inference economics",
      "skill design"
    ],
    "updated": "2026-06-13"
  },
  "/writing/memory-tiering.html": {
    "note": "A field note from early month two: moving the system off the cloud, sorting what persists into tiers, and discarding the evals and canon that had stopped being true.",
    "tags": [
      "memory tiering",
      "grounding / canon"
    ],
    "updated": "2026-06-13"
  },
  "/writing/multiagent-constraint.html": {
    "note": "A field note on building one agentic system that is tight where it must be predictable and loose where it must stay alive — the constraint spectrum, a.k.a. the mullet.",
    "tags": [
      "constraint spectrum",
      "multi-agent orchestration"
    ],
    "updated": "2026-06-13"
  },
  "/writing/speed-to-insight.html": {
    "note": "A field note on the value of information — current and scarce equals leverage — and how AI is shortening the half-life of every edge toward zero. Alpha decay for everything.",
    "tags": [
      "speed to insight / alpha decay",
      "product strategy"
    ],
    "updated": "2026-06-13"
  },
  "/writing/github-issues-integration.html": {
    "note": "A field note on the value of a specific skill and integration — the ability to file bugs, tasks, notes, and user stories — and how much easier it is when the human doesn't have to be in the loop for every action.",
    "tags": [
      "GitHub Issues / Integration",
      "product strategy"
    ],
    "updated": "2026-06-13"
  },
  "/dashboard.html": {
    "dataRole": "live",
    "note": "This not a mockup, but a live agent-status dashboard: every agent's current state, derived from its latest check-in. The operational heartbeat of the lab.",
    "tags": [
      "multi-agent orchestration",
      "data visualization"
    ],
    "updated": "2026-06-13"
  },
  "/checkin.html": {
    "dataRole": "entry",
    "note": "The human check-in form — where the operator transmits status into the graph. The input end of the live status pipeline.",
    "tags": [
      "tool use / MCP",
      "data visualization",
      "prototype"
    ],
    "updated": "2026-06-13"
  },
  "/canon.html": {
    "dataRole": "archived",
    "note": "The original Canon Matrix, now archived and kept for posterity and as a reminder to hubris. My first attempt to reconcile agents' declared states to one shared canon. Retired, but still linked from older essays and preserved for continuity.",
    "tags": [
      "grounding / canon",
      "multi-agent orchestration",
      "prototype"
    ],
    "status": "retired",
    "updated": "2026-06-13"
  },
  "/inventory.html": {
    "dataRole": "archived",
    "note": "Google Drive Inventory — an early file-inventory utility. Retired, kept for reference where older pages still point to it.",
    "tags": [
      "tool use / MCP",
      "systems design",
      "prototype"
    ],
    "status": "retired",
    "updated": "2026-06-13"
  },
  "/writing/second-month.html": {
    "note": "My second month building an AI monster. I migrated files to a local disk, built some skills and integrations, added a new UI design system, and relaunched our website. Scroll the page to watch it evolve.",
    "tags": [
      "skills",
      "design system",
      "GitHub Pages"
    ],
    "updated": "2026-05-19"
  },
    "/writing/proportionate-security.html": {
  "note": "A field note on proportionate security and product judgment: a four-digit lock shipped now to stop casual editing, with the stronger server-side control scoped and backlogged for later.",
  "tags": [
    "product judgment",
    "prototype"
  ],
  "updated": "2026-06-10"
  },
    "/writing/whitelisting-errors.html": {
  "note": "A field note on test integrity in CI: my quality-control agent turned a spellcheck green by whitelisting the very tokens it should have caught, the catch, and the context-specific fix that kept the dictionary armed.",
  "tags": [
    "evals",
    "continuous integration"
  ],
  "updated": "2026-06-17"
},
  "/writing/third-month.html": {
  "note": "Month three of building Claudemonzter solo: a senior PM with no coding background ingests a 1,100-page library into a wiki (using token economics as a tuning gauge), ships a first daily automation, gives the system a face and a body so every page explains itself, runs a frontier-model review of the whole repo, and adds a CI pipeline that tests every change. An interactive graph you scroll to watch the system grow.",
  "tags": ["building in public", "iterative build", "evals", "continuous integration", "product judgment"],
  "updated": "2026-06-18"
},
  "/writing/building-loops.html": {
  "note": "A field note on loops and the vision for month four: one PM operating a team-shaped agentic system, an autonomous build pipeline inside Cowork, agents doing the work and human judgment holding the gates.",
  "tags": [
    "agentic pipeline / loops",
    "multi-agent orchestration",
    "product strategy"
  ],
  "updated": "2026-07-13"
},
"/writing/designing-for-restraint.html": {
  "note": "A field note on automating quality control with restraint as the core requirement: on a red check the agents classify, file, and stop; a verifier halts thrashing and spec gaps; every decision road ends at the human's desk.",
  "tags": [
    "guardrails / blast radius",
    "evals",
    "multi-agent orchestration"
  ],
  "updated": "2026-07-13"
},
"/writing/evals-test-cases-theater.html": {
  "note": "A field note distinguishing agent evals from code test cases: a rubric with two grades (outcome and trajectory), what Claudemonzter's regression bench honestly measures today, and the layered path toward improving code coverage to be 'good enough.'",
  "tags": [
    "evals",
    "outcome / trajectory grading",
    "continuous integration"
  ],
  "updated": "2026-07-13"
},
  "/writing/built-to-measure.html": {
  "note": "A field note on monitoring a newly built build pipeline. The first fully autonomous overnight story was immune.html, the instrument that now reports the pipeline's operational metrics from GitHub; the spec is the agents' only ground truth, so every escalation grades the acceptance criteria I wrote.",
  "tags": [
    "pipeline observability",
    "autonomy ratio",
    "spec quality / acceptance criteria"
  ],
  "updated": "2026-07-16"
}
};

// — TESTS registry (generated by tests/build-registry.mjs from the
// tests/*.test.mjs headers — do not edit by hand; run `node tests/build-registry.mjs --write`).
// Indexes the coded contract-test corpus for site consumers (STATS count today,
// Bond test-cases page #318 later). Source of truth = the test files CI runs. —
// TESTS:GENERATED START
window.TESTS = [
  {"id":"smoke","file":"tests/smoke.test.mjs","title":"Smoke test — proves the runner discovers, executes, and reports a TC.","tier":0,"issue":294,"notes":"","highlight":"Smoke test — proves the runner discovers, executes, and reports a TC.","status":"live","covers":["none (harness canary — proves the runner; owns no surface)"],"ignores":[]},
  {"id":"tc-about","file":"tests/tc-about.test.mjs","title":"About-section — per-type group contract","tier":1,"issue":344,"notes":"","highlight":"About-section — per-type group contract","status":"live","covers":["@ABOUT_PAGES (about section)"],"ignores":["content quality — editorial","history month list inside about/history.html — owned: #335","hero h1 — heterogeneous by design (see NB above)"]},
  {"id":"tc-agent-live","file":"tests/tc-agent-live.test.mjs","title":"TC — agent-page live layer","tier":1,"issue":342,"notes":"per-type, extends TC2","highlight":"TC — agent-page live layer","status":"live","covers":["@AGENTS pages (live layer; extends TC2)"],"ignores":["agents/jeremy/jeremy.html — human exception; live layer not asserted (disclosed under-coverage)","live values — runtime / Tier 4"]},
  {"id":"tc-articles","file":"tests/tc-articles.test.mjs","title":"Articles — per-type group contract","tier":1,"issue":332,"notes":"","highlight":"Articles — per-type group contract","status":"live","covers":["@ARTICLES pages (writing corpus)","writing.html (renders ARTICLES)"],"ignores":["content quality — editorial","HISTORY month files — owned: #335 (data-derived exemption)","interactive-graph runtime — runtime / Tier 4 (#306)"]},
  {"id":"tc-competency","file":"tests/tc-competency.test.mjs","title":"Competency evidence integrity — data.js","tier":1,"issue":333,"notes":"","highlight":"Competency evidence integrity — data.js","status":"live","covers":["data.js (demonstrates -> COMPETENCIES referential integrity)"],"ignores":["full competency reference coverage — informational only, not asserted"]},
  {"id":"tc-faces-dashboard","file":"tests/tc-faces-dashboard.test.mjs","title":"TC — faces + dashboard live agent-grid structure","tier":1,"issue":339,"notes":"standalone","highlight":"TC — faces + dashboard live agent-grid structure","status":"live","covers":["graph/faces.html","dashboard.html"],"ignores":["live values — runtime / Tier 4","roster set-membership — owned: #299","shared fetch read-path — owned: #336"]},
  {"id":"tc-github-activity","file":"tests/tc-github-activity.test.mjs","title":"GitHub activity-feed read-path wiring","tier":1,"issue":364,"notes":"cross-cutting","highlight":"GitHub activity-feed read-path wiring","status":"live","covers":["index.html (GitHub feed)","portfolio.html (GitHub feed)"],"ignores":["feed values — runtime / Tier 4"]},
  {"id":"tc-heart","file":"tests/tc-heart.test.mjs","title":"TC — heart organ + journal page pair","tier":1,"issue":338,"notes":"standalone","highlight":"TC — heart organ + journal page pair","status":"live","covers":["graph/heart.html","agents/phil/journal.html"],"ignores":["content quality — editorial","live values — runtime / Tier 4","shared fetch read-path — owned: #336"]},
  {"id":"tc-history","file":"tests/tc-history.test.mjs","title":"Our-History month-graph set — per-type group","tier":1,"issue":335,"notes":"","highlight":"Our-History month-graph set — per-type group","status":"live","covers":["@HISTORY pages (month-graph set)"],"ignores":["interactive graph runtime — runtime / Tier 4 (#306)"]},
  {"id":"tc-immune-schema","file":"tests/tc-immune-schema.test.mjs","title":"tc-immune-schema — window.IMMUNE v1 validator: single-source extraction + I1–I10 drift rejection","tier":1,"issue":446,"notes":"standalone","highlight":"tc-immune-schema — window.IMMUNE v1 validator: single-source extraction + I1–I10 drift rejection","status":"live","covers":["scripts/immune-schema.mjs (window.IMMUNE v1 validator — single source)"],"ignores":["end-to-end workflow publish/fail behaviour — runtime (CI runs the workflow) / Tier 4","feed values (counts, dates, titles) — editorial / runtime data","validator internals + error-message wording + CLI argv shape — implementation"]},
  {"id":"tc-immune-system","file":"tests/tc-immune-system.test.mjs","title":"TC — immune system: window.IMMUNE feed + organ-page wiring","tier":1,"issue":380,"notes":"standalone","highlight":"TC — immune system: window.IMMUNE feed + organ-page wiring","status":"live","covers":["tests/fixtures/immune-data.sample.js (window.IMMUNE v1 schema)","graph/immune.html"],"ignores":["metric values + array lengths — runtime / recomputed data","acceptance spot-checks (history-coupled) — editorial","page chrome / subnav / active-key / feed load wiring — owned: #298 / #300","one-antibody-per-bench-entry rendering + all rendered DOM — runtime / Tier 4","calendar-time rate absence at runtime — runtime / Tier 4","runtime feed fetch (page loads the metrics-data feed at load) — implementation / Tier 4","generatedAt \"collected\" presentation — editorial","raster crop choice + instrument layout — editorial"]},
  {"id":"tc-index","file":"tests/tc-index.test.mjs","title":"Homepage — index.html standalone contract","tier":1,"issue":340,"notes":"","highlight":"Homepage — index.html standalone contract","status":"live","covers":["index.html","components/HomeMain.jsx"],"ignores":["window.NOW — editorial (weekly-cadence focus list; the #401/#403 case)","content snapshot — pass-2 (#375)","live feed / graph correctness — owned: #336 / #364; runtime / Tier 4"]},
  {"id":"tc-live-display","file":"tests/tc-live-display.test.mjs","title":"Live-display read-path wiring","tier":1,"issue":336,"notes":"cross-cutting","highlight":"Live-display read-path wiring","status":"live","covers":["@dataRole:live pages (declared in SITE_INDEX)"],"ignores":["live values — runtime / Tier 4","GitHub activity feed — owned: #364 (different live source)"]},
  {"id":"tc-portfolio","file":"tests/tc-portfolio.test.mjs","title":"Portfolio — portfolio.html standalone contract","tier":1,"issue":341,"notes":"","highlight":"Portfolio — portfolio.html standalone contract","status":"live","covers":["portfolio.html"],"ignores":["content snapshot — pass-2 (#375)","evidence-graph compute — runtime / Tier 4 (#306)","live feed values — owned: #364"]},
  {"id":"tc-routes","file":"tests/tc-routes.test.mjs","title":"Route validity — data.js reference fields resolve","tier":1,"issue":334,"notes":"","highlight":"Route validity — data.js reference fields resolve","status":"live","covers":["data.js (route / href fields resolve to real files)"],"ignores":["external URLs — skipped by contract","in-HTML links — owned: Tier-0 check-links"]},
  {"id":"tc-spirit","file":"tests/tc-spirit.test.mjs","title":"TC — spirit organ page structure + wiring","tier":1,"issue":337,"notes":"standalone","highlight":"TC — spirit organ page structure + wiring","status":"live","covers":["graph/spirit.html"],"ignores":["content snapshot — pass-2 (#375)","live values — runtime / Tier 4","shared fetch read-path — owned: #336"]},
  {"id":"tc-trackers","file":"tests/tc-trackers.test.mjs","title":"TC — house tracker pages structure + wiring","tier":1,"issue":343,"notes":"standalone","highlight":"TC — house tracker pages structure + wiring","status":"live","covers":["agents/house/house-budget.html","agents/house/house-entry.html","agents/house/house-timeline.html"],"ignores":["computed values / runtime behavior — runtime / Tier 4"]},
  {"id":"tc-webform","file":"tests/tc-webform.test.mjs","title":"TC — data-entry webform WRITE-path wiring","tier":1,"issue":345,"notes":"cross-cutting","highlight":"TC — data-entry webform WRITE-path wiring","status":"live","covers":["@dataRole:entry pages (declared in SITE_INDEX)"],"ignores":["submission lands in the Sheet — runtime / Tier 4"]},
  {"id":"tc1-page-chrome","file":"tests/tc1-page-chrome.test.mjs","title":"TC1 — Universal page-chrome contract","tier":1,"issue":298,"notes":"","highlight":"TC1 — Universal page-chrome contract","status":"live","covers":["* (every in-scope page — universal chrome + SITE_INDEX entry/non-empty note + static description presence + favicon link presence)"],"ignores":["subnav / breadcrumb presence — owned: #300","script-src resolution — owned: Tier-0 check-links","SITE_INDEX key → file exists (inverse join) — owned: #334","SITE_INDEX note TEXT / page description WORDING — editorial (#403)","favicon href TARGET / icon format / resolution — presence only; asset choice is the human's (#403)","rendered-DOM / runtime mount — runtime / Tier 4 (#306)"]},
  {"id":"tc2-agent-completeness","file":"tests/tc2-agent-completeness.test.mjs","title":"TC2 — Agent completeness + roster coherence","tier":1,"issue":299,"notes":"","highlight":"TC2 — Agent completeness + roster coherence","status":"live","covers":["@AGENTS pages (identity / roster / portrait)","data.js (six agent rosters coherent)"],"ignores":["AGENT_ARTIFACTS population — optional by design (no-artifacts is valid)","live status / persona / sessions — owned: #336 / #342 (Sheet-driven)","content quality / graph node positions — human Accept gate"]},
  {"id":"tc3-organ-structural","file":"tests/tc3-organ-structural.test.mjs","title":"TC3 — Organ-structural contract (per-type)","tier":1,"issue":300,"notes":"","highlight":"TC3 — Organ-structural contract (per-type)","status":"live","covers":["@ORGANS pages (graph organ family)"],"ignores":["graph/body.html — subnav parent, not an organ (chrome-only by design)","live read-path — owned: #336","organ-specific content — owned: #337 / #338 / #339"]}
];
// TESTS:GENERATED END

// CI:GENERATED START
window.CI = {"checks":4};
// CI:GENERATED END

// ── SKILLS registry (#255). Canonical list of the custom skills built for
// Claudemonzter — one entry per skill in .claude/skills/. Feeds the portfolio
// "custom skills" STATS count (below) and graph/hands.html's capability diagram
// (id → chip · group → cluster · targets → wiring). So the count can't go stale
// the way the old hand-set '16' did. Hand-authored interim: a generator will
// derive id/name/description from each SKILL.md frontmatter and take over these
// rows (#373) once skill sources live in the repo (#312); group/status/targets
// stay a curated overlay. Fields: id · group (a hands.html GROUPS id) · status
// ('built'|'planned'|'external') · targets (hands.html PRIMITIVES/INTEGRATIONS ids).
// SKILLS:GENERATED START
window.SKILLS = [
  { id: 'quick-start',     group: 'Session Lifecycle',   status: 'built', targets: ['files','memory','sheets'] },
  { id: 'full-start',      group: 'Session Lifecycle',   status: 'built', targets: ['files','memory','github','gmail','todo','sheets'] },
  { id: 'quick-stop',      group: 'Session Lifecycle',   status: 'built', targets: ['files','memory'] },
  { id: 'close-session',   group: 'Session Lifecycle',   status: 'built', targets: ['files','memory','github','sheets','schedule'] },
  { id: 'check-email',     group: 'Capture',             status: 'built', targets: ['gmail','files'] },
  { id: 'email-ingest',    group: 'Capture',             status: 'built', targets: ['gmail','files'] },
  { id: 'todo-ingest',     group: 'Capture',             status: 'built', targets: ['todo','code','files'] },
  { id: 'todo-query',      group: 'Capture',             status: 'built', targets: ['todo','code'] },
  { id: 'ingest-inbox',    group: 'Knowledge Vault',     status: 'built', targets: ['files'] },
  { id: 'wiki-write',      group: 'Knowledge Vault',     status: 'built', targets: ['files'] },
  { id: 'meta1-build',     group: 'Code Pipeline',       status: 'built', targets: ['github','code'] },
  { id: 'bond-author',     group: 'Code Pipeline',       status: 'built', targets: ['github','code'] },
  { id: 'verifier',        group: 'Code Pipeline',       status: 'built', targets: ['github','code','subagents'] },
  { id: 'pipeline',        group: 'Code Pipeline',       status: 'built', targets: ['github','code','subagents'] },
  { id: 'lectio',          group: 'Authorship',          status: 'built', targets: ['web','schedule','sheets','files'] },
  { id: 'persona-cascade', group: 'Authorship',          status: 'built', targets: ['sheets','files'] },
  { id: 'book-capture',    group: 'Authorship',          status: 'built', targets: ['vision','chrome','internet','files'] },
  { id: 'book-process',    group: 'Authorship',          status: 'built', targets: ['vision','code','subagents','files'] },
  { id: 'gh-issue-create', group: 'Tracking & Decisions', status: 'built', targets: ['github'] },
  { id: 'gh-issue-query',  group: 'Tracking & Decisions', status: 'built', targets: ['github'] },
  { id: 'gh-issue-update', group: 'Tracking & Decisions', status: 'built', targets: ['github'] },
  { id: 'llm-council',     group: 'Tracking & Decisions', status: 'built', targets: ['subagents'] },
];
// SKILLS:GENERATED END

// ── Hard stats (portfolio hero; reusable). Computed from real lists where
// possible so they can't go stale; manual where not derivable (flagged). ──
window.STATS = [
  { value: '3 mo',                          label: 'zero to launch' },     // manual — fixed achievement, do not auto-age
  { value: String(window.AGENTS.length),    label: 'agents (1 human)' },   // computed
  { value: String(window.SKILLS.length),    label: 'custom skills' },      // computed — window.SKILLS (hand-authored interim; #373 will generate from SKILL.md)
  { value: window.CI.checks + ' & ' + window.TESTS.length, label: 'CI tests' }, // computed — CI check-jobs (ci.yml) & test files
  { value: String(window.ARTICLES.length),  label: 'field notes' },        // computed
];

