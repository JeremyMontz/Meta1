// HomeMain.jsx — the homepage. The interactive agent graph is the centerpiece.
// Hover any node to surface a dashboard-style card; click to enter the
// underlying page. Cabinet warmth (candlelight gold) is sprinkled on eyebrows,
// dividers, and a single Pirata flourish in the hero — Mr Hyde shows up, but
// doesn't take over.

const HomeMain = () => {
  const [hovered, setHovered] = React.useState(null);

  // Live Sheet data — starts with static AGENTS, upgrades to live on fetch.
  // fetchStatus: 'loading' | 'live' | 'offline'
  const { agents: liveAgents, fetchStatus, refetch } = useSheetData();

  // Resolve hovered node → an AgentCard data shape (so the inspector pane
  // re-renders consistently). Agent node ids are prefixed with 'a-' in the
  // graph to disambiguate from same-named projects, so strip that here.
  const inspectorAgent = hovered?.kind === 'agent'
    ? liveAgents.find(a => 'a-' + a.id === hovered.id)
    : null;

  return (
    <div className="home-shell home-page bg-grid">
      <TopNav active="HOME" />
      <Hero />

      {/* ─── GRAPH SECTION ──────────────────────────────────────────── */}
      <section id="graph" style={{ padding: '32px 40px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <Eyebrow color="var(--candle)">// 01 · THE CURRENT GRAPH</Eyebrow>
            <h2 style={{ marginTop: 8 }}>
              Three projects. Seven domains. Countless agents. <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>One human.</span>
            </h2>
            <p style={{ marginTop: 8, maxWidth: 660 }}>
              Hover any node to inspect — agents surface their latest session card. Click to enter their page.
            </p>
          </div>
          <GraphLegend agents={liveAgents} fetchStatus={fetchStatus} />
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px',
          gap: 20, alignItems: 'stretch',
        }}>
          <AgentGraph hovered={hovered} setHovered={setHovered} agents={liveAgents} fetchStatus={fetchStatus} />
          <Inspector hovered={hovered} agent={inspectorAgent} agents={liveAgents} fetchStatus={fetchStatus} />
        </div>
      </section>

      {/* ─── LIVE FROM THE LAB — hidden until #162 ships ──────── */}
      {/* <Divider label="// 02 · LIVE FROM THE LAB" tone="candle" /> */}
      {/* <LiveActivity /> */}

      <Divider label="// 02 · UNDER THE MICROSCOPE" tone="candle" />

      {/* ─── NOW + PORTFOLIO TEASER ───────────────────────────────── */}
      <section style={{
        padding: '48px 40px',
        display: 'grid', gridTemplateColumns: '1fr 1px 380px', gap: 40,
      }}>
        <NowBlock />
        <div style={{ background: 'var(--line)' }} />
        <PortfolioTeaser />
      </section>

      <Divider label="// 03 · FIELD NOTES" tone="muted" />

      {/* ─── WRITING ──────────────────────────────────────────────── */}
      <section id="articles" style={{ padding: '48px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <Eyebrow color="var(--candle)">// WRITING</Eyebrow>
            <h2 style={{ marginTop: 8 }}>Field notes & essays.</h2>
          </div>
          <a href="writing.html" style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--accent)',
          }}>ALL ENTRIES ↗</a>
        </div>
        <WritingList />
      </section>

      <Footer />
    </div>
  );
};

// ── HERO ───────────────────────────────────────────────────────────────────
const Hero = () => (
  <div style={{ position: 'relative', padding: '64px 40px 40px' }}>
    <div>
      <div>
        <Eyebrow color="var(--candle)">// 00 · ENTRY POINT · HOME PAGE</Eyebrow>

        {/* Pirata sub-flourish — earned but contained */}
        <div className="hero-flicker" style={{
          marginTop: 14, marginBottom: 14,
          fontFamily: 'var(--font-hyde)',
          fontSize: 34, letterSpacing: '0.01em', lineHeight: 1,
          color: 'var(--candle)',
          textShadow: '0 0 18px color-mix(in oklch, var(--candle) 30%, transparent)',
        }}>
          It's live! The experiment continues...
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 84, lineHeight: 0.96, letterSpacing: '-0.03em',
          fontVariationSettings: '"opsz" 144',
          margin: 0,
        }}>
          Jeremy Montz.
        </h1>
        <div style={{
          marginTop: 6,
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400,
          fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.015em',
          fontVariationSettings: '"opsz" 72, "SOFT" 100',
          color: 'var(--fg-muted)',
        }}>
          operating <span style={{ color: 'var(--accent)', fontStyle: 'normal', fontWeight: 600 }}> Claudemonzter</span>.
        </div>

        <p style={{
          marginTop: 26, maxWidth: 580,
          fontSize: 17, lineHeight: 1.5,
        }}>
          Senior PO by day, mad scientist by night. Claudemonzter is my
          first home-built multi agentic laboratory — an operator-plus-agents experiment I'm running in
          public to find out what these tools and LLMs can actually do.
        </p>

        <p style={{
          marginTop: 8, maxWidth: 580,
          fontSize: 14, color: 'var(--fg-subtle)',
        }}>
          90% lab coat. 10% monster. Business up front, party in the back.
        </p>

        <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
          <a href="#graph" style={{ textDecoration: 'none' }}>
            <Button variant="primary">▸ LEARN ABOUT THE GRAPH</Button>
          </a>
          <a href="portfolio.html" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">VIEW MY PORTFOLIO →</Button>
          </a>
        </div>
      </div>

    </div>
  </div>
);

// ── GRAPH LEGEND ──────────────────────────────────────────────────────────
const GraphLegend = ({ agents, fetchStatus }) => {
  const ag = agents || AGENTS;
  const activeCt = ag.filter(a => a.state === 'active').length;
  const flaggedCt = ag.filter(a => a.state === 'flagged').length;

  // Fetch status indicator
  const statusColor = fetchStatus === 'live' ? 'var(--ok)' :
                      fetchStatus === 'loading' ? 'var(--info)' : 'var(--warn)';
  const statusLabel = fetchStatus === 'live' ? 'LIVE' :
                      fetchStatus === 'loading' ? 'FETCHING...' : 'STATIC';

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 12px',
        border: '1px solid color-mix(in oklch, var(--ok) 40%, transparent)',
        borderRadius: 2,
        fontFamily: 'var(--font-mono)', fontSize: 11,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--ok)',
      }}>
        <StatusDot tone="ok" glow /> {activeCt} ACTIVE
      </span>
      {flaggedCt > 0 && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          border: '1px solid color-mix(in oklch, var(--warn) 40%, transparent)',
          borderRadius: 2,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--warn)',
        }}>
          <StatusDot tone="warn" /> {flaggedCt} FLAGGED
        </span>
      )}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 12px',
        border: `1px solid color-mix(in oklch, ${statusColor} 40%, transparent)`,
        borderRadius: 2,
        fontFamily: 'var(--font-mono)', fontSize: 11,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: statusColor,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: statusColor,
          ...(fetchStatus === 'loading' ? { animation: 'pulse-dot 1.2s var(--ease-out) infinite', color: statusColor } : {}),
        }} />
        {statusLabel}
      </span>
    </div>
  );
};

// ── DIVIDER ────────────────────────────────────────────────────────────────
const Divider = ({ label, tone }) => {
  const c = tone === 'candle' ? 'var(--candle)' : 'var(--fg-faint)';
  return (
    <div style={{ padding: '0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, borderTop: '1px dashed var(--line-loud)' }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.28em', textTransform: 'uppercase', color: c,
        }}>{label}</span>
        <div style={{ flex: 1, borderTop: '1px dashed var(--line-loud)' }} />
      </div>
    </div>
  );
};

// ── NOW BLOCK ──────────────────────────────────────────────────────────────
const NowBlock = () => (
  <div>
    <Eyebrow color="var(--candle)">// NOW · WK 19, 2026</Eyebrow>
    <h2 style={{ marginTop: 10, marginBottom: 18 }}>
      What's <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>hot</span> under the lamp.
    </h2>
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 580 }}>
      {NOW.map((n, i) => (
        <li key={i} style={{
          display: 'grid', gridTemplateColumns: '32px 1fr',
          gap: 12, alignItems: 'flex-start',
          paddingBottom: 14,
          borderBottom: i < NOW.length - 1 ? '1px solid var(--line-soft)' : 'none',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--candle)', letterSpacing: '0.14em',
          }}>0{i + 1}</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 19, lineHeight: 1.35, color: 'var(--fg)',
            fontVariationSettings: '"opsz" 36',
          }}>{n}</span>
        </li>
      ))}
    </ul>
    <div className="scribble" style={{
      display: 'inline-block', marginTop: 18,
      color: 'var(--fg-muted)', fontSize: 22,
    }}>
      (tested it at 3am · still bites)
    </div>
  </div>
);

// ── PORTFOLIO TEASER ──────────────────────────────────────────────────────
const PortfolioTeaser = () => (
  <div>
    <Eyebrow color="var(--candle)">// SHOWCASE</Eyebrow>
    <h3 style={{ marginTop: 10, marginBottom: 12 }}>
      Portfolio projects
    </h3>
    <p style={{ fontSize: 14, marginBottom: 18 }}>
      Selected experiments published for visibility
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {PORTFOLIO.map((p, i) => (
        <a key={p.id} href={p.href} style={{
          display: 'grid', gridTemplateColumns: '32px 1fr 24px', gap: 10,
          padding: '14px 0',
          borderTop: '1px solid var(--line)',
          borderBottom: i === PORTFOLIO.length - 1 ? '1px solid var(--line)' : 'none',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)', letterSpacing: '0.16em' }}>{p.no}</span>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
              color: p.tone === 'na' ? 'var(--fg-subtle)' : 'var(--fg)',
              letterSpacing: '-0.01em',
            }}>{p.title}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: p.tone === 'warn' ? 'var(--warn)' : 'var(--fg-faint)', marginTop: 2 }}>
              {p.status} · {p.date}
            </div>
          </div>
          <span style={{ color: 'var(--fg-faint)' }}>↗</span>
        </a>
      ))}
    </div>
    <div style={{ marginTop: 16 }}>
      <a href="portfolio.html" style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--accent)',
      }}>SEE ALL PORTFOLIO PROJECTS →</a>
    </div>
  </div>
);

// ── WRITING LIST ──────────────────────────────────────────────────────────
const WritingList = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
    {ARTICLES.map((a, i) => (
      <a key={a.id} href={a.href || '#'} style={{
        display: 'grid', gridTemplateColumns: '70px 1fr 24px',
        gap: 16, padding: '22px 24px',
        alignItems: 'flex-start',
        border: '1px solid var(--line)',
        borderRight: i % 2 === 0 ? 'none' : '1px solid var(--line)',
        borderBottom: i < ARTICLES.length - 2 ? 'none' : '1px solid var(--line)',
        background: 'var(--bg-elev-1)',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--candle)', letterSpacing: '0.16em' }}>{a.date}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-faint)', letterSpacing: '0.18em', marginTop: 6 }}>{a.tag}</div>
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500,
            letterSpacing: '-0.01em', lineHeight: 1.2,
            fontVariationSettings: '"opsz" 48',
          }}>{a.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)', letterSpacing: '0.16em', marginTop: 8 }}>{a.read} · READ →</div>
        </div>
        <span style={{ color: 'var(--fg-faint)' }}>↗</span>
      </a>
    ))}
  </div>
);

// ── ABOUT ─────────────────────────────────────────────────────────────────
const AboutBlock = () => (
  <section id="about" style={{
    padding: '64px 40px',
    display: 'grid', gridTemplateColumns: '1fr 380px', gap: 56, alignItems: 'flex-start',
  }}>
    <div>
      <Eyebrow color="var(--candle)">// ABOUT THE OPERATOR</Eyebrow>
      <h2 style={{ marginTop: 12, marginBottom: 22 }}>
        I run product by day. <br/><span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>By night I run experiments.</span>
      </h2>
      <p style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 700, marginBottom: 14 }}>{ME.blurb}</p>
      <p style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 700, color: 'var(--fg-subtle)', marginBottom: 28 }}>
        I publish my working as a way of learning faster. Half portfolio, half reckoning.
        If you're hiring, looking for a thinking-partner, or just curious — the door is open.
      </p>
      <ContactRow />
    </div>

    <div style={{
      background: 'var(--bg-elev-1)', border: '1px solid var(--line)', padding: 24,
    }}>
      <Eyebrow color="var(--candle)">// HARD STATS</Eyebrow>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['EST.',      ME.est.replace('EST. ', '')],
          ['LAB',       '001 · ' + SITE.status],
          ['PROJECTS',  PROJECTS.length + ' ACTIVE'],
          ['AGENTS',    AGENTS.length + ' TRACKED'],
          ['VERSION',   SITE.version],
          ['LOCATION',  ME.location.toUpperCase()],
        ].map(([k, v]) => (
          <div key={k} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: '1px solid var(--line-soft)',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.14em',
          }}>
            <span style={{ color: 'var(--fg-subtle)' }}>{k}</span>
            <span style={{ color: 'var(--fg)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

window.HomeMain = HomeMain;
