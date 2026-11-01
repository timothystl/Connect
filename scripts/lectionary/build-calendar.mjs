#!/usr/bin/env node
// Builds the Scheduler's LSB Three-Year lectionary calendar.
//
//   node scripts/lectionary/build-calendar.mjs           # write lcms_calendar.json (x2) + src/lectionary.js
//   node scripts/lectionary/build-calendar.mjs --report  # also print where readings changed vs. the old data
//
// Sources, in order of authority:
//   1. lcms-official-rows.json — parsed from the LCMS Commission on Worship's yearly
//      "Church Year Calendar — Three-Year Series" files (lcms.org/worship/church-year),
//      via parse-lcms-docx.py. Church years an LCMS calendar covers are taken from it
//      date for date, including its festivals and its "or" alternatives.
//   2. The same rows, used as a readings library keyed by series + Sunday/festival, for
//      years LCMS has not published a calendar for yet.
//   3. yaag-base.json — the older scrape from yaag.org. Supplies which Sunday falls on
//      which date for later years, and readings only where no LCMS calendar has them.
//
// Each entry records which of those it came from in `source`.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const REPORT = process.argv.includes('--report');

const rows = JSON.parse(readFileSync(join(here, 'lcms-official-rows.json'), 'utf8'));
const base = JSON.parse(readFileSync(join(here, 'yaag-base.json'), 'utf8')).calendar;

// ── Reference normalization ──────────────────────────────────────────────────
const BOOKS = {
  'Gen': 'Genesis', 'Ex': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers', 'Deut': 'Deuteronomy',
  'Josh': 'Joshua', 'Judg': 'Judges', 'Sam': 'Samuel', 'Chron': 'Chronicles', 'Neh': 'Nehemiah',
  'Esth': 'Esther', 'Prov': 'Proverbs', 'Eccl': 'Ecclesiastes', 'Is': 'Isaiah', 'Isaiah': 'Isaiah',
  'Jer': 'Jeremiah', 'Lam': 'Lamentations', 'Ezek': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea',
  'Obad': 'Obadiah', 'Mic': 'Micah', 'Hab': 'Habakkuk', 'Zeph': 'Zephaniah', 'Hag': 'Haggai',
  'Zech': 'Zechariah', 'Mal': 'Malachi', 'Matt': 'Matthew', 'Rom': 'Romans', 'Cor': 'Corinthians',
  'Gal': 'Galatians', 'Eph': 'Ephesians', 'Phil': 'Philippians', 'Col': 'Colossians',
  'Thess': 'Thessalonians', 'Tim': 'Timothy', 'Philem': 'Philemon', 'Heb': 'Hebrews',
  'Rev': 'Revelation', 'Ps': 'Psalm',
};
// One reference, as the Scheduler stores it: full book name, hyphens, first option only
// (the ESV lookup and the reader both need a single passage; the LCMS calendar's
// "X or Y" choices stay visible in the calendar itself).
export function normRef(s) {
  let r = String(s || '');
  r = r.split(/\s*-{3,}\s*/).pop();                 // Palm Sunday: drop the "procession" gospel line
  r = r.replace(/\s*\/\s*/g, ' ');                   // docx line breaks
  r = r.split(/\s+or\b/)[0];                         // first option only
  r = r.replace(/\bprocession\b|\(Procession\)/gi, '');
  r = r.replace(/[–—]/g, '-').replace(/\s*-\s*/g, '-');
  r = r.replace(/\b([1-3]?\s?)([A-Z][a-z]+)\.(?=\s|\d)/g, (m, n, b) => (n || '') + (BOOKS[b] || b));
  r = r.replace(/\b(Isaiah)\.(?=\s)/g, '$1');
  r = r.replace(/([A-Za-z])(\d)/g, '$1 $2');         // "Heb.1:1" → "Hebrews 1:1"
  r = r.replace(/:\s+/g, ':').replace(/\s+/g, ' ').trim();
  return r;
}

// ── Keys: which Sunday/festival a row or entry is ────────────────────────────
const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8 };
// Festivals: same readings in every series. `date` is MM-DD for fixed-date ones.
const FESTIVALS = [
  ['christmas-eve', /christmas eve/, 'The Nativity of Our Lord (Christmas Eve)', '12-24'],
  ['christmas-midnight', /midnight/, 'The Nativity of Our Lord (Christmas Midnight)'],
  ['christmas-dawn', /dawn/, 'The Nativity of Our Lord (Christmas Dawn)'],
  ['christmas-day', /nativity of our lord.*\bday\b|christmas day/, 'The Nativity of Our Lord (Christmas Day)', '12-25'],
  ['st-stephen', /st\.? stephen/, 'St. Stephen, Martyr', '12-26'],
  ['st-john', /^st\.? john$/, 'St. John, Apostle and Evangelist', '12-27'],
  ['holy-innocents', /holy innocents/, 'The Holy Innocents, Martyrs', '12-28'],
  ['new-years-eve', /eve of the circ/, 'Eve of the Circumcision and Name of Jesus (New Year\'s Eve)', '12-31'],
  ['new-years-day', /circumcision and name/, 'Circumcision and Name of Jesus (New Year\'s Day)', '01-01'],
  ['epiphany', /^(the )?epiphany( of our lord)?$|feast of the epiphany/, 'The Epiphany of Our Lord', '01-06'],
  ['confession-st-peter', /confession of st/, 'The Confession of St. Peter', '01-18'],
  ['st-timothy', /st\.? timothy/, 'St. Timothy, Pastor and Confessor', '01-24'],
  ['conversion-st-paul', /conversion of st/, 'The Conversion of St. Paul', '01-25'],
  ['presentation', /presentation of our lord/, 'The Purification of Mary and the Presentation of Our Lord', '02-02'],
  ['st-mark', /^st\.? mark$/, 'St. Mark, Evangelist', '04-25'],
  ['sts-peter-paul', /st\.? peter and st\.? paul/, 'St. Peter and St. Paul, Apostles', '06-29'],
  ['st-james-elder', /james the elder/, 'St. James the Elder, Apostle', '07-25'],
  ['st-mary', /st\.? mary, mother/, 'St. Mary, Mother of Our Lord', '08-15'],
  ['st-bartholomew', /bartholomew/, 'St. Bartholomew, Apostle', '08-24'],
  ['martyrdom-john-baptist', /martyrdom of st\.? john/, 'The Martyrdom of St. John the Baptist', '08-29'],
  ['holy-cross', /holy cross/, 'Holy Cross Day', '09-14'],
  ['st-matthew', /st\.? matthew/, 'St. Matthew, Apostle and Evangelist', '09-21'],
  ['st-michael', /michael/, 'St. Michael and All Angels', '09-29'],
  ['st-luke', /^st\.? luke$/, 'St. Luke, Evangelist', '10-18'],
  ['reformation', /reformation/, 'Reformation Day', '10-31'],
  ['all-saints', /all saints/, 'All Saints\' Day', '11-01'],
  ['thanksgiving', /thanksgiving day( \(usa\))?$/, 'Day of National Thanksgiving'],
];
const FEST_BY_KEY = Object.fromEntries(FESTIVALS.map(f => [f[0], { key: f[0], re: f[1], name: f[2], mmdd: f[3] }]));

// Series-specific days, with the LCMS name the calendar should show.
const NAMED = [
  ['ash-wednesday', /ash wednesday/, 'Ash Wednesday'],
  ['palm-sunday', /palm sunday/, 'Palm Sunday (Sunday of the Passion)'],
  ['maundy-thursday', /maundy\)? thursday/, 'Holy (Maundy) Thursday'],
  ['good-friday', /good friday/, 'Good Friday'],
  ['easter-sunrise', /resurrection.*sunrise/, 'The Resurrection of Our Lord (Sunrise)'],
  ['easter', /resurrection of our lord|^easter sunday$/, 'The Resurrection of Our Lord (Easter Day)'],
  ['ascension', /ascension/, 'The Ascension of Our Lord'],
  ['pentecost', /day of pentecost/, 'The Day of Pentecost'],
  ['trinity', /holy trinity|^trinity sunday$/, 'The Holy Trinity'],
  ['transfiguration', /transfiguration/, 'The Transfiguration of Our Lord'],
  ['epiphany1', /baptism of our lord|^first sunday after the epiphany$/, 'The Baptism of Our Lord'],
];
const NAMED_BY_KEY = Object.fromEntries(NAMED.map(n => [n[0], n[2]]));
const SEASON_ORD = [
  [/in advent/, 'advent', 'Sunday in Advent'], [/after christmas/, 'christmas', 'Sunday after Christmas'],
  [/after the epiphany/, 'epiphany', 'Sunday after the Epiphany'], [/in lent/, 'lent', 'Sunday in Lent'],
  [/of easter/, 'easter', 'Sunday of Easter'],
];

function normName(n) {
  return String(n || '').replace(/\s*\/\s*/g, ' ').replace(/\bS\.(?= )/g, 'Sunday').replace(/[’]/g, "'")
    .replace(/\s+/g, ' ').trim();
}
// Returns { key, festival:boolean } or null.
export function keyOf(name, prop) {
  const n = normName(name).toLowerCase().replace(/\s*\(prop\d+\)/, '');
  if (prop) return { key: 'prop' + prop, festival: false };
  if (/last sunday (of the church year|after pentecost)/.test(n)) return { key: 'prop29', festival: false };
  for (const [key, re] of NAMED) if (re.test(n)) return { key, festival: false };
  for (const [key, re] of FESTIVALS) if (re.test(n)) return { key, festival: true };
  for (const [re, k] of SEASON_ORD) {
    if (re.test(n)) { const o = ORD[n.split(' ')[0]]; if (o) return { key: k + o, festival: false }; }
  }
  return null;
}

// ── Readings library from the LCMS calendars ─────────────────────────────────
// Later calendars win (rows are listed oldest first), so a typo fixed in a newer
// LCMS calendar replaces the older one.
const readingsOf = r => ({ psalm: normRef(r.psalm), ot: normRef(r.ot), epistle: normRef(r.epistle), gospel: normRef(r.gospel) });
const library = {};
for (const r of [...rows].sort((a, b) => a.source.localeCompare(b.source))) {
  const k = keyOf(r.name, r.prop);
  if (!k) continue;
  const id = k.festival ? k.key : r.series + ':' + k.key;
  const rd = readingsOf(r);
  if (!rd.ot || !rd.epistle || !rd.gospel) continue;      // truncated cell in a source file
  library[id] = { ...rd, source: r.source };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const iso = d => d.toISOString().slice(0, 10);
const dateOf = s => new Date(s + 'T12:00:00Z');
const isSunday = s => dateOf(s).getUTCDay() === 0;
const addDays = (s, n) => { const d = dateOf(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

function entryFrom(name, readings, ctx, source) {
  return {
    sundayName: name, season: ctx.season, churchYear: ctx.churchYear, series: ctx.series,
    psalm: readings.psalm, ot: readings.ot, epistle: readings.epistle, gospel: readings.gospel, source,
  };
}
const altFrom = (name, rd) => ({ name, psalm: rd.psalm, ot: rd.ot, epistle: rd.epistle, gospel: rd.gospel });

// Display name for a key in the generated years; Pentecost Sundays keep the ordinal
// and "(propN)" tag the Scheduler already formats.
function displayName(k, baseName) {
  if (k.festival) return FEST_BY_KEY[k.key].name;
  if (NAMED_BY_KEY[k.key]) return NAMED_BY_KEY[k.key];
  if (k.key === 'prop29') return 'Last Sunday of the Church Year (prop29)';
  return baseName;
}

// ── 1. Church years covered by an LCMS calendar: take it date for date ───────
const out = {};
const officialDates = new Set();
const officialRange = [];
{
  const bySource = {};
  for (const r of rows) (bySource[r.source] ||= []).push(r);
  for (const [src, list] of Object.entries(bySource)) {
    const dates = list.map(r => r.date).sort();
    const start = dates[0], end = dates[dates.length - 1];
    if (!base[start] && start < Object.keys(base).sort()[0]) continue;   // before the Scheduler's range
    officialRange.push([start, end, src]);
    const byDate = {};
    for (const r of list) (byDate[r.date] ||= []).push(r);
    for (const [date, rs] of Object.entries(byDate)) {
      const b = base[date];
      const ctx = { season: b?.season || '', churchYear: b?.churchYear || '', series: rs[0].series };
      // Christmas Day and Easter list several services; the main daytime one is the default.
      let primary = rs.find(r => !r.alt && /christmas day|\(day\)$|nativity of our lord \/ \(day\)/i.test(normName(r.name)))
        || rs.find(r => !r.alt && /resurrection/i.test(r.name) && !/sunrise/i.test(r.name))
        || rs.find(r => !r.alt) || rs[0];
      const k = keyOf(primary.name, primary.prop);
      let name = k ? displayName(k, b?.sundayName || normName(primary.name)) : normName(primary.name);
      if (k && /^prop\d+$/.test(k.key) && k.key !== 'prop29') name = (b?.sundayName && /\(prop/.test(b.sundayName)) ? b.sundayName : name;
      if (k?.festival && date.slice(5) !== FEST_BY_KEY[k.key].mmdd && FEST_BY_KEY[k.key].mmdd) name += ' (observed)';
      const e = entryFrom(name, readingsOf(primary), ctx, 'LCMS calendar: ' + src);
      const alts = rs.filter(r => r !== primary).map(r => {
        const ak = keyOf(r.name, r.prop);
        let an = ak ? displayName(ak, normName(r.name)) : normName(r.name);
        if (ak && /^prop\d+$/.test(ak.key) && ak.key !== 'prop29') an = b?.sundayName && /\(prop/.test(b.sundayName) ? b.sundayName : normName(r.name) + ` (prop${r.prop})`;
        return altFrom(an, readingsOf(r));
      });
      if (alts.length) e.alternates = alts;
      if (!e.season) e.season = '';
      out[date] = e;
      officialDates.add(date);
    }
  }
}
const inOfficial = d => officialRange.some(([s, e]) => d >= s && d <= e);

// ── 2. Other years: yaag skeleton, LCMS readings where the library has them ──
const unmatched = [];
const changed = [];
for (const [date, b] of Object.entries(base)) {
  if (inOfficial(date)) continue;
  if (/canada/i.test(b.sundayName)) continue;          // not on the LCMS calendar
  const prop = (b.sundayName.match(/\(prop(\d+)\)/) || [])[1];
  const k = keyOf(b.sundayName, prop ? +prop : null);
  const lib = k && library[k.festival ? k.key : b.series + ':' + k.key];
  const ctx = { season: b.season, churchYear: b.churchYear, series: b.series };
  const name = k ? displayName(k, b.sundayName) : b.sundayName;
  if (lib) {
    out[date] = entryFrom(name, lib, ctx, 'LCMS readings: ' + lib.source);
    const old = readingsOf(b);
    for (const f of ['ot', 'epistle', 'gospel']) {
      const strip = s => s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, '').replace(/:$/, '');
      if (strip(old[f]) !== strip(lib[f])) changed.push(`${date} ${b.series} ${name} ${f}: ${old[f]} -> ${lib[f]}`);
    }
  } else {
    out[date] = entryFrom(name, { psalm: normRef(b.psalm), ot: normRef(b.ot), epistle: normRef(b.epistle), gospel: normRef(b.gospel) }, ctx, 'yaag.org');
    unmatched.push(`${date} ${b.series} ${b.sundayName}`);
  }
  // Christmas Day: the old data had only the Dawn service; default to the Day service
  // and keep Midnight and Dawn one click away, as the LCMS calendar lists all three.
  if (k?.key === 'christmas-dawn' && library['christmas-day']) {
    out[date] = entryFrom(FEST_BY_KEY['christmas-day'].name, library['christmas-day'], ctx, 'LCMS readings: ' + library['christmas-day'].source);
    out[date].alternates = ['christmas-midnight', 'christmas-dawn'].filter(x => library[x]).map(x => altFrom(FEST_BY_KEY[x].name, library[x]));
  }
  if (k?.key === 'easter' && library[b.series + ':easter-sunrise']) {
    out[date].alternates = [altFrom(NAMED_BY_KEY['easter-sunrise'], library[b.series + ':easter-sunrise'])];
  }
}

// ── 3. Festivals in the generated years ──────────────────────────────────────
// Reformation and All Saints are observed on the nearest Sunday, as every LCMS
// calendar does; the Presentation and New Year's Day are feasts of Christ and keep
// a Sunday they fall on. Any other festival on a Sunday is offered as the "or"
// alternative, and on a weekday it gets its own entry.
const PRIMARY_ON_SUNDAY = new Set(['reformation', 'all-saints', 'presentation', 'new-years-day', 'epiphany', 'christmas-day', 'christmas-eve', 'new-years-eve']);
const FIRST = Object.keys(base).sort()[0], LAST = Object.keys(base).sort().pop();
const years = [...new Set(Object.keys(base).map(d => +d.slice(0, 4)))];
const seasonAt = d => { const prev = Object.keys(out).filter(x => x <= d).sort().pop(); return prev ? out[prev] : null; };
function addFestival(key, date, observed) {
  // An LCMS calendar's own choice for a date stands; it only gains weekday festivals it does not list.
  if (officialDates.has(date) || date < FIRST || date > LAST) return;
  const lib = library[key]; if (!lib) return;
  const f = FEST_BY_KEY[key];
  const name = f.name + (observed ? ' (observed)' : '');
  const cur = out[date];
  if (cur && keyOf(cur.sundayName)?.key === key) return;
  const ctxFrom = cur || seasonAt(date) || {};
  const ctx = { season: ctxFrom.season || '', churchYear: ctxFrom.churchYear || '', series: ctxFrom.series || '' };
  if (!cur) { out[date] = entryFrom(name, lib, ctx, 'LCMS readings: ' + lib.source); return; }
  if (observed || PRIMARY_ON_SUNDAY.has(key)) {
    const demoted = altFrom(cur.sundayName, cur);
    out[date] = { ...entryFrom(name, lib, ctx, 'LCMS readings: ' + lib.source), alternates: [demoted, ...(cur.alternates || [])] };
  } else {
    cur.alternates = [...(cur.alternates || []), altFrom(name, lib)];
  }
}
for (const y of years) {
  for (const f of FESTIVALS) {
    if (!f[3] || ['christmas-eve', 'christmas-day'].includes(f[0])) continue;   // already in the base calendar
    const date = `${y}-${f[3]}`;
    if (f[0] === 'reformation') {
      // Last Sunday in October (Oct 25–31); Oct 31 itself also keeps its own entry.
      let s = `${y}-10-31`; while (!isSunday(s)) s = addDays(s, -1);
      addFestival('reformation', s, s !== date);
    }
    if (f[0] === 'all-saints') {
      let s = `${y}-11-01`; while (!isSunday(s)) s = addDays(s, 1);
      addFestival('all-saints', s, s !== date);
    }
    addFestival(f[0], date, false);
  }
}

// ── Write ────────────────────────────────────────────────────────────────────
const calendar = {};
for (const d of Object.keys(out).sort()) calendar[d] = out[d];
const doc = {
  meta: {
    description: 'LCMS LSB Three-Year lectionary calendar for the Scheduler. Built by scripts/lectionary/build-calendar.mjs.',
    sources: [
      'LCMS Commission on Worship yearly Church Year Calendars (Three-Year Series), lcms.org/worship/church-year: ' +
        officialRange.map(r => r[2]).sort().join(', ') + ' are used date for date; all LCMS calendars on file supply readings for later years.',
      'yaag.org scrape (2026-03-12): which Sunday falls on which date in later years, and readings only where no LCMS calendar has them yet (source "yaag.org").',
    ],
    note: 'Each entry\'s "source" says where its readings came from. "alternates" are the LCMS calendar\'s "or" choices for that date. References keep the first option only; parentheses mark optional verses.',
  },
  calendar,
};
const json = JSON.stringify(doc, null, 2);
writeFileSync(join(root, 'lcms_calendar.json'), json);
writeFileSync(join(root, 'scheduler', 'lcms_calendar.json'), json);
const jsPath = join(root, 'src', 'lectionary.js');
const js = readFileSync(jsPath, 'utf8');
const i = js.indexOf('`'), j = js.lastIndexOf('`');
if (json.includes('`') || json.includes('${')) throw new Error('calendar text would break the template literal');
// Inside a template literal a backslash is an escape, so JSON's own escapes (\") must be doubled.
writeFileSync(jsPath, js.slice(0, i + 1) + json.replace(/\\/g, '\\\\') + js.slice(j));

const count = s => Object.values(calendar).filter(e => e.source.startsWith(s)).length;
console.log(`${Object.keys(calendar).length} dates: ${count('LCMS calendar')} from LCMS calendars, ${count('LCMS readings')} with LCMS readings, ${count('yaag')} still from yaag.org`);
if (REPORT) {
  console.log('\nReadings changed from the old yaag.org data (' + changed.length + '):'); changed.forEach(c => console.log('  ' + c));
  console.log('\nNo LCMS readings on file yet (' + unmatched.length + '):'); unmatched.forEach(c => console.log('  ' + c));
}
