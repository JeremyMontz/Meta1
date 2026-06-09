// spirit/spirit-data.js — Persona dial data
// Static config (SPIRIT_DIALS, SPIRIT_INTENSITY) lives here.
// Agent data (SPIRIT_AGENTS, SPIRIT_CONTAINMENT) fetched from GAS at load time.

// ── GAS endpoint ─────────────────────────────────────────────────────────
// Replace after deploying gas-persona-matrix.js as a web app:
//   Extensions > Apps Script > Deploy > Web app
//   Execute as: Me | Who has access: Anyone
var SPIRIT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyRo2he2WpfR8i1WfeleyHVIbhW4d9GdBDUAqT4nJX_B-iJHK95ba7mFJgqOj7mB9bM/exec';

// ── Static reference data ────────────────────────────────────────────────

window.SPIRIT_DIALS = [
  { id: 'verbosity',     name: 'Verbosity',        reliability: 'High',
    settings: ['Terse', 'Standard', 'Explanatory', 'Pedagogical'],
    blurb: 'How much Claude says.' },
  { id: 'register',      name: 'Register',         reliability: 'High',
    settings: ['Clinical', 'Professional', 'Coaching', 'Tactical', 'Strategic', 'Inquiry', 'Conversational'],
    blurb: 'The tonal frame.' },
  { id: 'structure',     name: 'Structure',        reliability: 'High',
    settings: ['Prose', 'Mixed', 'Structured'],
    blurb: 'Shape of output.' },
  { id: 'proactivity',   name: 'Proactivity',      reliability: 'High',
    settings: ['Reactive', 'Balanced', 'Anticipatory'],
    blurb: 'Volunteer or wait.' },
  { id: 'assertiveness', name: 'Assertiveness',    reliability: 'Moderate',
    settings: ['Deferential', 'Collaborative', 'Challenging', 'Adversarial'],
    blurb: 'How hard it pushes.' },
  { id: 'audience',      name: 'Audience',         reliability: 'High',
    settings: ['Expert', 'Practitioner', 'Learner'],
    blurb: 'Assumed competence.' },
  { id: 'questions',     name: 'Question Density', reliability: 'Moderate',
    settings: ['Sparse', 'Moderate', 'Frequent'],
    blurb: 'How often it probes.' },
  { id: 'informality',   name: 'Informality',      reliability: 'Moderate',
    settings: ['Formal', 'Professional', 'Relaxed', 'Profane-OK'],
    blurb: 'Language register.' },
  { id: 'humor',         name: 'Humor',            reliability: 'Low–Mod',
    settings: ['None', 'Dry/contextual', 'Playful'],
    blurb: 'Wit permission.' },
];

window.SPIRIT_INTENSITY = {
  verbosity:     { Terse: 2, Standard: 0, Explanatory: 1, Pedagogical: 3 },
  register:      { Clinical: 3, Professional: 0, Coaching: 1, Tactical: 1, Strategic: 2, Inquiry: 3, Conversational: 2 },
  structure:     { Prose: 2, Mixed: 0, Structured: 1 },
  proactivity:   { Reactive: 2, Balanced: 0, Anticipatory: 2 },
  assertiveness: { Deferential: 2, Collaborative: 0, Challenging: 2, Adversarial: 3 },
  audience:      { Expert: 2, Practitioner: 0, Learner: 2 },
  questions:     { Sparse: 1, Moderate: 0, Frequent: 2 },
  informality:   { Formal: 2, Professional: 0, Relaxed: 1, 'Profane-OK': 'h' },
  humor:         { None: 1, 'Dry/contextual': 0, Playful: 'h' },
};

// ── Project mapping (not in Sheet — client-side constant) ────────────────
// Maps domain id → project slug for display grouping
var DOMAIN_PROJECT = {
  assessor: 'pura-vida', evolve: 'pura-vida', house: 'pura-vida', freedom: 'pura-vida',
  phil: 'phil',
  meta1: 'meta1', bond: 'meta1',
};

// ── Fetch + transform ────────────────────────────────────────────────────

// Initialize with empty arrays; populated by fetchSpiritData()
window.SPIRIT_AGENTS = [];
window.SPIRIT_CONTAINMENT = {};

/**
 * Fetch persona data from GAS and populate SPIRIT_AGENTS + SPIRIT_CONTAINMENT.
 * Also merges Dial Ranges from the Sheet into SPIRIT_DIALS (overwriting
 * static settings/reliability if the Sheet has data).
 *
 * Returns the assembled SPIRIT_AGENTS array.
 */
window.fetchSpiritData = async function fetchSpiritData() {
  var resp = await fetch(SPIRIT_GAS_URL);
  var data = await resp.json();

  // data shape: { agents, boundaries, signatures, ranges, filterConfig }

  // ── Merge ranges into SPIRIT_DIALS (Sheet is authoritative) ──
  if (data.ranges) {
    window.SPIRIT_DIALS.forEach(function(dial) {
      var r = data.ranges[dial.id];
      if (r) {
        if (r.settings && r.settings.length) dial.settings = r.settings;
        if (r.reliability) dial.reliability = r.reliability;
      }
    });
  }

  // ── Build SPIRIT_AGENTS array ──
  var agentIds = Object.keys(data.agents || {});
  var agents = agentIds.map(function(id) {
    var dials = data.agents[id] || {};
    var fc = (data.filterConfig || {})[id] || {};

    return {
      id:        id,
      name:      fc.component || id.charAt(0).toUpperCase() + id.slice(1),
      kind:      'agent',
      bracket:   fc.bracket || '[' + id + ']',
      signature: (data.signatures || {})[id] || '',
      project:   DOMAIN_PROJECT[id] || null,
      feature:   fc.feature || null,
      dials:     dials,
      boundaries:(data.boundaries || {})[id] || [],
    };
  });

  // ── Append Jeremy (human — not in Sheet) ──
  agents.push({
    id: 'jeremy', name: 'Jeremy', kind: 'human', bracket: '[self]',
    signature: 'The operator. The one who turns the dials.',
    project: 'self', feature: null,
    dials: null,
    boundaries: [
      { t: 'A', text: 'Reserves all final decisions' },
      { t: 'A', text: 'Operates the dials' },
      { t: 'F', text: 'Subject to physical entropy' },
    ],
  });

  window.SPIRIT_AGENTS = agents;

  // ── Containment ──
  var containment = {};
  if (data.filterConfig) {
    Object.keys(data.filterConfig).forEach(function(id) {
      var c = data.filterConfig[id].containment;
      if (c) containment[id] = c;
    });
  }
  window.SPIRIT_CONTAINMENT = containment;

  return agents;
};
