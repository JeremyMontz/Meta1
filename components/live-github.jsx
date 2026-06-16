// live-github.jsx — shared GitHub fetch + cache + honest status + LiveBadge.
// Loaded via <script type="text/babel"> AFTER Primitives.jsx and BEFORE
// LiveActivity.jsx / CommitChart.jsx.
//
// Honesty model (the brand requirement):
//   STREAMING (green pulse) — a live fetch succeeded THIS load (all sources fresh).
//   CACHED    (amber)       — showing stored data: pre-refresh paint, a refresh that
//                             fell back to cache, or a mixed fresh/stale set.
//   OFFLINE   (red)         — no cache AND the fetch failed.
//   EMPTY     (neutral)     — fetch succeeded, zero events.
//   SYNCING   (neutral)     — no cache yet, first fetch in flight.
//
// Cache: sessionStorage, 10-min TTL, keyed on the request URL.

const GH_TTL = 10 * 60 * 1000;
const GH_CACHE_PREFIX = 'ghcache:';

const GH = { SYNCING: 'syncing', STREAMING: 'streaming', CACHED: 'cached', OFFLINE: 'offline', EMPTY: 'empty', SNAPSHOT: 'snapshot' };

function ghReadCache(url) {
  try {
    const raw = sessionStorage.getItem(GH_CACHE_PREFIX + url);
    if (!raw) return null;
    const o = JSON.parse(raw);
    return (o && typeof o.ts === 'number') ? o : null;
  } catch (e) { return null; }
}

function ghWriteCache(url, data) {
  try { sessionStorage.setItem(GH_CACHE_PREFIX + url, JSON.stringify({ ts: Date.now(), data })); }
  catch (e) { /* quota / private mode — skip */ }
}

// Fetch JSON, cache on success, fall back to cache on failure.
// opts: { accept, retry202 }. Resolves { data, fresh, fromCache, status, cachedAt? }.
function ghFetch(url, opts) {
  opts = opts || {};
  const headers = opts.accept ? { Accept: opts.accept } : {};
  const cached = ghReadCache(url);

  const attempt = (left) => fetch(url, { headers }).then((r) => {
    if (r.status === 202) {
      if (left > 0) return new Promise((res) => setTimeout(res, 1500)).then(() => attempt(left - 1));
      const e = new Error('202'); e.code = 202; throw e;
    }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json().then((data) => {
      ghWriteCache(url, data);
      return { data: data, fresh: true, fromCache: false, status: GH.STREAMING };
    });
  });

  return attempt(opts.retry202 || 0).catch(() => {
    if (cached) return { data: cached.data, fresh: false, fromCache: true, status: GH.CACHED, cachedAt: cached.ts };
    return { data: null, fresh: false, fromCache: false, status: GH.OFFLINE };
  });
}

function ghCombineStatus(parts) {
  if (!parts || !parts.length) return GH.OFFLINE;
  if (parts.every((p) => p === GH.STREAMING)) return GH.STREAMING;
  if (parts.some((p) => p === GH.STREAMING || p === GH.CACHED)) return GH.CACHED;
  return GH.OFFLINE;
}

function ghAgo(when) {
  if (!when) return '';
  const t = (when instanceof Date) ? when.getTime() : when;
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

const LiveBadge = ({ status, repo, lastActivity, cachedAt, snapshotDate }) => {
  const r = repo || 'JeremyMontz/Meta1';
  const row = { display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase' };

  let label, color, dot;
  if (status === GH.STREAMING) {
    label = 'STREAMING · ' + r; color = 'var(--ok)';
    dot = <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)', color: 'var(--ok)' }} />;
  } else if (status === GH.CACHED) {
    label = 'CACHED' + (cachedAt ? ' · ' + ghAgo(cachedAt) : ''); color = 'var(--warn)';
    dot = <StatusDot tone="warn" />;
  } else if (status === GH.SNAPSHOT) {
    label = 'SNAPSHOT' + (snapshotDate ? ' · ' + snapshotDate : ''); color = 'var(--warn)';
    dot = <StatusDot tone="warn" />;
  } else if (status === GH.OFFLINE) {
    label = 'OFFLINE · GITHUB UNREACHABLE'; color = 'var(--err)';
    dot = <StatusDot tone="err" />;
  } else if (status === GH.EMPTY) {
    label = 'NO RECENT EVENTS'; color = 'var(--fg-faint)';
    dot = <StatusDot tone="na" />;
  } else {
    label = 'SYNCING'; color = 'var(--fg-faint)';
    dot = <StatusDot tone="na" />;
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
      <span style={row}><span style={{ color }}>{label}</span>{dot}</span>
      {lastActivity ? (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-faint)' }}>
          LAST ACTIVITY · {ghAgo(lastActivity)}
        </span>
      ) : null}
    </span>
  );
};

Object.assign(window, { GH, GH_TTL, ghFetch, ghCombineStatus, ghAgo, LiveBadge });
