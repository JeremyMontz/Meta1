// spirit/spirit-monitor.jsx — slim page-wide EKG monitor (ambient)
//
// Just visual interest. A continuous heartbeat trace scrolls left at constant
// speed, with periodic PQRST spikes. No data binding; pure vibe.

const HeartMonitor = ({ live, intensity = 1, label = 'organ 01 · heart' }) => {
  const cycleW = 220;
  const cycles = 8;
  const W = cycleW * cycles;
  const H = 36;
  const base = H * 0.65;

  let d = `M 0 ${base}`;
  for (let i = 0; i < cycles; i++) {
    const x = i * cycleW;
    const sx = x + cycleW * 0.4;
    d += ` L ${x + cycleW * 0.05} ${base}`
       + ` L ${x + cycleW * 0.15} ${base - 1.5}`
       + ` L ${x + cycleW * 0.22} ${base + 0.5}`
       + ` L ${x + cycleW * 0.28} ${base + 2.5}`
       + ` L ${sx} ${base - 16 * intensity}`
       + ` L ${x + cycleW * 0.44} ${base + 4}`
       + ` L ${x + cycleW * 0.5} ${base - 1}`
       + ` L ${x + cycleW * 0.58} ${base - 3.5}`
       + ` L ${x + cycleW * 0.68} ${base}`
       + ` L ${x + cycleW} ${base}`;
  }

  return (
    <div className="heart-monitor" style={{
      position: 'relative',
      border: '1px solid var(--line)',
      borderLeft: '3px solid var(--accent)',
      background: 'var(--bg-elev-1)',
      padding: '8px 14px 8px 12px',
      display: 'grid', gridTemplateColumns: '160px 1fr 160px',
      gap: 16, alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em',
          color: 'var(--accent)', textTransform: 'uppercase',
        }}>// MONITOR</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
          color: 'var(--fg-subtle)',
        }}>{label}</span>
      </div>

      <div style={{ position: 'relative', height: H, overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
             className={live ? 'monitor-trace' : ''}
             style={{
               width: W * 2, height: H, display: 'block',
               position: 'absolute', left: 0, top: 0,
             }}>
          <line x1="0" y1={base} x2={W * 2} y2={base}
                stroke="color-mix(in oklch, var(--line-loud) 60%, transparent)"
                strokeWidth="0.5" strokeDasharray="1.5 2.5"/>
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 3px var(--accent-glow))' }}/>
          <g transform={`translate(${W} 0)`}>
            <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.2"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 0 3px var(--accent-glow))' }}/>
          </g>
        </svg>
      </div>

      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em',
          color: 'var(--fg-faint)', textTransform: 'uppercase',
        }}>SINUS · NORMAL</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--fg-subtle)', letterSpacing: '0.1em',
        }}>lead II · 25 mm/s</span>
      </div>
    </div>
  );
};

Object.assign(window, { HeartMonitor });
