// HomeMain.jsx — the homepage. The interactive agent graph is the centerpiece.
// Hover any node to surface a dashboard-style card; click to enter the
// underlying page. Cabinet warmth (candlelight gold) is sprinkled on eyebrows,
// dividers, and a single Pirata flourish in the hero — Mr Hyde shows up, but
// doesn't take over.

// ── Live agent data — ONE pipeline, shared with dashboard.html ────────────
// Fetches each domain's checkin tab using the helpers loaded from
// components/agent-card.js (csvUrl, parseCSV, compositeRows). The same
// renderCard() renderer used by dashboard.html and the agent pages draws
// the inspector card, so all three surfaces show the identical card.
const AGENT_ENTRIES = AGENTS.map(a => ({
  agentId: a.id,
  tab: a.id === 'jeremy' ? 'HumanCheckin' : a.name + 'Checkin',
  domain: a.name,
  isHuman: a.id === 'jeremy',
  url: a.id === 'jeremy' ? null : 'agents/' + a.id + '/' + a.id + '.html',
}));

const useAgentData = () => {
  const [data, setData] = React.useState({ comps: null, fetchStatus: 'loading' });
  const load = React.useCallback(() => {
    setData(d => ({ ...d, fetchStatus: 'loading' }));
    Promise.all(AGENT_ENTRIES.map(entry =>
      fetch(csvUrl(entry.tab) + '&cachebust=' + Date.now())
        .then(r => r.text())
        .then(text => ({ entry, comp: compositeRows(parseCSV(text)) }))
        .catch(() => ({ entry, comp: null }))
    )).then(results => {
      const comps = {};
      let anyLive = false;
      results.forEach(({ entry, comp }) => {
        comps[entry.agentId] = { entry, comp };
        if (comp && comp.upperRow) anyLive = true;
      });
      setData({ comps, fetchStatus: anyLive ? 'live' : 'offline' });
    });
  }, []);
  React.useEffect(() => { load(); }, [load]);
  return { ...data, refetch: load };
};

const HomeMain = () => {
  const [hovered, setHovered] = React.useState(null);

  // Live Sheet data. fetchStatus: 'loading' | 'live' | 'offline'
  const { comps, fetchStatus, refetch } = useAgentData();

  // Graph nodes need a state per agent — derived from the Sheet, never
  // from static placeholders. 'nodata' renders as a normal (unflagged) node.
  const liveAgents = React.useMemo(() => AGENTS.map(a => ({
    ...a,
    state: comps && comps[a.id] && comps[a.id].comp
      ? comps[a.id].comp.displayStatus
      : 'nodata',
  })), [comps]);

  // Resolve hovered node → { entry, comp } for the shared card renderer.
  // Agent node ids are prefixed with 'a-' in the graph to disambiguate
  // from same-named projects, so strip that here.
  const inspectorData = hovered?.kind === 'agent'
    ? (comps ? comps[hovered.id.replace(/^a-/, '')] : null)
    : null;

  return (
    <div className="home-shell home-page bg-grid">
      <TopNav active="HOME" />
      <Hero />

      {/* ─── GRAPH SECTION ──────────────────────────────────────────── */}
      <section id="graph" style={{ padding: '32px 40px 56px' }}>
        <div className="graph-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div className="graph-head-main">
            <Eyebrow color="var(--candle)">// 01 · THE CURRENT GRAPH</Eyebrow>
            <h2 style={{ marginTop: 8 }}>
              {PAGE_HOME.graph.heading} <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{PAGE_HOME.graph.headingAccent}</span>
            </h2>
            <p style={{ marginTop: 8, maxWidth: 660 }}>
              {PAGE_HOME.graph.hoverLine}
            </p>
          </div>
          <GraphLegend agents={liveAgents} fetchStatus={fetchStatus} />
        </div>

        <div className="graph-layout" style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px',
          gap: 20, alignItems: 'stretch',
        }}>
          <AgentGraph hovered={hovered} setHovered={setHovered} agents={liveAgents} fetchStatus={fetchStatus} />
          {/* height:0 + minHeight:100% — the inspector adopts the graph's row
              height without contributing its own, so the graph never resizes
              when inspector content changes (the old hover-jitter bug). */}
          <div className="graph-inspector" style={{ height: 0, minHeight: '100%' }}>
            <Inspector hovered={hovered} agentData={inspectorData} agents={liveAgents} fetchStatus={fetchStatus} />
          </div>
        </div>
        <p className="graph-caption" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--fg-faint)', marginTop: 14, textAlign: 'center', textTransform: 'uppercase' }}>
          &#9656; Interactive node graph &mdash; explore on desktop
        </p>
      </section>

      <Divider label="// 02 · UNDER THE MICROSCOPE" tone="candle" />

      {/* ─── NOW + PORTFOLIO TEASER ───────────────────────────────── */}
      <section className="home-split" style={{
        padding: '48px 40px',
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 40,
      }}>
        <NowBlock />
        <div className="home-split-rule" style={{ background: 'var(--line)' }} />
        <PortfolioTeaser />
      </section>

      <Divider label="// 03 · FIELD NOTES" tone="candle" />

      {/* ─── WRITING ──────────────────────────────────────────────── */}
      <section id="articles" style={{ padding: '48px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <Eyebrow color="var(--candle)">// WRITING</Eyebrow>
            <h2 style={{ marginTop: 8 }}>Field notes & essays</h2>
          </div>
          <a href="writing.html" style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--accent)',
          }}>ALL ENTRIES ↗</a>
        </div>
        <WritingList />
      </section>

      {/* ─── LIVE FROM THE LAB (#162) ─────────────────────────────── */}
      <Divider label="// 04 · LIVE FROM GITHUB" tone="candle" />
      <div style={{ height: 24 }} />
      <LiveActivity />

      <Footer />
    </div>
  );
};

// ── HERO ───────────────────────────────────────────────────────────────────
const Hero = () => (
  <div style={{ position: 'relative', padding: '64px 40px 40px' }}>
    <div>
      <div>
        <Eyebrow color="var(--candle)">// 00 · THE ENTRY POINT · LAB HOME PAGE</Eyebrow>

        {/* Pirata sub-flourish — earned but contained */}
        <div className="hero-flicker" style={{
          marginTop: 14, marginBottom: 14,
          fontFamily: 'var(--font-hyde)',
          fontSize: 34, letterSpacing: '0.01em', lineHeight: 1,
          color: 'var(--candle)',
          textShadow: '0 0 18px color-mix(in oklch, var(--candle) 30%, transparent)',
        }}>
          {PAGE_HOME.hero.flourish}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 84, lineHeight: 0.96, letterSpacing: '-0.03em',
          fontVariationSettings: '"opsz" 144',
          margin: 0,
        }}>
          {PAGE_HOME.hero.headline}
        </h1>
        <div style={{
          marginTop: 6,
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400,
          fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.015em',
          fontVariationSettings: '"opsz" 72, "SOFT" 100',
          color: 'var(--fg-muted)',
        }}>
          {PAGE_HOME.hero.subhead} <span style={{ color: 'var(--accent)', fontStyle: 'normal', fontWeight: 600 }}>{PAGE_HOME.hero.subheadAccent}</span>
        </div>

        <p style={{
          marginTop: 26, maxWidth: 580,
          fontSize: 17, lineHeight: 1.5,
        }}>
          {PAGE_HOME.hero.lead}
        </p>

        <p style={{
          marginTop: 8, maxWidth: 580,
          fontSize: 14, color: 'var(--fg-subtle)',
        }}>
          {PAGE_HOME.hero.subline}
        </p>

        <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
          <a href="about/ai.html" style={{ textDecoration: 'none' }}>
            <Button variant="primary">▸ LEARN ABOUT THE THING</Button>
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
  const openCt = ag.filter(a => a.state === 'open').length;
  const flaggedCt = ag.filter(a => a.state === 'flagged').length;

  // One chip per state that matters: active (green), open (teal), flagged
  // (gold, only when > 0). Idle isn't counted. While fetching, a pulsing
  // FETCHING chip; if the Sheet is unreachable, an OFFLINE chip — never
  // fake counts.
  const chip = (color, content, pulse) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 12px',
      border: `1px solid color-mix(in oklch, ${color} 40%, transparent)`,
      borderRadius: 2,
      fontFamily: 'var(--font-mono)', fontSize: 11,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      color: color,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: color,
        ...(pulse ? { animation: 'pulse-dot 1.2s var(--ease-out) infinite', color: color } : {}),
      }} />
      {content}
    </span>
  );

  if (fetchStatus === 'loading') {
    return <div style={{ display: 'flex', gap: 10 }}>{chip('var(--info)', 'FETCHING...', true)}</div>;
  }
  if (fetchStatus === 'offline') {
    return <div style={{ display: 'flex', gap: 10 }}>{chip('var(--warn)', 'OFFLINE')}</div>;
  }

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {chip('var(--ok)', activeCt + ' ACTIVE')}
      {chip('var(--info)', openCt + ' OPEN')}
      {flaggedCt > 0 && chip('var(--warn)', flaggedCt + ' FLAGGED')}
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
    <Eyebrow color="var(--candle)">// ACTIVE</Eyebrow>
    <h2 style={{ marginTop: 10, marginBottom: 18 }}>
      What's <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>hot</span> under the lamp.
    </h2>
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560, cursor: 'default' }}>
      {NOW.map((n, i) => (
        <li key={i} style={{
          display: 'grid', gridTemplateColumns: '20px 1fr',
          gap: 10, alignItems: 'baseline',
        }}>
          <span style={{ fontFamily: 'var(--font-hand)', color: 'var(--candle)', fontSize: 26, lineHeight: 1 }}>–</span>
          <span style={{
            fontFamily: 'var(--font-hand)', fontWeight: 600,
            fontSize: 27, lineHeight: 1.2, color: 'var(--fg-muted)',
          }}>{n}</span>
        </li>
      ))}
    </ul>
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
      {PAGE_HOME.showcase.sub}
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
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--candle)', letterSpacing: '0.16em' }}>{p.no}</span>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
              color: p.tone === 'na' ? 'var(--fg-subtle)' : 'var(--fg)',
              letterSpacing: '-0.01em',
            }}>{p.title}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: p.tone === 'ok' ? 'var(--ok)' : (p.tone === 'warn' ? 'var(--warn)' : 'var(--fg-faint)'), marginTop: 2 }}>
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
  <div className="writing-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
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
          {a.subtitle && <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.35, color: 'var(--fg-muted)', marginTop: 6 }}>{a.subtitle}</div>}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-faint)', letterSpacing: '0.16em', marginTop: 8 }}>{a.read} · READ →</div>
        </div>
        <span style={{ color: 'var(--fg-faint)' }}>↗</span>
      </a>
    ))}
  </div>
);


window.HomeMain = HomeMain;

