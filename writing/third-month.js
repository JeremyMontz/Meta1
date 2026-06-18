/* ============================================================
 * THIRD MONTH — Case study graph engine
 * Opens on the Month 2 end-state, then each chapter sprouts a branch
 * of the real site nav tree (treasury, heart loop, about+ChatGPT,
 * My AI -> organs, writing -> articles, Fable, CI). Guests + CI appear
 * only on their own chapter. viewBox eases/zooms per chapter.
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

  const COLOR={ hub:'#f5c56a', human:'#f5c56a', book:'#9bff7d', pagedot:'#8fe6a8',
    memory:'#8dd9ff', organ:'#b07cff', page:'#b57bff', about:'#b57bff', month:'#d1b4ff',
    article:'#c2a5ff', agent:'#b57bff', guest:'#7dffd4', tool:'#c2ff3d', myai:'#b07cff' };
  const CIRC={ spine:'#f5c56a', github:'#f5c56a', invoke:'#f5c56a', flow:'#9bff7d',
    memory:'#8dd9ff', publish:'#b57bff', organ:'#b07cff', month:'#d1b4ff',
    guest:'#7dffd4', review:'#c2ff3d', gate:'#c2ff3d', loop:'#ff8da3', myai:'#b07cff' };
  const DIM='#403c50';

  // Home positions = the balanced full constellation (hero + ch7 bookends).
  const NODES={
    me:{label:'me', kind:'human', r:18, x:0.49, y:0.35},
    disk:{label:'Disk', kind:'hub', r:21, x:0.30, y:0.46},
    ci:{label:'CI', kind:'tool', r:11, x:0.50, y:0.42},
    ghpages:{label:'GitHub Pages', kind:'hub', r:21, x:0.66, y:0.45},
    treasury:{label:'Treasury', kind:'book', r:19, x:0.10, y:0.12},
    wiki:{label:'Wiki/', kind:'memory', r:13, x:0.23, y:0.27},
    raw:{label:'Raw/', kind:'memory', r:12, x:0.16, y:0.37},
    inbox:{label:'Inbox/', kind:'memory', r:11, x:0.33, y:0.24},
    dashboard:{label:'dashboard', kind:'page', r:10, x:0.74, y:0.15},
    checkin:{label:'check in', kind:'page', r:9, x:0.85, y:0.14},
    home:{label:'home', kind:'page', r:11, x:0.93, y:0.22},
    portfolio:{label:'portfolio', kind:'page', r:11, x:0.95, y:0.33},
    tracker:{label:'house tracker', kind:'page', r:9, x:0.94, y:0.44},
    about:{label:'about/', kind:'page', r:11, x:0.84, y:0.54, parent:'ghpages'},
    abAI:{label:'The AI', kind:'about', r:10, x:0.95, y:0.50, parent:'about'},
    abHuman:{label:'The Human', kind:'about', r:10, x:0.93, y:0.62, parent:'about'},
    abHist:{label:'Our History', kind:'about', r:10, x:0.84, y:0.65, parent:'about'},
    m1:{label:'month 1', kind:'month', r:7, x:0.75, y:0.71, parent:'abHist'},
    m2:{label:'month 2', kind:'month', r:7, x:0.82, y:0.74, parent:'abHist'},
    m3:{label:'month 3', kind:'month', r:7, x:0.89, y:0.72, parent:'abHist'},
    writing:{label:'writing/', kind:'page', r:12, x:0.78, y:0.62, parent:'ghpages'},
    myai:{label:'My AI', kind:'myai', r:13, x:0.52, y:0.56, parent:'ghpages'},
    heart:{label:'heart', kind:'organ', r:11, x:0.58, y:0.54, parent:'myai'},
    memory:{label:'memory', kind:'organ', r:10, x:0.62, y:0.66, parent:'myai'},
    body:{label:'body', kind:'organ', r:10, x:0.62, y:0.78, parent:'myai'},
    brain:{label:'brain', kind:'organ', r:11, x:0.54, y:0.82, parent:'myai'},
    faces:{label:'faces', kind:'organ', r:10, x:0.46, y:0.78, parent:'myai'},
    spirit:{label:'spirit', kind:'organ', r:10, x:0.42, y:0.58, parent:'myai'},
    stomach:{label:'stomach', kind:'organ', r:9, x:0.40, y:0.68, parent:'myai'},
    hands:{label:'hands', kind:'organ', r:9, x:0.50, y:0.88, parent:'myai'},
    ag1:{label:'Meta1', kind:'agent', r:9, x:0.14, y:0.54},
    ag6:{label:'Assessor', kind:'agent', r:9, x:0.20, y:0.62},
    ag2:{label:'Bond', kind:'agent', r:9, x:0.09, y:0.64},
    ag7:{label:'Phil', kind:'agent', r:9, x:0.27, y:0.62},
    ag3:{label:'House', kind:'agent', r:9, x:0.13, y:0.74},
    ag4:{label:'Freedom', kind:'agent', r:9, x:0.21, y:0.82},
    ag5:{label:'Evolve', kind:'agent', r:9, x:0.33, y:0.80},
    ag8:{label:'Jeremy', kind:'agent', r:9, x:0.36, y:0.66},
    journal:{label:'journal', kind:'page', r:9, x:0.27, y:0.80, parent:'ag7'},
    chatgpt:{label:'ChatGPT', kind:'guest', r:10, x:0.985, y:0.55},
    fable:{label:'Fable 5', kind:'guest', r:13, x:0.50, y:0.50}
  };

  // Treasury particle cloud — dense, organic (golden-angle spiral), relative to treasury.
  const PDS=[]; const PDN=270;
  for(var i=0;i<PDN;i++){ var ang=i*2.3999632; var rad=0.010+0.22*Math.sqrt((i+0.5)/PDN);
    var rel=[Math.cos(ang)*rad*0.82, Math.sin(ang)*rad];
    NODES['pd'+i]={label:'', kind:'pagedot', r:1.2+(i%3), relTo:'treasury', rel:rel, x:0.12+rel[0], y:0.13+rel[1]};
    PDS.push('pd'+i);
  }

  // A dozen field-note articles, organic scatter relative to writing/ (lower hemisphere).
  const ARTS=[]; const ARN=12;
  for(var j=0;j<ARN;j++){ var aa=0.55+j*2.3999632; var ar=0.07+0.15*Math.sqrt((j+0.5)/ARN);
    var arel=[Math.cos(aa)*ar*0.95, Math.abs(Math.sin(aa))*ar*0.85+0.13];
    NODES['art'+(j+1)]={label:'a'+(j+1), kind:'article', r:6, relTo:'writing', parent:'writing', rel:arel, x:0.76+arel[0], y:0.69+arel[1]};
    ARTS.push('art'+(j+1));
  }

  function colorOf(n){ return n.color || COLOR[n.kind] || '#b57bff'; }

  const ORGANS=['spirit','faces','brain','body','memory','heart','stomach','hands'];
  const ABOUT=['abHuman','abAI','abHist'];
  const MONTHS=['m1','m2','m3'];
  const AG=['ag1','ag2','ag3','ag4','ag5','ag6','ag7','ag8'];

  const E=function(a,b,c,w,style){ return {a:a,b:b,c:c,w:(w!=null?w:1),style:style,key:a+'>'+b}; };
  const EDGES=[
    E('disk','ghpages','spine',1),
    E('me','ghpages','github',1),
    E('me','disk','invoke',0.7),
    E('me','ci','invoke',0.9),
    E('disk','ci','invoke',0.9),
    E('me','fable','review',0.9),
    E('treasury','wiki','flow',1),
    E('treasury','disk','memory',0.6),
    E('disk','wiki','memory',1),
    E('disk','raw','memory',1),
    E('inbox','disk','memory',1),
    E('wiki','ag7','flow',0.7),
    E('ag7','heart','organ',0.9),
    E('heart','journal','organ',0.9),
    E('journal','ag7','loop',0.9),
    E('fable','ghpages','review',0.8),
    E('fable','writing','review',0.6),
    E('fable','portfolio','review',0.6),
    E('fable','home','review',0.6),
    E('fable','about','review',0.6),
    E('ci','ghpages','gate',1)
  ];
  ['dashboard','checkin','home','portfolio','tracker'].forEach(function(p){ EDGES.push(E(p,'ghpages','publish',0.9)); });
  for(const id in NODES){ const n=NODES[id]; if(!n.parent) continue;
    const c=(n.kind==='organ')?'organ':(n.kind==='month')?'month':(n.kind==='myai')?'myai':'publish';
    const w=(n.kind==='article'||n.kind==='month')?0.4:(n.kind==='organ'?0.8:0.9);
    EDGES.push(E(id,n.parent,c,w));
  }
  const AGW={ag1:[0.9,0.5],ag2:[0.45,0.8],ag3:[0.7,0.35],ag4:[0.5,0.85],ag5:[0.8,0.45],ag6:[0.5,0.75],ag7:[0.6,0.8],ag8:[0.4,0.6]};
  AG.forEach(function(a){ EDGES.push(E('disk',a,'publish',AGW[a][0])); EDGES.push(E('ghpages',a,'publish',AGW[a][1])); });

  function childEdges(ids){ return ids.map(function(id){ return id+'>'+NODES[id].parent; }); }
  function agEdges(){ const o=[]; AG.forEach(function(a){ o.push('disk>'+a); o.push('ghpages>'+a); }); return o; }
  const FAN_LIT=['dashboard>ghpages','checkin>ghpages','home>ghpages','portfolio>ghpages','tracker>ghpages','writing>ghpages','about>ghpages','myai>ghpages'];
  const BASE_LIT=['disk>ghpages','me>ghpages','me>disk','disk>wiki','disk>raw','inbox>disk'].concat(FAN_LIT).concat(agEdges()).concat(['journal>ag7']);
  // ch7 routes me + disk through CI instead of straight to Pages
  const BASE7=BASE_LIT.filter(function(k){ return k!=='disk>ghpages' && k!=='me>ghpages'; });

  const HUBS={ disk:{op:1}, ghpages:{op:1} };
  function vis(extra){ return Object.assign({}, HUBS, extra); }
  function grp(ids,op,extra){ const o={}; ids.forEach(function(id){ o[id]=Object.assign({op:op},extra||{}); }); return o; }
  function artFull(){ const o={}; ARTS.forEach(function(id,k){ o[id]={op:1,label:'article '+(k+1)}; }); return o; }

  function m2base(extra){
    return Object.assign({ me:{op:0.85}, disk:{op:1}, ghpages:{op:1},
      wiki:{op:0.9}, raw:{op:0.8}, inbox:{op:0.8},
      dashboard:{op:0.8}, checkin:{op:0.75}, home:{op:0.85}, portfolio:{op:0.8},
      writing:{op:0.85}, about:{op:0.85}, myai:{op:0.75}, tracker:{op:0.75}, journal:{op:0.7} },
      grp(AG,0.75), extra||{});
  }

  const CH=[
    // 0 · hero — Month 2 end-state; new branches only hinted
    { label:'', hero:true, skills:['where month two left us'], legendAt:[0.5,0.5], view:[0.02,0.0,0.96,1.0],
      nodes:m2base({ journal:{op:0} }),
      lit:BASE_LIT, noflow:BASE_LIT },

    // 1 · Treasury EXPLODES — big green library, dense particle burst
    { label:'01', skills:['1100+ pages','1000s of quotes','100s of voices'], legendAt:[0.30,0.70], pulse:'treasury', pop:true, popStagger:6,
      view:[0.03,0.05,0.76,0.78],
      nodes:Object.assign({ treasury:{op:1,x:0.30,y:0.40,r:34,glow:3.4,pulse:true,color:'#9bff7d'},
        wiki:{op:1,x:0.63,y:0.40,glow:1.6} }, grp(PDS,0.6)),
      lit:['treasury>wiki'], noflow:[] },

    // 2 · Heart & Journal — the daily loop: treasury -> wiki -> Phil -> heart -> journal -> Phil
    { label:'02', skills:['lectio - scheduled automation'], legendAt:[0.64,0.40], pulse:'heart',
      view:[0.04,0.08,0.80,0.86], edgeColor:{organ:'#ff8da3'},
      nodes:Object.assign({ treasury:{op:0.9,x:0.15,y:0.18,r:18}, wiki:{op:1,x:0.32,y:0.32},
        ag7:{op:1,x:0.50,y:0.46}, heart:{op:1,x:0.66,y:0.60,glow:3,pulse:true,color:'#ff8da3'}, journal:{op:1,x:0.50,y:0.78} },
        grp(PDS.slice(0,90),0.4)),
      lit:['treasury>wiki','wiki>ag7','ag7>heart','heart>journal','journal>ag7'],
      noflow:['treasury>wiki'] },

    // 3 · About exists; ChatGPT stands over it (no edge), with its thumbnail. No subnodes yet.
    { label:'03', skills:['Guest artist.'], legendAt:[0.66,0.22], pulse:'chatgpt',
      view:[0.26,0.20,0.50,0.58],
      nodes:{ ghpages:{op:1,x:0.40,y:0.48}, about:{op:1,x:0.60,y:0.66,glow:1.6,label:'about'}, chatgpt:{op:1,x:0.56,y:0.32,glow:2.8,pulse:true} },
      lit:['about>ghpages'], noflow:['about>ghpages'] },

    // 4 · The organs sprout from the "My AI" stand-in (nav -> Faces)
    { label:'04', skills:[], legendAt:[0.5,0.5], pulse:'myai', pop:true, popStagger:120,
      view:[0.16,0.14,0.70,0.78], edgeColor:{organ:'#ff8da3', myai:'#ff8da3'},
      nodes:{ ghpages:{op:0.5,x:0.28,y:0.22}, myai:{op:1,x:0.50,y:0.42,glow:2.6,pulse:true,color:'#ff8da3'},
        spirit:{op:1,x:0.33,y:0.54,color:'#ff8da3'}, stomach:{op:1,x:0.40,y:0.70,color:'#ff8da3'}, brain:{op:1,x:0.52,y:0.78,color:'#ff8da3'}, body:{op:1,x:0.64,y:0.72,color:'#ff8da3'},
        memory:{op:1,x:0.68,y:0.55,color:'#ff8da3'}, heart:{op:1,x:0.60,y:0.40,color:'#ff8da3'}, faces:{op:1,x:0.33,y:0.40,color:'#ff8da3'}, hands:{op:1,x:0.44,y:0.80,color:'#ff8da3'} },
      lit:['myai>ghpages'].concat(childEdges(ORGANS)),
      noflow:['myai>ghpages'].concat(childEdges(ORGANS)) },

    // 5 · About splits into three (+ months); writing explodes into a dozen. All static — the pop IS the animation.
    { label:'05', skills:[], pulse:'writing', pop:true, popStagger:90, waveGap:950, popWaves:[ABOUT, MONTHS, ARTS],
      view:[0.08,0.02,0.86,0.96],
      nodes:Object.assign({ ghpages:{op:1,x:0.52,y:0.14},
        about:{op:1,x:0.30,y:0.38,glow:1.6},
        abHuman:{op:1,x:0.20,y:0.50,r:10}, abHist:{op:1,x:0.32,y:0.52,r:10}, abAI:{op:1,x:0.44,y:0.50,r:10},
        m1:{op:1,x:0.22,y:0.66}, m2:{op:1,x:0.32,y:0.68}, m3:{op:1,x:0.42,y:0.66},
        writing:{op:1,x:0.68,y:0.46,glow:2.2} }, artFull()),
      lit:['about>ghpages','writing>ghpages','abHuman>about','abHist>about','abAI>about'].concat(childEdges(MONTHS)).concat(childEdges(ARTS)),
      noflow:['about>ghpages','writing>ghpages','abHuman>about','abHist>about','abAI>about'].concat(childEdges(MONTHS)).concat(childEdges(ARTS)) },

    // 6 · Fable reads everything: me -> Fable -> GitHub Pages (animated), all pages shown faint
    { label:'06', skills:['code review','SEO + mobile'], legendAt:[0.50,0.24], pulse:'fable',
      view:[0.08,0.06,0.86,0.88],
      nodes:Object.assign({ me:{op:1}, fable:{op:1,x:0.55,y:0.52,glow:3,pulse:true}, ghpages:{op:1}, disk:{op:0.4,color:'#6f6c82'} },
        grp(['home','portfolio','writing','about','dashboard','checkin','tracker','myai'],0.5,{color:'#6f6c82'}), grp(ORGANS,0.44,{color:'#6f6c82'}), grp(ABOUT,0.46,{color:'#6f6c82'}), grp(ARTS,0.42,{color:'#6f6c82'}), grp(AG,0.46,{color:'#6f6c82'}), grp(MONTHS,0.4,{color:'#6f6c82'})),
      lit:['me>fable','fable>ghpages'], noflow:[] },

    // 7 · CI gate sits ahead of GitHub Pages; me + disk feed CI, CI -> green -> Pages. Rest static.
    { label:'07', skills:['CI · link-check · data-shape · codespell'], legendAt:[0.50,0.28], pulse:'ci',
      view:[0.0,0.0,1.0,1.0],
      tags:[{t:'tests pass', at:[0.60,0.40], c:'green'}], edgeColor:{loop:'#b07cff'},
      nodes:Object.assign(m2base({ ci:{op:1,x:0.55,y:0.41,r:14,glow:4.2,pulse:true}, ag2:{op:1,glow:1.8,color:'#ff4757'}, treasury:{op:0.7}, myai:{op:0.85} }),
        grp(ORGANS,0.78), grp(ABOUT,0.78), grp(MONTHS,0.66), grp(ARTS,0.6,{color:'#b07cff'}), grp(PDS,0.32)),
      lit:['me>ci','disk>ci','ci>ghpages'].concat(BASE7).concat(['treasury>wiki','myai>ghpages']).concat(childEdges(ORGANS)).concat(childEdges(ABOUT)).concat(childEdges(MONTHS)).concat(childEdges(ARTS)),
      noflow:BASE7.concat(['treasury>wiki','myai>ghpages']).concat(childEdges(ORGANS)).concat(childEdges(ABOUT)).concat(childEdges(MONTHS)).concat(childEdges(ARTS)) }
  ];

  const live={};
  let cur=null, curLit=new Set(), curNoflow=new Set(), curEdgeColor=null, thumbStart=0;
  const NS='http://www.w3.org/2000/svg';

  let view={x:0.02,y:0,w:0.96,h:1}, viewT={x:0.02,y:0,w:0.96,h:1};
  function setViewTarget(ch){ const v=ch.view||[0,0,1,1]; viewT={x:v[0],y:v[1],w:v[2],h:v[3]}; }
  function applyViewBox(){ svg.setAttribute('viewBox', (view.x*W)+' '+(view.y*H)+' '+(view.w*W)+' '+(view.h*H)); }

  function resize(){ W=wrap.clientWidth; H=wrap.clientHeight; applyViewBox(); if(cur!=null) applyAnchors(CH[cur],true); }
  window.addEventListener('resize', resize);

  function ensure(id){
    if(!live[id]){ const d=NODES[id]; live[id]={ id:id, x:d.x*W, y:d.y*H, tx:d.x*W, ty:d.y*H, r:1, opacity:0, color:null, kind:d.kind, label:d.label, el:null, popStart:null }; }
    return live[id];
  }

  function waveOf(ch,id){ if(!ch.popWaves) return -1; for(var wi=0;wi<ch.popWaves.length;wi++){ var k=ch.popWaves[wi].indexOf(id); if(k>=0) return wi*1000+k; } return -1; }
  function applyAnchors(ch, silent){
    const act=ch.nodes||{}; const now=performance.now(); let pops=0;
    const stagger=ch.popStagger||70;
    for(const id in act){
      const d=NODES[id]; if(!d) continue;
      const o=act[id]||{}; const wasOff=(live[id] && live[id].opacity<0.02);
      const n=ensure(id);
      let bx, by;
      if(d.relTo){ // particle clouds (page-dots, articles) ride their parent
        const pa=act[d.relTo]||{}; const px=(pa.x!=null?pa.x:NODES[d.relTo].x), py=(pa.y!=null?pa.y:NODES[d.relTo].y);
        bx=px+d.rel[0]; by=py+d.rel[1];
      } else { bx=(o.x!=null?o.x:d.x); by=(o.y!=null?o.y:d.y); }
      n.tx=bx*W; n.ty=by*H;
      if(n.opacity<0.02){
        const origin=(d.relTo||d.parent); // EXPLODE: appear AT the parent's target spot, then fly out
        if(ch.pop && origin && live[origin]){ n.x=live[origin].tx; n.y=live[origin].ty; }
        else { n.x=n.tx; n.y=n.ty; }
      }
      n.targetOpacity=(o.op!=null?o.op:1);
      n.targetR=(o.r!=null?o.r:d.r);
      n.color=o.color||null; n.label=o.label||d.label;
      n.pulse=!!o.pulse; n.glow=o.glow||1;
      if(ch.pop && wasOff && !silent){
        var wv=waveOf(ch,id);
        var delay = (wv<0) ? (pops++*stagger) : ((Math.floor(wv/1000)+1)*(ch.waveGap||800) + (wv%1000)*stagger);
        n.popStart=now + delay; n.r=0.5;
      }
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
      const c=colorOf(n); const rr=Math.max(0.4,n.r);
      const isHub=(n.kind==='hub'||n.kind==='human'), isBook=(n.kind==='book');
      n.core.setAttribute('cx',n.x); n.core.setAttribute('cy',n.y); n.core.setAttribute('r',rr);
      n.core.setAttribute('fill',c); n.core.setAttribute('fill-opacity',isBook?0.30:(isHub?0.22:0.16)); n.core.setAttribute('stroke',c); n.core.setAttribute('stroke-width',isBook?2:1.4);
      n.halo.setAttribute('cx',n.x); n.halo.setAttribute('cy',n.y); n.halo.setAttribute('r',rr*(isHub?1.35:1.9)*(n.glow>1?1.25:1));
      n.halo.setAttribute('fill',c); n.halo.setAttribute('fill-opacity',(isHub?0.05:0.12)*(n.glow||1)); n.halo.setAttribute('filter','url(#softGlow)');
      if(n.lbl.textContent!==n.label) n.lbl.textContent=n.label;
      n.el.classList.toggle('pulse',!!n.pulse);
      n.lbl.setAttribute('x',n.x); n.lbl.setAttribute('y',n.y+rr+14); n.lbl.setAttribute('fill',c);
      n.lbl.setAttribute('font-family', (n.kind==='organ'||n.kind==='page'||n.kind==='about'||n.kind==='agent'||n.kind==='myai') ? 'var(--font-display)' : 'var(--font-mono)');
      n.lbl.setAttribute('font-size', isHub?13:11);
      n.el.setAttribute('opacity',n.opacity);
    }
  }

  function buildEdges(){
    for(const e of EDGES){
      const ln=document.createElementNS(NS,'line'); ln.setAttribute('stroke-width',1.4);
      edgesG.appendChild(ln); e._el=ln;
    }
  }
  function styleEdges(){
    for(const e of EDGES){
      const isLit=curLit.has(e.key); const stat=curNoflow.has(e.key);
      e._litBase = isLit ? (0.30 + 0.5*e.w) : 0.07;
      e._el.setAttribute('stroke', isLit?((curEdgeColor&&curEdgeColor[e.c])||CIRC[e.c]):DIM);
      e._el.setAttribute('stroke-width', isLit?(1.0+1.4*e.w):1);
      let da=null;
      if(stat){ e._el.classList.remove('edge-flow'); da=null; }
      else if(isLit){ da='5 7'; e._el.classList.add('edge-flow'); }
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
    setTimeout(function(){ if(ring.parentNode) ring.parentNode.removeChild(ring); }, 1100);
  }

  function updateLegend(ch){
    const sk=ch.skills||[]; const at=ch.legendAt||[0.5,0.5];
    legendEl.style.left=(at[0]*100)+'%'; legendEl.style.top=(at[1]*100)+'%';
    if(!sk.length){ legendEl.innerHTML=''; legendEl.style.opacity=0; return; }
    legendEl.style.opacity=1;
    let chips=''; for(const s of sk){ chips+='<span class="chip">'+s+'</span>'; }
    legendEl.innerHTML='<span class="chips">'+chips+'</span>';
  }
  function updateTags(ch){
    tagsEl.innerHTML='';
    (ch.tags||[]).forEach(function(t){
      const d=document.createElement('div'); d.className='skill-tag '+(t.c||'green');
      d.textContent=t.t; d.style.left=(t.at[0]*100)+'%'; d.style.top=(t.at[1]*100)+'%';
      tagsEl.appendChild(d);
    });
  }

  function transitionTo(i){
    const ch=CH[i]; if(!ch) return; const prev=cur; cur=i;
    applyAnchors(ch,false); setViewTarget(ch);
    curLit=new Set(ch.lit||[]); curNoflow=new Set(ch.noflow||[]); curEdgeColor=ch.edgeColor||null; styleEdges();
    if(i===3) thumbStart=performance.now();
    updateBadge(ch.label); updateLegend(ch); updateTags(ch);
    const thumb=document.getElementById('cmzThumb'); if(thumb) thumb.classList.toggle('show', i===3);
    if(ch.pulse && prev!==i) firePulse(ch.pulse);
  }

  function lerp(a,b,t){ return a+(b-a)*t; }
  function tick(){
    const now=performance.now();
    view.x=lerp(view.x,viewT.x,0.07); view.y=lerp(view.y,viewT.y,0.07);
    view.w=lerp(view.w,viewT.w,0.07); view.h=lerp(view.h,viewT.h,0.07);
    applyViewBox();
    for(const id in live){
      const n=live[id];
      n.x=lerp(n.x,n.tx,0.14); n.y=lerp(n.y,n.ty,0.14);
      if(n.popStart!=null && now<n.popStart){ n.opacity=0; n.r=0.5; continue; }
      if(n.targetOpacity!=null) n.opacity=lerp(n.opacity,n.targetOpacity,0.12);
      if(n.popStart!=null){
        const age=now-n.popStart;
        if(age<600){ const p=age/600; const ss=(p<0.5)?(0.2+(1.6-0.2)*(p/0.5)):(1.6+(1-1.6)*((p-0.5)/0.5)); n.r=n.targetR*ss; }
        else { n.r=lerp(n.r,n.targetR,0.2); n.popStart=null; }
      } else if(n.targetR!=null){ n.r=lerp(n.r,n.targetR,0.15); }
    }
    renderNodes();
    if(cur===3 && live.chatgpt && live.about){ const th=document.getElementById('cmzThumb');
      if(th){ const p=Math.min(1,(now-thumbStart)/2600); const e3=1-Math.pow(1-p,3); const t=0.10+0.74*e3; // descend once (slow), then hold near about
        const mx=live.chatgpt.x+(live.about.x-live.chatgpt.x)*t, my=live.chatgpt.y+(live.about.y-live.chatgpt.y)*t;
        th.style.left=(((mx-view.x*W)/(view.w*W))*100)+'%'; th.style.top=(((my-view.y*H)/(view.h*H))*100)+'%'; } }
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
    document.querySelectorAll('.chapter').forEach(function(p){ p.classList.toggle('is-current',+p.dataset.idx===cur); });
  }
  function buildDots(){
    chapterDotsEl.innerHTML='';
    for(let i=1;i<CH.length;i++){
      const dn=document.createElement('button'); dn.className='dot'; dn.dataset.idx=i;
      dn.setAttribute('aria-label','Chapter '+CH[i].label);
      (function(k){ dn.addEventListener('click',function(){ goTo(k); }); })(i);
      chapterDotsEl.appendChild(dn);
    }
  }
  function goTo(i){
    i=Math.max(0,Math.min(CH.length-1,i)); transitionTo(i);
    if(i===0){ const h=document.querySelector('.case-hero'); if(h) h.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    const p=document.querySelector('.chapter[data-idx="'+i+'"]'); if(p) p.scrollIntoView({behavior:'smooth',block:'center'});
  }
  prevBtn.addEventListener('click',function(){ goTo((cur||0)-1); });
  nextBtn.addEventListener('click',function(){ goTo((cur||0)+1); });
  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'||e.key===' '){ e.preventDefault(); goTo((cur||0)+1); }
    if(e.key==='ArrowLeft'){ e.preventDefault(); goTo((cur||0)-1); }
  });

  const obs=new IntersectionObserver(function(entries){
    let best=null;
    entries.forEach(function(en){ if(!en.isIntersecting) return; if(!best||en.intersectionRatio>best.intersectionRatio) best=en; });
    if(best){ const idx=+best.target.dataset.idx; if(idx!==cur) transitionTo(idx); }
  },{ threshold:[0.5,0.75], rootMargin:'-20% 0px -30% 0px' });
  document.querySelectorAll('.chapter').forEach(function(c){ obs.observe(c); });

  const heroEl=document.querySelector('.case-hero');
  if(heroEl){
    const ho=new IntersectionObserver(function(entries){ entries.forEach(function(en){ if(en.isIntersecting&&en.intersectionRatio>0.3){ if(cur!==0) transitionTo(0); } }); },{ threshold:[0.3,0.6], rootMargin:'0px 0px -30% 0px' });
    ho.observe(heroEl);
  }

  let booted=false;
  function boot(){ if(booted) return; booted=true; for(const id in NODES) ensure(id); buildEdges(); resize(); transitionTo(0); buildDots(); tick(); }
  if(document.readyState!=='loading') boot();
  else window.addEventListener('DOMContentLoaded',boot);
  document.addEventListener('visibilitychange',function(){ if(!document.hidden) boot(); });
  window.addEventListener('load',boot);
})();
