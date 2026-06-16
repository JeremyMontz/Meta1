// CompetencyGraph.jsx — the "What It Proves" node graph (portfolio.html, section 01).
//
// STATIC nodes = competencies (data.js COMPETENCIES). DYNAMIC evidence:
// hovering a node shows the skill (what it is + what it means to me) plus a
// computed list of every PORTFOLIO (PROOF) and ARTICLES (ESSAY) item whose
// `demonstrates` array includes that node's id. Tag a new Work or Article and
// it surfaces here automatically — no graph edits, ever. No links in the
// inspector by design: the full Works list is directly below, essays in Writing.
//
// Layout: the block spans the full content width (right rail aligns with the
// hero spec card). The graph is laid out LANDSCAPE (wide ellipse) so it fills
// the width without going tall. Graph and inspector share a fixed height; the
// evidence list scrolls inside the inspector when a node has many examples.
//
// NOTE: SVG color/font tokens go in `style={{}}` (CSS), never as presentation
// attributes — var() only resolves in CSS, not in attributes like fill="...".

const CG_HEIGHT = 420; // graph + inspector share this height

const CompetencyGraph = () => {
  const comps    = (typeof COMPETENCIES !== 'undefined' && COMPETENCIES) || [];
  const works    = (typeof PORTFOLIO    !== 'undefined' && PORTFOLIO)    || [];
  const articles = (typeof ARTICLES     !== 'undefined' && ARTICLES)     || [];

  // Evidence for a competency id, drawn from both lists and marked by kind.
  const evidenceFor = (id) => [
    ...works.filter(p => (p.demonstrates || []).includes(id)).map(p => ({ title: p.title, kind: 'PROOF' })),
    ...articles.filter(p => (p.demonstrates || []).includes(id)).map(p => ({ title: p.title, kind: 'ESSAY' })),
  ];

  const [sel, setSel] = React.useState(0);

  // Wide ellipse so the graph fills the column landscape (not tall).
  const n = comps.length || 1;
  const cx = 410, cy = 195, rx = 330, ry = 140;
  const pos = comps.map((_, i) => {
    const ang = (-90 + i * (360 / n)) * Math.PI / 180;
    return [cx + rx * Math.cos(ang), cy + ry * Math.sin(ang)];
  });
  const palette = ['var(--accent)', 'var(--info)', 'var(--candle)', 'var(--accent)', 'var(--ok)', 'var(--candle)'];

  const active = comps[sel] || {};
  const ev = active.id ? evidenceFor(active.id) : [];
  const mono = 'var(--font-mono)';

  return (
    <div className="graph-layout" style={{
      marginTop: 24,
      display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px',
      gap: 20, alignItems: 'stretch',
    }}>
      {/* ── Graph (landscape, fills the column) ── */}
      <div className="graph-box" style={{
        border: '1px solid var(--line)', background: 'var(--bg-elev-1)', padding: 12,
        height: CG_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 820 400" style={{ width: '100%', height: '100%' }}>
          {pos.map((p, i) => (
            <line key={'edge-' + i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} strokeWidth="1"
              style={{ stroke: i === sel ? palette[i % palette.length] : 'var(--line-loud)' }} />
          ))}

          {/* hub */}
          <circle cx={cx} cy={cy} r="36" strokeWidth="1.5" style={{ fill: 'var(--bg-elev-2)', stroke: 'var(--ok)' }} />
          <text x={cx} y={cy - 3} textAnchor="middle" fontSize="11" letterSpacing="1.5" style={{ fontFamily: mono, fill: 'var(--fg-muted)' }}>WHAT IT</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" letterSpacing="1.5" style={{ fontFamily: mono, fill: 'var(--fg-muted)' }}>PROVES</text>

          {/* nodes */}
          {comps.map((c, i) => {
            const on = i === sel;
            const color = palette[i % palette.length];
            return (
              <g key={c.id} style={{ cursor: 'pointer' }}
                 onMouseEnter={() => setSel(i)} onClick={() => setSel(i)}>
                <circle cx={pos[i][0]} cy={pos[i][1]} r={on ? 24 : 20} strokeWidth="1.5"
                  style={{ fill: on ? color : 'var(--bg-elev-2)', stroke: color }} />
                <text x={pos[i][0]} y={pos[i][1] + 4} textAnchor="middle" fontSize="11" fontWeight="700"
                  style={{ fontFamily: mono, fill: on ? 'var(--bg)' : color }}>{String(i + 1).padStart(2, '0')}</text>
                <text x={pos[i][0]} y={pos[i][1] + 38} textAnchor="middle" fontSize="10" letterSpacing="0.06em"
                  style={{ fontFamily: mono, fill: on ? 'var(--fg)' : 'var(--fg-faint)' }}>{(c.node || '').toUpperCase()}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Inspector (fixed height; evidence scrolls inside) ── */}
      <div className="graph-inspector" style={{
        border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)',
        background: 'var(--bg-elev-1)', padding: 18,
        height: CG_HEIGHT, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', color: 'var(--fg-faint)' }}>
          // {String(sel + 1).padStart(2, '0')} · COMPETENCY
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, lineHeight: 1.15, margin: '8px 0 8px' }}>
          {active.label}
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.5, margin: '0 0 10px' }}>{active.what}</p>
        <p style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 15, color: 'var(--fg)', lineHeight: 1.45, margin: '0 0 14px',
          fontVariationSettings: '"opsz" 36, "SOFT" 100',
        }}>{active.mine}</p>

        {/* Evidence region — fills remaining height, scrolls if long */}
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', color: 'var(--fg-faint)', marginBottom: 10 }}>
            DEMONSTRATED IN
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ev.length === 0 ? (
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.04em', color: 'var(--fg-faint)' }}>
                — more as the lab grows
              </div>
            ) : ev.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13 }}>
                <span style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: '0.12em',
                  color: e.kind === 'PROOF' ? 'var(--ok)' : 'var(--candle)',
                  border: '1px solid currentColor', borderRadius: 2, padding: '1px 5px', flexShrink: 0,
                }}>{e.kind}</span>
                <span style={{ color: 'var(--fg-muted)', lineHeight: 1.4 }}>{e.title}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', color: 'var(--fg-faint)' }}>
            ↓ FULL WORK LIST BELOW
          </div>
        </div>
      </div>
    </div>
  );
};

window.CompetencyGraph = CompetencyGraph;
