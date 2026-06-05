// LiveActivity.jsx — pulls recent commits at page load and renders them
// as a horizontal "lab pulse" strip.
//
// Data source: https://api.github.com/repos/<repo>/commits (CORS-safe,
// no auth required, rate-limited to 60 req/hr per IP). Configure the repo
// in data.js (ME.ghRepo). The commits API always carries full messages —
// unlike the events API, whose PushEvent payloads come back with an empty
// commits array on this repo (#162 root cause, part two; part one was
// 'JeremyMontz' being an Org, so user-events were always empty).
//
// No placeholder fallbacks by design: an unreachable API shows OFFLINE,
// a quiet stream shows an honest empty state.
//
// Each commit becomes one row: date+time, kind, message (first line).
// Consecutive identical messages collapse into one row with a (+N) count.

// Map a commit (from /repos/:repo/commits) → our row shape.
function formatCommit(c) {
  const d = new Date(c.commit.author.date);
  const pad = (n) => String(n).padStart(2, '0');
  const time = `${pad(d.getMonth() + 1)}·${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { t: time, kind: 'COMMIT', tone: 'accent', msg: c.commit.message.split('\n')[0] };
}

// Collapse consecutive rows with identical messages → "msg (+N)".
function collapseRepeats(rows) {
  const out = [];
  rows.forEach(r => {
    const last = out[out.length - 1];
    if (last && last.baseMsg === r.msg) {
      last.count += 1;
    } else {
      out.push({ ...r, baseMsg: r.msg, count: 1 });
    }
  });
  return out.map(r => r.count > 1 ? { ...r, msg: `${r.baseMsg} (+${r.count - 1})` } : r);
}

const LiveActivity = () => {
  const [state, setState] = React.useState({ status: 'loading', events: [] });

  React.useEffect(() => {
    const repo = (window.ME && window.ME.ghRepo) || 'JeremyMontz/Meta1';
    const url = `https://api.github.com/repos/${repo}/commits?per_page=10`;
    let cancelled = false;

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(commits => {
        if (cancelled) return;
        const rows = collapseRepeats((commits || []).map(formatCommit)).slice(0, 6);
        if (rows.length > 0) {
          setState({ status: 'live', events: rows });
        } else {
          // Empty repo / no commits — honest empty state.
          setState({ status: 'empty', events: [] });
        }
      })
      .catch(() => {
        if (cancelled) return;
        // API unreachable or rate-limited — say so, show nothing fake.
        setState({ status: 'offline', events: [] });
      });

    return () => { cancelled = true; };
  }, []);

  const { status, events } = state;
  const isLoading = status === 'loading';

  return (
    <section style={{ padding: '0 40px 40px' }}>
      <div style={{
        border: '1px solid var(--line)', background: 'var(--bg-elev-1)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderBottom: '1px solid var(--line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Eyebrow color="var(--candle)">// RECENT GITHUB ACTIVITY</Eyebrow>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>
            {status === 'loading' && (<>
              <span style={{ color: 'var(--fg-faint)' }}>SYNCING</span>
              <StatusDot tone="na" />
            </>)}
            {status === 'live' && (<>
              <span style={{ color: 'var(--ok)' }}>STREAMING · {(window.ME && window.ME.ghRepo) || 'JeremyMontz/Meta1'}</span>
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)', color: 'var(--ok)' }} />
            </>)}
            {status === 'offline' && (<>
              <span style={{ color: 'var(--warn)' }}>OFFLINE · GITHUB UNREACHABLE</span>
              <StatusDot tone="warn" />
            </>)}
            {status === 'empty' && (<>
              <span style={{ color: 'var(--fg-faint)' }}>NO RECENT EVENTS</span>
              <StatusDot tone="na" />
            </>)}
          </div>
        </div>

        {isLoading ? (
          <div style={{
            padding: '24px 20px', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.22em', color: 'var(--fg-faint)',
          }}>// FETCHING EVENTS …</div>
        ) : events.length === 0 ? (
          <div style={{
            padding: '24px 20px', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.18em', color: 'var(--fg-faint)',
          }}>// QUIET CYCLE · NO RECENT COMMITS</div>
        ) : (
          <div>
            {events.map((e, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '105px 90px 1fr',
                gap: 14, padding: '12px 20px',
                borderBottom: i < events.length - 1 ? '1px solid var(--line-soft)' : 'none',
                alignItems: 'baseline',
                fontFamily: 'var(--font-mono)', fontSize: 12,
              }}>
                <span style={{ color: 'var(--candle)', letterSpacing: '0.12em' }}>{e.t}</span>
                <span style={{
                  letterSpacing: '0.14em',
                  color: e.tone === 'accent' ? 'var(--accent)' :
                         e.tone === 'warn'   ? 'var(--warn)'   :
                         e.tone === 'ok'     ? 'var(--ok)'     :
                                                'var(--info)',
                }}>{e.kind}</span>
                <span style={{ color: 'var(--fg-muted)', lineHeight: 1.5 }}>{e.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

window.LiveActivity = LiveActivity;
