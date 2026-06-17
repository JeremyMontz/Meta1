/* ============================================================
 * SECOND MONTH — Case study graph engine
 *
 * Two persistent hubs (Disk, GitHub Pages) plus "me"; pages are
 * the nodes that accumulate, skills are the lit lines. Each
 * chapter lights a subset of one master edge set, with per-edge
 * brightness weights and an optional static (noflow) treatment.
 * Boot is robust — runs on DOMContentLoaded / load / visibility,
 * never gated on a single animation frame.
 * ============================================================ */
(function(){
  const svg=document.getElementById('graphSvg');
  const edgesG=document.getElementById('edges');
  const fxG=document.getElementById('fxLayer');
  const nodesG=document.getElementById('nodes');
  const wrap=document.getElementById('graphWrap');
  const legendEl=document.getElementById('skillLegend');
  const tagsEl=document.getElementById('skillTags');
  let W=wrap.clientWidth, H=wrap.clientHeight;

  function resize(){ W=wrap.clientWidth; H=wrap.clientHeight; svg.setAttribute('viewBox',`0 0 ${W} ${H}`); if(cur!=null) applyAnchors(CH[cur],true); }
  window.addEventListener('resize', resize);

  const COLOR={ hub:'#f5c56a', human:'#f5c56a', memory:'#8dd9ff', source:'#a7ff7d', page:'#b57bff', dead:'#a9a5b8' };
  const CIRC={ spine:'#f5c56a', github:'#f5c56a', invoke:'#f5c56a', intake:'#a7ff7d', memory:'#8dd9ff', publish:'#b57bff', dead:'#ff4757' };
  const DIM='#4f4b60';

  const NODES={
    disk:{label:'Disk', kind:'hub', r:22, x:0.30, y:0.46},
    ghpages:{label:'GitHub Pages', kind:'hub', r:22, x:0.70, y:0.46},
    me:{label:'me', kind:'hub', r:22, x:0.50, y:0.36},
    gmail:{label:'Gmail', kind:'source', r:9, x:0.28, y:0.09},
    todo:{label:'To Do', kind:'source', r:9, x:0.40, y:0.07},
    issues:{label:'Issues', kind:'source', r:9, x:0.52, y:0.07},
    drive:{label:'Drive', kind:'source', r:9, x:0.64, y:0.09},
    www:{label:'WWW', kind:'source', r:9, x:0.19, y:0.13},
    inbox:{label:'Inbox/', kind:'memory', r:13, x:0.44, y:0.22},
    raw:{label:'Raw/', kind:'memory', r:14, x:0.15, y:0.36},
    wiki:{label:'Wiki/', kind:'memory', r:14, x:0.20, y:0.24},
    dashboard:{label:'dashboard', kind:'page', r:11, x:0.80, y:0.27},
    checkin:{label:'check in', kind:'page', r:11, x:0.88, y:0.34},
    home:{label:'home', kind:'page', r:12, x:0.90, y:0.45},
    portfolio:{label:'portfolio', kind:'page', r:11, x:0.88, y:0.55},
    abouttpl:{label:'about/', kind:'page', r:10, x:0.83, y:0.63},
    writingtpl:{label:'writing/', kind:'page', r:10, x:0.76, y:0.69},
    tracker:{label:'house tracker', kind:'page', r:12, x:0.83, y:0.72},
    spirit:{label:'spirit', kind:'page', r:11, x:0.72, y:0.71},
    ag1:{label:'Meta1', kind:'page', r:9, x:0.24, y:0.66},
    ag2:{label:'Bond', kind:'page', r:9, x:0.17, y:0.74},
    ag3:{label:'House', kind:'page', r:9, x:0.25, y:0.83},
    ag4:{label:'Freedom', kind:'page', r:9, x:0.37, y:0.85},
    ag5:{label:'Evolve', kind:'page', r:9, x:0.49, y:0.82},
    ag6:{label:'Assessor', kind:'page', r:9, x:0.33, y:0.72},
    ag7:{label:'Phil', kind:'page', r:9, x:0.44, y:0.74},
    ag8:{label:'Jeremy', kind:'page', r:9, x:0.55, y:0.70},
    canon:{label:'canon', kind:'dead', r:11, x:0.73, y:0.17},
    inventory:{label:'inventory', kind:'dead', r:10, x:0.82, y:0.18}
  };
  function colorOf(n){ return n.color || COLOR[n.kind] || '#b57bff'; }

  const E=(a,b,c,w,style)=>({a,b,c,w:(w!=null?w:1),style,key:a+'>'+b});
  const EDGES=[
    E('disk','ghpages','spine',1),
    E('me','ghpages','github',1),
    E('me','disk','invoke',0.7),
    E('gmail','inbox','intake',1),E('todo','inbox','intake',1),E('issues','inbox','intake',1),E('drive','inbox','intake',1),E('www','inbox','intake',1),
    E('inbox','disk','memory',1),
    E('disk','raw','memory',1),E('disk','wiki','memory',1),
    E('dashboard','ghpages','publish',1),E('writingtpl','ghpages','publish',0.7),E('checkin','ghpages','publish',1),
    E('home','ghpages','publish',1),E('portfolio','ghpages','publish',1),E('abouttpl','ghpages','publish',0.7),
    E('tracker','ghpages','publish',1),E('spirit','ghpages','publish',1),
    E('canon','ghpages','dead',1,'broken'),E('inventory','ghpages','intake',1),
    E('disk','ag1','publish',0.9),E('ghpages','ag1','publish',0.5),
    E('disk','ag2','publish',0.4),E('ghpages','ag2','publish',0.85),
    E('disk','ag3','publish',0.7),E('ghpages','ag3','publish',0.35),
    E('disk','ag4','publish',0.5),E('ghpages','ag4','publish',0.9),
    E('disk','ag5','publish',0.8),E('ghpages','ag5','publish',0.45),
    E('disk','ag6','publish',0.45),E('ghpages','ag6','publish',0.75),
    E('disk','ag7','publish',0.6),E('ghpages','ag7','publish',0.85),
    E('disk','ag8','publish',0.35),E('ghpages','ag8','publish',0.6)
  ];
  const AG=['ag1','ag2','ag3','ag4','ag5','ag6','ag7','ag8'];
  const PAGES=['dashboard','writingtpl','checkin','home','portfolio','abouttpl','tracker','spirit'];
  function agEdges(){ const o=[]; AG.forEach(a=>{o.push('disk>'+a); o.push('ghpages>'+a);}); return o; }
  function pageEdges(){ return PAGES.map(p=>p+'>ghpages'); }

  const HUBS={ disk:{op:1}, ghpages:{op:1} };
  function vis(extra){ return Object.assign({}, HUBS, extra); }

  const CH=[
    { label:'', hero:true, skills:['the whole system'], legendAt:[0.5,0.5],
      nodes:vis({ me:{op:0.85}, gmail:{op:0.6},todo:{op:0.6},issues:{op:0.6},drive:{op:0.6},www:{op:0.6},inbox:{op:0.8},
        raw:{op:0.85},wiki:{op:0.85}, canon:{op:0.4},inventory:{op:0.4},
        dashboard:{op:0.8},writingtpl:{op:0.7},checkin:{op:0.8},home:{op:0.85},portfolio:{op:0.8},abouttpl:{op:0.7},tracker:{op:0.8},spirit:{op:0.8},
        ag1:{op:0.7},ag2:{op:0.7},ag3:{op:0.7},ag4:{op:0.7},ag5:{op:0.7},ag6:{op:0.7},ag7:{op:0.7},ag8:{op:0.7} }),
      lit:['disk>ghpages','me>ghpages','me>disk','inbox>disk','disk>raw','disk>wiki','gmail>inbox','todo>inbox','issues>inbox','drive>inbox','www>inbox'].concat(pageEdges()).concat(agEdges()),
      noflow:['inbox>disk','disk>raw','disk>wiki','gmail>inbox','todo>inbox','issues>inbox','drive>inbox','www>inbox'].concat(pageEdges()).concat(agEdges()) },

    { label:'01', skills:[], legendAt:[0.18,0.66],
      tags:[{t:'meta1 handshake', at:[0.68,0.10], c:'red'},{t:'Google Script', at:[0.86,0.12], c:'green'}],
      nodes:vis({ disk:{op:0.92}, ghpages:{op:0.6}, me:{op:0.95}, canon:{op:0.9, color:'#ff4757', glow:3.6, pulse:true}, inventory:{op:0.9, color:'#a7ff7d'}, dashboard:{op:0.85}, checkin:{op:0.85} }),
      lit:['me>disk','me>ghpages','disk>ghpages','canon>ghpages','inventory>ghpages','dashboard>ghpages','checkin>ghpages'],
      noflow:['me>disk','me>ghpages','disk>ghpages','inventory>ghpages','dashboard>ghpages','checkin>ghpages'] },

    { label:'02', skills:['wiki-write','ingest-inbox'], legendAt:[0.46,0.42],
      nodes:vis({ disk:{op:1, glow:3}, ghpages:{op:0}, raw:{op:1},wiki:{op:1}, inbox:{op:1} }),
      lit:['disk>raw','disk>wiki','inbox>disk'] },

    { label:'03', skills:['gh-issue-query','email-ingest','todo-ingest','check-email','todo-query'], legendAt:[0.5,0.32],
      nodes:vis({ disk:{op:1}, ghpages:{op:0}, raw:{op:0.5},wiki:{op:0.5},
        gmail:{op:1},todo:{op:1},issues:{op:1},drive:{op:1},www:{op:1},inbox:{op:1} }),
      lit:['gmail>inbox','todo>inbox','issues>inbox','drive>inbox','www>inbox','inbox>disk'] },

    { label:'04', skills:['quick-start','full-start','quick-stop','close-session','passphrases'], legendAt:[0.60,0.34], pulse:'dashboard',
      nodes:vis({ disk:{op:0.92}, ghpages:{op:0.6}, me:{op:0.95}, canon:{op:0.3}, inventory:{op:0.3}, dashboard:{op:0.95, glow:3.6, pulse:true}, checkin:{op:0.85} }),
      lit:['me>disk','me>ghpages','disk>ghpages','dashboard>ghpages','checkin>ghpages'],
      noflow:['me>disk','me>ghpages','disk>ghpages','dashboard>ghpages','checkin>ghpages'] },

    { label:'05', skills:['design system'], legendAt:[0.70,0.44], pop:true,
      nodes:vis({ disk:{op:0.85}, ghpages:{op:1}, me:{op:1},
        dashboard:{op:1},writingtpl:{op:0.8},checkin:{op:1},home:{op:1},portfolio:{op:1},abouttpl:{op:0.8} }),
      lit:['disk>ghpages','me>disk','me>ghpages','dashboard>ghpages','writingtpl>ghpages','checkin>ghpages','home>ghpages','portfolio>ghpages','abouttpl>ghpages'],
      noflow:['me>disk','disk>ghpages'] },

    { label:'06', skills:['prototype built in an afternoon'], legendAt:[0.76,0.59],
      nodes:vis({ disk:{op:0.55}, ghpages:{op:0.7}, me:{op:0.5},
        dashboard:{op:0.28},home:{op:0.3},portfolio:{op:0.3},checkin:{op:0.28},writingtpl:{op:0.25},abouttpl:{op:0.25}, tracker:{r:16, pulse:true} }),
      lit:['tracker>ghpages'] },

    { label:'07', skills:['persona-cascade'], legendAt:[0.45,0.58], pop:true,
      nodes:vis({ disk:{op:0.9}, ghpages:{op:0.9}, me:{op:0.7},
        dashboard:{op:0.45},writingtpl:{op:0.4},checkin:{op:0.45},home:{op:0.5},portfolio:{op:0.5},abouttpl:{op:0.4},tracker:{op:0.5},spirit:{op:0.4},
        ag1:{op:1},ag2:{op:1},ag3:{op:1},ag4:{op:1},ag5:{op:1},ag6:{op:1},ag7:{op:1},ag8:{op:1}, canon:{op:0.15},inventory:{op:0.15} }),
      lit:['me>disk','me>ghpages','disk>ghpages'].concat(agEdges()) },

    { label:'08', skills:[], legendAt:[0.50,0.19], pulse:'disk',
      tags:[{t:'wiki-write',at:[0.50,0.20],c:'bolt'},{t:'ingest-inbox',at:[0.595,0.221],c:'bolt'},{t:'gh-issue-query',at:[0.664,0.28],c:'bolt'},{t:'email-ingest',at:[0.69,0.36],c:'bolt'},{t:'todo-ingest',at:[0.664,0.44],c:'bolt'},{t:'check-email',at:[0.595,0.499],c:'bolt'},{t:'todo-query',at:[0.50,0.52],c:'bolt'},{t:'quick-start',at:[0.405,0.499],c:'bolt'},{t:'full-start',at:[0.336,0.44],c:'bolt'},{t:'quick-stop',at:[0.31,0.36],c:'bolt'},{t:'close-session',at:[0.336,0.28],c:'bolt'},{t:'persona-cascade',at:[0.405,0.221],c:'bolt'}],
      nodes:vis({ disk:{op:1,pulse:true}, ghpages:{op:1,pulse:true}, me:{op:0.85},
        gmail:{op:0.7},todo:{op:0.7},issues:{op:0.7},drive:{op:0.7},www:{op:0.7},inbox:{op:0.9}, raw:{op:0.9},wiki:{op:0.9},
        dashboard:{op:0.85},writingtpl:{op:0.8},checkin:{op:0.85},home:{op:0.9},portfolio:{op:0.9},abouttpl:{op:0.8},tracker:{op:0.85},spirit:{op:0.85},
        ag1:{op:0.8},ag2:{op:0.8},ag3:{op:0.8},ag4:{op:0.8},ag5:{op:0.8},ag6:{op:0.8},ag7:{op:0.8},ag8:{op:0.8}, canon:{op:0.18},inventory:{op:0.18} }),
      lit:['disk>ghpages','me>ghpages','me>disk','inbox>disk','disk>raw','disk>wiki','gmail>inbox','todo>inbox','issues>inbox','drive>inbox','www>inbox'].concat(pageEdges()).concat(agEdges()) }
  ];

  const live={};
  let cur=null, curLit=new Set(), curNoflow=new Set();
  const NS='http://www.w3.org/2000/svg';

  function ensure(id){
    if(!live[id]){ const d=NODES[id]; live[id]={ id, x:d.x*W, y:d.y*H, tx:d.x*W, ty:d.y*H, r:1, opacity:0, color:null, kind:d.kind, label:d.label, el:null, popStart:null }; }
    return live[id];
  }

  function applyAnchors(ch, silent){
    const act=ch.nodes||{}; const now=performance.now(); let pops=0;
    for(const id in act){
      const d=NODES[id]; if(!d) continue;
      const o=act[id]||{}; const wasOff=(live[id] && live[id].opacity<0.02);
      const n=ensure(id);
      const bx=(o.x!=null?o.x:d.x), by=(o.y!=null?o.y:d.y);
      n.tx=bx*W; n.ty=by*H;
      if(n.opacity<0.02){ n.x=n.tx; n.y=n.ty; }
      n.targetOpacity=(o.op!=null?o.op:1);
      n.targetR=(o.r!=null?o.r:d.r);
      n.color=o.color||null;
      n.label=o.label||d.label;
      n.pulse=!!o.pulse;
      n.glow=o.glow||1;
      if(ch.pop && wasOff && !silent){ n.popStart=now + pops*90; n.r=0.5; pops++; }
    }
    for(const id in live){ if(!(id in act)) live[id].targetOpacity=0; }
  }

  function renderNodes(){
    for(const id in live){
      const n=live[id];
      if(!n.el){
        const g=document.createElementNS(NS,'g'); g.setAttribute('class','node node-'+n.kind);
        const halo=document.createElementNS(NS,'circle'); halo.setAttribute('class','halo'); g.appendChild(halo);
        const core=document.createElementNS(NS,'circle'); core.setAttribute('class','core'); g.appendChild(core);
        const lbl=document.createElementNS(NS,'text'); lbl.setAttribute('class','node-label'); lbl.setAttribute('text-anchor','middle'); lbl.textContent=n.label; g.appendChild(lbl);
        nodesG.appendChild(g); n.el=g; n.halo=halo; n.core=core; n.lbl=lbl;
      }
      const c=colorOf(n); const rr=Math.max(0.4,n.r); const isHub=(n.kind==='hub');
      n.core.setAttribute('cx',n.x); n.core.setAttribute('cy',n.y); n.core.setAttribute('r',rr);
      n.core.setAttribute('fill',c); n.core.setAttribute('fill-opacity',isHub?0.22:0.16); n.core.setAttribute('stroke',c); n.core.setAttribute('stroke-width',1.4);
      n.halo.setAttribute('cx',n.x); n.halo.setAttribute('cy',n.y); n.halo.setAttribute('r',rr*(isHub?1.35:1.9)*(n.glow>1?1.25:1));
      n.halo.setAttribute('fill',c); n.halo.setAttribute('fill-opacity',(isHub?0.05:0.12)*(n.glow||1)); n.halo.setAttribute('filter','url(#softGlow)');
      if(n.lbl.textContent!==n.label) n.lbl.textContent=n.label;
      n.el.classList.toggle('pulse',!!n.pulse);
      n.lbl.setAttribute('x',n.x); n.lbl.setAttribute('y',n.y+rr+15); n.lbl.setAttribute('fill',c);
      n.lbl.setAttribute('font-family', (n.kind==='source'||n.kind==='dead'||n.kind==='memory'||n.kind==='hub') ? 'var(--font-mono)' : 'var(--font-display)');
      n.lbl.setAttribute('font-size', isHub?13:11);
      n.el.setAttribute('opacity',n.opacity);
    }
  }

  function buildEdges(){
    for(const e of EDGES){
      const ln=document.createElementNS(NS,'line'); ln.setAttribute('stroke-width', 1.4);
      edgesG.appendChild(ln); e._el=ln;
    }
  }
  function styleEdges(){
    for(const e of EDGES){
      const isLit=curLit.has(e.key); const stat=curNoflow.has(e.key);
      e._litBase = isLit ? (0.32 + 0.5*e.w) : 0.09;
      e._el.setAttribute('stroke', isLit?CIRC[e.c]:DIM);
      e._el.setAttribute('stroke-width', isLit?(1.1+1.4*e.w):1);
      let da=null;
      if(e.style==='dotted') da='2 5'; else if(e.style==='broken') da='3 3 9 3';
      if(stat){ e._el.classList.remove('edge-flow'); da=null; }
      else if(isLit && !e.style){ da='5 7'; e._el.classList.add('edge-flow'); }
      else if(isLit && e.style==='broken'){ e._el.classList.add('edge-flow'); }
      else e._el.classList.remove('edge-flow');
      if(da) e._el.setAttribute('stroke-dasharray',da); else e._el.removeAttribute('stroke-dasharray');
    }
  }

  function firePulse(id){
    const n=live[id]; const cx=n?n.x:W/2, cy=n?n.y:H/2; const col=n?colorOf(n):'#c2ff3d';
    const ring=document.createElementNS(NS,'circle');
    ring.setAttribute('cx',cx); ring.setAttribute('cy',cy); ring.setAttribute('r',6);
    ring.setAttribute('fill','none'); ring.setAttribute('stroke',col); ring.setAttribute('stroke-width',2.4);
    const ar=document.createElementNS(NS,'animate'); ar.setAttribute('attributeName','r'); ar.setAttribute('from','6'); ar.setAttribute('to',Math.max(W,H)*0.6); ar.setAttribute('dur','1s'); ar.setAttribute('fill','freeze');
    const ao=document.createElementNS(NS,'animate'); ao.setAttribute('attributeName','stroke-opacity'); ao.setAttribute('from','0.6'); ao.setAttribute('to','0'); ao.setAttribute('dur','1s'); ao.setAttribute('fill','freeze');
    ring.appendChild(ar); ring.appendChild(ao); fxG.appendChild(ring);
    setTimeout(()=>{ if(ring.parentNode) ring.parentNode.removeChild(ring); }, 1100);
  }

  function updateLegend(ch){
    const sk=ch.skills||[];
    const at=ch.legendAt||[0.5,0.5];
    legendEl.style.left=(at[0]*100)+'%'; legendEl.style.top=(at[1]*100)+'%';
    if(!sk.length){ legendEl.innerHTML=''; legendEl.style.opacity=0; return; }
    legendEl.style.opacity=1;
    let chips=''; for(const s of sk){ const gh=/github|me/i.test(s)?' gh':''; chips+='<span class="chip'+gh+'">'+s+'</span>'; }
    legendEl.innerHTML='<span class="lead">skills, lit as lines</span><span class="chips">'+chips+'</span>';
  }

  function updateTags(ch){
    tagsEl.innerHTML='';
    for(const t of (ch.tags||[])){
      const d=document.createElement('div'); d.className='skill-tag '+(t.c||'green');
      d.textContent=t.t; d.style.left=(t.at[0]*100)+'%'; d.style.top=(t.at[1]*100)+'%';
      tagsEl.appendChild(d);
    }
  }
  function transitionTo(i){
    const ch=CH[i]; if(!ch) return; const prev=cur; cur=i;
    applyAnchors(ch,false); curLit=new Set(ch.lit||[]); curNoflow=new Set(ch.noflow||[]); styleEdges(); updateBadge(ch.label); updateLegend(ch); updateTags(ch);
    if(ch.pulse && prev!==i) firePulse(ch.pulse);
  }

  function lerp(a,b,t){ return a+(b-a)*t; }
  function tick(){
    const now=performance.now();
    for(const id in live){
      const n=live[id];
      n.x=lerp(n.x,n.tx,0.14); n.y=lerp(n.y,n.ty,0.14);
      if(n.popStart!=null && now<n.popStart){ n.opacity=0; n.r=0.5; continue; }
      if(n.targetOpacity!=null) n.opacity=lerp(n.opacity,n.targetOpacity,0.12);
      if(n.popStart!=null){
        const age=now-n.popStart;
        if(age<440){ const p=age/440; const s=(p<0.55)?(0.3+(1.3-0.3)*(p/0.55)):(1.3+(1-1.3)*((p-0.55)/0.45)); n.r=n.targetR*s; }
        else { n.r=lerp(n.r,n.targetR,0.2); n.popStart=null; }
      } else if(n.targetR!=null){ n.r=lerp(n.r,n.targetR,0.15); }
    }
    renderNodes();
    for(const e of EDGES){
      const a=live[e.a], b=live[e.b]; if(!a||!b){ continue; }
      const vmin=Math.min(a.opacity,b.opacity);
      if(vmin<0.02){ e._el.setAttribute('stroke-opacity',0); continue; }
      e._el.setAttribute('x1',a.x); e._el.setAttribute('y1',a.y); e._el.setAttribute('x2',b.x); e._el.setAttribute('y2',b.y);
      e._el.setAttribute('stroke-opacity', e._litBase*vmin);
    }
    requestAnimationFrame(tick);
  }

  const chapterLabelEl=document.getElementById('chapterLabel');
  const chapterDotsEl=document.getElementById('chapterDots');
  const prevBtn=document.getElementById('prevBtn');
  const nextBtn=document.getElementById('nextBtn');

  function updateBadge(label){
    const badge=document.querySelector('.chapter-badge');
    const isHero=CH[cur]&&CH[cur].hero;
    if(badge) badge.classList.toggle('is-hidden',!!isHero);
    chapterLabelEl.textContent=label||'00';
    for(const dn of chapterDotsEl.children) dn.classList.toggle('active',+dn.dataset.idx===cur);
    for(const p of document.querySelectorAll('.chapter')) p.classList.toggle('is-current',+p.dataset.idx===cur);
  }
  function buildDots(){
    chapterDotsEl.innerHTML='';
    for(let i=1;i<CH.length;i++){
      const dn=document.createElement('button'); dn.className='dot'; dn.dataset.idx=i;
      dn.setAttribute('aria-label','Chapter '+CH[i].label);
      dn.addEventListener('click',()=>goTo(i)); chapterDotsEl.appendChild(dn);
    }
  }
  function goTo(i){
    i=Math.max(0,Math.min(CH.length-1,i)); transitionTo(i);
    if(i===0){ const h=document.querySelector('.case-hero'); if(h) h.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    const p=document.querySelector('.chapter[data-idx="'+i+'"]'); if(p) p.scrollIntoView({behavior:'smooth',block:'center'});
  }
  prevBtn.addEventListener('click',()=>goTo((cur||0)-1));
  nextBtn.addEventListener('click',()=>goTo((cur||0)+1));
  document.addEventListener('keydown',(e)=>{
    if(e.key==='ArrowRight'||e.key===' '){ e.preventDefault(); goTo((cur||0)+1); }
    if(e.key==='ArrowLeft'){ e.preventDefault(); goTo((cur||0)-1); }
  });

  const obs=new IntersectionObserver((entries)=>{
    let best=null;
    for(const e of entries){ if(!e.isIntersecting) continue; if(!best||e.intersectionRatio>best.intersectionRatio) best=e; }
    if(best){ const idx=+best.target.dataset.idx; if(idx!==cur) transitionTo(idx); }
  },{ threshold:[0.5,0.75], rootMargin:'-20% 0px -30% 0px' });
  document.querySelectorAll('.chapter').forEach(c=>obs.observe(c));

  const heroEl=document.querySelector('.case-hero');
  if(heroEl){
    const ho=new IntersectionObserver((entries)=>{ for(const e of entries){ if(e.isIntersecting&&e.intersectionRatio>0.3){ if(cur!==0) transitionTo(0); } } },{ threshold:[0.3,0.6], rootMargin:'0px 0px -30% 0px' });
    ho.observe(heroEl);
  }

  let booted=false;
  function boot(){ if(booted) return; booted=true; for(const id in NODES) ensure(id); buildEdges(); resize(); transitionTo(0); buildDots(); tick(); }
  if(document.readyState!=='loading') boot();
  else window.addEventListener('DOMContentLoaded',boot);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) boot(); });
  window.addEventListener('load',boot);
})();
