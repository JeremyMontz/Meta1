// spirit/spirit-dials.jsx — Dial primitives v3
//
// Visual language:
//   * Knob = SVG rotary control. Center pointer angles to the active named
//     setting along an arc -130° → +130°.
//   * Reliability lives on the LEFT of the dial-details cell (3px color bar
//     + small "RELI · HIGH" label that's clearly the SOURCE rather than the
//     value). Never conflated with the value.
//   * Cell value color reflects intensity (default → fg-faint, baseline →
//     muted, off-center → fg, extreme → accent, Hyde → party). No text
//     subtitle saying "custom" or "default" — color does the work.

const SPIRIT_RELI_COLOR = {
  'High':     'var(--ok)',
  'Moderate': 'var(--warn)',
  'Low–Mod':  'var(--err)',
};

const SPIRIT_RELI_LABEL = {
  'High':     'HI',
  'Moderate': 'MOD',
  'Low–Mod':  'LO',
};

// Resolve cell value → text color based on the intensity of that setting.
const valueColor = (intensity, isDefault) => {
  if (isDefault)         return 'var(--fg-faint)';
  if (intensity === 'h') return 'var(--party)';
  if (intensity === 3)   return 'var(--accent)';
  if (intensity === 2)   return 'color-mix(in oklch, var(--accent) 50%, var(--fg))';
  if (intensity === 1)   return 'var(--fg)';
  return 'var(--fg-muted)';
};

// ─── Knob ─────────────────────────────────────────────────────────────────
const DialKnob = ({ dial, value, size = 28, dirty, glow = true }) => {
  const settings = dial.settings;
  const isDefault = value === 'Default' || !settings.includes(value);
  const idx = isDefault ? -1 : settings.indexOf(value);
  const ratio = isDefault ? 0.5 : (idx + 0.5) / settings.length;
  const angle = -130 + ratio * 260;
  const intensity = (window.SPIRIT_INTENSITY[dial.id] || {})[value];
  const tone = dirty ? 'var(--warn)' : valueColor(intensity, isDefault);
  const isExtreme = intensity === 3 || intensity === 'h';

  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 1;
  const innerR = r - 2;

  return (
    <svg viewBox={`0 0 ${size} ${size}`}
         style={{ width: size, height: size, display: 'block', overflow: 'visible' }}>
      <circle cx={cx} cy={cy} r={r} fill="var(--bg-elev-2)"
              stroke="var(--line-loud)" strokeWidth="1"/>
      <path d={describeArc(cx, cy, innerR, -130, 130)}
            fill="none" stroke="var(--line)" strokeWidth="0.6"/>
      {settings.map((s, i) => {
        const ang = (-130 + (i + 0.5) / settings.length * 260);
        const a = (ang - 90) * Math.PI / 180;
        const isActive = i === idx;
        const r1 = innerR - 0.5, r2 = r - 0.5;
        return (
          <line key={i}
                x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1}
                x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
                stroke={isActive ? tone : 'var(--fg-faint)'}
                strokeWidth={isActive ? 1.4 : 0.6}
                strokeLinecap="round"/>
        );
      })}
      {!isDefault && (
        <line x1={cx} y1={cy}
              x2={cx + Math.cos((angle - 90) * Math.PI / 180) * (innerR - 0.5)}
              y2={cy + Math.sin((angle - 90) * Math.PI / 180) * (innerR - 0.5)}
              stroke={tone} strokeWidth={size > 40 ? 2 : 1.5} strokeLinecap="round"
              style={{ filter: glow && isExtreme
                              ? `drop-shadow(0 0 4px ${tone})`
                              : glow ? `drop-shadow(0 0 2px ${tone})` : 'none' }}/>
      )}
      <circle cx={cx} cy={cy} r={Math.max(1, size / 18)} fill={tone}/>
      {isDefault && (
        <circle cx={cx} cy={cy} r={innerR - 2} fill="none"
                stroke="var(--fg-faint)" strokeWidth="0.6" strokeDasharray="1 1.4"/>
      )}
    </svg>
  );
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

// ─── Reliability label — clearly labelled as RELIABILITY ──────────────────
const ReliabilityLabel = ({ reliability }) => {
  const c = SPIRIT_RELI_COLOR[reliability] || 'var(--fg-faint)';
  const word = reliability === 'Low–Mod' ? 'LOW–MOD' : reliability.toUpperCase();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: c, whiteSpace: 'nowrap',
    }}>
      <span style={{
        display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
        background: c, boxShadow: `0 0 4px ${c}`,
      }}/>
      {word} reliability
    </span>
  );
};

// Compact form: just a tiny colored dot + 2-3 letter abbreviation.
const ReliabilityDot = ({ reliability }) => {
  const c = SPIRIT_RELI_COLOR[reliability] || 'var(--fg-faint)';
  return (
    <span title={`Reliability: ${reliability}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: c, whiteSpace: 'nowrap',
          }}>
      <span style={{
        display: 'inline-block', width: 4, height: 4, borderRadius: '50%',
        background: c, boxShadow: `0 0 3px ${c}`,
      }}/>
      {SPIRIT_RELI_LABEL[reliability]}
    </span>
  );
};

// ─── Matrix cell ──────────────────────────────────────────────────────────
const DialCell = ({ dial, agent, current, focused, dirty, hasFocus, onFocus }) => {
  const isHuman = agent.kind === 'human';
  const settings = dial.settings;
  const value = isHuman ? null : current;
  const isDefault = !value || value === 'Default' || !settings.includes(value);
  const intensity = (window.SPIRIT_INTENSITY[dial.id] || {})[value];
  const isExtreme = intensity === 3 || intensity === 'h';
  const textColor = dirty ? 'var(--warn)' : valueColor(intensity, isDefault);

  return (
    <button onClick={() => !isHuman && onFocus(agent.id, dial.id)}
            disabled={isHuman}
            className={`dial-cell${hasFocus && !focused && !isHuman ? ' is-dimmed' : ''}`}
            style={{
      all: 'unset',
      cursor: isHuman ? 'default' : 'pointer',
      padding: '8px 9px',
      borderRight: '1px solid var(--line-soft)',
      borderBottom: '1px solid var(--line-soft)',
      background: focused ? 'color-mix(in oklch, var(--accent) 14%, transparent)' : 'transparent',
      display: 'flex', alignItems: 'center', gap: 9, minWidth: 0,
      transition: 'background 140ms var(--ease-out), opacity 200ms var(--ease-out)',
      position: 'relative',
    }}>
      {isHuman ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '100%', opacity: 0.5 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--candle)',
            letterSpacing: '0.2em',
          }}>—</span>
        </div>
      ) : (
        <>
          <DialKnob dial={dial} value={value} size={28} dirty={dirty}/>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.04em',
            color: textColor,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            lineHeight: 1.15, flex: 1,
            textShadow: isExtreme && !dirty ? `0 0 8px ${textColor}` : 'none',
          }}>{isDefault ? 'default' : value}</span>
          {dirty && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
              letterSpacing: '0.14em', color: 'var(--warn)',
              textTransform: 'uppercase', flexShrink: 0,
            }}>●</span>
          )}
        </>
      )}
    </button>
  );
};

// ─── Dial details column (left) ───────────────────────────────────────────
const DialDetails = ({ dial, focused, hasFocus, idx }) => {
  const reliColor = SPIRIT_RELI_COLOR[dial.reliability];
  return (
    <div style={{
      padding: '10px 14px 10px 16px',
      borderRight: '1px solid var(--line)',
      borderBottom: '1px solid var(--line-soft)',
      borderLeft: `3px solid ${reliColor}`,
      background: focused ? 'color-mix(in oklch, var(--accent) 10%, var(--bg-elev-1))' : 'var(--bg-elev-1)',
      display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center',
      transition: 'opacity 200ms var(--ease-out)',
    }} className={hasFocus && !focused ? 'dial-details is-dimmed-details' : 'dial-details'}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em',
          color: 'var(--fg-faint)',
        }}>{String(idx + 1).padStart(2, '0')}</span>
        <h3 style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg)',
          margin: 0,
        }}>{dial.name}</h3>
      </div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--fg-subtle)',
        lineHeight: 1.35, paddingLeft: 18,
      }}>{dial.blurb}</div>
      <div style={{ paddingLeft: 18, marginTop: 2 }}>
        <ReliabilityLabel reliability={dial.reliability}/>
      </div>
    </div>
  );
};

// ─── Agent column header ──────────────────────────────────────────────────
const AgentColHeader = ({ agent, idx, onClick }) => {
  const isHuman = agent.kind === 'human';
  return (
    <button
      onClick={() => onClick && onClick(agent.id)}
      title={`Edit ${agent.name}'s signature & hard boundaries`}
      className="agent-col-header"
      style={{
        all: 'unset',
        cursor: onClick ? 'pointer' : 'default',
        padding: '8px 8px 7px',
        borderRight: '1px solid var(--line-soft)',
        borderBottom: '1px solid var(--line-loud)',
        background: 'var(--bg-elev-1)',
        display: 'flex', flexDirection: 'column', gap: 1,
        transition: 'background 140ms var(--ease-out)',
      }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4,
        fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em',
        color: 'var(--fg-faint)',
      }}>
        <span>{String(idx + 1).padStart(2, '0')} · {agent.feature || '—'}</span>
        <span style={{ color: 'var(--fg-faint)', fontSize: 9 }}>✎</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
        letterSpacing: '-0.01em',
        color: isHuman ? 'var(--candle)' : 'var(--fg)',
        fontVariationSettings: '"opsz" 36',
      }}>{agent.name}{isHuman && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em',
                       color: 'var(--candle)', marginLeft: 6, textTransform: 'uppercase' }}>· human</span>
      )}</div>
    </button>
  );
};

// ─── Edit strip ───────────────────────────────────────────────────────────
const DialEditStrip = ({ dial, value, original, onSelect, onClose }) => {
  const [hovered, setHovered] = React.useState(null);
  const display = hovered ?? value;
  const settings = dial.settings;
  const isHovered = hovered !== null;

  const displayIsDefault = display === 'Default' || !settings.includes(display);
  const currentIsDefault = value === 'Default' || !settings.includes(value);
  const dirty = value !== original;
  const origIsDefault = original === 'Default' || !settings.includes(original);

  const handleClick = (s) => {
    if (s === value) onSelect('Default');
    else             onSelect(s);
    onClose();
  };

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'flex-start', gap: 18, minWidth: 0,
    }}>
      <div style={{
        flexShrink: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 5, width: 100,
      }}>
        <DialKnob dial={dial} value={display} size={64}/>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: valueColor((window.SPIRIT_INTENSITY[dial.id] || {})[display],
                            displayIsDefault),
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: 100, textAlign: 'center', lineHeight: 1.2,
        }}>{displayIsDefault ? 'default' : display}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 8, lineHeight: 1.3,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          minHeight: 12, textAlign: 'center', whiteSpace: 'nowrap',
        }}>
          {isHovered ? (
            <span style={{ color: 'var(--fg-faint)' }}>· preview ·</span>
          ) : dirty ? (
            <span style={{ color: 'var(--warn)' }}>
              was <span style={{ textDecoration: 'line-through', color: 'var(--fg-faint)' }}>
                {origIsDefault ? 'default' : original}
              </span>
            </span>
          ) : null}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {settings.map((s) => {
            const active = value === s;
            const intensityMap = window.SPIRIT_INTENSITY[dial.id] || {};
            const intensity = intensityMap[s];
            const color = valueColor(intensity, false);
            const isExtreme = intensity === 3 || intensity === 'h';
            return (
              <button key={s}
                onClick={() => handleClick(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '5px 9px',
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  border: `1px solid ${active ? color : 'var(--line-loud)'}`,
                  color: active ? color : 'var(--fg-muted)',
                  background: active
                    ? `color-mix(in oklch, ${color} 14%, transparent)`
                    : 'transparent',
                  borderRadius: 1,
                  transition: 'all 120ms var(--ease-out)',
                  boxShadow: active && isExtreme ? `0 0 12px -4px ${color}` : 'none',
                }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onClose} style={{
        all: 'unset', cursor: 'pointer', flexShrink: 0,
        padding: '4px 8px', color: 'var(--fg-muted)',
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
        textTransform: 'uppercase', border: '1px solid var(--line-loud)', borderRadius: 1,
      }}>✕ esc</button>
    </div>
  );
};

// ─── DialRow ──────────────────────────────────────────────────────────────
const DialRow = ({ dial, idx, agents, focusedCell, draft, onFocus, onSelect, gridTemplate }) => {
  const hasFocus = !!focusedCell;
  const focusedHere = focusedCell && focusedCell.dialId === dial.id;
  const focusedAgent = focusedHere ? agents.find(a => a.id === focusedCell.agentId) : null;
  const focusedDraftValue = focusedHere && draft ? draft.dials[dial.id] : undefined;
  const focusedOriginalValue = focusedAgent?.dials?.[dial.id]?.v;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: gridTemplate }}>
        <DialDetails dial={dial} focused={focusedHere} hasFocus={hasFocus} idx={idx}/>
        {agents.map((a) => {
          const current = a.dials?.[dial.id]?.v;
          const isFocused = focusedHere && a.id === focusedCell.agentId;
          const draftVal = (draft && draft.agentId === a.id) ? draft.dials[dial.id] : undefined;
          const live = draftVal !== undefined ? draftVal : current;
          const dirty = draftVal !== undefined && draftVal !== current;
          return (
            <DialCell key={a.id} dial={dial} agent={a} current={live}
                      focused={isFocused} dirty={dirty} hasFocus={hasFocus}
                      onFocus={onFocus}/>
          );
        })}
      </div>
      {focusedHere && focusedAgent && (
        <div style={{
          background: 'var(--bg-elev-2)',
          borderTop: '1px solid var(--accent)',
          borderBottom: '1px solid var(--accent)',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px',
          boxShadow: 'inset 0 0 24px -8px color-mix(in oklch, var(--accent) 40%, transparent)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110, flexShrink: 0 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em',
              color: 'var(--accent)', textTransform: 'uppercase',
            }}>// tuning</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
              letterSpacing: '-0.01em', color: 'var(--fg)',
              fontVariationSettings: '"opsz" 36',
            }}>{focusedAgent.name}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
              color: 'var(--fg-subtle)', textTransform: 'uppercase',
            }}>{dial.name}</span>
          </div>
          <DialEditStrip dial={dial} value={focusedDraftValue}
                         original={focusedOriginalValue}
                         onSelect={(v) => onSelect(focusedAgent.id, dial.id, v)}
                         onClose={() => onFocus(null, null)}/>
        </div>
      )}
    </>
  );
};

// ─── DialMatrix ───────────────────────────────────────────────────────────
const DialMatrix = ({ agents, dials, focusedCell, draft, onFocus, onSelect, onAgentClick }) => {
  const detailsCol = '220px';
  const agentCol = 'minmax(94px, 1fr)';
  const gridTemplate = `${detailsCol} repeat(${agents.length}, ${agentCol})`;

  return (
    <div style={{
      border: '1px solid var(--line)',
      background: 'var(--bg)',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: gridTemplate,
        position: 'sticky', top: 0, zIndex: 4,
        background: 'var(--bg-elev-1)',
        borderBottom: '1px solid var(--line-loud)',
      }}>
        <div style={{
          padding: '10px 14px 10px 16px',
          borderRight: '1px solid var(--line)',
          borderLeft: '3px solid var(--accent)',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em',
            color: 'var(--accent)', textTransform: 'uppercase',
          }}>// dials</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--fg-subtle)', letterSpacing: '0.08em',
          }}>9 · cell color = intensity</span>
        </div>
        {agents.map((a, i) => <AgentColHeader key={a.id} agent={a} idx={i} onClick={onAgentClick}/>)}
      </div>

      <div>
        {dials.map((d, i) => (
          <DialRow key={d.id} dial={d} idx={i} agents={agents}
                   focusedCell={focusedCell} draft={draft}
                   onFocus={onFocus} onSelect={onSelect}
                   gridTemplate={gridTemplate}/>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, {
  DialKnob, ReliabilityLabel, ReliabilityDot, DialCell, DialDetails,
  AgentColHeader, DialRow, DialMatrix, DialEditStrip,
  SPIRIT_RELI_COLOR, SPIRIT_RELI_LABEL, spiritValueColor: valueColor,
});
