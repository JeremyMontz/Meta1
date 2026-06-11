// brain-shared.jsx — shared atoms + the hover detail card for the Brain page.
//
// Eyebrow/Chip are kept LOCAL (used only by LevelDetail). They are NOT exported to
// window: the site's Primitives.jsx already defines window.Eyebrow with a different
// signature, and clobbering it would break shared chrome. Only mix + LevelDetail go
// on window, for brain-stage.jsx to consume.
//
// (Site chrome — TopNav / GraphSubnav / Footer — replaces the prototype's BrainChrome,
//  which has been removed.)

const mix = (token, pct, base = 'transparent') =>
  `color-mix(in oklch, ${token} ${pct}%, ${base})`;

// — small label atoms (local) ————————————————————————————————————————
const Eyebrow = ({ children, color = 'var(--accent)', size = 10, style }) => (
  <div style={{
    fontFamily: 'var(--font-mono)', fontSize: size,
    letterSpacing: '0.26em', textTransform: 'uppercase', color,
    ...style,
  }}>{children}</div>
);

const Chip = ({ children, color = 'var(--line-loud)', filled }) => (
  <span style={{
    display: 'inline-block',
    fontFamily: 'var(--font-mono)', fontSize: 9,
    letterSpacing: '0.13em', textTransform: 'uppercase',
    color: filled ? 'var(--bg)' : 'var(--fg-muted)',
    background: filled ? color : mix(color, 7, 'var(--bg-elev-1)'),
    border: `1px solid ${mix(color, 38, 'var(--line)')}`,
    padding: '2px 7px', borderRadius: 1, whiteSpace: 'nowrap',
  }}>{children}</span>
);

// — the shared hover detail card ————————————————————————————————————
// Surfaces a level's character — name, kind, folder, description, example docs.
const LevelDetail = ({ level, accent, compact }) => {
  if (!level) return null;
  const c = accent || level.token;
  const examples = level.examples || (level.surfaces || []).map(s => s.name + '  ·  ' + s.glyph);
  return (
    <div style={{
      background: mix(c, 12, 'var(--bg-elev-3)'),
      border: `1px solid ${mix(c, 70, 'var(--line-loud)')}`,
      borderLeft: `3px solid ${c}`,
      padding: compact ? '13px 15px' : '17px 19px',
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: `0 24px 60px rgba(0,0,0,0.75), 0 0 34px -8px ${mix(c, 50, 'transparent')}, inset 0 1px 0 ${mix(c, 26, 'transparent')}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600,
          letterSpacing: '-0.01em', color: 'var(--fg)',
          fontVariationSettings: '"opsz" 48', lineHeight: 1,
        }}>{level.name}</span>
        <span style={{ marginLeft: 'auto' }}><Chip color={c}>{level.kind}</Chip></span>
      </div>

      <code style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, color: c,
        background: mix(c, 8, 'var(--bg)'), border: `1px solid ${mix(c, 20, 'transparent')}`,
        padding: '3px 7px', alignSelf: 'flex-start', wordBreak: 'break-all', lineHeight: 1.4,
      }}>{level.folder}</code>

      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5, color: 'var(--fg-muted)',
      }}>{level.desc}</div>

      {/* example documents — illustrative kinds, not counts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Eyebrow color="var(--fg-faint)" size={9}>
          // {level.offDisk ? 'surfaces' : 'looks like'} · {level.scale}
        </Eyebrow>
        {examples.map((s, i) => (
          <div key={i} style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)',
            lineHeight: 1.5, display: 'flex', gap: 7, alignItems: 'baseline',
          }}>
            <span style={{ color: c, fontSize: 8 }}>▪</span>{s}
          </div>
        ))}
      </div>

      {level.echo && (
        <div style={{
          marginTop: 1, paddingTop: 9, borderTop: '1px dashed var(--line-loud)',
          fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.08em',
          color: 'var(--fg-faint)', textTransform: 'uppercase',
        }}>karpathy’s “<span style={{ color: c }}>{level.echo}</span>”</div>
      )}
    </div>
  );
};

// Only mix + LevelDetail are shared across script scopes; atoms stay local.
Object.assign(window, { mix, LevelDetail });
