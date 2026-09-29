// ─────────────────────────────────────────────────────────────
// MEALS — week plan, prep, shopping, recipes (the Meals scope)
//
// Ported from the Meals prototype (claude.ai artifact, 27 Sep 2026) into
// the app. What changed on the way in:
//  - State lives in DB key 'meals' (pb_meals), so it syncs per account like
//    everything else (overrides row store_key 'meals'). Each person's own
//    account holds their own diet, plan and budget.
//  - Day effort is read from the training plan instead of typed in: the
//    daily instance (a traded or "lighter" day counts), else the month plan,
//    else the standing week split. Tap a day in Me to override it.
//  - Body weight comes from the latest weigh-in (Vitals.bodyweight()) unless
//    one is typed in Me.
//  - Plans are kept per week (Sunday start), so last week's "eaten" ticks
//    stay put and next week can be planned ahead. Old weeks are pruned
//    after 12.
// Data: data/meals.js. Styles: css/meals.css. Entry point: Meals.render(tab)
// called by navTo('meals-<tab>').
// ─────────────────────────────────────────────────────────────

const Meals = (() => {
  const D = (typeof MEALS_DATA !== 'undefined') ? MEALS_DATA : { ING_ROWS: [], AISLES: [], CONS: [], COMPONENTS: [], RECIPES: [] };
  const ING = {};
  D.ING_ROWS.forEach(r => { ING[r[0]] = { id: r[0], name: r[1], cls: r[2], aisle: r[3], kcal: r[4], p: r[5], c: r[6], f: r[7], fib: r[8], price: r[9], al: r[10] ? r[10].split(' ') : [], pc: r[11], staple: !!r[12], pack: 0, keep: 'fresh' }; });
  Object.entries(D.PACK || {}).forEach(([id, [pk, keep]]) => { if (ING[id]) { ING[id].pack = pk; ING[id].keep = keep; } });
  const AISLES = D.AISLES, CONS = D.CONS;

  const KEY = 'meals';
  const KEEP_WEEKS = 12;
  const TIERS = ['rest', 'easy', 'moderate', 'hard'];
  const PAL = { rest: 1.35, easy: 1.5, moderate: 1.65, hard: 1.85 };
  const GOAL = { maintain: { k: 0, p: 1.8, l: 'Maintain' }, gain: { k: 0.08, p: 2.0, l: 'Lean gain' }, cut: { k: -0.15, p: 2.0, l: 'Lean cut' } };
  const SLOTS = [['b', 'Breakfast', 0.22], ['l', 'Lunch', 0.32], ['d', 'Dinner', 0.32]];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const WDKEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const STYLES = { sunday: { l: 'Sunday batch', s: 'all on Sunday', d: [0] }, hybrid: { l: 'Hybrid', s: 'bases Sunday, fresh on the day', d: [0] }, daily: { l: 'Every day', s: 'fresh each evening', d: [0, 1, 2, 3, 4, 5, 6] } };
  const BFST = { shake: 'Protein shake every morning', cooked: 'Cooked breakfast', mix: 'Shake on training days' };
  const PREPL = { batch: 'Batch', fresh: 'Cook on the day', assemble: 'Assemble' };
  const BF_COMPS = ['oats', 'eggtoast', 'yogbowl', 'tofuwrap', 'pancakes', 'shake', 'plantshake'];

  // How much a training day costs, for portions. Energy, not perceived
  // effort: an hour's Zone 2 run burns more than a heavy strength hour.
  const TIER_OF_TYPE = {
    'z2-run': 'hard', 'quality-run': 'hard', 'aerobic-test': 'hard', 'quality-4x4': 'hard',
    'strength-a': 'moderate', 'strength-b': 'moderate', 'plyo-power': 'moderate', 'z2-bike': 'moderate',
    'light': 'easy', 'light-yoga': 'easy',
  };

  // ── state ────────────────────────────────────────────────
  let S = null;
  const ui = { tab: 'week', day: null, weekStart: null, lib: '', libType: 'all', fitOnly: true };
  let draft = null, cdraft = null, sheetOpen = null;

  function fresh() {
    return {
      v: 1,
      prof: { sex: 'm', age: '', height: '', weight: '', bf: '', goal: 'maintain', diet: 'both', cons: [], avoid: '' },
      prefs: { style: 'hybrid', cookDays: [0], meals: { b: true, l: true, d: true }, days: [1, 2, 3, 4, 5], breakfast: 'mix' },
      budget: 250, custom: [], customComps: [], effort: {}, weeks: {},
    };
  }
  function load() {
    const v = (typeof DB !== 'undefined') ? DB.get(KEY) : null;
    const f = fresh();
    if (!v || typeof v !== 'object' || v.v !== 1) { S = f; return S; }
    S = { ...f, ...v, prof: { ...f.prof, ...(v.prof || {}) }, prefs: { ...f.prefs, ...(v.prefs || {}), meals: { ...f.prefs.meals, ...((v.prefs || {}).meals || {}) } } };
    ['custom', 'customComps'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
    ['effort', 'weeks'].forEach(k => { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
    if (!Array.isArray(S.prof.cons)) S.prof.cons = [];
    if (!Array.isArray(S.prefs.days)) S.prefs.days = f.prefs.days.slice();
    return S;
  }
  function save() {
    const keep = Object.keys(S.weeks).sort().slice(-KEEP_WEEKS);
    S.weeks = Object.fromEntries(keep.map(k => [k, S.weeks[k]]));
    const cut = addDays(todayKey(), -KEEP_WEEKS * 7);
    Object.keys(S.effort).forEach(k => { if (k < cut) delete S.effort[k]; });
    S.updatedAt = Date.now();
    if (typeof DB !== 'undefined') DB.set(KEY, S);
  }

  // ── dates ────────────────────────────────────────────────
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = k => new Date(k + 'T12:00:00');
  const todayKey = () => keyOf(new Date());
  function addDays(k, n) { const d = parse(k); d.setDate(d.getDate() + n); return keyOf(d); }
  function sundayOf(k) { const d = parse(k); d.setDate(d.getDate() - d.getDay()); return keyOf(d); }
  const dateOf = d => addDays(ui.weekStart, d);
  const weekKeys = () => [0, 1, 2, 3, 4, 5, 6].map(dateOf);

  // The week being looked at. create=false returns an empty stand-in that
  // is not stored, so browsing weeks doesn't write anything.
  function wk(create) {
    let w = S.weeks[ui.weekStart];
    if (!w) {
      w = { plan: {}, planPrefs: null, shop: { checked: {}, extras: [], pantry: false } };
      if (create) S.weeks[ui.weekStart] = w;
    }
    if (!w.shop) w.shop = { checked: {}, extras: [], pantry: false };
    if (!w.plan) w.plan = {};
    return w;
  }
  const hasPlan = () => Object.keys(wk().plan).length > 0;

  // ── training link ────────────────────────────────────────
  function typeLabel(t) {
    const s = (typeof WEEK_SCAFFOLD_TYPES !== 'undefined') ? WEEK_SCAFFOLD_TYPES[t] : null;
    return (s && s.mainFocus && s.mainFocus.label) || (t ? String(t).replace(/-/g, ' ') : 'No session');
  }
  function fuelNote(t) {
    const s = (typeof WEEK_SCAFFOLD_TYPES !== 'undefined') ? WEEK_SCAFFOLD_TYPES[t] : null;
    return (s && s.fuel) || '';
  }
  // { tier, type, label, src: 'you'|'today'|'plan'|'week'|'none', lighter }
  let effMemo = null;   // set while fitting packs: the plan is re-read hundreds of times
  function effortFor(key) {
    if (effMemo && effMemo[key]) return effMemo[key];
    let type = null, src = 'none', lighter = false;
    const inst = (typeof DB !== 'undefined') ? DB.get('daily_instance_' + key) : null;
    if (inst && (inst.dayKind || inst.dayType)) {
      type = inst.dayKind || inst.dayType; src = 'today';
      lighter = (inst.edits || []).some(e => e && (e.action === 'lighter' || e.action === 'scale_session'));
    }
    if (!type && typeof MonthPlan !== 'undefined') {
      const d = MonthPlan.dayFor(key);
      if (d) { type = MonthPlan.typeOf(d); src = 'plan'; }
    }
    if (!type && typeof WEEK_SCAFFOLD !== 'undefined') {
      const w = WEEK_SCAFFOLD[WDKEY[parse(key).getDay()]];
      if (w && w.dayType) { type = w.dayType; src = 'week'; }
    }
    let tier = TIER_OF_TYPE[type] || 'rest';
    if (lighter) tier = TIERS[Math.max(0, TIERS.indexOf(tier) - 1)];
    const own = S && S.effort[key];
    const res = { tier: own || tier, planTier: tier, type, label: typeLabel(type), src: own ? 'you' : src, lighter };
    if (effMemo) effMemo[key] = res;
    return res;
  }
  const tierOf = d => effortFor(dateOf(d)).tier;
  const training = t => t === 'hard' || t === 'moderate';

  // ── nutrition ────────────────────────────────────────────
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { const n = parseFloat(v); return isFinite(n) ? n : null; };
  const comps = () => D.COMPONENTS.concat(S.customComps);
  const CP = id => comps().find(c => c.id === id);
  const recipes = () => D.RECIPES.concat(S.custom);
  const R = id => recipes().find(r => r.id === id);
  const grams = (id, q) => ING[id] && ING[id].pc ? q * ING[id].pc : q;
  function mealIng(r) {
    const out = [];
    (r.parts || []).forEach(([cid, cm]) => { const c = CP(cid); if (c) c.ing.forEach(([i, q]) => out.push([i, q * cm])); });
    (r.finish || []).forEach(x => out.push(x));
    return out;
  }
  function nutrIng(list, m = 1) {
    const t = { kcal: 0, p: 0, c: 0, f: 0, cost: 0 };
    list.forEach(([id, q]) => {
      const i = ING[id]; if (!i) return; const g = grams(id, q) * m;
      t.kcal += i.kcal * g / 100; t.p += i.p * g / 100; t.c += i.c * g / 100; t.f += i.f * g / 100;
      t.cost += i.pc ? i.price * q * m : i.price * g / 1000;
    });
    return t;
  }
  const nutr = (r, m = 1) => nutrIng(mealIng(r), m);
  const allergensOf = r => [...new Set(mealIng(r).flatMap(([id]) => ING[id]?.al || []))];
  const classesOf = r => new Set(mealIng(r).map(([id]) => ING[id]?.cls).filter(Boolean));
  const hasIng = (r, ids) => mealIng(r).some(([id]) => ids.includes(id));
  function dietLabel(r) { const c = classesOf(r); if (c.has('meat')) return 'Meat'; if (c.has('fish')) return 'Fish'; if (c.has('dairy') || c.has('egg')) return 'Vegetarian'; return 'Vegan'; }
  function fits(r) {
    const p = S.prof, c = classesOf(r), cons = p.cons;
    if (p.diet === 'veg' && (c.has('meat') || c.has('fish'))) return 'not vegetarian';
    if (p.diet === 'nonveg' && r.type === 'main' && !(c.has('meat') || c.has('fish'))) return 'no meat or fish';
    const al = allergensOf(r).filter(a => cons.includes(a)); if (al.length) return 'contains ' + al.join(', ');
    if (cons.includes('pork') && hasIng(r, ['pork'])) return 'contains pork';
    if (cons.includes('redmeat') && hasIng(r, ['beef', 'pork'])) return 'contains red meat';
    if (cons.includes('vegan') && (c.has('dairy') || c.has('egg') || c.has('meat') || c.has('fish'))) return 'not vegan';
    const words = (p.avoid || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const hit = mealIng(r).find(([id]) => words.some(w => ING[id] && ING[id].name.toLowerCase().includes(w)));
    return hit ? 'has ' + ING[hit[0]].name.toLowerCase() : true;
  }
  // Weight in use: typed in Me, else the latest weigh-in. { v, src, date }
  function weight() {
    const typed = num(S.prof.weight);
    if (typed) return { v: typed, src: 'typed' };
    const bw = (typeof Vitals !== 'undefined' && Vitals.bodyweight) ? Vitals.bodyweight() : null;
    return bw && bw.v ? { v: +bw.v, src: bw.src, date: bw.date } : null;
  }
  function bodyfat() {
    const typed = num(S.prof.bf); if (typed) return typed;
    const l = (typeof Vitals !== 'undefined' && Vitals.latest) ? Vitals.latest('fat') : null;
    return l ? +l.v : null;
  }
  function bmr() {
    const p = S.prof, w = weight()?.v, bf = bodyfat(), h = num(p.height), a = num(p.age);
    if (w && bf) return 370 + 21.6 * w * (1 - bf / 100);
    if (w && h && a) return 10 * w + 6.25 * h - 5 * a + (p.sex === 'm' ? 5 : -161);
    return w ? w * 22 : null;
  }
  function targetFor(tier) {
    const b = bmr(); if (!b) return null; const g = GOAL[S.prof.goal] || GOAL.maintain;
    const kcal = Math.round(b * PAL[tier] * (1 + g.k) / 10) * 10, prot = Math.round(weight().v * g.p), fat = Math.round(kcal * .28 / 9);
    return { kcal, p: prot, f: fat, c: Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4)) };
  }
  const target = d => targetFor(tierOf(d));
  function portion(d, s, r) {
    if (r.fixed) return 1; const t = target(d); if (!t) return 1; const k = nutr(r).kcal; if (!k) return 1;
    return Math.round(Math.min(2.2, Math.max(.6, t.kcal * SLOTS.find(x => x[0] === s)[2] / k)) * 10) / 10;
  }
  const sk = (d, s) => d + '-' + s;
  const slotObj = (d, s) => wk().plan[sk(d, s)];
  function fmtQ(id, q) {
    const i = ING[id]; if (!i) return '';
    if (i.pc) { const n = Math.ceil(q - .05); return n + (n === 1 ? ' pc' : ' pcs'); }
    if (q >= 1000) return (Math.round(q / 100) / 10) + ' kg';
    return (q < 20 ? Math.round(q) : Math.round(q / 5) * 5) + ' g';
  }
  // Cooked weight of q portions of a component, for splitting a pot by weight.
  function cookedLabel(c, q) {
    if (c.ing.every(([id]) => ING[id] && ING[id].pc)) { const [id, n] = c.ing[0]; return fmtQ(id, n * q); }
    if (!c.yield) return '';
    const g = c.ing.reduce((a, [id, n]) => a + grams(id, n), 0) * q * c.yield;
    return g >= 1000 ? (Math.round(g / 100) / 10) + ' kg' : Math.round(g / 10) * 10 + ' g';
  }
  const eur = v => '€' + v.toFixed(v < 10 ? 2 : 0);
  const mealKeeps = r => Math.min(...r.parts.map(([cid]) => { const c = CP(cid); return !c || c.prep === 'assemble' || c.freezes ? 99 : c.keeps; }));
  const batchParts = r => r.parts.map(([cid]) => CP(cid)).filter(c => c && c.prep === 'batch');
  const planPrefs = () => wk().planPrefs || S.prefs;
  const plannedStyle = () => planPrefs().style;
  const batchDays = () => { const pp = planPrefs(); return pp.style === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : pp.style === 'sunday' ? [0] : [...new Set(pp.cookDays)].sort((a, b) => a - b); };

  // ── planning ─────────────────────────────────────────────
  let rnd = Math.random;
  let fitOn = true, lastFit = null;
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // Days that get a planned lunch and dinner (a week planned before this
  // setting existed planned all seven).
  const eatDays = pp => (pp && Array.isArray(pp.days)) ? pp.days : [0, 1, 2, 3, 4, 5, 6];
  function mainSlots(meals, days) { const on = new Set(days || [0, 1, 2, 3, 4, 5, 6]); const out = []; for (let d = 0; d < 7; d++) if (on.has(d)) ['l', 'd'].forEach(s => { if (meals[s]) out.push({ d, s }); }); return out; }
  // whole-meal sessions (Sunday batch, Every day): Sunday cooks at midday, other days in the evening
  function sessions(cookDays, meals, days) {
    const cds = [...new Set(cookDays)].sort((a, b) => a - b); const start = c => c * 2 + (c === 0 ? 0 : 1); const out = cds.map(c => ({ c, slots: [] }));
    mainSlots(meals, days).forEach(({ d, s }) => {
      const t = d * 2 + (s === 'l' ? 0 : 1); let own = null; for (const x of out) if (start(x.c) <= t) own = x; let off;
      if (own) off = d - own.c; else { own = out[out.length - 1]; off = d + 7 - own.c; } own.slots.push({ d, s, off });
    });
    return out.filter(x => x.slots.length);
  }
  function pickBreakfast(d, cooked) {
    const pref = S.prefs.breakfast, t = tierOf(d); const shakes = recipes().filter(r => r.shake && fits(r) === true);
    if (pref === 'shake' || (pref === 'mix' && training(t))) if (shakes.length) return shakes[0];
    // a day off cooking gets a breakfast with nothing to cook either
    if (!eatDays(S.prefs).includes(d)) {
      const noCook = recipes().filter(r => r.type === 'breakfast' && fits(r) === true && r.parts.every(([cid]) => { const c = CP(cid); return c && c.prep === 'assemble'; }));
      const easy = noCook.filter(r => !r.shake);
      if (easy.length || noCook.length) return (easy.length ? easy : noCook)[d % (easy.length || noCook.length)];
    }
    return cooked.length ? cooked[d % cooked.length] : shakes[0];
  }
  // Returns an error string, or '' on success.
  function generate() {
    const pr = S.prefs, plan = {};
    const mains = shuffle(recipes().filter(r => r.type === 'main' && fits(r) === true));
    if ((pr.meals.l || pr.meals.d) && eatDays(pr).length && !mains.length) return 'No lunch or dinner recipe fits your food settings';
    if (pr.style === 'hybrid') {
      /* Slot by slot, score every fitting main:
         - weekday lunches are boxes: anything cooked on the day costs a lot
         - dinners get one quick fresh part; past ~15 min it costs
         - reuse what is already in the batch; a new batch component is cheap
           until the batch holds `cap` of them, then expensive
         - lunch and dinner on the same day share no component (a grain at
           most), a recipe
           never follows itself and is used at most ~twice */
      const bdays = [...new Set(pr.cookDays)].sort((a, b) => a - b);
      const slots = mainSlots(pr.meals, eatDays(pr));
      const cap = Math.min(6, Math.max(3, Math.round(slots.length / 2.8)));
      const inBatch = new Set(), count = {}, placed = {}, cUse = {};
      const GRAIN = new Set(['rice', 'quinoa', 'pasta']);
      const ids = r => new Set(r.parts.map(([cid]) => cid));
      let last = null, prevLabel = null;
      slots.forEach(({ d, s }) => {
        const cookDay = bdays.includes(d) && (d === 0 || d === 6 || s === 'd');
        const sameDay = s === 'd' ? placed[sk(d, 'l')] : null;
        const prevDinner = s === 'l' ? placed[sk(d - 1, 'd')] : null;
        let best = null, bs = -1e9, bestPl = null;
        mains.forEach(r => {
          const pl = r.parts.map(([cid]) => CP(cid)).filter(Boolean).map(c => ({ c, ...hyPlace(c, d, bdays, s) }));
          const mins = pl.reduce((a, p) => a + onDayMins(p), 0);
          const fresh = pl.filter(p => !p.batch && p.c.prep !== 'assemble').length;
          let sc = 0;
          if (s === 'l' && !cookDay) sc -= d === 6 ? mins : mins * 3 + Math.max(0, mins - 4) * 4;
          else sc -= Math.max(0, mins - (cookDay ? 25 : 15)) * 1.5 + mins * 0.15 + Math.max(0, fresh - 2) * 3;
          const newB = [...new Set(pl.filter(p => p.batch && !inBatch.has(p.c.id)).map(p => p.c.id))];
          sc += 2.5 * pl.filter(p => p.batch && inBatch.has(p.c.id)).length;
          sc -= newB.length * (inBatch.size + newB.length > cap ? 20 : 1);
          sc -= (count[r.id] || 0) * (s === 'd' ? 16 : 8); if (count[r.id] >= 2) sc -= 20;   // lunch boxes may repeat; dinners want variety
          if (r.id === last) sc -= 40;
          if (placed[sk(d - 1, 'l')] === r.id || placed[sk(d - 1, 'd')] === r.id) sc -= 10;
          if (sameDay) { const oi = ids(R(sameDay)); ids(r).forEach(id => { if (oi.has(id)) sc -= GRAIN.has(id) ? 6 : 25; }); }
          if (prevDinner) { const oi = ids(R(prevDinner)); ids(r).forEach(id => { if (oi.has(id)) sc -= 2; }); }
          if (dietLabel(r) === prevLabel) sc -= 2;
          const prevSame = placed[sk(d - 1, s)] ? ids(R(placed[sk(d - 1, s)])) : new Set();
          ids(r).forEach(id => { const g = GRAIN.has(id) ? 0.4 : 1; sc -= (cUse[id] || 0) * 1.5 * g; if (prevSame.has(id)) sc -= 5 * g; });
          pl.forEach(p => { if (p.note) sc -= 4; });
          sc += rnd() * 2;
          if (sc > bs) { bs = sc; best = r; bestPl = pl; }
        });
        bestPl.forEach(p => { if (p.batch) inBatch.add(p.c.id); cUse[p.c.id] = (cUse[p.c.id] || 0) + 1; });
        count[best.id] = (count[best.id] || 0) + 1; last = best.id; prevLabel = dietLabel(best);
        placed[sk(d, s)] = best.id; plan[sk(d, s)] = { r: best.id };
      });
    } else {
      const used = new Set();
      sessions(pr.style === 'daily' ? STYLES.daily.d : [0], pr.meals, eatDays(pr)).forEach(sess => {
        const n = pr.style === 'daily' ? 1 : Math.max(1, Math.min(4, Math.round(sess.slots.length / 3.5))); const size = Math.ceil(sess.slots.length / n); let prev = null;
        for (let j = 0; j * size < sess.slots.length; j++) {
          const chunk = sess.slots.slice(j * size, (j + 1) * size); const maxOff = Math.max(...chunk.map(x => x.off));
          const tiers = [r => !used.has(r.id) && mealKeeps(r) >= maxOff && dietLabel(r) !== prev, r => !used.has(r.id) && mealKeeps(r) >= maxOff, r => mealKeeps(r) >= maxOff, r => true];
          let r = null; for (const f of tiers) { r = mains.find(f); if (r) break; } used.add(r.id); prev = dietLabel(r);
          chunk.forEach(x => { plan[sk(x.d, x.s)] = { r: r.id, cook: sess.c }; });
        }
      });
    }
    if (pr.meals.b) {
      const cooked = shuffle(recipes().filter(r => r.type === 'breakfast' && !r.shake && fits(r) === true)).slice(0, 2);
      for (let d = 0; d < 7; d++) { const r = pickBreakfast(d, cooked); if (r) plan[sk(d, 'b')] = { r: r.id }; }
    }
    // Meals already eaten this week stay as they were.
    const w = wk(true);
    Object.entries(w.plan).forEach(([k, o]) => { if (o && o.done) plan[k] = o; });
    w.plan = plan; w.planPrefs = JSON.parse(JSON.stringify(pr)); w.shop.checked = {};
    save();
    lastFit = fitOn ? fitPacks() : null;
    return '';
  }

  // The batch day a meal on day d draws from: the latest cook day before it.
  // Weekend batch days cook in the morning and feed that day's lunch; a
  // weekday batch day cooks in the evening, so it feeds from that dinner on.
  // null when the meal comes before this week's first batch (that food would
  // be last week's, which this plan doesn't hold).
  const feeds = (c, d, s) => c < d || (c === d && (c === 0 || c === 6 || s === 'd'));
  function batchFor(bdays, d, s) { let c = null; bdays.forEach(x => { if (feeds(x, d, s)) c = x; }); return c == null ? null : { c, off: d - c }; }
  const preMins = c => (c.pre ? c.pre.save : 0);
  /* Hybrid (and breakfast) placement of one component eaten on day d.
     batch: made on the batch day (fridge, or freezer when frz)
     day:   the day it gets made · pre: batch day that preps it ahead */
  function hyPlace(c, d, bdays, s) {
    const L = batchFor(bdays, d, s);
    const preOn = () => (c.pre && L && L.off >= 1 && L.off <= c.pre.days) ? L.c : null;
    if (c.prep === 'assemble') return { day: d, batch: false, frz: false, pre: preOn() };
    if (!L) return { day: d, batch: false, frz: false, pre: null };
    if (c.prep === 'batch') {
      if (L.off <= c.keeps) return { day: L.c, batch: true, frz: false };
      if (c.freezes) return { day: L.c, batch: true, frz: true };
      return { day: d, batch: false, frz: false, note: 'keeps ' + c.keeps + 'd', pre: preOn() };
    }
    const a = Math.min(c.ahead || 0, c.keeps);
    if (a > 0 && L.off <= a) return { day: L.c, batch: true, frz: false };
    if (a > 0 && c.freezes) return { day: L.c, batch: true, frz: true };
    return { day: d, batch: false, frz: false, pre: preOn() };
  }
  // Active minutes a placed component costs on the day it is eaten.
  const onDayMins = p => p.batch ? 0 : Math.max(1, p.c.mins - (p.pre != null ? preMins(p.c) : 0));

  /* Where each component of a planned meal gets made.
     → [{c, q (portions), day (when it is made), batch (made ahead), frz, note, pre}] */
  function placeSlot(d, s, o, r, m) {
    const style = plannedStyle(), bdays = batchDays();
    return r.parts.map(([cid, cm]) => {
      const c = CP(cid); if (!c) return null; const bst = (o.boost && o.boost[cid]) || 1; const q = m * cm * bst;
      if (c.prep === 'assemble' && style !== 'hybrid') return { c, q, day: d, batch: false, frz: false };
      if (o.fresh) return { c, q, day: d, batch: false, frz: false };
      if (s === 'b') return style === 'daily' ? { c, q, day: d, batch: false, frz: false } : { c, q, ...hyPlace(c, d, bdays, s) };
      if (style === 'daily' || style === 'sunday') {
        const cook = o.cook ?? d, off = d - cook;
        if (off < 0) return { c, q, day: d, batch: false, frz: false };
        const frz = off > c.keeps && c.freezes; if (off > c.keeps && !c.freezes) return { c, q, day: d, batch: false, frz: false, note: 'keeps ' + c.keeps + 'd' };
        return { c, q, day: cook, batch: cook !== d, frz };
      }
      return { c, q, ...hyPlace(c, d, bdays, s) };
    }).filter(Boolean).map(p => (bst => bst > 1 ? { ...p, boost: bst } : p)((o.boost && o.boost[p.c.id]) || 1));
  }
  function activeSlots() {
    const out = [];
    for (let d = 0; d < 7; d++) SLOTS.forEach(([s]) => {
      const o = slotObj(d, s); const r = o && R(o.r);
      if (o && !o.skip && r) { const m = portion(d, s, r); out.push({ d, s, o, r, m, pl: placeSlot(d, s, o, r, m) }); }
    });
    return out;
  }
  /* Everything to do, one entry per (day, component):
     kind 'cook' — make it (batch: made ahead for later meals)
     kind 'pre'  — prep on the batch day for something cooked later
     uses: [{d, s, q, frz}] · mins: active minutes for this entry */
  function tasks() {
    const T = {};
    activeSlots().forEach(x => {
      x.pl.forEach(p => {
        const k = p.day + '|' + p.c.id; const t = T[k] = T[k] || { kind: 'cook', day: p.day, batch: false, c: p.c, q: 0, uses: [], bf: x.s === 'b', prepped: true };
        t.batch = t.batch || p.batch; t.q += p.q; t.uses.push({ d: x.d, s: x.s, q: p.q, frz: p.frz }); if (x.s !== 'b') t.bf = false;
        if (p.pre == null) t.prepped = false;
        if (p.pre != null) {
          const pk = 'pre|' + p.pre + '|' + p.c.id; const u = T[pk] = T[pk] || { kind: 'pre', day: p.pre, batch: true, c: p.c, q: 0, uses: [], bf: false };
          u.q += p.q; u.uses.push({ d: x.d, s: x.s, q: p.q, frz: false });
        }
      });
    });
    return Object.values(T).map(t => {
      if (t.kind === 'pre') t.mins = t.c.pre.m;
      else { if (t.batch) t.prepped = false; t.mins = t.batch ? t.c.mins : Math.max(1, t.c.mins - (t.prepped ? preMins(t.c) : 0)); }
      if (t.c.prep === 'assemble' && t.kind === 'cook') t.batch = false;
      return t;
    });
  }
  /* ── packs, stock, the shopping ledger ─────────────────────
     need:  what the week's meals use (raw)
     have:  what's left from earlier weeks (stockFor) and used first
     buy:   whole packs for packed items, the exact amount for loose ones
     spare: buy − (need − have), plus stock this week doesn't touch.
            Where it goes follows the ingredient's keep class. */
  const TOL = pk => Math.min(25, pk * 0.05);          // a pack stretches this far (portions are estimates)
  const unitCost = i => i.pc ? i.price : i.price / 1000;
  const WHERE = i => i.keep === 'freeze' || (i.keep === 'shelf' && i.aisle === 'Frozen') ? 'freezer' : i.keep === 'fridge' ? 'fridge' : 'cupboard';
  function needs() {
    const tot = {};
    const add = (id, q, day) => { const e = tot[id] = tot[id] || { q: 0, by: new Set() }; e.q += q; e.by.add(day); };
    tasks().filter(t => t.kind === 'cook').forEach(t => t.c.ing.forEach(([id, q]) => add(id, q * t.q, t.day)));
    activeSlots().forEach(x => (x.r.finish || []).forEach(([id, q]) => add(id, q * x.m, x.d)));
    return tot;
  }
  function ledger(stock) {
    if (stock === undefined) stock = stockFor(ui.weekStart);
    const tot = needs(); Object.keys(stock).forEach(id => { if (!tot[id]) tot[id] = { q: 0, by: new Set() }; });
    return Object.entries(tot).filter(([id]) => ING[id]).map(([id, t]) => {
      const i = ING[id], st = stock[id], need = t.q;
      const have = st ? Math.min(st.q, need) : 0, want = need - have;
      let buy, packs = 0;
      if (i.pack && !i.staple) { packs = want > TOL(i.pack) ? Math.ceil((want - TOL(i.pack)) / i.pack) : 0; buy = packs * i.pack; }
      else buy = i.pc ? Math.ceil(want - .05) : want;
      const spareBuy = Math.max(0, buy - want), spareOld = st ? st.q - have : 0;
      return { id, i, q: need, need, have, st, want, buy, packs, spareBuy, spareOld, spare: spareBuy + spareOld, keep: i.keep, where: WHERE(i),
        cost: buy * unitCost(i), by: [...t.by].sort() };
    });
  }
  function shoppingList(stock) { return ledger(stock).filter(x => x.q > 0); }
  function withWeek(k, fn) { const was = ui.weekStart; ui.weekStart = k; try { return fn(); } finally { ui.weekStart = was; } }
  // What's left over from last week that this week can use. Chains back up
  // to three weeks; fridge items only carry what was bought last week.
  function stockFor(k, depth = 3) {
    const prev = addDays(k, -7), pw = S.weeks[prev];
    if (!depth || !pw || !Object.keys(pw.plan || {}).length) return {};
    const rows = withWeek(prev, () => ledger(stockFor(prev, depth - 1)));
    const off = (S.weeks[k] && S.weeks[k].shop && S.weeks[k].shop.nostock) || {};
    const out = {};
    rows.forEach(x => {
      if (off[x.id] || !x.i.pack || x.i.staple || x.keep === 'fresh') return;
      const q = x.keep === 'fridge' ? x.spareBuy + (x.st && x.st.age < 1 ? x.spareOld : 0) : x.spare;
      if (q > (x.i.pc ? .5 : Math.max(15, x.i.pack * 0.05))) out[x.id] = { q, where: x.where, age: x.spareOld > x.spareBuy ? ((x.st && x.st.age) || 0) + 1 : 0 };
    });
    return out;
  }
  // € of spare that is likely thrown away (fresh), or parked (freezer/fridge).
  const WASTE_W = { fresh: 1, freeze: 0.25, fridge: 0.15, shelf: 0 };
  const wasteOf = rows => rows.reduce((a, x) => a + (x.q > 0 && x.i.pack ? x.spareBuy * unitCost(x.i) * (WASTE_W[x.keep] || 0) : 0), 0);

  /* ── fit to packs ────────────────────────────────────────
     After a plan is made: (1) swap a few meals for ones that use up an
     opened or perishable pack, keeping the plan's rules (no back-to-back
     repeats, no shared component with the other meal that day, weekday
     lunches stay boxes, dinners stay quick, a recipe at most twice);
     (2) top up the main protein or veg of the meals that already use a
     pack, up to +30%, so the pack is finished rather than left over.
     Freezer items are only topped up when that finishes the pack. */
  const GRAINS = ['rice', 'quinoa', 'pasta'];
  function domIng(c) { let b = null, bg = -1; c.ing.forEach(([id, q]) => { const g = grams(id, q); if (g > bg) { bg = g; b = id; } }); return b; }
  const toppable = id => { const i = ING[id]; return i && !i.pc && (i.cls === 'meat' || i.cls === 'fish' || id === 'tofu' || i.aisle === 'Produce'); };
  function slotMins(r, d, s, bdays, style) {
    if (style !== 'hybrid') return 0;
    return r.parts.map(([cid]) => CP(cid)).filter(Boolean).reduce((a, c) => a + onDayMins({ c, ...hyPlace(c, d, bdays, s) }), 0);
  }
  function swapOk(plan, d, s, r, style, bdays) {
    const at = (dd, ss) => plan[sk(dd, ss)] && plan[sk(dd, ss)].r;
    const prev = s === 'd' ? at(d, 'l') : at(d - 1, 'd'), next = s === 'l' ? at(d, 'd') : at(d + 1, 'l');
    if (r.id === prev || r.id === next) return false;
    const other = at(d, s === 'l' ? 'd' : 'l'); const oR = other && R(other);
    if (oR) { const oi = new Set(oR.parts.map(p => p[0])); if (r.parts.some(([cid]) => oi.has(cid) && !GRAINS.includes(cid))) return false; }
    const n = Object.entries(plan).filter(([k, o]) => !k.endsWith('-b') && k !== sk(d, s) && o.r === r.id).length; if (n >= 2) return false;
    const o = plan[sk(d, s)];
    if (style === 'hybrid') {
      const cur = R(o.r), m = slotMins(r, d, s, bdays, style), m0 = cur ? slotMins(cur, d, s, bdays, style) : 0;
      if (s === 'l' && d >= 1 && d <= 5) { if (m > Math.max(5, m0)) return false; }
      else if (m > Math.max(20, m0)) return false;
    } else if (mealKeeps(r) < d - (o.cook ?? d)) return false;
    return true;
  }
  function fitPacks() {
    const w = wk(true); if (!Object.keys(w.plan).length) return { swaps: 0, tops: 0 };
    const stock = stockFor(ui.weekStart); const pp = planPrefs(), style = pp.style, bdays = batchDays();
    effMemo = {};
    try {
      const batchN = () => new Set(activeSlots().flatMap(x => x.pl.filter(p => p.batch).map(p => p.c.id + '@' + p.day))).size;
      const b0 = batchN();
      let cur = wasteOf(ledger(stock)), swaps = 0, tops = 0;
      const mains = recipes().filter(r => r.type === 'main' && fits(r) === true);
      const slots = mainSlots(pp.meals, eatDays(pp)).filter(({ d, s }) => { const o = w.plan[sk(d, s)]; return o && R(o.r) && !o.done && !o.skip && !o.fresh; });
      for (let round = 0; round < 4; round++) {
        const spareIds = new Set(ledger(stock).filter(x => x.q > 0 && x.spareBuy > 1e-6 && (WASTE_W[x.keep] || 0) > 0).map(x => x.id));
        if (!spareIds.size) break;
        let best = null, bestSc = cur - 0.4;
        slots.forEach(({ d, s }) => {
          const k = sk(d, s), old = w.plan[k];
          mains.forEach(r => {
            if (r.id === old.r || !mealIng(r).some(([id]) => spareIds.has(id)) || !swapOk(w.plan, d, s, r, style, bdays)) return;
            const nu = style === 'hybrid' ? { r: r.id } : { r: r.id, cook: old.cook };
            w.plan[k] = nu; const sc = wasteOf(ledger(stock)); const ok = sc < bestSc && batchN() <= b0 + 1; w.plan[k] = old;
            if (ok) { bestSc = sc; best = { k, nu }; }
          });
        });
        if (!best) break;
        w.plan[best.k] = best.nu; cur = bestSc; swaps++;
      }
      // top-ups
      ledger(stock).forEach(x => {
        if (!x.i.pack || x.spareBuy <= 1e-6 || !(WASTE_W[x.keep] > 0) || !toppable(x.id)) return;
        const hits = activeSlots().filter(a => a.s !== 'b' && !a.o.done && !a.o.skip).flatMap(a => a.pl.filter(p => domIng(p.c) === x.id).map(p => ({ a, p })));
        const inComps = hits.reduce((acc, { p }) => acc + (p.c.ing.find(([id]) => id === x.id)[1]) * p.q, 0); if (!inComps) return;
        const room = x.spareBuy - 2; if (room <= 0) return;
        if (x.keep !== 'fresh' && room > 0.3 * inComps) return;
        const f = Math.min(1.3, 1 + room / inComps); if (f < 1.05) return;
        hits.forEach(({ a }) => { const o = w.plan[sk(a.d, a.s)]; o.boost = o.boost || {}; });
        hits.forEach(({ a, p }) => { const o = w.plan[sk(a.d, a.s)]; o.boost[p.c.id] = Math.floor((o.boost[p.c.id] || 1) * f * 100) / 100; });
        tops++;
      });
      save();
      return { swaps, tops, waste: wasteOf(ledger(stock)) };
    } finally { effMemo = null; }
  }
  const slotNutr = x => nutrIng(x.pl.flatMap(p => p.c.ing.map(([id, q]) => [id, q * p.q])).concat((x.r.finish || []).map(([id, q]) => [id, q * x.m])));
  function dayTotals(d) {
    const pl = { kcal: 0, p: 0, c: 0, f: 0 }, ea = { kcal: 0, p: 0 };
    activeSlots().filter(x => x.d === d).forEach(x => { const n = slotNutr(x); ['kcal', 'p', 'c', 'f'].forEach(k => pl[k] += n[k]); if (x.o.done) { ea.kcal += n.kcal; ea.p += n.p; } });
    return { planned: pl, eaten: ea };
  }

  // ── icons ────────────────────────────────────────────────
  const IC = {
    pot: '<path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M2 10h20"/>',
  };
  const svg = k => `<svg class="ml-i" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;

  // ── render ───────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const TITLES = { week: 'This week', prep: 'Prep', shop: 'Shopping', recipes: 'Recipes', me: 'Food settings' };
  const mins = n => n < 60 ? n + ' min' : Math.floor(n / 60) + ' h' + (n % 60 ? ' ' + n % 60 + ' min' : '');
  const fmtD = k => { const d = parse(k); return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; };

  function ensureUi() {
    const t = todayKey();
    if (!ui.weekStart) ui.weekStart = sundayOf(t);
    if (ui.day == null) ui.day = parse(t).getDay();
  }

  function render(tab) {
    if (tab && TITLES[tab]) ui.tab = tab;
    load(); ensureUi();
    const body = $('meals-body'); if (!body) return;
    const t = ui.tab, ws = ui.weekStart, we = addDays(ws, 6);
    const cur = sundayOf(todayKey());
    const weekNav = ['week', 'prep', 'shop'].includes(t);
    const rel = ws === cur ? 'This week' : ws === addDays(cur, 7) ? 'Next week' : ws === addDays(cur, -7) ? 'Last week' : 'Week of ' + fmtD(ws);
    const canNext = ws < addDays(cur, 7);
    const canPrev = Object.keys(S.weeks).some(k => k < ws) || ws > cur;
    body.innerHTML = `<header class="ml-top">
        <div class="ml-top-l"><div class="mv-eyebrow mv-eyebrow--accent">Meals</div>
          <h1 class="ml-h1">${weekNav ? rel : TITLES[t]}</h1>
          ${weekNav ? `<div class="ml-sub">Sun ${fmtD(ws)} – Sat ${fmtD(we)}${t === 'week' ? '' : ' · ' + TITLES[t]}</div>` : ''}</div>
        ${weekNav ? `<div class="ml-top-r">
          <button class="ml-iconbtn" data-ml="wk" data-v="-1" aria-label="Previous week" ${canPrev ? '' : 'disabled'}>‹</button>
          <button class="ml-iconbtn" data-ml="wk" data-v="1" aria-label="Next week" ${canNext ? '' : 'disabled'}>›</button>
          ${hasPlan() ? `<button class="ml-iconbtn" data-ml="menu" aria-label="Week options">⋯</button>` : ''}</div>` : ''}
      </header>
      <div class="ml-main">${({ week: vWeek, prep: vPrep, shop: vShop, recipes: vLib, me: vMe })[t]()}</div>`;
  }

  function howCook(p) {
    const days = [...new Set(p.cookDays)].sort((a, b) => a - b).map(d => WD[d]).join(' + ');
    const main = p.style === 'hybrid' ? `Hybrid: bases on ${days}, fresh parts on the day.` : p.style === 'sunday' ? 'Sunday batch: everything on Sunday.' : 'Every day: cook each evening, leftovers for lunch.';
    const ed = eatDays(p), dl = ed.length === 7 ? 'every day' : ed.join() === '1,2,3,4,5' ? 'Mon–Fri' : ed.length ? ed.slice().sort((a, b) => a - b).map(x => WD[x]).join(', ') : 'no days';
    return main + ' Lunch and dinner ' + dl + '. ' + (p.meals.b ? BFST[p.breakfast] + '.' : 'No breakfast planned.');
  }
  // ── the day, as a guide ─────────────────────────────────
  const SL = s => SLOTS.find(x => x[0] === s)[1];
  const SL1 = { b: 'B', l: 'L', d: 'D' };
  const cname = c => esc(c.name.charAt(0).toLowerCase() + c.name.slice(1));
  const boostTxt = p => p.boost ? ` <i class="ml-boost" title="A bit more to finish the pack">+${Math.round((p.boost - 1) * 100)}%</i>` : '';
  const namesOf = ps => ps.map(p => cname(p.c) + boostTxt(p)).join(', ');
  const minsList = ps => ps.map(p => `${cname(p.c)}${boostTxt(p)} <i>${onDayMins(p)}′</i>`).join(', ');
  // Batch minutes for a day: cooking runs in parallel (oven + hob), prep doesn't.
  function batchMinsOf(T, d) {
    const b = T.filter(t => t.day === d && t.batch && t.kind === 'cook' && !t.bf), pre = T.filter(t => t.day === d && t.kind === 'pre');
    if (!b.length && !pre.length) return 0;
    return Math.max(15, Math.round((b.reduce((a, t) => a + t.mins, 0) * 0.65 + pre.reduce((a, t) => a + t.mins, 0)) / 5) * 5);
  }
  const isBatchDay = (T, d) => plannedStyle() !== 'daily' && T.some(t => t.day === d && !t.bf && (t.kind === 'pre' || (t.batch && t.uses.some(u => u.d !== d))));
  // One meal broken into what's ready, what's thawed, what to cook, what to toss.
  function mealParts(x) {
    const made = x.pl.filter(p => p.batch && !p.frz && p.day === x.d), ready = x.pl.filter(p => p.batch && !p.frz && p.day !== x.d);
    const frozen = x.pl.filter(p => p.batch && p.frz), cook = x.pl.filter(p => !p.batch && p.c.prep !== 'assemble'), toss = x.pl.filter(p => !p.batch && p.c.prep === 'assemble');
    return { made, ready, frozen, cook, toss, mins: cook.concat(toss).reduce((a, p) => a + onDayMins(p), 0) };
  }
  function guideLines(x) {
    const g = mealParts(x), out = [];
    const from = ps => { const ds = [...new Set(ps.map(p => p.day))]; return ds.map(d => WD[d]).join('/'); };
    if (g.ready.length) out.push(`<div class="ml-gl"><b>Ready</b><span>${namesOf(g.ready)} <i>from ${from(g.ready)}</i></span></div>`);
    if (g.made.length) out.push(`<div class="ml-gl"><b>Batch</b><span>${namesOf(g.made)} <i>from today's batch</i></span></div>`);
    if (g.frozen.length) out.push(`<div class="ml-gl ml-gl--frz"><b>Thawed</b><span>${namesOf(g.frozen)} <i>from ${from(g.frozen)}'s freezer box</i></span></div>`);
    if (g.cook.length) out.push(`<div class="ml-gl ml-gl--cook"><b>Cook</b><span>${minsList(g.cook)}${g.cook.some(p => p.pre != null) ? ` <i>(prepped ${WD[g.cook.find(p => p.pre != null).pre]})</i>` : ''}${g.cook.some(p => p.note) ? ' <i>(doesn\'t keep that long)</i>' : ''}</span></div>`);
    if (g.toss.length) out.push(`<div class="ml-gl"><b>Toss</b><span>${namesOf(g.toss)}</span></div>`);
    return out.join('');
  }
  function mealKind(x) {
    const g = mealParts(x);
    if (x.r.shake) return '';
    if (!g.cook.length && !g.made.length) return `<span class="ml-pchip ml-pchip--box">${g.frozen.length ? 'Freezer box' : 'Box'} · ${g.toss.length ? g.mins + ' min' : 'no cooking'}</span>`;
    return g.mins ? `<span class="ml-pchip ml-pchip--cook">${g.mins} min</span>` : '';
  }
  // Frozen boxes eaten tomorrow: move them to the fridge tonight.
  function thawTonight(act, d) {
    const out = [];
    act.filter(x => x.d === d + 1).forEach(x => x.pl.filter(p => p.frz).forEach(p => out.push({ p, x })));
    return out;
  }
  function thawHtml(list) {
    if (!list.length) return '';
    const by = {}; list.forEach(({ p, x }) => { const k = WD[x.d] + ' ' + SL(x.s).toLowerCase(); (by[k] = by[k] || []).push(p); });
    return `<div class="ml-tonight"><b>Tonight</b> move from the freezer to the fridge: ${Object.entries(by).map(([k, ps]) => `${namesOf(ps)} <i>(${k})</i>`).join('; ')}.</div>`;
  }
  function effortLine(d) {
    const e = effortFor(dateOf(d));
    return `<span class="ml-dot ml-t-${e.tier}"></span> ${esc(e.label)} · ${e.tier}${e.src === 'you' ? ' (set by you)' : e.lighter ? ' (made lighter)' : ''}`;
  }
  function loadLine(T) {
    const bds = [0, 1, 2, 3, 4, 5, 6].filter(d => isBatchDay(T, d));
    const dayM = d => T.filter(t => t.day === d && !t.bf && !(t.batch && t.kind === 'cook') && t.kind !== 'pre').reduce((a, t) => a + t.mins, 0);
    const others = [0, 1, 2, 3, 4, 5, 6].filter(d => !bds.includes(d)).map(dayM);
    const parts = bds.map(d => `${WD[d]} batch ${mins(batchMinsOf(T, d))}`);
    if (others.length) parts.push(`other days ${Math.min(...others)}–${Math.max(...others)} min`);
    return parts.join(' · ');
  }
  function vWeek() {
    if (!hasPlan()) return `<div class="card ml-empty"><h2 class="ml-h2">Plan this week</h2><p class="ml-muted">Pick how you cook, then generate. Portions follow each day's training. You can swap, move or skip any meal after.</p></div>` + planForm();
    const ks = weekKeys(), today = todayKey(), d = ui.day; const T = tasks(), act = activeSlots();
    const load = {}; T.forEach(t => { if (!t.bf && t.kind === 'cook' && (!t.batch || !isBatchDay(T, t.day))) load[t.day] = (load[t.day] || 0) + t.mins; });
    const board = `<div class="ml-board">${ks.map((k, i) => {
      const heavy = isBatchDay(T, i); const tier = tierOf(i); const m = heavy ? batchMinsOf(T, i) : (load[i] || 0);
      return `<button class="ml-day ${k === today ? 'is-today' : ''}" data-ml="day" data-v="${i}" aria-pressed="${i === d}" aria-label="${WDL[i]} ${parse(k).getDate()}, ${tier} day${heavy ? ', batch day' : m ? ', ' + m + ' min cooking' : ''}">
        <span class="ml-bar ml-t-${tier}"></span><div class="ml-dn">${WD[i]}</div><div class="ml-dd">${parse(k).getDate()}</div><div class="ml-ck">${heavy ? svg('pot') : m ? `<span class="ml-mins">${m}′</span>` : ''}</div></button>`;
    }).join('')}</div>`;
    const offDay = !eatDays(planPrefs()).includes(d);
    const rows = SLOTS.filter(([s]) => slotObj(d, s) || (planPrefs().meals[s] && !(offDay && s !== 'b'))).map(([s, label]) => {
      const o = slotObj(d, s), r = o && R(o.r); const x = act.find(y => y.d === d && y.s === s);
      return `<button class="ml-slot ${o?.skip ? 'is-skip' : ''}" data-ml="slot" data-v="${s}"><span class="ml-sl">${label}</span>
        <span>${r ? `<div class="ml-rn">${esc(r.name)}</div><div class="ml-src">${o.skip ? '<span class="ml-small ml-muted">Eating out</span>' : `<span class="ml-pchip">×${x.m.toFixed(1)}</span>${mealKind(x)}${o.done ? '<span class="ml-pchip ml-pchip--done">Eaten</span>' : ''}`}</div>${x && !r.shake ? `<div class="ml-guide">${guideLines(x)}</div>` : ''}` : '<span class="ml-muted">Add a meal</span>'}</span><span class="ml-muted">›</span></button>`;
    }).join('') + (offDay && !slotObj(d, 'l') && !slotObj(d, 'd') ? `<div class="ml-offday"><span>No lunch or dinner planned on ${WDL[d]}s.</span><span><button class="ml-linkbtn ml-small" data-ml="slot" data-v="l">Add lunch</button> · <button class="ml-linkbtn ml-small" data-ml="slot" data-v="d">Add dinner</button></span></div>` : '');
    const batchHere = isBatchDay(T, d), bm = batchMinsOf(T, d);
    const dayMins = act.filter(x => x.d === d && x.s !== 'b').reduce((a, x) => a + mealParts(x).mins, 0);
    const nComp = T.filter(t => t.day === d && t.batch && t.kind === 'cook' && !t.bf).length;
    const e = effortFor(dateOf(d)), fuel = fuelNote(e.type);
    const midBatch = planPrefs().style === 'hybrid' ? [1, 2, 3, 4, 5].filter(x => isBatchDay(T, x)) : [];
    const nudge = midBatch.length ? `<button class="ml-nudge" data-ml="onebatch"><span><b>Do ${midBatch.map(x => WD[x]).join(' and ')}'s batch on Sunday instead?</b> The later boxes go in the freezer on Sunday, so ${midBatch.length === 1 ? WD[midBatch[0]] : 'those days'} only cook${midBatch.length === 1 ? 's' : ''} the quick fresh parts.</span><span>›</span></button>` : '';
    return `<div class="card ml-howcook"><span class="ml-small">${howCook(planPrefs())}<br><span class="ml-muted">${loadLine(T)}</span></span><button class="ml-linkbtn ml-small" data-ml="planform">Change</button></div>` + nudge + board +
      `<div class="card"><div class="ml-row ml-between ml-dayhead"><h2 class="ml-h2">${WDL[d]} ${parse(dateOf(d)).getDate()}</h2>${batchHere ? `<span class="ml-small ml-muted">batch about ${mins(bm)}</span>` : dayMins ? `<span class="ml-small ml-muted">about ${mins(dayMins)} cooking</span>` : '<span class="ml-small ml-muted">no cooking</span>'}</div>
       <div class="ml-small ml-muted ml-effort">${effortLine(d)}${fuel ? ` — ${esc(fuel)}` : ''}</div>
       ${batchHere ? `<button class="ml-batchbar" data-ml="gotoprep" data-v="${d}">${svg('pot')}<span><b>Batch day.</b> ${nComp} ${nComp === 1 ? 'thing' : 'things'} to cook for the week — see what goes where</span><span>›</span></button>` : ''}
       ${rows}${thawHtml(thawTonight(act, d))}
       ${!batchHere && dayMins ? `<button class="ml-btn ml-btn--ghost ml-block" data-ml="gotoprep" data-v="${d}">${WD[d]}'s recipes</button>` : ''}</div>` + vNutrition(d);
  }
  function vNutrition(d) {
    const t = target(d);
    if (!t) return `<div class="card"><p class="ml-small ml-muted" style="margin:0">Add your weight in Food settings, or a weigh-in in Settings → Training, to get daily targets and portion sizes.</p></div>`;
    const { planned: pl, eaten: ea } = dayTotals(d);
    const max = Math.max(t.kcal, pl.kcal) * 1.08;
    return `<div class="card ml-nut"><div class="ml-row ml-between"><h3 class="ml-h3">Day totals</h3><span class="ml-small ml-muted">${Math.round(ea.kcal)} eaten · ${Math.round(pl.kcal)} planned / ${t.kcal} kcal</span></div>
      <div class="ml-meter" role="img" aria-label="${Math.round(ea.kcal)} of ${t.kcal} kcal eaten, ${Math.round(pl.kcal)} planned"><span class="ml-fill" style="width:${pl.kcal / max * 100}%"></span><span class="ml-eat" style="width:${ea.kcal / max * 100}%"></span><span class="ml-tgt" style="left:${t.kcal / max * 100}%"></span></div>
      <div class="ml-macros"><div><b>${Math.round(pl.p)}g</b><span class="ml-muted">protein / ${t.p}</span></div><div><b>${Math.round(pl.c)}g</b><span class="ml-muted">carbs / ${t.c}</span></div><div><b>${Math.round(pl.f)}g</b><span class="ml-muted">fat / ${t.f}</span></div><div><b>${Math.max(0, Math.round(t.kcal - pl.kcal))}</b><span class="ml-muted">${!eatDays(planPrefs()).includes(d) && !slotObj(d, 'l') && !slotObj(d, 'd') ? 'kcal left for the day' : 'kcal for snacks'}</span></div></div></div>`;
  }
  function planForm() {
    const p = S.prefs;
    return `<div class="card"><label class="ml-f" style="margin-top:0">How do you want to cook this week?</label>
      <div class="ml-seg">${Object.entries(STYLES).map(([k, v]) => `<button data-ml="style" data-v="${k}" aria-pressed="${p.style === k}">${v.l}<small>${v.s}</small></button>`).join('')}</div>
      ${p.style === 'hybrid' ? `<label class="ml-f">Batch days</label><div class="ml-week7">${WD.map((w, i) => `<button data-ml="cookday" data-v="${i}" aria-pressed="${p.cookDays.includes(i)}">${w}</button>`).join('')}</div><div class="ml-small ml-muted" style="margin-top:6px">Sunday alone covers the week: whatever is eaten after Wednesday goes in the freezer. A second day only helps if you'd rather not freeze.</div>` : ''}
      <label class="ml-f">Days with lunch and dinner</label><div class="ml-week7">${WD.map((w, i) => `<button data-ml="eatday" data-v="${i}" aria-pressed="${eatDays(p).includes(i)}">${w}</button>`).join('')}</div>
      <div class="ml-small ml-muted" style="margin-top:6px">Days left off get no lunch or dinner, and the batch doesn't cook for them. Breakfast follows the setting below.</div>
      <label class="ml-f">Meals to plan</label><div class="ml-chips">${SLOTS.map(([s, l]) => `<button class="ml-chip" data-ml="mealon" data-v="${s}" aria-pressed="${!!p.meals[s]}">${l}</button>`).join('')}</div>
      ${p.meals.b ? `<label class="ml-f">Breakfast</label><div class="ml-seg">${[['shake', 'Shake', 'every morning'], ['cooked', 'Cooked', 'every morning'], ['mix', 'Mix', 'shake on training days']].map(([k, l, s]) => `<button data-ml="bfst" data-v="${k}" aria-pressed="${p.breakfast === k}">${l}<small>${s}</small></button>`).join('')}</div>` : ''}
      <div class="ml-note">${p.style === 'sunday' ? 'Every component is cooked on Sunday. Anything eaten after its fridge life goes in the freezer; the rest is marked to cook fresh.' : p.style === 'hybrid' ? 'Grains, roasts, stews and the meat or tofu that reheats well are cooked on the batch day, so weekday lunches are boxes. Fish, eggs, pasta and greens are cooked on the day, usually 5–20 min. Veg for those is chopped on the batch day.' : 'Cook each evening; the extra portion is tomorrow\'s lunch.'}</div>
      <button class="ml-btn ml-block" style="margin-top:12px" data-ml="generate">${hasPlan() ? 'Regenerate the week' : 'Generate the week'}</button>
      ${hasPlan() ? '<div class="ml-small ml-muted" style="margin-top:6px">Meals already marked eaten are kept.</div>' : ''}</div>`;
  }
  const useLabel = u => WD[u.d] + ' ' + SL(u.s).toLowerCase();
  const useChip = (u, c) => { const w = c && u.q ? cookedLabel(c, u.q) : ''; return `<span class="ml-use ${u.frz ? 'is-frz' : ''}" title="${esc(useLabel(u))}${u.frz ? ', frozen' : ''}">${WD[u.d]} ${SL1[u.s]}${w ? ` <i>${w}</i>` : u.q ? ` <i>×${u.q.toFixed(1)}</i>` : ''}</span>`; };
  function ingList(t) { return t.c.ing.map(([id, q]) => `<div class="ml-ing"><span>${esc(ING[id]?.name || id)}</span><span>${fmtQ(id, q * t.q)}</span></div>`).join(''); }
  // Components × days: which meal each batch box feeds.
  function whereGrid(rows, from) {
    const days = []; for (let d = from; d < 7; d++) days.push(d);
    const used = new Set(rows.flatMap(t => t.uses.map(u => u.d)));
    const cols = days.filter(d => used.has(d));
    return `<div class="ml-where" style="--cols:${cols.length}" role="table" aria-label="Which meals each batch item goes to">
      <div class="ml-wr ml-wh" role="row"><span role="columnheader"></span>${cols.map(d => `<span role="columnheader">${WD[d]}</span>`).join('')}</div>
      ${rows.map(t => `<div class="ml-wr ${t.kind === 'pre' ? 'is-pre' : ''}" role="row"><span class="ml-wn" role="rowheader">${esc(t.c.name)}${t.kind === 'pre' ? ' <i>prep</i>' : ''}</span>${cols.map(d => {
        const us = t.uses.filter(u => u.d === d).sort((a, b) => 'bld'.indexOf(a.s) - 'bld'.indexOf(b.s)); const frz = us.some(u => u.frz);
        return `<span role="cell" class="${us.length ? 'is-on' : ''} ${frz ? 'is-frz' : ''}" ${us.length ? `title="${esc(us.map(useLabel).join(', '))}${frz ? ', freezer' : ''}"` : ''}>${us.map(u => SL1[u.s]).join('')}</span>`;
      }).join('')}</div>`).join('')}</div>
      <div class="ml-legend"><span><i class="ml-sw"></i>fridge</span><span><i class="ml-sw is-frz"></i>freezer</span><span>B breakfast · L lunch · D dinner</span></div>`;
  }
  // "13 boxes: 9 fridge, 4 freezer" — one box per later meal fed by this batch.
  function boxesLine(act, c) {
    const bx = act.filter(x => x.s !== 'b' && x.d > c && x.pl.some(p => p.batch && p.day === c));
    if (!bx.length) return '';
    const fz = bx.filter(x => x.pl.some(p => p.batch && p.day === c && p.frz)).length, fr = bx.length - fz;
    const lastFr = Math.max(-1, ...bx.filter(x => !x.pl.some(p => p.batch && p.day === c && p.frz)).map(x => x.d));
    return `<div class="ml-boxsum"><b>${bx.length} boxes</b><span class="ml-cnt">${fr} fridge</span>${fz ? `<span class="ml-cnt is-frz">${fz} freezer</span>` : ''}<span class="ml-small ml-muted">${lastFr >= 0 ? 'fridge boxes up to ' + WD[lastFr] : ''}${fz ? (lastFr >= 0 ? ', ' : '') + 'freezer after' : ''}</span></div>`;
  }
  // The boxes to fill after the batch: one per later meal that draws on it.
  function packList(act, c) {
    const boxes = act.filter(x => x.s !== 'b' && x.d > c && x.pl.some(p => p.batch && p.day === c));
    if (!boxes.length) return '';
    return boxes.map(x => {
      const mine = x.pl.filter(p => p.batch && p.day === c), rest = x.pl.filter(p => !(p.batch && p.day === c)); const frz = mine.some(p => p.frz);
      const later = rest.filter(p => !p.batch);
      return `<div class="ml-box ${frz ? 'is-frz' : ''}"><div class="ml-row ml-between"><span class="ml-boxl">${WD[x.d]} ${SL(x.s).toLowerCase()}</span><span class="ml-pchip ${frz ? 'ml-pchip--frz' : ''}">${frz ? 'Freezer' : 'Fridge'}</span></div>
        <div class="ml-boxr">${esc(x.r.name)}</div>
        <div class="ml-small ml-muted">${mine.map(p => `${cname(p.c)} <b>${cookedLabel(p.c, p.q) || '×' + p.q.toFixed(1)}</b>`).join(', ')}${later.length ? ` · on the day: ${namesOf(later)}` : ''}</div></div>`;
    }).join('');
  }
  function emptyPlan() { return `<div class="card ml-empty"><h2 class="ml-h2">No plan for this week</h2><p class="ml-muted">Prep and shopping are built from the week's plan.</p><button class="ml-btn" data-ml="goweek">Plan the week</button></div>`; }
  function vPrep() {
    if (!hasPlan()) return emptyPlan(); const T = tasks().filter(t => !t.bf), act = activeSlots();
    const days = [...new Set(T.map(t => t.day).concat(act.filter(x => x.s !== 'b').map(x => x.d)))].sort((a, b) => a - b);
    const cards = days.map(d => {
      const b = T.filter(t => t.day === d && t.batch && t.kind === 'cook').sort((x, y) => y.c.mins - x.c.mins);
      const pre = T.filter(t => t.day === d && t.kind === 'pre');
      const f = T.filter(t => t.day === d && !t.batch && t.kind === 'cook').sort((x, y) => x.c.prep === y.c.prep ? 0 : x.c.prep === 'fresh' ? -1 : 1);
      const bday = isBatchDay(T, d), fm = (bday ? f : b.concat(f)).reduce((a, t) => a + t.mins, 0);
      const meals = act.filter(x => x.d === d && x.s !== 'b' && !x.r.shake);
      const thaw = thawHtml(thawTonight(act, d));
      if (!bday && !f.length && !b.length && !thaw) {
        return `<div class="card ml-session ml-session--quiet" id="ml-prep-${d}"><div class="ml-row ml-between"><h2 class="ml-h3">${WDL[d]} ${parse(dateOf(d)).getDate()}</h2><span class="ml-small ml-muted">no cooking</span></div>
          ${meals.map(x => `<div class="ml-gmeal"><span class="ml-boxl">${SL(x.s)}</span><span>${esc(x.r.name)}</span></div>`).join('')}</div>`;
      }
      if (bday) {
        return `<div class="card ml-session" id="ml-prep-${d}"><div class="ml-row ml-between"><h2 class="ml-h2">${WDL[d]} ${parse(dateOf(d)).getDate()} · batch</h2><span class="ml-small ml-muted">about ${mins(batchMinsOf(T, d))}${fm ? ` + ${fm} min for today's meals` : ''}</span></div>
          <div class="ml-subh">What goes where</div>${whereGrid(b.concat(pre), d)}
          ${boxesLine(act, d)}
          ${stations(b.concat(pre))}
          ${packList(act, d) ? `<details class="ml-packd"><summary class="ml-subh">Pack the boxes <span class="ml-muted ml-small">(label them with the day)</span></summary><div class="ml-boxes">${packList(act, d)}</div></details>` : ''}
          ${f.length ? `<div class="ml-subh">For today's meals</div>${f.map(crow).join('')}` : ''}${thaw}</div>`;
      }
      return `<div class="card ml-session" id="ml-prep-${d}"><div class="ml-row ml-between"><h2 class="ml-h2">${WDL[d]} ${parse(dateOf(d)).getDate()}</h2><span class="ml-small ml-muted">${fm ? `about ${mins(fm)}` : 'no cooking'}</span></div>
        ${meals.map(x => `<div class="ml-gmeal"><span class="ml-boxl">${SL(x.s)}</span><span><span class="ml-rn">${esc(x.r.name)}</span><div class="ml-guide">${guideLines(x)}</div></span></div>`).join('')}
        ${b.concat(f).length ? `<div class="ml-subh">Cook</div>${b.concat(f).map(crow).join('')}` : ''}${thaw}</div>`;
    }).join('');
    const bf = act.filter(x => x.s === 'b'); const byR = {};
    bf.forEach(x => { (byR[x.r.id] = byR[x.r.id] || { r: x.r, xs: [], m: 0 }).xs.push(x); byR[x.r.id].m += x.m; });
    return cards + (bf.length ? `<div class="card ml-session"><h2 class="ml-h2">Breakfasts</h2>${Object.values(byR).map(it => {
      const c = CP(it.r.parts[0][0]); if (!c) return '';
      const ahead = it.xs.flatMap(x => x.pl).filter(p => p.batch), made = [...new Set(ahead.map(p => WD[p.day]))];
      return `<div class="ml-cook"><div class="ml-row ml-between"><h3 class="ml-h3">${esc(it.r.name)}</h3><span class="ml-pchip">${it.xs.map(x => WD[x.d]).join(' ')}</span></div>
        <p class="ml-small ml-muted" style="margin:4px 0 6px">${made.length ? 'Made ahead on ' + made.join(' and ') + ', keeps ' + c.keeps + ' days' + (ahead.length < it.xs.length ? '; the rest fresh that morning' : '') + '.' : 'Fresh each morning, ' + c.mins + ' min.'} Totals for the week:</p>
        ${mealIng(it.r).map(([id, q]) => `<div class="ml-ing"><span>${esc(ING[id]?.name || id)}</span><span>${fmtQ(id, q * it.m)}</span></div>`).join('')}</div>`;
    }).join('')}</div>` : '');
  }
  // ── the cook list, by station ───────────────────────────
  const METH = [['oven', 'Oven', 'Start these first; the trays go in together'], ['pot', 'Pots on the hob', 'Simmer while the oven works'],
    ['boil', 'Boil and steam', ''], ['pan', 'Pan', ''], ['cold', 'No heat', 'Chop, mix and pack']];
  function methodOf(c) {
    if (c.method) return c.method;
    const v = (c.verb || '').toLowerCase();
    return /roast|bake/.test(v) ? 'oven' : /simmer/.test(v) ? 'pot' : /boil|steam|poach/.test(v) ? 'boil' : /mix|toss|blend|open/.test(v) || c.prep === 'assemble' ? 'cold' : 'pan';
  }
  const sortUses = us => us.slice().sort((a, b) => a.d - b.d || 'bld'.indexOf(a.s) - 'bld'.indexOf(b.s));
  // One line per thing to cook; tap it for the split, the ingredients and the how.
  function crow(t) {
    const uses = sortUses(t.uses);
    if (t.kind === 'pre') {
      return `<details class="ml-crow ml-crow--pre"><summary><span class="ml-cn">Chop for ${esc(t.c.name.toLowerCase())}</span><span class="ml-cm">${t.mins} min</span>
        <span class="ml-cx">${uses.map(u => useChip({ ...u, q: 0 })).join('')}</span></summary>
        <div class="ml-cbody"><p class="ml-small">${esc(t.c.pre.t)} Saves ${t.c.pre.save} min on the day.</p></div></details>`;
    }
    const today = uses.filter(u => u.d === t.day && !u.frz).length, fr = uses.filter(u => u.d !== t.day && !u.frz).length, fz = uses.filter(u => u.frz).length;
    const cw = cookedLabel(t.c, t.q);
    const chips = t.batch
      ? [today ? `<span class="ml-cnt">${today} today</span>` : '', fr ? `<span class="ml-cnt">${fr} fridge</span>` : '', fz ? `<span class="ml-cnt is-frz">${fz} freezer</span>` : ''].join('')
      : uses.map(u => useChip(u)).join('');
    return `<details class="ml-crow"><summary><span class="ml-cn">${esc(t.c.name)}</span><span class="ml-cm">${t.mins} min</span>
        <span class="ml-cx">${chips}${cw && t.batch ? `<span class="ml-cw">${cw} cooked</span>` : ''}</span></summary>
      <div class="ml-cbody">
        ${t.batch ? `<div class="ml-small ml-muted">${cw ? 'Split by weight:' : `${t.q.toFixed(1)} portions:`}</div><div class="ml-store">${uses.map(u => useChip(u, t.c)).join('')}</div>` : ''}
        ${ingList(t)}<p class="ml-small ml-how">${esc(t.c.steps)}</p></div></details>`;
  }
  function stations(list) {
    return METH.map(([k, label, hint]) => {
      const xs = list.filter(t => (t.kind === 'pre' ? 'cold' : methodOf(t.c)) === k).sort((a, b) => (a.kind === 'pre') - (b.kind === 'pre') || b.mins - a.mins);
      if (!xs.length) return '';
      const temps = [...new Set(xs.map(t => t.c.temp).filter(Boolean))].sort((a, b) => a - b);
      const tt = temps.length ? ` · ${temps[0]}${temps.length > 1 ? '–' + temps[temps.length - 1] : ''} °C` : '';
      return `<div class="ml-station"><div class="ml-sth"><span class="ml-stn ml-st-${k}">${label}${tt}</span>${hint ? `<span class="ml-small ml-muted">${hint}</span>` : ''}</div>${xs.map(crow).join('')}</div>`;
    }).join('');
  }
  const qty = (id, q) => fmtQ(id, q);
  const packTxt = x => { const i = x.i; return x.packs ? `${x.packs} × ${i.pc ? i.pack + ' pcs' : fmtQ(x.id, i.pack)}` : fmtQ(x.id, x.buy); };
  const WHERE_L = { freezer: 'freezer', fridge: 'fridge', cupboard: 'cupboard' };
  function spareTxt(x) {
    if (x.spareBuy <= (x.i.pc ? .5 : Math.max(15, x.i.pack * 0.05))) return '';
    const q = qty(x.id, x.spareBuy);
    if (x.keep === 'fresh') return `<span class="ml-spare is-waste">${q} spare, use it up</span>`;
    return `<span class="ml-spare">${q} left for next week (${WHERE_L[x.where]}${x.keep === 'freeze' ? ', freeze it' : ''})</span>`;
  }
  function vShop() {
    if (!hasPlan()) return emptyPlan();
    const w = wk(), all = ledger(), list = all.filter(x => x.q > 0), ck = w.shop.checked;
    const freshL = list.filter(x => !x.i.staple), staples = list.filter(x => x.i.staple);
    const toBuy = freshL.filter(x => x.buy > 0), covered = freshL.filter(x => x.buy <= 0);
    const total = toBuy.reduce((a, x) => a + x.cost, 0), wkBudget = S.budget * 12 / 52, left = toBuy.filter(x => !ck[x.id]).length;
    const kept = freshL.filter(x => x.keep !== 'fresh').reduce((a, x) => a + x.spareBuy * unitCost(x.i), 0);
    const lost = freshL.filter(x => x.keep === 'fresh').reduce((a, x) => a + x.spareBuy * unitCost(x.i), 0);
    const stockRows = all.filter(x => x.st);
    const row = x => `<label class="ml-item ${ck[x.id] ? 'is-checked' : ''}"><input type="checkbox" data-ml-change="check" data-v="${x.id}" ${ck[x.id] ? 'checked' : ''}>
      <span><span class="ml-nm">${esc(x.i.name)}</span> <span class="ml-buy">${packTxt(x)}</span><br><span class="ml-q">${x.packs || x.have ? `needs ${qty(x.id, x.need)}${x.have ? `, ${qty(x.id, x.have)} from your ${WHERE_L[x.st.where]}` : ''} · ` : ''}first needed ${WD[x.by[0]]}</span>${spareTxt(x)}</span><span class="ml-c">${eur(x.cost)}</span></label>`;
    const stockRow = x => `<div class="ml-item ml-item--stock"><span class="ml-dotw ml-w-${x.st.where}"></span>
      <span><span class="ml-nm">${esc(x.i.name)}</span> <span class="ml-buy">${qty(x.id, x.st.q)}</span><br><span class="ml-q">${x.have ? `this week uses ${qty(x.id, x.have)}${x.spareOld > 1 ? `, ${qty(x.id, x.spareOld)} stays` : ''}` : 'not needed this week, stays'} · ${WHERE_L[x.st.where]}</span></span>
      <button class="ml-iconbtn ml-iconbtn--sm" data-ml="nostock" data-v="${x.id}" aria-label="I don't have this any more">×</button></div>`;
    const off = Object.keys(w.shop.nostock || {});
    return `<div class="card"><div class="ml-row ml-between"><div class="ml-budget"><span class="ml-big">${eur(total)}</span><span class="ml-muted">this week</span></div><span class="ml-small ml-muted">${left} to buy</span></div>
      <div class="ml-track ${total > wkBudget ? 'is-over' : ''}"><span style="width:${wkBudget ? Math.min(100, total / wkBudget * 100) : 100}%"></span></div>
      <div class="ml-small ml-muted">${eur(wkBudget)} weekly share of your ${eur(S.budget)} monthly budget, ${total > wkBudget ? eur(total - wkBudget) + ' over' : eur(wkBudget - total) + ' spare'}.
        Whole packs${kept >= .5 ? `; ${eur(kept)} of it stays in stock for next week` : ''}${lost >= .3 ? `; about ${eur(lost)} of fresh food would be left over` : ''}.</div></div>
      ${stockRows.length || off.length ? `<div class="card ml-aisle"><h3 class="ml-h3">Already at home</h3><p class="ml-small ml-muted" style="margin:2px 0 4px">Left from last week's packs, used first. Tap × if it's gone.</p>${stockRows.map(stockRow).join('')}
        ${off.length ? `<button class="ml-linkbtn ml-small" style="margin-top:6px" data-ml="stockreset">Count ${off.length} removed ${off.length === 1 ? 'item' : 'items'} again</button>` : ''}</div>` : ''}
      ${AISLES.map(a => [a, toBuy.filter(x => x.i.aisle === a).sort((x, y) => x.by[0] - y.by[0] || x.i.name.localeCompare(y.i.name))]).filter(x => x[1].length).map(([a, xs]) => `<div class="card ml-aisle"><h3 class="ml-h3">${a}</h3>${xs.map(row).join('')}</div>`).join('')}
      ${covered.length ? `<p class="ml-small ml-muted">Nothing to buy for ${covered.map(x => esc(x.i.name.toLowerCase())).join(', ')}: it's at home.</p>` : ''}
      <div class="card ml-aisle"><h3 class="ml-h3">Your own items</h3>${w.shop.extras.map(e => `<label class="ml-item ${e.done ? 'is-checked' : ''}"><input type="checkbox" data-ml-change="xcheck" data-v="${e.id}" ${e.done ? 'checked' : ''}><span class="ml-nm">${esc(e.text)}</span><button class="ml-iconbtn ml-iconbtn--sm" data-ml="xdel" data-v="${e.id}" aria-label="Remove">×</button></label>`).join('')}
        <div class="ml-row" style="margin-top:8px"><input class="ml-in" id="ml-xnew" placeholder="Add something else, e.g. coffee"><button class="ml-btn" data-ml="xadd">Add</button></div></div>
      <div class="card ml-aisle"><button class="ml-row ml-between ml-plain" data-ml="pantry"><h3 class="ml-h3">Pantry check</h3><span class="ml-muted">${w.shop.pantry ? 'Hide' : 'Show'} ${staples.length}</span></button>${w.shop.pantry ? staples.map(row).join('') : ''}</div>
      <p class="ml-small ml-muted">Prices are rough supermarket estimates for the usual pack size. "First needed" lets you buy fish and fresh greens midweek.</p>`;
  }
  function vLib() {
    const q = ui.lib.toLowerCase();
    const list = recipes().filter(r => (ui.libType === 'all' || r.type === ui.libType) && (!q || r.name.toLowerCase().includes(q) || mealIng(r).some(([id]) => ING[id]?.name.toLowerCase().includes(q)))).filter(r => !ui.fitOnly || fits(r) === true);
    return `<input class="ml-in ml-search" id="ml-libq" placeholder="Search recipes or ingredients" value="${esc(ui.lib)}" aria-label="Search recipes">
      <div class="ml-row ml-between ml-libbar"><div class="ml-chips">${[['all', 'All'], ['breakfast', 'Breakfast'], ['main', 'Lunch & dinner']].map(([k, l]) => `<button class="ml-chip" data-ml="libtype" data-v="${k}" aria-pressed="${ui.libType === k}">${l}</button>`).join('')}</div>
      <button class="ml-chip" data-ml="fitonly" aria-pressed="${ui.fitOnly}">Fits my diet</button></div>
      <div class="ml-rlist">${list.map(r => {
        const n = nutr(r), fit = fits(r) === true; const bp = r.parts.map(([c]) => CP(c)).filter(Boolean);
        return `<button class="ml-rcard ${fit ? '' : 'is-nofit'}" data-ml="recipe" data-v="${r.id}"><h3 class="ml-h3">${esc(r.name)}</h3>
          <div class="ml-kv"><span><b>${Math.round(n.kcal)}</b> kcal</span><span><b>${Math.round(n.p)}g</b> protein</span><span><b>${eur(n.cost)}</b> a portion</span></div>
          <div class="ml-chips">${bp.map(c => `<span class="ml-tag ml-tag--${c.prep}">${esc(c.name)}</span>`).join('')}${!fit ? '<span class="ml-tag ml-tag--warn">Not for your diet</span>' : ''}</div></button>`;
      }).join('') || '<p class="ml-muted">No recipes match. Clear the search or turn off "Fits my diet".</p>'}</div>
      <p class="ml-small ml-muted" style="margin-top:10px"><span class="ml-tag ml-tag--batch">Batch</span> made ahead &nbsp;<span class="ml-tag ml-tag--fresh">Fresh</span> cooked on the day in hybrid mode</p>
      <button class="ml-btn ml-block" style="margin-top:10px" data-ml="newrecipe">New recipe</button>`;
  }
  function vMe() {
    const p = S.prof, w = weight(), bf = bodyfat();
    const f = (k, l, type = 'number', ph = '') => `<div><label class="ml-f" for="ml-f-${k}">${l}</label><input class="ml-in" id="ml-f-${k}" type="${type}" ${type === 'number' ? 'inputmode="decimal"' : ''} data-ml-field="${k}" value="${esc(p[k])}" placeholder="${esc(ph)}"></div>`;
    const tr = targetFor('rest'), th = targetFor('hard');
    const wph = (!num(p.weight) && w) ? String(w.v) : 'e.g. 74';
    const ks = weekKeys();
    return `<div class="card"><h3 class="ml-h3">Diet</h3>
      <div class="ml-seg" style="margin-top:10px">${[['veg', 'Vegetarian'], ['nonveg', 'Non-vegetarian'], ['both', 'Both']].map(([k, l]) => `<button data-ml="set" data-k="diet" data-v="${k}" aria-pressed="${p.diet === k}">${l}</button>`).join('')}</div>
      <label class="ml-f">Dietary constraints</label><div class="ml-chips">${CONS.map(([k, l]) => `<button class="ml-chip" data-ml="con" data-v="${k}" aria-pressed="${p.cons.includes(k)}">${l}</button>`).join('')}</div>
      ${f('avoid', 'Other foods to avoid', 'text', 'comma separated, e.g. mushrooms, coconut')}</div>
     <div class="card"><h3 class="ml-h3">Body and goal</h3>
      <div class="ml-grid2"><div><label class="ml-f">Sex</label><div class="ml-seg">${[['m', 'Male'], ['f', 'Female']].map(([k, l]) => `<button data-ml="set" data-k="sex" data-v="${k}" aria-pressed="${p.sex === k}">${l}</button>`).join('')}</div></div>${f('weight', 'Weight (kg)', 'number', wph)}</div>
      <div class="ml-small ml-muted" style="margin-top:4px">${num(p.weight) ? 'Using the weight typed here. Clear it to follow your weigh-ins.' : w ? `Using ${w.v} kg from ${w.src === 'setting' ? 'Settings' : 'your latest weigh-in'}${w.date ? ' (' + fmtD(w.date) + ')' : ''}.` : 'No weigh-in yet.'}</div>
      <div class="ml-grid2">${f('bf', 'Body fat %', 'number', bf && !num(p.bf) ? String(bf) : 'optional')}${f('age', 'Age')}</div>
      <div class="ml-grid2">${f('height', 'Height (cm)')}<div></div></div>
      <label class="ml-f">Goal</label><div class="ml-seg">${Object.entries(GOAL).map(([k, g]) => `<button data-ml="set" data-k="goal" data-v="${k}" aria-pressed="${p.goal === k}">${g.l}</button>`).join('')}</div>
      <div class="ml-note">${tr ? `About <b>${tr.kcal}</b> kcal on a rest day and <b>${th.kcal}</b> on a hard day, with ${tr.p} g protein. ${bf ? 'Based on lean mass.' : 'Add body fat % (or age and height) for a better estimate.'}` : 'Add your weight to get targets and portion sizes.'}</div></div>
     <div class="card"><h3 class="ml-h3">Training days</h3><p class="ml-small ml-muted" style="margin:4px 0 10px">Read from your training plan for the week shown on This week. Tap a day to override it; tap through to "plan" to go back.</p>
      <div class="ml-week7 ml-week7--tall">${ks.map((k, i) => { const e = effortFor(k); return `<button data-ml="dtype" data-v="${k}" aria-label="${WDL[i]}: ${esc(e.label)}, ${e.tier}${e.src === 'you' ? ' (set by you)' : ''}" title="${esc(e.label)}" ${e.src === 'you' ? 'aria-pressed="true"' : ''}><span>${WD[i]}</span><span class="ml-dot ml-t-${e.tier}"></span><span class="ml-dtier">${e.tier}</span></button>`; }).join('')}</div>
      <div class="ml-legend"><span><i class="ml-dot ml-t-rest"></i>rest</span><span><i class="ml-dot ml-t-easy"></i>easy</span><span><i class="ml-dot ml-t-moderate"></i>moderate</span><span><i class="ml-dot ml-t-hard"></i>hard</span></div></div>
     <div class="card"><h3 class="ml-h3">Budget</h3><label class="ml-f" for="ml-budget">Monthly food budget (€)</label><input class="ml-in" id="ml-budget" type="number" inputmode="decimal" data-ml-field="budget" value="${S.budget}"></div>`;
  }

  // ── sheets ───────────────────────────────────────────────
  function openSheet(h) {
    const back = $('ml-sheet-back'), el = $('ml-sheet'); if (!back || !el) return;
    el.innerHTML = `<div class="ml-sheet-in"><button class="ml-iconbtn ml-sheet-x" data-ml="close" aria-label="Close">×</button>${h}</div>`;
    back.style.display = 'flex'; sheetOpen = true;
  }
  function closeSheet() { const back = $('ml-sheet-back'); if (back) back.style.display = 'none'; sheetOpen = false; draft = null; cdraft = null; }
  function slotSheet(s) {
    const d = ui.day, o = slotObj(d, s), r = o && R(o.r), label = SLOTS.find(x => x[0] === s)[1];
    const opts = recipes().filter(x => (s === 'b' ? x.type === 'breakfast' : x.type === 'main') && fits(x) === true);
    const x = r && !o.skip ? activeSlots().find(y => y.d === d && y.s === s) : null;
    openSheet(`<h2 class="ml-h2">${WDL[d]} ${label.toLowerCase()}</h2>${r ? `<p class="ml-muted" style="margin:0 0 8px">${esc(r.name)}${o.skip ? ' (skipped)' : ''}</p>
      ${x ? `<div>${x.pl.map(p => `<div class="ml-ing"><span>${esc(p.c.name)}</span><span>${p.batch ? (p.day === d ? 'in today\'s batch' : 'ready, from ' + WD[p.day] + (p.frz ? ' (freezer: thaw the night before)' : '')) : p.c.prep === 'assemble' ? 'put together, ' + onDayMins(p) + ' min' : (p.note ? 'cook today (' + p.note + ')' : 'cook today, ' + onDayMins(p) + ' min')}</span></div>`).join('')}</div>` : ''}
      <div class="ml-chips" style="margin-top:10px">${o.skip ? `<button class="ml-chip" data-ml="skip" data-v="${s}">Put back in the plan</button>` : `<button class="ml-chip" data-ml="done" data-v="${s}" aria-pressed="${!!o.done}">Eaten</button><button class="ml-chip" data-ml="skip" data-v="${s}">Eating out</button>`}
       ${plannedStyle() === 'hybrid' ? `<button class="ml-chip" data-ml="freshall" data-v="${s}" aria-pressed="${!!o.fresh}">Cook it all fresh</button>` : ''}
       <button class="ml-chip" data-ml="recipe" data-v="${r.id}">View recipe</button><button class="ml-chip" data-ml="clearslot" data-v="${s}">Clear</button></div>
      <label class="ml-f">Move to another day (swaps with that day's ${label.toLowerCase()})</label>
      <div class="ml-week7">${WD.map((w, i) => `<button data-ml="move" data-v="${i}" data-s="${s}" ${i === d ? 'aria-pressed="true" disabled' : ''}>${w}</button>`).join('')}</div>` : ''}
      <label class="ml-f" style="margin-top:16px">${r ? 'Swap for' : 'Choose a meal'}</label>
      <div>${opts.map(x => { const n = nutr(x); return `<button class="ml-pick" data-ml="setslot" data-v="${x.id}" data-s="${s}"><span><span class="ml-rn">${esc(x.name)}</span><br><span class="ml-small ml-muted">${Math.round(n.kcal)} kcal, ${Math.round(n.p)} g protein, ${eur(n.cost)}</span></span><span>${x.id === o?.r ? '✓' : ''}</span></button>`; }).join('')}</div>`);
  }
  function recipeSheet(id) {
    const r = R(id); if (!r) return; const n = nutr(r), why = fits(r);
    openSheet(`<h2 class="ml-h2">${esc(r.name)}</h2><div class="ml-chips" style="margin:6px 0 10px"><span class="ml-tag">${dietLabel(r)}</span>${allergensOf(r).map(a => `<span class="ml-tag">${esc(a)}</span>`).join('')}</div>
      ${why !== true ? `<div class="ml-note" style="margin:0 0 10px">Not for your diet: ${esc(why)}</div>` : ''}
      <div class="ml-macros" style="margin-bottom:12px"><div><b>${Math.round(n.kcal)}</b><span class="ml-muted">kcal</span></div><div><b>${Math.round(n.p)}g</b><span class="ml-muted">protein</span></div><div><b>${Math.round(n.c)}g</b><span class="ml-muted">carbs</span></div><div><b>${Math.round(n.f)}g</b><span class="ml-muted">fat</span></div></div>
      <p class="ml-small ml-muted" style="margin:0 0 4px">One standard portion, ${eur(n.cost)}. ${r.fixed ? 'Always one portion.' : 'Your planned portions scale this to the day.'}</p>
      ${r.parts.map(([cid, cm]) => { const c = CP(cid); if (!c) return ''; return `<div class="ml-cook"><div class="ml-row ml-between"><h3 class="ml-h3">${esc(c.name)}</h3><span class="ml-tag ml-tag--${c.prep}">${PREPL[c.prep]}${c.prep === 'batch' ? ', keeps ' + c.keeps + 'd' : c.prep === 'fresh' ? ', ' + c.mins + ' min' : ''}</span></div>
        ${c.ing.map(([i, q]) => `<div class="ml-ing"><span>${esc(ING[i]?.name || i)}</span><span>${fmtQ(i, q * cm)}</span></div>`).join('')}<p class="ml-small" style="margin:6px 0 0">${esc(c.steps)}</p></div>`; }).join('')}
      ${(r.finish || []).length ? `<div class="ml-cook"><h3 class="ml-h3">To finish</h3>${r.finish.map(([i, q]) => `<div class="ml-ing"><span>${esc(ING[i]?.name || i)}</span><span>${fmtQ(i, q)}</span></div>`).join('')}</div>` : ''}
      ${r.custom ? `<div class="ml-row" style="margin-top:14px;gap:8px"><button class="ml-btn ml-btn--ghost" data-ml="editrecipe" data-v="${r.id}">Edit</button><button class="ml-btn ml-btn--ghost" data-ml="delrecipe" data-v="${r.id}">Delete</button></div>` : ''}`);
  }
  const ingOpts = () => Object.values(ING).sort((a, b) => a.name.localeCompare(b.name)).map(i => `<option value="${i.id}">${esc(i.name)}${i.pc ? ' (pcs)' : ' (g)'}</option>`).join('');
  function sel(opts, id) { return opts.replace(`value="${id}"`, `value="${id}" selected`); }
  function editorSheet() {
    const copts = comps().filter(c => draft.type === 'breakfast' ? true : !BF_COMPS.includes(c.id)).map(c => `<option value="${esc(c.id)}">${esc(c.name)} (${PREPL[c.prep].toLowerCase()})</option>`).join(''); const n = nutr(draft); const io = ingOpts();
    openSheet(`<h2 class="ml-h2">${draft.id ? 'Edit recipe' : 'New recipe'}</h2>
      <label class="ml-f" for="ml-rname">Name</label><input class="ml-in" id="ml-rname" data-ml-draft="name" value="${esc(draft.name)}">
      <label class="ml-f">Meal</label><div class="ml-seg">${[['breakfast', 'Breakfast'], ['main', 'Lunch or dinner']].map(([k, l]) => `<button data-ml="dset" data-k="type" data-v="${k}" aria-pressed="${draft.type === k}">${l}</button>`).join('')}</div>
      <label class="ml-f">Components (portions of each)</label>
      ${draft.parts.map(([id, q], k) => `<div class="ml-row ml-edrow"><select class="ml-in" data-ml-pi="${k}" data-part="id" aria-label="Component">${sel(copts, id)}</select>
        <input class="ml-in ml-qty" type="number" step="0.1" inputmode="decimal" data-ml-pi="${k}" data-part="q" value="${q}" aria-label="Portions"><button class="ml-iconbtn" data-ml="prm" data-v="${k}" aria-label="Remove">×</button></div>`).join('')}
      <div class="ml-row" style="gap:8px"><button class="ml-btn ml-btn--ghost" data-ml="padd">Add component</button><button class="ml-btn ml-btn--ghost" data-ml="newcomp">New component</button></div>
      <label class="ml-f">To finish (no cooking)</label>
      ${draft.finish.map(([id, q], k) => `<div class="ml-row ml-edrow"><select class="ml-in" data-ml-fi="${k}" data-part="id" aria-label="Ingredient">${sel(io, id)}</select>
        <input class="ml-in ml-qty" type="number" inputmode="decimal" data-ml-fi="${k}" data-part="q" value="${q}" aria-label="Amount"><button class="ml-iconbtn" data-ml="frm" data-v="${k}" aria-label="Remove">×</button></div>`).join('')}
      <button class="ml-btn ml-btn--ghost" data-ml="fadd">Add finishing ingredient</button>
      <div class="ml-note">${Math.round(n.kcal)} kcal, ${Math.round(n.p)} g protein, ${eur(n.cost)} per portion</div>
      <button class="ml-btn ml-block" style="margin-top:14px" data-ml="dsave">Save recipe</button>`);
  }
  function compSheet() {
    const io = ingOpts();
    openSheet(`<h2 class="ml-h2">New component</h2><p class="ml-small ml-muted" style="margin:0 0 6px">A part of a meal you cook as one thing, like a grain, a roast tray or a grilled protein.</p>
      <label class="ml-f" for="ml-cname">Name</label><input class="ml-in" id="ml-cname" data-ml-cdraft="name" value="${esc(cdraft.name)}">
      <label class="ml-f">When it's made in hybrid mode</label><div class="ml-seg">${Object.entries(PREPL).map(([k, l]) => `<button data-ml="cset" data-k="prep" data-v="${k}" aria-pressed="${cdraft.prep === k}">${l}</button>`).join('')}</div>
      <div class="ml-grid2"><div><label class="ml-f" for="ml-ckeeps">Keeps in fridge (days)</label><input class="ml-in" id="ml-ckeeps" type="number" data-ml-cdraft="keeps" value="${cdraft.keeps}"></div><div><label class="ml-f" for="ml-cmins">Active time (min)</label><input class="ml-in" id="ml-cmins" type="number" data-ml-cdraft="mins" value="${cdraft.mins}"></div></div>
      <label class="ml-f">Freezes</label><div class="ml-seg">${[['1', 'Yes'], ['', 'No']].map(([k, l]) => `<button data-ml="cset" data-k="freezes" data-v="${k}" aria-pressed="${!!cdraft.freezes === !!k}">${l}</button>`).join('')}</div>
      <label class="ml-f">Ingredients for one portion</label>
      ${cdraft.ing.map(([id, q], k) => `<div class="ml-row ml-edrow"><select class="ml-in" data-ml-ci="${k}" data-part="id" aria-label="Ingredient">${sel(io, id)}</select>
        <input class="ml-in ml-qty" type="number" inputmode="decimal" data-ml-ci="${k}" data-part="q" value="${q}" aria-label="Grams"><button class="ml-iconbtn" data-ml="crm" data-v="${k}" aria-label="Remove">×</button></div>`).join('')}
      <button class="ml-btn ml-btn--ghost" data-ml="cadd">Add ingredient</button>
      <label class="ml-f" for="ml-csteps">How</label><textarea class="ml-in" id="ml-csteps" rows="3" data-ml-cdraft="steps">${esc(cdraft.steps)}</textarea>
      <div class="ml-row" style="margin-top:14px;gap:8px"><button class="ml-btn ml-btn--ghost" data-ml="cback">Back</button><button class="ml-btn" style="flex:1" data-ml="csave">Save component</button></div>`);
  }
  function menuSheet() {
    openSheet(`<h2 class="ml-h2">${ui.weekStart === sundayOf(todayKey()) ? 'This week' : 'Week of ' + fmtD(ui.weekStart)}</h2>
      <button class="ml-pick" data-ml="planform"><span><span class="ml-rn">Change how I cook</span><br><span class="ml-small ml-muted">${esc(howCook(planPrefs()))}</span></span></button>
      <button class="ml-pick" data-ml="fitpacks"><span><span class="ml-rn">Fit to packs again</span><br><span class="ml-small ml-muted">Swap or top up meals so opened packs get finished</span></span></button>
      <button class="ml-pick" data-ml="copylist"><span><span class="ml-rn">Copy shopping list</span><br><span class="ml-small ml-muted">As plain text</span></span></button>
      <button class="ml-pick" data-ml="clearweek"><span><span class="ml-rn">Clear this week's plan</span><br><span class="ml-small ml-muted">Removes every meal, eaten ones too</span></span></button>`);
  }
  function shoppingText() {
    const L = shoppingList().filter(x => !x.i.staple && x.buy > 0);
    return AISLES.map(a => { const xs = L.filter(x => x.i.aisle === a); return xs.length ? a + '\n' + xs.map(x => '- ' + x.i.name + ' ' + packTxt(x)).join('\n') : ''; }).filter(Boolean).join('\n\n');
  }


  // ── events ───────────────────────────────────────────────
  function toast(t) {
    let e = $('ml-toast'); if (!e) { e = document.createElement('div'); e.id = 'ml-toast'; e.className = 'ml-toast'; e.setAttribute('role', 'status'); document.body.appendChild(e); }
    e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 1800);
  }
  const rerender = () => { save(); render(); };
  const fitMsg = f => { if (!f) return ''; const p = []; if (f.swaps) p.push(f.swaps + (f.swaps === 1 ? ' meal swapped' : ' meals swapped')); if (f.tops) p.push(f.tops + (f.tops === 1 ? ' pack topped up' : ' packs topped up')); return p.length ? ' · ' + p.join(', ') + ' to finish packs' : ''; };
  function refreshForm() { save(); if (sheetOpen) openSheet('<h2 class="ml-h2">How you cook</h2>' + planForm()); else render(); }

  function onClick(e) {
    const t = e.target.closest('[data-ml]'); if (!t) return;
    load(); ensureUi();
    const a = t.dataset.ml, v = t.dataset.v, p = S.prof, pr = S.prefs; const style = plannedStyle();
    switch (a) {
      case 'close': closeSheet(); return;
      case 'wk': ui.weekStart = addDays(ui.weekStart, 7 * (+v)); ui.day = ui.weekStart === sundayOf(todayKey()) ? parse(todayKey()).getDay() : 0; render(); return;
      case 'day': ui.day = +v; render(); return;
      case 'goweek': navTo('meals-week'); return;
      case 'gotoprep': navTo('meals-prep'); setTimeout(() => { const el = $('ml-prep-' + v); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' }); }, 30); return;
      case 'planform': openSheet('<h2 class="ml-h2">How you cook</h2>' + planForm()); return;
      case 'style': pr.style = v; pr.cookDays = STYLES[v].d.slice(); refreshForm(); return;
      case 'cookday': { const i = +v; pr.cookDays = pr.cookDays.includes(i) ? pr.cookDays.filter(x => x !== i) : pr.cookDays.concat(i); if (!pr.cookDays.length) pr.cookDays = [0]; refreshForm(); return; }
      case 'eatday': { const i = +v, cur = eatDays(pr); pr.days = cur.includes(i) ? cur.filter(x => x !== i) : cur.concat(i).sort((a, b) => a - b); refreshForm(); return; }
      case 'mealon': pr.meals[v] = !pr.meals[v]; refreshForm(); return;
      case 'bfst': pr.breakfast = v; refreshForm(); return;
      case 'generate': { const err = generate(); if (err) { toast(err); return; } closeSheet(); render(); toast('Week generated' + fitMsg(lastFit)); return; }
      case 'onebatch': {
        if (!confirm('Regenerate this week with Sunday as the only batch day? Meals already eaten are kept.')) return;
        pr.style = 'hybrid'; pr.cookDays = [0]; const err = generate(); if (err) { toast(err); return; } render(); toast('One Sunday batch' + fitMsg(lastFit)); return;
      }
      case 'fitpacks': { const f = fitPacks(); closeSheet(); render(); toast(fitMsg(f) ? 'Fitted' + fitMsg(f) : 'Packs already fit'); return; }
      case 'nostock': { const w = wk(true); w.shop.nostock = w.shop.nostock || {}; w.shop.nostock[v] = true; rerender(); return; }
      case 'stockreset': wk(true).shop.nostock = {}; rerender(); return;
      case 'menu': menuSheet(); return;
      case 'clearweek': if (!confirm('Clear every meal planned for this week?')) return; delete S.weeks[ui.weekStart]; closeSheet(); rerender(); return;
      case 'copylist': {
        const txt = shoppingText();
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Shopping list copied'), () => toast('Copy not available here'));
        closeSheet(); return;
      }
      case 'slot': slotSheet(v); return;
      case 'setslot': { const s = t.dataset.s, d = ui.day; wk(true).plan[sk(d, s)] = style === 'hybrid' ? { r: v } : { r: v, cook: d }; if (!wk().planPrefs) wk().planPrefs = JSON.parse(JSON.stringify(pr)); save(); closeSheet(); render(); toast(style === 'hybrid' ? 'Meal set; its bases join the batch' : 'Meal set, cooked fresh that day'); return; }
      case 'move': {
        const s = t.dataset.s, w = wk(true), from = sk(ui.day, s), to = sk(+v, s); const A = w.plan[from], B = w.plan[to];
        if (B) w.plan[from] = B; else delete w.plan[from]; if (A) w.plan[to] = A;
        [[from, ui.day], [to, +v]].forEach(([k, d]) => { const o = w.plan[k]; if (o && o.cook != null && d < o.cook) o.cook = d; });
        save(); closeSheet(); render(); toast('Moved to ' + WDL[+v]); return;
      }
      case 'skip': { const o = slotObj(ui.day, v); if (!o) return; o.skip = !o.skip; o.done = false; save(); closeSheet(); render(); return; }
      case 'done': { const o = slotObj(ui.day, v); if (!o) return; o.done = !o.done; if (o.done) o.doneAt = Date.now(); else delete o.doneAt; save(); closeSheet(); render(); return; }
      case 'freshall': { const o = slotObj(ui.day, v); if (!o) return; o.fresh = !o.fresh; save(); render(); slotSheet(v); return; }
      case 'clearslot': delete wk(true).plan[sk(ui.day, v)]; save(); closeSheet(); render(); return;
      case 'recipe': recipeSheet(v); return;
      case 'xadd': { const i = $('ml-xnew'), txt = i && i.value.trim(); if (!txt) return; wk(true).shop.extras.push({ id: 'x' + Date.now(), text: txt, done: false }); rerender(); const n = $('ml-xnew'); if (n) n.focus(); return; }
      case 'xdel': e.preventDefault(); wk(true).shop.extras = wk().shop.extras.filter(x => x.id !== v); rerender(); return;
      case 'pantry': wk(true).shop.pantry = !wk().shop.pantry; rerender(); return;
      case 'libtype': ui.libType = v; render(); return;
      case 'fitonly': ui.fitOnly = !ui.fitOnly; render(); return;
      case 'set': p[t.dataset.k] = v; rerender(); return;
      case 'con': p.cons = p.cons.includes(v) ? p.cons.filter(x => x !== v) : p.cons.concat(v); rerender(); return;
      case 'dtype': {
        // plan → next tier … → hard → back to the plan
        const cur = effortFor(v);
        if (cur.src !== 'you') S.effort[v] = TIERS[(TIERS.indexOf(cur.tier) + 1) % 4];
        else { const nx = TIERS.indexOf(cur.tier) + 1; if (nx >= TIERS.length || TIERS[nx] === cur.planTier) delete S.effort[v]; else S.effort[v] = TIERS[nx]; }
        rerender(); return;
      }
      case 'newrecipe': draft = { name: '', type: 'main', parts: [['quinoa', 1], ['salmon', 1]], finish: [], custom: true }; editorSheet(); return;
      case 'editrecipe': draft = JSON.parse(JSON.stringify(R(v))); editorSheet(); return;
      case 'delrecipe': {
        if (!confirm('Delete this recipe?')) return; S.custom = S.custom.filter(r => r.id !== v);
        Object.values(S.weeks).forEach(w => Object.keys(w.plan || {}).forEach(k => { if (w.plan[k].r === v) delete w.plan[k]; }));
        save(); closeSheet(); render(); return;
      }
      case 'dset': draft[t.dataset.k] = v; editorSheet(); return;
      case 'padd': draft.parts.push(['rice', 1]); editorSheet(); return;
      case 'prm': draft.parts.splice(+v, 1); editorSheet(); return;
      case 'fadd': draft.finish.push(['lemon', 10]); editorSheet(); return;
      case 'frm': draft.finish.splice(+v, 1); editorSheet(); return;
      case 'newcomp': cdraft = { name: '', prep: 'fresh', keeps: 2, freezes: false, mins: 10, ing: [['chicken', 150]], steps: '', verb: 'Cook' }; compSheet(); return;
      case 'cset': cdraft[t.dataset.k] = t.dataset.k === 'freezes' ? !!v : v; compSheet(); return;
      case 'cadd': cdraft.ing.push(['onion', 50]); compSheet(); return;
      case 'crm': cdraft.ing.splice(+v, 1); compSheet(); return;
      case 'cback': editorSheet(); return;
      case 'csave': {
        if (!cdraft.name.trim()) { toast('Give the component a name'); return; }
        if (!cdraft.ing.length) { toast('Add at least one ingredient'); return; }
        cdraft.keeps = num(cdraft.keeps) || 0; cdraft.mins = num(cdraft.mins) || 0; cdraft.id = 'cc' + Date.now();
        S.customComps.push(cdraft); draft.parts.push([cdraft.id, 1]); cdraft = null; save(); editorSheet(); toast('Component added'); return;
      }
      case 'dsave': {
        if (!draft.name.trim()) { toast('Give the recipe a name'); return; }
        if (!draft.parts.length) { toast('Add at least one component'); return; }
        if (draft.id) S.custom = S.custom.map(r => r.id === draft.id ? draft : r); else { draft.id = 'c' + Date.now(); S.custom.push(draft); }
        save(); closeSheet(); navTo('meals-recipes'); toast('Recipe saved'); return;
      }
      default: return;
    }
  }
  function onChange(e) {
    const t = e.target; load(); ensureUi();
    if (t.dataset.mlChange === 'check') { wk(true).shop.checked[t.dataset.v] = t.checked; rerender(); return; }
    if (t.dataset.mlChange === 'xcheck') { const x = wk(true).shop.extras.find(x => x.id === t.dataset.v); if (x) x.done = t.checked; rerender(); return; }
    if (t.dataset.mlField === 'budget') { S.budget = num(t.value) || 0; rerender(); return; }
    if (t.dataset.mlField) { S.prof[t.dataset.mlField] = t.value; rerender(); return; }
    const upd = (arr, k) => { if (t.dataset.part === 'id') arr[k][0] = t.value; else arr[k][1] = num(t.value) || 0; };
    if (t.dataset.mlPi != null && draft) { upd(draft.parts, +t.dataset.mlPi); editorSheet(); return; }
    if (t.dataset.mlFi != null && draft) { upd(draft.finish, +t.dataset.mlFi); editorSheet(); return; }
    if (t.dataset.mlCi != null && cdraft) { upd(cdraft.ing, +t.dataset.mlCi); compSheet(); return; }
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === 'ml-libq') { ui.lib = t.value; const pos = t.selectionStart; render(); const n = $('ml-libq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
    if (t.dataset.mlDraft && draft) draft[t.dataset.mlDraft] = t.value;
    if (t.dataset.mlCdraft && cdraft) cdraft[t.dataset.mlCdraft] = t.value;
  }
  function onKey(e) {
    if (e.key === 'Escape' && sheetOpen) closeSheet();
    if (e.key === 'Enter' && e.target && e.target.id === 'ml-xnew') { e.preventDefault(); const b = document.querySelector('[data-ml="xadd"]'); if (b) b.click(); }
  }

  function init() {
    if (typeof document === 'undefined') return;
    const scr = $('screen-meals'), back = $('ml-sheet-back');
    if (scr && !scr._ml) { scr._ml = true; scr.addEventListener('click', onClick); scr.addEventListener('change', onChange); scr.addEventListener('input', onInput); scr.addEventListener('keydown', onKey); }
    if (back && !back._ml) {
      back._ml = true;
      back.addEventListener('click', e => { if (e.target === back) { closeSheet(); return; } onClick(e); });
      back.addEventListener('change', onChange); back.addEventListener('input', onInput);
      document.addEventListener('keydown', onKey);
    }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }

  return {
    render, init, load, save, generate, fitPacks, ledger, stockFor, cookedLabel, effortFor, targetFor, weight, tasks, shoppingList, shoppingText, dayTotals, activeSlots, fits,
    ING, TIERS,
    get state() { return S; },
    ui,
    _setRandom(f) { rnd = f || Math.random; },
    _setFit(on) { fitOn = !!on; },
    get lastFit() { return lastFit; },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Meals };
