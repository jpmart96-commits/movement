'use strict';
// Training load: session RPE × minutes, week against the usual week.
const test = require('node:test');
const assert = require('node:assert');
const { freshContext } = require('./helpers');

const app = freshContext({ quiet: true, now: new Date('2026-10-20T12:00:00') });
const TL = app.TrainingLoad;
const add = (k, n) => { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); const p = x => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const S = (date, minutes, extra = {}) => ({ date, duration: minutes, status: 'completed', blocks: [], ...extra });

test('RPE source: logged session RPE, else set RPEs, else day type', () => {
  assert.deepEqual(TL.sessionRpe(S('2026-10-01', 60, { sessionRpe: 7 })), { rpe: 7, estimated: false, source: 'session' });
  const sets = S('2026-10-01', 60, { blocks: [{ exercises: [{ sets: [{ rpe: 9 }, { rpe: 8 }, { rpe: 6 }, { rpe: 5 }] }] }] });
  assert.equal(TL.sessionRpe(sets).source, 'sets');
  assert.equal(TL.sessionRpe(sets).rpe, 7.5);
  assert.equal(TL.sessionRpe(S('2026-10-01', 60, { dayKind: 'z2-bike' })).rpe, 4);
});

test('minutes come from the watch window when there is one', () => {
  assert.equal(TL.minutes(S('2026-10-01', 140, { watchWindow: { start: '2026-10-01T08:12:00Z', end: '2026-10-01T09:40:00Z' } })), 88);
  assert.equal(TL.minutes(S('2026-10-01', 140)), 140);
});

test('steady weeks: ratio ≈ 1, no flag; a doubled week: spike', () => {
  const steady = [];
  // A realistic week: hard and easy days alternate, one light day.
  for (let i = 0; i < 35; i++) steady.push(S(add('2026-10-20', -i), i % 7 === 6 ? 85 : 140, { sessionRpe: i % 7 === 6 ? 2 : (i % 2 ? 7 : 4) }));
  const s1 = TL.summary(steady, '2026-10-20');
  assert.ok(s1.enough);
  assert.ok(Math.abs(s1.ratio - 1) < 0.1, 'ratio ' + s1.ratio);
  assert.equal(s1.flag, null);
  const hot = steady.map(x => x.date >= add('2026-10-20', -6) ? { ...x, duration: 220, sessionRpe: 7 } : x);
  const s2 = TL.summary(hot, '2026-10-20');
  assert.equal(s2.flag, 'spike');
  assert.ok(s2.ratio > 1.5);
  assert.equal(s2.weeks.length, 8);
});

test('under three weeks of history: no ratio, no warning', () => {
  const s = TL.summary([S('2026-10-15', 120, { sessionRpe: 8 }), S('2026-10-19', 140, { sessionRpe: 9 })], '2026-10-20');
  assert.equal(s.enough, false);
  assert.equal(s.ratio, null);
  assert.equal(s.flag, null);
});

test('in-progress checkpoints are not counted', () => {
  const d = TL.daily([S('2026-10-19', 60, { sessionRpe: 5 }), S('2026-10-19', 60, { sessionRpe: 5, status: 'in-progress' })]);
  assert.equal(d['2026-10-19'].load, 300);
});

test('a typed weigh-in survives a vitals file without weight that day; setLoad uses it', () => {
  app.Vitals.addWeight('2026-10-19', 73.4);
  app.Vitals.merge({ kind: 'movement-vitals', days: { '2026-10-19': { rhr: 55 } } });
  assert.equal(app.Vitals.load().days['2026-10-19'].weight, 73.4);
  assert.equal(app.Vitals.load().days['2026-10-19'].rhr, 55);
  assert.equal(app.History.setLoad('pull-up', { weight: 10, reps: 6 }), 83.4);
});

test('a newer Health weigh-in beats an older number typed in Settings (the 74 → 73.3 case)', () => {
  app.storage.reset();
  const p = app.Profile.load(); p.settings.bodyweightKg = 74; app.Profile.save(p);
  assert.deepEqual({ ...app.Vitals.bodyweight() }, { v: 74, date: null, src: 'setting' });   // no weigh-ins yet
  app.Vitals.merge({ kind: 'movement-vitals', days: { '2026-07-09': { weight: 73.6 }, '2026-09-23': { weight: 73.3, rhr: 57 } } });
  assert.deepEqual({ ...app.Vitals.bodyweight() }, { v: 73.3, date: '2026-09-23', src: 'health' });
  assert.equal(app.History.setLoad('pull-up', { weight: 10, reps: 6 }), 83.3);
  app.Vitals.addWeight('2026-10-20', 72.9);                                                   // typed today
  assert.deepEqual({ ...app.Vitals.bodyweight() }, { v: 72.9, date: '2026-10-20', src: 'app' });
});
