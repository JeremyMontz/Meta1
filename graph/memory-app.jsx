// memory/memory-app.jsx — page shell: nav, header, matrix, bridges, footer.
// Production build — tweaks stripped, constants hardcoded.

var PROD_THEME = 'cabinet';
var PROD_HYDE  = true;
var PROD_GRID  = true;

const mixToken = (token, pct, base = 'transparent') =>
  `color-mix(in oklch, ${token} ${pct}%, ${base})`;

// memory glyph — stratified brain in cross-section ---------------------------
const MemoryGlyph = () => (
  <svg viewBox="0 0 64 64" style={{ width: 56, height: 56, flexShrink: 0, marginTop: 6 }}>
    <defs>
      <linearGradient id="mgrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--accent)"/>
        <stop offset="1" stopColor="var(--accent-deep)"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke="url(#mgrad)" strokeWidth="1.4"
       strokeLinecap="round" strokeLinejoin="round">
      {/* skull-section outline */}
      <path d="M 14 22 C 14 14 22 8 32 8 C 42 8 50 14 50 22 L 50 46 C 50 52 46 56 40 56 L 24 56 C 18 56 14 52 14 46 Z"/>
      {/* central fissure */}
      <path d="M 32 8 L 32 56" strokeDasharray="1 2" strokeWidth="0.7"/>
      {/* five stratification lines = the five layers */}
      <path d="M 15 18 C 22 16 42 16 49 18" strokeWidth="0.9"/>
      <path d="M 14 26 C 22 24 42 24 50 26" strokeWidth="0.9"/>
      <path d="M 14 34 C 22 32 42 32 50 34" strokeWidth="0.9"/>
      <path d="M 14 42 C 22 40 42 40 50 42" strokeWidth="0.9"/>
      <path d="M 15 50 C 22 48 42 48 49 50" strokeWidth="0.9"/>
      {/* sulci/folds — short curves */}
      <path d="M 20 14 C 22 18 20 22 22 26" strokeWidth="0.7" opacity="0.7"/>
      <path d="M 44 14 C 42 18 44 22 42 26" strokeWidth="0.7" opacity="0.7"/>
      <path d="M 18 30 C 22 34 20 38 24 42" strokeWidth="0.7" opacity="0.7"/>
      <path d="M 46 30 C 42 34 44 38 40 42" strokeWidth="0.7" opacity="0.7"/>
      {/* bolt scar at the temple */}
      <path d="M 49 24 L 53 28 L 50 30 L 54 34"
            stroke="var(--bolt)" strokeWidth="0.9" strokeDasharray="1 1.5"/>
    </g>
    {/* memory pulse */}
    <circle cx="32" cy="34" r="1.8" fill="var(--candle)">
      <animate attributeName="opacity" values="1;0.3;1" dur="2.2s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

// header ---------------------------------------------------------------------
const MemoryHeader = () => (
  <header style={{ padding: '20px 0 14px', borderBottom: '1px solid var(--line)' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
      <MemoryGlyph/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em',
          color: 'var(--accent)', textTransform: 'uppercase',
        }}>// CLAUDEMONZTER · AMALGAMATION</div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 60, fontWeight: 700,
          letterSpacing: '-0.03em', margin: '6px 0 0',
          color: 'var(--fg)', fontVariationSettings: '"opsz" 144', lineHeight: 0.9,
        }}>Memory<span style={{ color: 'var(--accent)' }}>.</span></h1>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 8, flexWrap: 'wrap',
        }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17,
            color: 'var(--fg-muted)', maxWidth: 720, lineHeight: 1.4,
            fontVariationSettings: '"opsz" 36', margin: 0,
          }}>
            Memory is not one thing. It's a stack of five — identity, context, project,
            role or domain, and session — that three different platforms each implement differently.
            Knowing where you are in the stack is half the work.
            Click any layer to crack it open.
          </p>
        </div>

        {/* light strip — counts, status */}
        <div style={{
          marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
          color: 'var(--fg-subtle)', textTransform: 'uppercase',
        }}>
          <span><span style={{ color: 'var(--accent)' }}>layers</span> 5</span>
          <span><span style={{ color: 'var(--fg-faint)' }}>platforms</span> 3</span>
          <span><span style={{ color: 'var(--fg-faint)' }}>cells</span> 15</span>
          <span style={{ color: 'var(--fg-faint)' }}>·</span>
          <span><span style={{ color: 'var(--err)' }}>absent</span> claude.ai · L4</span>
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em',
          color: 'var(--fg-faint)', textTransform: 'uppercase',
        }}>view-only</div>
        <div style={{
          fontFamily: 'var(--font-hand)', fontSize: 14, color: 'var(--fg-subtle)',
          transform: 'rotate(-1.5deg)', marginTop: 4, maxWidth: 200,
        }}>(reference map. under development and subject to change.)</div>
      </div>
    </div>
  </header>
);

// section header (echoes heart's Section component) --------------------------
const Section = ({ num, eyebrow, title, sub, children }) => (
  <section style={{ marginTop: 36 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, marginBottom: 14 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
        letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--candle)',
      }}>// {num} · {eyebrow}</div>
      <div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600,
          letterSpacing: '-0.01em', margin: 0,
          fontVariationSettings: '"opsz" 48',
        }}>{title}</h2>
        {sub && <p style={{
          marginTop: 6, fontSize: 13, color: 'var(--fg-muted)',
          maxWidth: 760, lineHeight: 1.5,
        }}>{sub}</p>}
      </div>
    </div>
    {children}
  </section>
);

// bridges block --------------------------------------------------------------
const BridgesBlock = () => {
  const layerById = (id) => window.MEMORY_LAYERS.find(l => l.id === id);
  const { reliable, fragile } = window.MEMORY_BRIDGES;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
    }}>
      <div style={{
        padding: '18px 20px',
        background: mixToken('var(--ok)', 6, 'var(--bg-elev-1)'),
        border: `1px solid ${mixToken('var(--ok)', 30, 'var(--line)')}`,
        borderLeft: '3px solid var(--ok)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em',
          color: 'var(--ok)', textTransform: 'uppercase', marginBottom: 10,
        }}>// bridges reliably</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex',
                     flexDirection: 'column', gap: 8 }}>
          {reliable.map((it, i) => {
            const layer = layerById(it.layer);
            return (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: 'var(--bg)', background: layer.tokenColor,
                  padding: '2px 6px', borderRadius: 1, flexShrink: 0,
                  marginTop: 2,
                }}>L{layer.id}</span>
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5,
                  color: 'var(--fg)',
                }}>{it.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div style={{
        padding: '18px 20px',
        background: mixToken('var(--err)', 5, 'var(--bg-elev-1)'),
        border: `1px solid ${mixToken('var(--err)', 30, 'var(--line)')}`,
        borderLeft: '3px solid var(--err)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em',
          color: 'var(--err)', textTransform: 'uppercase', marginBottom: 10,
        }}>// does not bridge</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex',
                     flexDirection: 'column', gap: 8 }}>
          {fragile.map((it, i) => {
            const layer = layerById(it.layer);
            return (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: 'var(--bg)', background: layer.tokenColor,
                  padding: '2px 6px', borderRadius: 1, flexShrink: 0,
                  marginTop: 2,
                }}>L{layer.id}</span>
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5,
                  color: 'var(--fg)',
                }}>{it.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};


// app -----------------------------------------------------------------------
const App = () => {
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', PROD_THEME);
    document.documentElement.classList.toggle('hyde', PROD_HYDE);
  }, []);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: 'var(--fg)' }}>
      {PROD_GRID && <div className="bg-grid-layer"/>}

      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 1480, margin: '0 auto',
        padding: '20px 32px 80px',
      }}>

        <MemoryHeader/>

        {/* MATRIX */}
        <div style={{ marginTop: 26 }}>
          <MemoryMatrix/>
        </div>

        {/* BRIDGES */}
        <Section
          num="01"
          eyebrow="cross-platform takeaway"
          title="What bridges. What doesn't."
          sub="If you build in CLI and run in Cowork, your carefully curated MEMORY.md doesn't transfer. Only Layers 1 and 3 reach across all three. The rest fork.">
          <BridgesBlock/>
        </Section>

        {/* footer */}
        <footer style={{
          marginTop: 40, paddingTop: 18, borderTop: '1px dashed var(--line-loud)',
          display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-end',
        }}>
        </footer>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
