// journal-cloud.jsx — Ink-spatter word cloud for /agents/phil/journal.html
//
// Reads from heartWordCounts(entries) (defined in graph/heart-data.js),
// takes the top 36 words, lays them out on an Archimedean spiral inside a
// fixed 920×540 coordinate box, then CSS-scales that box to fit the viewport.
//
// Behind the words: an SVG ink stain (radial violet pool + blurred droplets
// + faint gold candlelight rim).
//
// If onWord is provided, words render as buttons; clicking emits the word.

const CLOUD_W = 920;
const CLOUD_H = 540;
const MAX_WORDS = 36;

// Measure a word's pixel width at a given size using canvas 2D.
// Memoized per (word, size) to keep it cheap during layout.
const measureCache = new Map();
function measureWord(ctx, word, size) {
  var key = word + '@' + size;
  if (measureCache.has(key)) return measureCache.get(key);
  ctx.font = 'italic 600 ' + size + 'px Fraunces, Georgia, serif';
  var w = ctx.measureText(word).width;
  measureCache.set(key, w);
  return w;
}

// Archimedean spiral, vertically squashed for elliptical sweep.
function* spiralPositions(cx, cy) {
  // step ~3px; squash y by 0.6 for elliptical shape
  var step = 3;
  var t = 0;
  while (t < 10000) {
    var r = step * Math.sqrt(t);
    var theta = t * 0.18;
    yield {
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta) * 0.6,
    };
    t += 1;
  }
}

// AABB overlap test, with padding
function overlaps(a, b, pad) {
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  );
}

// Word color tier by rank
function rankStyle(rank, total) {
  if (rank < 3) {
    return {
      color: 'var(--candle)',
      fontWeight: 700,
      textShadow: '0 0 16px color-mix(in oklch, var(--candle) 50%, transparent)',
    };
  }
  if (rank < 10) return { color: 'var(--fg)', fontWeight: 600 };
  if (rank < 20) return { color: 'var(--accent)', fontWeight: 600 };
  return { color: 'var(--fg-subtle)', fontWeight: 500 };
}

// ── Ink-stain backdrop ────────────────────────────────────────────────────
const InkStain = () => (
  <svg
    viewBox={'0 0 ' + CLOUD_W + ' ' + CLOUD_H}
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
    }}
    aria-hidden="true"
  >
    <defs>
      <filter id="ink-blur">
        <feGaussianBlur stdDeviation="9" />
      </filter>
      <radialGradient id="violet-pool" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2a1850" stopOpacity="0.95" />
        <stop offset="65%" stopColor="#1a0d34" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#1a0d34" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="candle-rim" cx="50%" cy="50%" r="55%">
        <stop offset="60%" stopColor="#f5c56a" stopOpacity="0" />
        <stop offset="78%" stopColor="#f5c56a" stopOpacity="0.07" />
        <stop offset="100%" stopColor="#f5c56a" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Violet pool — multiple blurred ellipses */}
    <g filter="url(#ink-blur)">
      <ellipse cx={CLOUD_W * 0.5}  cy={CLOUD_H * 0.5} rx={CLOUD_W * 0.42} ry={CLOUD_H * 0.42} fill="url(#violet-pool)" />
      <ellipse cx={CLOUD_W * 0.43} cy={CLOUD_H * 0.46} rx={CLOUD_W * 0.22} ry={CLOUD_H * 0.30} fill="#2a1850" opacity="0.42" />
      <ellipse cx={CLOUD_W * 0.58} cy={CLOUD_H * 0.55} rx={CLOUD_W * 0.18} ry={CLOUD_H * 0.26} fill="#22113f" opacity="0.55" />
    </g>

    {/* Candlelight rim */}
    <ellipse cx={CLOUD_W * 0.5} cy={CLOUD_H * 0.5} rx={CLOUD_W * 0.48} ry={CLOUD_H * 0.48} fill="url(#candle-rim)" />

    {/* Droplet scatter */}
    {[
      [0.18, 0.30, 5], [0.22, 0.72, 4], [0.28, 0.18, 3], [0.34, 0.85, 6],
      [0.42, 0.10, 4], [0.50, 0.92, 5], [0.62, 0.12, 3], [0.66, 0.83, 4],
      [0.74, 0.22, 5], [0.80, 0.68, 4], [0.86, 0.38, 3], [0.90, 0.55, 5],
      [0.12, 0.50, 4], [0.94, 0.18, 3], [0.06, 0.78, 4],
    ].map(([fx, fy, r], i) => (
      <circle key={i} cx={CLOUD_W * fx} cy={CLOUD_H * fy} r={r} fill="#1d1038" opacity="0.55" />
    ))}
  </svg>
);

// ── Cloud body ────────────────────────────────────────────────────────────
const JournalCloud = ({ entries, activeWord, onWord }) => {
  const containerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  // Compute layout once per entries set
  const placed = React.useMemo(() => {
    if (!entries || entries.length === 0) return [];
    var counts = window.heartWordCounts(entries).slice(0, MAX_WORDS);
    if (counts.length === 0) return [];

    // Size mapping
    var maxC = counts[0].count;
    var minC = counts[counts.length - 1].count;
    var span = Math.max(1, maxC - minC);

    // Canvas for text measurement
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var boxes = [];
    counts.forEach(function (item, i) {
      var norm = (item.count - minC) / span;
      var size = Math.round(15 + Math.pow(norm, 0.72) * 42);
      var w = measureWord(ctx, item.word, size);
      var h = size * 1.05;
      var found = null;
      var gen = spiralPositions(CLOUD_W / 2, CLOUD_H / 2);
      for (var step = 0; step < 9999; step++) {
        var nx = gen.next();
        if (nx.done) break;
        var x = nx.value.x - w / 2;
        var y = nx.value.y - h / 2;
        // Bounds
        if (x < 6 || y < 6 || x + w > CLOUD_W - 6 || y + h > CLOUD_H - 6) continue;
        var candidate = { x: x, y: y, w: w, h: h };
        var collide = false;
        for (var b = 0; b < boxes.length; b++) {
          if (overlaps(candidate, boxes[b], 7)) { collide = true; break; }
        }
        if (!collide) { found = candidate; break; }
      }
      if (found) {
        boxes.push({ ...found, word: item.word, count: item.count, size: size, rank: i });
      }
    });

    return boxes;
  }, [entries]);

  // Fit-to-viewport scaling
  React.useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      var avail = containerRef.current.clientWidth;
      if (!avail) return;
      var s = Math.min(1, avail / CLOUD_W);
      setScale(s);
    }
    update();
    var ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Distance from center → opacity falloff
  function fadeFor(box) {
    var dx = (box.x + box.w / 2 - CLOUD_W / 2) / (CLOUD_W / 2);
    var dy = (box.y + box.h / 2 - CLOUD_H / 2) / (CLOUD_H / 2);
    var r = Math.min(1, Math.sqrt(dx * dx + dy * dy));
    return 0.55 + (1 - r) * 0.45;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        margin: '24px 0 8px',
        position: 'relative',
        minHeight: 200,
      }}
    >
      <div style={{
        width: CLOUD_W,
        height: CLOUD_H,
        position: 'relative',
        transform: 'scale(' + scale + ')',
        transformOrigin: 'top left',
        marginBottom: scale < 1 ? (CLOUD_H * scale - CLOUD_H) : 0,
      }}>
        <InkStain />
        {placed.map(function (box) {
          var s = rankStyle(box.rank, placed.length);
          var isActive = activeWord === box.word;
          var fade = fadeFor(box);
          var common = {
            position: 'absolute',
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: box.size,
            fontWeight: s.fontWeight,
            fontVariationSettings: '"opsz" ' + Math.min(144, Math.max(14, box.size + 8)),
            color: isActive ? 'var(--candle)' : s.color,
            opacity: isActive ? 1 : fade,
            textShadow: isActive ? '0 0 18px color-mix(in oklch, var(--candle) 65%, transparent)' : (s.textShadow || ''),
            transition: 'color 160ms, opacity 160ms, transform 160ms, text-shadow 160ms',
            cursor: onWord ? 'pointer' : 'default',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            zIndex: 2,
          };
          if (onWord) {
            // all: 'unset' MUST be first in the style object — React applies
            // inline styles in iteration order, and `all` would otherwise
            // wipe the position/sizing we just set. (Object spread keeps
            // existing keys in their original positions when re-assigned.)
            return (
              <button
                key={box.word}
                onClick={() => onWord(box.word)}
                style={{
                  all: 'unset',
                  ...common,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--candle)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = s.color;
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {box.word}
              </button>
            );
          }
          return <span key={box.word} style={common}>{box.word}</span>;
        })}
      </div>
    </div>
  );
};
