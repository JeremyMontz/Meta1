// brain-data.js — Claudemonzter's "brain": a local Obsidian vault of markdown,
// after Karpathy's LLM-wiki pattern, with one original addition — an Extended brain
// that reaches past the local disk.
//
// FIVE REGIONS. Four live inside the skull (the vault); one reaches beyond it.
// No counts, no layer numbers — multitudes are conveyed visually, not numerically.
// Region color tokens resolve against design-system/colors_and_type.css.

window.BRAIN = {
  thesis:
    'Claudemonzter has a brain on its own computer, a vault of markdown files on a local disk — raw sources, a synthesized wiki, and the ' +
    'skills that run it — plus a reach that extends into online canonical resources like our GitHub repo, Google account, and more.',
  vaultRoot: '~/vault',
};

// Display order: surface/incoming → distilled core, then the extended reach.
window.BRAIN_LEVELS = [
  {
    key: 'inbox',
    name: 'Inbox',
    token: 'var(--candle)',
    group: 'vault',
    kind: 'incoming',
    folder: '~/vault/inbox/',
    desc: 'New arrivals, unfiled. Quick captures waiting to be sorted into Raw and/or written up in the Wiki.',
    scale: 'always shifting',
    examples: ['session briefs', 'undigested items'],
    echo: null,
  },
  {
    key: 'raw',
    name: 'Raw',
    token: 'var(--info)',
    group: 'vault',
    kind: 'immutable',
    folder: '~/vault/raw/',
    desc: 'Original source material — web clippings, PDFs, transcripts. Captured once, never edited.',
    scale: 'the deep archive',
    examples: ['clippings/*.md', 'pdf/*.pdf', 'transcripts/*.md'],
    echo: 'Source',
  },
  {
    key: 'wiki',
    name: 'Wiki',
    token: 'var(--err)',
    group: 'vault',
    kind: 'synthesized',
    folder: '~/vault/wiki/',
    desc: 'The living, written knowledge — concept and entity pages, densely wikilinked.',
    scale: 'a growing web of connections',
    examples: ['[[concept]].md', '[[entity]].md', 'index.md'],
    echo: 'Wiki',
  },
  {
    key: 'project',
    name: 'Grounding Docs',
    token: 'var(--accent)',
    group: 'vault',
    kind: 'schema',
    folder: '~/vault/**/CLAUDE.md',
    desc: 'The operating schema — context, project, and domain rules that tell the brain how to run.',
    scale: 'a small, tight core',
    examples: ['CLAUDE.md', 'ABOUT-ME.md', 'MY-VOICE.md', 'Index.md'],
    echo: 'Schema',
  },
  {
    key: 'extended',
    name: 'External Stimuli',
    token: 'var(--ok)',
    group: 'extended',
    offDisk: true,
    kind: 'networked',
    folder: 'off-disk · networked',
    desc: 'Reachable, not resident. Other surfaces that are part of the knowledge base but never stored on the local disk.',
    scale: 'as wide as the net',
    surfaces: [
      { name: 'GitHub', glyph: 'repos · issues' },
      { name: 'Google Drive', glyph: 'docs · sheets' },
      { name: 'Gmail', glyph: 'threads' },
      { name: 'MS To-Do', glyph: 'tasks' },
    ],
    extExt: 'and past them, the open internet',
    echo: null,
  },
];

// The boundary that gives the Extended brain meaning.
window.BRAIN_BOUNDARY = {
  label: 'the local disk',
  note: 'The skull. Inside is the vault — yours, offline, versioned. Outside is everything you can still reach.',
};

// Memory layers, restored as static PINS (no hover). Colors deviate from memory.html.
// Positions are fractions of the brain plate image (facing right).
window.BRAIN_MEMORY = [
  { id: 1, name: 'Identity',       token: 'var(--accent)', f: [0.415, 0.855], desc: 'Who am I — personality, rules, tone.' },
  { id: 2, name: 'Context',        token: 'var(--accent)', f: [0.515, 0.695], desc: 'Calibration data, not instructions.' },
  { id: 3, name: 'Project',        token: 'var(--accent)', f: [0.525, 0.600], desc: 'Operating manual for a codebase.' },
  { id: 4, name: 'Agent · Domain', token: 'var(--candle)', f: [0.548, 0.515], desc: 'Conditional config per role.' },
  { id: 5, name: 'Session',        token: 'var(--ok)',     f: [0.598, 0.485], desc: 'Active goals, blockers, state.' },
];
