/* ============================================================================
 * spirit-data.js · CLAUDEMONZTER — "WISDOM OF THE DAY"
 * ----------------------------------------------------------------------------
 * The data layer for /graph/spirit.html and /agents/phil/journal.html.
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
 *   window.SPIRIT_DATA.fetchEntries() → Promise<entry[]>  (newest-first)
 *   window.SPIRIT_DATA.SHEET_ID, TAB, CSV_URL
 *   window.SPIRIT_DATA.JOURNAL_URL, PHIL_PAGE_URL
 *   window.spiritWordCounts(entries, opts) → [{word, count}]  (for journal cloud)
 *   window.SPIRIT_STOPWORDS — Set<string>
 *   window.SPIRIT_MONTHS — computed from entries by fetchEntries()
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

  // ── Small CSV parser (mirrors dashboard.html pattern) ──────────────────────
  function splitCSVLine(line) {
    var cols = [], inQ = false, cur = '';
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '"') {
        // Handle escaped quotes ("") inside quoted fields
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        cols.push(cur); cur = '';
      } else {
        cur += c;
      }
    }
    cols.push(cur);
    return cols;
  }

  function parseCSV(text) {
    // gviz returns CRLF or LF — normalize, drop blank trailing lines
    var lines = text.replace(/\r\n/g, '\n').split('\n').filter(function (l) { return l.length > 0; });
    if (lines.length < 2) return { headers: [], rows: [] };
    var headers = splitCSVLine(lines[0]).map(function (h) {
      return h.replace(/^"|"$/g, '').trim();
    });
    var rows = lines.slice(1).map(function (line) {
      var cols = splitCSVLine(line);
      var obj = {};
      headers.forEach(function (h, i) {
        obj[h] = (cols[i] || '').replace(/^"|"$/g, '').trim();
      });
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
  window.SPIRIT_STOPWORDS = new Set((
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

  window.spiritWordCounts = function (entries, opts) {
    opts = opts || {};
    var includeTopics = opts.includeTopics !== false;  // default true
    var counts = new Map();
    function add(text, weight) {
      (text || '').toLowerCase().replace(/[’']/g, '').split(/[^a-z]+/).forEach(function (w) {
        if (w.length < 4) return;
        if (window.SPIRIT_STOPWORDS.has(w)) return;
        counts.set(w, (counts.get(w) || 0) + weight);
      });
    }
    entries.forEach(function (e) {
      add(e.response, 1);
      if (includeTopics) add(e.subtopic, 2);
    });
    var out = [];
    counts.forEach(function (count, word) { out.push({ word: word, count: count }); });
    out.sort(function (a, b) { return b.count - a.count; });
    return out;
  };

  // ── Month buckets from a fetched set ───────────────────────────────────────
  window.spiritMonths = function (entries) {
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
  window.SPIRIT_DATA = {
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
