'use strict';
// Goals (data/goals.js) and how they drive the plan (27 Sep 2026 revamp):
// rung-driven skill blocks, scheduled test blocks, results and targets,
// focus boosting, and the one-time migration onto the rewritten ladders.
const test = require('node:test');
const assert = require('node:assert');
const { freshContext, generateDay } = require('./helpers');

const app = freshContext({ quiet: true, now: new Date('2026-09-26T08:30:00') });
const { Goals, Profile, MonthPlan, DB } = app;
const block = (s, key) => s.blocks.find(b => b.key === key);
const ids = b => (b ? b.exercises : []).map(e => e.id);
const withRung = (id, idx) => { const p = Profile.load(); p.goalMilestones = { ...(p.goalMilestones || {}), [id]: idx }; return p; };

test('the model: five live ladders, eleven capacities, six practices; parked ladders stay in GOALS', () => {
  const live = Goals.ladders().filter(g => g.status !== 'parked').map(g => g.id);
  assert.deepEqual(live, ['handstand', 'ring-muscle-up', 'pistol-squat', 'cartwheel-roundoff', 'l-sit-v-sit']);
  assert.equal(Goals.capacities().length, 12);   // incl. the fixed-HR engine test
  assert.equal(Goals.practices().length, 6);
  assert.ok(app.GOALS.find(g => g.id === 'front-lever').status === 'parked');
  // Johnyy's own pistol ladder is the built-in now.
  assert.equal(app.GOALS.find(g => g.id === 'pistol-squat').milestones[4], 'Shrimp squat 3×5 each side');
});

test('the rung decides the skill block: handstand at the wall vs toe pulls', () => {
  const low = generateDay(app, '2026-10-06', { profile: withRung('handstand', 0) });
  const high = generateDay(app, '2026-10-06', { profile: withRung('handstand', 4) });
  const a = ids(block(low, 'accessory')), b = ids(block(high, 'accessory'));
  assert.ok(a.includes('hs-wall-plank'), a.join());
  assert.ok(b.includes('hs-toe-pulls'), b.join());
  assert.ok(a.includes('wrist-prep') && b.includes('wrist-prep'), 'the line\'s wrist prep comes first either way');
  assert.match(block(high, 'accessory').note, /rung 5 of 9: Toe pulls/);
});

test('pistol line on Strength A days follows the pistol rung', () => {
  const s = generateDay(app, '2026-10-05', { profile: withRung('pistol-squat', 4) });
  const acc = block(s, 'accessory');
  assert.match(acc.label, /Pistol squat/);
  assert.ok(ids(acc).includes('shrimp-squat'), ids(acc).join());
});

test('measurement days: each slot is replaced by its tests, every test carries its goal', () => {
  const sun = generateDay(app, '2026-09-27');
  assert.deepEqual(block(sun, 'complementary').tests, ['cap-balance-ec', 'cap-juggle', 'cap-reaction']);
  assert.deepEqual(block(sun, 'mobility').exercises.map(e => e.test.goalId), ['cap-knee-to-wall', 'cap-pancake', 'cap-toe-touch']);
  assert.deepEqual(block(sun, 'accessory').exercises.map(e => e.test.kind), ['ladder', 'ladder', 'ladder']);
  const wed = generateDay(app, '2026-09-30');
  const tm = block(wed, 'main-focus:tests');
  assert.ok(tm && tm.mainFocus);
  assert.deepEqual(tm.exercises.map(e => e.id), ['broad-jump', 'vertical-jump', 'sprint-20m', 'med-ball-back-throw']);
  assert.match(tm.exercises[0].notes, /stick the landing/);
  assert.deepEqual(block(wed, 'accessory').tests, ['cap-dead-hang']);
  // a normal day has no tests
  assert.ok(!generateDay(app, '2026-10-07').blocks.some(b => b.tests));
});

test('a test day borrowed for a theme swap does not bring its tests along', () => {
  const s = app.Generator.applyOverride(generateDay(app, '2026-10-04'), { action: 'theme_swap', targetTheme: 'plyo-power' }, Profile.load());
  assert.ok(s);
  assert.ok(!s.blocks.some(b => b.tests), s.blocks.map(b => b.key).join());
});

test('results and targets: relative targets resolve against the 27–30 Sep baseline', () => {
  DB.remove(Goals.RESULTS_KEY);
  assert.equal(Goals.targets('cap-broad-jump')[0].value, null);         // no baseline yet
  Goals.record('cap-broad-jump', 210, 'first', '2026-09-30');
  const t = Goals.targets('cap-broad-jump');
  assert.deepEqual(t.map(x => x.value), [216, 223, 227]);                // +3%, +6%, +8%
  assert.equal(Goals.nextTarget('cap-broad-jump', '2026-11-02').label, '29 Nov');
  Goals.record('cap-sprint-20', 3.62, '', '2026-09-30');
  assert.deepEqual(Goals.targets('cap-sprint-20').map(x => x.value), [3.57, 3.52, 3.47]);   // lower is better
  Goals.record('cap-broad-jump', 219, '', '2026-10-31');
  assert.equal(Goals.latest('cap-broad-jump').value, 219);
  assert.equal(Goals.baseline('cap-broad-jump').value, 210);
  assert.ok(Math.abs(Goals.progressOf('cap-broad-jump') - 9 / 17) < 1e-9);
  // same date overwrites
  Goals.record('cap-broad-jump', 220, '', '2026-10-31');
  assert.equal(Goals.results('cap-broad-jump').length, 2);
  // the engine test keeps its 23 Sep baseline without anything typed in
  assert.equal(Goals.baseline('cap-fixed-hr').value, 4.40);
  assert.deepEqual(Goals.targets('cap-fixed-hr').map(x => x.value), [4.53, 4.66, 4.80]);
  DB.remove(Goals.RESULTS_KEY);
});

test('focus: block 1 boosts what feeds its goals, and it reaches the day', () => {
  const b1 = Goals.boostFor('2026-10-10');
  assert.ok(b1.has('single-leg-eyes-closed') && b1.has('ankle-dorsiflexion') && b1.has('snap-down-stick'));
  assert.ok(!Goals.boostFor('2026-11-10').has('single-leg-eyes-closed'));   // balance isn't in block 2's focus
  const s = generateDay(app, '2026-10-10');                                   // balance day, block 1
  assert.equal(s.coordDomain, 'balance');
  const lead = block(s, 'complementary').exercises[0].id;
  assert.ok(Goals.get('cap-balance-ec').feeds.includes(lead), lead);   // an exercise that feeds the balance test leads
  // parking a goal takes it out of focus
  Goals.setStatus('cap-balance-ec', 'parked');
  assert.ok(!Goals.boostFor('2026-10-10').has('single-leg-eyes-closed'));
  DB.remove(Goals.STATE_KEY);
});

test('migration: old rung positions move onto the rewritten ladders; the pistol list carries by name', () => {
  const p = Profile.load();
  p.goalsVersion = 0;
  p.goalMilestones = { 'handstand': 4, 'ring-muscle-up': 3, 'pistol-squat': 1, 'l-sit-v-sit': 2 };
  const own = app.GOAL_LADDERS['pistol-squat'].rungs.map(r => r.name);
  DB.set('goal_milestone_overrides', { 'pistol-squat': own, 'front-lever': ['a', 'b'] });
  assert.ok(Goals.migrate(p));
  assert.equal(p.goalMilestones['handstand'], 5);        // old "Tuck freestanding 5s" → new rung 5
  assert.equal(p.goalMilestones['ring-muscle-up'], 4);   // old "Transition drill with band" → banded transition
  assert.equal(p.goalMilestones['pistol-squat'], 1);     // same list: same rung
  assert.equal(p.goalMilestones['l-sit-v-sit'], 1);
  const ov = DB.get('goal_milestone_overrides');
  assert.ok(!ov['pistol-squat'] && ov['front-lever'], 'only the rewritten ladders drop their overrides');
  assert.equal(Goals.migrate(p), false, 'runs once');
  DB.remove('goal_milestone_overrides');
});

test('the plan: 27 Sep – 27 Dec, retest weeks end every block, Christmas is light', () => {
  const plan = MonthPlan.load();
  assert.equal(plan.seedVersion, 7);
  assert.equal(plan.quarter.from, '2026-09-27');
  assert.equal(plan.blockEnd, '2026-12-27');
  const testDays = plan.days.filter(d => d.tests).map(d => d.date);
  ['2026-09-27', '2026-09-30', '2026-10-31', '2026-11-28', '2026-12-23', '2026-12-27'].forEach(k => assert.ok(testDays.includes(k), k));
  assert.equal(MonthPlan.dayFor('2026-12-25').dayType, 'light');
  assert.deepEqual(plan.quarter.blocks.map(b => b.to), ['2026-11-01', '2026-11-29', '2026-12-27']);
  // every goal in a block's focus exists
  plan.quarter.blocks.forEach(b => b.focus.forEach(id => assert.ok(Goals.get(id), id)));
});
