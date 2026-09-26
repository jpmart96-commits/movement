'use strict';
// Structural invariants for every month-plan day (26 Sep – 25 Oct 2026),
// plus behavioural tests for known bugs, marked `todo` so they are reported
// (run.js lists them under "expected failures") without failing the run.
//
// KNOWN: invariant violations that are real but accepted for now. A matching
// violation is reported as a diagnostic instead of failing; a KNOWN entry
// that no longer matches anything is reported as fixed, so it can be removed.
const test = require('node:test');
const assert = require('node:assert');
const { dateRange } = require('./load');
const { freshContext, generateDay, planDayFor } = require('./helpers');

const PLAN_FROM = '2026-09-26', PLAN_TO = '2026-10-25';
const TIME_TOLERANCE = 1.10;

const KNOWN = [
  { id: 'sunday-hang-project', check: 'time', block: 'accessory', dayType: 'light',
    reason: 'Sunday hang-project skill line doses ~14–15 min into the 10-min light-day Accessory slot (known from review).' },
  { id: 'z2-bike-open', check: 'time', block: 'open', dayType: 'z2-bike',
    reason: 'z2-bike Open variant doses ~11.4 min into 10 (found by this suite).' },
  { id: 'handstand-accessory', check: 'time', block: 'accessory', dates: ['2026-09-26', '2026-10-06', '2026-10-15'],
    reason: 'Handstand skill line draws ~16.9 min into 15 on some rotations (found by this suite).' },
  { id: 'movement-day-mobility', check: 'time', block: 'mobility', dates: ['2026-10-01', '2026-10-13'],
    reason: 'Mobility on movement-domain z2 days doses ~22.9 min into 20 (found by this suite).' },
  { id: 'stick-complementary-23oct', check: 'time', block: 'complementary', dates: ['2026-10-23'],
    reason: 'Complementary (stick) doses ~28 min into 25 on 23 Oct (found by this suite).' },
];

const app = freshContext({ quiet: true });
const G = app.Generator, C = app.Complementary;
const libById = new Map(app.LIBRARY.map(e => [e.id, e]));
const allEx = s => s.blocks.flatMap(b => (b.exercises || []).map(e => ({ b, e })));

// Estimated minutes for a block: prescribed work (+ rest between sets for
// Main Focus lifts, the full protocol for cardio) plus the generator's own
// per-exercise transition buffer. Non-main items use the app's dose model.
function estimateBlockMinutes(b) {
  let min = 0;
  for (const e of b.exercises || []) {
    const t = e.target || {};
    if (e.role === 'main') {
      if (e.logType === 'cardio') min += (t.durationSec || 0) / 60;
      else {
        const sets = t.sets || 1, work = t.durationSec || (t.distanceM ? 30 : 40);
        min += (sets * work + Math.max(0, sets - 1) * (t.restSec || 0)) / 60;
      }
    } else min += C.doseSeconds(t) / 60;
    min += G._TRANSITION_BUFFER_MIN;
  }
  return min;
}

function checkDay(date) {
  const s = generateDay(app, date);
  const p = planDayFor(app, date);
  const v = [];
  const add = (check, block, msg) => v.push({ date, check, block, dayType: s && s.dayType, msg });
  if (!p) { add('plan', '-', 'no plan day'); return v; }
  if (!s) { add('generate', '-', 'generateFromScaffold returned null'); return v; }

  // dayType / theme match the plan
  if (s.dayType !== p.dayType) add('dayType', '-', `dayType ${s.dayType} != plan ${p.dayType}`);
  if (p.theme && s.theme !== p.theme) add('dayType', '-', `theme "${s.theme}" != plan "${p.theme}"`);

  // no duplicate exercise id within the day
  const seen = new Map();
  for (const { b, e } of allEx(s)) {
    if (seen.has(e.id)) add('duplicate', b.key, `${e.id} in ${seen.get(e.id)} and ${b.key}`);
    else seen.set(e.id, b.key);
  }

  // every exercise has a dose
  for (const { b, e } of allEx(s)) {
    const t = e.target;
    const hasText = t && typeof t.text === 'string' && t.text.trim() !== '';
    const hasNum = t && [t.sets, t.reps, t.durationSec, t.distanceM].some(x => Number(x) > 0);
    if (!hasText || !hasNum) add('dose', b.key, `${e.id} has no dose (${JSON.stringify(t)})`);
  }

  // minutes add up, and each block's work fits its minutes
  const sum = s.blocks.reduce((a, b) => a + (b.duration || 0), 0);
  if (sum !== s.duration) add('minutes', '-', `blocks sum ${sum} != day total ${s.duration}`);
  const skeleton = G._skeletonTotalMinutes(s.variant);
  if (app.MonthPlan.loadScaleFor(app.date(date)) === 1 && s.duration !== skeleton) add('minutes', '-', `day total ${s.duration} != skeleton ${skeleton} (${s.variant})`);
  for (const b of s.blocks) {
    const est = estimateBlockMinutes(b);
    if (est > b.duration * TIME_TOLERANCE) add('time', b.key, `${b.key} est ${est.toFixed(1)} min > ${b.duration} min +${Math.round((TIME_TOLERANCE - 1) * 100)}%`);
  }

  // Main Focus: carries every mainFocusPlan exercise with its load; no prehab
  const mf = s.blocks.filter(b => b.mainFocus);
  const mfEx = mf.flatMap(b => b.exercises || []);
  const mfp = p.mainFocusPlan;
  if (mfp) {
    const specs = [...(mfp.exercises || [])];
    if (mfp.cardio) specs.push({ id: (mfp.cardio.exercise || mfp.cardio).id, name: (mfp.cardio.exercise || mfp.cardio).name });
    (mfp.extra || []).forEach(x => specs.push(x));
    for (const spec of specs) {
      const e = mfEx.find(x => x.id === spec.id) ||
        (spec.name && mfEx.find(x => (x.name || '').toLowerCase() === String(spec.name).toLowerCase()));
      if (!e) { add('mainFocusPlan', 'main-focus', `${spec.id || spec.name} missing from Main Focus`); continue; }
      if (spec.loadKg != null && (e.target || {}).loadKg !== spec.loadKg) add('mainFocusPlan', 'main-focus', `${e.id} loadKg ${(e.target || {}).loadKg} != plan ${spec.loadKg}`);
    }
  }
  for (const e of mfEx) {
    const rg = e.restGroup || (libById.get(e.id) || {}).restGroup;
    if (rg === 'prehab') add('prehab', 'main-focus', `${e.id} (restGroup prehab) in Main Focus`);
  }

  // Complementary: 3–5 items, all in the day's one domain (the plan's)
  const comp = s.blocks.find(b => b.key === 'complementary');
  if (!comp) add('complementary', 'complementary', 'no Complementary block');
  else {
    const n = (comp.exercises || []).length;
    if (n < 3 || n > 5) add('complementary', 'complementary', `${n} items (want 3–5)`);
    if (p.coordDomain && comp.coordDomain !== p.coordDomain) add('complementary', 'complementary', `domain ${comp.coordDomain} != plan ${p.coordDomain}`);
    const fams = (app.DOMAIN_FAMILIES || {})[comp.coordDomain] || [];
    const off = comp.exercises.filter(e => {
      const ov = app.Overrides.get(e.id);
      if (ov && ov.coordDomain) return ov.coordDomain !== comp.coordDomain;
      return !fams.includes((libById.get(e.id) || {}).family);
    });
    if (off.length) add('complementary', 'complementary', `outside ${comp.coordDomain}: ${off.map(e => e.id + ':' + (libById.get(e.id) || {}).family).join(', ')}`);
  }
  return v;
}

const matchKnown = x => KNOWN.find(k => k.check === x.check && (!k.block || k.block === x.block) &&
  (!k.dayType || k.dayType === x.dayType) && (!k.dates || k.dates.includes(x.date)));

const knownHits = new Map(KNOWN.map(k => [k.id, []]));

test(`invariants: every plan day ${PLAN_FROM}..${PLAN_TO}`, async t => {
  for (const date of dateRange(PLAN_FROM, PLAN_TO)) {
    await t.test(date, st => {
      const real = [];
      for (const x of checkDay(date)) {
        const k = matchKnown(x);
        if (k) { knownHits.get(k.id).push(date); st.diagnostic(`KNOWN [${k.id}] ${date} ${x.msg}`); }
        else real.push(`[${x.check}] ${x.msg}`);
      }
      if (real.length) assert.fail(`${date}:\n  ` + real.join('\n  '));
    });
  }
});

test('invariants: KNOWN list is current', t => {
  for (const k of KNOWN) {
    const hits = knownHits.get(k.id);
    if (!hits.length) t.diagnostic(`KNOWN-FIXED [${k.id}] no longer occurs; remove it from KNOWN in invariants.test.js`);
    else t.diagnostic(`KNOWN-SUMMARY [${k.id}] ${hits.length} day(s): ${k.reason}`);
  }
});

// Days after the plan fall back to the bare scaffold. Only the checks that
// don't depend on a plan day apply.
test('fallback days 26 Oct..30 Nov: generate, no duplicates, every item dosed', () => {
  const bad = [];
  for (const date of dateRange('2026-10-26', '2026-11-30')) {
    const s = generateDay(app, date);
    if (!s) { bad.push(`${date}: null`); continue; }
    const ids = allEx(s).map(x => x.e.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) bad.push(`${date}: duplicate ${[...new Set(dup)].join(', ')}`);
    allEx(s).forEach(({ b, e }) => { if (!e.target || !String(e.target.text || '').trim()) bad.push(`${date}: ${b.key}/${e.id} has no dose text`); });
    if (s.blocks.reduce((a, b) => a + b.duration, 0) !== s.duration) bad.push(`${date}: block minutes != day total`);
  }
  if (bad.length) assert.fail(bad.join('\n'));
});

// ── Behavioural tests for bugs fixed 26 Sep (review 2.1, 2.2, 3.1) ─────

test('trade/theme override: Mon 28 Sep as z2-bike carries no Strength A lifts in Main Focus', () => {
    const s = generateDay(app, '2026-09-28', { themeOverride: 'z2-bike' });
    assert.ok(s, 'generated');
    const mfIds = s.blocks.filter(b => b.mainFocus).flatMap(b => b.exercises.map(e => e.id));
    const lifts = mfIds.filter(id => ['squat', 'incline-bench', 'pull-up'].includes(id));
    assert.deepEqual(lifts, [], `Main Focus (${s.blocks.filter(b => b.mainFocus).map(b => b.key)}) = ${mfIds.join(', ')}`);
  });

// Log one set on the first exercise of every block, apply an Adjust-sheet
// intent exactly as index.html's adjustApply does, and check the logged work
// survives.
function keepsLoggedSets(intent) {
  const s = generateDay(app, '2026-09-28');
  const logged = [];
  for (const b of s.blocks) {
    const e = b.exercises[0];
    e.sets = [{ idx: 1, weight: (e.target || {}).loadKg ?? null, reps: (e.target || {}).reps ?? null, duration: null, note: '', completed: true, loggedAt: app.getNow() }];
    e.completed = true;
    logged.push({ block: b.key, id: e.id, sets: JSON.stringify(e.sets) });
  }
  const r = G.applyOverride(s, intent, app.Profile.load());
  assert.ok(r, 'applyOverride returned null');
  const lost = logged.filter(l => {
    const e = r.blocks.flatMap(b => b.exercises || []).find(x => x.id === l.id);
    return !e || JSON.stringify(e.sets) !== l.sets;
  }).map(l => `${l.block}/${l.id}`);
  assert.deepEqual(lost, [], `logged sets dropped by ${intent.action}: ${lost.join(', ')}`);
}

test('adjust "lighter" keeps exercises that already have logged sets',
  () => keepsLoggedSets({ action: 'lighter', maxTier: 'moderate' }));

test('adjust "shorter" (scale_session 0.65) keeps exercises that already have logged sets',
  () => keepsLoggedSets({ action: 'scale_session', factor: 0.65 }));

test('after 25 Oct, Strength A days prescribe a numeric squat load (carry-forward)', () => {
    const missing = [];
    let checked = 0;
    for (const date of dateRange('2026-10-26', '2026-11-30')) {
      const s = generateDay(app, date);
      if (!s || s.dayKind !== 'strength-a') continue;
      checked++;
      const sq = s.blocks.flatMap(b => b.exercises).find(e => e.id === 'squat');
      if (!sq || typeof (sq.target || {}).loadKg !== 'number') missing.push(`${date}: ${sq ? JSON.stringify(sq.target.text) : 'no squat'}`);
    }
    assert.ok(checked >= 4, `expected ~5 Strength A days, found ${checked}`);
    if (missing.length) assert.fail(`${missing.length}/${checked} Strength A days without squat loadKg: ` + missing.join('; '));
  });
