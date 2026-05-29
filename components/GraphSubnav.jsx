// GraphSubnav.jsx — shared body-part-organ subnav for graph pages
//
// Renders the strip across dashboard.html and the organ pages (heart, memory,
// spirit, future organs). Reads window.ORGANS from data.js as single source
// of truth — adding a new organ to that list automatically surfaces it on
// every existing page.
//
// Per the Jekyll/Hyde theming principle, this component owns STRUCTURE and
// DATA only. Visual treatment (colors, hover, active indicator, padding mood)
// stays in each page's <style> block via the .graph-subnav class set so each
// page can theme it to its own register (lab / cabinet / etc.).
//
// Usage:
//   <div id="graph-subnav-mount"></div>
//   ...
//   ReactDOM.createRoot(document.getElementById('graph-subnav-mount'))
//     .render(<GraphSubnav active="SPIRIT" />);
//
// Each Babel script tag gets its own scope, so _SITE_BASE is re-detected
// here. Same pattern HomeShell.jsx uses — pages load data.js with the
// correct relative path; we read that prefix to resolve organ hrefs.

const _GS_SITE_BASE = (() => {
  const tag = document.querySelector('script[src$="data.js"]');
  if (tag) return tag.getAttribute('src').replace('data.js', '');
  return '';
})();

const GraphSubnav = ({ active }) => {
  const organs = window.ORGANS || [];
  if (organs.length === 0) return null;
  return (
    <div className="graph-subnav">
      <span className="graph-subnav-label">GRAPH ›</span>
      {organs.map((o) => (
        <a
          key={o.id}
          href={_GS_SITE_BASE + o.href}
          className={o.id === active ? 'active' : ''}
        >
          {o.label}
        </a>
      ))}
    </div>
  );
};
