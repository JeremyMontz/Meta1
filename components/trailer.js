/* ════════════════════════════════════════════════════════════════════
   components/trailer.js — Claudemonzter cinematic trailer  (#382)
   Spec: projects/meta1/meta1/design/trailer.md v0.4

   Self-contained overlay module. Injects its own styles + DOM, plays a
   ~50s pure-code timeline (SVG scenes + canvas effects + WebAudio),
   then removes itself entirely — the homepage beneath is untouched.

   v3 (Jeremy review round 1): rain ramp + lightning punctuates "idea.",
   cumulus clouds, real thunderclap (no laser), aftershock drama on the
   reveal, human-proportioned Frankenstein-coded creature, scientist
   redesign (bald/glasses/beard/white coat) + lens-reflection close-up
   where the laughter lives, scene-3 continuity + agent-graph whiteboard
   + faster wink + paper-rustle audio, black title button ending.

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

  /* ── Timeline (design targets, trailer.md §4 v0.4) ─────────────── */
  var TL = {
    titleIn: [0, 3],
    ext:     [3, 12],       // Scene 1a — castle exterior (rain ramps up)
    lab:     [12, 19],      // Scene 1b — into the lab
    strike:  [19, 20],
    neon:    [20, 33],      // creature 20–27 · scientist 27–30.5 · close-up 30.5–33
    white:   [33, 34],
    lecture: [34, 44.6],    // Scene 3 — zoom lands ~41.5, wink 43.3
    button:  [44.6, 47.8],  // black title card, bowl ringing
    exit:    [47.8, 50]
  };
  var CARDS = [
    { t: 6.3,  out: 11.5, cls: 'c1', text: 'Every experiment starts with an idea.' },
    { t: 27.4, out: 31.5, cls: 'c2', text: 'But this creature had ideas of its own!' },
    { t: 37,   out: 42.5, cls: 'c3', text: 'Claudemonzter — a multi-agent AI lab, evolving in public.' }
  ];
  /* the 19s strike strobe pattern (offsets within [19,20)) */
  var STROBE = [[0, 0.06], [0.12, 0.20], [0.28, 0.34], [0.46, 0.52]];
  /* close-up lens centers as fractions of the 1600×900 frame */
  var LENS = [[724 / 1600, 386 / 900], [886 / 1600, 386 / 900]];
  var LENS_R = 78 / 900;

  /* ── tiny math helpers ─────────────────────────────────────────── */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, p) { return a + (b - a) * p; }
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

    /* black title button (the trailer's closing card) */
    '.cmz-tr-btncard{position:absolute;inset:0;background:#040309;opacity:0;',
    ' pointer-events:none;display:flex;flex-direction:column;align-items:center;',
    ' justify-content:center;gap:20px;}',
    '.cmz-tr-btncard .big{font-family:var(--font-mono,ui-monospace,monospace);',
    ' color:var(--bolt,#c2ff3d);font-size:clamp(26px,5.6vw,74px);letter-spacing:.28em;',
    ' text-shadow:0 0 18px rgba(194,255,61,.8),4px 0 0 rgba(255,110,199,.4),-4px 0 0 rgba(141,217,255,.4);',
    ' animation:cmzFlick 3.6s infinite;}',
    '.cmz-tr-btncard .tag{font-family:var(--font-mono,ui-monospace,monospace);',
    ' color:#7a758c;font-size:clamp(11px,1.3vw,15px);letter-spacing:.3em;}',

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
    ' font-weight:600;font-size:clamp(17px,2.4vw,30px);letter-spacing:.02em;text-shadow:none;',
    ' background:rgba(255,255,255,.82);padding:12px 26px;border-radius:12px;',
    ' box-shadow:0 4px 24px rgba(32,30,41,.12);}',

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

  /* cumulus cluster helper (build-time) */
  function cloud(cx, cy, s) {
    return '<g>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (110 * s) + '" ry="' + (40 * s) + '"/>' +
      '<ellipse cx="' + (cx - 78 * s) + '" cy="' + (cy + 12 * s) + '" rx="' + (66 * s) + '" ry="' + (28 * s) + '"/>' +
      '<ellipse cx="' + (cx + 84 * s) + '" cy="' + (cy + 10 * s) + '" rx="' + (72 * s) + '" ry="' + (30 * s) + '"/>' +
      '<ellipse cx="' + (cx - 30 * s) + '" cy="' + (cy - 26 * s) + '" rx="' + (58 * s) + '" ry="' + (30 * s) + '"/>' +
      '<ellipse cx="' + (cx + 40 * s) + '" cy="' + (cy - 22 * s) + '" rx="' + (50 * s) + '" ry="' + (26 * s) + '"/>' +
      '</g>';
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
    '<g id="cmzClouds" fill="#0b0b0e" opacity=".85">' +
    cloud(340, 140, 1.15) + cloud(1010, 95, 1.35) + cloud(1440, 235, 0.9) +
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
    '<g stroke="#0a0a0d" stroke-width="2" opacity=".5">' +
    '<line x1="0" y1="140" x2="1600" y2="140"/><line x1="0" y1="280" x2="1600" y2="280"/>' +
    '<line x1="0" y1="420" x2="1600" y2="420"/><line x1="0" y1="560" x2="1600" y2="560"/>' +
    '</g>' +
    '<path d="M700 90 A100 110 0 0 1 900 90 L900 330 L700 330 Z" fill="#08080b"/>' +
    '<rect id="cmzWinFlash" x="700" y="20" width="200" height="310" fill="#e8e6ee" opacity="0"/>' +
    '<g stroke="#2c2c33" stroke-width="8"><line x1="800" y1="20" x2="800" y2="330"/>' +
    '<line x1="700" y1="180" x2="900" y2="180"/></g>' +
    '<g stroke="#5c5966" stroke-width="1.4" fill="none" opacity=".55">' +
    '<path d="M0 0 L150 120 M0 0 L220 60 M0 0 L60 200 M30 90 Q80 80 130 105 M60 160 Q120 140 190 55"/>' +
    '<path d="M1600 0 L1450 140 M1600 0 L1380 70 M1600 0 L1540 210 M1570 100 Q1510 90 1460 120"/>' +
    '</g>' +
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
    '<g fill="#0e0e12">' +
    '<rect x="1220" y="330" width="300" height="14"/>' +
    '<rect x="1250" y="270" width="34" height="60"/><circle cx="1267" cy="266" r="12"/>' +
    '<rect x="1310" y="284" width="26" height="46"/>' +
    '<rect x="1370" y="258" width="40" height="72"/><circle cx="1390" cy="252" r="14"/>' +
    '<rect x="1440" y="288" width="28" height="42"/>' +
    '</g>' +
    '<g fill="#0c0c10">' +
    '<rect x="470" y="430" width="26" height="260"/><circle cx="483" cy="416" r="34"/>' +
    '<rect x="1120" y="430" width="26" height="260"/><circle cx="1133" cy="416" r="34"/>' +
    '</g>' +
    '<g stroke="#0a0a0d" stroke-width="7" fill="none">' +
    '<path d="M760 0 C 760 190, 780 320, 795 470"/>' +
    '<path d="M840 0 C 845 200, 830 330, 815 470"/>' +
    '</g>' +
    '<g id="cmzTable">' +
    '<rect x="600" y="640" width="420" height="34" fill="#26262c" stroke="#0a0a0d" stroke-width="3"/>' +
    '<rect x="640" y="674" width="26" height="120" fill="#1a1a1f"/>' +
    '<rect x="950" y="674" width="26" height="120" fill="#1a1a1f"/>' +
    '<path id="cmzSheetPath" d="M600 640 C 640 588, 700 570, 760 566 C 810 520, 880 520, 920 566 C 970 572, 1000 600, 1020 640 Z" fill="url(#cmzSheet)"/>' +
    '<path d="M690 610 C 720 596, 740 594, 764 590 M 840 586 C 880 588, 900 600, 930 616" stroke="#5c5966" stroke-width="2.5" fill="none" opacity=".7"/>' +
    '</g>' +
    '</g>'
  );

  /* Scene 2 — neon. Three phases:
     A 20–27   creature revealed, seated upright (human-proportioned)
     B 27–30.5 scientist wide at the switchboard (bald/glasses/beard/coat)
     C 30.5–33 scientist CLOSE-UP — lens reflections, laughter          */
  var SVG_NEON = svgWrap(
    '<defs>' +
    '<linearGradient id="cmzNbg" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#170a3a"/><stop offset="1" stop-color="#2a1566"/></linearGradient>' +
    '<linearGradient id="cmzChrome" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#e6ecff"/><stop offset=".5" stop-color="#8894b8"/>' +
    '<stop offset="1" stop-color="#3c4668"/></linearGradient>' +
    '<linearGradient id="cmzCoat" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#f0eef6"/><stop offset="1" stop-color="#c9c6d6"/></linearGradient>' +
    '<filter id="cmzGlow" x="-60%" y="-60%" width="220%" height="220%">' +
    '<feGaussianBlur stdDeviation="5" result="b"/>' +
    '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '</defs>' +
    '<rect width="1600" height="900" fill="url(#cmzNbg)"/>' +

    /* ── phase A: the creature, seated upright on the table ── */
    '<g id="cmzPhA">' +
    '<rect x="480" y="640" width="620" height="36" fill="#432596" stroke="#7b61ff" stroke-width="3"/>' +
    '<rect x="530" y="676" width="28" height="130" fill="#2a1566"/>' +
    '<rect x="1020" y="676" width="28" height="130" fill="#2a1566"/>' +
    '<g id="cmzMon">' +
    /* legs extended along the table (flesh thigh, chrome shin) */
    '<rect x="592" y="606" width="140" height="40" rx="18" fill="#caa8c4"/>' +
    '<rect x="500" y="612" width="110" height="32" rx="14" fill="url(#cmzChrome)"/>' +
    '<rect x="486" y="596" width="26" height="30" rx="8" fill="url(#cmzChrome)"/>' +
    /* torso — squared shoulders, human proportions; flesh left / chrome right */
    '<path d="M712 462 C 712 452, 720 448, 730 448 L 870 448 C 880 448, 888 452, 888 462 L 884 640 L 716 640 Z" fill="#caa8c4"/>' +
    '<path d="M800 448 L 870 448 C 880 448, 888 452, 888 462 L 884 640 L 800 640 Z" fill="url(#cmzChrome)" stroke="#e6ecff" stroke-width="2"/>' +
    '<path d="M800 500 L 886 504 M 800 556 L 885 558 M 800 606 L 884 608" stroke="#3c4668" stroke-width="2.5"/>' +
    '<circle cx="866" cy="478" r="3" fill="#3c4668"/><circle cx="866" cy="530" r="3" fill="#3c4668"/>' +
    /* the seam: stitches where flesh meets machine */
    '<path d="M800 452 L 800 636 M 790 470 L 810 470 M 790 508 L 810 508 M 790 546 L 810 546 M 790 584 L 810 584 M 790 620 L 810 620" stroke="#c2ff3d" stroke-width="2" opacity=".85"/>' +
    /* left arm (flesh) — hangs to the table, stitch ring at the elbow */
    '<path d="M712 462 L 686 470 L 676 548 L 692 552 L 706 480 Z" fill="#caa8c4"/>' +
    '<path d="M676 548 L 664 622 C 663 632, 670 638, 680 638 L 694 636 L 692 552 Z" fill="#caa8c4"/>' +
    '<path d="M672 549 L 696 553" stroke="#c2ff3d" stroke-width="2.5"/>' +
    '<ellipse cx="678" cy="642" rx="16" ry="9" fill="#caa8c4"/>' +
    /* right arm (chrome, segmented piston) */
    '<rect x="884" y="462" width="30" height="66" rx="12" fill="url(#cmzChrome)" transform="rotate(-8 899 495)"/>' +
    '<rect x="896" y="524" width="26" height="72" rx="11" fill="url(#cmzChrome)" transform="rotate(-4 909 560)"/>' +
    '<rect x="900" y="596" width="34" height="40" rx="9" fill="url(#cmzChrome)"/>' +
    '<line x1="906" y1="608" x2="928" y2="608" stroke="#3c4668" stroke-width="2"/>' +
    /* neck + THE BOLTS */
    '<rect x="778" y="410" width="44" height="44" fill="#caa8c4"/>' +
    '<rect x="752" y="424" width="24" height="12" rx="3" fill="url(#cmzChrome)" stroke="#c2ff3d" stroke-width="1.5" filter="url(#cmzGlow)"/>' +
    '<rect x="824" y="424" width="24" height="12" rx="3" fill="url(#cmzChrome)" stroke="#c2ff3d" stroke-width="1.5" filter="url(#cmzGlow)"/>' +
    /* head — flat top w/ dark hair cap, jaw, chrome faceplate right */
    '<path d="M756 336 L 844 336 C 852 336, 856 342, 856 350 L 852 402 C 850 418, 838 428, 822 430 L 778 430 C 762 428, 750 418, 748 402 L 744 350 C 744 342, 748 336, 756 336 Z" fill="#caa8c4"/>' +
    '<path d="M756 336 L 844 336 C 852 336, 856 342, 856 350 L 855 358 L 745 358 L 744 350 C 744 342, 748 336, 756 336 Z" fill="#14121c"/>' +
    '<path d="M800 358 L 844 358 L 855 358 L 852 402 C 850 418, 838 428, 822 430 L 806 430 L 800 396 Z" fill="url(#cmzChrome)" stroke="#e6ecff" stroke-width="1.5"/>' +
    /* forehead stitch scar */
    '<path d="M752 368 L 794 366 M 762 361 L 762 373 M 776 360 L 776 372 M 789 360 L 789 371" stroke="#c2ff3d" stroke-width="2" opacity=".9"/>' +
    /* eyes: heavy-lidded organic left, glowing lens right */
    '<path d="M756 382 L 782 380" stroke="#7a5f74" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="770" cy="390" r="5" fill="#170a3a"/>' +
    '<circle id="cmzEye" cx="828" cy="388" r="9" fill="#8dd9ff" filter="url(#cmzGlow)"/>' +
    '<circle cx="828" cy="388" r="3" fill="#e6ecff"/>' +
    /* stitched mouth */
    '<path d="M772 414 L 806 414 M 780 409 L 780 419 M 794 409 L 794 419" stroke="#7a5f74" stroke-width="2.5" stroke-linecap="round"/>' +
    /* circuit traces on the flesh side */
    '<g id="cmzTrace" stroke="#c2ff3d" stroke-width="2" fill="none" opacity=".9">' +
    '<path d="M724 520 L 758 520 L 768 504 L 792 504"/>' +
    '<path d="M730 566 L 764 566 L 774 550 L 792 550"/>' +
    '<circle cx="792" cy="504" r="3.5" fill="#c2ff3d"/><circle cx="792" cy="550" r="3.5" fill="#c2ff3d"/>' +
    '</g>' +
    /* fiber-optic cables — dashes animated in update() */
    '<g fill="none" stroke-linecap="round" filter="url(#cmzGlow)">' +
    '<path id="cmzCab1" d="M560 340 C 620 400, 670 440, 706 466" stroke="#ff6ec7" stroke-width="6" stroke-dasharray="14 20"/>' +
    '<path id="cmzCab2" d="M1060 320 C 1000 360, 940 390, 858 396" stroke="#8dd9ff" stroke-width="6" stroke-dasharray="10 16"/>' +
    '<path id="cmzCab3" d="M460 560 C 520 560, 600 580, 660 600" stroke="#c2ff3d" stroke-width="5" stroke-dasharray="8 14"/>' +
    '</g>' +
    '</g>' +
    '</g>' +

    /* ── phase B: scientist wide at the switchboard ── */
    '<g id="cmzPhB" opacity="0">' +
    '<rect x="0" y="760" width="1600" height="140" fill="#0d0620"/>' +
    '<rect x="880" y="470" width="420" height="300" fill="#1b0f45" stroke="#7b61ff" stroke-width="4"/>' +
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
    /* scientist — white lab coat, bald, glasses, beard; magenta rim */
    '<g id="cmzSci">' +
    '<path d="M600 900 L610 660 C 612 600, 640 560, 690 552 L 730 548 C 780 552, 806 596, 810 656 L 820 900 Z" fill="url(#cmzCoat)" stroke="#ff6ec7" stroke-width="2.5"/>' +
    '<path d="M694 556 L 680 700 M 726 556 L 742 700" stroke="#a9a5b8" stroke-width="2.5" fill="none"/>' +
    '<path d="M710 556 L 700 640 L 710 700 L 722 640 Z" fill="#32303f" opacity=".85"/>' +
    /* bald head */
    '<circle cx="710" cy="500" r="44" fill="#e0c4a4" stroke="#ff6ec7" stroke-width="2.5"/>' +
    '<ellipse cx="668" cy="504" rx="7" ry="11" fill="#d4b493"/>' +
    '<ellipse cx="752" cy="504" rx="7" ry="11" fill="#d4b493"/>' +
    /* glasses — round, catching the light */
    '<circle cx="694" cy="494" r="15" fill="rgba(141,217,255,.3)" stroke="#e6ecff" stroke-width="3"/>' +
    '<circle cx="730" cy="494" r="15" fill="rgba(141,217,255,.3)" stroke="#e6ecff" stroke-width="3"/>' +
    '<line x1="709" y1="494" x2="715" y2="494" stroke="#e6ecff" stroke-width="3"/>' +
    '<path d="M688 488 L 699 492 M 724 488 L 735 492" stroke="#fff" stroke-width="2"/>' +
    /* beard */
    '<path d="M676 516 C 678 544, 690 560, 710 562 C 730 560, 742 544, 744 516 C 736 528, 724 534, 710 534 C 696 534, 684 528, 676 516 Z" fill="#cfccda"/>' +
    /* throwing arm — white sleeve, rotated in update() */
    '<g id="cmzArm">' +
    '<path d="M780 600 L 920 560 L 940 588 L 800 634 Z" fill="url(#cmzCoat)" stroke="#ff6ec7" stroke-width="2"/>' +
    '</g>' +
    '</g>' +
    '<g fill="#1b0f45" stroke="#7b61ff" stroke-width="3">' +
    '<rect x="170" y="360" width="22" height="420"/><circle id="cmzElA" cx="181" cy="340" r="26"/>' +
    '<rect x="430" y="300" width="22" height="480"/><circle id="cmzElB" cx="441" cy="280" r="26"/>' +
    '</g>' +
    '</g>' +

    /* ── phase C: the close-up — glasses full of lightning ── */
    '<g id="cmzPhC" opacity="0">' +
    '<rect width="1600" height="900" fill="#0d0620"/>' +
    '<g id="cmzCuHead">' +
    /* coat shoulders framing the bottom */
    '<path d="M340 900 L 420 760 C 470 700, 560 668, 640 660 L 960 660 C 1040 668, 1130 700, 1180 760 L 1260 900 Z" fill="url(#cmzCoat)" stroke="#ff6ec7" stroke-width="3"/>' +
    '<path d="M640 664 L 620 900 M 960 664 L 980 900" stroke="#a9a5b8" stroke-width="3" fill="none"/>' +
    /* bald head, big */
    '<circle cx="800" cy="430" r="210" fill="#e0c4a4" stroke="#ff6ec7" stroke-width="3.5"/>' +
    '<ellipse cx="598" cy="452" rx="26" ry="44" fill="#d4b493"/>' +
    '<ellipse cx="1002" cy="452" rx="26" ry="44" fill="#d4b493"/>' +
    '<path d="M652 320 C 700 292, 760 278, 800 278 C 840 278, 900 292, 948 320" stroke="#d4b493" stroke-width="4" fill="none" opacity=".6"/>' +
    /* brows raised in mania */
    '<path d="M666 344 Q 724 318 772 340" stroke="#b9977a" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    '<path d="M828 340 Q 876 318 934 344" stroke="#b9977a" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    /* GLASSES — huge, opaque, reflecting the arcs (canvas draws glints) */
    '<circle cx="724" cy="386" r="78" fill="#dfe9ff" opacity=".94" stroke="#e6ecff" stroke-width="7"/>' +
    '<circle cx="886" cy="386" r="78" fill="#dfe9ff" opacity=".94" stroke="#e6ecff" stroke-width="7"/>' +
    '<line x1="800" y1="386" x2="810" y2="386" stroke="#e6ecff" stroke-width="7"/>' +
    '<path d="M646 386 L 606 380 M 964 386 L 1004 380" stroke="#e6ecff" stroke-width="6"/>' +
    /* nose */
    '<path d="M800 402 L 812 466 L 788 472" stroke="#c8a380" stroke-width="6" fill="none" stroke-linecap="round"/>' +
    /* beard, big + wild at the edges */
    '<path d="M622 470 C 620 560, 660 622, 720 640 C 690 650, 668 646, 648 636 C 676 664, 720 678, 800 678 C 880 678, 924 664, 952 636 C 932 646, 910 650, 880 640 C 940 622, 980 560, 978 470 C 950 512, 910 534, 872 540 L 728 540 C 690 534, 650 512, 622 470 Z" fill="#cfccda"/>' +
    /* laughing mouth — open, head thrown into it */
    '<path id="cmzCuMouth" d="M726 542 C 748 596, 852 596, 874 542 C 848 556, 752 556, 726 542 Z" fill="#2a0f22"/>' +
    '<path d="M734 544 L 866 544 L 858 560 C 820 570, 780 570, 742 560 Z" fill="#f4f3f7"/>' +
    '</g>' +
    '</g>'
  );

  /* Scene 3 — the corporate lecture, clean + light */
  function buildBoardContent() {
    /* hub-and-spoke — echoes the AgentGraph on index.html:
       center hub, four project nodes, agents fanning outward */
    var s = '', i;
    var hub = [640, 330];
    var projects = [[640, 210], [790, 360], [630, 460], [480, 320]];
    var leaves = [
      [555, 140], [645, 118], [730, 150],      /* north cluster */
      [900, 300], [925, 380], [890, 452],      /* east cluster */
      [560, 540],                               /* south */
      [360, 280]                                /* west */
    ];
    var owner =   [0, 0, 0, 1, 1, 1, 2, 3];
    projects.forEach(function (p) {
      s += '<line x1="' + hub[0] + '" y1="' + hub[1] + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="#7a758c" stroke-width="2"/>';
    });
    leaves.forEach(function (l, k) {
      var p = projects[owner[k]];
      s += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + l[0] + '" y2="' + l[1] + '" stroke="#a9a5b8" stroke-width="1.5"/>';
    });
    s += '<circle cx="' + hub[0] + '" cy="' + hub[1] + '" r="26" fill="#fff" stroke="#5f3dd4" stroke-width="4"/>';
    s += '<circle cx="' + hub[0] + '" cy="' + hub[1] + '" r="34" fill="none" stroke="#b57bff" stroke-width="3" opacity=".5"/>';
    projects.forEach(function (p) {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="#fff" stroke="#4f4b60" stroke-width="3"/>';
    });
    leaves.forEach(function (l) {
      s += '<circle cx="' + l[0] + '" cy="' + l[1] + '" r="8" fill="#fff" stroke="#7a758c" stroke-width="2.5"/>';
    });
    /* margin notes */
    var code = ['agents: 8', 'while (alive) { evolve() }'];
    for (i = 0; i < code.length; i++)
      s += '<text x="960" y="' + (170 + i * 44) +
           '" font-family="monospace" font-size="22" fill="#4f4b60">' + code[i] + '</text>';
    s += '<path d="M960 260 L 1150 260 L 1140 250 M 1150 260 L 1140 270" stroke="#7b61ff" stroke-width="3" fill="none"/>';
    s += '<path d="M980 300 Q 1030 290 1080 300 Q 1130 310 1170 300" stroke="#a9a5b8" stroke-width="2.5" fill="none"/>';
    s += '<path d="M980 336 Q 1040 326 1100 336" stroke="#a9a5b8" stroke-width="2.5" fill="none"/>';
    return s;
  }

  var SVG_LEC = svgWrap(
    '<defs>' +
    '<linearGradient id="cmzCoat2" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dddbe6"/></linearGradient>' +
    '</defs>' +
    '<g class="cam">' +
    '<rect width="1600" height="900" fill="#fafafa"/>' +
    '<rect y="716" width="1600" height="184" fill="#efeff2"/>' +
    '<line x1="0" y1="716" x2="1600" y2="716" stroke="#dcdce2" stroke-width="2"/>' +
    /* whiteboard */
    '<rect x="360" y="90" width="880" height="450" rx="8" fill="#ffffff" stroke="#c9c9d1" stroke-width="5"/>' +
    '<rect x="360" y="540" width="880" height="12" fill="#dcdce2"/>' +
    '<g>' + buildBoardContent() + '</g>' +
    /* lectern */
    '<g>' +
    '<polygon points="920,560 1120,560 1150,716 890,716" fill="#b3a08a"/>' +
    '<rect x="905" y="546" width="230" height="18" rx="4" fill="#8f7c66"/>' +
    '</g>' +
    /* scientist — SAME man as scene 2: bald, glasses, beard, white coat */
    '<g id="cmzLect">' +
    '<path d="M946 560 L 952 464 C 954 424, 984 402, 1020 400 C 1056 402, 1086 424, 1088 464 L 1094 560 Z" fill="url(#cmzCoat2)" stroke="#c9c9d1" stroke-width="2"/>' +
    '<path d="M1000 404 L 992 470 M 1040 404 L 1048 470" stroke="#c9c9d1" stroke-width="2" fill="none"/>' +
    '<path d="M1006 402 L 1020 424 L 1034 402 L 1027 398 L 1013 398 Z" fill="#cfe0f0"/>' +
    /* bald head */
    '<circle cx="1020" cy="352" r="46" fill="#e0c4a4"/>' +
    '<ellipse cx="975" cy="356" rx="7" ry="11" fill="#d4b493"/>' +
    '<ellipse cx="1065" cy="356" rx="7" ry="11" fill="#d4b493"/>' +
    '<path d="M988 322 C 1000 316, 1040 316, 1052 322" stroke="#d4b493" stroke-width="3" fill="none" opacity=".6"/>' +
    /* brows — calm this time */
    '<path id="cmzBrL" d="M994 336 Q 1004 332 1014 336" stroke="#b9977a" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
    '<path id="cmzBrR" d="M1028 336 Q 1038 332 1048 336" stroke="#b9977a" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
    /* eyes behind CLEAR glasses (the reveal: there was a person in there) */
    '<ellipse cx="1004" cy="350" rx="7" ry="5" fill="#fff"/>' +
    '<ellipse cx="1038" cy="350" rx="7" ry="5" fill="#fff"/>' +
    '<circle cx="1005" cy="351" r="3" fill="#32303f"/>' +
    '<circle cx="1039" cy="351" r="3" fill="#32303f"/>' +
    '<g id="cmzLid" transform="translate(1038 350) scale(1 0)">' +
    '<ellipse cx="0" cy="0" rx="8.5" ry="6.5" fill="#e0c4a4"/>' +
    '<path d="M-8 1 Q 0 4 8 1" stroke="#c8a380" stroke-width="1.4" fill="none"/>' +
    '</g>' +
    /* glasses — thin, clear */
    '<circle cx="1004" cy="350" r="12" fill="none" stroke="#32303f" stroke-width="2.5"/>' +
    '<circle cx="1038" cy="350" r="12" fill="none" stroke="#32303f" stroke-width="2.5"/>' +
    '<line x1="1016" y1="350" x2="1026" y2="350" stroke="#32303f" stroke-width="2.5"/>' +
    '<path d="M992 348 L 976 346 M 1050 348 L 1064 346" stroke="#32303f" stroke-width="2"/>' +
    /* nose */
    '<path d="M1021 354 L 1024 368 L 1017 370" stroke="#c8a380" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    /* neat beard w/ sly mouth line inside */
    '<path d="M978 362 C 980 384, 992 398, 1020 400 C 1048 398, 1060 384, 1062 362 C 1052 374, 1038 380, 1020 380 C 1002 380, 988 374, 978 362 Z" fill="#cfccda"/>' +
    '<path id="cmzMouth" d="M1008 388 Q 1020 393 1032 388" stroke="#8a8798" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
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

    /* rain: white noise → highpass; gain ramped continuously in tick */
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

    /* laboratory ambience (scene 2): machine thrum + riser */
    var thr = ctx.createOscillator(); thr.type = 'sawtooth'; thr.frequency.value = 55;
    var thrLP = ctx.createBiquadFilter(); thrLP.type = 'lowpass'; thrLP.frequency.value = 130;
    var thrG = ctx.createGain(); thrG.gain.value = 0;
    thr.connect(thrLP); thrLP.connect(thrG); thrG.connect(master); thr.start();
    a.thrG = thrG;

    var riserBP = ctx.createBiquadFilter(); riserBP.type = 'bandpass';
    riserBP.frequency.value = 300; riserBP.Q.value = 2.2;
    var riserG = ctx.createGain(); riserG.gain.value = 0;
    loopSrc(WHITE).connect(riserBP); riserBP.connect(riserG); riserG.connect(master);
    a.riserG = riserG;
    a.riser = function (secs, peak) {           /* tension swell into the cut */
      var t0 = ctx.currentTime;
      riserBP.frequency.cancelScheduledValues(t0);
      riserBP.frequency.setValueAtTime(300, t0);
      riserBP.frequency.exponentialRampToValueAtTime(2800, t0 + secs);
      riserG.gain.cancelScheduledValues(t0);
      riserG.gain.setValueAtTime(0.0001, t0);
      riserG.gain.exponentialRampToValueAtTime(peak, t0 + secs);
    };

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

    /* the 19s strike — a real thunderclap, not a laser:
       instant full-band CRACK + sub thump + long rumble */
    a.clap = function () {
      var t0 = ctx.currentTime;
      var s = ctx.createBufferSource(); s.buffer = WHITE;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.9, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      s.connect(g); g.connect(master); s.start(t0); s.stop(t0 + 0.4);
      var sub = ctx.createOscillator(); sub.type = 'sine';
      sub.frequency.setValueAtTime(95, t0);
      sub.frequency.exponentialRampToValueAtTime(36, t0 + 0.4);
      var sg = ctx.createGain();
      sg.gain.setValueAtTime(0.6, t0);
      sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      sub.connect(sg); sg.connect(master); sub.start(t0); sub.stop(t0 + 0.6);
      a.thunder(1.0, true);
    };

    a.crackle = function () {
      var t0 = ctx.currentTime;
      var s = ctx.createBufferSource(); s.buffer = WHITE;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3200;
      var g = ctx.createGain();
      g.gain.setValueAtTime(rnd(0.05, 0.16), t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + rnd(0.03, 0.09));
      s.connect(hp); hp.connect(g); g.connect(master);
      s.start(t0); s.stop(t0 + 0.12);
    };

    /* bubbling glassware blip (scene-2 ambience, called from tick) */
    a.blip = function () {
      var t0 = ctx.currentTime;
      var o = ctx.createOscillator(); o.type = 'sine';
      var f = rnd(280, 820);
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * rnd(1.3, 1.9), t0 + 0.09);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(rnd(0.03, 0.07), t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      o.connect(lp); lp.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.16);
    };

    /* mad laughter — caricature synthesis, now loud enough to matter:
       3 voices, formant bandpasses, and the hum DUCKS underneath it */
    a.laugh = function () {
      var t0all = ctx.currentTime;
      /* duck the hum so the laugh owns the moment */
      var hv = humG.gain.value;
      if (hv > 0.01) {
        humG.gain.cancelScheduledValues(t0all);
        humG.gain.setValueAtTime(hv, t0all);
        humG.gain.linearRampToValueAtTime(hv * 0.25, t0all + 0.12);
        humG.gain.linearRampToValueAtTime(hv, t0all + 1.9);
      }
      var v;
      for (v = 0; v < 3; v++) {
        var t0 = t0all + v * 0.11 + rnd(0, 0.04);
        var f0 = rnd(180, 280) * (v === 1 ? 0.78 : 1) * (v === 2 ? 1.12 : 1);
        var o = ctx.createOscillator(); o.type = 'sawtooth';
        var vib = ctx.createOscillator(), vibG = ctx.createGain();
        vib.frequency.value = 6.4; vibG.gain.value = 12;
        vib.connect(vibG); vibG.connect(o.frequency); vib.start(t0);
        var f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 780; f1.Q.value = 4;
        var f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1280; f2.Q.value = 5;
        var g = ctx.createGain(); g.gain.value = 0;
        o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(master);
        var nb = 7 + Math.floor(rnd(0, 3)), dt = 0.15, tt = t0, i;
        for (i = 0; i < nb; i++) {
          o.frequency.setValueAtTime(f0 * (1 + 0.09 * Math.sin(i * 1.7)) * (1 - i * 0.018), tt);
          g.gain.setValueAtTime(0.0001, tt);
          g.gain.exponentialRampToValueAtTime(0.42, tt + 0.028);
          g.gain.exponentialRampToValueAtTime(0.0001, tt + dt * 0.82);
          tt += dt * (1 - i * 0.02);
        }
        o.start(t0); o.stop(tt + 0.3); vib.stop(tt + 0.3);
      }
    };

    /* paper rustle (lecture hall) */
    a.rustle = function () {
      var t0 = ctx.currentTime;
      var s = ctx.createBufferSource(); s.buffer = WHITE;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = rnd(2000, 3200); bp.Q.value = 0.8;
      var g = ctx.createGain(); g.gain.value = 0;
      s.connect(bp); bp.connect(g); g.connect(master);
      var tt = t0, i, n = 3 + Math.floor(rnd(0, 3));
      for (i = 0; i < n; i++) {
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.exponentialRampToValueAtTime(rnd(0.02, 0.05), tt + rnd(0.04, 0.09));
        g.gain.exponentialRampToValueAtTime(0.0001, tt + rnd(0.18, 0.3));
        tt += rnd(0.2, 0.38);
      }
      s.start(t0); s.stop(tt + 0.4);
    };

    /* singing bowl / gong — additive inharmonic partials, long decay */
    a.bowl = function () {
      var t0 = ctx.currentTime;
      var f0 = 328;
      var partials = [
        [1.0, 0.42, 7.5], [2.76, 0.24, 6.0], [5.40, 0.11, 4.4], [8.93, 0.05, 3.0]
      ];
      partials.forEach(function (p) {
        [0, 1.4].forEach(function (beat) {
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
      var s = ctx.createBufferSource(); s.buffer = WHITE;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = f0 * 3; bp.Q.value = 2;
      var g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.22, t0);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      s.connect(bp); bp.connect(g2); g2.connect(master);
      s.start(t0); s.stop(t0 + 0.12);
    };

    a.cutAll = function () {
      var t0 = ctx.currentTime;
      [windG, rainG, pulseG, humG, roomG, thrG, riserG].forEach(function (g) {
        g.gain.cancelScheduledValues(t0);
        g.gain.setValueAtTime(g.gain.value, t0);
        g.gain.linearRampToValueAtTime(0, t0 + 0.06);
      });
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
      '<div class="cmz-tr-btncard"><div class="big">CLAUDEMONZTER</div>' +
      '<div class="tag">A MULTI-AGENT AI LAB · EVOLVING IN PUBLIC</div></div>' +
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
      vig: root.querySelector('.cmz-tr-vig'),
      white: root.querySelector('.cmz-tr-white'),
      btncard: root.querySelector('.cmz-tr-btncard'),
      card: root.querySelector('.cmz-tr-card'),
      wm: root.querySelector('.cmz-tr-wm'),
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
    if (document.hidden) {
      st.pausedAt = performance.now();
      if (st.audio && st.audio.ok) st.audio.suspend();
    }
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
      { t: 1.2,  fn: A(function (a) { a.thunder(0.3, true); }) },
      /* rain fades in at 3.2 and RAMPS continuously in tick() until 12 */
      { t: 3.2,  fn: A(function (a) { rampGain(a, 'rainG', 0.012, 1.5); }) },
      /* first strike waits for the card — punctuates "idea." */
      { t: 8.1,  fn: A(function (a) { a.thunder(0.85, true); }), flash: 'ext' },
      { t: 10.6, fn: A(function (a) { a.thunder(0.55, true); }), flash: 'ext' },
      { t: 12.0, fn: A(function (a) {
          rampGain(a, 'windG', 0.10, 1.2); rampGain(a, 'rainG', 0.02, 1.2);
          rampGain(a, 'pulseG', 0.12, 2.0); }) },
      { t: 15.5, fn: A(function (a) { a.thunder(0.45, true); }), flash: 'lab' },
      { t: 19.0, fn: A(function (a) { a.clap(); }) },
      { t: 20.0, fn: A(function (a) {
          rampGain(a, 'windG', 0, 0.4); rampGain(a, 'rainG', 0, 0.4);
          rampGain(a, 'pulseG', 0, 0.4);
          rampGain(a, 'humG', 0.22, 1.0);
          rampGain(a, 'thrG', 0.06, 1.5); }) },
      /* aftershocks — the reveal keeps flashing */
      { t: 20.4, fn: A(function (a) { a.thunder(0.5, false); }), flash: 'neon' },
      { t: 21.3, fn: A(function (a) { a.thunder(0.4, false); }), flash: 'neon' },
      { t: 24.6, fn: A(function (a) { a.thunder(0.3, false); }), flash: 'neon' },
      { t: 27.5, fn: A(function (a) {
          rampGain(a, 'humG', 0.34, 2.5); rampGain(a, 'thrG', 0.1, 2.5); }) },
      /* riser: 3.5s of tension into the white collapse */
      { t: 29.5, fn: A(function (a) { a.riser(3.4, 0.3); }) },
      /* the laughter lives in the close-up */
      { t: 30.7, fn: A(function (a) { a.laugh(); }) },
      { t: 31.9, fn: A(function (a) { a.laugh(); }) },
      { t: 33.0, fn: A(function (a) { a.cutAll(); }) },
      { t: 34.5, fn: A(function (a) { rampGain(a, 'roomG', 0.03, 2); }) },
      { t: 35.5, fn: A(function (a) { a.rustle(); }) },
      { t: 38.2, fn: A(function (a) { a.rustle(); }) },
      { t: 40.8, fn: A(function (a) { a.rustle(); }) },
      { t: 42.4, fn: A(function (a) { a.rustle(); }) },
      { t: 43.35, fn: A(function (a) { a.bowl(); }) },
      { t: 44.6, fn: A(function (a) { rampGain(a, 'roomG', 0, 0.3); }) }
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

    /* rain intensity ramps light → heavy across the exterior scene */
    if (st.audio && st.audio.ok && t >= 3.5 && t < 12) {
      st.audio.rainG.gain.value = lerp(0.012, 0.07, seg(t, 4, 12));
    }
    /* bubbling glassware, scene 2 */
    if (st.audio && st.audio.ok && t >= 20 && t < 33 && Math.random() < 0.045) {
      st.audio.blip();
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
      if (!REDUCED) {
        var sAmp = 6 * (1 - seg(t, 19, 19.7));
        if (sAmp > 0.3) st.el.shake.style.transform =
          'translate(' + rnd(-sAmp, sAmp).toFixed(1) + 'px,' + rnd(-sAmp, sAmp).toFixed(1) + 'px)';
      }
    } else if (t < TL.white[0]) {
      setScene(st, 'neon');
      neonTick(st, t);
    } else if (t < TL.lecture[0]) {
      setScene(st, 'lec');
      el.shake.style.transform = '';
      cam(st, 'lec', 1, 1020, 352);
    } else if (t < TL.button[0]) {
      setScene(st, 'lec');
      var p3 = easeInOut(seg(t, TL.lecture[0], 41.5));
      cam(st, 'lec', lerp(1, REDUCED ? 1.8 : 2.9, p3), 1020, 352);
      winkTick(st, t);
    } else {
      /* black title button */
      Object.keys(el.scenes).forEach(function (k) { el.scenes[k].classList.remove('on'); });
      st.sceneKey = 'button';
      el.root.classList.remove('lit');
    }
    el.btncard.style.opacity = t >= TL.button[0] ? '1' : '0';

    /* white flash layer: strike strobe (19) + collapse (33) */
    var wOp = 0;
    if (!REDUCED) {
      if (t >= 19 && t < 20) {
        var sp = t - 19;
        for (i = 0; i < STROBE.length; i++)
          if (sp >= STROBE[i][0] && sp < STROBE[i][1]) { wOp = 1; break; }
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

    /* vignette: heavy gothic, half neon, gone in the light */
    el.vig.style.opacity = t < 20 ? '1' : (t < 33 ? '0.55' : String(0.55 * (1 - seg(t, 33, 34.5))));

    /* corner wordmark: crossfade 34–38, hidden once the button card owns it */
    el.wm.style.opacity = t >= TL.button[0] ? '0' : '1';
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
    var A = q(st, 'neon', '#cmzPhA'), B = q(st, 'neon', '#cmzPhB'), C = q(st, 'neon', '#cmzPhC');
    var phase = t < 27 ? 0 : (t < 30.5 ? 1 : 2);
    if (A) A.setAttribute('opacity', phase === 0 ? '1' : '0');
    if (B) B.setAttribute('opacity', phase === 1 ? '1' : '0');
    if (C) C.setAttribute('opacity', phase === 2 ? '1' : '0');

    if (phase === 0) {
      ['#cmzCab1', '#cmzCab2', '#cmzCab3'].forEach(function (id, k) {
        var c = q(st, 'neon', id);
        if (c) c.setAttribute('stroke-dashoffset', String(-t * (40 + k * 22)));
      });
      var tr = q(st, 'neon', '#cmzTrace');
      if (tr) tr.setAttribute('opacity', String(0.5 + 0.5 * Math.abs(Math.sin(t * 5))));
      var eye = q(st, 'neon', '#cmzEye');
      if (eye) eye.setAttribute('r', String(8 + 2.4 * Math.abs(Math.sin(t * 3.4))));
      /* aftershock shakes on the reveal */
      if (!REDUCED) {
        var amp = 0;
        st.flashes.forEach(function (fl) {
          if (fl.scene === 'neon' && t - fl.t0 < 0.35) amp = Math.max(amp, 5 * (1 - (t - fl.t0) / 0.35));
        });
        st.el.shake.style.transform = amp > 0.3 ?
          'translate(' + rnd(-amp, amp).toFixed(1) + 'px,' + rnd(-amp, amp).toFixed(1) + 'px)' : '';
      }
    } else if (phase === 1) {
      var ph = (t - 27) % 1.2, throwP = ph < 0.3 ? easeOut(ph / 0.3) : 1;
      var sw = Math.floor((t - 27) / 1.2) % 3;
      ['#cmzSw1', '#cmzSw2', '#cmzSw3'].forEach(function (id, k) {
        var l = q(st, 'neon', id), px = 960 + k * 130;
        if (!l) return;
        var ang = (k < sw || (k === sw && throwP === 1)) ? 52 : (k === sw ? lerp(-38, 52, throwP) : -38);
        l.setAttribute('transform', 'rotate(' + ang + ' ' + px + ' 640)');
      });
      var arm = q(st, 'neon', '#cmzArm');
      if (arm) arm.setAttribute('transform', 'rotate(' + (-18 + 26 * throwP) + ' 780 600)');
      if (!REDUCED) {
        var s1 = 3.5 * (0.4 + 0.6 * seg(t, 27, 30.5));
        st.el.shake.style.transform =
          'translate(' + rnd(-s1, s1).toFixed(1) + 'px,' + rnd(-s1, s1).toFixed(1) + 'px)';
      }
    } else {
      /* close-up: manic head bob, mouth heaving with laughter */
      var hd = q(st, 'neon', '#cmzCuHead');
      if (hd && !REDUCED) hd.setAttribute('transform',
        'rotate(' + (1.8 * Math.sin(t * 11)).toFixed(2) + ' 800 430) translate(0 ' + (4 * Math.sin(t * 9)).toFixed(1) + ')');
      var mo = q(st, 'neon', '#cmzCuMouth');
      if (mo) mo.setAttribute('transform',
        'translate(0 ' + (3 * Math.abs(Math.sin(t * 9))).toFixed(1) + ')');
      if (!REDUCED) {
        var s2 = 4 + 3 * seg(t, 30.5, 33);
        st.el.shake.style.transform =
          'translate(' + rnd(-s2, s2).toFixed(1) + 'px,' + rnd(-s2, s2).toFixed(1) + 'px)';
      }
    }
    if (t >= 33 - 0.02) st.el.shake.style.transform = '';
  }

  function winkTick(st, t) {
    var lid = q(st, 'lec', '#cmzLid'), br = q(st, 'lec', '#cmzBrR'), m = q(st, 'lec', '#cmzMouth');
    if (!lid) return;
    var w = 0;
    if (t >= 43.3 && t < 43.45) w = seg(t, 43.3, 43.45);
    else if (t >= 43.45 && t < 43.75) w = 1;
    else if (t >= 43.75 && t < 43.95) w = 1 - seg(t, 43.75, 43.95);
    lid.setAttribute('transform', 'translate(1038 350) scale(1 ' + w.toFixed(3) + ')');
    if (br) br.setAttribute('transform', 'translate(0 ' + (2.5 * w).toFixed(2) + ')');
    if (m && t >= 43.3 && !st.slySet) {
      st.slySet = true;
      m.setAttribute('d', 'M1008 388 Q 1020 394 1034 386');
    }
  }

  /* ── canvas effects: grain, rain, bolts, particles, arcs, glints ── */
  function drawFx(st, t) {
    var g = st.g, w = st.w, h = st.h, i;
    g.clearRect(0, 0, w, h);
    if (REDUCED) return;

    /* film grain */
    var grainA = t < 19 ? 0.10 : (t < 33 ? 0.05 : 0);
    if (grainA > 0) {
      var n = MOBILE ? 90 : 220;
      for (i = 0; i < n; i++) {
        var v = Math.floor(rnd(60, 220));
        g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + grainA + ')';
        g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 2.6), rnd(1, 2.6));
      }
      if (t < 19 && Math.random() < 0.06) {
        g.strokeStyle = 'rgba(220,220,228,.16)';
        g.beginPath(); var sx = rnd(0, w);
        g.moveTo(sx, 0); g.lineTo(sx + rnd(-12, 12), h); g.stroke();
      }
    }

    /* rain streaks — intensity ramps with the storm */
    if (t >= 3 && t < 12) {
      var rp = seg(t, 3.5, 12);
      g.strokeStyle = 'rgba(200,200,214,' + (0.12 + 0.26 * rp) + ')'; g.lineWidth = 1;
      var rn = Math.round((MOBILE ? 40 : 120) * (0.2 + 0.8 * rp));
      var rv = 900 + 700 * rp;
      for (i = 0; i < rn; i++) {
        var rx = ((i * 137 + t * rv) % (w + 80)) - 40;
        var ry = (i * 89 + t * (rv + 400)) % h;
        g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 7, ry + 14 + 10 * rp); g.stroke();
      }
    }

    /* scheduled flashes */
    st.flashes = st.flashes.filter(function (fl) { return t - fl.t0 < 0.6; });
    st.flashes.forEach(function (fl) {
      var age = t - fl.t0;
      if (fl.scene === 'ext') {
        if (age < 0.12) {
          g.fillStyle = 'rgba(238,238,246,' + (0.55 * (1 - age / 0.12)) + ')';
          g.fillRect(0, 0, w, h);
        }
        if (age < 0.2) bolt(g, w * rnd(0.25, 0.75), 0, w * 0.55, h * 0.45, '#e8e6ee', 2, 0.9);
      } else if (fl.scene === 'neon') {
        /* aftershock: colored flash + bolt into the creature */
        if (age < 0.14) {
          g.fillStyle = 'rgba(200,220,255,' + (0.4 * (1 - age / 0.14)) + ')';
          g.fillRect(0, 0, w, h);
        }
        if (age < 0.28) {
          bolt(g, w * rnd(0.35, 0.65), 0, w * 0.5, h * 0.52, '#8dd9ff', 3, 0.95);
          if (Math.random() < 0.5) bolt(g, w * rnd(0.3, 0.7), 0, w * 0.5, h * 0.52, '#ff6ec7', 1.6, 0.7);
        }
      }
    });

    /* the 19s strike: forked main bolt into the table */
    if (t >= 19 && t < 19.6) {
      bolt(g, w * 0.5, 0, w * 0.505, h * 0.66, '#8dd9ff', 4.5, 1);
      bolt(g, w * 0.47, 0, w * 0.5, h * 0.66, '#ff6ec7', 2.4, 0.8);
      bolt(g, w * 0.52, h * 0.2, w * 0.62, h * 0.5, '#e8e6ee', 1.6, 0.7);
    }

    /* sheet-dissolve particles */
    if (t >= 20 && t < 20.05 && !st.partsSpawned) {
      st.partsSpawned = true;
      var pn = MOBILE ? 110 : 300;
      for (i = 0; i < pn; i++) st.parts.push({
        x: w * rnd(0.38, 0.62), y: h * rnd(0.42, 0.72),
        vx: rnd(-50, 50), vy: rnd(-170, -40), life: rnd(1.4, 3.6),
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

    /* arc generators, wide shot (27–30.5) */
    if (t >= 27 && t < 30.5) {
      var ax = w * (181 / 1600), ay = h * (340 / 900);
      var bx = w * (441 / 1600), by = h * (280 / 900);
      bolt(g, ax, ay, bx, by, '#8dd9ff', 2.6, 0.95);
      if (Math.random() < 0.5) bolt(g, ax, ay, bx, by, '#ff6ec7', 1.4, 0.7);
      if (Math.random() < 0.3)
        bolt(g, bx, by, w * rnd(0.5, 0.8), h * rnd(0.2, 0.5), '#c2ff3d', 1.2, 0.5);
      if (st.audio && st.audio.ok && Math.random() < 0.22) st.audio.crackle();
      for (i = 0; i < 3; i++) {
        g.fillStyle = 'rgba(255,255,255,.8)';
        g.fillRect(bx + rnd(-30, 30), by + rnd(-20, 20), 2, 2);
      }
    }

    /* close-up (30.5–33): the arcs live IN the lenses now */
    if (t >= 30.5 && t < 33) {
      for (i = 0; i < LENS.length; i++) {
        var lx = w * LENS[i][0], ly = h * LENS[i][1], lr = h * LENS_R * 0.86;
        g.save();
        g.beginPath(); g.arc(lx, ly, lr, 0, Math.PI * 2); g.clip();
        var b;
        for (b = 0; b < 3; b++) {
          var a0 = rnd(0, Math.PI * 2), a1 = a0 + rnd(1.5, 3.5);
          bolt(g,
            lx + Math.cos(a0) * lr, ly + Math.sin(a0) * lr,
            lx + Math.cos(a1) * lr * rnd(0.2, 0.9), ly + Math.sin(a1) * lr * rnd(0.2, 0.9),
            b === 1 ? '#ff6ec7' : '#8dd9ff', rnd(1.2, 2.2), rnd(0.6, 0.95));
        }
        g.restore();
      }
      /* stray arcs crawling the edges of frame */
      if (Math.random() < 0.4)
        bolt(g, rnd(0, w * 0.15), rnd(0, h), rnd(0, w * 0.2), rnd(0, h), '#8dd9ff', 1.4, 0.5);
      if (Math.random() < 0.4)
        bolt(g, w - rnd(0, w * 0.15), rnd(0, h), w - rnd(0, w * 0.2), rnd(0, h), '#ff6ec7', 1.4, 0.5);
      if (st.audio && st.audio.ok && Math.random() < 0.3) st.audio.crackle();
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
