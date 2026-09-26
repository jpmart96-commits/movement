'use strict';
// Day editing, trades, carry-forward, one-tap logging and the block draft
// (26 Sep 2026). Each test states the behaviour the app promises.
const test = require('node:test');
const assert = require('node:assert');
const { freshContext, generateDay } = require('./helpers');

const app = freshContext({ quiet: true, now: new Date('2026-09-26T08:30:00') });
const G = app.Generator, P = () => app.Profile.load();
const mf = s => s.blocks.find(b => b.mainFocus);
const ids = b => (b.exercises || []).map(e => e.id);
const logFirst = s => { const e = s.blocks[0].exercises[0]; e.sets = [{ idx: 1, reps: 5, completed: true }]; e.completed = true; return e.id; };

test('26 Sep: run → bike keeps minutes and HR cap, rewrites the text for the bike', () => {
  const s = generateDay(app, '2026-09-26');
  const r = G.applyOverride(s, { action: 'swap_modality', modality: 'bike' }, P());
  assert.ok(r);
  const ex = mf(r).exercises[0];
  assert.equal(ex.id, 'z2-cycling');
  assert.equal(mf(r).label, 'Zone 2 bike');
  assert.match(ex.target.text, /45 min under 153/);
  assert.doesNotMatch(ex.target.text + ' ' + mf(r).note, /walk the hills/i);
  assert.equal(ex.target.durationSec, mf(s).exercises[0].target.durationSec);
  assert.equal(r.duration, s.duration);
});

test('remove a block: the day gets shorter; restore puts it back where it was', () => {
  const s = generateDay(app, '2026-09-26');
  const r = G.applyOverride(s, { action: 'remove_block', blockKey: 'accessory' }, P());
  assert.equal(r.duration, s.duration - 15);
  assert.ok(!r.blocks.some(b => b.key === 'accessory'));
  assert.equal(r.removedBlocks.length, 1);
  assert.equal(r.plannedDuration, 140);
  const back = G.applyOverride(r, { action: 'restore_block', blockKey: 'accessory' }, P());
  assert.deepEqual(back.blocks.map(b => b.key), s.blocks.map(b => b.key));
  assert.equal(back.duration, 140);
  assert.equal(back.removedBlocks.length, 0);
});

test('a block with logged work cannot be removed', () => {
  const s = generateDay(app, '2026-09-26');
  logFirst(s);
  assert.equal(G.applyOverride(s, { action: 'remove_block', blockKey: s.blocks[0].key }, P()), null);
});

test('resize, move, domain and skill-line swaps change only their block', () => {
  const s = generateDay(app, '2026-09-26');
  const r1 = G.applyOverride(s, { action: 'resize_block', blockKey: 'mobility', minutes: 15 }, P());
  assert.equal(r1.blocks.find(b => b.key === 'mobility').duration, 15);
  assert.equal(r1.duration, 135);
  const r2 = G.applyOverride(s, { action: 'move_block', blockKey: mf(s).key, delta: -1 }, P());
  assert.equal(r2.blocks.findIndex(b => b.mainFocus), s.blocks.findIndex(b => b.mainFocus) - 1);
  const r3 = G.applyOverride(s, { action: 'swap_domain', domain: 'balance' }, P());
  assert.match(r3.blocks.find(b => b.key === 'complementary').label, /Balance/);
  assert.deepEqual(ids(mf(r3)), ids(mf(s)));
  const r4 = G.applyOverride(s, { action: 'swap_skill_line', line: 'pancake-hips' }, P());
  assert.match(r4.blocks.find(b => b.key === 'accessory').label, /Pancake/);
  assert.equal(r4.edits.length, 1);
});

test('every override keeps work already logged (reshuffle, scale, lighter, theme swap, correlation flip)', () => {
  for (const intent of [{ action: 'reshuffle' }, { action: 'scale_session', factor: 0.65 }, { action: 'lighter' },
    { action: 'theme_swap', targetTheme: 'light' }, { action: 'correlation_flip', mode: 'anti_correlated' }]) {
    const s = generateDay(app, '2026-09-28');
    s.loggedHistoryId = 'session_x';
    const id = logFirst(s);
    const r = G.applyOverride(s, intent, P());
    assert.ok(r, intent.action);
    const e = r.blocks.flatMap(b => b.exercises).find(x => x.id === id);
    assert.ok(e && e.sets.length === 1, `${intent.action} dropped ${id}`);
    assert.equal(r.loggedHistoryId, 'session_x', `${intent.action} lost the history link`);
  }
});

test('theme swap Monday → light takes a light day’s content, not Monday’s', () => {
  const r = G.applyOverride(generateDay(app, '2026-09-28'), { action: 'theme_swap', targetTheme: 'light' }, P());
  assert.equal(r.theme, 'Light');
  assert.equal(r.planSource.kind, 'borrowed');
  assert.ok(!r.blocks.some(b => b.mainFocus));
  assert.ok(!/Shoulder & wrist/.test(r.blocks.map(b => b.label).join()));
});

test('trade Mon 5 Oct ↔ Thu 8 Oct swaps the prescriptions with the day types', () => {
  const t = app.Day.trade(generateDay(app, '2026-10-05'), '2026-10-08', { profile: P() });
  assert.ok(t);
  assert.equal(t.mine.date, '2026-10-05');
  assert.equal(t.mine.dayKind, 'z2-run');
  assert.deepEqual(ids(mf(t.mine)), ['easy-run']);
  assert.equal(t.theirs.date, '2026-10-08');
  assert.equal(t.theirs.dayKind, 'strength-a');
  assert.equal(mf(t.theirs).exercises.find(e => e.id === 'squat').target.loadKg, 60);
  // each date keeps its own coordination domain
  assert.equal(t.mine.coordDomain, generateDay(app, '2026-10-05').coordDomain);
  assert.equal(t.mine.planSource.kind, 'traded');
});

test('swap exercise: like-for-like, the old load does not carry, logged work is refused', () => {
  const s = generateDay(app, '2026-09-28');
  const r = G.applyOverride(s, { action: 'swap_exercise', blockKey: mf(s).key, exerciseId: 'squat' }, P());
  assert.ok(r);
  const pick = mf(r).exercises[0];
  assert.equal(app.EXERCISE_TAGS[pick.id].pattern, 'squat');
  assert.equal(pick.target.loadKg, undefined);
  const s2 = generateDay(app, '2026-09-28');
  mf(s2).exercises[0].sets = [{ reps: 5, weight: 57.5 }];
  assert.equal(G.applyOverride(s2, { action: 'swap_exercise', blockKey: mf(s2).key, exerciseId: 'squat' }, P()), null);
  // cardio swaps with its other-machine twin
  const q = generateDay(app, '2026-10-03');
  const rq = G.applyOverride(q, { action: 'swap_exercise', blockKey: mf(q).key, exerciseId: mf(q).exercises[0].id }, P());
  assert.equal(mf(rq).exercises[0].id, 'interval-cycling');
  assert.match(mf(rq).exercises[0].target.text, /4 × 4 min/);
});

test('lighter scales Main Focus: loads ~90%, one set fewer; intervals become easy minutes', () => {
  const s = generateDay(app, '2026-09-28');
  const r = G.applyOverride(s, { action: 'lighter' }, P());
  const sq = mf(r).exercises.find(e => e.id === 'squat');
  assert.equal(sq.target.loadKg, 52);
  assert.equal(sq.target.sets, 2);
  const q = G.applyOverride(generateDay(app, '2026-10-03'), { action: 'lighter' }, P());
  assert.equal(mf(q).exercises[0].target.protocol.type, 'steady');
});

test('after the written plan: every day type carries forward its latest non-test day', () => {
  const s = generateDay(app, '2026-10-29');
  assert.equal(s.planSource.kind, 'carry-forward');
  assert.equal(s.planSource.from, '2026-10-22');
  // 22 Oct is the weekly aerobic check, so that is what carries forward.
  assert.match(mf(s).exercises[0].target.text, /30 min at avg ~148.*20 min easy under 153/);
  const b = generateDay(app, '2026-10-30');
  assert.equal(mf(b).exercises.find(e => e.id === 'deadlift').target.loadKg, 85);
  assert.doesNotMatch(mf(b).note, /16 Oct numbers/);   // that morning's framing doesn't carry
});

test('one-tap: as prescribed writes the target as sets; RPE stamps them; complete clears the live session', () => {
  const s = generateDay(app, '2026-09-28');
  const L = app.LiveSession;
  L.start(s, null);
  const bi = s.blocks.findIndex(b => b.mainFocus);
  assert.ok(L.logAsPrescribed(bi, 0));
  const sq = L.getSession().blocks[bi].exercises[0];
  assert.equal(sq.sets.length, 3);
  assert.deepEqual([sq.sets[0].weight, sq.sets[0].reps], [57.5, 5]);
  L.setRpe(bi, 0, 8);
  assert.ok(sq.sets.every(x => x.rpe === 8));
  L.markBlockDone(0);
  assert.ok(L.getSession().blocks[0].exercises.every(e => e.completed));
  const left = L.skipRemaining('not done');
  assert.ok(left > 0);
  const id = L.complete();
  assert.ok(id);
  assert.equal(L.getSession(), null);
  assert.equal(L.complete(), null);
  const saved = app.History.getSession(id);
  assert.equal(saved.planRef.date, '2026-09-28');
  assert.equal(saved.planRef.dayType, 'strength-a');
});

test('block draft: 3 weeks from 26 Oct, one step per lift, retests in the last week', () => {
  const d = app.BlockBuilder.draft({ weeks: 3 });
  assert.equal(d.from, '2026-10-26');
  assert.equal(d.to, '2026-11-15');
  assert.equal(d.days.length, 21);
  const sq = day => d.days.find(x => x.date === day).mainFocusPlan.exercises.find(e => e.id === 'squat').loadKg;
  assert.deepEqual([sq('2026-10-26'), sq('2026-11-02'), sq('2026-11-09')], [60, 62.5, 62.5]);
  assert.equal(d.days.find(x => x.date === '2026-11-11').dayType, 'aerobic-test');
  assert.ok(d.days.every(x => x.source === 'draft'));
  // adopting appends and survives a newer shipped seed
  const next = app.MonthPlan.adoptDraft(d);
  assert.equal(next.blockEnd, '2026-11-15');
  assert.equal(app.MonthPlan.dayFor('2026-11-02').source, 'draft');
  const stored = app.DB.get('month_plan'); stored.seedVersion = 1; app.DB.set('month_plan', stored);
  app.MonthPlan.ensureSeeded();
  assert.equal(app.MonthPlan.dayFor('2026-11-02').source, 'draft');
  app.DB.remove('month_plan');
});

test('Day: local keys, DST-safe day counts, touched detection', () => {
  const D = app.Day;
  assert.equal(D.key('2026-10-25'), '2026-10-25');
  assert.equal(D.daysBetween('2026-10-24', '2026-10-26'), 2);   // across the clock change
  assert.equal(D.addDays('2026-10-25', 1), '2026-10-26');
  const s = generateDay(app, '2026-09-26');
  assert.equal(D.isTouched(s), false);
  assert.equal(D.isTouched(G.applyOverride(s, { action: 'remove_block', blockKey: 'accessory' }, P())), true);
});
