// AgentGraph.jsx — the homepage centerpiece.
// SVG node graph: center = the lab, inner ring = 4 projects, outer ring =
// 8 agents grouped around their parent. Hover dims non-connected paths;
// the right-hand <Inspector> swaps to the matching AgentCard.

// Hardcoded positions. ViewBox 1000×640. Tuned by eye for legibility,
// with enough top/side padding for labels.
const W = 1000, H = 640;
const CX = W / 2, CY = H / 2 + 10;

const POSITIONS = {
  // center
  'me':         { x: CX,        y: CY,         kind: 'hub'     },

  // projects (inner ring) — four cardinal positions
  'meta1':      { x: CX,        y: CY - 150,   kind: 'project' },
  'pura-vida':  { x: CX + 175,  y: CY + 45,    kind: 'project' },
  'phil':       { x: CX - 10,   y: CY + 175,   kind: 'project' },
  'self':       { x: CX - 200,  y: CY - 10,    kind: 'project' },

  // agents (outer ring) — clustered around their parent project,
  // with enough top/side margin that labels fit below every node.
  // meta1 cluster (top)
  'a-meta1':    { x: CX - 105,  y: CY - 240,   kind: 'agent', projectId: 'meta1' },
  'a-bond':     { x: CX + 100,  y: CY - 250,   kind: 'agent', projectId: 'meta1' },
  'a-assessor': { x: CX + 175,  y: CY - 165,   kind: 'agent', projectId: 'meta1' },
  // pura-vida cluster (right)
  'a-house':    { x: CX + 320,  y: CY - 80,    kind: 'agent', projectId: 'pura-vida' },
  'a-freedom':  { x: CX + 365,  y: CY + 50,    kind: 'agent', projectId: 'pura-vida' },
  'a-evolve':   { x: CX + 345,  y: CY + 160,   kind: 'agent', projectId: 'pura-vida' },
  // phil cluster (bottom)
  'a-phil':     { x: CX - 100,  y: CY + 245,   kind: 'agent', projectId: 'phil' },
  // self cluster (left)
  'a-jeremy':   { x: CX - 380,  y: CY - 60,    kind: 'agent', projectId: 'self' },
};

const AGENT_NODE_ID = (a) => 'a-' + a.id;

// Graph-specific color mapping by project family.
// These override data.js project tones for graph rendering only.
const GRAPH_COLORS = {
  'me':         'var(--accent)',   // purple — the lab
  'self':       'var(--accent)',   // purple — operator
  'a-jeremy':   'var(--accent)',   // purple — human node
  'meta1':      'var(--ok)',       // green — meta1 project
  'a-meta1':    'var(--ok)',       // green
  'a-bond':     'var(--ok)',       // green
  'pura-vida':  'var(--info)',     // teal — pura-vida project
  'a-house':    'var(--info)',     // teal
  'a-freedom':  'var(--info)',     // teal
  'a-evolve':   'var(--info)',     // teal
  'a-assessor': 'var(--ok)',       // green
  'phil':       'var(--err)',      // red — phil project
  'a-phil':     'var(--err)',      // red
};
const graphColor = (id) => GRAPH_COLORS[id] || 'var(--accent)';

const AgentGraph = ({ hovered, setHovered, agents: agentsProp, fetchStatus }) => {
  // Use live agents if provided, fall back to static global
  const agents = agentsProp || AGENTS;

  // Compute connectivity. When hovering an agent, only its agent→project→hub
  // path is lit. When hovering a project, all its agents + the hub. When
  // hovering the hub, everything.
  const litIds = React.useMemo(() => {
    if (!hovered) return new Set();
    const lit = new Set([hovered.id]);
    if (hovered.kind === 'hub') {
      PROJECTS.forEach(p => lit.add(p.id));
      agents.forEach(a => lit.add(AGENT_NODE_ID(a)));
    } else if (hovered.kind === 'project') {
      lit.add('me');
      agents.filter(a => a.project === hovered.id).forEach(a => lit.add(AGENT_NODE_ID(a)));
    } else if (hovered.kind === 'agent') {
      const agent = agents.find(a => AGENT_NODE_ID(a) === hovered.id);
      if (agent) {
        lit.add(agent.project);
        lit.add('me');
      }
    }
    return lit;
  }, [hovered, agents]);

  // Build edges: hub↔project, project↔its agents.
  const edges = [];
  PROJECTS.forEach(p => {
    edges.push({ a: 'me', b: p.id, key: 'me-' + p.id });
    agents.filter(a => a.project === p.id).forEach(ag => {
      edges.push({ a: p.id, b: AGENT_NODE_ID(ag), key: p.id + '-' + ag.id });
    });
  });

  const edgeLit = (e) => hovered && litIds.has(e.a) && litIds.has(e.b);
  const edgeFaded = (e) => hovered && !edgeLit(e);
  const nodeFaded = (id) => hovered && !litIds.has(id);

  return (
    <div style={{
      position: 'relative',
      border: '1px solid var(--line)',
      background: 'var(--bg-elev-1)',
      // 1000/640 matches the SVG viewBox exactly; the taller box adds
      // breathing room so the inspector (which adopts this row's height)
      // fits its content without an internal scrollbar. The SVG centers
      // vertically in the extra space.
      aspectRatio: '1000 / 690',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Top-left readout */}
      <div style={{
        position: 'absolute', top: 14, left: 16,
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'var(--fg-faint)', pointerEvents: 'none', zIndex: 1,
      }}>
        {'// GRAPH · CLAUDEMONZTER · ' + (SITE ? SITE.version : 'v3.3')}
      </div>
      <div style={{
        position: 'absolute', top: 14, right: 16,
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'var(--fg-faint)', pointerEvents: 'none', zIndex: 1,
      }}>
        {PROJECTS.length + ' PROJECTS · ' + AGENTS.length + ' AGENTS (1 HUMAN)'}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="group" aria-label="Interactive agent graph. Tab through nodes to explore; press Enter on an agent to open its profile." style={{ display: 'block' }}>
        {/* Edges */}
        {edges.map(e => {
          const A = POSITIONS[e.a], B = POSITIONS[e.b];
          if (!A || !B) return null;
          return (
            <line key={e.key}
                  x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke={edgeLit(e) ? 'var(--candle)' : 'var(--line-loud)'}
                  strokeWidth={edgeLit(e) ? 1.5 : 1}
                  opacity={edgeFaded(e) ? 0.25 : 0.85} />
          );
        })}

        {/* HUB ─ Claudemonzter */}
        <HubNode hovered={hovered} setHovered={setHovered} faded={nodeFaded('me')} />

        {/* PROJECT NODES */}
        {PROJECTS.map(p => (
          <ProjectNode key={p.id} project={p}
                       hovered={hovered} setHovered={setHovered}
                       faded={nodeFaded(p.id)} />
        ))}

        {/* AGENT NODES */}
        {agents.map(a => (
          <AgentNode key={a.id} agent={a}
                     hovered={hovered} setHovered={setHovered}
                     faded={nodeFaded(AGENT_NODE_ID(a))} />
        ))}
      </svg>

      {/* Helper hint when nothing is hovered */}
      {!hovered && (
        <div style={{
          position: 'absolute', bottom: 14, left: 16,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--fg-faint)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent)' }} />
          HOVER ANY NODE TO INSPECT →
        </div>
      )}
    </div>
  );
};

// ── HUB ────────────────────────────────────────────────────────────────────
const HubNode = ({ hovered, setHovered, faded }) => {
  const active = hovered?.id === 'me';
  return (
    <g
      className="graph-node"
      tabIndex={0}
      role="button"
      aria-label="Claudemonzter, system hub — show details"
      onMouseEnter={() => setHovered({ id: 'me', kind: 'hub' })}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered({ id: 'me', kind: 'hub' })}
      onBlur={() => setHovered(null)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHovered({ id: 'me', kind: 'hub' }); } }}
      style={{ cursor: 'default', opacity: faded ? 0.4 : 1, transition: 'opacity 200ms var(--ease-out)' }}>
      <circle cx={CX} cy={CY} r="58" fill="var(--accent-low)" stroke="var(--accent)" strokeWidth={active ? 2.5 : 1.5} />
      <circle cx={CX} cy={CY} r="58" fill="none" stroke="var(--accent-glow)" strokeWidth="8" opacity="0.45" />
      {/* Bolt glyph inside */}
      <path
        d="M -6 -22 L 16 -22 L 4 -2 L 14 -2 L -6 22 L 4 4 L -8 4 Z"
        transform={`translate(${CX} ${CY - 14}) scale(0.85)`}
        fill="var(--accent)" />
      <text x={CX} y={CY + 24} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize="11" fontWeight="600"
            letterSpacing="2.5" fill="var(--accent)"
            style={{ textTransform: 'uppercase', pointerEvents: 'none' }}>
        CLAUDEMONZTER
      </text>
    </g>
  );
};

// ── PROJECT ────────────────────────────────────────────────────────────────
const ProjectNode = ({ project, hovered, setHovered, faded }) => {
  const pos = POSITIONS[project.id];
  const active = hovered?.id === project.id;
  const toneColor = graphColor(project.id);

  return (
    <g
      className="graph-node"
      tabIndex={0}
      role="button"
      aria-label={`${project.label} project — show details`}
      onMouseEnter={() => setHovered({ id: project.id, kind: 'project' })}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered({ id: project.id, kind: 'project' })}
      onBlur={() => setHovered(null)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHovered({ id: project.id, kind: 'project' }); } }}
      style={{ cursor: 'default', opacity: faded ? 0.35 : 1, transition: 'opacity 200ms var(--ease-out)' }}>
      <circle cx={pos.x} cy={pos.y} r="34"
              fill="var(--bg-elev-2)"
              stroke={toneColor}
              strokeWidth={active ? 2.5 : 1.5} />
      {active && <circle cx={pos.x} cy={pos.y} r="34" fill="none" stroke={toneColor} strokeWidth="6" opacity="0.35" />}
      <text x={pos.x} y={pos.y + 4} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize="10" fontWeight="600"
            letterSpacing="1.8" fill={toneColor}
            style={{ textTransform: 'uppercase', pointerEvents: 'none' }}>
        {project.label}
      </text>
    </g>
  );
};

// ── AGENT ──────────────────────────────────────────────────────────────────
const AgentNode = ({ agent, hovered, setHovered, faded }) => {
  const id = AGENT_NODE_ID(agent);
  const pos = POSITIONS[id];
  const active = hovered?.id === id;
  const flagged = agent.state === 'flagged';
  const ringColor = flagged ? 'var(--err)' : graphColor(id);

  // Labels always sit below the node — the cluster layout above gives
  // every outer agent enough vertical room.
  return (
    <g
      className="graph-node"
      tabIndex={0}
      role="link"
      aria-label={`${agent.name}${agent.role ? ', ' + agent.role : ''} agent${flagged ? ', flagged' : ''} — view profile`}
      onMouseEnter={() => setHovered({ id, kind: 'agent' })}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered({ id, kind: 'agent' })}
      onBlur={() => setHovered(null)}
      onClick={() => window.location.href = `agents/${agent.id}/${agent.id}.html`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = `agents/${agent.id}/${agent.id}.html`; } }}
      style={{ cursor: 'pointer', opacity: faded ? 0.3 : 1, transition: 'opacity 200ms var(--ease-out)' }}>
      <circle cx={pos.x} cy={pos.y} r={active ? 18 : 14}
              fill="var(--bg-elev-2)"
              stroke={ringColor}
              strokeWidth={active ? 2 : 1.25} />
      {flagged && (
        <circle cx={pos.x} cy={pos.y} r={5} fill="var(--err)"
                className="pulse-dot" style={{ color: 'var(--err)' }} />
      )}
      {!flagged && active && (
        <circle cx={pos.x} cy={pos.y} r={4} fill={graphColor(id)} />
      )}
      <text x={pos.x}
            y={pos.y + 32}
            textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize="10" fontWeight={active ? 600 : 400}
            letterSpacing="1.5"
            fill={active ? 'var(--fg)' : 'var(--fg-muted)'}
            style={{ textTransform: 'uppercase', pointerEvents: 'none' }}>
        {agent.name}
      </text>
    </g>
  );
};

// ── INSPECTOR PANE ─────────────────────────────────────────────────────────
const Inspector = ({ hovered, agentData, agents: agentsProp, fetchStatus }) => {
  const agents = agentsProp || AGENTS;
  // STATE A: empty / instructions
  if (!hovered) {
    return (
      <div style={{
        border: '1px solid var(--line)', background: 'var(--bg-elev-1)',
        padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
        height: '100%', boxSizing: 'border-box', overflow: 'auto',
      }}>
        <Eyebrow color="var(--candle)">// INSPECTOR</Eyebrow>
        <h3 style={{ marginTop: 4 }}>
          Explore the system.
        </h3>
        <p style={{ color: 'var(--fg-subtle)' }}>
          The graph is named Claudemonzter. Outer nodes, agents, have their own domain, webpage, and persona.
          They are grouped by function in projects, the inner nodes.
        </p>

        <div style={{ marginTop: 10, borderTop: '1px dashed var(--line-loud)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Eyebrow color="var(--candle)">// MEMORY LAYERS</Eyebrow>
          {[
            { c: 'var(--accent)', label: 'L1 · IDENTITY', blurb: 'User instructions.' },
            { c: 'var(--info)',   label: 'L2 · CONTEXT', blurb: 'About me, my voice.' },
            { c: 'var(--ok)',     label: 'L3 · PROJECT', blurb: 'Rules and operating instructions.' },
            { c: 'var(--candle)', label: 'L4 · AGENT·ROLE', blurb: 'Domain knowledge.' },
            { c: 'var(--err)',    label: 'L5 · SESSION', blurb: 'Active state.' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em',
              color: 'var(--fg-muted)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.c, display: 'inline-block', marginTop: 3, flexShrink: 0 }} />
              <span><span style={{ color: row.c }}>{row.label}</span> — {row.blurb}</span>
            </div>
          ))}
        </div>

        <div className="scribble" style={{
          marginTop: 'auto', color: 'var(--candle)', fontSize: 22, display: 'block',
        }}>
          ← hover nodes to see details <br/>click to enter the page
        </div>
      </div>
    );
  }

  // STATE B: hovered hub
  if (hovered.kind === 'hub') {
    return (
      <div style={{ border: '1px solid var(--line)', background: 'var(--bg-elev-1)', padding: 24, height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
        <Eyebrow color="var(--candle)">// INSPECTOR · LAB</Eyebrow>
        <h2 style={{ marginTop: 10, marginBottom: 14 }}>
          <span className="t-hyde" style={{ fontSize: 38, color: 'var(--accent)' }}>Claudemon</span>
          <span className="t-hyde" style={{ fontSize: 38, color: 'var(--accent)' }}>z</span>
          <span className="t-hyde" style={{ fontSize: 38, color: 'var(--accent)' }}>ter.</span>
        </h2>
        <p style={{ marginBottom: 16 }}>
          {ME.blurb}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['EST.',     ME.est.replace('EST. ', '')],
            ['VERSION',  SITE.version],
            ['LAB',      '001 · ' + SITE.status],
            ['PROJECTS', PROJECTS.length + ' ACTIVE'],
            ['AGENTS',   agents.length + ' TRACKED'],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em',
              padding: '6px 0', borderBottom: '1px solid var(--line-soft)',
            }}>
              <span style={{ color: 'var(--fg-subtle)' }}>{k}</span>
              <span style={{ color: 'var(--fg)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // STATE C: hovered project
  if (hovered.kind === 'project') {
    const project = PROJECTS.find(p => p.id === hovered.id);
    const projectAgents = agents.filter(a => a.project === project.id);
    const toneColor = {
      accent: 'var(--accent)', info: 'var(--info)', ok: 'var(--ok)', warn: 'var(--warn)',
    }[project.tone];
    return (
      <div style={{ border: '1px solid var(--line)', background: 'var(--bg-elev-1)', padding: 24, height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
        <Eyebrow color="var(--candle)">// INSPECTOR · PROJECT</Eyebrow>
        <h2 style={{
          marginTop: 10, marginBottom: 8, color: toneColor,
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
        }}>{project.label}</h2>
        <p style={{ marginBottom: 18 }}>{project.blurb}</p>

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--fg-faint)', marginBottom: 8,
        }}>
          {projectAgents.length} AGENT{projectAgents.length === 1 ? '' : 'S'} IN THIS PROJECT
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {projectAgents.map(a => (
            <div key={a.id} style={{
              padding: '10px 12px',
              border: '1px solid var(--line)',
              background: 'var(--bg-elev-2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{a.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--fg-faint)', textTransform: 'uppercase' }}>
                  {a.role}
                </div>
              </div>
              <Badge tone={a.state === 'flagged' ? 'err' : a.state === 'idle' ? 'neutral' : 'ok'}
                     sym={a.state === 'flagged' ? '!' : '●'}>
                {(a.state || 'active').toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // STATE D: hovered agent — the SHARED agent card (components/agent-card.js),
  // the exact same renderer dashboard.html and the agent pages use. One card,
  // three pages. No live rows → honest NO DATA state, never placeholder data.
  if (!agentData) return null; // safety: if the prop didn't resolve, render nothing
  const { entry, comp } = agentData;
  const hasData = comp && comp.upperRow;

  if (!hasData) {
    return (
      <div style={{
        border: '1px solid var(--line)', background: 'var(--bg-elev-1)',
        padding: 24, height: '100%', boxSizing: 'border-box', overflow: 'auto',
      }}>
        <Eyebrow color="var(--candle)">{'// INSPECTOR · ' + entry.domain.toUpperCase()}</Eyebrow>
        <h3 style={{
          marginTop: 14, fontFamily: 'var(--font-mono)',
          letterSpacing: '0.18em', color: 'var(--err)',
        }}>NO DATA</h3>
        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--err)' }}>
          No live checkin data for this agent. The Sheet may be unreachable
          or this domain has no checkins yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', boxSizing: 'border-box', overflow: 'auto' }}
         dangerouslySetInnerHTML={{ __html: renderCard(entry, comp) }} />
  );
};

window.AgentGraph = AgentGraph;
window.Inspector = Inspector;
