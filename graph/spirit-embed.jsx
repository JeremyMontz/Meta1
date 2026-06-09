// spirit/spirit-embed.jsx — PersonaCard (production)
// Stripped: StatusCardMock, EmbedPreview
// PersonaCard: read-only Hyde companion to the agent status card.
// Same chrome as dashboard card. Links to body/spirit.html to tune.

const PersonaCard = ({ agent, rev, lastSync, hyde = true }) => {
  const [showBoundaries, setShowBoundaries] = React.useState(false);
  if (!agent || !window.SPIRIT_DIALS) return null;
  const dials = window.SPIRIT_DIALS;
  const isHuman = agent.kind === 'human';

  if (isHuman) {
    return (
      <div style={{
        background: 'var(--bg-elev-1)', border: '1px solid var(--line)',
        borderLeft: '3px solid var(--candle)',
        padding: 22, position: 'relative',
      }}>
        <PersonaCardHeader rev={rev} lastSync={lastSync} agent={agent} hyde={hyde}/>
        <div style={{
          padding: '20px 0 8px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 6, textAlign: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-hyde)', fontSize: 28, color: 'var(--candle)',
            letterSpacing: '0.04em', lineHeight: 1.05,
          }}>The operator is uninstrumented.</span>
          <p style={{
            marginTop: 8, fontSize: 12, color: 'var(--fg-muted)',
            lineHeight: 1.5, maxWidth: 280,
          }}>
            Jeremy is the human. The dials apply to agents; he turns them.
          </p>
        </div>
        <PersonaCardBoundariesToggle
          boundaries={agent.boundaries}
          open={showBoundaries} setOpen={setShowBoundaries}/>
      </div>
    );
  }

  return (
    <div className="persona-card" style={{
      background: 'var(--bg-elev-1)',
      border: '1px solid var(--line)',
      borderLeft: '3px solid var(--accent)',
      padding: 22, position: 'relative',
    }}>
      <PersonaCardHeader rev={rev} lastSync={lastSync} agent={agent} hyde={hyde}/>

      {/* dial rows */}
      <div style={{ marginTop: 12, borderTop: '1px solid var(--line-soft)' }}>
        {dials.map((d, i) => {
          const entry = agent.dials?.[d.id];
          const v = entry?.v;
          const isDefault = !v || v === 'Default' || !d.settings.includes(v);
          const intensity = (window.SPIRIT_INTENSITY[d.id] || {})[v];
          const textColor = window.spiritValueColor(intensity, isDefault);
          const isExtreme = intensity === 3 || intensity === 'h';
          return (
            <div key={d.id} style={{
              display: 'grid',
              gridTemplateColumns: '22px 1fr auto',
              gap: 9, alignItems: 'center',
              padding: '6px 0',
              borderBottom: i < dials.length - 1 ? '1px solid var(--line-soft)' : 'none',
            }}>
              <DialKnob dial={d} value={v} size={20} glow={false}/>
              <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--fg-subtle)', flexShrink: 0,
                }}>{d.name}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: textColor,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  textShadow: isExtreme ? `0 0 6px ${textColor}` : 'none',
                  marginLeft: 'auto',
                }}>{isDefault ? 'default' : v}</span>
              </div>
              <ReliabilityDot reliability={d.reliability}/>
            </div>
          );
        })}
      </div>

      <PersonaCardBoundariesToggle
        boundaries={agent.boundaries}
        open={showBoundaries} setOpen={setShowBoundaries}/>

      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--line-loud)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
          color: 'var(--fg-faint)', textTransform: 'uppercase',
        }}>tune →</span>
        <a href="../../graph/spirit.html" style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
          letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase',
          textDecoration: 'none',
        }}>spirit ↗</a>
      </div>
    </div>
  );
};

// Header — eyebrow + live sync
const PersonaCardHeader = ({ rev, lastSync, agent, hyde }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
  }}>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
      letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)',
    }}>// {agent ? agent.id.toUpperCase() : ''} PERSONA</div>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em',
      color: 'var(--fg-faint)', textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok)', display: 'inline-block' }}/>
      <span>LIVE</span>
    </div>
  </div>
);

// Collapsible boundaries
const PersonaCardBoundariesToggle = ({ boundaries, open, setOpen }) => {
  if (!boundaries || boundaries.length === 0) return null;
  const fnCount = boundaries.filter(b => b.t === 'F').length;
  const aCount  = boundaries.filter(b => b.t === 'A').length;
  return (
    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--line-loud)' }}>
      <button onClick={() => setOpen(!open)} style={{
        all: 'unset', cursor: 'pointer', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em',
        color: 'var(--err)', textTransform: 'uppercase',
      }}>
        <span>{open ? '▾' : '▸'} hard boundaries · {boundaries.length}</span>
        <span style={{ color: 'var(--fg-faint)', letterSpacing: '0.16em' }}>
          {fnCount > 0 && <span><span style={{ color: 'var(--err)' }}>F</span>{fnCount}</span>}
          {fnCount > 0 && aCount > 0 && ' · '}
          {aCount > 0 && <span><span style={{ color: 'var(--warn)' }}>A</span>{aCount}</span>}
        </span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
          {boundaries.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
                color: b.t === 'A' ? 'var(--warn)' : 'var(--err)',
                border: `1px solid ${b.t === 'A' ? 'var(--warn)' : 'var(--err)'}`,
                padding: '0 3px', borderRadius: 1, flexShrink: 0,
              }}>{b.t}</span>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--fg-muted)',
                lineHeight: 1.4,
              }}>{b.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { PersonaCard });
