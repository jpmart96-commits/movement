'use strict';
// Watch import: several Ruttio files at once, grouped into workouts, linked
// to the day's blocks (26 Sep: an "Other" keepie-uppies workout and the ride).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { freshContext, generateDay } = require('./helpers');

const app = freshContext({ quiet: true, now: new Date('2026-09-26T12:30:00') });
const G = app.Generator, W = app.WatchImport, P = () => app.Profile.load();

// A Ruttio-shaped JSON: HR every 5s, optional route speed.
function ruttio({ id, sport, start, minutes, hr, speed }) {
  const t0 = Date.parse(start), n = minutes * 12;
  const iso = i => new Date(t0 + i * 5000).toISOString();
  return JSON.stringify({
    id, activityTypeName: sport, startTime: new Date(t0).toISOString(), endTime: new Date(t0 + minutes * 60000).toISOString(),
    durationSeconds: minutes * 60, totalDistanceMeters: speed ? speed * minutes * 60 : 0,
    averageHeartRateBPM: hr, maxHeartRateBPM: hr + 12, totalEnergyBurnedKilocalories: minutes * 7,
    heartRateSamples: Array.from({ length: n }, (_, i) => ({ timestamp: iso(i), bpm: hr + (i % 7) - 3 })),
    route: speed ? Array.from({ length: n }, (_, i) => ({ timestamp: iso(i), speedMetersPerSecond: speed, altitudeMeters: 50 })) : [],
  });
}
const OTHER = { name: 'workout_a.json', text: ruttio({ id: 'W-OTHER', sport: 'Other', start: '2026-09-26T09:12:00+01:00', minutes: 21, hr: 128 }) };
const RIDE  = { name: 'workout_b.json', text: ruttio({ id: 'W-RIDE', sport: 'Cycling', start: '2026-09-26T09:55:00+01:00', minutes: 45, hr: 141 }) };

function todayEdited() {
  let s = generateDay(app, '2026-09-26');
  s = G.applyOverride(s, { action: 'swap_modality', modality: 'bike' }, P());
  s = G.applyOverride(s, { action: 'remove_block', blockKey: 'accessory' }, P());
  return G.applyOverride(s, { action: 'remove_block', blockKey: 'close' }, P());
}

test('groups files into workouts, pairs a TCX with its JSON, ignores the rest', () => {
  const dir = path.join(__dirname, '..', 'samples');
  const extra = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^workout_1789060667/.test(f)).map(f => ({ name: f, text: fs.readFileSync(path.join(dir, f), 'utf8') })) : [];
  const g = W.group([OTHER, RIDE, { name: 'route.gpx', text: '<gpx/>' }, ...extra], P());
  assert.deepEqual(g.workouts.map(w => w.kind).filter(k => k !== 'run'), ['other', 'bike']);
  assert.ok(g.ignored.some(x => x.name === 'route.gpx'));
  if (extra.length) {
    const run = g.workouts.find(w => w.kind === 'run');
    assert.ok(run && run.tcxFile, 'the sample TCX pairs with its JSON');
  }
});

test('26 Sep: Other → Complementary, ride → the Main Focus bike; another day is skipped', () => {
  const s = todayEdited();
  const g = W.group([OTHER, RIDE], P());
  const p = W.propose(s, g.workouts);
  assert.equal(s.blocks[p[0].blockIdx].key, 'complementary');
  assert.equal(p[1].kind, 'cardio');
  assert.equal(s.blocks[p[1].blockIdx].exercises[p[1].exIdx].id, 'z2-cycling');
  const other = W.group([{ name: 'x.json', text: ruttio({ id: 'W-OLD', sport: 'Other', start: '2026-09-24T09:00:00+01:00', minutes: 20, hr: 120 }) }], P());
  assert.equal(W.propose(s, other.workouts)[0].kind, 'skip');
});

test('apply: keepie-uppies replaces the planned vision drills, the ride carries HR and zones, window from the watch', () => {
  const s = todayEdited();
  const g = W.group([OTHER, RIDE], P());
  const p = W.propose(s, g.workouts);
  W.apply(s, [
    { workout: g.workouts[0], target: p[0], markDone: false, doneInstead: 'keepie-uppies' },
    { workout: g.workouts[1], target: p[1] },
  ], P());
  const comp = s.blocks.find(b => b.key === 'complementary');
  assert.equal(comp.watch[0].avgHR, 128);
  const k = comp.exercises.find(e => e.id === 'keepie-uppies');
  assert.equal(k.sets[0].duration, 21 * 60);
  assert.ok(comp.exercises.filter(e => e.id !== 'keepie-uppies').every(e => e.skipped && e.skipReason === 'replaced'));
  const ride = s.blocks.find(b => b.mainFocus).exercises[0];
  assert.equal(ride.cardioLog.watchId, 'W-RIDE');
  assert.equal(ride.cardioLog.avgHR, 141);
  assert.ok(ride.cardioLog.zones && ride.cardioLog.series.length > 50);
  assert.ok(ride.completed);
  assert.equal(new Date(s.watchWindow.start).getHours(), 9);
  // importing the same files again changes nothing
  assert.ok(W.propose(s, W.group([OTHER, RIDE], P()).workouts).every(x => x.kind === 'skip'));
});

test('mark done: an untouched block linked to a workout ticks its planned doses', () => {
  const s = todayEdited();
  const g = W.group([OTHER], P());
  W.apply(s, [{ workout: g.workouts[0], target: { kind: 'block', blockIdx: 0 }, markDone: true }], P());
  assert.ok(s.blocks[0].exercises.every(e => e.completed));
  assert.equal(s.blocks[0].watch.length, 1);
});
