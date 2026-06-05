// LiveActivity.jsx — pulls real GitHub events at page load and renders them
// as a horizontal "lab pulse" strip. Falls back to the hardcoded ACTIVITY
// list if the GitHub API is unreachable or rate-limited.
//
// Data source: https://api.github.com/users/<user>/events/public (CORS-safe,
// no auth required, rate-limited to 60 req/hr per IP). Configure the user
// in data.js (ME.ghUser).
//
// Each event becomes one row: timestamp, kind, message.

// TODO(#162): placeholder fallback rows, moved here from HomeShell.jsx.
// Jeremy has flagged dummy-data-as-failure-state as bad UX — replace with
// an honest offline/empty state when #162 (live GitHub feed fix) is done.
const ACTIVITY = [
  { t: '00:02', kind: 'COMMIT',   tone: 'accent', msg: 'index.html — homepage relaunch, draft 4' },
  { t: '00:41', kind: 'CHECK-IN', tone: 'info',   msg: 'mood: focused · slept 7h · zero anxiety' },
  { t: '03:11', kind: 'AGENT',    tone: 'ok',     msg: 'canon reconciliation · 0 orphans' },
  { t: '11:08', kind: 'COMMIT',   tone: 'accent', msg: 'first-month.html — added July note' },
  { t: '14:22', kind: 'AGENT',    tone: 'warn',   msg: 'pantry ledger · cardamom missing (R!)' },
  { t: '18:00', kind: 'CHECK-IN', tone: 'info',   msg: 'evening recap · 3 wins, 1 bite' },
];

// Map a GitHub event payload → our row shape.
function formatEvent(ev) {
  const t = new Date(ev.created_at);
  const time = `${String(t.getUTCMonth() + 1).padStart(2, '0')}·${String(t.getUTCDate()).padStart(2, '0')}`;
  const repo = ev.repo?.name?.split('/').pop() || 'repo';

  switch (ev.type) {
    case 'PushEvent': {
      const commits = ev.payload?.commits || [];
      const first = commits[0]?.message?.split('\n')[0] || `pushed to ${repo}`;
      const more = commits.length > 1 ? ` (+${commits.length - 1} more)` : '';
      return { t: time, kind: 'COMMIT', tone: 'accent', msg: `${repo} — ${first}${more}` };
    }
    case 'CreateEvent':
      return { t: time, kind: 'CREATE', tone: 'ok', msg: `${repo} — created ${ev.payload?.ref_type || 'thing'}${ev.payload?.ref ? ' · ' + ev.payload.ref : ''}` };
    case 'PullRequestEvent':
      return { t: time, kind: 'PR', tone: 'info', msg: `${repo} — ${ev.payload?.action || ''} PR · ${ev.payload?.pull_request?.title || ''}` };
    case 'IssuesEvent':
      return { t: time, kind: 'ISSUE', tone: 'warn', msg: `${repo} — ${ev.payload?.action || ''} · ${ev.payload?.issue?.title || ''}` };
    case 'WatchEvent':
      return { t: time, kind: 'STAR', tone: 'info', msg: `${repo} — starred` };
    case 'ForkEvent':
      return { t: time, kind: 'FORK', tone: 'info', msg: `${repo} — forked` };
    case 'ReleaseEvent':
      return { t: time, kind: 'RELEASE', tone: 'ok', msg: `${repo} — released ${ev.payload?.release?.tag_name || ''}` };
    default:
      return { t: time, kind: ev.type.replace('Event', '').toUpperCase(), tone: 'info', msg: `${repo}` };
  }
}

const LiveActivity = () => {
  const [state, setState] = React.useState({ status: 'loading', events: [] });

  React.useEffect(() => {
    const user = (window.ME && window.ME.ghUser) || 'JeremyMontz';
    const url = `https://api.github.com/users/${encodeURIComponent(user)}/events/public?per_page=10`;
    let cancelled = false;

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(events => {
        if (cancelled) return;
        const formatted = (events || []).slice(0, 6).map(formatEvent);
        if (formatted.length > 0) {
          setState({ status: 'live', events: formatted });
        } else {
          // No public events recently — show the sample log so the strip
          // isn't dead, but label it as such.
          setState({ status: 'quiet', events: ACTIVITY });
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Graceful fallback: render the hardcoded sample so the strip isn't empty.
        setState({ status: 'fallback', events: ACTIVITY });
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
            <Eyebrow color="var(--candle)">// LIVE FROM THE LAB</Eyebrow>
            <span style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18,
              color: 'var(--fg-muted)',
            }}>recent commits, pulled fresh from GitHub.</span>
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
              <span style={{ color: 'var(--ok)' }}>STREAMING · @{(window.ME && window.ME.ghUser) || 'JeremyMontz'}</span>
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)', color: 'var(--ok)' }} />
            </>)}
            {status === 'fallback' && (<>
              <span style={{ color: 'var(--warn)' }}>OFFLINE · CACHED</span>
              <StatusDot tone="warn" />
            </>)}
            {status === 'quiet' && (<>
              <span style={{ color: 'var(--fg-muted)' }}>QUIET STREAM · SHOWING SAMPLE</span>
              <StatusDot tone="na" />
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
          }}>// FETCHING /events/public …</div>
        ) : events.length === 0 ? (
          <div style={{
            padding: '24px 20px', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.18em', color: 'var(--fg-faint)',
          }}>// QUIET CYCLE · NO PUBLIC EVENTS</div>
        ) : (
          <div>
            {events.map((e, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '70px 90px 1fr',
                gap: 14, padding: '12px 20px',
                borderBottom: i < events.length - 1 ? '1px solid var(--line-soft)' : 'none',
                alignItems: 'baseline',
                fontFamily: 'var(--font-mono)', fontSize: 12,
              }}>
                <span style={{ color: 'var(--fg-faint)', letterSpacing: '0.12em' }}>{e.t}</span>
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
