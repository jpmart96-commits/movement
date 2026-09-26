// Insights unit tests — node, zero deps.
//   node tests-insights/insights.test.js
// Loads js/insights.js via require (it exports {Insights}); js/import.js via
// require for RuttioImport so cardio series come through the real importer;
// js/app.js in a vm (localStorage stub, 'use strict' stripped) only to
// compare with the legacy History.getProgressionSuggestion.
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const { Insights: I } = require(path.join(ROOT, 'js', 'insights.js'));
const { RuttioImport } = require(path.join(ROOT, 'js', 'import.js'));
const F = require('./insights.fixtures');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)); }
}
const near = (a, b, tol, msg) => assert.ok(a != null && Math.abs(a - b) <= tol, `${msg || ''} expected ${b}±${tol}, got ${a}`);
const PROFILE = { settings: { hrZones: { z1: 133, z2: 153, z3: 168, z4: 182 } } };
const cardioLogOf = json => {           // exactly what Importer.applyRun stores
  const run = RuttioImport.review({ json, profile: PROFILE });
  return { duration: run.durationSec, distanceKm: run.distanceKm, source: 'ruttio', avgHR: run.avgHR, maxHR: run.maxHR,
    elevGainM: run.elevGainM, paceMinPerKm: run.paceMinPerKm, zones: run.zones, structure: run.structure,
    lapSource: run.lapSource, series: run.series };
};

// ── vitals doc builder ───────────────────────────────────────
function vitalsDoc(days, end, fn) {
  const out = { kind: 'movement-vitals', version: 1, days: {} };
  for (let i = days - 1; i >= 0; i--) {
    const d = I._addDays(end, -i);
    const v = fn(i, d);
    if (v) out.days[d] = v;
  }
  const k = Object.keys(out.days).sort();
  out.range = [k[0], k[k.length - 1]];
  return out;
}
// Normal life: HRV oscillates 60–90 (mean 75, SD ~10.6), RHR 55±1, sleep 7.5h.
const normal = i => ({ rhr: 55 + (i % 3) - 1, hrv: 75 + 15 * Math.sin(i * 1.3), hrvN: 6, sleep: 450, deep: 60, rem: 100 });
const END = '2026-09-25';

console.log('readiness');
test('empty / missing doc → unknown', () => {
  const r = I.readiness(null, END);
  assert.strictEqual(r.level, 'unknown'); assert.strictEqual(r.stale, true); assert.strictEqual(r.lastDate, null);
});
test('no data for the date or the day before → unknown, stale, lastDate', () => {
  const doc = vitalsDoc(90, '2026-09-20', normal);
  const r = I.readiness(doc, END);
  assert.strictEqual(r.level, 'unknown'); assert.strictEqual(r.stale, true); assert.strictEqual(r.lastDate, '2026-09-20');
  assert.match(r.reasons[0], /No vitals since 2026-09-20/);
});
test('date missing but yesterday present → judged on yesterday (asOf), stale', () => {
  const doc = vitalsDoc(90, '2026-09-24', normal);
  const r = I.readiness(doc, END);
  assert.strictEqual(r.level, 'good'); assert.strictEqual(r.asOf, '2026-09-24'); assert.strictEqual(r.stale, true);
});
test('normal 90 days → good, metrics filled', () => {
  const r = I.readiness(vitalsDoc(90, END, normal), END);
  assert.strictEqual(r.level, 'good'); assert.strictEqual(r.stale, false);
  near(r.metrics.hrvBase, 75, 3); near(r.metrics.rhrBase, 55, 1); assert.strictEqual(r.metrics.sleepMin, 450);
  assert.deepStrictEqual(r.flags, []);
});
test('one short night (5h30) alone → ok', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), sleep: i === 0 ? 330 : 450 }));
  const r = I.readiness(doc, END);
  assert.strictEqual(r.level, 'ok'); assert.deepStrictEqual(r.flags, ['sleep']); assert.match(r.reasons[0], /Slept 5h30/);
});
test('4h night alone is extreme → low', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), sleep: i === 0 ? 240 : 450 }));
  assert.strictEqual(I.readiness(doc, END).level, 'low');
});
test('partial night (<3h, watch off) is not a short night', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), sleep: i === 0 ? 150 : 450 }));
  const r = I.readiness(doc, END);
  assert.strictEqual(r.level, 'good'); assert.strictEqual(r.metrics.sleepPartial, true);
});
test('7-day HRV suppressed (−0.5 SD) + short night → low', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), hrv: i < 7 ? 66 : normal(i).hrv, sleep: i === 0 ? 340 : 450 }));
  const r = I.readiness(doc, END);
  assert.strictEqual(r.level, 'low'); assert.deepStrictEqual(r.flags.sort(), ['hrv7', 'sleep']);
});
test('7-day HRV suppressed alone → ok', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), hrv: i < 7 ? 66 : normal(i).hrv }));
  assert.strictEqual(I.readiness(doc, END).level, 'ok');
});
test('7-day HRV below mean − 1 SD is extreme → low on its own', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), hrv: i < 7 ? 55 : normal(i).hrv }));
  const r = I.readiness(doc, END);
  assert.strictEqual(r.level, 'low'); assert.deepStrictEqual(r.flags, ['hrv7!']);
});
test('RHR +6 on 2 of 3 days + low HRV night → low', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), rhr: i === 0 || i === 2 ? 61 : 55, hrv: i === 0 ? 50 : 75 + 15 * Math.sin(i * 1.3) }));
  const r = I.readiness(doc, END);
  assert.strictEqual(r.level, 'low'); assert.deepStrictEqual(r.flags.sort(), ['hrvNight', 'rhr']);
});
test('RHR up only 1 of 3 days → no rhr flag', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), rhr: i === 1 ? 64 : 55 }));
  assert.strictEqual(I.readiness(doc, END).level, 'good');
});
test('RHR +9 on 2 of 3 days is extreme → low alone', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), rhr: i < 2 ? 64 : 55 }));
  const r = I.readiness(doc, END);
  assert.strictEqual(r.level, 'low'); assert.deepStrictEqual(r.flags, ['rhr!']);
});
test('a 2-reading HRV day is too noisy to flag on its own', () => {
  const doc = vitalsDoc(90, END, (i) => ({ ...normal(i), hrv: i === 0 ? 40 : 75 + 15 * Math.sin(i * 1.3), hrvN: i === 0 ? 2 : 6 }));
  assert.strictEqual(I.readiness(doc, END).level, 'good');
});
test('under 20 days of history → no HRV/RHR baseline; sleep still counts', () => {
  const doc = vitalsDoc(10, END, (i) => ({ ...normal(i), sleep: i === 0 ? 330 : 450 }));
  const r = I.readiness(doc, END);
  assert.strictEqual(r.metrics.hrvBase, null); assert.strictEqual(r.level, 'ok');
});
test('trailing() matches Vitals._trailing maths (inclusive window, population SD)', () => {
  const doc = vitalsDoc(5, END, (i) => ({ hrv: [60, 70, 80, 90, 100][i] }));
  const t = I.trailing(doc, 'hrv', END, 5, 5);
  assert.strictEqual(t.mean, 80); near(t.sd, Math.sqrt(200), 1e-9); assert.strictEqual(t.n, 5);
});
test('real vitals.json: low is uncommon and hits the bad stretches', () => {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'vitals.json'), 'utf8'));
  const lv = {}; let n = 0;
  for (let d = doc.range[0]; d <= doc.range[1]; d = I._addDays(d, 1)) { lv[d] = I.readiness(doc, d).level; n++; }
  const low = Object.values(lv).filter(x => x === 'low').length;
  assert.ok(low / n <= 0.15, `low on ${low}/${n} days`);
  assert.strictEqual(lv['2026-07-04'], 'low');   // RHR 71/66, HRV 39
  assert.strictEqual(lv['2026-07-05'], 'low');
  assert.strictEqual(lv[doc.range[0]], 'unknown'); // no baseline on day 1
  assert.strictEqual(lv['2026-09-15'], 'good');
});

console.log('aerobic');
const z2 = cardioLogOf(F.z2Run());
test('importer series shape is what Insights reads ({t,hr,sp,alt}, 30s)', () => {
  assert.strictEqual(z2.series[1].t - z2.series[0].t, 30);
  assert.ok('hr' in z2.series[0] && 'sp' in z2.series[0] && 'alt' in z2.series[0]);
  assert.strictEqual(z2.series[0].hr, null);   // Apple late HR start survives binning
});
test('Z2 run: speed at 139–153, decoupling, stop and late HR handled', () => {
  const a = I.aerobic(z2, { kind: 'run' });
  assert.strictEqual(a.valid, true, a.why);
  near(a.speedAtHr.kmh, 9.9, 0.25, 'kmh'); near(a.speedAtHr.paceSecPerKm, 364, 10, 'pace');
  assert.strictEqual(a.speedAtHr.hrLo, 139); assert.strictEqual(a.speedAtHr.hrHi, 153);
  near(a.speedAtHr.minutes, 38, 1.5, 'minutes in band');
  // 40 min steady at const speed, HR 143→151 → EF falls ≈ 1 − 145/149 ≈ 2.7%
  near(a.decoupling, 2.7, 1.0, 'decoupling'); assert.ok(a.hrDrift > 2);
  assert.ok(a.notes.some(n => /HR started at 1:30/.test(n)), a.notes.join('|'));
  assert.ok(a.notes.some(n => /stopped/.test(n)), a.notes.join('|'));
  near(a.avgHr, 147, 2);
});
test('no drift → decoupling ≈ 0', () => {
  const a = I.aerobic(cardioLogOf(F.z2Run({ drift: 0, seed: 9 })), { kind: 'run' });
  near(a.decoupling, 0, 0.8);
});
test('stops are excluded, not averaged in as 0 speed', () => {
  const a = I.aerobic(z2, { kind: 'run' });
  // with the 2-min stop averaged in, speed would read ~5% lower
  assert.ok(a.speedAtHr.kmh > 9.6);
});
test('hilly run is flagged (speed as-is, not grade-adjusted)', () => {
  const a = I.aerobic(cardioLogOf(F.z2Run({ hill: true, elevGain: 180, seed: 4 })), { kind: 'run' });
  assert.strictEqual(a.hilly, true); assert.ok(a.notes.some(n => /grade/.test(n)));
});
test('custom HR band', () => {
  const a = I.aerobic(z2, { kind: 'run', hrLo: 145, hrHi: 150 });
  assert.strictEqual(a.speedAtHr.hrLo, 145); assert.ok(a.speedAtHr.minutes < 38);
});
test('4x4 intervals → not valid for speed-at-HR / decoupling', () => {
  const log = cardioLogOf(F.fourByFour());
  const a = I.aerobic(log, { kind: 'run' });
  assert.strictEqual(log.structure.kind, 'intervals');
  assert.strictEqual(a.valid, false); assert.strictEqual(a.why, 'interval session'); assert.strictEqual(a.speedAtHr, null);
});
test('interval run without detected structure still gets too few band minutes', () => {
  const log = cardioLogOf(F.fourByFour()); delete log.structure;
  const a = I.aerobic(log, { kind: 'run' });
  assert.ok(!a.speedAtHr || a.speedAtHr.minutes < 15);
});
test('indoor bike (no route) → HR drift only, kind bike', () => {
  const a = I.aerobic(cardioLogOf(F.indoorBike()), { kind: 'bike' });
  assert.strictEqual(a.speedAtHr, null); assert.strictEqual(a.decoupling, null);
  assert.strictEqual(a.valid, true); near(a.hrDrift, 0.5, 1);
});
test('outdoor ride → km/h, kind inferred from speed when not given', () => {
  const a = I.aerobic(cardioLogOf(F.outdoorRide()));
  assert.strictEqual(a.kind, 'bike'); near(a.speedAtHr.kmh, 27, 0.5); assert.ok(a.decoupling > 2);
});
test('manual cardio log (no series) → invalid with reason', () => {
  const a = I.aerobic({ duration: 3000, distanceKm: 7.5, appleFitnessLink: '', note: '' }, { kind: 'run' });
  assert.strictEqual(a.valid, false); assert.match(a.why, /no 30s series/);
});
test('short run (10 min warm-up before sprints) → no speed-at-HR', () => {
  const log = cardioLogOf(F.ruttioJSON({ durSec: 900, plan: t => ({ sp: 2.6, hr: 120 + t / 30 }) }));
  const a = I.aerobic(log, { kind: 'run' });
  assert.strictEqual(a.valid, false);
});
test('kindOf reads exercise id / name', () => {
  assert.strictEqual(I.kindOf({ id: 'z2-cycling' }), 'bike');
  assert.strictEqual(I.kindOf({ id: 'easy-run' }), 'run');
  assert.strictEqual(I.kindOf({ id: 'imported-run', name: 'Running' }), 'run');
  assert.strictEqual(I.kindOf({ id: 'imported-run', name: 'Indoor Cycling' }), 'bike');
});
test('aerobicTrend: runs and rides separated, sorted, non-cardio ignored', () => {
  const mk = (date, id, name, log) => ({ date, blocks: [{ key: 'main-focus:cardio', exercises: [{ id, name, logType: 'cardio', cardioLog: log }] }] });
  const sessions = [
    mk('2026-10-08', 'easy-run', 'Easy run', cardioLogOf(F.z2Run({ speed: 2.85, seed: 2 }))),
    mk('2026-10-06', 'z2-cycling', 'Zone 2 indoor cycling', cardioLogOf(F.indoorBike())),
    mk('2026-10-01', 'easy-run', 'Easy run', z2),
    mk('2026-10-03', 'imported-run', 'Running', cardioLogOf(F.fourByFour())),
    F.session('2026-09-28', 'squat', F.sets([F.set(60, 5)]), null),
    mk('2026-10-02', 'easy-run', 'Easy run', { duration: 1800, distanceKm: 4.4 }),   // manual, no series
  ];
  const t = I.aerobicTrend(sessions);
  assert.deepStrictEqual(t.run.map(p => p.date), ['2026-10-01', '2026-10-03', '2026-10-08']);
  assert.deepStrictEqual(t.bike.map(p => p.date), ['2026-10-06']);
  assert.strictEqual(t.run[1].valid, false);
  assert.ok(t.run[2].speedAtHr.kmh > t.run[0].speedAtHr.kmh);   // faster at the same HR
  ['date', 'kind', 'speedAtHr', 'decoupling', 'hrDrift', 'avgHr', 'minutes', 'hilly', 'valid', 'why', 'exerciseId']
    .forEach(k => assert.ok(k in t.run[0], k));
});

console.log('progression');
const { set, sets, hold, session, LIB } = F;
const ramp = [set(20, 8, { note: 'warmup' }), set(30, 5), set(42, 3)];
const P = (id, hist, target) => I.progression(id, hist, target, { lib: LIB[id] });
const T = (s, r, kg) => ({ sets: s, reps: r, loadKg: kg });

test('no history → none', () => {
  const r = P('squat', [], T(3, 5, 60));
  assert.strictEqual(r.action, 'none'); assert.match(r.reason, /No logged sets/);
});
test('met 3×5 @60 at RPE 8 (with ramp sets) → +2.5', () => {
  const h = [session('2026-10-05', 'squat', sets([...ramp, set(60, 5, { rpe: 7 }), set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 })]), T(3, 5, 60))];
  const r = P('squat', h, T(3, 5, 60));
  assert.strictEqual(r.action, 'increase'); assert.strictEqual(r.loadKg, 62.5); assert.strictEqual(r.reps, 5); assert.strictEqual(r.sets, 3);
});
test('lower body, every set RPE ≤ 7 → +5', () => {
  const h = [session('2026-10-05', 'deadlift', sets([set(85, 5, { rpe: 6 }), set(85, 5, { rpe: 7 }), set(85, 5, { rpe: 7 })]), T(3, 5, 85))];
  assert.strictEqual(P('deadlift', h, T(3, 5, 85)).loadKg, 90);
});
test('upper body steps: OHP +1, incline +2', () => {
  const o = [session('2026-10-02', 'overhead-press', sets([set(35, 5, { rpe: 7 }), set(35, 5, { rpe: 7 }), set(35, 5, { rpe: 8 })]), T(3, 5, 35))];
  assert.strictEqual(P('overhead-press', o, T(3, 5, 35)).loadKg, 36);
  const b = [session('2026-10-05', 'incline-bench', sets([set(54, 5, { rpe: 8 }), set(54, 5, { rpe: 8 }), set(54, 5, { rpe: 8 })]), T(3, 5, 54))];
  assert.strictEqual(P('incline-bench', b, T(3, 5, 54)).loadKg, 56);
});
test('met at RPE 9 → repeat', () => {
  const h = [session('2026-10-05', 'squat', sets([set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 9 }), set(60, 5, { rpe: 9 })]), T(3, 5, 60))];
  const r = P('squat', h, T(3, 5, 60));
  assert.strictEqual(r.action, 'repeat'); assert.strictEqual(r.loadKg, 60);
});
test('RPE from a Hevy import lives in the note ("RPE 7.5") and is read', () => {
  const hevy = (w, r, rpe) => set(w, r, { note: `RPE ${rpe}`, source: 'hevy' });
  const h = [session('2026-10-05', 'squat', sets([hevy(60, 5, 7.5), hevy(60, 5, 8), hevy(60, 5, 8)]), T(3, 5, 60))];
  assert.strictEqual(P('squat', h, T(3, 5, 60)).action, 'increase');
  const h9 = [session('2026-10-05', 'squat', sets([hevy(60, 5, 8), hevy(60, 5, 9.5), hevy(60, 5, 9)]), T(3, 5, 60))];
  assert.strictEqual(P('squat', h9, T(3, 5, 60)).action, 'repeat');
});
test('met without RPE once → repeat; twice running → increase', () => {
  const s1 = session('2026-10-05', 'squat', sets([set(60, 5), set(60, 5), set(60, 5)]), T(3, 5, 60));
  const s0 = session('2026-09-28', 'squat', sets([set(60, 5), set(60, 5), set(60, 5)]), T(3, 5, 60));
  const r1 = P('squat', [s1], T(3, 5, 60));
  assert.strictEqual(r1.action, 'repeat'); assert.match(r1.reason, /no RPE/);
  const r2 = P('squat', [s1, s0], T(3, 5, 60));
  assert.strictEqual(r2.action, 'increase'); assert.strictEqual(r2.loadKg, 62.5);
});
test('no RPE: previous met at RPE 9 does not count as a clean session', () => {
  const s1 = session('2026-10-05', 'squat', sets([set(60, 5), set(60, 5), set(60, 5)]), T(3, 5, 60));
  const s0 = session('2026-09-28', 'squat', sets([set(60, 5, { rpe: 9 }), set(60, 5, { rpe: 9 }), set(60, 5, { rpe: 9 })]), T(3, 5, 60));
  assert.strictEqual(P('squat', [s1, s0], T(3, 5, 60)).action, 'repeat');
});
test('missed reps (5,5,4) → repeat', () => {
  const h = [session('2026-10-05', 'squat', sets([set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 9 }), set(60, 4, { rpe: 10 })]), T(3, 5, 60))];
  const r = P('squat', h, T(3, 5, 60));
  assert.strictEqual(r.action, 'repeat'); assert.match(r.reason, /2\/3 sets/);
});
test('missed twice running → −5%, rounded to 0.5 kg', () => {
  const miss = d => session(d, 'squat', sets([set(60, 5), set(60, 4), set(60, 3)]), T(3, 5, 60));
  const r = P('squat', [miss('2026-10-12'), miss('2026-10-05')], T(3, 5, 60));
  assert.strictEqual(r.action, 'decrease'); assert.strictEqual(r.loadKg, 57);
  const missB = d => session(d, 'incline-bench', sets([set(54, 5), set(54, 4), set(54, 4)]), T(3, 5, 54));
  assert.strictEqual(P('incline-bench', [missB('2026-10-12'), missB('2026-10-05')], T(3, 5, 54)).loadKg, 51.5);
});
test('lighter-than-target work counts as a miss (ramp never reached target)', () => {
  const h = [session('2026-10-05', 'squat', sets([...ramp, set(55, 5, { rpe: 7 }), set(55, 5, { rpe: 7 }), set(55, 5, { rpe: 7 })]), T(3, 5, 60))];
  assert.strictEqual(P('squat', h, T(3, 5, 60)).action, 'repeat');
});
test('skipped / not-completed sets are ignored', () => {
  const h = [session('2026-10-05', 'squat', sets([set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8, completed: false })]), T(3, 5, 60))];
  assert.strictEqual(P('squat', h, T(3, 5, 60)).action, 'repeat');
});
test('each exposure judged against its own stored target; plan target noted when it differs', () => {
  const h = [session('2026-10-05', 'squat', sets([set(57.5, 5, { rpe: 8 }), set(57.5, 5, { rpe: 8 }), set(57.5, 5, { rpe: 8 })]), T(3, 5, 57.5))];
  const r = P('squat', h, T(3, 5, 62.5));
  assert.strictEqual(r.action, 'increase'); assert.strictEqual(r.loadKg, 60); assert.match(r.reason, /Plan says 62.5 kg/);
});
test('History.getExerciseHistory rows ({date, sets}, newest first, no target) + passed target', () => {
  const rows = [
    { date: '2026-10-05', sets: sets([set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 })]) },
    { date: '2026-09-28', sets: sets([set(57.5, 5, { rpe: 8 }), set(57.5, 5, { rpe: 8 }), set(57.5, 5, { rpe: 8 })]) },
  ];
  const r = P('squat', rows, T(3, 5, 60));
  assert.strictEqual(r.action, 'increase'); assert.strictEqual(r.loadKg, 62.5);
});
test('two rows on the same date (checkpoint + final log) merge into one exposure', () => {
  const rows = [
    { date: '2026-10-05', sets: sets([set(60, 5, { rpe: 8 })]) },
    { date: '2026-10-05', sets: sets([set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 })]) },
  ];
  assert.strictEqual(P('squat', rows, T(3, 5, 60)).action, 'increase');
});
test('no target anywhere → judged against last session’s own top sets', () => {
  const rows = [{ date: '2026-10-05', sets: sets([set(40, 5), set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 })]) }];
  const r = P('squat', rows, null);
  assert.strictEqual(r.action, 'increase'); assert.strictEqual(r.loadKg, 62.5); assert.match(r.reason, /no plan target/);
});
test('pull-ups (bodyweightBase) double progression 3×6 → 3×7 → 3×8 → +2.5 kg', () => {
  const pu = (d, reps, add) => session(d, 'pull-up', sets(reps.map(r => set(add, r, { rpe: 8 }))), T(3, 6));
  let r = P('pull-up', [pu('2026-10-05', [6, 6, 6])], T(3, 6));
  assert.strictEqual(r.action, 'increase'); assert.strictEqual(r.reps, 7); assert.strictEqual(r.loadKg, null);
  r = P('pull-up', [pu('2026-10-09', [7, 7, 7])], T(3, 6));
  assert.strictEqual(r.reps, 8);
  r = P('pull-up', [pu('2026-10-12', [8, 8, 8])], T(3, 6));
  assert.strictEqual(r.reps, 6); assert.strictEqual(r.loadKg, 2.5);
  r = P('pull-up', [pu('2026-10-16', [6, 6, 6].map(x => x), 2.5)], T(3, 6));
  assert.strictEqual(r.action, 'increase'); assert.strictEqual(r.reps, 7); assert.strictEqual(r.loadKg, 2.5);
});
test('pull-ups 6/5/3/3 against 4×4 → repeat; twice → 4×3', () => {
  const pu = d => session(d, 'pull-up', sets([set(null, 6), set(null, 5), set(null, 3), set(null, 3)]), T(4, 4));
  assert.strictEqual(P('pull-up', [pu('2026-10-05')], T(4, 4)).action, 'repeat');
  const r = P('pull-up', [pu('2026-10-09'), pu('2026-10-05')], T(4, 4));
  assert.strictEqual(r.action, 'decrease'); assert.strictEqual(r.reps, 3);
});
test('weighted dips +7.5: 3×6 → 3×7 at +7.5; 3×8 → 3×6 at +10; misses → +5', () => {
  const tg = { sets: 3, reps: 6, loadKg: 7.5, bodyweightPlus: true };
  const dp = (d, reps, add, rpe = 8) => session(d, 'triceps-dip', sets(reps.map(r => set(add, r, { rpe }))), tg);
  let r = P('triceps-dip', [dp('2026-10-02', [6, 6, 6], 7.5)], tg);
  assert.strictEqual(r.reps, 7); assert.strictEqual(r.loadKg, 7.5);
  r = P('triceps-dip', [dp('2026-10-09', [8, 8, 8], 7.5)], tg);
  assert.strictEqual(r.reps, 6); assert.strictEqual(r.loadKg, 10);
  r = P('triceps-dip', [dp('2026-10-09', [6, 5, 4], 7.5, 9), dp('2026-10-02', [6, 5, 5], 7.5, 9)], tg);
  assert.strictEqual(r.action, 'decrease'); assert.strictEqual(r.loadKg, 5);
});
test('holds progress seconds', () => {
  const tg = { sets: 3, durationSec: 20 };
  const hs = (d, secs, rpe) => session(d, 'false-grip-hang', sets(secs.map(s => hold(s, rpe ? { rpe } : {}))), tg);
  let r = P('false-grip-hang', [hs('2026-10-05', [22, 20, 21], 7)], tg);
  assert.strictEqual(r.action, 'increase'); assert.strictEqual(r.durationSec, 25);
  const tg30 = { sets: 3, durationSec: 30 };
  r = P('false-grip-hang', [session('2026-10-05', 'false-grip-hang', sets([hold(30), hold(31), hold(30)]), tg30),
                            session('2026-10-01', 'false-grip-hang', sets([hold(30), hold(30), hold(30)]), tg30)], tg30);
  assert.strictEqual(r.durationSec, 40);
  r = P('false-grip-hang', [hs('2026-10-05', [20, 15, 12]), hs('2026-10-01', [20, 18, 14])], tg);
  assert.strictEqual(r.action, 'decrease'); assert.strictEqual(r.durationSec, 15);
});
test('reps-only exercise (toes to bar) → +1 rep', () => {
  const tg = { sets: 3, reps: 8 };
  const r = P('toes-to-bar', [{ date: '2026-10-05', sets: sets([set(null, 8, { rpe: 7 }), set(null, 8, { rpe: 8 }), set(null, 9, { rpe: 8 })]) }], tg);
  assert.strictEqual(r.action, 'increase'); assert.strictEqual(r.reps, 9);
});
test('return shape is stable', () => {
  const r = P('squat', [session('2026-10-05', 'squat', sets([set(60, 5, { rpe: 8 })]), T(1, 5, 60))], T(1, 5, 60));
  assert.deepStrictEqual(Object.keys(r).sort(), ['action', 'durationSec', 'loadKg', 'reason', 'reps', 'sets']);
});
test('pure: inputs are not mutated', () => {
  const h = [session('2026-10-05', 'squat', sets([set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 })]), T(3, 5, 60))];
  const before = JSON.stringify(h), doc = vitalsDoc(90, END, normal), db = JSON.stringify(doc), zb = JSON.stringify(z2);
  P('squat', h, T(3, 5, 60)); I.readiness(doc, END); I.aerobic(z2, { kind: 'run' });
  assert.strictEqual(JSON.stringify(h), before); assert.strictEqual(JSON.stringify(doc), db); assert.strictEqual(JSON.stringify(z2), zb);
});

// ── legacy comparison (informational, asserts current behaviour) ──
console.log('legacy History.getProgressionSuggestion (app.js) on the same fixtures');
(function legacy() {
  const store = {};
  const localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }, key: i => Object.keys(store)[i], get length() { return Object.keys(store).length; } };
  const ctx = vm.createContext({ localStorage, console, LIBRARY: [], GOALS: [] });
  const src = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8').replace(/^'use strict';?/m, '');
  vm.runInContext(src + ';this.History=History;this.DB=DB;', ctx);
  const H = ctx.History;
  const load = list => { Object.keys(store).forEach(k => delete store[k]); list.slice().reverse().forEach(s => H.saveSession(JSON.parse(JSON.stringify(s)))); };
  const good = d => session(d, 'squat', sets([...ramp, set(60, 5, { rpe: 7 }), set(60, 5, { rpe: 8 }), set(60, 5, { rpe: 8 })]), T(3, 5, 60));
  test('legacy never fires when ramp sets are logged (all weights must be equal)', () => {
    load([good('2026-10-12'), good('2026-10-09'), good('2026-10-05')]);
    assert.strictEqual(H.getProgressionSuggestion('squat').suggest, false);
    assert.strictEqual(P('squat', [good('2026-10-12')], T(3, 5, 60)).action, 'increase');
  });
  test('legacy says "add 2.5–5kg" after 3 sessions of missed reps at the same weight', () => {
    const bad = d => session(d, 'squat', sets([set(60, 5), set(60, 3), set(60, 2)]), T(3, 5, 60));
    load([bad('2026-10-12'), bad('2026-10-09'), bad('2026-10-05')]);
    assert.strictEqual(H.getProgressionSuggestion('squat').suggest, true);
    assert.strictEqual(P('squat', [bad('2026-10-12'), bad('2026-10-09')], T(3, 5, 60)).action, 'decrease');
  });
  test('legacy is silent for bodyweight pull-ups (no weight logged)', () => {
    const pu = d => session(d, 'pull-up', sets([set(null, 6, { rpe: 8 }), set(null, 6, { rpe: 8 }), set(null, 6, { rpe: 8 })]), T(3, 6));
    load([pu('2026-10-12'), pu('2026-10-09'), pu('2026-10-05')]);
    assert.strictEqual(H.getProgressionSuggestion('pull-up').suggest, false);
  });
})();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
