// components/spirit-card.jsx — Shared persona (Spirit) card renderer.
//
// Drop-in for agent profile pages. Replaces the per-page persona fetch+render
// boilerplate. Sibling to components/agent-card.js (the status card).
//
// Requires, loaded BEFORE this script:
//   - React + ReactDOM + Babel (page CDN includes)
//   - graph/spirit-data.js   (window.fetchSpiritData, window.SPIRIT_AGENTS)
//   - graph/spirit-dials.jsx
//   - graph/spirit-embed.jsx (window.PersonaCard)
// Requires on the page:
//   - window.AGENT_ID set to the agent's id (e.g. "meta1")
//   - a mount element with id="personaCard"
//
// Renders the matching agent's PersonaCard. One include per page; update the
// wiring here once and every agent page follows.

(async () => {
  const mount = document.getElementById('personaCard');
  if (!mount) return;
  try {
    await window.fetchSpiritData();
    const agent = (window.SPIRIT_AGENTS || []).find(a => a.id === window.AGENT_ID);
    if (agent && window.PersonaCard) {
      mount.innerHTML = '';
      ReactDOM.createRoot(mount).render(
        React.createElement(window.PersonaCard, {
          agent: agent,
          rev: '—',
          lastSync: 'live',
          hyde: true,
        })
      );
    } else {
      mount.innerHTML = '<div class="card-loading">No persona on file.</div>';
    }
  } catch (e) {
    mount.innerHTML = '<div class="card-loading">Could not load persona</div>';
  }
})();
