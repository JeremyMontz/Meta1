// HomeShell.jsx — shared layout atoms (TopNav, Footer, ContactRow, Mascot).
// Agent status cards are NOT defined here — the shared renderer lives in
// components/agent-card.js and is used identically by index.html,
// dashboard.html, and the agent pages.
// ── Auto-detect site root ──────────────────────────────────────────────
// Every page loads data.js with the correct relative path. We extract
// that path prefix so all components resolve links without per-page config.
const _SITE_BASE = (() => {
  const tag = document.querySelector('script[src$="data.js"]');
  if (tag) return tag.getAttribute('src').replace('data.js', '');
  return '';
})();

// Content data (ME, PORTFOLIO, AGENTS, etc.) lives in data.js — edit that
// file to update site content. Page-specific words live in each page's
// PAGE_* block (e.g. PAGE_HOME in index.html). This file only defines
// UI building blocks.

// --- Small layout atoms ----------------------------------------------------
const ContactRow = ({ align = 'left' }) => (
  <div style={{
    display: 'flex', gap: 20, alignItems: 'center',
    justifyContent: align === 'center' ? 'center' : 'flex-start',
    fontFamily: 'var(--font-mono)', fontSize: 12,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    color: 'var(--fg-muted)',
  }}>
    <a href={_SITE_BASE + "agents/jeremy/jeremy.html"} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
      <span style={{ color: 'var(--accent)' }}>↗</span> ABOUT
    </a>
    <span style={{ color: 'var(--line-loud)' }}>·</span>
    <a href={`https://${ME.github}`} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
      <span style={{ color: 'var(--accent)' }}>↗</span> GITHUB
    </a>
    <span style={{ color: 'var(--line-loud)' }}>·</span>
    <a href={`https://${ME.linkedin}`} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
      <span style={{ color: 'var(--accent)' }}>↗</span> LINKEDIN
    </a>
    <span style={{ color: 'var(--line-loud)' }}>·</span>
    <span>{ME.location}</span>
  </div>
);

const Footer = () => (
  <div style={{
    padding: '30px 40px 40px',
    borderTop: '1px solid var(--line)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    gap: 24,
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Wordmark size={20} tick={false}/>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'var(--fg-faint)',
      }}>
        EST. 03/2026 · {(window.SITE?.version || 'v3.3').toUpperCase()}
      </div>
    </div>
    <ContactRow />
  </div>
);

// Mascot inline — line drawing from the design system. We reference the file
// from /design-system/. Used as <Mascot size={...} />.
const Mascot = ({ size = 96, color }) => (
  <img
    src={_SITE_BASE + "design-system/assets/mascot.svg"}
    alt=""
    style={{
      width: size, height: 'auto', display: 'block',
      filter: color ? `drop-shadow(0 0 24px ${color})` : 'none',
    }}
  />
);

// TopNav — shared chrome across home + portfolio pages.
const TopNav = ({ active }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '22px 40px', borderBottom: '1px solid var(--line)',
    gap: 32,
  }}>
    <div style={{ flexShrink: 0 }}>
      <Wordmark size={26} tick={false} />
    </div>
    <nav style={{
      display: 'flex', gap: 26, flex: 1, justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 11,
      letterSpacing: '0.18em', textTransform: 'uppercase',
    }}>
      {[
        ['HOME',      'index.html'],
        ['PORTFOLIO', 'portfolio.html'],
        ['GRAPH',     'dashboard.html'],
        ['WRITING',   'writing.html'],
      ].map(([label, href]) => (
        <a key={label} href={_SITE_BASE + href} style={{
          color: label === active ? 'var(--accent)' : 'var(--fg-muted)',
          borderBottom: label === active ? '1px solid var(--accent)' : '1px solid transparent',
          paddingBottom: 4,
        }}>{label}</a>
      ))}
    </nav>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      fontFamily: 'var(--font-mono)', fontSize: 10,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: 'var(--fg-subtle)',
    }}>
      <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)', color: 'var(--ok)' }} />
      {(window.SITE?.version || 'v3.3').toUpperCase()} · {(window.SITE?.status || 'LIVE').toUpperCase()}
    </div>
  </div>
);

Object.assign(window, {
  // Shared atoms used by HomeMain + PortfolioMain + agent pages:
  ContactRow, Footer, Mascot, TopNav,
});
