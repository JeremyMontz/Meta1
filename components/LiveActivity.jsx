// LiveActivity.jsx — the index "done things" stream: commits + merged PRs +
// closed issues, newest first. Cache-first paint with honest status (see
// live-github.jsx). No content hygiene by design (KISS); only collapseRepeats
// folds *consecutive* identical commit messages.
//
// Kinds:  COMMIT -> accent (violet) · PR MERGED -> ok (green) · ISSUE CLOSED -> info (blue).
// Filter: opt-in chips, default ALL (the full mixed stream).
// Depth:  over-fetch 20, show 6, "show more" reveals the rest client-side (no new
//         calls); plus a "full history on GitHub" link. No pagination.
// Dedup:  squash-merge twins — a commit carrying a trailing (#NNN) that matches a
//         shown PR MERGED is hidden ONLY when both kinds are in view; it returns in
//         a Commits-only filter.

const FEED_FETCH = 20;
const FEED_SHOW  = 6;
const FEED_KINDS = ['COMMIT', 'PR MERGED', 'ISSUE CLOSED'];
const KIND_COLOR = { 'COMMIT': 'var(--accent)', 'PR MERGED': 'var(--ok)', 'ISSUE CLOSED': 'var(--info)' };

function feedTime(d) {
  const x = new Date(d), p = (n) => String(n).padStart(2, '0');
  return `${p(x.getMonth() + 1)}·${p(x.getDate())} ${p(x.getHours())}:${p(x.getMinutes())}`;
}

function normCommit(c) {
  const msg = (c.commit && c.commit.message ? c.commit.message : '').split('\n')[0];
  const m = msg.match(/\(#(\d+)\)\s*$/);
  return { ts: new Date(c.commit.author.date), kind: 'COMMIT', msg: msg, url: c.html_url, pr: m ? +m[1] : null };
}
function normPR(p) {
  return { ts: new Date(p.merged_at), kind: 'PR MERGED', msg: p.title, url: p.html_url, num: p.number };
}
function normIssue(i) {
  return { ts: new Date(i.closed_at), kind: 'ISSUE CLOSED', msg: i.title, url: i.html_url, num: i.number };
}

function collapseRepeats(rows) {
  const out = [];
  rows.forEach((r) => {
    const last = out[out.length - 1];
    if (last && last.kind === r.kind && last.baseMsg === r.msg) { last.count += 1; }
    else { out.push({ ...r, baseMsg: r.msg, count: 1 }); }
  });
  return out.map((r) => r.count > 1 ? { ...r, msg: `${r.baseMsg} (+${r.count - 1})` } : r);
}

const FEED_LOAD = { padding: '24px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--fg-faint)' };
const FEED_LINK = { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-subtle)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'none' };

const LiveActivity = () => {
  const repo = (window.ME && window.ME.ghRepo) || 'JeremyMontz/Meta1';
  const [pool, setPool] = React.useState([]);
  const [status, setStatus] = React.useState(GH.SYNCING);
  const [cachedAt, setCachedAt] = React.useState(null);
  const [filter, setFilter] = React.useState('ALL');
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const base = `https://api.github.com/repos/${repo}`;
    Promise.all([
      ghFetch(`${base}/commits?per_page=${FEED_FETCH}`),
      ghFetch(`${base}/pulls?state=closed&sort=updated&direction=desc&per_page=${FEED_FETCH}`),
      ghFetch(`${base}/issues?state=closed&sort=updated&direction=desc&per_page=${FEED_FETCH}`),
    ]).then(([c, p, i]) => {
      if (cancelled) return;
      const commits = (Array.isArray(c.data) ? c.data : []).map(normCommit);
      const prs     = (Array.isArray(p.data) ? p.data : []).filter((x) => x.merged_at).map(normPR);
      const issues  = (Array.isArray(i.data) ? i.data : []).filter((x) => !x.pull_request && x.closed_at).map(normIssue);
      const merged  = [...commits, ...prs, ...issues].sort((a, b) => b.ts - a.ts);
      const st = ghCombineStatus([c.status, p.status, i.status]);
      setPool(merged);
      setStatus(merged.length === 0 && st === GH.STREAMING ? GH.EMPTY : st);
      setCachedAt(c.cachedAt || p.cachedAt || i.cachedAt || null);
    });
    return () => { cancelled = true; };
  }, [repo]);

  const showBoth = filter === 'ALL';
  const mergedPRNums = new Set(pool.filter((e) => e.kind === 'PR MERGED').map((e) => e.num));
  let rows = pool.filter((e) => filter === 'ALL' || e.kind === filter);
  if (showBoth) rows = rows.filter((e) => !(e.kind === 'COMMIT' && e.pr && mergedPRNums.has(e.pr)));
  rows = collapseRepeats(rows);
  const visible = expanded ? rows : rows.slice(0, FEED_SHOW);
  const lastActivity = pool.length ? pool[0].ts : null;
  const isSyncing = status === GH.SYNCING;

  const chip = (key, label) => {
    const active = filter === key;
    const accent = key === 'ALL' ? 'var(--fg)' : KIND_COLOR[key];
    const border = key === 'ALL' ? 'var(--line-loud)' : KIND_COLOR[key];
    return (
      <button key={key} onClick={() => { setFilter(key); setExpanded(false); }} style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
        padding: '4px 10px', borderRadius: 2, cursor: 'pointer',
        border: `1px solid ${active ? border : 'var(--line)'}`,
        color: active ? accent : 'var(--fg-subtle)',
        background: active ? 'var(--bg-elev-2)' : 'transparent',
      }}>{label}</button>
    );
  };

  return (
    <section style={{ padding: '0 40px 40px' }}>
      <div style={{ border: '1px solid var(--line)', background: 'var(--bg-elev-1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
          <Eyebrow color="var(--candle)">// RECENT ACTIVITY</Eyebrow>
          <LiveBadge status={status} repo={repo} lastActivity={lastActivity} cachedAt={cachedAt} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid var(--line-soft)' }}>
          {chip('ALL', 'All')}
          {chip('COMMIT', 'Commit')}
          {chip('PR MERGED', 'PR merged')}
          {chip('ISSUE CLOSED', 'Issue closed')}
        </div>

        {isSyncing ? (
          <div style={FEED_LOAD}>// FETCHING EVENTS …</div>
        ) : visible.length === 0 ? (
          <div style={FEED_LOAD}>// QUIET CYCLE · NOTHING TO SHOW HERE</div>
        ) : (
          <div>
            {visible.map((e, idx) => (
              <a key={idx} href={e.url || '#'} target="_blank" rel="noopener noreferrer" style={{
                display: 'grid', gridTemplateColumns: '96px 104px 1fr', gap: 12, padding: '12px 20px',
                borderBottom: '1px solid var(--line-soft)', alignItems: 'baseline',
                fontFamily: 'var(--font-mono)', fontSize: 12, textDecoration: 'none',
              }}>
                <span style={{ color: 'var(--candle)', letterSpacing: '0.1em' }}>{feedTime(e.ts)}</span>
                <span style={{ letterSpacing: '0.12em', color: KIND_COLOR[e.kind] }}>{e.kind}</span>
                <span style={{ color: 'var(--fg-muted)', lineHeight: 1.5 }}>{e.msg}</span>
              </a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
          <div>
            {!expanded && rows.length > FEED_SHOW ? (
              <button onClick={() => setExpanded(true)} style={FEED_LINK}>SHOW MORE ↓ ({rows.length - FEED_SHOW})</button>
            ) : expanded && rows.length > FEED_SHOW ? (
              <button onClick={() => setExpanded(false)} style={FEED_LINK}>SHOW LESS ↑</button>
            ) : (<span />)}
          </div>
          <a href={`https://github.com/${repo}/commits`} target="_blank" rel="noopener noreferrer" style={FEED_LINK}>FULL HISTORY ON GITHUB ↗</a>
        </div>
      </div>
    </section>
  );
};

window.LiveActivity = LiveActivity;
