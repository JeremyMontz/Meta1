// brain-app.jsx — page shell. Renders the Brain page content into #root:
// header → the brain stage (scaled to fit) → page-summary footer.
//
// Site chrome (TopNav / GraphSubnav / Footer) is mounted separately by brain.html
// into its own roots — this app renders ONLY the page body, per the organ-page
// convention. The fixed 1320×824 stage is scaled to the container width (never > 1×).

const STAGE_W = 1320, STAGE_H = 824;

// scales a fixed-size stage to the container width (origin top-left, centered)
const Stage = ({ children }) => {
  const wrapRef = React.useRef(null);
  const [cw, setCw] = React.useState(STAGE_W);  // measured wrap width
  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf, tries = 0;
    const apply = (w) => { if (w && w > 0) setCw(prev => (Math.abs(prev - w) > 0.5 ? w : prev)); };
    const measure = () => apply(el.clientWidth || el.getBoundingClientRect().width);
    measure();
    // retry across several frames in case width isn't laid out yet at mount
    const tick = () => { measure(); if (++tries < 10) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver((entries) => { for (const e of entries) apply(e.contentRect.width); });
    ro.observe(el);
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 400);   // re-measure once the plate image settles layout
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); cancelAnimationFrame(raf); clearTimeout(t); };
  }, []);
  const scale = Math.min(1, cw / STAGE_W);
  const left = Math.max(0, (cw - STAGE_W * scale) / 2);
  return (
    <div ref={wrapRef} style={{ width: '100%', height: STAGE_H * scale, position: 'relative' }}>
      <div style={{
        width: STAGE_W, height: STAGE_H, position: 'absolute', top: 0, left,
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }}>{children}</div>
    </div>
  );
};

const BrainApp = () => (
  <div style={{ padding: '28px 20px 60px' }}>

    {/* header */}
    <header style={{ display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-end', gap: 30, flexWrap: 'wrap' }}>
      <div style={{ maxWidth: 900 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'var(--accent)' }}>// claudemonzter · body · the brain</div>
        <h1 style={{ margin: '10px 0 0', fontFamily: 'var(--font-display)', fontSize: 76,
          fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--fg)',
          fontVariationSettings: '"opsz" 144', lineHeight: 0.88 }}>
          Brain<span style={{ color: 'var(--accent)' }}>.</span></h1>
        <p style={{ margin: '14px 0 0', maxWidth: 720, fontFamily: 'var(--font-display)',
          fontStyle: 'italic', fontSize: 18, lineHeight: 1.45, color: 'var(--fg-muted)',
          fontVariationSettings: '"opsz" 36' }}>{window.BRAIN.thesis}</p>
        <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-faint)' }}>
          a local vault of markdown · {window.BRAIN.credit}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-hand)', fontSize: 18, color: 'var(--fg-subtle)',
        transform: 'rotate(-1.5deg)', maxWidth: 230, textAlign: 'right' }}>
        the graph, drawn over the anatomy.</div>
    </header>

    {/* the brain stage */}
    <div style={{ position: 'relative', marginTop: 24, border: '1px solid var(--line)',
      background: 'var(--bg)', overflow: 'hidden' }}>
      <Stage><window.CombinedComp/></Stage>
    </div>

    {/* page-summary footer (distinct from the site footer below it) */}
    <footer style={{ marginTop: 28, paddingTop: 18, borderTop: '1px dashed var(--line-loud)',
      display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15,
        color: 'var(--fg-muted)', maxWidth: 680, lineHeight: 1.5, fontVariationSettings: '"opsz" 36' }}>
        The vault is the brain; the LLM is the bookkeeper; you curate. The source→wiki→schema
        spine is {window.BRAIN.credit} — the Inbox and the Extended brain are mine.
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em',
        color: 'var(--fg-faint)', textTransform: 'uppercase', textAlign: 'right', lineHeight: 1.8 }}>
        brain.regions = 5<br/>organ · brain<br/>after karpathy’s llm wiki
      </div>
    </footer>

  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<BrainApp/>);
