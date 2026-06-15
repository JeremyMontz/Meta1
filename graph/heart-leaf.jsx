// heart-leaf.jsx — The journal leaf for /graph/heart.html
// One entry rendered as a contemplative spread:
//   left = head + clipping (the received quote)
//   right = Phil's hand (the response)
// Collapses to single-page stacked under 820px.
//
// Surface is fixed to "evoke" (clean: no paper grain, no ruled lines, no
// drop cap, no gold flourish) — Heart's deliberate v1 choice per the
// handoff. The tweaks panel from the prototype is not shipped.

// ── Source-type → caption glyph ────────────────────────────────────────────
// Best-effort inference from the work field. Skill could write a sourceType
// column later; for now we look at the work text.
function inferSourceGlyph(entry) {
  var work = (entry.work || '').toLowerCase();
  if (!work && entry.attribution) return '✎';   // person-only
  if (/\b(bhagavad|upani|qur|bible|gita|sutta|psalm|sutra|veda|tao te|enchiridion|meditation|confess|invocation|scripture)/i.test(work)) {
    return '†';
  }
  if (entry.attribution) return '—';
  return '✎';
}

// ── Date formatting ────────────────────────────────────────────────────────
function formatLongDate(iso) {
  // 'YYYY-MM-DD' → 'Thursday · 28 May 2026'
  if (!iso) return '';
  var parts = iso.split('-');
  if (parts.length !== 3) return iso;
  var d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
  var weekday = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()];
  var month = ['January','February','March','April','May','June',
               'July','August','September','October','November','December'][d.getUTCMonth()];
  return weekday + ' · ' + d.getUTCDate() + ' ' + month + ' ' + d.getUTCFullYear();
}

function formatReceivedDate(iso) {
  // 'YYYY-MM-DD' → 'MAY 2026'
  if (!iso) return '';
  var parts = iso.split('-');
  if (parts.length !== 3) return '';
  var month = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][+parts[1] - 1];
  return month + ' ' + parts[0];
}

// ── LeafHead — date + "On <subtopic>." ─────────────────────────────────────
const StepArrow = ({ dir, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={dir === 'prev' ? 'Earlier entry' : 'Later entry'}
    style={{
      all: 'unset',
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'var(--font-mono)',
      fontSize: 20,
      lineHeight: 1,
      color: disabled ? 'var(--fg-faint)' : 'var(--candle)',
      opacity: disabled ? 0.3 : 1,
      padding: '2px 8px',
      transition: 'opacity 160ms',
    }}
  >
    {dir === 'prev' ? '\u2039' : '\u203A'}
  </button>
);

const LeafHead = ({ entry, onPrev, onNext, isToday, atOldest }) => (
  <div style={{ marginBottom: 30, textAlign: 'center' }}>
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    }}>
      <StepArrow dir="prev" onClick={onPrev} disabled={atOldest} />
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'var(--candle)',
      }}>
        {formatLongDate(entry.date)}
      </div>
      <StepArrow dir="next" onClick={onNext} disabled={isToday} />
    </div>
    <h2 style={{
      fontFamily: 'var(--font-display)',
      fontStyle: 'italic',
      fontSize: 'clamp(28px, 4vw, 44px)',
      lineHeight: 1.08,
      fontVariationSettings: '"opsz" 72',
      color: 'var(--fg)',
      margin: 0,
      letterSpacing: '-0.012em',
    }}>
      <span style={{
        fontStyle: 'normal',
        fontSize: '0.62em',
        color: 'var(--fg-subtle)',
        marginRight: '0.35em',
        fontVariationSettings: '"opsz" 36',
      }}>On</span>
      {entry.subtopic || 'the matter at hand'}
      <span style={{ color: 'var(--candle)' }}>.</span>
    </h2>
  </div>
);

// ── Clipping — the received quote, pale aged-paper card on the dark page ──
const Clipping = ({ entry }) => {
  var glyph = inferSourceGlyph(entry);

  return (
    <figure style={{
      margin: 0,
      background: '#e7dcc8',
      color: '#241c16',
      padding: 'clamp(22px, 2.6vw, 34px) clamp(22px, 2.6vw, 34px) clamp(20px, 2.4vw, 30px)',
      border: '1px solid rgba(210,196,166,0.55)',
      boxShadow: '0 12px 34px -18px rgba(0,0,0,0.75), 0 2px 0 rgba(255,255,255,0.18) inset',
      borderRadius: 2,
      position: 'relative',
    }}>
      {/* "RECEIVED — MAY 2026" caption row */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9.5,
        letterSpacing: '0.26em',
        color: '#8a795a',
        textTransform: 'uppercase',
        marginBottom: 18,
      }}>
        Quote selected at random
      </div>

      {/* The quote */}
      <blockquote style={{
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 'clamp(19px, 2.4vw, 26px)',
        lineHeight: 1.42,
        fontVariationSettings: '"opsz" 48',
        color: '#2c2218',
        position: 'relative',
        padding: '0 6px',
      }}>
        <span style={{
          position: 'absolute',
          left: -8,
          top: -18,
          color: '#9a7b3c',
          fontSize: '2.1em',
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
          opacity: 0.55,
        }}>“</span>
        {entry.quote}
        <span style={{
          color: '#9a7b3c',
          fontSize: '1.4em',
          marginLeft: 2,
          opacity: 0.55,
          lineHeight: 0,
          verticalAlign: '-0.05em',
        }}>”</span>
      </blockquote>

      {/* Attribution caption */}
      <figcaption style={{
        marginTop: 22,
        paddingTop: 14,
        borderTop: '1px solid rgba(138,121,90,0.45)',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 14,
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 600,
          color: '#2c2218',
          whiteSpace: 'nowrap',
          fontVariationSettings: '"opsz" 36',
        }}>
          {entry.attribution || '—'}
        </span>
        {entry.work && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.16em',
            color: '#8a795a',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
          }}>
            <span style={{ color: '#9a7b3c', fontSize: 12 }}>{glyph}</span>
            {entry.work}
          </span>
        )}
      </figcaption>
    </figure>
  );
};

// ── PhilHand — the response side ───────────────────────────────────────────
const PhilHand = ({ entry }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 26,
    paddingTop: 'clamp(20px, 2.4vw, 32px)',
  }}>
    {/* "✐ in reply" label */}
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.26em',
      color: 'var(--candle)',
      textTransform: 'uppercase',
    }}>
      ✐ Phil's reply
    </div>

    {/* Phil's response body */}
    <div style={{
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(15px, 1.6vw, 18px)',
      lineHeight: 1.62,
      fontVariationSettings: '"opsz" 36',
      color: 'var(--fg)',
      whiteSpace: 'pre-wrap',
    }}>
      {entry.response}
    </div>

    {/* Sign-off row */}
    <div style={{
      marginTop: 12,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.22em',
        color: 'var(--fg-subtle)',
        textTransform: 'uppercase',
      }}>
        the philosopher · in residence
      </span>
      <span style={{
        fontFamily: 'var(--font-hand)',
        fontWeight: 700,
        fontSize: 46,
        lineHeight: 1,
        color: 'var(--candle)',
        transform: 'rotate(-4deg)',
        textShadow: '0 0 14px color-mix(in oklch, var(--candle) 40%, transparent)',
      }}>
        Phil
      </span>
    </div>
  </div>
);

// ── HeartLeaf — the whole leaf (spread or single) ─────────────────────────
const HeartLeaf = ({ entry, layout, turning, onPrev, onNext, isToday, atOldest }) => {
  // layout: 'spread' (default, two facing pages) | 'single'
  // turning: '' | 'out-next' | 'in-next' | 'out-prev' | 'in-prev'
  if (!entry) return null;

  var isSpread = layout === 'spread';

  return (
    <div className={'heart-leaf ' + (turning ? 'turning ' + turning : '')} style={{
      width: isSpread ? 'min(100%, 1080px)' : 'min(100%, 760px)',
      margin: '0 auto',
      perspective: 2200,
      transformStyle: 'preserve-3d',
    }}>
      <div className="heart-leaf-bleed" style={{
        position: 'relative',
        background: 'radial-gradient(110% 60% at 50% 0%, color-mix(in oklch, var(--candle) 9%, transparent), transparent 70%), linear-gradient(168deg, #1c1524, #150f1d 60%, #110b18)',
        border: '1px solid #2c2138',
        borderRadius: 2,
        boxShadow: '0 24px 80px -28px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.02) inset',
        padding: 'clamp(24px, 3vw, 40px) clamp(24px, 3.2vw, 46px) clamp(26px, 3vw, 40px)',
        opacity: 1, // never fade — page goes edge-on during flip, naturally invisible at ±88°
        transformOrigin: 'center center',
        transition: 'none',
      }}>
        {isSpread ? (
          <>
            <LeafHead entry={entry} onPrev={onPrev} onNext={onNext} isToday={isToday} atOldest={atOldest} />
            <div className="heart-spread" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1px 1fr',
              gap: 'clamp(24px, 3vw, 44px)',
              alignItems: 'start',
            }}>
              <div>
                <Clipping entry={entry} />
              </div>
              {/* Spine gutter */}
              <div style={{
                alignSelf: 'stretch',
                background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.35), transparent)',
                width: 1,
              }} />
              <div>
                <PhilHand entry={entry} />
              </div>
            </div>
          </>
        ) : (
          <div>
            <LeafHead entry={entry} onPrev={onPrev} onNext={onNext} isToday={isToday} atOldest={atOldest} />
            <div style={{ marginBottom: 32 }}>
              <Clipping entry={entry} />
            </div>
            {/* Ornamental bridge */}
            <div style={{
              height: 1,
              background: 'linear-gradient(to right, transparent, color-mix(in oklch, var(--candle) 40%, transparent), transparent)',
              margin: '0 auto 32px',
              maxWidth: 220,
            }} />
            <PhilHand entry={entry} />
          </div>
        )}
      </div>
    </div>
  );
};
