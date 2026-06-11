// brain-stage.jsx — Brain · Graph on Plate (lab theme).
// The vault graph drawn over the real sagittal brain plate (facing right).
// Wiki=cortex (red, polygon-clamped), Inbox=thalamus (gold), Raw=cerebellum
// (blue), Grounding Docs=brainstem (violet), External Stimuli=eyeball (green,
// 8 nodes as a subtle cube). Memory layers L1–L5 are static pins.
//
// Node layout is deterministic (seeded PRNG, memoized once) so the connectome
// never reflows on re-render. Consumes window.mix + window.LevelDetail.

const CMB_W = 1320, CMB_H = 824;
const cmbRng = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
const PLATE = { x: 96, y: 12, w: 800, h: 800 };
const F = (fx, fy) => [PLATE.x + fx * PLATE.w, PLATE.y + fy * PLATE.h];

// cerebral-cortex outline (frac coords) — keeps Wiki nodes inside the dome
const CORTEX = [
  [0.11, 0.41], [0.12, 0.31], [0.17, 0.22], [0.26, 0.15], [0.37, 0.105], [0.50, 0.085],
  [0.63, 0.095], [0.73, 0.135], [0.815, 0.21], [0.858, 0.30], [0.862, 0.375],
  [0.845, 0.415], [0.74, 0.42], [0.62, 0.40], [0.52, 0.395], [0.44, 0.41],
  [0.34, 0.44], [0.24, 0.455], [0.15, 0.45],
].map(p => F(p[0], p[1]));
const inPoly = (x, y, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
};

const CombinedComp = () => {
  const [hover, setHover] = React.useState(null);
  const L = window.BRAIN_LEVELS;
  const ext = L.find(l => l.offDisk);

  const clusterDefs = [
    { key: 'wiki',    c: F(0.49, 0.24), poly: CORTEX, n: 100, labelY: F(0.49, 0.055)[1] }, // cerebral cortex (mostly-red)
    { key: 'inbox',   c: F(0.525, 0.44), rx: 48, ry: 44, n: 6 },           // thalamus
    { key: 'raw',     c: F(0.31, 0.55), rx: 80, ry: 76, n: 13 },           // cerebellum
    { key: 'project', c: F(0.44, 0.69), rx: 42, ry: 92, n: 9, labelY: F(0.46, 0.655)[1] }, // brainstem
  ];
  const CHIASM = F(0.605, 0.50);
  const EYE = F(0.82, 0.555);

  const clusters = React.useMemo(() => clusterDefs.map((d, ci) => {
    const lvl = L.find(l => l.key === d.key);
    const rng = cmbRng(31 + ci * 47);
    let nodes;
    if (d.poly) {
      const xs = d.poly.map(p => p[0]), ys = d.poly.map(p => p[1]);
      const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
      nodes = []; let guard = 0;
      while (nodes.length < d.n && guard < d.n * 50) {
        guard++;
        const x = minx + rng() * (maxx - minx), y = miny + rng() * (maxy - miny);
        if (inPoly(x, y, d.poly)) nodes.push({ x, y, r: 2.3 + rng() * (nodes.length === 0 ? 3.6 : 2.5), pd: (rng() * 1.7).toFixed(2) + 's' });
      }
    } else {
      nodes = Array.from({ length: d.n }).map((_, i) => {
        const a = rng() * Math.PI * 2, t = Math.sqrt(rng());
        return { x: d.c[0] + Math.cos(a) * d.rx * t, y: d.c[1] + Math.sin(a) * d.ry * t,
          r: 2.3 + rng() * (i === 0 ? 4.4 : 2.8), pd: (rng() * 1.7).toFixed(2) + 's' };
      });
    }
    return { ...d, lvl, cx: d.c[0], cy: d.c[1], nodes };
  }), []);
  const nodeAt = (k) => clusters.find(c => c.key === k).nodes;

  // External Stimuli — 8 nodes arranged as a subtle isometric cube on the eyeball
  const cube = (() => {
    const s = 16, dx = 13, dy = -13;   // half-side + iso depth
    const front = [[-s, -s], [s, -s], [s, s], [-s, s]];
    const corners = front.concat(front.map(p => [p[0] + dx, p[1] + dy]));
    const rng = cmbRng(777);
    return corners.map((o, i) => ({ x: EYE[0] + o[0], y: EYE[1] + o[1], r: i < 4 ? 5 : 4,
      pd: (rng() * 1.7).toFixed(2) + 's' }));
  })();
  const cubeEdges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const opticFrom = [...cube].sort((a, b) => a.x - b.x).slice(0, 2);   // two corners nearest the brain

  // edges
  const intra = [];
  clusters.forEach(c => c.nodes.forEach((n, i) => {
    let best = -1, bd = 1e9;
    c.nodes.forEach((m, j) => { if (j !== i) { const d = (n.x - m.x) ** 2 + (n.y - m.y) ** 2; if (d < bd) { bd = d; best = j; } } });
    if (best > i) intra.push({ a: n, b: c.nodes[best], k: c.key });
  }));
  const bridge = (ka, kb, pairs) => pairs.map(([i, j]) => ({ a: nodeAt(ka)[i], b: nodeAt(kb)[j], k: ka, k2: kb }));
  const inter = [
    ...bridge('inbox', 'wiki', [[0, 4], [3, 9]]),
    ...bridge('raw', 'wiki', [[0, 5], [2, 20], [4, 45], [6, 70], [9, 30], [11, 90]]),
    ...bridge('wiki', 'project', [[2, 0], [40, 3]]),
  ];
  const edgeActive = (e) => !hover || hover === e.k || hover === e.k2;
  const extOn = !hover || hover === 'extended';

  const mem = window.BRAIN_MEMORY;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* ——— brain plate ——— */}
      <div style={{ position: 'absolute', left: PLATE.x, top: PLATE.y, width: PLATE.w, height: PLATE.h,
        overflow: 'hidden', borderRadius: 3, border: '1px solid var(--line-loud)',
        boxShadow: '0 18px 60px rgba(0,0,0,0.6)' }}>
        <img src="assets/brain.png" alt="sagittal brain cross-section, sepia ink on parchment"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            filter: 'contrast(1.05) saturate(1.04) brightness(0.99)' }}/>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background:
          'radial-gradient(circle at 48% 46%, rgba(8,7,13,0) 52%, rgba(8,7,13,0.32) 100%)' }}/>
      </div>

      {/* ——— graph layer ——— */}
      <svg viewBox={`0 0 ${CMB_W} ${CMB_H}`} width={CMB_W} height={CMB_H} style={{ position: 'absolute', inset: 0 }}>
        {/* optic nerve: cube → chiasm → into the vault (inbox) */}
        {opticFrom.map((n, i) => (
          <line key={'op' + i} x1={n.x} y1={n.y} x2={CHIASM[0]} y2={CHIASM[1]}
            stroke="var(--ok)" strokeWidth={extOn ? 1.4 : 1} strokeDasharray="2 4"
            opacity={extOn ? 0.75 : 0.16}/>
        ))}
        <line x1={CHIASM[0]} y1={CHIASM[1]} x2={nodeAt('inbox')[0].x} y2={nodeAt('inbox')[0].y}
          stroke="var(--ok)" strokeWidth="1.2" strokeDasharray="2 4" opacity={extOn ? 0.55 : 0.14}/>

        {/* vault edges — intra = region colour, inter = gray (brighter) */}
        {[...intra, ...inter].map((e, i) => (
          <line key={'ed' + i} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
            stroke={e.k2 ? window.mix('var(--ink-200)', 92, 'transparent') : window.mix(clusters.find(c => c.key === e.k).lvl.token, 80, 'transparent')}
            strokeWidth={e.k2 ? 1.7 : 1.2} opacity={edgeActive(e) ? (e.k2 ? 0.85 : 0.6) : 0.1}
            style={{ transition: 'opacity 200ms' }}/>
        ))}

        {/* vault cluster nodes (pulse when active) */}
        {clusters.map(c => {
          const on = !hover || hover === c.key;
          const active = hover === c.key;
          return (
            <g key={c.key} opacity={on ? 1 : 0.22} style={{ transition: 'opacity 240ms' }}>
              {c.nodes.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={n.r + (active ? 8 : 6)} fill={window.mix(c.lvl.token, active ? 44 : 22, 'transparent')}/>
                  {active && <circle className="node-pulse" cx={n.x} cy={n.y} r={n.r + 1} fill="none" stroke={c.lvl.token} strokeWidth="2.4" style={{ animationDelay: n.pd }}/>}
                  <circle cx={n.x} cy={n.y} r={active ? n.r + 0.8 : n.r} fill={c.lvl.token} stroke="rgba(12,8,18,0.85)" strokeWidth="1.3"/>
                </g>
              ))}
            </g>
          );
        })}

        {/* chiasm marker + the eyeball cube (External Stimuli) */}
        <circle cx={CHIASM[0]} cy={CHIASM[1]} r="4" fill="var(--ok)" stroke="rgba(12,8,18,0.85)" strokeWidth="1.2"/>
        <g opacity={extOn ? 1 : 0.3} style={{ transition: 'opacity 240ms' }}>
          {/* subtle cube edges */}
          {cubeEdges.map(([a, b], i) => (
            <line key={'ce' + i} x1={cube[a].x} y1={cube[a].y} x2={cube[b].x} y2={cube[b].y}
              stroke="var(--ok)" strokeWidth="1" opacity={hover === 'extended' ? 0.5 : 0.32}/>
          ))}
          {cube.map((n, i) => (
            <g key={'en' + i}>
              <circle cx={n.x} cy={n.y} r={n.r + (hover === 'extended' ? 8 : 6)} fill={window.mix('var(--ok)', hover === 'extended' ? 44 : 22, 'transparent')}/>
              {hover === 'extended' && <circle className="node-pulse" cx={n.x} cy={n.y} r={n.r + 1} fill="none" stroke="var(--ok)" strokeWidth="2.4" style={{ animationDelay: n.pd }}/>}
              <circle cx={n.x} cy={n.y} r={n.r} fill="var(--ok)" stroke="rgba(12,8,18,0.85)" strokeWidth="1.3"/>
            </g>
          ))}
        </g>

        {/* hit areas */}
        {clusters.map(c => (
          c.poly
            ? <polygon key={'hit' + c.key} points={c.poly.map(p => p.join(',')).join(' ')} fill="transparent"
                style={{ cursor: 'default' }}
                onMouseEnter={() => setHover(c.key)} onMouseLeave={() => setHover(null)}/>
            : <ellipse key={'hit' + c.key} cx={c.cx} cy={c.cy} rx={c.rx + 12} ry={c.ry + 12} fill="transparent"
                style={{ cursor: 'default' }}
                onMouseEnter={() => setHover(c.key)} onMouseLeave={() => setHover(null)}/>
        ))}
        <circle cx={EYE[0]} cy={EYE[1]} r="56" fill="transparent" style={{ cursor: 'default' }}
          onMouseEnter={() => setHover('extended')} onMouseLeave={() => setHover(null)}/>
      </svg>

      {/* ——— zone labels (cream plate-tags; on hover only the active one shows) ——— */}
      {clusters.concat([{ key: 'extended', lvl: ext, cx: EYE[0], labelY: EYE[1] - 74 }]).map(c => {
        const labY = c.labelY != null ? c.labelY : c.cy - c.ry - 26;
        const show = !hover || hover === c.key;
        return (
          <div key={'lab' + c.key} style={{
            position: 'absolute', left: c.cx, top: labY, transform: 'translateX(-50%)',
            pointerEvents: 'none', opacity: show ? 1 : 0, transition: 'opacity 200ms', whiteSpace: 'nowrap', zIndex: 4,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center',
              background: 'rgba(244,235,220,0.9)', border: '1px solid rgba(120,100,80,0.5)',
              borderLeft: `3px solid ${c.lvl.token}`, padding: '3px 9px 3px 8px', borderRadius: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1c1119' }}>{c.lvl.name}</span>
            </span>
          </div>
        );
      })}

      {/* ——— memory pins (static, no hover) ——— */}
      {mem.map(m => {
        const [x, y] = F(m.f[0], m.f[1]);
        return (
          <div key={'mem' + m.id} style={{ position: 'absolute', left: x, top: y,
            transform: 'translate(-50%,-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 5,
            opacity: hover ? 0.2 : 1, transition: 'opacity 200ms' }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: m.token,
              border: '1.5px solid rgba(12,8,18,0.9)', boxShadow: `0 0 0 3px ${window.mix(m.token, 22, 'transparent')}`, flexShrink: 0 }}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.04em',
              color: 'var(--fg)', background: 'rgba(8,7,13,0.82)', padding: '1px 6px', borderRadius: 2,
              border: `1px solid ${window.mix(m.token, 50, 'var(--line)')}` }}>
              <b style={{ color: m.token }}>L{m.id}</b> {m.name}</span>
          </div>
        );
      })}

      {/* ——— right column: idle inspector (no hover) ——— */}
      {!hover && (
        <div style={{ position: 'absolute', left: 936, top: 58, width: 362 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: 'var(--accent)' }}>// inspector</div>
          <h3 style={{ margin: '8px 0 0', fontFamily: 'var(--font-sans)', fontSize: 25, fontWeight: 800,
            letterSpacing: '-0.02em', color: 'var(--fg)', lineHeight: 1.05 }}>Hover a region.</h3>
          <p style={{ margin: '11px 0 0', fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.55,
            color: 'var(--fg-muted)' }}>The 2nd brain is a local Obsidian vault of markdown files. Five regions hold its
            documents — project and grounding documents, immutable research documents, a agent-synthesized wiki, an inbox of unprocessed material, and external 
            surfaces where the human sends new items. Files reside at five memory layers, as shown here and on memory.html. Hover a region to read it.</p>

          <div style={{ margin: '18px 0 14px', borderTop: '1px dashed var(--line-loud)' }}/>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>// config layers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {mem.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: m.token,
                  border: '1.5px solid rgba(12,8,18,0.7)', flexShrink: 0, transform: 'translateY(1px)' }}/>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.5, color: 'var(--fg-muted)' }}>
                  <b style={{ color: m.token, letterSpacing: '0.04em' }}>L{m.id} · {m.name.toUpperCase()}</b>
                  <span style={{ color: 'var(--fg-subtle)' }}> — {m.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, fontFamily: 'var(--font-hand)', fontSize: 17, color: 'var(--fg-subtle)',
            transform: 'rotate(-1.5deg)' }}>← hover a region to read more about it.</div>
        </div>
      )}

      {/* ——— hover detail card ——— */}
      {hover && (() => {
        const lvl = hover === 'extended' ? ext : clusters.find(c => c.key === hover).lvl;
        return (
          <div style={{ position: 'absolute', left: 936, top: 92, width: 362, pointerEvents: 'none', zIndex: 6 }}>
            <window.LevelDetail level={lvl} accent={lvl.token} compact/>
          </div>
        );
      })()}
    </div>
  );
};

window.CombinedComp = CombinedComp;
