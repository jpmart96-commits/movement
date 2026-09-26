// Fixtures for the Insights tests. Realistic shapes only:
//  - Ruttio/Apple JSON exports (the format RuttioImport.parseJSON reads),
//    synthesised second by second, then run through the real
//    RuttioImport.review so the cardioLog.series under test is exactly what
//    the app stores (30s bins {t, hr, sp, alt}).
//  - Stored sessions shaped like History.saveSession / LiveSession.logSet /
//    HevyImport._toAppSets (sets: {idx, weight, reps, duration, note,
//    completed, loggedAt}).
'use strict';

// Deterministic noise so tests never flake.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// One Apple-style workout. `plan(t)` returns { sp (m/s), hr (bpm|null), alt }
// for second t. HR is sampled every 5s (Apple's cadence during workouts),
// the route every second; hrStartSec drops the head of the HR stream the way
// Apple does while the watch gets a lock.
function ruttioJSON({ sport = 'Running', start = '2026-10-01T08:00:00+01:00', durSec, plan, hrStartSec = 0, seed = 1, route = true, elevGain = null }) {
  const r = rng(seed);
  const t0 = Date.parse(start);
  const iso = t => new Date(t0 + t * 1000).toISOString();
  const hrs = [], pts = [];
  let dist = 0, sumHr = 0, nHr = 0, maxHr = 0;
  for (let t = 0; t < durSec; t++) {
    const p = plan(t);
    const sp = Math.max(0, p.sp + (p.sp > 0.5 ? (r() - 0.5) * 0.3 : 0));
    dist += sp;
    if (route) pts.push({ timestamp: iso(t), speedMetersPerSecond: sp, altitudeMeters: p.alt != null ? p.alt : 50 });
    if (t >= hrStartSec && t % 5 === 0 && p.hr != null) {
      const bpm = Math.round(p.hr + (r() - 0.5) * 4);
      hrs.push({ timestamp: iso(t), bpm });
      sumHr += bpm; nHr++; maxHr = Math.max(maxHr, bpm);
    }
  }
  return {
    activityTypeName: sport, startTime: iso(0), endTime: iso(durSec), durationSeconds: durSec,
    totalDistanceMeters: route ? dist : 0, averageHeartRateBPM: nHr ? sumHr / nHr : null, maxHeartRateBPM: maxHr || null,
    elevationGainMeters: elevGain, heartRateSamples: hrs, route: route ? pts : [],
  };
}

const lerp = (a, b, f) => a + (b - a) * Math.min(1, Math.max(0, f));

// 50 min easy run: 10 min build (2.5 m/s, HR 115→140), then 40 min at a
// steady 2.75 m/s (6:04/km) with HR drifting 143 → 151. HR starts at 1:30.
// A 2-minute stop (traffic light / shoelace) at 30:00.
function z2Run(opts = {}) {
  const drift = opts.drift != null ? opts.drift : 8;
  return ruttioJSON({
    durSec: 3000, hrStartSec: 90, seed: opts.seed || 7, elevGain: opts.elevGain != null ? opts.elevGain : 25,
    start: opts.start,
    plan: t => {
      if (t >= 1800 && t < 1920) return { sp: 0, hr: 125, alt: 50 };
      if (t < 600) return { sp: 2.5, hr: lerp(115, 140, t / 600), alt: 50 };
      const f = (t - 600) / 2400;
      return { sp: opts.speed || 2.75, hr: 143 + drift * f, alt: opts.hill ? 50 + 40 * Math.sin(t / 300) : 50 };
    },
  });
}

// Norwegian 4x4: 10 min warm-up, 4 × (4 min hard 3.6 m/s @ ~175, 3 min easy).
function fourByFour() {
  return ruttioJSON({
    durSec: 10 * 60 + 4 * 7 * 60 + 300, seed: 3,
    plan: t => {
      if (t < 600) return { sp: 2.4, hr: lerp(110, 135, t / 600) };
      const k = t - 600, cyc = Math.floor(k / 420), inCyc = k % 420;
      if (cyc >= 4) return { sp: 2.2, hr: 130 };
      return inCyc < 240 ? { sp: 3.6, hr: lerp(150, 178, inCyc / 90) } : { sp: 1.8, hr: lerp(175, 135, (inCyc - 240) / 120) };
    },
  });
}

// Indoor Z2 bike: no route at all, HR flat 147–148 (like 22 Sep).
function indoorBike() {
  return ruttioJSON({ sport: 'Indoor Cycling', durSec: 3600, route: false, seed: 11,
    plan: t => ({ sp: 0, hr: t < 600 ? lerp(100, 145, t / 600) : 147 + (t > 3000 ? 1 : 0) }) });
}

// Outdoor ride with GPS: 7.5 m/s (27 km/h), HR 140→146.
function outdoorRide() {
  return ruttioJSON({ sport: 'Cycling', durSec: 3600, seed: 5,
    plan: t => ({ sp: t < 600 ? 6 : 7.5, hr: t < 600 ? lerp(105, 138, t / 600) : 140 + 6 * (t - 600) / 3000 }) });
}

// ── Strength sessions ───────────────────────────────────────
let _at = Date.parse('2026-09-28T09:00:00Z');
function set(weight, reps, extra = {}) {
  _at += 180000;
  return { idx: 0, weight: weight || null, reps: reps || null, duration: null, note: '', completed: true, loggedAt: _at, ...extra };
}
function sets(list) { return list.map((s, i) => ({ ...s, idx: i + 1 })); }
function hold(sec, extra = {}) { return { idx: 0, weight: null, reps: null, duration: sec, note: '', completed: true, ...extra }; }

// A stored session holding one Main Focus exercise (and a decoy).
function session(date, exId, exSets, target) {
  return {
    date, theme: 'Strength A', source: 'generated', status: 'completed',
    blocks: [
      { key: 'open', label: 'Open', exercises: [{ id: 'daily-constant-0', logType: 'none', sets: [] }] },
      { key: 'main-focus:weights', label: 'Main Focus', mainFocus: true, exercises: [
        { id: exId, name: exId, logType: 'weight+reps', role: 'main', target, sets: exSets, completed: true },
        { id: 'toes-to-bar', name: 'Toes to bar', logType: 'reps', sets: sets([set(null, 8), set(null, 8)]) },
      ] },
    ],
  };
}

// Library entries the progression rules key off (copied from data/library.js).
const LIB = {
  squat: { id: 'squat', name: 'Squat', subcategory: 'Strength A', logType: 'weight+reps', intensityTier: 'heavy' },
  deadlift: { id: 'deadlift', name: 'Deadlift', subcategory: 'Strength B', logType: 'weight+reps' },
  'overhead-press': { id: 'overhead-press', name: 'Overhead press', subcategory: 'Strength B', logType: 'weight+reps' },
  'incline-bench': { id: 'incline-bench', name: 'Incline bench press', subcategory: 'Strength A', logType: 'weight+reps' },
  'pull-up': { id: 'pull-up', name: 'Pull-up', logType: 'weight+reps', bodyweightBase: true },
  'triceps-dip': { id: 'triceps-dip', name: 'Triceps dip', logType: 'weight+reps', bodyweightBase: true },
  'toes-to-bar': { id: 'toes-to-bar', name: 'Toes to bar', logType: 'reps' },
  'false-grip-hang': { id: 'false-grip-hang', name: 'False grip hang', logType: 'hold' },
};

module.exports = { ruttioJSON, z2Run, fourByFour, indoorBike, outdoorRide, set, sets, hold, session, LIB };
