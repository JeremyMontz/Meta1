// CommitChart.jsx — portfolio "Live from the Lab": all-time weekly commit volume
// (violet bars) + cumulative total (gold line), drawn as dependency-free SVG to
// match the site's hand-rolled graph convention. Honest status + last-activity via
// LiveBadge (see live-github.jsx).
//
// Range: anchored at the first commit and grows rightward — the "nothing before
// March, look how much since" story. No window/scroll controls (they would scroll
// past the origin). Data: /stats/commit_activity (trailing 52 weeks; see design
// doc §7 for the ~Mar-2027 ceiling) + a 1-commit probe for the last-activity time.
//
// Colors are applied via inline `style` (CSS vars do NOT resolve in SVG presentation
// attributes like fill="var(--x)", only in the style property).

const CHART_LEADIN = 3;

function chartMonth(epochSec) { return new Date(epochSec * 1000).toLocaleDateString('en-US', { month: 'short' }); }
function chartMonthYear(epochSec) { return new Date(epochSec * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }

const CHART_MSG = { padding: '36px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--fg-faint)' };

const CommitChart = () => {
  const repo = (window.ME && window.ME.ghRepo) || 'JeremyMontz/Meta1';
  const [weeks, setWeeks] = React.useState(null);
  const [status, setStatus] = React.useState(GH.SYNCING);
  const [cachedAt, setCachedAt] = React.useState(null);
  const [lastActivity, setLastActivity] = React.useState(null);

  const triesRef = React.useRef(0);
  React.useEffect(() => {
    let cancelled = false;
    triesRef.current = 0;
    const base = `https://api.github.com/repos/${repo}`;
    // Last-activity timestamp: a cheap commits probe, independent of chart data.
    ghFetch(`${base}/commits?per_page=1`).then((c) => {
      if (!cancelled && c.data && c.data[0]) setLastActivity(new Date(c.data[0].commit.author.date));
    });
    // Chart status is driven by the stats endpoint ALONE. /stats/commit_activity
    // returns 202 while GitHub computes; ghFetch retries that internally and we
    // self-heal with a few delayed passes so a cold cache fills without a reload.
    const load = () => ghFetch(`${base}/stats/commit_activity`, { retry202: 4 }).then((s) => {
      if (cancelled) return;
      const arr = Array.isArray(s.data) ? s.data : [];
      setCachedAt(s.cachedAt || null);
      if (arr.length > 0) { setWeeks(arr); setStatus(s.status === GH.CACHED ? GH.CACHED : GH.STREAMING); return; }
      if (s.status === GH.CACHED) { setWeeks(arr); setStatus(GH.CACHED); return; }
      triesRef.current += 1;
      if (triesRef.current < 3) { setStatus(GH.SYNCING); setTimeout(() => { if (!cancelled) load(); }, 4000); }
      else { setWeeks([]); setStatus(s.status === GH.OFFLINE ? GH.OFFLINE : GH.EMPTY); }
    });
    load();
    return () => { cancelled = true; };
  }, [repo]);

  const series = (() => {
    if (!weeks || !weeks.length) return null;
    const first = weeks.findIndex((w) => w.total > 0);
    if (first < 0) return [];
    const start = Math.max(0, first - CHART_LEADIN);
    let run = 0;
    return weeks.slice(start).map((w) => { run += w.total; return { week: w.week, total: w.total, cum: run }; });
  })();

  const card = (inner) => (
    <section style={{ padding: '0 40px 40px' }}>
      <div style={{ border: '1px solid var(--line)', background: 'var(--bg-elev-1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
          <Eyebrow color="var(--candle)">// COMMIT VOLUME · ALL-TIME</Eyebrow>
          <LiveBadge status={status} repo={repo} lastActivity={lastActivity} cachedAt={cachedAt} />
        </div>
        {inner}
      </div>
    </section>
  );

  if (!series) return card(<div style={CHART_MSG}>// WARMING UP · GITHUB STATS …</div>);
  if (series.length === 0) return card(<div style={CHART_MSG}>// NO COMMIT DATA</div>);

  const W = 920, H = 300, mL = 38, mR = 50, mT = 18, mB = 40;
  const plotW = W - mL - mR, plotH = H - mT - mB;
  const n = series.length;
  const maxWk = Math.max(1, ...series.map((d) => d.total));
  const maxCum = Math.max(1, series[n - 1].cum);
  const slot = plotW / n;
  const barW = Math.max(3, Math.min(26, slot * 0.6));
  const cx = (i) => mL + slot * (i + 0.5);
  const yBar = (v) => mT + plotH * (1 - v / maxWk);
  const yCum = (v) => mT + plotH * (1 - v / maxCum);
  const baseY = mT + plotH;
  const linePts = series.map((d, i) => `${cx(i).toFixed(1)},${yCum(d.cum).toFixed(1)}`).join(' ');
  const labelEvery = Math.ceil(n / 8);
  const totalCharted = series[n - 1].cum;
  const firstWk = series.find((d) => d.total > 0);
  const sinceLabel = chartMonthYear(firstWk.week);
  const txt = (size, fill) => ({ fontFamily: 'var(--font-mono)', fontSize: size + 'px', fill: fill });

  return card(
    <div style={{ padding: '16px 12px 6px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
           aria-label={`Weekly commits since ${sinceLabel}: violet bars for weekly volume and a gold cumulative line reaching ${totalCharted}.`}
           style={{ display: 'block' }}>
        <line x1={mL} y1={baseY} x2={mL + plotW} y2={baseY} style={{ stroke: 'var(--line)' }} strokeWidth="1" />
        <line x1={mL} y1={yBar(maxWk)} x2={mL + plotW} y2={yBar(maxWk)} style={{ stroke: 'var(--line-soft)', strokeDasharray: '2 4' }} strokeWidth="1" />
        <text x={mL - 6} y={yBar(maxWk) + 3} textAnchor="end" style={txt(9, 'var(--fg-faint)')}>{maxWk}</text>
        <text x={mL - 6} y={baseY + 3} textAnchor="end" style={txt(9, 'var(--fg-faint)')}>0</text>
        {series.map((d, i) => (
          <rect key={'b' + i} x={cx(i) - barW / 2} y={yBar(d.total)} width={barW} height={Math.max(0, baseY - yBar(d.total))} style={{ fill: 'var(--accent)', opacity: 0.9 }}>
            <title>{`${chartMonthYear(d.week)} — ${d.total} commits (running ${d.cum})`}</title>
          </rect>
        ))}
        <polyline points={linePts} style={{ fill: 'none', stroke: 'var(--candle)' }} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {series.map((d, i) => (<circle key={'c' + i} cx={cx(i)} cy={yCum(d.cum)} r="2.2" style={{ fill: 'var(--candle)' }} />))}
        <text x={mL + plotW + 6} y={yCum(maxCum) + 3} textAnchor="start" style={txt(9, 'var(--candle)')}>{maxCum}</text>
        {series.map((d, i) => (i % labelEvery === 0 ? (
          <text key={'x' + i} x={cx(i)} y={baseY + 16} textAnchor="middle" style={txt(9, 'var(--fg-faint)')}>{chartMonth(d.week)}</text>
        ) : null))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '8px 8px 4px' }}>
        <div style={{ display: 'flex', gap: 18, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--fg-subtle)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 10, background: 'var(--accent)', display: 'inline-block', borderRadius: 1 }} />WEEKLY</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 2, background: 'var(--candle)', display: 'inline-block' }} />CUMULATIVE</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--fg-subtle)' }}>
          <span style={{ color: 'var(--fg)' }}>{totalCharted}</span> COMMITS SINCE {sinceLabel.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

window.CommitChart = CommitChart;
