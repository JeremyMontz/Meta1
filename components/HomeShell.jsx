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
    <a href={_SITE_BASE + "about/human.html"} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
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
        ['ABOUT',     'about/human.html'],
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

// ════════════════════════════════════════════════════════════════════════
// FieldNote — "What this page means" header widget (GH #199)
// Self-mounts on every page that loads HomeShell.jsx, so the widget is wired
// in ONCE here and inherited everywhere. Per-page content comes from
// window.SITE_INDEX (in data.js), keyed by route. No entry -> renders nothing.
// ════════════════════════════════════════════════════════════════════════
;(function () {
  if (typeof window === 'undefined' || !window.React || !window.ReactDOM) return;

  var FN_HEAD   = 'What this page means.';
  var FN_THANKS = '(thanks for stopping by ~jeremy)';

  var FN_CSS = `
  :root{
    --fn-paper:#efe7d4; --fn-paper-2:#e3d9c0; --fn-paper-line:rgba(28,22,40,0.07);
    --fn-paper-edge:#d8cdb2; --fn-board:#16131d; --fn-board-edge:#322c40;
    --fn-ink-dark:#211c2b; --fn-ink-soft:#4a4358; --fn-accent-on-paper:#6a3df0;
  }
  .fn-tag{position:fixed;right:0;top:150px;z-index:60;cursor:pointer;background:none;border:none;padding:0;transition:transform 360ms var(--ease-out);}
  .fn-tag-body{background:var(--fn-paper);color:var(--fn-ink-dark);border:1px solid var(--fn-paper-edge);border-right:none;box-shadow:-10px 10px 28px rgba(0,0,0,0.45);padding:14px 13px 16px;border-radius:5px 0 0 5px;display:flex;flex-direction:column;align-items:center;gap:11px;position:relative;}
  .fn-hole{width:11px;height:11px;border-radius:50%;background:var(--bg);border:1px solid var(--fn-paper-edge);margin-top:2px;}
  .fn-bolt{display:block;}
  .fn-label{writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--fn-ink-dark);}
  .fn-tag::after{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent);border-radius:3px 0 0 3px;opacity:0.9;}
  .fn-tag:hover{transform:translateX(-4px);}
  body.fn-open .fn-tag{transform:translateX(-384px);}
  .fn-scrim{position:fixed;inset:0;z-index:49;background:rgba(4,3,9,0.45);opacity:0;visibility:hidden;transition:opacity 260ms var(--ease-out),visibility 260ms;}
  body.fn-open .fn-scrim{opacity:1;visibility:visible;}
  .fn-board{position:fixed;right:0;top:96px;z-index:55;width:384px;max-width:calc(100vw - 24px);opacity:0;visibility:hidden;pointer-events:none;}
  body.fn-open .fn-board{opacity:1;visibility:visible;pointer-events:auto;animation:fnSlideIn 420ms var(--ease-out);}
  @keyframes fnSlideIn{from{opacity:0;transform:translateX(46px);}to{opacity:1;transform:none;}}
  .fn-backing{position:absolute;inset:0;background:var(--fn-board);border:1px solid var(--fn-board-edge);border-radius:12px 0 0 12px;box-shadow:-24px 24px 70px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04);}
  .fn-clip{position:absolute;top:-12px;left:50%;transform:translateX(-50%);z-index:4;width:130px;height:28px;background:linear-gradient(#3a3647,#211d2a);border-radius:5px;border:1px solid #0c0a12;box-shadow:inset 0 1px 0 rgba(255,255,255,0.22),inset 0 -3px 5px rgba(0,0,0,0.5),0 5px 12px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:space-between;padding:0 12px;}
  .fn-clip i{width:6px;height:6px;border-radius:50%;background:#0c0a12;box-shadow:inset 0 1px 0 rgba(255,255,255,0.18);}
  .fn-clip b{width:44px;height:9px;border-radius:3px;background:#15121c;box-shadow:inset 0 1px 0 rgba(255,255,255,0.1);}
  .fn-paper{position:relative;z-index:2;margin:22px 18px 18px;background:var(--fn-paper);background-image:repeating-linear-gradient(var(--fn-paper) 0,var(--fn-paper) 29px,var(--fn-paper-line) 29px,var(--fn-paper-line) 30px);box-shadow:0 2px 6px rgba(0,0,0,0.4);padding:22px 24px 30px;overflow:hidden;}
  .fn-curl{position:absolute;right:18px;bottom:18px;z-index:3;width:32px;height:32px;background:linear-gradient(135deg,transparent 46%,var(--fn-paper-2) 47%,var(--fn-paper) 78%);box-shadow:-3px -3px 6px rgba(0,0,0,0.18);clip-path:polygon(100% 0,0 100%,100% 100%);}
  .fn-eyebrow{font-family:var(--font-mono);font-size:9.5px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--fn-accent-on-paper);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;}
  .fn-close{cursor:pointer;border:none;background:none;color:var(--fn-ink-soft);font-size:13px;padding:2px 4px;}
  .fn-close:hover{color:var(--fn-ink-dark);}
  .fn-head{font-family:var(--font-display);font-weight:600;font-size:24px;line-height:1.08;letter-spacing:-0.015em;color:var(--fn-ink-dark);margin:0 0 12px;}
  .fn-lines{font-family:var(--font-sans);font-size:13px;line-height:1.62;color:var(--fn-ink-soft);margin:0;max-width:92%;}
  .fn-lines b,.fn-lines strong{color:var(--fn-ink-dark);font-weight:600;}
  .fn-lines a{color:var(--fn-accent-on-paper);text-decoration:underline;}
  .fn-thanks{font-family:var(--font-hand);font-size:18px;color:var(--fn-accent-on-paper);transform:rotate(-2deg);display:inline-block;margin:14px 0 0;}
  .fn-rule{border:none;border-top:1px solid rgba(28,22,40,0.14);margin:16px 0 13px;max-width:64%;}
  .fn-taglbl{font-family:var(--font-mono);font-size:8.5px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--fn-ink-soft);margin-bottom:10px;}
  .fn-tags{display:flex;flex-wrap:wrap;gap:7px;max-width:94%;}
  .fn-chip{font-family:var(--font-mono);font-size:10.5px;font-weight:600;letter-spacing:0.04em;color:#fff;background:var(--fn-accent-on-paper);border-radius:999px;padding:5px 12px;box-shadow:0 2px 0 rgba(58,28,140,0.45);}
  .fn-stamp{position:absolute;right:16px;bottom:16px;width:92px;height:92px;border:2px solid var(--fn-accent-on-paper);border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--fn-accent-on-paper);opacity:0.2;transform:rotate(-13deg);font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.12em;line-height:1.5;text-transform:uppercase;pointer-events:none;}
  .fn-retired{position:absolute;left:16px;bottom:18px;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--fn-ink-soft);opacity:0.55;}
  @media (max-width:720px){.fn-board{top:auto;bottom:16px;width:calc(100vw - 16px);}body.fn-open .fn-tag{transform:translateX(0);opacity:0;}}
  @media (prefers-reduced-motion:reduce){.fn-tag,.fn-scrim{transition:none!important;}body.fn-open .fn-board{animation:none!important;}}
  `;

  function fnRouteKey() {
    var tag = document.querySelector('script[src*="data.js"]');
    var root = '/';
    if (tag) {
      try { root = new URL(tag.getAttribute('src'), location.href).pathname.replace(/data\.js.*$/, ''); }
      catch (e) {}
    }
    var p = location.pathname;
    if (root && p.indexOf(root) === 0) { p = '/' + p.slice(root.length); }
    p = p.replace(/index\.html$/, '');
    if (p === '') { p = '/'; }
    return p;
  }

  function FieldNote() {
    var React = window.React;
    var h = React.createElement;
    var idx = window.SITE_INDEX || {};
    var key = fnRouteKey();
    // home may be authored as "/" or "/index.html" — accept either
    var entry = idx[key] || (key === '/' ? idx['/index.html'] : undefined);

    var s = React.useState(false);
    var open = s[0], setOpen = s[1];

    React.useEffect(function () {
      if (!entry) return;
      var onKey = function (e) { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('keydown', onKey);
      return function () { document.removeEventListener('keydown', onKey); };
    }, [entry]);

    React.useEffect(function () {
      document.body.classList.toggle('fn-open', !!(open && entry));
      return function () { document.body.classList.remove('fn-open'); };
    }, [open, entry]);

    if (!entry) return null;

    var tags = (entry.tags || []).map(function (t, i) {
      return h('span', { className: 'fn-chip', key: i }, t);
    });

    var bolt = h('svg', { width: 15, height: 19, viewBox: '0 0 56 72' },
      h('path', { d: 'M 6 2 L 50 2 L 30 32 L 48 32 L 8 70 L 26 40 L 6 40 Z', fill: 'var(--fn-accent-on-paper)' }));

    return h(React.Fragment, null,
      h('button', { className: 'fn-tag', 'aria-label': 'What this means', onClick: function () { setOpen(function (o) { return !o; }); } },
        h('div', { className: 'fn-tag-body' },
          h('span', { className: 'fn-hole' }),
          h('span', { className: 'fn-bolt' }, bolt),
          h('span', { className: 'fn-label' }, 'What this means'))),
      h('div', { className: 'fn-scrim', onClick: function () { setOpen(false); } }),
      h('div', { className: 'fn-board', role: 'dialog', 'aria-label': 'What this page means', 'aria-hidden': !open },
        h('div', { className: 'fn-backing' }),
        h('div', { className: 'fn-clip' }, h('i'), h('b'), h('i')),
        h('div', { className: 'fn-paper' },
          h('div', { className: 'fn-eyebrow' },
            h('span', null, '// Field note'),
            h('button', { className: 'fn-close', 'aria-label': 'Close', onClick: function () { setOpen(false); } }, '✕')),
          h('h3', { className: 'fn-head' }, FN_HEAD),
          h('p', { className: 'fn-lines', dangerouslySetInnerHTML: { __html: entry.note || '' } }),
          h('span', { className: 'fn-thanks' }, FN_THANKS),
          h('hr', { className: 'fn-rule' }),
          h('div', { className: 'fn-taglbl' }, 'Filed under'),
          h('div', { className: 'fn-tags' }, tags),
          entry.status === 'retired' ? h('div', { className: 'fn-retired' }, 'retired · archived') : null,
          h('div', { className: 'fn-stamp' }, 'Field Note', h('br'), 'Lab 001', h('br'), '· 2026 ·')),
        h('div', { className: 'fn-curl' })));
  }

  window.FieldNote = FieldNote;

  function fnMount() {
    if (document.getElementById('fn-root')) return;
    if (!document.getElementById('fn-styles')) {
      var st = document.createElement('style');
      st.id = 'fn-styles'; st.textContent = FN_CSS; document.head.appendChild(st);
    }
    var root = document.createElement('div'); root.id = 'fn-root'; document.body.appendChild(root);
    var el = window.React.createElement(FieldNote);
    if (window.ReactDOM.createRoot) { window.ReactDOM.createRoot(root).render(el); }
    else { window.ReactDOM.render(el, root); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fnMount); }
  else { fnMount(); }
})();
