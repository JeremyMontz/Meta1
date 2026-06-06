// PortfolioMain.jsx — the recruiter-facing portfolio landing.
// 90% lab coat: professional, scannable; a small candle/Hyde wink, never theatrical.
// Page prose lives in window.PAGE_PORTFOLIO (in portfolio.html). Facts and lists
// live in data.js (ME, SPEC, PORTFOLIO). Volatile agent state never lives here.
//
// Sections: Hero → 01 What It Proves (stub) → 02 Live from the Lab → 03 The Work → Reach.

const PG = (typeof window !== 'undefined' && window.PAGE_PORTFOLIO) || {};

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
// STUB / carve-out. These six competencies become an interactive node graph
// (index-style inspector, but nodes = skills). Static grid for now; the dashed
// frame + IN DESIGN marker flag it as not-yet-final on purpose.
const PROVES = [
  ['01', 'Multi-agent orchestration', 'Eight agents, four projects, one shared canon — roles, routing, handoffs.'],
  ['02', 'Eval & QC infrastructure',  'Adversarial validation and canon-integrity checks; a gatekeeper ships only what passes.'],
  ['03', 'Persona systems',           'A dial-based persona matrix modulates each agent’s tone and output.'],
  ['04', 'Prompt & skill engineering','Reusable skills with structured triggers — prompt design as durable tooling.'],
  ['05', 'Memory architecture',       'Layered, two-tier memory that bridges sessions and decodes shorthand.'],
  ['06', 'Learning in public',        'Essays and lab logs documenting the build honestly — mistakes and all.'],
];

const WhatItProves = () => {
  const s = PG.proves || {};
  return (
    <section style={{ padding: '24px 40px 56px', borderTop: '1px solid var(--line)' }}>
      <div style={{ paddingTop: 32 }}>
        <Eyebrow color="var(--candle)">// {s.eyebrow}</Eyebrow>
        <h2 style={{ marginTop: 8, marginBottom: 8 }}>{s.heading}</h2>
        <p style={{ maxWidth: 560 }}>{s.sub}</p>
      </div>

      <div style={{ marginTop: 24, border: '1px dashed var(--line-loud)', padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Tick>// COMPETENCY GRAPH</Tick>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--candle)' }}>
            ◷ IN DESIGN
          </span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, background: 'var(--line-soft)', border: '1px solid var(--line-soft)',
        }}>
          {PROVES.map(([n, t, d]) => (
            <div key={n} style={{ background: 'var(--bg-elev-1)', padding: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--accent)' }}>{n}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, lineHeight: 1.15, marginTop: 6 }}>{t}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.45, marginTop: 6 }}>{d}</div>
            </div>
          ))}
        </div>

        <div className="scribble" style={{ marginTop: 14, color: 'var(--fg-muted)', fontSize: 18 }}>
          (these become an interactive node graph — like the homepage, but the nodes are skills)
        </div>
      </div>
    </section>
  );
};

// ── 02 · LIVE FROM THE LAB ──────────────────────────────────────────────────
// Section header + the real GitHub commit feed (components/LiveActivity.jsx,
// lifted from the homepage). The feed is the receipt that backs the claim above.
const LiveFromLab = () => {
  const s = PG.live || {};
  return (
    <>
      <div style={{ padding: '32px 40px 16px', borderTop: '1px solid var(--line)' }}>
        <Eyebrow color="var(--candle)">// {s.eyebrow}</Eyebrow>
        <h2 style={{ marginTop: 8, marginBottom: 8 }}>{s.heading}</h2>
        <p style={{ maxWidth: 560 }}>{s.sub}</p>
      </div>
      <LiveActivity />
    </>
  );
};

// ── 03 · THE WORK ──────────────────────────────────────────────────────────
// Project rows read from data.js PORTFOLIO. Expanded view uses the optional
// `details` and `excerpt` fields the homepage teaser ignores.
const PortfolioMatrix = () => {
  const s = PG.work || {};
  const liveCt = PORTFOLIO.filter(p => p.tone !== 'na').length;

  return (
    <section style={{ padding: '24px 40px 56px', borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, paddingTop: 32 }}>
        <div>
          <Eyebrow color="var(--candle)">// {s.eyebrow}</Eyebrow>
          <h2 style={{ marginTop: 8 }}>{s.heading}</h2>
          <p style={{ marginTop: 8, maxWidth: 580 }}>
            {liveCt} active, {PORTFOLIO.length - liveCt} on deck. Each entry links to a full write-up or a working artifact.
          </p>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-faint)' }}>
          {String(liveCt).padStart(2, '0')} / {String(PORTFOLIO.length).padStart(2, '0')} ACTIVE
        </span>
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

      {p.details && (
        <div>
          <Tick>// SPECS</Tick>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
            {p.details.map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid var(--line-soft)',
                fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em',
              }}>
                <span style={{ color: 'var(--fg-subtle)' }}>{k}</span>
                <span style={{ color: live ? 'var(--fg)' : 'var(--fg-faint)' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            <span style={{ color: live ? 'var(--accent)' : 'var(--fg-faint)' }}>
              {live ? '▸ READ' : 'COMING SOON'}
            </span>
            <span style={{ color: 'var(--fg-faint)' }}>{live ? '↗' : ''}</span>
          </div>
        </div>
      )}
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
        <a href={`mailto:${email}`} style={{ textDecoration: 'none' }}>
          <Button variant="primary">▸ EMAIL ME</Button>
        </a>
        <a href="about/assets/jeremy-montz-resume.pdf" download style={{ textDecoration: 'none' }}>
          <Button variant="secondary">↓ RÉSUMÉ (PDF)</Button>
        </a>
        <a href="about/human.html" style={{
          marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--fg-subtle)', borderBottom: '1px solid var(--line-loud)',
        }}>
          More about me →
        </a>
      </div>
    </section>
  );
};

window.PortfolioMain = PortfolioMain;
