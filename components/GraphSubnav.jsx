// GraphSubnav.jsx — shared body-part-organ subnav for graph pages
//
// Renders the strip across dashboard.html and the organ pages (heart, memory,
// spirit, body, future organs). Reads window.ORGANS from data.js as single
// source of truth for the organ TABS — adding a new organ to that list
// automatically surfaces it on every existing page.
//
// The strip now LEADS with a "Body" breadcrumb (the graph section's overview
// page, graph/body.html), followed by a faint "›" separator and the organ
// tabs. This replaces the old static, grayed "GRAPH ›" label: Body is a real,
// clickable, active-aware link styled like the other breadcrumbs. The top-nav
// "GRAPH" item remains the section parent and is unaffected.
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
//   (body.html passes active="BODY" to light the lead breadcrumb.)
//
// Each Babel script tag gets its own scope, so _SITE_BASE is re-detected
// here. Same pattern HomeShell.jsx uses — pages load data.js with the
// correct relative path; we read that prefix to resolve hrefs.

const _GS_SITE_BASE = (() => {
  const tag = document.querySelector('script[src$="data.js"]');
  if (tag) return tag.getAttribute('src').replace('data.js', '');
  return '';
})();

const GraphSubnav = ({ active }) => {
  const organs = window.ORGANS || [];
  return (
    <div className="graph-subnav">
      <a
        href={_GS_SITE_BASE + 'graph/body.html'}
        className={active === 'BODY' ? 'active' : ''}
      >
        Body
      </a>
      <span className="graph-subnav-label">›</span>
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
