'use strict';
// Meals (js/meals.js + data/meals.js) and the daily log (js/daylog.js):
// the training link, planning rules, portions, shopping, sync routing.
const test = require('node:test');
const assert = require('node:assert');
const { freshContext } = require('./load');

function ctx(now = '2026-09-30T20:00:00') {
  const app = freshContext({ quiet: true, now });
  if (app.MonthPlan.ensureSeeded) app.MonthPlan.ensureSeeded();
  let s = 7; app.Meals._setRandom(() => (s = (s * 16807) % 2147483647) / 2147483647);
  app.Meals.load();
  app.Meals.ui.weekStart = null; app.Meals.ui.day = null;
  app.Meals.render();   // no DOM in tests; sets week and day from the clock
  return app;
}
const setWeight = (app, kg) => { app.Meals.state.prof.weight = String(kg); app.Meals.save(); };

test('day effort comes from the training plan', () => {
  const app = ctx();
  const types = {};
  ['2026-09-27', '2026-09-28', '2026-09-29', '2026-10-01', '2026-10-03'].forEach(k => { types[k] = app.Meals.effortFor(k); });
  // Thu = Zone 2 long run → hard; Sun = light → easy; Mon strength → moderate
  assert.equal(types['2026-10-01'].type, app.MonthPlan.typeOf(app.MonthPlan.dayFor('2026-10-01')));
  for (const k of Object.keys(types)) {
    const t = types[k].type;
    const want = { 'z2-run': 'hard', 'quality-run': 'hard', 'aerobic-test': 'hard', 'strength-a': 'moderate', 'strength-b': 'moderate',
      'plyo-power': 'moderate', 'z2-bike': 'moderate', 'light': 'easy' }[t];
    assert.ok(want, 'known day type ' + t);
    assert.equal(types[k].tier, want, k + ' ' + t);
    assert.equal(types[k].src, 'plan');
  }
  // Past the written plan it follows the standing week split.
  const far = app.Meals.effortFor('2027-03-04');
  assert.equal(far.src, 'week'); assert.equal(far.type, 'z2-run'); assert.equal(far.tier, 'hard');
});

test('a day made lighter on Today steps down; an override in Food settings wins', () => {
  const app = ctx();
  const k = '2026-10-01';
  const base = app.Meals.effortFor(k).tier;
  app.DB.set('daily_instance_' + k, { date: k, dayKind: 'z2-run', edits: [{ action: 'lighter', at: 1 }], blocks: [] });
  const e = app.Meals.effortFor(k);
  assert.equal(e.src, 'today'); assert.ok(e.lighter);
  assert.equal(app.Meals.TIERS.indexOf(e.tier), app.Meals.TIERS.indexOf(base) - 1);
  app.Meals.state.effort[k] = 'rest'; app.Meals.save();
  assert.equal(app.Meals.effortFor(k).tier, 'rest');
  assert.equal(app.Meals.effortFor(k).src, 'you');
});

test('weight: typed wins, else the latest weigh-in; no weight → no targets', () => {
  const app = ctx();
  assert.equal(app.Meals.weight(), null);
  assert.equal(app.Meals.targetFor('hard'), null);
  app.Vitals.addWeight('2026-09-23', 73.3);
  assert.deepEqual({ v: app.Meals.weight().v, src: app.Meals.weight().src }, { v: 73.3, src: 'app' });
  const t = app.Meals.targetFor('rest'), h = app.Meals.targetFor('hard');
  assert.ok(h.kcal > t.kcal, 'hard day eats more');
  assert.equal(t.p, Math.round(73.3 * 1.8));
  setWeight(app, 80);
  assert.equal(app.Meals.weight().v, 80);
});

test('generate (hybrid): every slot filled, no dinner repeats lunch back to back, shakes on training days', () => {
  const app = ctx(); setWeight(app, 74);
  assert.equal(app.Meals.generate(), '');
  const w = app.Meals.state.weeks[app.Meals.ui.weekStart];
  assert.equal(Object.keys(w.plan).length, 21);
  const seq = [];
  for (let d = 0; d < 7; d++) ['l', 'd'].forEach(s => seq.push(w.plan[d + '-' + s].r));
  for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1], 'back-to-back repeat at ' + i);
  for (let d = 0; d < 7; d++) {
    const tier = app.Meals.effortFor(addDays(app.Meals.ui.weekStart, d)).tier;
    const r = w.plan[d + '-b'].r;
    if (tier === 'hard' || tier === 'moderate') assert.match(r, /shake/, 'training day ' + d + ' gets a shake');
  }
  assert.ok(w.planPrefs && w.planPrefs.style === 'hybrid');
});

test('portions follow the day: the same meal is bigger on a hard day than an easy one', () => {
  const app = ctx(); setWeight(app, 74);
  app.Meals.generate();
  const w = app.Meals.state.weeks[app.Meals.ui.weekStart];
  Object.keys(w.plan).forEach(k => { if (k.endsWith('-d')) w.plan[k] = { r: 'm-chili' }; });
  app.Meals.save();
  const slots = app.Meals.activeSlots().filter(x => x.s === 'd');
  const by = {}; slots.forEach(x => { by[app.Meals.effortFor(addDays(app.Meals.ui.weekStart, x.d)).tier] = x.m; });
  assert.ok(by.hard && by.easy, JSON.stringify(by));
  assert.ok(by.hard > by.easy, JSON.stringify(by));
});
function addDays(k, n) { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); const p = x => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }

test('vegetarian: no meat or fish anywhere in the week', () => {
  const app = ctx(); setWeight(app, 60);
  app.Meals.state.prof.diet = 'veg'; app.Meals.save();
  assert.equal(app.Meals.generate(), '');
  const ing = app.Meals.shoppingList().map(x => x.i.cls);
  assert.ok(!ing.includes('meat') && !ing.includes('fish'), ing.join(','));
});

test('constraints can leave nothing to plan, and say so', () => {
  const app = ctx(); setWeight(app, 74);
  Object.assign(app.Meals.state.prof, { diet: 'nonveg', cons: ['fish', 'redmeat', 'soy', 'gluten', 'lactose'], avoid: 'chicken, turkey, prawn, tuna' });
  app.Meals.save();
  assert.match(app.Meals.generate(), /No lunch or dinner recipe fits/);
});

test('shopping list: known ingredients, positive costs, staples flagged; eaten meals survive a regenerate', () => {
  const app = ctx(); setWeight(app, 74);
  app.Meals.generate();
  const list = app.Meals.shoppingList();
  assert.ok(list.length > 10);
  list.forEach(x => { assert.ok(app.Meals.ING[x.id]); assert.ok(x.q > 0 && x.cost >= 0); });
  assert.ok(list.some(x => x.i.staple) && list.some(x => !x.i.staple));
  assert.match(app.Meals.shoppingText(), /Produce\n- /);
  const w = app.Meals.state.weeks[app.Meals.ui.weekStart];
  w.plan['1-l'].done = true; const eaten = w.plan['1-l'].r; app.Meals.save();
  app.Meals.generate();
  const w2 = app.Meals.state.weeks[app.Meals.ui.weekStart];
  assert.equal(w2.plan['1-l'].r, eaten); assert.ok(w2.plan['1-l'].done);
});

test('Sunday batch: batch components are cooked on Sunday or frozen, never eaten past their fridge life', () => {
  const app = ctx(); setWeight(app, 74);
  app.Meals.state.prefs.style = 'sunday'; app.Meals.state.prefs.cookDays = [0]; app.Meals.save();
  app.Meals.generate();
  app.Meals.activeSlots().filter(x => x.s !== 'b').forEach(x => x.pl.forEach(p => {
    if (p.batch) { assert.equal(p.day, 0); if (x.d - p.day > p.c.keeps) assert.ok(p.frz, `${p.c.id} on day ${x.d} should be frozen`); }
  }));
});

test('state syncs as its own overrides row; old weeks are pruned', () => {
  const app = ctx(); setWeight(app, 74);
  assert.equal(app._route('pb_meals'), 'meals');
  assert.equal(app._route('pb_daylog'), 'daylog');
  assert.ok(app.DB._isPending('pb_meals'));
  for (let i = 0; i < 20; i++) app.Meals.state.weeks[addDays('2026-01-04', i * 7)] = { plan: { '0-l': { r: 'm-dal' } }, shop: { checked: {}, extras: [] } };
  app.Meals.save();
  assert.equal(Object.keys(app.DB.get('meals').weeks).length, 12);
});

test('daily log: training ticks itself from a completed session, and can be unticked', () => {
  const app = ctx('2026-09-30T08:00:00');
  app.DayLog.load();
  const r = app.DayLog.DEFAULT_ROUTINES.find(x => x.id === 'train');
  assert.equal(app.DayLog.isDone(r, '2026-09-30').on, false);
  app.DB.set('daily_instance_2026-09-30', { date: '2026-09-30', status: 'completed', blocks: [] });
  const st = app.DayLog.isDone(r, '2026-09-30');
  assert.ok(st.on && st.auto);
  app.DayLog.state.days['2026-09-30'] = { am: {}, pm: {}, done: { train: false }, med: {} };
  assert.equal(app.DayLog.isDone(r, '2026-09-30').on, false);
  assert.deepEqual(app.DayLog.DEFAULT_ROUTINES.map(x => x.id), ['wake', 'med1', 'breakfast', 'train', 'med2', 'desk', 'offdesk', 'code', 'winddown']);
});
