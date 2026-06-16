// PortfolioMain.jsx — the recruiter-facing portfolio landing.
// 90% lab coat: professional, scannable; a small candle/Hyde wink, never theatrical.
// Page prose lives in window.PAGE_PORTFOLIO (in portfolio.html). Facts and lists
// live in data.js (ME, SPEC, PORTFOLIO). Volatile agent state never lives here.
//
// Sections: Hero → 01 What It Proves (stub) → 02 Live from the Lab → 03 The Work → Reach.

const PG = (typeof window !== 'undefined' && window.PAGE_PORTFOLIO) || {};
const ST = (typeof window !== 'undefined' && window.STATS) || [];

const PortfolioMain = () => {
  return (
    <div className="home-shell home-page bg-grid">
      <TopNav active="PORTFOLIO" />
      <PortfolioHero />
      <WhatItProves />
      <LiveFromLab />
      <PortfolioMatrix />
      <PortfolioReach />
      <Footer />
    </div>
  );
};

// ── HERO ───────────────────────────────────────────────────────────────────
const PortfolioHero = () => {
  const h = PG.hero || {};
  const body = h.body || [];
  return (
    <div style={{ padding: '64px 40px 56px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56, alignItems: 'flex-end' }}>
        <div>
          <Eyebrow color="var(--candle)">// {h.eyebrow}</Eyebrow>

          <h1 style={{
            marginTop: 14, marginBottom: 18,
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 76, lineHeight: 0.98, letterSpacing: '-0.025em',
            fontVariationSettings: '"opsz" 144',
            maxWidth: 760,
          }}>
            {h.headline}{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{h.headlineAccent}</span>
          </h1>

          {body.map((para, i) => {
            const isLast = i === body.length - 1;
            return (
              <p key={i} style={{
                maxWidth: 620, lineHeight: 1.5,
                marginTop: i === 0 ? 0 : 8,
                fontSize: i === 0 ? 17 : 14,
                color: i === 0 ? 'var(--fg)' : 'var(--fg-subtle)',
              }}>
                {para}
                {isLast && h.graphLink ? (
                  <>{' '}<a href="index.html" style={{ color: 'var(--accent)', borderBottom: '1px solid currentColor' }}>{h.graphLink} →</a></>
                ) : null}
              </p>
            );
          })}

          {ST.length ? (
            <div style={{ marginTop: 30, paddingTop: 22, borderTop: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', gap: 40 }}>
              {ST.map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 42, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--fg)', fontVariationSettings: '"opsz" 80' }}>{s.value}</div>
                  <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-subtle)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href={`https://${ME.github}`} style={{ textDecoration: 'none' }}>
              <Button variant="primary">▸ GITHUB</Button>
            </a>
            <a href={`https://${ME.linkedin}`} style={{ textDecoration: 'none' }}>
              <Button variant="secondary">LINKEDIN →</Button>
            </a>
            <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', color: 'var(--fg-subtle)' }}>
              {ME.location.toUpperCase()} · {ME.tagline}
            </span>
          </div>
        </div>

        {/* Right-side spec card — rows come from data.js SPEC */}
        <div style={{
          border: '1px solid var(--line)', background: 'var(--bg-elev-1)',
          padding: 22, fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <Tick>// SPEC</Tick>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ok)', fontSize: 11, letterSpacing: '0.16em' }}>
              <StatusDot tone="ok" glow /> {SPEC.badge}
            </span>
          </div>
          {SPEC.rows.map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid var(--line-soft)',
              fontSize: 11, letterSpacing: '0.14em',
            }}>
              <span style={{ color: 'var(--fg-subtle)' }}>{k}</span>
              <span style={{ color: 'var(--fg)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── 01 · WHAT IT PROVES ─────────────────────────────────────────────────────
// Section header + the competency node graph (components/CompetencyGraph.jsx).
// Nodes = competencies (data.js COMPETENCIES); evidence under each node is
// computed from PORTFOLIO/ARTICLES `demonstrates` tags.
const WhatItProves = () => {
  const s = PG.proves || {};
  return (
    <section style={{ padding: '24px 40px 56px', borderTop: '1px solid var(--line)' }}>
      <div style={{ paddingTop: 32 }}>
        <Eyebrow color="var(--candle)">// {s.eyebrow}</Eyebrow>
        <h2 style={{ marginTop: 8, marginBottom: 8 }}>{s.heading}</h2>
        <p style={{ maxWidth: 560 }}>{s.sub}</p>
      </div>
      <CompetencyGraph />
    </section>
  );
};

// ── 02 · LIVE FROM THE LAB ──────────────────────────────────────────────────
// Section header + the all-time commit-volume chart (components/CommitChart.jsx,
// dependency-free SVG). The chart is the receipt that backs the claim above.
const LiveFromLab = () => {
  const s = PG.live || {};
  return (
    <>
      <div style={{ padding: '32px 40px 16px', borderTop: '1px solid var(--line)' }}>
        <Eyebrow color="var(--candle)">// {s.eyebrow}</Eyebrow>
        <h2 style={{ marginTop: 8, marginBottom: 8 }}>{s.heading}</h2>
        <p style={{ maxWidth: 560 }}>{s.sub}</p>
      </div>
      <CommitChart />
    </>
  );
};

// ── 03 · THE WORK ──────────────────────────────────────────────────────────
// Project rows read from data.js PORTFOLIO. Expanded view uses the optional
// `details` and `excerpt` fields the homepage teaser ignores.
const PortfolioMatrix = () => {
  const s = PG.work || {};
  const okCt   = PORTFOLIO.filter(p => p.tone === 'ok').length;   // live / shipped
  const warnCt = PORTFOLIO.filter(p => p.tone === 'warn').length; // WIP
  const naCt   = PORTFOLIO.filter(p => p.tone === 'na').length;   // to come

  return (
    <section style={{ padding: '24px 40px 56px', borderTop: '1px solid var(--line)' }}>
      <div style={{ marginBottom: 24, paddingTop: 32 }}>
        <Eyebrow color="var(--candle)">// {s.eyebrow}</Eyebrow>
        <h2 style={{ marginTop: 8 }}>{s.heading}</h2>
        <p style={{ marginTop: 8, maxWidth: 580 }}>
          {okCt} live, {warnCt} in progress, {naCt} to come. Each entry links to a full write-up or a working artifact.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {PORTFOLIO.map((p, i) => <ProjectRow key={p.no} p={p} first={i === 0} last={i === PORTFOLIO.length - 1} />)}
      </div>
    </section>
  );
};

const ProjectRow = ({ p, first, last }) => {
  const live = p.tone !== 'na';
  return (
    <a href={p.href} style={{
      display: 'grid', gridTemplateColumns: '80px 1fr 320px',
      gap: 32, padding: '36px 0',
      borderTop: '1px solid var(--line)',
      borderBottom: last ? '1px solid var(--line)' : 'none',
      transition: 'background 200ms var(--ease-out)',
    }}
    onMouseEnter={e => { if (live) e.currentTarget.style.background = 'color-mix(in oklch, var(--accent) 4%, transparent)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontWeight: 400, fontSize: 56,
          fontVariationSettings: '"opsz" 96',
          color: live ? 'var(--candle)' : 'var(--fg-faint)', lineHeight: 1,
        }}>{p.no}</div>
        <div style={{ marginTop: 8 }}>
          <Badge tone={live ? (p.tone === 'warn' ? 'warn' : 'ok') : 'neutral'} sym={live ? '▲' : '—'}>{p.status}</Badge>
        </div>
      </div>

      <div>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 600,
          fontSize: 44, letterSpacing: '-0.02em', lineHeight: 1.05,
          color: live ? 'var(--fg)' : 'var(--fg-subtle)',
          margin: 0, marginBottom: 12,
        }}>{p.title}<span style={{ color: 'var(--accent)' }}>{live ? '.' : ''}</span></h3>
        <div style={{ marginBottom: 14 }}>
          <Badge tone={live ? 'accent' : 'neutral'}>{p.tag}</Badge>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.5, maxWidth: 560, marginBottom: p.excerpt ? 16 : 0 }}>{p.blurb}</p>
        {p.excerpt && (
          <p style={{
            marginTop: 12, paddingLeft: 16,
            borderLeft: '2px solid var(--candle)',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--fg-muted)', maxWidth: 560,
            fontVariationSettings: '"opsz" 36, "SOFT" 100', lineHeight: 1.45,
          }}>{p.excerpt}</p>
        )}
      </div>

      {p.details && (() => {
        // Single meta line drafted from the entry's `details` (role · started).
        // STATUS lives in the left-column badge already, so it's left out here;
        // change which detail keys feed this line to taste.
        const dv = Object.fromEntries(p.details);
        const meta = [dv.ROLE, dv.STARTED].filter(v => v && v !== '—').join('  ·  ');
        return (
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
              letterSpacing: '0.12em', lineHeight: 1.7,
              color: live ? 'var(--fg-muted)' : 'var(--fg-faint)',
            }}>{meta}</div>
            <div style={{
              marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>
              <span style={{ color: live ? 'var(--accent)' : 'var(--fg-faint)' }}>
                {live ? '▸ READ' : 'COMING SOON'}
              </span>
              <span style={{ color: 'var(--fg-faint)' }}>{live ? '↗' : ''}</span>
            </div>
          </div>
        );
      })()}
    </a>
  );
};

// ── REACH ───────────────────────────────────────────────────────────────────
// Closing CTA. Email + résumé are the active next steps the footer doesn't give;
// passive social links stay in the footer. Email comes from data.js ME.email
// (add it there); falls back to the public address until then.
const PortfolioReach = () => {
  const s = PG.reach || {};
  const email = (typeof ME !== 'undefined' && ME.email) || 'jeremydmontz@gmail.com';
  return (
    <section id="reach" style={{ padding: '48px 40px 64px', borderTop: '1px solid var(--line)' }}>
      <Eyebrow color="var(--candle)">// {s.eyebrow}</Eyebrow>
      <h2 style={{ marginTop: 10, marginBottom: 14 }}>{s.heading}</h2>
      <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--fg-muted)', maxWidth: 520, marginBottom: 24 }}>{s.sub}</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="about/assets/jeremy-montz-resume.pdf" download style={{ textDecoration: 'none' }}>
          <Button variant="primary">↓ RÉSUMÉ (PDF)</Button>
        </a>
        <a href={`mailto:${email}`} style={{ textDecoration: 'none' }}>
          <Button variant="secondary">EMAIL ME →</Button>
        </a>
      </div>
    </section>
  );
};

window.PortfolioMain = PortfolioMain;
