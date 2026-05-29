// journal-app.jsx — /agents/phil/journal.html app
// Owns: fetch on mount, month-frame state, selected word state,
// derived (inFrame, wordHits, groups), eyebrow + title + scrubber +
// cloud + active-word line + ledger.

const { useState, useEffect, useMemo } = React;

// ── Ambient room (lighter than Spirit; this is a workshop view, not the leaf) ─
const ArchiveRoom = () => (
  <>
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(120% 70% at 50% -8%, color-mix(in oklch, var(--candle) 14%, transparent), transparent 60%)',
    }} />
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(70% 40% at 50% 110%, color-mix(in oklch, var(--accent-deep) 14%, transparent), transparent 65%)',
    }} />
    <svg style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      opacity: 0.04, mixBlendMode: 'overlay', width: '100%', height: '100%',
    }} aria-hidden="true">
      <filter id="archive-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
      </filter>
      <rect width="100%" height="100%" filter="url(#archive-grain)" />
    </svg>
  </>
);

// ── Date helpers ──────────────────────────────────────────────────────────
function monthName(idx) {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx];
}
function monthLongName(idx) {
  return ['January','February','March','April','May','June',
          'July','August','September','October','November','December'][idx];
}
function shortDateLabel(iso) {
  if (!iso) return '';
  var p = iso.split('-');
  if (p.length !== 3) return iso;
  return parseInt(p[2], 10) + ' ' + monthName(+p[1] - 1);
}

// ── Header bits ───────────────────────────────────────────────────────────
const ArchiveEyebrow = () => (
  <div style={{
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.34em',
    textTransform: 'uppercase',
    color: 'var(--candle)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
  }}>
    //Philosophy · Phil · The Journal
  </div>
);

const ArchiveTitle = () => (
  <h1 style={{
    fontFamily: 'var(--font-display)',
    fontWeight: 500,
    fontSize: 'clamp(34px, 5vw, 60px)',
    letterSpacing: '-0.022em',
    lineHeight: 1.05,
    margin: '14px 0 0',
    color: 'var(--fg)',
    fontVariationSettings: '"opsz" 144',
  }}>
    What Phil keeps <em style={{ fontStyle: 'italic' }}>returning</em> to<span style={{ color: 'var(--candle)' }}>.</span>
  </h1>
);

const ArchiveSub = () => (
  <p style={{
    fontFamily: 'var(--font-sans)',
    fontSize: 16,
    color: 'var(--fg-muted)',
    maxWidth: 560,
    lineHeight: 1.55,
    margin: '14px 0 0',
  }}>
    Every entry the lectio has produced, plus an ink-spatter cloud of the words Phil reaches
    for. Pick a month, or click a word, to see what was being said.
  </p>
);

// ── Timeframe scrubber ────────────────────────────────────────────────────
const Scrubber = ({ months, frame, onFrame, total }) => {
  if (!months || months.length === 0) return null;

  function tabStyle(active) {
    return {
      all: 'unset',
      cursor: 'pointer',
      padding: '16px 22px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: active ? 'var(--candle)' : 'var(--fg-muted)',
      borderBottom: active ? '2px solid var(--candle)' : '2px solid transparent',
      boxShadow: active ? '0 6px 18px -10px var(--candle)' : 'none',
      transition: 'color 160ms, border-color 160ms',
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 8,
    };
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
      marginTop: 30,
      width: '100%',
      flexWrap: 'wrap',
    }}>
      {months.map(function (m, i) {
        return (
          <button
            key={m.id}
            onClick={() => onFrame(m.id)}
            style={{
              ...tabStyle(frame === m.id),
              borderLeft: i === 0 ? 'none' : '1px solid var(--line)',
            }}
          >
            <span>{m.label.split(' ')[0]}</span>
            <span style={{ color: 'var(--fg-faint)', fontSize: 10 }}>{m.count}</span>
          </button>
        );
      })}
      <button
        onClick={() => onFrame('all')}
        style={{
          ...tabStyle(frame === 'all'),
          marginLeft: 'auto',
          borderLeft: '1px solid var(--line)',
        }}
      >
        <span>All</span>
        <span style={{ color: 'var(--fg-faint)', fontSize: 10 }}>{total}</span>
      </button>
    </div>
  );
};

const CloudCaption = ({ frameLabel, entryCount, distinctWords }) => (
  <div style={{
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 36,
    flexWrap: 'wrap',
  }}>
    <span style={{
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontSize: 17,
      color: 'var(--fg-muted)',
      fontVariationSettings: '"opsz" 36',
    }}>
      What was being said <span style={{ color: 'var(--fg-subtle)' }}>·</span>{' '}
      <span style={{ color: 'var(--candle)', fontStyle: 'normal' }}>{frameLabel}</span>
    </span>
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--fg-subtle)',
    }}>
      {entryCount} entries · {distinctWords} distinct words
    </span>
  </div>
);

const ActiveWordLine = ({ word, hitCount, onClear }) => (
  <div style={{
    textAlign: 'center',
    margin: '8px 0 24px',
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: 17,
    color: 'var(--fg-muted)',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 14,
    flexWrap: 'wrap',
  }}>
    <span>
      &ldquo;<span style={{ color: 'var(--candle)' }}>{word}</span>&rdquo; surfaces in {hitCount} {hitCount === 1 ? 'entry' : 'entries'}
    </span>
    <button onClick={onClear} style={{
      all: 'unset', cursor: 'pointer',
      fontFamily: 'var(--font-mono)', fontSize: 10,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--fg-subtle)',
      borderBottom: '1px solid transparent',
      paddingBottom: 1,
    }}
       onMouseEnter={e => { e.currentTarget.style.color = 'var(--candle)'; e.currentTarget.style.borderBottomColor = 'var(--candle)'; }}
       onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-subtle)'; e.currentTarget.style.borderBottomColor = 'transparent'; }}>
      ✕ Clear
    </button>
  </div>
);

// ── Ledger row ────────────────────────────────────────────────────────────
const LedgerRow = ({ entry, activeWord, isHit }) => {
  var spiritUrl = '../../graph/spirit.html?date=' + entry.date;
  var dim = activeWord && !isHit;

  return (
    <a href={spiritUrl} style={{
      display: 'grid',
      gridTemplateColumns: '84px minmax(220px,1.05fr) 1.25fr 20px',
      gap: 28,
      alignItems: 'center',
      padding: '20px 8px',
      borderBottom: '1px solid var(--line)',
      textDecoration: 'none',
      color: 'inherit',
      background: isHit && activeWord ? 'color-mix(in oklch, var(--candle) 8%, transparent)' : 'transparent',
      opacity: dim ? 0.28 : 1,
      transition: 'background 160ms, opacity 160ms',
    }}
       onMouseEnter={e => { if (!dim) e.currentTarget.style.background = 'color-mix(in oklch, var(--candle) 5%, transparent)'; }}
       onMouseLeave={e => { e.currentTarget.style.background = isHit && activeWord ? 'color-mix(in oklch, var(--candle) 8%, transparent)' : 'transparent'; }}>

      {/* Date */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: '0.12em',
        color: 'var(--candle)',
      }}>
        {shortDateLabel(entry.date)}
      </span>

      {/* Topic + attribution */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '0.62em',
            color: 'var(--fg-subtle)',
            fontVariationSettings: '"opsz" 14',
          }}>On</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 21,
            color: 'var(--fg)',
            fontVariationSettings: '"opsz" 48',
          }}>{entry.subtopic || '—'}</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--fg-muted)',
        }}>
          {entry.attribution || '—'}
          {' '}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--fg-faint)',
            marginLeft: 6,
          }}>
            {entry.work || ''}
          </span>
        </div>
      </div>

      {/* Phil's response (2-line clamp) */}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 15,
        color: 'var(--fg-muted)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        fontVariationSettings: '"opsz" 18',
        lineHeight: 1.5,
      }}>
        {entry.response}
      </span>

      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        color: 'var(--candle)',
        justifySelf: 'end',
      }}>↗</span>
    </a>
  );
};

// ── Main app ──────────────────────────────────────────────────────────────
const JournalApp = () => {
  const [entries, setEntries] = useState(null);
  const [err, setErr] = useState(null);
  const [frame, setFrame] = useState('all');
  const [word, setWord] = useState(null);

  useEffect(() => {
    window.SPIRIT_DATA.fetchEntries()
      .then(setEntries)
      .catch(e => setErr(e.message || String(e)));
  }, []);

  const months = useMemo(() => entries ? window.spiritMonths(entries) : [], [entries]);

  const inFrame = useMemo(() => {
    if (!entries) return [];
    if (frame === 'all') return entries;
    return entries.filter(e => (e.date || '').slice(0, 7) === frame);
  }, [entries, frame]);

  const wordHits = useMemo(() => {
    if (!word) return new Set();
    var re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    var hits = new Set();
    inFrame.forEach(e => {
      if (re.test(e.response) || re.test(e.subtopic)) hits.add(e.date);
    });
    return hits;
  }, [inFrame, word]);

  const distinctWords = useMemo(() => {
    if (!inFrame || inFrame.length === 0) return 0;
    return window.spiritWordCounts(inFrame).length;
  }, [inFrame]);

  const frameLabel = useMemo(() => {
    if (frame === 'all') return 'the whole run';
    var p = frame.split('-');
    return monthLongName(+p[1] - 1) + ' ' + p[0];
  }, [frame]);

  // Group entries by month for ledger
  const groups = useMemo(() => {
    var map = new Map();
    inFrame.forEach(e => {
      var ym = (e.date || '').slice(0, 7);
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym).push(e);
    });
    return [...map.entries()];
  }, [inFrame]);

  if (err) {
    return (
      <>
        <ArchiveRoom />
        <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--fg-faint)', textTransform: 'uppercase' }}>
          Could not load entries — {err}
        </div>
      </>
    );
  }
  if (!entries) {
    return (
      <>
        <ArchiveRoom />
        <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--fg-faint)', textTransform: 'uppercase' }}>
          Opening the journal…
        </div>
      </>
    );
  }
  if (entries.length === 0) {
    return (
      <>
        <ArchiveRoom />
        <div style={{ maxWidth: 720, margin: '60px auto', padding: '40px 24px', textAlign: 'center' }}>
          <ArchiveEyebrow />
          <ArchiveTitle />
          <ArchiveSub />
          <div style={{ marginTop: 60, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--fg-faint)', textTransform: 'uppercase' }}>
            No entries yet.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ArchiveRoom />

      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: 'clamp(28px, 4vw, 56px) clamp(20px, 5vw, 48px) 80px',
        position: 'relative',
        zIndex: 2,
      }}>
        <ArchiveEyebrow />
        <ArchiveTitle />
        <ArchiveSub />

        <Scrubber months={months} frame={frame} onFrame={setFrame} total={entries.length} />

        <CloudCaption frameLabel={frameLabel} entryCount={inFrame.length} distinctWords={distinctWords} />

        <JournalCloud entries={inFrame} activeWord={word} onWord={(w) => setWord(w === word ? null : w)} />

        {word && (
          <ActiveWordLine
            word={word}
            hitCount={wordHits.size}
            onClear={() => setWord(null)}
          />
        )}

        <div style={{ marginTop: 36 }}>
          {groups.map(function ([ym, group]) {
            var p = ym.split('-');
            var monthLabel = monthLongName(+p[1] - 1) + ' ' + p[0];
            return (
              <div key={ym} style={{ marginBottom: 28 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--fg-faint)',
                  padding: '20px 8px 8px',
                  borderBottom: '1px solid var(--line)',
                }}>
                  {monthLabel}
                </div>
                {group.map(function (e) {
                  return (
                    <LedgerRow
                      key={e.date}
                      entry={e}
                      activeWord={word}
                      isHit={wordHits.has(e.date)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Attribution footer */}
        <div style={{
          maxWidth: 720, margin: '64px auto 0', padding: '32px 24px 0', textAlign: 'center',
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13,
          lineHeight: 1.55, color: 'var(--fg-subtle)',
          borderTop: '1px solid var(--line)',
          fontVariationSettings: '"opsz" 14',
        }}>
          Selections from Whitall Perry, <em>A Treasury of Traditional Wisdom</em> (Perennial Books, 1971).
          Quoted voices are the underlying authors; this practice is a daily reading and response.
        </div>
      </div>
    </>
  );
};

// ── Mount ─────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(<JournalApp />);
