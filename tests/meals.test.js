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
  // default: lunch and dinner Mon–Fri, breakfast every day
  assert.equal(Object.keys(w.plan).length, 7 + 10);
  const seq = [];
  for (let d = 1; d <= 5; d++) ['l', 'd'].forEach(s => seq.push(w.plan[d + '-' + s].r));
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
  app.Meals.state.prefs.days = [0, 1, 2, 3, 4, 5, 6]; app.Meals.save();
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

// ── hybrid: Sunday does more, weekday lunches are boxes (29 Sep) ──
function hybridWeek(seed, cookDays) {
  const app = freshContext({ quiet: true, now: '2026-09-30T20:00:00' });
  if (app.MonthPlan.ensureSeeded) app.MonthPlan.ensureSeeded();
  let s = seed; app.Meals._setRandom(() => (s = (s * 16807) % 2147483647) / 2147483647);
  app.Meals.load(); app.Meals.ui.weekStart = null; app.Meals.ui.day = null; app.Meals.render();
  setWeight(app, 74);
  if (cookDays) { app.Meals.state.prefs.cookDays = cookDays; app.Meals.save(); }
  assert.equal(app.Meals.generate(), '');
  return app;
}
const dayMinsOf = x => x.pl.filter(p => !p.batch).reduce((a, p) => a + Math.max(1, p.c.mins - (p.pre != null && p.c.pre ? p.c.pre.save : 0)), 0);

test('hybrid: weekday lunches need no real cooking, weekday evenings stay short, Sunday carries the load', () => {
  [7, 31, 999, 12345, 4242].forEach(seed => {
    const app = hybridWeek(seed); const act = app.Meals.activeSlots();
    for (let d = 1; d <= 5; d++) {
      const l = act.find(x => x.d === d && x.s === 'l');
      assert.ok(dayMinsOf(l) <= 5, `seed ${seed} ${d} lunch ${l.r.id} needs ${dayMinsOf(l)} min`);
      const all = act.filter(x => x.d === d && x.s !== 'b').reduce((a, x) => a + dayMinsOf(x), 0);
      assert.ok(all <= 25, `seed ${seed} day ${d}: ${all} min on the day`);
    }
    const T = app.Meals.tasks();
    const sunday = T.filter(t => t.day === 0 && t.batch && t.kind === 'cook' && !t.bf).reduce((a, t) => a + t.mins, 0);
    assert.ok(sunday >= 150, `seed ${seed}: Sunday batch only ${sunday} min`);
  });
});

test('hybrid: lunch and dinner on the same day share nothing but maybe a grain (no roast potatoes twice on Monday)', () => {
  [7, 31, 999, 12345, 4242].forEach(seed => {
    const app = hybridWeek(seed); const w = app.Meals.state.weeks[app.Meals.ui.weekStart];
    for (let d = 1; d <= 5; d++) {
      const parts = s => new Set(app.Meals.activeSlots().find(x => x.d === d && x.s === s).r.parts.map(p => p[0]));
      const L = parts('l'), D = parts('d');
      const shared = [...L].filter(id => D.has(id) && !['rice', 'quinoa', 'pasta'].includes(id));
      assert.deepEqual(shared, [], `seed ${seed} day ${d}: ${w.plan[d + '-l'].r} / ${w.plan[d + '-d'].r}`);
    }
  });
});

test('hybrid: a weekday batch day cooks in the evening, so that day\'s lunch comes from the earlier batch', () => {
  const app = hybridWeek(7, [0, 3]);
  app.Meals.activeSlots().filter(x => x.s !== 'b').forEach(x => x.pl.forEach(p => {
    if (x.d === 3 && x.s === 'l' && p.batch) assert.equal(p.day, 0, 'Wed lunch from Sunday, not Wednesday');
    if (p.batch) assert.ok(p.day <= x.d, 'made before it is eaten');
  }));
  assert.ok(app.Meals.tasks().some(t => t.day === 3 && t.batch && t.kind === 'cook'), 'something is batched on Wednesday');
});

test('prep-ahead tasks sit on the batch day, add no groceries, and shorten the day they serve', () => {
  const app = hybridWeek(7);
  const T = app.Meals.tasks(); const pre = T.filter(t => t.kind === 'pre');
  assert.ok(pre.length, 'some chopping is moved to Sunday');
  pre.forEach(t => { assert.equal(t.day, 0); t.uses.forEach(u => assert.ok(u.d > 0 && u.d <= t.c.pre.days)); });
  const cooks = T.filter(t => t.kind === 'cook' && t.prepped);
  cooks.forEach(t => assert.equal(t.mins, Math.max(1, t.c.mins - t.c.pre.save)));
  const shop = {}; app.Meals.shoppingList().forEach(x => { shop[x.id] = x.q; });
  // same list as counting every cook task once
  const tot = {}; T.filter(t => t.kind === 'cook').forEach(t => t.c.ing.forEach(([id, q]) => { tot[id] = (tot[id] || 0) + q * t.q; }));
  Object.keys(tot).forEach(id => assert.ok(shop[id] >= tot[id] - 1e-6, id));
});

// ── packs, stock carry-over, fit to packs, cooked weights (29 Sep) ──
test('shopping buys whole packs, prices what you pay, and says what is left', () => {
  const app = hybridWeek(7);
  const L = app.Meals.shoppingList();
  const chicken = L.filter(x => x.i.pack && !x.i.staple);
  assert.ok(chicken.length > 10);
  chicken.forEach(x => {
    assert.equal(x.buy, x.packs * x.i.pack, x.id);
    assert.ok(x.buy >= x.want - Math.min(25, x.i.pack * 0.05) - 1e-9, x.id + ' covers the need');
    assert.ok(Math.abs(x.cost - x.buy * (x.i.pc ? x.i.price : x.i.price / 1000)) < 1e-9, x.id + ' priced by pack');
    assert.ok(Math.abs(x.spareBuy - Math.max(0, x.buy - x.want)) < 1e-9);
  });
  L.filter(x => !x.i.pack).forEach(x => assert.equal(x.spareBuy, 0, x.id + ' loose: no spare'));
  assert.match(app.Meals.shoppingText(), / \d+ × /);
});

test('fit to packs cuts the leftovers without breaking the week\'s rules', () => {
  const waste = app => app.Meals.ledger().reduce((a, x) => a + (x.i.pack ? x.spareBuy * (x.i.pc ? x.i.price : x.i.price / 1000) * ({ fresh: 1, freeze: 0.25, fridge: 0.15 }[x.keep] || 0) : 0), 0);
  let better = 0;
  [7, 31, 999, 12345].forEach(seed => {
    const mk = fit => { const app = freshContext({ quiet: true, now: '2026-09-30T20:00:00' }); app.MonthPlan.ensureSeeded && app.MonthPlan.ensureSeeded();
      let s = seed; app.Meals._setRandom(() => (s = (s * 16807) % 2147483647) / 2147483647); app.Meals.load(); app.Meals.ui.weekStart = null; app.Meals.ui.day = null; app.Meals.render();
      setWeight(app, 74); app.Meals._setFit(fit); app.Meals.generate(); return app; };
    const raw = mk(false), fit = mk(true);
    assert.ok(waste(fit) <= waste(raw) + 1e-9, `seed ${seed}: ${waste(fit)} vs ${waste(raw)}`);
    if (waste(fit) < waste(raw) - 0.5) better++;
    const w = fit.Meals.state.weeks[fit.Meals.ui.weekStart];
    Object.values(w.plan).forEach(o => Object.values(o.boost || {}).forEach(b => assert.ok(b > 1 && b <= 1.3)));
    const seq = []; for (let d = 1; d <= 5; d++) ['l', 'd'].forEach(s => seq.push(w.plan[d + '-' + s].r));
    for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1]);
  });
  assert.ok(better >= 2, 'fitting helps most weeks');
});

test('a top-up shows in the day totals', () => {
  const app = hybridWeek(7); const ws = app.Meals.ui.weekStart, w = app.Meals.state.weeks[ws];
  const k = Object.keys(w.plan).find(k => !k.endsWith('-b')); const d = +k[0];
  Object.values(w.plan).forEach(o => delete o.boost);
  const before = app.Meals.dayTotals(d).planned.kcal;
  const r = app.Meals.activeSlots().find(x => x.d === d && x.s === k[2]).r;
  w.plan[k].boost = { [r.parts[0][0]]: 1.3 };
  assert.ok(app.Meals.dayTotals(d).planned.kcal > before);
});

test('what is left of a pack counts next week, and can be ticked off as gone', () => {
  const app = hybridWeek(7);
  app.Meals.ui.weekStart = '2026-10-04'; app.Meals.generate();
  const st = app.Meals.stockFor('2026-10-04');
  assert.ok(Object.keys(st).length >= 3, JSON.stringify(st));
  Object.entries(st).forEach(([id, v]) => { assert.notEqual(app.Meals.ING[id].keep, 'fresh'); assert.ok(['freezer', 'fridge', 'cupboard'].includes(v.where)); });
  const L = app.Meals.ledger(); const used = L.find(x => x.st && x.have > 0);
  assert.ok(used, 'this week uses some stock');
  assert.ok(used.want <= used.need - used.have + 1e-9);
  app.Meals.state.weeks['2026-10-04'].shop.nostock = { [used.id]: true };
  assert.ok(!app.Meals.stockFor('2026-10-04')[used.id]);
});

test('cooked weights: a batch pot splits into boxes that add up', () => {
  const app = hybridWeek(7);
  const rice = app.Meals.tasks().find(t => t.c.id === 'rice' && t.batch && t.kind === 'cook');
  const g = s => { const m = /([\d.]+) (kg|g)/.exec(s); return m[2] === 'kg' ? +m[1] * 1000 : +m[1]; };
  const whole = g(app.Meals.cookedLabel(rice.c, rice.q));
  const parts = rice.uses.reduce((a, u) => a + g(app.Meals.cookedLabel(rice.c, u.q)), 0);
  assert.ok(Math.abs(whole - parts) <= 20 * rice.uses.length, `${whole} vs ${parts}`);
  const dry = rice.c.ing[0][1] * rice.q;
  assert.ok(whole > dry * 2.5, 'rice about triples');
});

test('weekends off: no lunch or dinner on Saturday and Sunday, and the Sunday batch cooks only for Mon–Fri', () => {
  const app = hybridWeek(7); const w = app.Meals.state.weeks[app.Meals.ui.weekStart];
  ['0-l', '0-d', '6-l', '6-d'].forEach(k => assert.ok(!w.plan[k], k + ' left empty'));
  ['0-b', '6-b'].forEach(k => assert.ok(w.plan[k], k + ' breakfast still planned'));
  ['0-b', '6-b'].forEach(k => { const x = app.Meals.activeSlots().find(y => y.d === +k[0] && y.s === 'b'); assert.ok(x.pl.every(p => p.c.prep === 'assemble'), k + ': nothing to cook (' + x.r.id + ')'); });
  const T = app.Meals.tasks().filter(t => t.day === 0 && !t.bf);
  assert.ok(T.length >= 4, 'Sunday still batches');
  T.forEach(t => t.uses.forEach(u => assert.ok(u.d >= 1 && u.d <= 5, `${t.c.id} feeds day ${u.d}`)));
  // turning a day back on plans it
  app.Meals.state.prefs.days = [1, 2, 3, 4, 5, 6]; app.Meals.save(); app.Meals.generate();
  const w2 = app.Meals.state.weeks[app.Meals.ui.weekStart];
  assert.ok(w2.plan['6-l'] && w2.plan['6-d'] && !w2.plan['0-l']);
});

test('Portuguese: built-in content switches with the account language, English still matches foods to avoid', () => {
  const app = hybridWeek(7); const D = app.MEALS_DATA;
  // every built-in has a translation
  D.ING_ROWS.forEach(r => assert.ok(D.PT.ing[r[0]], 'ingredient ' + r[0]));
  D.AISLES.forEach(a => assert.ok(D.PT.aisle[a], 'aisle ' + a));
  D.COMPONENTS.forEach(c => { assert.ok(D.PT.comp[c.id], 'component ' + c.id); if (c.pre) assert.ok(D.PT.pre[c.id], 'prep ' + c.id); });
  D.RECIPES.forEach(r => assert.ok(D.PT.recipe[r.id], 'recipe ' + r.id));
  const rp = id => D.RECIPES.find(r => r.id === id), cp = id => D.COMPONENTS.find(c => c.id === id);
  assert.equal(rp('m-pork').name, 'Pork loin, roast potatoes and salad');
  const planned = JSON.stringify(app.Meals.state.weeks[app.Meals.ui.weekStart].plan);
  app.Meals.state.lang = 'pt'; app.Meals.save(); app.Meals.load();
  assert.equal(rp('m-pork').name, 'Lombo de porco, batatas assadas e salada');
  assert.equal(cp('roastpot').name, 'Batatas assadas no forno');
  assert.match(cp('roastpot').steps, /210 °C/);
  assert.equal(app.Meals.ING.salmon.name, 'Filete de salmão');
  assert.match(app.Meals.shoppingText(), /Frutas e legumes\n- /);
  assert.equal(JSON.stringify(app.Meals.state.weeks[app.Meals.ui.weekStart].plan), planned, 'the plan is untouched');
  // "mushroom" typed in English still rules out the omelette in Portuguese
  app.Meals.state.prof.avoid = 'mushroom';
  assert.match(String(app.Meals.fits(rp('m-omelette'))), /cogumelos/);
  app.Meals.state.prof.avoid = '';
  app.Meals.state.lang = 'en'; app.Meals.save(); app.Meals.load();
  assert.equal(rp('m-pork').name, 'Pork loin, roast potatoes and salad');
  assert.equal(app.Meals.ING.salmon.name, 'Salmon fillet');
  assert.match(app.Meals.shoppingText(), /Produce\n- /);
});
