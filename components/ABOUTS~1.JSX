// AboutSubnav.jsx — shared breadcrumb subnav for the ABOUT section
//
// Renders the strip across the about pages (human, ai, history, future).
// Reads window.ABOUT_PAGES from data.js as single source of truth — adding
// a new about page to that list automatically surfaces it on every page.
//
// Mirrors components/GraphSubnav.jsx. Per the Jekyll/Hyde theming principle,
// this component owns STRUCTURE and DATA only. Visual treatment (colors,
// hover, active indicator, padding) stays in each page's <style> block via
// the .about-subnav class set, so each page can theme to its own register.
//
// Renders as:  About:  The Human / The AI / Our History
//
// Usage:
//   <div id="about-subnav-mount"></div>
//   ReactDOM.createRoot(document.getElementById('about-subnav-mount'))
//     .render(<AboutSubnav active="HUMAN" />);
//
// Each Babel script tag gets its own scope, so _SITE_BASE is re-detected here
// (same pattern HomeShell.jsx / GraphSubnav.jsx use).

const _AS_SITE_BASE = (() => {
  const tag = document.querySelector('script[src*="data.js"]');
  if (tag) return tag.getAttribute('src').replace(/data\.js.*$/, '');
  return '';
})();

const AboutSubnav = ({ active }) => {
  const pages = window.ABOUT_PAGES || [];
  if (pages.length === 0) return null;
  return (
    <div className="about-subnav">
      <span className="about-subnav-label">About:</span>
      {pages.map((p, i) => (
        <React.Fragment key={p.id}>
          {i > 0 && <span className="about-subnav-sep">/</span>}
          <a
            href={_AS_SITE_BASE + p.href}
            className={p.id === active ? 'active' : ''}
          >
            {p.label}
          </a>
        </React.Fragment>
      ))}
    </div>
  );
};
