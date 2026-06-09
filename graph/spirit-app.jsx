// spirit/spirit-app.jsx — Spirit page shell (production)
// Stripped: tweaks panel, embed preview, Section component, StatusCardMock
// Wired: GAS fetch on load, GAS POST on commit + agent save

const PROD_THEME  = 'cabinet';
const PROD_HYDE   = true;
const PROD_CRAZY  = 10;
const PROD_MONITOR = true;

const crazyVars = (c) => ({
  '--cm-grid-opacity':       String((c / 10) * 1.0),
  '--cm-scan-opacity':       String((c / 10) * 0.7),
  '--cm-vignette-opacity':   String((c / 10) * 0.5),
  '--cm-glitch-duration':    `${Math.max(2, 12 - c)}s`,
  '--cm-flicker-duration':   `${Math.max(3, 14 - c)}s`,
  '--cm-title-rotate':       `${c >= 8 ? (-0.4 - (c - 7) * 0.4) : 0}deg`,
});

const crazyLabel = (c) => {
  if (c <= 1) return 'pure clinic';
  if (c <= 3) return 'cool head';
  if (c <= 5) return 'lab-coat';
  if (c <= 7) return 'flickering';
  if (c <= 9) return 'unhinged';
  return 'monster';
};

// ── GAS POST helper ───────────────────────────────────────────────────────
// Uses text/plain to avoid CORS preflight; mode: no-cors returns opaque
// response. GAS returns 302 on success; treat non-throw as success.
async function gasPost(payload) {
  await fetch(SPIRIT_GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
    mode: 'no-cors',
  });
}

// ─── Header ────────────────────────────────────────────────────────────────
const SpiritHeader = ({ hyde, crazy, dirtyCount, onCommit, onDiscard, committing,
                       rev, lastSync, customCount, totalCells }) => (
  <header style={{ padding: '20px 0 14px', borderBottom: '1px solid var(--line)' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
      <SpiritGlyph hyde={hyde}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em',
          color: 'var(--accent)', textTransform: 'uppercase',
        }}>// CLAUDEMONZTER · AMALGAMATION</div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 60, fontWeight: 700,
          letterSpacing: '-0.03em', margin: '6px 0 0',
          color: 'var(--fg)', fontVariationSettings: '"opsz" 144', lineHeight: 0.9,
          transform: 'rotate(var(--cm-title-rotate))',
        }}>Spirit<span style={{ color: 'var(--accent)' }}>.</span></h1>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 8, flexWrap: 'wrap',
        }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17,
            color: 'var(--fg-muted)', maxWidth: 680, lineHeight: 1.4,
            fontVariationSettings: '"opsz" 36', margin: 0,
          }}>
            The persona matrix. Each row is a tuning dial, some more reliable than others. Each column is an agent with authorities and hard boundaries.
            Click any cell to tinker — agents automatically adopt persona changes at session start. 
          </p>
          {hyde && crazy >= 6 && (
            <span className="hyde-stamp" style={{
              fontFamily: 'var(--font-hyde)', fontSize: 28, color: 'var(--party)',
              letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap',
              textShadow: '0 0 12px color-mix(in oklch, var(--party) 50%, transparent)',
            }}>The experiment is alive.</span>
          )}
        </div>

        {/* Light stats sub-strip */}
        <div style={{
          marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
          color: 'var(--fg-subtle)', textTransform: 'uppercase',
        }}>
          <span><span style={{ color: 'var(--accent)' }}>rev</span> 0{String(rev).padStart(3, '0')}</span>
          <span><span style={{ color: 'var(--fg-faint)' }}>sync</span> {lastSync}</span>
          <span><span style={{ color: 'var(--fg-faint)' }}>custom</span> {customCount}/{totalCells}</span>
          <span style={{ color: 'var(--fg-faint)' }}>·</span>
          <span><span style={{ color: 'var(--fg-faint)' }}>mood</span> {crazyLabel(crazy)} {crazy}/10 {hyde ? '· hyde' : ''}</span>
        </div>
      </div>

      {/* Commit dock */}
      <div style={{
        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
      }}>
        {dirtyCount > 0 ? (
          <>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em',
              color: 'var(--warn)', textTransform: 'uppercase',
            }}>
              ● {dirtyCount} pending edit{dirtyCount > 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={onDiscard} style={{
                all: 'unset', cursor: 'pointer', padding: '8px 12px',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'var(--fg-muted)', border: '1px solid var(--line-loud)', borderRadius: 1,
              }}>discard</button>
              <button onClick={onCommit} disabled={committing} style={{
                all: 'unset', cursor: committing ? 'wait' : 'pointer',
                padding: '8px 14px',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                background: 'var(--accent)', color: 'var(--bg)',
                borderRadius: 1, opacity: committing ? 0.6 : 1,
              }}>
                {committing ? <>committing… <span className="cm-spinner">⟳</span></>
                            : <>▸ commit · GAS</>}
              </button>
            </div>
            <div style={{
              fontFamily: 'var(--font-hand)', fontSize: 14, color: 'var(--fg-subtle)',
              transform: 'rotate(-1.5deg)', textAlign: 'right',
            }}>cascades to cowork ▸ sheet ▸ skill ▸ agents</div>
          </>
        ) : (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em',
            color: 'var(--ok)', textTransform: 'uppercase', textAlign: 'right',
          }}>✓ canon</div>
        )}
      </div>
    </div>
  </header>
);

const SpiritGlyph = ({ hyde }) => (
  <svg viewBox="0 0 64 64" style={{ width: 56, height: 56, flexShrink: 0, marginTop: 6 }}>
    <defs>
      <linearGradient id="hgrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--accent)"/>
        <stop offset="1" stopColor="var(--accent-deep)"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke="url(#hgrad)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 30 6 C 28 12 22 14 22 20"/>
      <path d="M 36 6 C 36 10 40 12 44 16"/>
      <path d="M 26 9 L 26 18"/>
      <path d="M 40 9 L 42 16"/>
      <path d="M 22 22 C 14 22 10 30 14 38 C 18 46 28 52 32 58 C 36 52 46 46 50 38 C 54 30 50 22 42 22 C 38 22 34 24 32 28 C 30 24 26 22 22 22 Z"/>
      <path d="M 24 30 C 28 34 30 42 28 50" stroke={hyde ? 'var(--party)' : 'var(--bolt)'} strokeDasharray="1 2" strokeWidth="0.8"/>
      <path d="M 42 30 C 38 32 36 38 38 48" stroke={hyde ? 'var(--party)' : 'var(--bolt)'} strokeDasharray="1 2" strokeWidth="0.8"/>
    </g>
    <circle cx="32" cy="38" r="2" fill="var(--err)">
      <animate attributeName="r" values="1.6;3.2;1.6" dur="1s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

// ─── Agent details modal — edit signature + hard boundaries ───────────────
const AgentDetailsModal = ({ agent, onClose, onSave, saving }) => {
  const [signature, setSignature] = React.useState('');
  const [boundaries, setBoundaries] = React.useState([]);

  React.useEffect(() => {
    if (agent) {
      setSignature(agent.signature || '');
      setBoundaries((agent.boundaries || []).map(b => ({ ...b })));
    }
  }, [agent?.id]);

  if (!agent) return null;

  const dirty = signature !== (agent.signature || '') ||
                JSON.stringify(boundaries) !== JSON.stringify(agent.boundaries || []);

  const isHuman = agent.kind === 'human';
  const updateB = (i, patch) =>
    setBoundaries(arr => arr.map((b, j) => j === i ? { ...b, ...patch } : b));
  const removeB = (i) => setBoundaries(arr => arr.filter((_, j) => j !== i));
  const addB    = (t) => setBoundaries(arr => [...arr, { t, text: '' }]);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 90, animation: 'fade-in 200ms',
      }}/>
      <div role="dialog" aria-modal="true" style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(640px, 96vw)', maxHeight: '90vh',
        background: 'var(--bg-elev-1)', border: '1px solid var(--line-loud)',
        borderLeft: `3px solid ${isHuman ? 'var(--candle)' : 'var(--accent)'}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        zIndex: 100, display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px 12px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em',
              color: 'var(--accent)', textTransform: 'uppercase',
            }}>// AGENT DETAILS</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600,
                letterSpacing: '-0.01em', color: 'var(--fg)', margin: 0,
                fontVariationSettings: '"opsz" 72',
              }}>{agent.name}</h2>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
                color: 'var(--fg-subtle)', textTransform: 'uppercase',
              }}>{agent.bracket} · {agent.feature || '—'}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            all: 'unset', cursor: 'pointer',
            padding: '6px 10px', color: 'var(--fg-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', border: '1px solid var(--line-loud)', borderRadius: 1,
          }}>✕ close</button>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 22px', overflowY: 'auto', flex: 1 }}>
          {/* Signature */}
          <label style={{
            display: 'block', marginBottom: 6,
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em',
            color: 'var(--fg-faint)', textTransform: 'uppercase',
          }}>// signature — the one-line description</label>
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg)', color: 'var(--fg)',
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              fontSize: 14, lineHeight: 1.5,
              border: '1px solid var(--line-loud)', padding: '10px 12px',
              borderRadius: 1, outline: 'none', resize: 'vertical',
              fontVariationSettings: '"opsz" 36',
            }}
            placeholder="The architect. Proposes structures. Defers direction to Jeremy."
          />

          <div style={{ height: 18 }}/>

          {/* Boundaries */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <label style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em',
              color: 'var(--err)', textTransform: 'uppercase',
            }}>◇ hard boundaries</label>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em',
              color: 'var(--fg-faint)', textTransform: 'uppercase',
            }}>
              <span style={{ color: 'var(--err)' }}>F</span> functional ·
              <span style={{ color: 'var(--warn)' }}> A</span> authority
            </span>
          </div>
          <p style={{
            margin: '4px 0 10px', fontSize: 11, color: 'var(--fg-subtle)', lineHeight: 1.4,
          }}>
            Binary constraints. <em>F</em> = won't do (functional).
            <em> A</em> = stops and defers to Jeremy (authority).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {boundaries.length === 0 && (
              <div style={{
                padding: '14px 12px', textAlign: 'center',
                border: '1px dashed var(--line-loud)',
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)',
                letterSpacing: '0.08em',
              }}>no boundaries yet · add one below</div>
            )}
            {boundaries.map((b, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 32px',
                gap: 6, alignItems: 'center',
              }}>
                <button onClick={() => updateB(i, { t: b.t === 'F' ? 'A' : 'F' })}
                        title={`Toggle ${b.t === 'F' ? 'functional' : 'authority'} → ${b.t === 'F' ? 'authority' : 'functional'}`}
                        style={{
                  all: 'unset', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                  textAlign: 'center', padding: '6px 0',
                  color: b.t === 'A' ? 'var(--warn)' : 'var(--err)',
                  border: `1px solid ${b.t === 'A' ? 'var(--warn)' : 'var(--err)'}`,
                  borderRadius: 1,
                }}>{b.t}</button>
                <input
                  value={b.text}
                  onChange={(e) => updateB(i, { text: e.target.value })}
                  placeholder="What this agent won't do, or where it defers to Jeremy"
                  style={{
                    background: 'var(--bg)', color: 'var(--fg)',
                    fontFamily: 'var(--font-sans)', fontSize: 13,
                    border: '1px solid var(--line-loud)',
                    padding: '7px 10px', borderRadius: 1, outline: 'none',
                  }}
                />
                <button onClick={() => removeB(i)} style={{
                  all: 'unset', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: 'var(--fg-faint)', textAlign: 'center', padding: '6px 0',
                  border: '1px solid transparent', borderRadius: 1,
                }} title="Remove boundary">✕</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => addB('F')} style={{
              all: 'unset', cursor: 'pointer',
              padding: '6px 10px',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--err)',
              border: '1px dashed color-mix(in oklch, var(--err) 50%, transparent)',
              borderRadius: 1,
            }}>+ add functional</button>
            <button onClick={() => addB('A')} style={{
              all: 'unset', cursor: 'pointer',
              padding: '6px 10px',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--warn)',
              border: '1px dashed color-mix(in oklch, var(--warn) 50%, transparent)',
              borderRadius: 1,
            }}>+ add authority</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 22px', borderTop: '1px solid var(--line-loud)',
          background: 'var(--bg)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            flex: 1,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em',
            color: dirty ? 'var(--warn)' : 'var(--fg-faint)',
            textTransform: 'uppercase',
          }}>
            {saving ? '● saving…' : dirty ? '● unsaved changes' : '✓ no changes'}
          </span>
          <button onClick={onClose} style={{
            all: 'unset', cursor: 'pointer', padding: '8px 12px',
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--fg-muted)', border: '1px solid var(--line-loud)', borderRadius: 1,
          }}>cancel</button>
          <button onClick={() => onSave(signature, boundaries.filter(b => b.text.trim()))}
                  disabled={!dirty || saving}
                  style={{
            all: 'unset', cursor: dirty && !saving ? 'pointer' : 'not-allowed',
            padding: '8px 16px',
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            background: 'var(--accent)', color: 'var(--bg)',
            borderRadius: 1, opacity: dirty && !saving ? 1 : 0.4,
          }}>{saving ? '▸ saving…' : '▸ save'}</button>
        </div>
      </div>
    </>
  );
};

// ─── Loading state ────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
    color: 'var(--fg-muted)',
  }}>
    <SpiritGlyph hyde={PROD_HYDE}/>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.22em',
      textTransform: 'uppercase', animation: 'pulse 1.4s ease-in-out infinite',
    }}>fetching persona matrix…</div>
  </div>
);

const ErrorScreen = ({ message, onRetry }) => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
    color: 'var(--err)',
  }}>
    <SpiritGlyph hyde={false}/>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em',
      textTransform: 'uppercase', textAlign: 'center', maxWidth: 480,
    }}>
      failed to load persona data
      <div style={{ fontSize: 10, color: 'var(--fg-faint)', marginTop: 6, letterSpacing: '0.08em' }}>
        {message}
      </div>
    </div>
    <button onClick={onRetry} style={{
      all: 'unset', cursor: 'pointer', padding: '8px 14px',
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.2em', textTransform: 'uppercase',
      background: 'var(--accent)', color: 'var(--bg)', borderRadius: 1,
    }}>▸ retry</button>
  </div>
);

// ─── Main app ──────────────────────────────────────────────────────────────
const App = () => {
  const hyde  = PROD_HYDE;
  const crazy = PROD_CRAZY;

  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState(null);
  const [agents, setAgents]   = React.useState([]);
  const [drafts, setDrafts]   = React.useState({});
  const [focusedCell, setFocusedCell] = React.useState(null);
  const [editingAgentId, setEditingAgentId] = React.useState(null);
  const [savingAgent, setSavingAgent] = React.useState(false);
  const [rev, setRev]         = React.useState(0);
  const [lastSync, setLastSync] = React.useState('—');
  const [committing, setCommitting] = React.useState(false);

  // Apply theme + crazy on mount
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', PROD_THEME === 'lab' ? '' : PROD_THEME);
    root.classList.toggle('hyde', hyde);
    for (let i = 0; i <= 10; i++) root.classList.remove(`crazy-${i}`);
    root.classList.add(`crazy-${crazy}`);
    const vars = crazyVars(crazy);
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  }, []);

  // Fetch data from GAS on mount
  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await window.fetchSpiritData();
      setAgents([...window.SPIRIT_AGENTS]);
      setLastSync('just now');
      setLoading(false);
    } catch (e) {
      setError(e.message || 'Network error');
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadData(); }, [loadData]);

  // Tick the sync timer
  React.useEffect(() => {
    const id = setInterval(() => {
      if (!committing) {
        setLastSync(prev => {
          const m = prev.match(/^(\d+)m/);
          if (m) return (parseInt(m[1]) + 1) + 'm ago';
          if (prev === 'just now') return '1m ago';
          return prev;
        });
      }
    }, 60000);
    return () => clearInterval(id);
  }, [committing]);

  const liveAgents = React.useMemo(() => agents.map(a => {
    const draft = drafts[a.id];
    if (!draft || !a.dials) return a;
    return {
      ...a,
      dials: Object.fromEntries(Object.entries(a.dials).map(([k, v]) => [k, {
        ...v, v: draft[k] !== undefined ? draft[k] : v.v,
      }])),
    };
  }), [agents, drafts]);

  const onFocus = (agentId, dialId) => {
    if (!agentId || !dialId) { setFocusedCell(null); return; }
    setFocusedCell({ agentId, dialId });
  };

  const onSelect = (agentId, dialId, value) => {
    const a = agents.find(x => x.id === agentId);
    const original = a.dials?.[dialId]?.v;
    setDrafts(d => {
      const cur = { ...(d[agentId] || {}) };
      if (value === original) delete cur[dialId];
      else cur[dialId] = value;
      const next = { ...d };
      if (Object.keys(cur).length === 0) delete next[agentId];
      else next[agentId] = cur;
      return next;
    });
  };

  const dirtyCount = React.useMemo(() => Object.values(drafts).reduce(
    (n, byDial) => n + Object.keys(byDial).length, 0
  ), [drafts]);
  const customCount = React.useMemo(() => agents.reduce((acc, a) => {
    if (!a.dials) return acc;
    return acc + Object.entries(a.dials).filter(([dialId, v]) => {
      const dial = window.SPIRIT_DIALS.find(d => d.id === dialId);
      return v.v && v.v !== 'Default' && (dial?.settings || []).includes(v.v);
    }).length;
  }, 0), [agents]);
  const totalCells = Math.max(0, (agents.length - 1)) * window.SPIRIT_DIALS.length;

  // ── Commit dials to GAS ──
  const commit = async () => {
    if (dirtyCount === 0) return;
    setCommitting(true);

    // Build edits array for GAS
    const edits = [];
    for (const [agentId, byDial] of Object.entries(drafts)) {
      for (const [dialId, value] of Object.entries(byDial)) {
        edits.push({ agentId, dialId, value });
      }
    }

    try {
      await gasPost({ action: 'updateDials', edits });
    } catch (e) {
      // no-cors means we can't read the response; treat as sent
      console.warn('Commit POST (no-cors):', e);
    }

    // Optimistic update — apply drafts to local state
    let newRev = rev;
    const next = agents.map(a => {
      const draft = drafts[a.id];
      if (!draft || !a.dials) return a;
      const newDials = { ...a.dials };
      for (const [dialId, v] of Object.entries(draft)) {
        const oldV = a.dials[dialId]?.v;
        if (oldV === v) continue;
        newRev += 1;
        newDials[dialId] = { ...newDials[dialId], v };
      }
      return { ...a, dials: newDials };
    });
    setAgents(next);
    setRev(newRev);
    setLastSync('just now');
    setDrafts({});
    setFocusedCell(null);
    setCommitting(false);
  };

  const discard = () => {
    setDrafts({});
    setFocusedCell(null);
  };

  // ── Save agent metadata (signature + boundaries) to GAS ──
  const saveAgent = async (signature, boundaries) => {
    const agentId = editingAgentId;
    setSavingAgent(true);

    try {
      await gasPost({
        action: 'updateAgent',
        agentId,
        signature,
        boundaries,
      });
    } catch (e) {
      console.warn('Agent save POST (no-cors):', e);
    }

    // Optimistic update
    setAgents(prev => prev.map(a => a.id === agentId
      ? { ...a, signature, boundaries }
      : a));
    setSavingAgent(false);
    setEditingAgentId(null);
    setLastSync('just now');
  };

  if (loading) return <LoadingScreen/>;
  if (error)   return <ErrorScreen message={error} onRetry={loadData}/>;

  return (
    <div className={`spirit-app crazy-${crazy} ${hyde ? 'hyde' : ''}`} style={{
      minHeight: '100vh', position: 'relative', color: 'var(--fg)',
    }}>
      <div className="bg-grid-layer"/>
      <div className="bg-scan-layer"/>
      {hyde && <div className="bg-vignette-layer"/>}

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1480, margin: '0 auto', padding: '20px 32px 80px' }}>

        <SpiritHeader hyde={hyde} crazy={crazy}
                     dirtyCount={dirtyCount} onCommit={commit} onDiscard={discard}
                     committing={committing}
                     rev={rev} lastSync={lastSync}
                     customCount={customCount} totalCells={totalCells}/>

        {PROD_MONITOR && (
          <div style={{ marginTop: 18 }}>
            <HeartMonitor live={true} intensity={1 + crazy / 10}/>
          </div>
        )}

        {/* DIAL MATRIX — no section wrapper; it IS the page */}
        <div style={{ marginTop: 22 }}>
          <DialMatrix agents={liveAgents} dials={window.SPIRIT_DIALS}
                      focusedCell={focusedCell} draft={focusedCell ? {
                        agentId: focusedCell.agentId,
                        dials: liveAgents.find(a => a.id === focusedCell.agentId)?.dials
                          ? Object.fromEntries(Object.entries(
                              liveAgents.find(a => a.id === focusedCell.agentId).dials
                            ).map(([k, v]) => [k, v.v]))
                          : {},
                      } : null}
                      onFocus={onFocus} onSelect={onSelect}
                      onAgentClick={(id) => setEditingAgentId(id)}/>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: 40, paddingTop: 18, borderTop: '1px dashed var(--line-loud)',
          display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-end',
        }}>
        </footer>
      </div>

      <AgentDetailsModal
        agent={editingAgentId ? agents.find(a => a.id === editingAgentId) : null}
        onClose={() => setEditingAgentId(null)}
        onSave={saveAgent}
        saving={savingAgent}/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
