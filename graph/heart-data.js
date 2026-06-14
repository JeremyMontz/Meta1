/* ============================================================================
 * heart-data.js · CLAUDEMONZTER — "WISDOM OF THE DAY"
 * ----------------------------------------------------------------------------
 * The data layer for /graph/heart.html and /agents/phil/journal.html.
 *
 * Reads entries from the live "Phil-Journal" Google Sheet, tab "PhilLectio".
 * Schema (lectio-design.md v0.3 §6.1, 9 cols):
 *
 *   Timestamp, Entry Date, Page Ref, Subtopic,
 *   Attribution, Work, Quote, Response, Post Status
 *
 * Normalized entry shape (what callers see):
 *
 *   timestamp     ISO-ish string from GAS, may be empty
 *   date          'YYYY-MM-DD' (from "Entry Date" — newest = today)
 *   pageRef       int | null
 *   subtopic      string
 *   attribution   string  (person/voice; may be empty)
 *   work          string  (work title; may be empty)
 *   quote         string  (verbatim, guarded by skill)
 *   response      string  (Phil's response through the Map)
 *   postStatus    string  ('posted' | 'failed-...' | 'seed-...' | 'smoke-test')
 *
 * Public API:
 *   window.HEART_DATA.fetchEntries() → Promise<entry[]>  (newest-first)
 *   window.HEART_DATA.SHEET_ID, TAB, CSV_URL
 *   window.HEART_DATA.JOURNAL_URL, PHIL_PAGE_URL
 *   window.heartWordCounts(entries, opts) → [{word, count}]  (for journal cloud)
 *   window.HEART_STOPWORDS — Set<string>
 *   window.HEART_BLACKLIST — Set<string>  (editorial apparatus words)
 *   window.HEART_MONTHS — computed from entries by fetchEntries()
 * ========================================================================== */

(function () {
  'use strict';

  // ── Sheet config ────────────────────────────────────────────────────────────
  var SHEET_ID = '1N_Th9wJ0VRpCZfhuqs5tXCO35tlu1pjgCtPZIXZ_004';
  var TAB = 'PhilLectio';
  var CSV_URL =
    'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
    '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(TAB);

  // Link targets (used by chrome and footer)
  var JOURNAL_URL = '../agents/phil/journal.html';
  var PHIL_PAGE_URL = '../agents/phil/phil.html';

  // ── RFC-4180 CSV parser (single-pass, respects quoted newlines) ────────────
  // Replaces the prior line-split approach, which tore quoted fields containing
  // embedded newlines (e.g. multi-paragraph Responses) across physical lines and
  // shifted every subsequent column. See #217.
  function tokenizeCSV(text) {
    // Returns an array of records; each record is an array of field strings.
    // Quotes are consumed; escaped quotes ("") become a literal "; newlines
    // inside quoted fields are preserved.
    var records = [], row = [], cur = '', inQ = false;
    var s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (inQ) {
        if (c === '"') {
          if (s[i + 1] === '"') { cur += '"'; i++; }  // escaped quote ""
          else inQ = false;                            // closing quote
        } else { cur += c; }                           // newlines preserved here
      } else {
        if (c === '"') { inQ = true; }
        else if (c === ',') { row.push(cur); cur = ''; }
        else if (c === '\n') { row.push(cur); records.push(row); row = []; cur = ''; }
        else { cur += c; }
      }
    }
    if (cur !== '' || row.length > 0) { row.push(cur); records.push(row); }
    return records;
  }

  function parseCSV(text) {
    var records = tokenizeCSV(text).filter(function (r) {
      return r.length > 1 || (r.length === 1 && r[0] !== '');
    });
    if (records.length < 2) return { headers: [], rows: [] };
    var headers = records[0].map(function (h) { return h.trim(); });
    var rows = records.slice(1).map(function (cols) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = (cols[i] || '').trim(); });
      return obj;
    });
    return { headers: headers, rows: rows };
  }

  // ── Normalize raw row → entry ──────────────────────────────────────────────
  function normalize(row) {
    var pageRefRaw = row['Page Ref'];
    var pageRef = pageRefRaw === '' || pageRefRaw == null ? null : parseInt(pageRefRaw, 10);
    return {
      timestamp:   row['Timestamp']   || '',
      date:        row['Entry Date']  || '',
      pageRef:     isNaN(pageRef) ? null : pageRef,
      subtopic:    row['Subtopic']    || '',
      attribution: row['Attribution'] || '',
      work:        row['Work']        || '',
      quote:       row['Quote']       || '',
      response:    row['Response']    || '',
      postStatus:  row['Post Status'] || ''
    };
  }

  // ── Filter out smoke-test / failed rows from the live feed ─────────────────
  function isPublishable(entry) {
    if (!entry.date) return false;                    // must have a date
    if (!entry.quote) return false;                   // must have a quote
    if (!entry.response) return false;                // must have Phil's response
    if (entry.postStatus === 'smoke-test') return false;
    if (entry.postStatus && entry.postStatus.indexOf('failed') === 0) return false;
    return true;
  }

  // ── Public fetch ───────────────────────────────────────────────────────────
  function fetchEntries() {
    return fetch(CSV_URL, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('CSV fetch failed: ' + r.status);
        return r.text();
      })
      .then(function (text) {
        var parsed = parseCSV(text);
        var entries = parsed.rows.map(normalize).filter(isPublishable);
        // Newest first by entry_date desc (tiebreak: timestamp desc)
        entries.sort(function (a, b) {
          if (a.date < b.date) return 1;
          if (a.date > b.date) return -1;
          return (b.timestamp || '').localeCompare(a.timestamp || '');
        });
        return entries;
      });
  }

  // ── Word frequency (used by journal cloud) ─────────────────────────────────
  window.HEART_STOPWORDS = new Set((
    'the a an and or but if then else of to in on at by for with from into onto upon ' +
    'is are was were be been being am i me my mine myself we us our ours you your yours ' +
    'he him his she her it its they them their this that these those there here what which ' +
    'who whom whose when where why how all any both each few more most other some such no ' +
    'nor not only own same so than too very can will just dont should now also do does did ' +
    'doing done have has had having would could may might must shall about as up out off over ' +
    'under again further once because while between through during before after above below ' +
    'down s t re ve ll d m o re cannot one two thing things like get got make made way ways ' +
    'much many them they then thats whatever whether something anyone anything everything ' +
    'never always ever still yet maybe perhaps almost quite even though although am im ' +
    'into within without upon every part well good back time times day days say said says'
  ).split(/\s+/));

  // ── Editorial blacklist — apparatus / process words ────────────────────────
  // DISTINCT from HEART_STOPWORDS (which are grammatical function words). These
  // are words *about the journaling apparatus itself* — names, skill nouns, the
  // medium — that otherwise dominate the cloud and bury the actual content of
  // Phil's responses. Hand-tended editorial list: prune or extend as the run
  // grows. (See journal-cloud.jsx.)
  window.HEART_BLACKLIST = new Set((
    'jeremy phil lectio substrate page reader reading entry journal map response quote'
    // Candidates under review — apparatus-leaning, not active. Uncomment to enable:
    // + ' room read medium line thread method test'
    // Deliberately NOT blacklisted (genuine philosophical content):
    //   form place inside outside mind silver
  ).split(/\s+/));

  window.heartWordCounts = function (entries, opts) {
    opts = opts || {};
    var counts = new Map();
    function add(text, weight) {
      // NFD-fold combining diacritics so IAST/Sanskrit terms (Sanātana, Brahmā,
      // Śaṅkarāchārya …) tokenize whole instead of fragmenting at the accent.
      // Tokenization-only — entry display (ledger, quotes) keeps full diacritics.
      (text || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[’']/g, '').split(/[^a-z]+/).forEach(function (w) {
          if (w.length < 4) return;
          if (window.HEART_STOPWORDS.has(w)) return;
          if (window.HEART_BLACKLIST.has(w)) return;
          counts.set(w, (counts.get(w) || 0) + weight);
        });
    }
    // Built from Phil's response only. The Subtopic label (formerly added at
    // weight 2) was removed: it is a curated topic tag, not "words Phil reaches
    // for," and its double weight skewed the cloud toward catalog labels.
    entries.forEach(function (e) {
      add(e.response, 1);
    });
    var out = [];
    counts.forEach(function (count, word) { out.push({ word: word, count: count }); });
    out.sort(function (a, b) { return b.count - a.count; });
    return out;
  };

  // ── Month buckets from a fetched set ───────────────────────────────────────
  window.heartMonths = function (entries) {
    var seen = {};
    entries.forEach(function (e) {
      var ym = (e.date || '').slice(0, 7);  // 'YYYY-MM'
      if (!ym) return;
      seen[ym] = (seen[ym] || 0) + 1;
    });
    var monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
    return Object.keys(seen).sort().reverse().map(function (ym) {
      var year = ym.slice(0, 4), m = parseInt(ym.slice(5, 7), 10);
      return {
        id: ym,
        label: monthNames[m - 1] + ' ' + year,
        short: monthNames[m - 1].slice(0, 3).toUpperCase(),
        count: seen[ym]
      };
    });
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  window.HEART_DATA = {
    SHEET_ID: SHEET_ID,
    TAB: TAB,
    CSV_URL: CSV_URL,
    JOURNAL_URL: JOURNAL_URL,
    PHIL_PAGE_URL: PHIL_PAGE_URL,
    fetchEntries: fetchEntries,
    parseCSV: parseCSV,
    normalize: normalize
  };
})();
