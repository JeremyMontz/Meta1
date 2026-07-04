/* ════════════════════════════════════════════════════════════════════
   components/trailer.js — Claudemonzter cinematic trailer  (#382)
   Spec: projects/meta1/meta1/design/trailer.md v0.2

   Self-contained overlay module. Injects its own styles + DOM, plays a
   ~50s pure-code timeline (SVG scenes + canvas effects + WebAudio),
   then removes itself entirely — the homepage beneath is untouched.

   First visit per session: poster/play gate. After skip or completion
   (sessionStorage "cmz_trailer_seen") only a small replay chip mounts.
   Vanilla JS, no dependencies. Remove the one <script> tag in
   index.html to remove the feature completely.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SEEN_KEY = 'cmz_trailer_seen';
  var DUR = 50;                       // master duration, seconds
  var REDUCED = false;
  try {
    REDUCED = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* default: full motion */ }

  var MOBILE = false;
  try { MOBILE = Math.min(window.innerWidth, window.innerHeight) < 560; }
  catch (e) { /* default desktop budget */ }

  /* ── Timeline (design targets, trailer.md §4) ──────────────────── */
  var TL = {
    titleIn: [0, 3],
    ext:     [3, 12],       // Scene 1a — castle exterior
    lab:     [12, 19],      // Scene 1b — into the lab
    strike:  [19, 20],
    neon:    [20, 33],      // Scene 2 — reveal (20–27 monster, 27–33 scientist)
    white:   [33, 34],
    lecture: [34, 45],      // Scene 3 — the lecture
    wink:    [45, 47],
    exit:    [47, 50]
  };
  var CARDS = [
    { t: 7,  out: 12, cls: 'c1', text: 'Every experiment starts with an idea.' },
    { t: 27, out: 32, cls: 'c2', text: 'But this creature had ideas of its own!' },
    { t: 40, out: 46.5, cls: 'c3', text: 'Claudemonzter — a multi-agent AI lab, evolving in public.' }
  ];

  /* ── tiny math helpers ─────────────────────────────────────────── */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  // progress 0→1 through [a,b]
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ══════════════════════════════════════════════════════════════ */
  /* STYLES                                                          */
  /* ══════════════════════════════════════════════════════════════ */
  var CSS = [
    '.cmz-tr{position:fixed;inset:0;z-index:99990;background:#040309;overflow:hidden;',
    ' font-family:var(--font-sans,system-ui,sans-serif);}',
    '.cmz-tr,.cmz-tr *{box-sizing:border-box;margin:0;}',
    '.cmz-tr-shake{position:absolute;inset:0;}',
    '.cmz-tr-scene{position:absolute;inset:0;display:none;}',
    '.cmz-tr-scene.on{display:block;}',
    '.cmz-tr-scene svg{width:100%;height:100%;display:block;}',
    '.cmz-tr-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}',
    '.cmz-tr-vig{position:absolute;inset:0;pointer-events:none;',
    ' background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(0,0,0,.75) 100%);}',
    '.cmz-tr-white{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;}',

    /* wordmark — glitch green → clean sans crossfade */
    '.cmz-tr-wm{position:absolute;top:22px;left:26px;pointer-events:none;line-height:1;}',
    '.cmz-tr-wm span{position:absolute;top:0;left:0;white-space:nowrap;',
    ' font-size:clamp(13px,1.6vw,19px);letter-spacing:.28em;}',
    '.cmz-tr-wm .glitch{font-family:var(--font-mono,ui-monospace,monospace);',
    ' color:var(--bolt,#c2ff3d);text-shadow:0 0 8px rgba(194,255,61,.8),2px 0 0 rgba(255,110,199,.5),-2px 0 0 rgba(141,217,255,.5);}',
    '.cmz-tr-wm .clean{font-family:var(--font-sans,system-ui,sans-serif);',
    ' color:#201e29;font-weight:700;letter-spacing:.22em;opacity:0;text-shadow:none;}',

    /* typography cards */
    '.cmz-tr-card{position:absolute;left:50%;bottom:16%;transform:translateX(-50%);',
    ' max-width:min(80vw,760px);text-align:center;opacity:0;pointer-events:none;',
    ' transition:opacity .9s ease;}',
    '.cmz-tr-card.show{opacity:1;}',
    '.cmz-tr-card.c1{font-family:var(--font-mono,ui-monospace,monospace);color:#d8d6e0;',
    ' font-size:clamp(16px,2.4vw,28px);letter-spacing:.12em;text-shadow:0 2px 14px #000;}',
    '.cmz-tr-card.c2{font-family:var(--font-sans,system-ui,sans-serif);color:#ff6ec7;',
    ' font-weight:800;font-style:italic;font-size:clamp(20px,3.2vw,40px);',
    ' text-shadow:0 0 18px rgba(255,110,199,.75),2px 0 0 rgba(141,217,255,.6);}',
    '.cmz-tr-card.c3{font-family:var(--font-sans,system-ui,sans-serif);color:#32303f;',
    ' font-weight:600;font-size:clamp(17px,2.4vw,30px);letter-spacing:.02em;text-shadow:none;}',

    /* controls */
    '.cmz-tr-btn{cursor:pointer;border:1px solid rgba(216,214,224,.45);color:#d8d6e0;',
    ' background:rgba(4,3,9,.55);font-family:var(--font-mono,ui-monospace,monospace);',
    ' font-size:13px;letter-spacing:.14em;padding:8px 14px;border-radius:6px;}',
    '.cmz-tr-btn:hover{border-color:var(--bolt,#c2ff3d);color:var(--bolt,#c2ff3d);}',
    '.cmz-tr-btn:focus-visible{outline:2px solid var(--bolt,#c2ff3d);outline-offset:2px;}',
    '.cmz-tr-skip{position:absolute;top:20px;right:24px;z-index:6;}',
    '.cmz-tr-mute{position:absolute;bottom:20px;right:24px;z-index:6;}',
    '.cmz-tr.lit .cmz-tr-btn{color:#4f4b60;background:rgba(255,255,255,.6);',
    ' border-color:rgba(79,75,96,.4);}',
    '.cmz-tr.lit .cmz-tr-btn:hover{color:#201e29;border-color:#201e29;}',

    /* poster / play gate */
    '.cmz-tr-poster{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;',
    ' align-items:center;justify-content:center;gap:26px;background:rgba(4,3,9,.35);}',
    '.cmz-tr-poster h1{font-family:var(--font-mono,ui-monospace,monospace);',
    ' color:var(--bolt,#c2ff3d);font-size:clamp(22px,4.4vw,52px);letter-spacing:.3em;',
    ' font-weight:400;text-shadow:0 0 14px rgba(194,255,61,.8),3px 0 0 rgba(255,110,199,.45),-3px 0 0 rgba(141,217,255,.45);',
    ' animation:cmzFlick 4.2s infinite;}',
    '@keyframes cmzFlick{0%,18%,22%,55%,57%,100%{opacity:1}20%,56%{opacity:.45}}',
    '.cmz-tr-play{font-size:16px;padding:14px 30px;border-width:2px;}',
    '.cmz-tr-sub{font-family:var(--font-mono,ui-monospace,monospace);color:#7a758c;',
    ' font-size:12px;letter-spacing:.18em;}',
    '.cmz-tr-skiplink{background:none;border:none;color:#7a758c;cursor:pointer;',
    ' font-family:var(--font-mono,ui-monospace,monospace);font-size:12px;',
    ' letter-spacing:.14em;text-decoration:underline;padding:6px;}',
    '.cmz-tr-skiplink:hover{color:#d8d6e0;}',
    '.cmz-tr-skiplink:focus-visible{outline:2px solid var(--bolt,#c2ff3d);outline-offset:2px;}',

    /* replay chip (lives on the page after exit) */
    '.cmz-tr-chip{position:fixed;bottom:18px;right:18px;z-index:9000;cursor:pointer;',
    ' border:1px solid var(--line,#201e29);background:var(--bg-elev-1,#0f0d17);',
    ' color:var(--fg-muted,#a9a5b8);font-family:var(--font-mono,ui-monospace,monospace);',
    ' font-size:12px;letter-spacing:.12em;padding:7px 12px;border-radius:999px;',
    ' opacity:.85;transition:opacity .3s,color .3s,border-color .3s;}',
    '.cmz-tr-chip:hover{opacity:1;color:var(--bolt,#c2ff3d);border-color:var(--bolt,#c2ff3d);}',

    '@media (max-width:760px){.cmz-tr-wm{top:14px;left:14px}',
    ' .cmz-tr-skip{top:12px;right:12px}.cmz-tr-mute{bottom:12px;right:12px}}'
  ].join('\n');

  /* ══════════════════════════════════════════════════════════════ */
  /* SVG SCENES  (viewBox 1600×900, preserveAspectRatio slice)       */
  /* ══════════════════════════════════════════════════════════════ */
  function svgWrap(inner) {
    return '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" ' +
      'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + inner + '</svg>';
  }

  /* Scene 1a — castle exterior, B&W */
  var SVG_EXT = svgWrap(
    '<defs>' +
    '<linearGradient id="cmzSky" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#111114"/><stop offset=".7" stop-color="#26262c"/>' +
    '<stop offset="1" stop-color="#3a3a41"/></linearGradient>' +
    '<radialGradient id="cmzMoon" cx=".5" cy=".5" r=".5">' +
    '<stop offset="0" stop-color="#d8d6e0" stop-opacity=".9"/>' +
    '<stop offset=".4" stop-color="#a9a5b8" stop-opacity=".25"/>' +
    '<stop offset="1" stop-color="#a9a5b8" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<g class="cam">' +
    '<rect width="1600" height="900" fill="url(#cmzSky)"/>' +
    '<circle cx="1180" cy="180" r="150" fill="url(#cmzMoon)"/>' +
    '<circle cx="1180" cy="180" r="52" fill="#c9c7d1" opacity=".85"/>' +
    '<g id="cmzClouds" opacity=".8">' +
    '<ellipse cx="400" cy="150" rx="330" ry="55" fill="#0d0d10" opacity=".8"/>' +
    '<ellipse cx="1000" cy="90" rx="420" ry="48" fill="#0d0d10" opacity=".7"/>' +
    '<ellipse cx="1400" cy="230" rx="300" ry="40" fill="#0d0d10" opacity=".6"/>' +
    '</g>' +
    '<path d="M0 640 L220 560 L430 620 L640 540 L900 610 L1600 560 L1600 900 L0 900 Z" fill="#141417"/>' +
    /* crag */
    '<path d="M520 900 L610 640 L700 560 L900 520 L1080 580 L1180 680 L1240 900 Z" fill="#0a0a0d"/>' +
    /* castle */
    '<g id="cmzCastle" fill="#060608">' +
    '<rect x="700" y="330" width="240" height="220"/>' +
    '<rect x="660" y="300" width="60" height="260"/>' +
    '<rect x="920" y="280" width="64" height="280"/>' +
    '<polygon points="660,300 690,220 720,300"/>' +
    '<polygon points="920,280 952,190 984,280"/>' +
    '<rect x="700" y="318" width="18" height="14"/><rect x="736" y="318" width="18" height="14"/>' +
    '<rect x="772" y="318" width="18" height="14"/><rect x="808" y="318" width="18" height="14"/>' +
    '<rect x="844" y="318" width="18" height="14"/><rect x="880" y="318" width="18" height="14"/>' +
    '<rect x="760" y="380" width="14" height="34" fill="#1c1c22"/>' +
    '<rect x="870" y="360" width="14" height="34" fill="#1c1c22"/>' +
    '<rect x="940" y="330" width="14" height="30" fill="#1c1c22"/>' +
    '</g>' +
    /* the one lit window — flicker driven in update() */
    '<rect id="cmzLitWin" x="806" y="372" width="20" height="42" fill="#e8e6ee" opacity=".8"/>' +
    /* gnarled foreground branches */
    '<g stroke="#020204" stroke-width="10" fill="none" stroke-linecap="round">' +
    '<path d="M-20 900 C 120 700, 60 560, 220 470 M 140 640 C 220 600, 250 540, 240 480"/>' +
    '<path d="M1660 900 C 1520 740, 1560 620, 1430 540 M 1500 700 C 1440 660, 1420 610, 1440 560"/>' +
    '</g>' +
    '</g>'
  );

  /* Scene 1b — laboratory interior, B&W */
  var SVG_LAB = svgWrap(
    '<defs>' +
    '<linearGradient id="cmzWall" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#101013"/><stop offset="1" stop-color="#232329"/></linearGradient>' +
    '<linearGradient id="cmzSheet" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#bfbdc9"/><stop offset="1" stop-color="#807d8f"/></linearGradient>' +
    '</defs>' +
    '<g class="cam">' +
    '<rect width="1600" height="900" fill="url(#cmzWall)"/>' +
    /* stone courses */
    '<g stroke="#0a0a0d" stroke-width="2" opacity=".5">' +
    '<line x1="0" y1="140" x2="1600" y2="140"/><line x1="0" y1="280" x2="1600" y2="280"/>' +
    '<line x1="0" y1="420" x2="1600" y2="420"/><line x1="0" y1="560" x2="1600" y2="560"/>' +
    '</g>' +
    /* arched window, storm outside (flash rect animated) */
    '<path d="M700 90 A100 110 0 0 1 900 90 L900 330 L700 330 Z" fill="#08080b"/>' +
    '<rect id="cmzWinFlash" x="700" y="20" width="200" height="310" fill="#e8e6ee" opacity="0"/>' +
    '<g stroke="#2c2c33" stroke-width="8"><line x1="800" y1="20" x2="800" y2="330"/>' +
    '<line x1="700" y1="180" x2="900" y2="180"/></g>' +
    /* cobwebs */
    '<g stroke="#5c5966" stroke-width="1.4" fill="none" opacity=".55">' +
    '<path d="M0 0 L150 120 M0 0 L220 60 M0 0 L60 200 M30 90 Q80 80 130 105 M60 160 Q120 140 190 55"/>' +
    '<path d="M1600 0 L1450 140 M1600 0 L1380 70 M1600 0 L1540 210 M1570 100 Q1510 90 1460 120"/>' +
    '</g>' +
    /* gauge panel */
    '<g id="cmzGauges">' +
    '<rect x="90" y="300" width="300" height="360" fill="#141418" stroke="#2c2c33" stroke-width="4"/>' +
    '<circle cx="170" cy="380" r="44" fill="#0b0b0e" stroke="#5c5966" stroke-width="3"/>' +
    '<circle cx="300" cy="380" r="44" fill="#0b0b0e" stroke="#5c5966" stroke-width="3"/>' +
    '<circle cx="235" cy="500" r="54" fill="#0b0b0e" stroke="#5c5966" stroke-width="3"/>' +
    '<line id="cmzNd1" x1="170" y1="380" x2="170" y2="345" stroke="#bfbdc9" stroke-width="3"/>' +
    '<line id="cmzNd2" x1="300" y1="380" x2="300" y2="345" stroke="#bfbdc9" stroke-width="3"/>' +
    '<line id="cmzNd3" x1="235" y1="500" x2="235" y2="456" stroke="#bfbdc9" stroke-width="3"/>' +
    '<rect x="140" y="580" width="16" height="52" fill="#5c5966"/>' +
    '<rect x="200" y="586" width="16" height="46" fill="#5c5966"/>' +
    '<rect x="260" y="576" width="16" height="56" fill="#5c5966"/>' +
    '</g>' +
    /* shelf w/ bottles */
    '<g fill="#0e0e12">' +
    '<rect x="1220" y="330" width="300" height="14"/>' +
    '<rect x="1250" y="270" width="34" height="60"/><circle cx="1267" cy="266" r="12"/>' +
    '<rect x="1310" y="284" width="26" height="46"/>' +
    '<rect x="1370" y="258" width="40" height="72"/><circle cx="1390" cy="252" r="14"/>' +
    '<rect x="1440" y="288" width="28" height="42"/>' +
    '</g>' +
    /* coil towers */
    '<g fill="#0c0c10">' +
    '<rect x="470" y="430" width="26" height="260"/><circle cx="483" cy="416" r="34"/>' +
    '<rect x="1120" y="430" width="26" height="260"/><circle cx="1133" cy="416" r="34"/>' +
    '</g>' +
    /* ceiling cables to the table */
    '<g stroke="#0a0a0d" stroke-width="7" fill="none">' +
    '<path d="M760 0 C 760 190, 780 320, 795 470"/>' +
    '<path d="M840 0 C 845 200, 830 330, 815 470"/>' +
    '</g>' +
    /* operating table + draped figure */
    '<g id="cmzTable">' +
    '<rect x="600" y="640" width="420" height="34" fill="#26262c" stroke="#0a0a0d" stroke-width="3"/>' +
    '<rect x="640" y="674" width="26" height="120" fill="#1a1a1f"/>' +
    '<rect x="950" y="674" width="26" height="120" fill="#1a1a1f"/>' +
    '<path id="cmzSheetPath" d="M600 640 C 640 588, 700 570, 760 566 C 810 520, 880 520, 920 566 C 970 572, 1000 600, 1020 640 Z" fill="url(#cmzSheet)"/>' +
    '<path d="M690 610 C 720 596, 740 594, 764 590 M 840 586 C 880 588, 900 600, 930 616" stroke="#5c5966" stroke-width="2.5" fill="none" opacity=".7"/>' +
    '</g>' +
    '</g>'
  );

  /* Scene 2 — neon: monster reveal (phase A) + mad scientist (phase B) */
  var SVG_NEON = svgWrap(
    '<defs>' +
    '<linearGradient id="cmzNbg" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#170a3a"/><stop offset="1" stop-color="#2a1566"/></linearGradient>' +
    '<linearGradient id="cmzChrome" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#e6ecff"/><stop offset=".5" stop-color="#8894b8"/>' +
    '<stop offset="1" stop-color="#3c4668"/></linearGradient>' +
    '<filter id="cmzGlow" x="-60%" y="-60%" width="220%" height="220%">' +
    '<feGaussianBlur stdDeviation="5" result="b"/>' +
    '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '</defs>' +
    '<rect width="1600" height="900" fill="url(#cmzNbg)"/>' +

    /* ── phase A: the creature on the table ── */
    '<g id="cmzPhA">' +
    '<rect x="560" y="640" width="480" height="36" fill="#432596" stroke="#7b61ff" stroke-width="3"/>' +
    '<rect x="600" y="676" width="28" height="130" fill="#2a1566"/>' +
    '<rect x="972" y="676" width="28" height="130" fill="#2a1566"/>' +
    /* creature: risen torso, head right */
    '<g id="cmzMon">' +
    /* flesh torso */
    '<path d="M620 640 C 640 560, 720 520, 820 516 L 900 520 C 960 528, 1000 570, 1010 640 Z" fill="#caa8c4"/>' +
    /* chrome chest plate + arm segments */
    '<path d="M700 640 C 706 576, 760 548, 828 546 L 828 640 Z" fill="url(#cmzChrome)" stroke="#e6ecff" stroke-width="2"/>' +
    '<rect x="640" y="588" width="54" height="24" rx="10" fill="url(#cmzChrome)"/>' +
    '<rect x="632" y="616" width="70" height="22" rx="10" fill="url(#cmzChrome)"/>' +
    /* head */
    '<circle cx="922" cy="500" r="52" fill="#caa8c4"/>' +
    '<path d="M878 470 A52 52 0 0 1 966 472 L 952 452 L 902 448 Z" fill="url(#cmzChrome)"/>' +
    /* glowing eye + skull seam */
    '<circle id="cmzEye" cx="940" cy="496" r="9" fill="#8dd9ff" filter="url(#cmzGlow)"/>' +
    '<circle cx="906" cy="498" r="5" fill="#170a3a"/>' +
    '<path d="M922 448 L 922 470 M 902 452 L 940 452" stroke="#3c4668" stroke-width="3"/>' +
    /* circuit traces on skin */
    '<g id="cmzTrace" stroke="#c2ff3d" stroke-width="2" fill="none" opacity=".9">' +
    '<path d="M720 600 L 760 600 L 770 585 L 810 585"/>' +
    '<path d="M745 630 L 782 630 L 792 612 L 840 612 L 848 600"/>' +
    '<circle cx="810" cy="585" r="3.5" fill="#c2ff3d"/><circle cx="848" cy="600" r="3.5" fill="#c2ff3d"/>' +
    '</g>' +
    /* fiber-optic cables — dashes animated in update() */
    '<g fill="none" stroke-linecap="round" filter="url(#cmzGlow)">' +
    '<path id="cmzCab1" d="M600 400 C 660 460, 700 520, 730 560" stroke="#ff6ec7" stroke-width="6" stroke-dasharray="14 20"/>' +
    '<path id="cmzCab2" d="M1040 380 C 1000 440, 960 470, 930 452" stroke="#8dd9ff" stroke-width="6" stroke-dasharray="10 16"/>' +
    '<path id="cmzCab3" d="M520 640 C 560 600, 620 596, 668 606" stroke="#c2ff3d" stroke-width="5" stroke-dasharray="8 14"/>' +
    '</g>' +
    '</g>' +
    '</g>' +

    /* ── phase B: mad scientist at the switchboard ── */
    '<g id="cmzPhB" opacity="0">' +
    /* rim-lit floor + panel */
    '<rect x="0" y="760" width="1600" height="140" fill="#0d0620"/>' +
    '<rect x="880" y="470" width="420" height="300" fill="#1b0f45" stroke="#7b61ff" stroke-width="4"/>' +
    /* knife switches — levers rotate in update() */
    '<g stroke="#e6ecff" stroke-width="10" stroke-linecap="round">' +
    '<line id="cmzSw1" x1="960" y1="640" x2="960" y2="560"/>' +
    '<line id="cmzSw2" x1="1090" y1="640" x2="1090" y2="560"/>' +
    '<line id="cmzSw3" x1="1220" y1="640" x2="1220" y2="560"/>' +
    '</g>' +
    '<circle cx="960" cy="640" r="12" fill="#8894b8"/><circle cx="1090" cy="640" r="12" fill="#8894b8"/>' +
    '<circle cx="1220" cy="640" r="12" fill="#8894b8"/>' +
    '<circle cx="960" cy="520" r="8" fill="#ff6ec7" filter="url(#cmzGlow)"/>' +
    '<circle cx="1090" cy="520" r="8" fill="#8dd9ff" filter="url(#cmzGlow)"/>' +
    '<circle cx="1220" cy="520" r="8" fill="#c2ff3d" filter="url(#cmzGlow)"/>' +
    /* scientist silhouette, wild hair, magenta rim light */
    '<g id="cmzSci">' +
    '<path d="M600 900 L610 660 C 612 600, 640 560, 690 552 L 730 548 C 780 552, 806 596, 810 656 L 820 900 Z" fill="#08040f" stroke="#ff6ec7" stroke-width="2.5"/>' +
    '<circle cx="710" cy="500" r="44" fill="#08040f" stroke="#ff6ec7" stroke-width="2.5"/>' +
    '<g stroke="#08040f" stroke-width="9" stroke-linecap="round">' +
    '<line x1="680" y1="466" x2="650" y2="420"/><line x1="700" y1="458" x2="692" y2="408"/>' +
    '<line x1="722" y1="458" x2="734" y2="410"/><line x1="742" y1="468" x2="774" y2="428"/>' +
    '<line x1="672" y1="486" x2="632" y2="462"/><line x1="748" y1="486" x2="790" y2="464"/>' +
    '</g>' +
    /* throwing arm — rotated in update() */
    '<g id="cmzArm">' +
    '<path d="M780 600 L 920 560 L 940 588 L 800 634 Z" fill="#08040f" stroke="#ff6ec7" stroke-width="2"/>' +
    '</g>' +
    '</g>' +
    /* arc electrode towers (canvas draws the arcs between tips) */
    '<g fill="#1b0f45" stroke="#7b61ff" stroke-width="3">' +
    '<rect x="170" y="360" width="22" height="420"/><circle id="cmzElA" cx="181" cy="340" r="26"/>' +
    '<rect x="430" y="300" width="22" height="480"/><circle id="cmzElB" cx="441" cy="280" r="26"/>' +
    '</g>' +
    '</g>'
  );

  /* Scene 3 — the corporate lecture, clean + light */
  function buildBoardContent() {
    // procedural neural-net diagram + pseudo-code lines
    var s = '', i, n = [], k;
    for (i = 0; i < 4; i++) n.push([460, 190 + i * 78]);
    for (i = 0; i < 5; i++) n.push([640, 168 + i * 68]);
    for (i = 0; i < 3; i++) n.push([820, 220 + i * 84]);
    for (i = 0; i < 4; i++) for (k = 4; k < 9; k++)
      s += '<line x1="' + n[i][0] + '" y1="' + n[i][1] + '" x2="' + n[k][0] +
           '" y2="' + n[k][1] + '" stroke="#a9a5b8" stroke-width="1"/>';
    for (i = 4; i < 9; i++) for (k = 9; k < 12; k++)
      s += '<line x1="' + n[i][0] + '" y1="' + n[i][1] + '" x2="' + n[k][0] +
           '" y2="' + n[k][1] + '" stroke="#a9a5b8" stroke-width="1"/>';
    for (i = 0; i < n.length; i++)
      s += '<circle cx="' + n[i][0] + '" cy="' + n[i][1] + '" r="11" fill="#fff" ' +
           'stroke="#4f4b60" stroke-width="2.5"/>';
    var code = ['const lab = new Graph()', 'lab.add(agents: 8)',
      'lab.watch(monster)', 'while (alive) { evolve() }'];
    for (i = 0; i < code.length; i++)
      s += '<text x="920" y="' + (210 + i * 40) +
           '" font-family="monospace" font-size="21" fill="#4f4b60">' + code[i] + '</text>';
    s += '<path d="M920 380 L 1150 380 L 1140 370 M 1150 380 L 1140 390" ' +
         'stroke="#7b61ff" stroke-width="3" fill="none"/>';
    s += '<circle cx="1190" cy="380" r="16" fill="none" stroke="#7b61ff" stroke-width="3"/>';
    return s;
  }

  var SVG_LEC = svgWrap(
    '<g class="cam">' +
    '<rect width="1600" height="900" fill="#fafafa"/>' +
    '<rect y="716" width="1600" height="184" fill="#efeff2"/>' +
    '<line x1="0" y1="716" x2="1600" y2="716" stroke="#dcdce2" stroke-width="2"/>' +
    /* whiteboard */
    '<rect x="360" y="110" width="880" height="430" rx="8" fill="#ffffff" stroke="#c9c9d1" stroke-width="5"/>' +
    '<rect x="360" y="540" width="880" height="12" fill="#dcdce2"/>' +
    '<g>' + buildBoardContent() + '</g>' +
    /* lectern */
    '<g>' +
    '<polygon points="920,560 1120,560 1150,716 890,716" fill="#b3a08a"/>' +
    '<rect x="905" y="546" width="230" height="18" rx="4" fill="#8f7c66"/>' +
    '</g>' +
    /* scientist — groomed, charcoal suit; face is the zoom target */
    '<g id="cmzLect">' +
    '<path d="M950 560 L 956 462 C 958 420, 986 398, 1020 396 C 1054 398, 1082 420, 1084 462 L 1090 560 Z" fill="#32303f"/>' +
    '<path d="M1002 402 L 1020 430 L 1038 402 L 1030 396 L 1010 396 Z" fill="#f4f3f7"/>' +
    '<path d="M1016 404 L 1024 404 L 1028 452 L 1020 462 L 1012 452 Z" fill="#5f3dd4"/>' +
    /* head */
    '<circle cx="1020" cy="352" r="46" fill="#e8c9a8"/>' +
    '<path d="M978 336 A46 46 0 0 1 1062 338 L 1058 316 C 1040 300, 1000 300, 982 318 Z" fill="#201e29"/>' +
    '<ellipse cx="975" cy="356" rx="7" ry="11" fill="#e0bd9c"/>' +
    '<ellipse cx="1065" cy="356" rx="7" ry="11" fill="#e0bd9c"/>' +
    /* brows */
    '<path id="cmzBrL" d="M994 340 Q 1004 334 1014 339" stroke="#201e29" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<path id="cmzBrR" d="M1028 339 Q 1038 334 1048 340" stroke="#201e29" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    /* eyes: whites + iris; right eye carries the wink lid */
    '<ellipse cx="1004" cy="352" rx="8.5" ry="6" fill="#fff"/>' +
    '<ellipse cx="1038" cy="352" rx="8.5" ry="6" fill="#fff"/>' +
    '<circle cx="1005" cy="353" r="3.4" fill="#32303f"/>' +
    '<circle cx="1039" cy="353" r="3.4" fill="#32303f"/>' +
    '<g id="cmzLid" transform="translate(1038 352) scale(1 0)">' +
    '<ellipse cx="0" cy="0" rx="9.5" ry="7" fill="#e8c9a8"/>' +
    '<path d="M-9 1 Q 0 4 9 1" stroke="#c99f78" stroke-width="1.6" fill="none"/>' +
    '</g>' +
    /* nose + mouth (mouth path swapped for the sly smile) */
    '<path d="M1021 356 L 1024 370 L 1017 372" stroke="#c99f78" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<path id="cmzMouth" d="M1006 384 Q 1021 392 1036 384" stroke="#a06f56" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '</g>' +
    '</g>'
  );

  /* ══════════════════════════════════════════════════════════════ */
  /* AUDIO ENGINE — all synthesized (trailer.md §6)                  */
  /* ══════════════════════════════════════════════════════════════ */
  function AudioEngine() {
    var AC = window.AudioContext || window.webkitAudioContext;
    var a = { ok: false };
    if (!AC) return a;
    var ctx = new AC();
    var master = ctx.createGain(); master.gain.value = 0.75;
    master.connect(ctx.destination);
    a.ok = true; a.ctx = ctx; a.master = master;

    function noiseBuffer(pink) {
      var len = 2 * ctx.sampleRate, buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0), b0 = 0, b1 = 0, b2 = 0, i, w;
      for (i = 0; i < len; i++) {
        w = Math.random() * 2 - 1;
        if (pink) {
          b0 = 0.997 * b0 + 0.029591 * w;
          b1 = 0.985 * b1 + 0.032534 * w;
          b2 = 0.950 * b2 + 0.048056 * w;
          d[i] = (b0 + b1 + b2 + w * 0.05) * 2.2;
        } else d[i] = w;
      }
      return buf;
    }
    var PINK = noiseBuffer(true), WHITE = noiseBuffer(false);

    function loopSrc(buf) {
      var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start();
      return s;
    }

    /* wind bed: pink noise → wandering lowpass */
    var windLP = ctx.createBiquadFilter(); windLP.type = 'lowpass'; windLP.frequency.value = 420;
    var windG = ctx.createGain(); windG.gain.value = 0;
    loopSrc(PINK).connect(windLP); windLP.connect(windG); windG.connect(master);
    var lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.11; lfoG.gain.value = 190;
    lfo.connect(lfoG); lfoG.connect(windLP.frequency); lfo.start();
    a.windG = windG;

    /* rain: white noise → highpass, quiet */
    var rainHP = ctx.createBiquadFilter(); rainHP.type = 'highpass'; rainHP.frequency.value = 2600;
    var rainG = ctx.createGain(); rainG.gain.value = 0;
    loopSrc(WHITE).connect(rainHP); rainHP.connect(rainG); rainG.connect(master);
    a.rainG = rainG;

    /* low reanimation pulse (lab) */
    var pulse = ctx.createOscillator(); pulse.type = 'sine'; pulse.frequency.value = 46;
    var pulseG = ctx.createGain(); pulseG.gain.value = 0;
    pulse.connect(pulseG); pulseG.connect(master); pulse.start();
    a.pulseG = pulseG;

    /* high-voltage hum: detuned saws → waveshaper → bandpass */
    var shaper = ctx.createWaveShaper();
    (function () {
      var c = new Float32Array(257), i, x;
      for (i = 0; i < 257; i++) { x = i / 128 - 1; c[i] = Math.tanh(2.4 * x); }
      shaper.curve = c;
    })();
    var humBP = ctx.createBiquadFilter(); humBP.type = 'bandpass';
    humBP.frequency.value = 340; humBP.Q.value = 1.1;
    var humG = ctx.createGain(); humG.gain.value = 0;
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sawtooth'; o3.type = 'sine';
    o1.frequency.value = 110; o2.frequency.value = 110; o3.frequency.value = 55;
    o1.detune.value = -7; o2.detune.value = 7;
    o1.connect(shaper); o2.connect(shaper); o3.connect(shaper);
    shaper.connect(humBP); humBP.connect(humG); humG.connect(master);
    o1.start(); o2.start(); o3.start();
    a.humG = humG;

    /* faint room tone for the lecture hall */
    var roomLP = ctx.createBiquadFilter(); roomLP.type = 'lowpass'; roomLP.frequency.value = 300;
    var roomG = ctx.createGain(); roomG.gain.value = 0;
    loopSrc(PINK).connect(roomLP); roomLP.connect(roomG); roomG.connect(master);
    a.roomG = roomG;

    /* one-shots ------------------------------------------------- */
    a.thunder = function (intensity, rumble) {
      var t0 = ctx.currentTime;
      var s = ctx.createBufferSource(); s.buffer = WHITE;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2600 * intensity + 300, t0);
      lp.frequency.exponentialRampToValueAtTime(70, t0 + 1.6);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.65 * intensity, t0 + 0.045);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.4 + (rumble ? 1.4 : 0));
      s.connect(lp); lp.connect(g); g.connect(master);
      if (rumble) {
        var dl = ctx.createDelay(0.5); dl.delayTime.value = 0.23;
        var fb = ctx.createGain(); fb.gain.value = 0.45;
        g.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(master);
      }
      s.start(t0); s.stop(t0 + 4.2);
    };

    a.slam = function () {                       /* the t=19 distortion hit */
      var t0 = ctx.currentTime;
      a.thunder(1.0, true);
      var o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(420, t0);
      o.frequency.exponentialRampToValueAtTime(38, t0 + 0.7);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.5, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 1);
    };

    a.crackle = function () {                    /* single arc snap */
      var t0 = ctx.currentTime;
      var s = ctx.createBufferSource(); s.buffer = WHITE;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3200;
      var g = ctx.createGain();
      g.gain.setValueAtTime(rnd(0.05, 0.16), t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + rnd(0.03, 0.09));
      s.connect(hp); hp.connect(g); g.connect(master);
      s.start(t0); s.stop(t0 + 0.12);
    };

    /* mad laughter — caricature synthesis: pitched burst train through
       vocal-formant bandpasses. Genre prop, not human (trailer.md §7). */
    a.laugh = function () {
      var voices = 2, v, i;
      for (v = 0; v < voices; v++) {
        var t0 = ctx.currentTime + v * 0.13 + rnd(0, 0.05);
        var f0 = rnd(170, 260) * (v ? 0.8 : 1);
        var o = ctx.createOscillator(); o.type = 'sawtooth';
        var vib = ctx.createOscillator(), vibG = ctx.createGain();
        vib.frequency.value = 6.4; vibG.gain.value = 10;
        vib.connect(vibG); vibG.connect(o.frequency); vib.start(t0);
        var f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 760; f1.Q.value = 5;
        var f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1250; f2.Q.value = 6;
        var g = ctx.createGain(); g.gain.value = 0;
        o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(master);
        var nb = 7 + Math.floor(rnd(0, 3)), dt = 0.16, tt = t0;
        for (i = 0; i < nb; i++) {
          o.frequency.setValueAtTime(f0 * (1 + 0.09 * Math.sin(i * 1.7)) * (1 - i * 0.018), tt);
          g.gain.setValueAtTime(0.0001, tt);
          g.gain.exponentialRampToValueAtTime(0.16, tt + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, tt + dt * 0.82);
          tt += dt * (1 - i * 0.02);
        }
        o.start(t0); o.stop(tt + 0.3); vib.stop(tt + 0.3);
      }
    };

    /* singing bowl / gong — additive inharmonic partials, long decay */
    a.bowl = function () {
      var t0 = ctx.currentTime;
      var f0 = 328;                              /* strike fundamental */
      var partials = [
        [1.0, 0.42, 7.5], [2.76, 0.24, 6.0], [5.40, 0.11, 4.4], [8.93, 0.05, 3.0]
      ];
      partials.forEach(function (p) {
        [0, 1.4].forEach(function (beat) {       /* detuned pair = shimmer */
          var o = ctx.createOscillator(); o.type = 'sine';
          o.frequency.value = f0 * p[0] + beat;
          var g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(p[1] * 0.5, t0 + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + p[2]);
          o.connect(g); g.connect(master);
          o.start(t0); o.stop(t0 + p[2] + 0.2);
        });
      });
      /* strike transient */
      var s = ctx.createBufferSource(); s.buffer = WHITE;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = f0 * 3; bp.Q.value = 2;
      var g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.22, t0);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      s.connect(bp); bp.connect(g2); g2.connect(master);
      s.start(t0); s.stop(t0 + 0.12);
    };

    a.cutAll = function () {                     /* t=33 hard collapse */
      var t0 = ctx.currentTime;
      [windG, rainG, pulseG, humG, roomG].forEach(function (g) {
        g.gain.cancelScheduledValues(t0);
        g.gain.setValueAtTime(g.gain.value, t0);
        g.gain.linearRampToValueAtTime(0, t0 + 0.06);
      });
    };
    a.cutHum = function () {                     /* the bell silences the hum */
      var t0 = ctx.currentTime;
      humG.gain.cancelScheduledValues(t0);
      humG.gain.setValueAtTime(humG.gain.value, t0);
      humG.gain.linearRampToValueAtTime(0, t0 + 0.05);
    };

    a.setMuted = function (m) { master.gain.value = m ? 0 : 0.75; };
    a.suspend = function () { if (ctx.state === 'running') ctx.suspend(); };
    a.resume = function () { if (ctx.state === 'suspended') ctx.resume(); };
    a.dispose = function () { try { ctx.close(); } catch (e) { /* closed */ } };
    return a;
  }

  /* ══════════════════════════════════════════════════════════════ */
  /* TRAILER                                                         */
  /* ══════════════════════════════════════════════════════════════ */
  var styleEl = null, chipEl = null, active = null;

  function ensureStyle() {
    if (styleEl) return;
    styleEl = document.createElement('style');
    styleEl.id = 'cmz-trailer-style';
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
  }

  function markSeen() {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* private mode */ }
  }
  function wasSeen() {
    try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; }
  }

  function addChip() {
    if (chipEl) return;
    ensureStyle();
    chipEl = document.createElement('button');
    chipEl.className = 'cmz-tr-chip';
    chipEl.type = 'button';
    chipEl.textContent = '▶ trailer';
    chipEl.setAttribute('aria-label', 'Replay the Claudemonzter trailer');
    chipEl.addEventListener('click', function () { mount(); });
    document.body.appendChild(chipEl);
  }
  function removeChip() {
    if (chipEl && chipEl.parentNode) chipEl.parentNode.removeChild(chipEl);
    chipEl = null;
  }

  /* ── mount: build overlay + poster gate ────────────────────────── */
  function mount() {
    if (active) return;
    ensureStyle();
    removeChip();

    var prevFocus = document.activeElement;
    var root = document.createElement('div');
    root.className = 'cmz-tr';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Claudemonzter trailer');
    root.innerHTML =
      '<div class="cmz-tr-shake">' +
      '  <div class="cmz-tr-scene s-ext on">' + SVG_EXT + '</div>' +
      '  <div class="cmz-tr-scene s-lab">' + SVG_LAB + '</div>' +
      '  <div class="cmz-tr-scene s-neon">' + SVG_NEON + '</div>' +
      '  <div class="cmz-tr-scene s-lec">' + SVG_LEC + '</div>' +
      '  <canvas class="cmz-tr-fx"></canvas>' +
      '  <div class="cmz-tr-vig"></div>' +
      '</div>' +
      '<div class="cmz-tr-white"></div>' +
      '<div class="cmz-tr-card" aria-live="polite"></div>' +
      '<div class="cmz-tr-wm" aria-hidden="true">' +
      '  <span class="glitch">CLAUDEMONZTER</span>' +
      '  <span class="clean">CLAUDEMONZTER</span>' +
      '</div>' +
      '<button type="button" class="cmz-tr-btn cmz-tr-skip">✕ SKIP</button>' +
      '<button type="button" class="cmz-tr-btn cmz-tr-mute" aria-pressed="false">🔊</button>' +
      '<div class="cmz-tr-poster">' +
      '  <h1>CLAUDEMONZTER</h1>' +
      '  <button type="button" class="cmz-tr-btn cmz-tr-play">▶ PLAY · SOUND ON</button>' +
      '  <div class="cmz-tr-sub">50 SECONDS · A LABORATORY PICTURE</div>' +
      '  <button type="button" class="cmz-tr-skiplink">skip to site →</button>' +
      '</div>';
    document.body.appendChild(root);

    var el = {
      root: root,
      shake: root.querySelector('.cmz-tr-shake'),
      scenes: {
        ext: root.querySelector('.s-ext'), lab: root.querySelector('.s-lab'),
        neon: root.querySelector('.s-neon'), lec: root.querySelector('.s-lec')
      },
      fx: root.querySelector('.cmz-tr-fx'),
      white: root.querySelector('.cmz-tr-white'),
      card: root.querySelector('.cmz-tr-card'),
      wmGlitch: root.querySelector('.cmz-tr-wm .glitch'),
      wmClean: root.querySelector('.cmz-tr-wm .clean'),
      skip: root.querySelector('.cmz-tr-skip'),
      mute: root.querySelector('.cmz-tr-mute'),
      poster: root.querySelector('.cmz-tr-poster'),
      play: root.querySelector('.cmz-tr-play'),
      skiplink: root.querySelector('.cmz-tr-skiplink')
    };

    var st = {
      el: el, prevFocus: prevFocus, audio: null,
      startMs: 0, t: -1, raf: 0, running: false, muted: false,
      pausedAt: 0, cues: [], cardIdx: -1,
      parts: [], flashes: [],
      onKey: null, onVis: null, onResize: null
    };
    active = st;

    /* canvas sizing */
    var ctx2d = el.fx.getContext('2d');
    st.g = ctx2d;
    st.onResize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2);
      el.fx.width = Math.round(el.fx.clientWidth * dpr);
      el.fx.height = Math.round(el.fx.clientHeight * dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      st.w = el.fx.clientWidth; st.h = el.fx.clientHeight;
    };
    window.addEventListener('resize', st.onResize);
    st.onResize();

    /* controls */
    el.skip.addEventListener('click', function () { finish(true); });
    el.skiplink.addEventListener('click', function () { finish(true); });
    el.mute.addEventListener('click', function () {
      st.muted = !st.muted;
      if (st.audio && st.audio.ok) st.audio.setMuted(st.muted);
      el.mute.textContent = st.muted ? '🔇' : '🔊';
      el.mute.setAttribute('aria-pressed', String(st.muted));
    });
    el.play.addEventListener('click', start);

    st.onKey = function (ev) {
      if (ev.key === 'Escape') { finish(true); return; }
      if (ev.key !== 'Tab') return;
      /* simple focus trap */
      var f = root.querySelectorAll('button');
      var list = [], i;
      for (i = 0; i < f.length; i++) if (f[i].offsetParent !== null) list.push(f[i]);
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (ev.shiftKey && document.activeElement === first) { last.focus(); ev.preventDefault(); }
      else if (!ev.shiftKey && document.activeElement === last) { first.focus(); ev.preventDefault(); }
    };
    document.addEventListener('keydown', st.onKey, true);

    st.onVis = function () {
      if (!st.running) return;
      if (document.hidden) {
        st.pausedAt = performance.now();
        if (st.audio && st.audio.ok) st.audio.suspend();
      } else if (st.pausedAt) {
        st.startMs += performance.now() - st.pausedAt;
        st.pausedAt = 0;
        if (st.audio && st.audio.ok) st.audio.resume();
      }
    };
    document.addEventListener('visibilitychange', st.onVis);

    el.play.focus();
  }

  /* ── start playback (the click = WebAudio user gesture) ────────── */
  function start() {
    var st = active; if (!st || st.running) return;
    st.audio = AudioEngine();
    if (st.audio.ok && st.muted) st.audio.setMuted(true);
    st.el.poster.style.display = 'none';
    st.running = true;
    st.startMs = performance.now();
    st.cues = buildCues(st);
    st.el.skip.focus();
    st.raf = requestAnimationFrame(function loop() {
      if (!st.running) return;
      if (!document.hidden) {
        var t = (performance.now() - st.startMs) / 1000;
        st.t = t;
        tick(st, t);
        if (t >= DUR) { finish(false); return; }
      }
      st.raf = requestAnimationFrame(loop);
    });
  }

  /* ── audio cue list ────────────────────────────────────────────── */
  function buildCues(st) {
    var A = function (fn) { return function () { if (st.audio && st.audio.ok) fn(st.audio); }; };
    return [
      { t: 0.3,  fn: A(function (a) { rampGain(a, 'windG', 0.28, 2.5); }) },
      { t: 1.2,  fn: A(function (a) { a.thunder(0.35, true); }) },
      { t: 3.2,  fn: A(function (a) { rampGain(a, 'rainG', 0.05, 2); }) },
      { t: 6.5,  fn: A(function (a) { a.thunder(0.8, true); }), flash: 'ext' },
      { t: 10.2, fn: A(function (a) { a.thunder(0.6, true); }), flash: 'ext' },
      { t: 12.0, fn: A(function (a) {         /* into the lab: muffle */
          rampGain(a, 'windG', 0.10, 1.2); rampGain(a, 'rainG', 0.015, 1.2);
          rampGain(a, 'pulseG', 0.12, 2.0); }) },
      { t: 16.0, fn: A(function (a) { a.thunder(0.5, true); }), flash: 'lab' },
      { t: 19.0, fn: A(function (a) { a.slam(); }) },
      { t: 20.0, fn: A(function (a) {         /* neon world */
          rampGain(a, 'windG', 0, 0.4); rampGain(a, 'rainG', 0, 0.4);
          rampGain(a, 'pulseG', 0, 0.4); rampGain(a, 'humG', 0.20, 1.0); }) },
      { t: 22.5, fn: A(function (a) { a.laugh(); }) },
      { t: 26.0, fn: A(function (a) { a.laugh(); }) },
      { t: 27.5, fn: A(function (a) { rampGain(a, 'humG', 0.34, 2.5); }) },
      { t: 30.0, fn: A(function (a) { a.laugh(); }) },
      { t: 33.0, fn: A(function (a) { a.cutAll(); }) },
      { t: 34.5, fn: A(function (a) { rampGain(a, 'roomG', 0.03, 2); }) },
      { t: 36.0, fn: A(function (a) {         /* the hum sneaks back in */
          rampGain(a, 'humG', 0.012, 0.5); }) },
      { t: 45.2, fn: A(function (a) { a.cutHum(); a.bowl(); }) }
    ];
  }
  function rampGain(a, name, v, secs) {
    var g = a[name]; if (!g) return;
    var t0 = a.ctx.currentTime;
    g.gain.cancelScheduledValues(t0);
    g.gain.setValueAtTime(g.gain.value, t0);
    g.gain.linearRampToValueAtTime(v, t0 + secs);
  }

  /* ── per-frame update ──────────────────────────────────────────── */
  function setScene(st, key) {
    if (st.sceneKey === key) return;
    st.sceneKey = key;
    Object.keys(st.el.scenes).forEach(function (k) {
      st.el.scenes[k].classList.toggle('on', k === key);
    });
    st.el.root.classList.toggle('lit', key === 'lec');
  }
  function cam(st, key, s, cx, cy) {
    var g = st.el.scenes[key].querySelector('.cam');
    if (g) g.setAttribute('transform',
      'translate(' + cx + ' ' + cy + ') scale(' + s + ') translate(' + (-cx) + ' ' + (-cy) + ')');
  }
  function q(st, key, sel) { return st.el.scenes[key].querySelector(sel); }

  function tick(st, t) {
    var el = st.el, i;

    /* fire cues */
    for (i = 0; i < st.cues.length; i++) {
      var c = st.cues[i];
      if (!c.done && t >= c.t) {
        c.done = true; c.fn();
        if (c.flash && !REDUCED) st.flashes.push({ t0: t, scene: c.flash });
      }
    }

    /* the hum intensifies with the scene-3 zoom (continuous, not a cue) */
    if (st.audio && st.audio.ok && t >= 36 && t < 45.2) {
      var hp = seg(t, 36, 45);
      st.audio.humG.gain.value = lerp(0.012, 0.16, hp * hp);
    }

    /* scene routing + camera moves */
    if (t < TL.lab[0]) {
      setScene(st, 'ext');
      var p = easeInOut(seg(t, TL.ext[0], TL.lab[0]));
      cam(st, 'ext', lerp(1, 1.55, p), 816, 400);
      var cl = q(st, 'ext', '#cmzClouds');
      if (cl) cl.setAttribute('transform', 'translate(' + (t * 6 % 300 - 150) + ' 0)');
      var win = q(st, 'ext', '#cmzLitWin');
      if (win) win.setAttribute('opacity', String(0.55 + 0.35 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1))));
    } else if (t < TL.strike[0]) {
      setScene(st, 'lab');
      var p2 = easeInOut(seg(t, TL.lab[0], TL.strike[0]));
      cam(st, 'lab', lerp(1.02, 1.7, p2), 810, 600);
      jitterNeedles(st, t);
    } else if (t < TL.neon[0]) {
      setScene(st, 'lab');
      cam(st, 'lab', 1.7, 810, 600);
    } else if (t < TL.white[0]) {
      setScene(st, 'neon');
      neonTick(st, t);
    } else if (t < TL.lecture[0]) {
      setScene(st, 'lec');
      cam(st, 'lec', 1, 1020, 352);
    } else {
      setScene(st, 'lec');
      var p3 = easeInOut(seg(t, TL.lecture[0], TL.wink[0] + 1));
      cam(st, 'lec', lerp(1, REDUCED ? 1.8 : 2.7, p3), 1020, 352);
      winkTick(st, t);
    }

    /* white flash layer: strike (19) + collapse (33) + exit fade */
    var wOp = 0;
    if (!REDUCED) {
      if (t >= 19 && t < 20) {
        var sp = t - 19;
        wOp = (sp < 0.08 || (sp > 0.18 && sp < 0.24) || (sp > 0.34 && sp < 0.38)) ? 1 : 0;
      }
    } else if (t >= 19 && t < 20) wOp = 0.4 * (1 - (t - 19));
    if (t >= 33 && t < 34) {
      wOp = REDUCED ? 0.85 * (1 - (t - 33) * 0.4) : (t < 33.15 ? 1 : 1 - easeOut(seg(t, 33.15, 34)));
    }
    el.white.style.opacity = String(wOp);

    /* exit dissolve */
    if (t >= TL.exit[0]) {
      el.root.style.opacity = String(1 - easeInOut(seg(t, TL.exit[0], DUR)));
    }

    /* wordmark crossfade 34–38 */
    var wm = seg(t, 34, 38);
    el.wmGlitch.style.opacity = String(1 - wm);
    el.wmClean.style.opacity = String(wm);

    /* typography cards */
    var idx = -1;
    for (i = 0; i < CARDS.length; i++) if (t >= CARDS[i].t && t < CARDS[i].out) idx = i;
    if (idx !== st.cardIdx) {
      st.cardIdx = idx;
      if (idx === -1) el.card.classList.remove('show');
      else {
        el.card.className = 'cmz-tr-card ' + CARDS[idx].cls;
        el.card.textContent = CARDS[idx].text;
        /* force restyle before showing so the fade runs */
        void el.card.offsetWidth;
        el.card.classList.add('show');
      }
    }

    drawFx(st, t);
  }

  function jitterNeedles(st, t) {
    var n1 = q(st, 'lab', '#cmzNd1'), n2 = q(st, 'lab', '#cmzNd2'), n3 = q(st, 'lab', '#cmzNd3');
    if (n1) n1.setAttribute('transform', 'rotate(' + (18 * Math.sin(t * 3.1)) + ' 170 380)');
    if (n2) n2.setAttribute('transform', 'rotate(' + (26 * Math.sin(t * 4.7 + 1)) + ' 300 380)');
    if (n3) n3.setAttribute('transform', 'rotate(' + (40 * Math.sin(t * 2.3 + 2)) + ' 235 500)');
    var wf = q(st, 'lab', '#cmzWinFlash');
    if (wf) {
      var f = 0;
      st.flashes.forEach(function (fl) {
        if (fl.scene === 'lab' && t - fl.t0 < 0.5) f = Math.max(f, 1 - (t - fl.t0) * 2);
      });
      wf.setAttribute('opacity', String(f * 0.8));
    }
  }

  function neonTick(st, t) {
    var A = q(st, 'neon', '#cmzPhA'), B = q(st, 'neon', '#cmzPhB');
    var phaseB = t >= 27;
    if (A) A.setAttribute('opacity', phaseB ? '0' : '1');
    if (B) B.setAttribute('opacity', phaseB ? '1' : '0');
    if (!phaseB) {
      /* pulsing cables + traces + eye */
      ['#cmzCab1', '#cmzCab2', '#cmzCab3'].forEach(function (id, k) {
        var c = q(st, 'neon', id);
        if (c) c.setAttribute('stroke-dashoffset', String(-t * (40 + k * 22)));
      });
      var tr = q(st, 'neon', '#cmzTrace');
      if (tr) tr.setAttribute('opacity', String(0.5 + 0.5 * Math.abs(Math.sin(t * 5))));
      var eye = q(st, 'neon', '#cmzEye');
      if (eye) eye.setAttribute('r', String(8 + 2.4 * Math.abs(Math.sin(t * 3.4))));
    } else {
      /* lever throws + arm */
      var ph = (t - 27) % 1.5, throwP = ph < 0.35 ? easeOut(ph / 0.35) : 1;
      var sw = Math.floor((t - 27) / 1.5) % 3;
      ['#cmzSw1', '#cmzSw2', '#cmzSw3'].forEach(function (id, k) {
        var l = q(st, 'neon', id), px = 960 + k * 130;
        if (!l) return;
        var ang = (k < sw || (k === sw && throwP === 1)) ? 52 : (k === sw ? lerp(-38, 52, throwP) : -38);
        l.setAttribute('transform', 'rotate(' + ang + ' ' + px + ' 640)');
      });
      var arm = q(st, 'neon', '#cmzArm');
      if (arm) arm.setAttribute('transform', 'rotate(' + (-18 + 26 * throwP) + ' 780 600)');
      /* screen shake */
      if (!REDUCED) {
        var s = 3.2 * (0.4 + 0.6 * Math.min(1, (t - 27) / 4));
        st.el.shake.style.transform =
          'translate(' + rnd(-s, s).toFixed(1) + 'px,' + rnd(-s, s).toFixed(1) + 'px)';
      }
    }
    if (t >= 33 - 0.02) st.el.shake.style.transform = '';
  }

  function winkTick(st, t) {
    var lid = q(st, 'lec', '#cmzLid'), br = q(st, 'lec', '#cmzBrR'), m = q(st, 'lec', '#cmzMouth');
    if (!lid) return;
    var w = 0;                                   /* 0 open → 1 closed */
    if (t >= 45.2 && t < 45.35) w = seg(t, 45.2, 45.35);
    else if (t >= 45.35 && t < 45.6) w = 1;
    else if (t >= 45.6 && t < 45.85) w = 1 - seg(t, 45.6, 45.85);
    lid.setAttribute('transform', 'translate(1038 352) scale(1 ' + w.toFixed(3) + ')');
    if (br) br.setAttribute('transform', 'translate(0 ' + (2.5 * w).toFixed(2) + ')');
    /* the sly smile arrives with the wink and stays */
    if (m && t >= 45.2 && !st.slySet) {
      st.slySet = true;
      m.setAttribute('d', 'M1006 384 Q 1021 393 1038 381');
    }
  }

  /* ── canvas effects: grain, rain, bolts, particles, arcs ───────── */
  function drawFx(st, t) {
    var g = st.g, w = st.w, h = st.h, i;
    g.clearRect(0, 0, w, h);
    if (REDUCED) return;                         /* clean variant: no fx */

    /* film grain (heavy B&W → light neon → none in lecture) */
    var grainA = t < 19 ? 0.10 : (t < 33 ? 0.05 : 0);
    if (grainA > 0) {
      var n = MOBILE ? 90 : 220;
      for (i = 0; i < n; i++) {
        var v = Math.floor(rnd(60, 220));
        g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + grainA + ')';
        g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 2.6), rnd(1, 2.6));
      }
      /* roaming scratch line, old-print style */
      if (t < 19 && Math.random() < 0.06) {
        g.strokeStyle = 'rgba(220,220,228,.16)';
        g.beginPath(); var sx = rnd(0, w);
        g.moveTo(sx, 0); g.lineTo(sx + rnd(-12, 12), h); g.stroke();
      }
    }

    /* rain streaks, exterior only */
    if (t >= 3 && t < 12) {
      g.strokeStyle = 'rgba(200,200,214,.34)'; g.lineWidth = 1;
      var rn = MOBILE ? 40 : 110;
      for (i = 0; i < rn; i++) {
        var rx = ((i * 137 + t * 900) % (w + 80)) - 40;
        var ry = (i * 89 + t * 1300) % h;
        g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 7, ry + 20); g.stroke();
      }
    }

    /* exterior lightning flashes (cue-scheduled) */
    st.flashes = st.flashes.filter(function (fl) { return t - fl.t0 < 0.55; });
    st.flashes.forEach(function (fl) {
      if (fl.scene !== 'ext') return;
      var age = t - fl.t0;
      if (age < 0.12) {
        g.fillStyle = 'rgba(238,238,246,' + (0.55 * (1 - age / 0.12)) + ')';
        g.fillRect(0, 0, w, h);
      }
      if (age < 0.2) bolt(g, w * rnd(0.25, 0.75), 0, w * 0.55, h * 0.45, '#e8e6ee', 2, 0.9);
    });

    /* the 19s strike: big blue-magenta bolt into the table */
    if (t >= 19 && t < 19.55) {
      bolt(g, w * 0.5, 0, w * 0.505, h * 0.66, '#8dd9ff', 4, 1);
      bolt(g, w * 0.47, 0, w * 0.5, h * 0.66, '#ff6ec7', 2.4, 0.8);
    }

    /* sheet-dissolve particles 20–23.5 */
    if (t >= 20 && t < 20.05 && !st.partsSpawned) {
      st.partsSpawned = true;
      var pn = MOBILE ? 90 : 260;
      for (i = 0; i < pn; i++) st.parts.push({
        x: w * rnd(0.40, 0.60), y: h * rnd(0.58, 0.72),
        vx: rnd(-40, 40), vy: rnd(-160, -40), life: rnd(1.4, 3.4),
        c: ['#ff6ec7', '#8dd9ff', '#c2ff3d', '#e6ecff'][Math.floor(rnd(0, 4))]
      });
    }
    if (st.parts.length) {
      var dt = 1 / 60;
      st.parts = st.parts.filter(function (p) { return p.life > 0; });
      st.parts.forEach(function (p) {
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 30 * dt;
        g.globalAlpha = clamp(p.life, 0, 1);
        g.fillStyle = p.c; g.fillRect(p.x, p.y, 2.6, 2.6);
      });
      g.globalAlpha = 1;
    }

    /* arc generators, phase B (27–33): arcs between electrode tips */
    if (t >= 27 && t < 33) {
      /* electrode tip screen positions ≈ fractions of the 1600×900 frame */
      var ax = w * (181 / 1600), ay = h * (340 / 900);
      var bx = w * (441 / 1600), by = h * (280 / 900);
      bolt(g, ax, ay, bx, by, '#8dd9ff', 2.6, 0.95);
      if (Math.random() < 0.5) bolt(g, ax, ay, bx, by, '#ff6ec7', 1.4, 0.7);
      if (Math.random() < 0.3)
        bolt(g, bx, by, w * rnd(0.5, 0.8), h * rnd(0.2, 0.5), '#c2ff3d', 1.2, 0.5);
      if (st.audio && st.audio.ok && Math.random() < 0.22) st.audio.crackle();
      /* sparks */
      for (i = 0; i < 3; i++) {
        g.fillStyle = 'rgba(255,255,255,.8)';
        g.fillRect(bx + rnd(-30, 30), by + rnd(-20, 20), 2, 2);
      }
    }
  }

  /* midpoint-displacement lightning */
  function bolt(g, x0, y0, x1, y1, color, width, alpha) {
    var pts = [[x0, y0], [x1, y1]], gen;
    for (gen = 0; gen < 5; gen++) {
      var out = [pts[0]], j;
      for (j = 0; j < pts.length - 1; j++) {
        var a = pts[j], b = pts[j + 1];
        var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        out.push([mx + rnd(-len, len) * 0.18, my + rnd(-len, len) * 0.18]);
        out.push(b);
      }
      pts = out;
    }
    g.save();
    g.globalAlpha = alpha;
    g.strokeStyle = color; g.lineWidth = width * 2.6; g.globalAlpha = alpha * 0.25;
    strokePath(g, pts);
    g.strokeStyle = '#ffffff'; g.lineWidth = width; g.globalAlpha = alpha;
    strokePath(g, pts);
    g.restore();
  }
  function strokePath(g, pts) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  }

  /* ── teardown ──────────────────────────────────────────────────── */
  function finish(skipped) {
    var st = active; if (!st) return;
    active = null;
    st.running = false;
    if (st.raf) cancelAnimationFrame(st.raf);
    document.removeEventListener('keydown', st.onKey, true);
    document.removeEventListener('visibilitychange', st.onVis);
    window.removeEventListener('resize', st.onResize);
    if (st.audio && st.audio.ok) st.audio.dispose();
    markSeen();

    var root = st.el.root;
    if (skipped) {
      root.style.transition = 'opacity .3s ease';
      root.style.opacity = '0';
      setTimeout(function () {
        if (root.parentNode) root.parentNode.removeChild(root);
      }, 320);
    } else if (root.parentNode) root.parentNode.removeChild(root);

    try {
      if (st.prevFocus && st.prevFocus.focus) st.prevFocus.focus();
    } catch (e) { /* focus target gone */ }
    addChip();
  }

  /* ── boot ──────────────────────────────────────────────────────── */
  function boot() {
    if (wasSeen()) { addChip(); return; }
    mount();
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);

  /* console handle for QC sessions */
  window.CMZ_TRAILER = { play: mount, skip: function () { finish(true); } };
})();
