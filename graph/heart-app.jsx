// heart-app.jsx — /graph/heart.html app
// Owns: state (idx, turning, lock), fetch on mount, keyboard nav,
// ?date= deep link, foot nav, ambient room background.

const { useState, useEffect, useRef, useMemo } = React;

// ── Ambient room — candlelight wash + grain + vignette ──────────────────
const Room = () => (
  <>
    {/* Top candlelight radial */}
    <div className="room-candle" style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(120% 70% at 50% -8%, color-mix(in oklch, var(--candle) 22%, transparent), transparent 60%)',
    }} />
    {/* Bottom violet wash */}
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(70% 40% at 50% 110%, color-mix(in oklch, var(--accent-deep) 18%, transparent), transparent 65%)',
    }} />
    {/* Vignette */}
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%)',
    }} />
    {/* Grain (SVG fractal noise) */}
    <svg style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      opacity: 0.05, mixBlendMode: 'overlay', width: '100%', height: '100%',
    }} aria-hidden="true">
      <filter id="heart-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
      </filter>
      <rect width="100%" height="100%" filter="url(#heart-grain)" />
    </svg>
  </>
);

// ── Eyebrow ─────────────────────────────────────────────────────────────
const HeartGlyph = () => (
  <svg viewBox="0 0 64 64" style={{ width: 56, height: 56, flexShrink: 0, marginTop: 6 }} aria-hidden="true">
    <defs>
      <linearGradient id="heartgrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--candle)"/>
        <stop offset="1" stopColor="color-mix(in oklch, var(--candle) 55%, #1a1018)"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke="url(#heartgrad)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 30 6 C 28 12 22 14 22 20"/>
      <path d="M 36 6 C 36 10 40 12 44 16"/>
      <path d="M 26 9 L 26 18"/>
      <path d="M 40 9 L 42 16"/>
      <path d="M 22 22 C 14 22 10 30 14 38 C 18 46 28 52 32 58 C 36 52 46 46 50 38 C 54 30 50 22 42 22 C 38 22 34 24 32 28 C 30 24 26 22 22 22 Z"/>
      <path d="M 24 30 C 28 34 30 42 28 50" stroke="var(--candle)" strokeDasharray="1 2" strokeWidth="0.8"/>
      <path d="M 42 30 C 38 32 36 38 38 48" stroke="var(--candle)" strokeDasharray="1 2" strokeWidth="0.8"/>
    </g>
    <circle cx="32" cy="38" r="2" fill="var(--err)">
      <animate attributeName="r" values="1.6;3.2;1.6" dur="1s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

// ── Header (below the graph breadcrumbs) ────────────────────
const HeartEyebrow = () => (
  <header style={{
    maxWidth: 1080,
    margin: '0 auto',
    padding: '26px clamp(20px, 4vw, 48px) 18px',
    position: 'relative',
    zIndex: 2,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
      <HeartGlyph />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em',
          color: 'var(--candle)', textTransform: 'uppercase',
        }}>// CLAUDEMONZTER · LECTIO RATIO ARTIFICIOSA</div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 60, fontWeight: 700,
          letterSpacing: '-0.03em', margin: '6px 0 0',
          color: 'var(--fg)', fontVariationSettings: '"opsz" 144', lineHeight: 0.9,
        }}>Heart<span style={{ color: 'var(--candle)' }}>.</span></h1>
        <p style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17,
          color: 'var(--fg-muted)', maxWidth: 720, lineHeight: 1.5,
          fontVariationSettings: '"opsz" 36', margin: '12px 0 0',
        }}>
          Each day, a random page from <span style={{ fontStyle: 'normal' }}>A Treasury of Traditional Wisdom</span> is selected, and an agent named <a href={window.HEART_DATA.PHIL_PAGE_URL} style={{ color: 'var(--candle)', textDecoration: 'none', borderBottom: '1px solid color-mix(in oklch, var(--candle) 45%, transparent)' }}>Phil</a> chooses a quote, reflects on it, and writes the response beside it. We call the skill “lectio,” after the contemplative reading long practiced by Trappist monks. How does an AI steeped in spiritual wisdom grow and change as Phil keeps <a href={window.HEART_DATA.JOURNAL_URL} style={{ color: 'var(--candle)', textDecoration: 'none', borderBottom: '1px solid color-mix(in oklch, var(--candle) 45%, transparent)' }}>a journal</a> over time? This live experiment explores that question — and demonstrates the capability.
        </p>
      </div>
    </div>
  </header>
);

// ── Foot nav ────────────────────────────────────────────────────────────
const FootButton = ({ children, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      all: 'unset',
      cursor: disabled ? 'default' : 'pointer',
      padding: '11px 18px',
      fontFamily: 'var(--font-mono)',
      fontSize: 10.5,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: disabled ? 'var(--fg-faint)' : 'var(--fg-muted)',
      border: '1px solid var(--line-loud)',
      background: 'color-mix(in oklch, var(--bg-elev-2) 60%, transparent)',
      borderRadius: 2,
      opacity: disabled ? 0.28 : 1,
      transition: 'color 160ms, border-color 160ms',
    }}
    onMouseEnter={e => {
      if (disabled) return;
      e.currentTarget.style.color = 'var(--fg)';
      e.currentTarget.style.borderColor = 'var(--candle)';
    }}
    onMouseLeave={e => {
      if (disabled) return;
      e.currentTarget.style.color = 'var(--fg-muted)';
      e.currentTarget.style.borderColor = 'var(--line-loud)';
    }}
  >
    {children}
  </button>
);

const FootNav = ({ entry, isToday, atOldest, onPrev, onNext, onReturnToday }) => {
  if (!entry) return null;
  // 'Thursday · 28 May 2026' → split for the meta display
  var parts = (entry.date || '').split('-');
  var d = parts.length === 3 ? new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2])) : null;
  var dateLabel = d ? (
    d.getUTCDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()] + ' ' + d.getUTCFullYear()
  ) : entry.date;
  var caption = isToday ? 'Today' : (d ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()] : '');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 22,
      padding: '46px 20px 64px',
      flexWrap: 'wrap',
      position: 'relative',
      zIndex: 2,
    }}>
      <FootButton onClick={onPrev} disabled={atOldest}>← Earlier</FootButton>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        minWidth: 160, textAlign: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 16, color: 'var(--fg-muted)',
          fontVariationSettings: '"opsz" 36',
        }}>
          {dateLabel}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.22em', color: 'var(--fg-subtle)',
          textTransform: 'uppercase',
        }}>
          {caption}
          {!isToday && (
            <>
              {' · '}
              <a href="#" onClick={(e) => { e.preventDefault(); onReturnToday(); }} style={{
                color: 'var(--fg-subtle)', textDecoration: 'none',
                borderBottom: '1px solid transparent', paddingBottom: 1,
              }}
                 onMouseEnter={e => { e.currentTarget.style.color = 'var(--candle)'; e.currentTarget.style.borderBottomColor = 'var(--candle)'; }}
                 onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-subtle)'; e.currentTarget.style.borderBottomColor = 'transparent'; }}>
                Return to today
              </a>
            </>
          )}
        </span>
      </div>

      <FootButton onClick={onNext} disabled={isToday}>Later →</FootButton>
    </div>
  );
};

// ── Footer attribution line ─────────────────────────────────────────────
const HeartFootnote = () => (
  <div style={{
    maxWidth: 720, margin: '0 auto', padding: '32px 24px 56px', textAlign: 'center',
    fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13,
    lineHeight: 1.55, color: 'var(--fg-subtle)',
    fontVariationSettings: '"opsz" 14',
    position: 'relative', zIndex: 2,
  }}>
    Selections from Whitall Perry, <em>A Treasury of Traditional Wisdom</em> (Perennial Books, 1971).
    Quoted voices are the underlying authors; this practice is a daily reading and response.
  </div>
);

// ── Loading / empty states ──────────────────────────────────────────────
const Skeleton = ({ message }) => (
  <div style={{
    maxWidth: 720, margin: '60px auto', padding: '40px 24px', textAlign: 'center',
    fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em',
    color: 'var(--fg-faint)', textTransform: 'uppercase',
  }}>
    {message}
  </div>
);

// ── Main app ────────────────────────────────────────────────────────────
const HeartApp = () => {
  const [entries, setEntries] = useState(null);
  const [err, setErr] = useState(null);
  const [idx, setIdx] = useState(0);
  const [turning, setTurning] = useState('');
  const lockRef = useRef(false);
  const [layout, setLayout] = useState(() => window.innerWidth >= 820 ? 'spread' : 'single');

  // Fetch
  useEffect(() => {
    window.HEART_DATA.fetchEntries()
      .then((list) => {
        setEntries(list);
        // ?date= deep link
        var sp = new URLSearchParams(window.location.search);
        var d = sp.get('date');
        if (d) {
          var found = list.findIndex((e) => e.date === d);
          if (found >= 0) setIdx(found);
        }
      })
      .catch((e) => setErr(e.message || String(e)));
  }, []);

  // Responsive spread → single under 820px
  useEffect(() => {
    function onResize() {
      setLayout(window.innerWidth >= 820 ? 'spread' : 'single');
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keyboard arrows
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Update URL ?date= so deep links stay sharable as user pages back/forward
  useEffect(() => {
    if (!entries || !entries[idx]) return;
    var url = new URL(window.location.href);
    if (idx === 0) {
      url.searchParams.delete('date');
    } else {
      url.searchParams.set('date', entries[idx].date);
    }
    window.history.replaceState({}, '', url.toString());
  }, [idx, entries]);

  // Page-turn (data is newest-first; next=toward-today=idx-1, prev=earlier=idx+1)
  function turn(direction) {
    if (!entries || lockRef.current) return;
    if (direction === 'next' && idx === 0) return;
    if (direction === 'prev' && idx === entries.length - 1) return;
    lockRef.current = true;
    setTurning(direction === 'next' ? 'out-next' : 'out-prev');
    setTimeout(() => {
      setIdx((i) => i + (direction === 'next' ? -1 : 1));
      setTurning(direction === 'next' ? 'in-next' : 'in-prev');
      setTimeout(() => {
        setTurning('');
        lockRef.current = false;
      }, 360);
    }, 260);
  }
  function goPrev() { turn('prev'); }
  function goNext() { turn('next'); }
  function goToday() {
    if (!entries || lockRef.current || idx === 0) return;
    turn('next');
    // Visual: animate one step toward today. For a multi-step jump, do an
    // instant set after a tiny delay so the animation reads as "snap back".
    // For v1 we keep the simple single-step animation per arrow press; if
    // entries grow, this becomes "click Return to today again" which is OK.
    if (idx > 1) {
      setTimeout(() => {
        lockRef.current = false;
        setTurning('');
        setIdx(0);
      }, 620);
    }
  }

  if (err) {
    return (
      <>
        <Room />
        <HeartEyebrow />
        <Skeleton message={'Could not load entries — ' + err} />
      </>
    );
  }
  if (!entries) {
    return (
      <>
        <Room />
        <HeartEyebrow />
        <Skeleton message="Lighting the candle…" />
      </>
    );
  }
  if (entries.length === 0) {
    return (
      <>
        <Room />
        <HeartEyebrow />
        <Skeleton message="No entries yet." />
        <HeartFootnote />
      </>
    );
  }

  var entry = entries[idx];
  var isToday = idx === 0;
  var atOldest = idx === entries.length - 1;

  return (
    <>
      <Room />
      <HeartEyebrow />

      <main style={{
        padding: '12px clamp(20px, 4vw, 48px) 0',
        position: 'relative',
        zIndex: 2,
      }}>
        <HeartLeaf entry={entry} layout={layout} turning={turning} />
      </main>

      <FootNav
        entry={entry}
        isToday={isToday}
        atOldest={atOldest}
        onPrev={goPrev}
        onNext={goNext}
        onReturnToday={goToday}
      />

      <HeartFootnote />
    </>
  );
};

// ── Mount ───────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(<HeartApp />);
