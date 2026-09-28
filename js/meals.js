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
  D.ING_ROWS.forEach(r => { ING[r[0]] = { id: r[0], name: r[1], cls: r[2], aisle: r[3], kcal: r[4], p: r[5], c: r[6], f: r[7], fib: r[8], price: r[9], al: r[10] ? r[10].split(' ') : [], pc: r[11], staple: !!r[12] }; });
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
      prefs: { style: 'hybrid', cookDays: [0], meals: { b: true, l: true, d: true }, breakfast: 'mix' },
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
  function effortFor(key) {
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
    return { tier: own || tier, planTier: tier, type, label: typeLabel(type), src: own ? 'you' : src, lighter };
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
  const eur = v => '€' + v.toFixed(v < 10 ? 2 : 0);
  const mealKeeps = r => Math.min(...r.parts.map(([cid]) => { const c = CP(cid); return !c || c.prep === 'assemble' || c.freezes ? 99 : c.keeps; }));
  const batchParts = r => r.parts.map(([cid]) => CP(cid)).filter(c => c && c.prep === 'batch');
  const planPrefs = () => wk().planPrefs || S.prefs;
  const plannedStyle = () => planPrefs().style;
  const batchDays = () => { const pp = planPrefs(); return pp.style === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : pp.style === 'sunday' ? [0] : [...new Set(pp.cookDays)].sort((a, b) => a - b); };
  function latestBefore(days, d) { let c = null; days.forEach(x => { if (x <= d) c = x; }); return c == null ? { c: days[days.length - 1], off: d + 7 - days[days.length - 1] } : { c, off: d - c }; }

  // ── planning ─────────────────────────────────────────────
  let rnd = Math.random;
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function mainSlots(meals) { const out = []; for (let d = 0; d < 7; d++) ['l', 'd'].forEach(s => { if (meals[s]) out.push({ d, s }); }); return out; }
  // whole-meal sessions (Sunday batch, Every day): Sunday cooks at midday, other days in the evening
  function sessions(cookDays, meals) {
    const cds = [...new Set(cookDays)].sort((a, b) => a - b); const start = c => c * 2 + (c === 0 ? 0 : 1); const out = cds.map(c => ({ c, slots: [] }));
    mainSlots(meals).forEach(({ d, s }) => {
      const t = d * 2 + (s === 'l' ? 0 : 1); let own = null; for (const x of out) if (start(x.c) <= t) own = x; let off;
      if (own) off = d - own.c; else { own = out[out.length - 1]; off = d + 7 - own.c; } own.slots.push({ d, s, off });
    });
    return out.filter(x => x.slots.length);
  }
  function pickBreakfast(d, cooked) {
    const pref = S.prefs.breakfast, t = tierOf(d); const shakes = recipes().filter(r => r.shake && fits(r) === true);
    if (pref === 'shake' || (pref === 'mix' && training(t))) if (shakes.length) return shakes[0];
    return cooked.length ? cooked[d % cooked.length] : shakes[0];
  }
  // Returns an error string, or '' on success.
  function generate() {
    const pr = S.prefs, plan = {};
    const mains = shuffle(recipes().filter(r => r.type === 'main' && fits(r) === true));
    if ((pr.meals.l || pr.meals.d) && !mains.length) return 'No lunch or dinner recipe fits your food settings';
    if (pr.style === 'hybrid') {
      // 1. choose a small set of batch bases that unlocks the most meals
      const days = [...new Set(pr.cookDays)].sort((a, b) => a - b); const bp = r => batchParts(r).map(c => c.id);
      const covered = set => mains.filter(r => bp(r).every(id => set.has(id)));
      const all = [...new Set(mains.flatMap(bp))]; const bases = new Set(); const cap = Math.min(4, Math.max(2, Math.round(mainSlots(pr.meals).length / 3.5)));
      while (bases.size < cap) { let best = null, bc = -1; shuffle(all).forEach(id => { if (bases.has(id)) return; const c = covered(new Set([...bases, id])).length; if (c > bc) { bc = c; best = id; } }); if (!best) break; bases.add(best); }
      let pool = covered(bases); if (pool.length < 3) pool = mains;
      // 2. fill slots from that pool, varying protein and never repeating back to back
      const count = {}; let last = null, prevLabel = null;
      mainSlots(pr.meals).forEach(({ d, s }) => {
        const off = latestBefore(days, d).off; let best = null, bs = -1e9;
        pool.forEach(r => {
          let sc = 2 * batchParts(r).length - (count[r.id] || 0) * 5; if (r.id === last) sc -= 20; if (dietLabel(r) === prevLabel) sc -= 2;
          batchParts(r).forEach(c => { if (off > c.keeps && !c.freezes) sc -= 8; }); sc += rnd() * 2; if (sc > bs) { bs = sc; best = r; }
        });
        count[best.id] = (count[best.id] || 0) + 1; last = best.id; prevLabel = dietLabel(best); plan[sk(d, s)] = { r: best.id };
      });
    } else {
      const used = new Set();
      sessions(pr.style === 'daily' ? STYLES.daily.d : [0], pr.meals).forEach(sess => {
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
    return '';
  }

  /* Where each component of a planned meal gets made.
     → [{c, q (portions), day (when it is made), batch (made ahead), frz, note}] */
  function placeSlot(d, s, o, r, m) {
    const style = plannedStyle(), bdays = batchDays();
    return r.parts.map(([cid, cm]) => {
      const c = CP(cid); if (!c) return null; const q = m * cm;
      if (c.prep === 'assemble') return { c, q, day: d, batch: false, frz: false };
      if (o.fresh) return { c, q, day: d, batch: false, frz: false };
      if (s === 'b') {
        if (c.prep === 'batch' && style !== 'daily') {
          const L = latestBefore(bdays, d);
          if (L.off <= c.keeps) return { c, q, day: L.c, batch: true, frz: false };
          if (c.freezes) return { c, q, day: L.c, batch: true, frz: true };
        }
        return { c, q, day: d, batch: false, frz: false };
      }
      if (style === 'daily' || style === 'sunday') {
        const cook = o.cook ?? d, off = d - cook;
        if (off < 0) return { c, q, day: d, batch: false, frz: false };
        const frz = off > c.keeps && c.freezes; if (off > c.keeps && !c.freezes) return { c, q, day: d, batch: false, frz: false, note: 'keeps ' + c.keeps + 'd' };
        return { c, q, day: cook, batch: cook !== d, frz };
      }
      if (c.prep === 'batch') {
        const L = latestBefore(bdays, d);
        if (L.off <= c.keeps) return { c, q, day: L.c, batch: true, frz: false };
        if (c.freezes) return { c, q, day: L.c, batch: true, frz: true };
        return { c, q, day: d, batch: false, frz: false, note: 'keeps ' + c.keeps + 'd' };
      }
      return { c, q, day: d, batch: false, frz: false };
    }).filter(Boolean);
  }
  function activeSlots() {
    const out = [];
    for (let d = 0; d < 7; d++) SLOTS.forEach(([s]) => {
      const o = slotObj(d, s); const r = o && R(o.r);
      if (o && !o.skip && r) { const m = portion(d, s, r); out.push({ d, s, o, r, m, pl: placeSlot(d, s, o, r, m) }); }
    });
    return out;
  }
  function tasks() {
    const T = {};
    activeSlots().forEach(x => {
      x.pl.forEach(p => {
        const k = p.day + '|' + p.c.id; const t = T[k] = T[k] || { day: p.day, batch: false, c: p.c, q: 0, uses: [], bf: x.s === 'b' };
        t.batch = t.batch || p.batch; t.q += p.q; t.uses.push({ d: x.d, s: x.s, frz: p.frz }); if (x.s !== 'b') t.bf = false;
      });
    });
    return Object.values(T);
  }
  function shoppingList() {
    const tot = {};
    tasks().forEach(t => t.c.ing.forEach(([id, q]) => { const e = tot[id] = tot[id] || { q: 0, by: new Set() }; e.q += q * t.q; e.by.add(t.day); }));
    activeSlots().forEach(x => (x.r.finish || []).forEach(([id, q]) => { const e = tot[id] = tot[id] || { q: 0, by: new Set() }; e.q += q * x.m; e.by.add(x.d); }));
    return Object.entries(tot).filter(([id]) => ING[id]).map(([id, t]) => {
      const i = ING[id]; return { id, q: t.q, by: [...t.by].sort(), cost: i.pc ? i.price * Math.ceil(t.q - .05) : i.price * t.q / 1000, i };
    });
  }
  function dayTotals(d) {
    const pl = { kcal: 0, p: 0, c: 0, f: 0 }, ea = { kcal: 0, p: 0 };
    activeSlots().filter(x => x.d === d).forEach(x => { const n = nutr(x.r, x.m); ['kcal', 'p', 'c', 'f'].forEach(k => pl[k] += n[k]); if (x.o.done) { ea.kcal += n.kcal; ea.p += n.p; } });
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
    return main + ' ' + (p.meals.b ? BFST[p.breakfast] + '.' : 'No breakfast planned.');
  }
  function slotSummary(x) {
    const b = x.pl.filter(p => p.batch), f = x.pl.filter(p => !p.batch && p.c.prep !== 'assemble'); const out = [];
    const byDay = {}; b.forEach(p => (byDay[p.day] = byDay[p.day] || []).push(p));
    Object.entries(byDay).forEach(([day, ps]) => out.push(`<span class="ml-cchip">${ps.map(p => esc(p.c.name)).join(', ')} <i>from ${WD[day]}${ps.some(p => p.frz) ? ', frozen' : ''}</i></span>`));
    if (f.length) out.push(`<span class="ml-cchip ml-cchip--fresh">${f.map(p => esc(p.c.name)).join(', ')} <i>today, ${mins(f.reduce((a, p) => a + p.c.mins, 0))}</i></span>`);
    if (!b.length && !f.length) out.push('<span class="ml-cchip"><i>No cooking</i></span>');
    return out.join('');
  }
  function effortLine(d) {
    const e = effortFor(dateOf(d));
    return `<span class="ml-dot ml-t-${e.tier}"></span> ${esc(e.label)} · ${e.tier}${e.src === 'you' ? ' (set by you)' : e.lighter ? ' (made lighter)' : ''}`;
  }
  function vWeek() {
    if (!hasPlan()) return `<div class="card ml-empty"><h2 class="ml-h2">Plan this week</h2><p class="ml-muted">Pick how you cook, then generate. Portions follow each day's training. You can swap, move or skip any meal after.</p></div>` + planForm();
    const ks = weekKeys(), today = todayKey(), d = ui.day; const T = tasks();
    const load = {}; T.forEach(t => { if (!t.bf) load[t.day] = (load[t.day] || 0) + t.c.mins; });
    const board = `<div class="ml-board">${ks.map((k, i) => {
      const heavy = T.some(t => t.day === i && t.batch); const tier = tierOf(i);
      return `<button class="ml-day ${k === today ? 'is-today' : ''}" data-ml="day" data-v="${i}" aria-pressed="${i === d}" aria-label="${WDL[i]} ${parse(k).getDate()}, ${tier} day">
        <span class="ml-bar ml-t-${tier}"></span><div class="ml-dn">${WD[i]}</div><div class="ml-dd">${parse(k).getDate()}</div><div class="ml-ck">${load[i] ? (heavy ? svg('pot') : `<span class="ml-mins">${load[i]}′</span>`) : ''}</div></button>`;
    }).join('')}</div>`;
    const act = activeSlots();
    const rows = SLOTS.filter(([s]) => planPrefs().meals[s] || slotObj(d, s)).map(([s, label]) => {
      const o = slotObj(d, s), r = o && R(o.r); const x = act.find(y => y.d === d && y.s === s);
      return `<button class="ml-slot ${o?.skip ? 'is-skip' : ''}" data-ml="slot" data-v="${s}"><span class="ml-sl">${label}</span>
        <span>${r ? `<div class="ml-rn">${esc(r.name)}</div><div class="ml-src">${o.skip ? '<span class="ml-small ml-muted">Eating out</span>' : `<span class="ml-pchip">×${x.m.toFixed(1)}</span>${o.done ? '<span class="ml-pchip ml-pchip--done">Eaten</span>' : ''}${r.shake ? '' : slotSummary(x)}`}</div>` : '<span class="ml-muted">Add a meal</span>'}</span><span class="ml-muted">›</span></button>`;
    }).join('');
    const todayMins = T.filter(t => t.day === d && !t.bf).reduce((a, t) => a + t.c.mins, 0);
    const e = effortFor(dateOf(d)), fuel = fuelNote(e.type);
    return `<div class="card ml-howcook"><span class="ml-small">${howCook(planPrefs())}</span><button class="ml-linkbtn ml-small" data-ml="planform">Change</button></div>` + board +
      `<div class="card"><div class="ml-row ml-between ml-dayhead"><h2 class="ml-h2">${WDL[d]} ${parse(dateOf(d)).getDate()}</h2>${todayMins ? `<span class="ml-small ml-muted">about ${mins(todayMins)} cooking</span>` : ''}</div>
       <div class="ml-small ml-muted ml-effort">${effortLine(d)}${fuel ? ` — ${esc(fuel)}` : ''}</div>${rows}
       ${todayMins ? `<button class="ml-btn ml-btn--ghost ml-block" data-ml="gotoprep" data-v="${d}">See ${WD[d]}'s cooking</button>` : ''}</div>` + vNutrition(d);
  }
  function vNutrition(d) {
    const t = target(d);
    if (!t) return `<div class="card"><p class="ml-small ml-muted" style="margin:0">Add your weight in Food settings, or a weigh-in in Settings → Training, to get daily targets and portion sizes.</p></div>`;
    const { planned: pl, eaten: ea } = dayTotals(d);
    const max = Math.max(t.kcal, pl.kcal) * 1.08;
    return `<div class="card ml-nut"><div class="ml-row ml-between"><h3 class="ml-h3">Day totals</h3><span class="ml-small ml-muted">${Math.round(ea.kcal)} eaten · ${Math.round(pl.kcal)} planned / ${t.kcal} kcal</span></div>
      <div class="ml-meter" role="img" aria-label="${Math.round(ea.kcal)} of ${t.kcal} kcal eaten, ${Math.round(pl.kcal)} planned"><span class="ml-fill" style="width:${pl.kcal / max * 100}%"></span><span class="ml-eat" style="width:${ea.kcal / max * 100}%"></span><span class="ml-tgt" style="left:${t.kcal / max * 100}%"></span></div>
      <div class="ml-macros"><div><b>${Math.round(pl.p)}g</b><span class="ml-muted">protein / ${t.p}</span></div><div><b>${Math.round(pl.c)}g</b><span class="ml-muted">carbs / ${t.c}</span></div><div><b>${Math.round(pl.f)}g</b><span class="ml-muted">fat / ${t.f}</span></div><div><b>${Math.max(0, Math.round(t.kcal - pl.kcal))}</b><span class="ml-muted">kcal for snacks</span></div></div></div>`;
  }
  function planForm() {
    const p = S.prefs;
    return `<div class="card"><label class="ml-f" style="margin-top:0">How do you want to cook this week?</label>
      <div class="ml-seg">${Object.entries(STYLES).map(([k, v]) => `<button data-ml="style" data-v="${k}" aria-pressed="${p.style === k}">${v.l}<small>${v.s}</small></button>`).join('')}</div>
      ${p.style === 'hybrid' ? `<label class="ml-f">Batch days for the bases</label><div class="ml-week7">${WD.map((w, i) => `<button data-ml="cookday" data-v="${i}" aria-pressed="${p.cookDays.includes(i)}">${w}</button>`).join('')}</div>` : ''}
      <label class="ml-f">Meals to plan</label><div class="ml-chips">${SLOTS.map(([s, l]) => `<button class="ml-chip" data-ml="mealon" data-v="${s}" aria-pressed="${!!p.meals[s]}">${l}</button>`).join('')}</div>
      ${p.meals.b ? `<label class="ml-f">Breakfast</label><div class="ml-seg">${[['shake', 'Shake', 'every morning'], ['cooked', 'Cooked', 'every morning'], ['mix', 'Mix', 'shake on training days']].map(([k, l, s]) => `<button data-ml="bfst" data-v="${k}" aria-pressed="${p.breakfast === k}">${l}<small>${s}</small></button>`).join('')}</div>` : ''}
      <div class="ml-note">${p.style === 'sunday' ? 'Every component is cooked on Sunday. Anything eaten after its fridge life goes in the freezer; the rest is marked to cook fresh.' : p.style === 'hybrid' ? 'Grains, roast veg, eggs, beans and sauces are batched on your batch days. Fish, meat, pasta, greens and salads are cooked or put together on the day, usually 5–20 min. The week is built to reuse the same few bases.' : 'Cook each evening; the extra portion is tomorrow\'s lunch.'}</div>
      <button class="ml-btn ml-block" style="margin-top:12px" data-ml="generate">${hasPlan() ? 'Regenerate the week' : 'Generate the week'}</button>
      ${hasPlan() ? '<div class="ml-small ml-muted" style="margin-top:6px">Meals already marked eaten are kept.</div>' : ''}</div>`;
  }
  const useLabel = u => WD[u.d] + ' ' + SLOTS.find(x => x[0] === u.s)[1].toLowerCase();
  function taskBlock(t) {
    const fr = t.uses.filter(u => !u.frz), fz = t.uses.filter(u => u.frz);
    return `<div class="ml-cook"><div class="ml-row ml-between"><h3 class="ml-h3">${esc(t.c.name)}</h3><span class="ml-small ml-muted">${t.c.mins} min</span></div>
      <div class="ml-store">${t.batch ? (fr.length ? `<span class="ml-tag">Fridge: ${fr.map(useLabel).join(', ')}</span>` : '') : `<span class="ml-tag">For ${t.uses.map(useLabel).join(', ')}</span>`}${fz.length ? `<span class="ml-pchip ml-pchip--frz">Freeze: ${fz.map(useLabel).join(', ')}</span>` : ''}</div>
      ${t.c.ing.map(([id, q]) => `<div class="ml-ing"><span>${esc(ING[id]?.name || id)}</span><span>${fmtQ(id, q * t.q)}</span></div>`).join('')}
      <details class="ml-how"><summary class="ml-small ml-muted">How</summary><p class="ml-small">${esc(t.c.steps)}</p></details></div>`;
  }
  function emptyPlan() { return `<div class="card ml-empty"><h2 class="ml-h2">No plan for this week</h2><p class="ml-muted">Prep and shopping are built from the week's plan.</p><button class="ml-btn" data-ml="goweek">Plan the week</button></div>`; }
  function vPrep() {
    if (!hasPlan()) return emptyPlan(); const T = tasks().filter(t => !t.bf);
    const days = [...new Set(T.map(t => t.day))].sort((a, b) => a - b);
    const cards = days.map(d => {
      const b = T.filter(t => t.day === d && t.batch).sort((x, y) => y.c.mins - x.c.mins), f = T.filter(t => t.day === d && !t.batch).sort((x, y) => x.c.prep === y.c.prep ? 0 : x.c.prep === 'fresh' ? -1 : 1);
      const bm = Math.round(b.reduce((a, t) => a + t.c.mins, 0) * 0.65 / 5) * 5, fm = f.reduce((a, t) => a + t.c.mins, 0);
      return `<div class="card ml-session" id="ml-prep-${d}"><div class="ml-row ml-between"><h2 class="ml-h2">${WDL[d]} ${parse(dateOf(d)).getDate()}</h2><span class="ml-small ml-muted">${b.length ? `batch about ${mins(Math.max(bm, 15))}` : ''}${b.length && f.length ? ', ' : ''}${f.length ? `on the day ${mins(fm)}` : ''}</span></div>
        ${b.length ? `<div class="ml-subh">Batch ${b.length} ${b.length === 1 ? 'component' : 'components'} <span class="ml-muted ml-small">(running in parallel)</span></div>${b.map(taskBlock).join('')}` : ''}
        ${f.length ? `<div class="ml-subh">${b.length ? 'Also on the day' : 'On the day'}</div>${f.map(taskBlock).join('')}` : ''}</div>`;
    }).join('');
    const bf = activeSlots().filter(x => x.s === 'b'); const byR = {};
    bf.forEach(x => { (byR[x.r.id] = byR[x.r.id] || { r: x.r, days: [], m: 0 }).days.push(x.d); byR[x.r.id].m += x.m; });
    return cards + (bf.length ? `<div class="card ml-session"><h2 class="ml-h2">Breakfasts</h2>${Object.values(byR).map(it => {
      const c = CP(it.r.parts[0][0]); if (!c) return '';
      return `<div class="ml-cook"><div class="ml-row ml-between"><h3 class="ml-h3">${esc(it.r.name)}</h3><span class="ml-pchip">${it.days.map(d => WD[d]).join(' ')}</span></div>
        <p class="ml-small ml-muted" style="margin:4px 0 6px">${c.prep === 'batch' && plannedStyle() !== 'daily' ? 'Made ahead on ' + [...new Set(it.days.map(d => WD[latestBefore(batchDays(), d).c]))].join(' and ') + ', keeps ' + c.keeps + ' days.' : 'Fresh each morning, ' + c.mins + ' min.'} Totals for the week:</p>
        ${mealIng(it.r).map(([id, q]) => `<div class="ml-ing"><span>${esc(ING[id]?.name || id)}</span><span>${fmtQ(id, q * it.m)}</span></div>`).join('')}</div>`;
    }).join('')}</div>` : '');
  }
  function vShop() {
    if (!hasPlan()) return emptyPlan();
    const w = wk(), list = shoppingList(), ck = w.shop.checked, freshL = list.filter(x => !x.i.staple), staples = list.filter(x => x.i.staple);
    const total = freshL.reduce((a, x) => a + x.cost, 0), wkBudget = S.budget * 12 / 52, left = freshL.filter(x => !ck[x.id]).length;
    const row = x => `<label class="ml-item ${ck[x.id] ? 'is-checked' : ''}"><input type="checkbox" data-ml-change="check" data-v="${x.id}" ${ck[x.id] ? 'checked' : ''}>
      <span><span class="ml-nm">${esc(x.i.name)}</span><br><span class="ml-q">${fmtQ(x.id, x.q)}, first needed ${WD[x.by[0]]}</span></span><span class="ml-c">${eur(x.cost)}</span></label>`;
    return `<div class="card"><div class="ml-row ml-between"><div class="ml-budget"><span class="ml-big">${eur(total)}</span><span class="ml-muted">this week</span></div><span class="ml-small ml-muted">${left} to buy</span></div>
      <div class="ml-track ${total > wkBudget ? 'is-over' : ''}"><span style="width:${wkBudget ? Math.min(100, total / wkBudget * 100) : 100}%"></span></div>
      <div class="ml-small ml-muted">${eur(wkBudget)} weekly share of your ${eur(S.budget)} monthly budget, ${total > wkBudget ? eur(total - wkBudget) + ' over' : eur(wkBudget - total) + ' spare'}</div></div>
      ${AISLES.map(a => [a, freshL.filter(x => x.i.aisle === a).sort((x, y) => x.by[0] - y.by[0] || x.i.name.localeCompare(y.i.name))]).filter(x => x[1].length).map(([a, xs]) => `<div class="card ml-aisle"><h3 class="ml-h3">${a}</h3>${xs.map(row).join('')}</div>`).join('')}
      <div class="card ml-aisle"><h3 class="ml-h3">Your own items</h3>${w.shop.extras.map(e => `<label class="ml-item ${e.done ? 'is-checked' : ''}"><input type="checkbox" data-ml-change="xcheck" data-v="${e.id}" ${e.done ? 'checked' : ''}><span class="ml-nm">${esc(e.text)}</span><button class="ml-iconbtn ml-iconbtn--sm" data-ml="xdel" data-v="${e.id}" aria-label="Remove">×</button></label>`).join('')}
        <div class="ml-row" style="margin-top:8px"><input class="ml-in" id="ml-xnew" placeholder="Add something else, e.g. coffee"><button class="ml-btn" data-ml="xadd">Add</button></div></div>
      <div class="card ml-aisle"><button class="ml-row ml-between ml-plain" data-ml="pantry"><h3 class="ml-h3">Pantry check</h3><span class="ml-muted">${w.shop.pantry ? 'Hide' : 'Show'} ${staples.length}</span></button>${w.shop.pantry ? staples.map(row).join('') : ''}</div>
      <p class="ml-small ml-muted">Prices are rough supermarket estimates. "First needed" lets you buy fish and fresh greens midweek.</p>`;
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
      ${x ? `<div>${x.pl.map(p => `<div class="ml-ing"><span>${esc(p.c.name)}</span><span>${p.c.prep === 'assemble' ? 'put together' : p.batch ? 'from ' + WD[p.day] + (p.frz ? ', thaw the night before' : '') : (p.note ? 'cook today (' + p.note + ')' : 'cook today, ' + p.c.mins + ' min')}</span></div>`).join('')}</div>` : ''}
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
      <button class="ml-pick" data-ml="copylist"><span><span class="ml-rn">Copy shopping list</span><br><span class="ml-small ml-muted">As plain text</span></span></button>
      <button class="ml-pick" data-ml="clearweek"><span><span class="ml-rn">Clear this week's plan</span><br><span class="ml-small ml-muted">Removes every meal, eaten ones too</span></span></button>`);
  }
  function shoppingText() {
    const L = shoppingList().filter(x => !x.i.staple);
    return AISLES.map(a => { const xs = L.filter(x => x.i.aisle === a); return xs.length ? a + '\n' + xs.map(x => '- ' + x.i.name + ' ' + fmtQ(x.id, x.q)).join('\n') : ''; }).filter(Boolean).join('\n\n');
  }

  // ── events ───────────────────────────────────────────────
  function toast(t) {
    let e = $('ml-toast'); if (!e) { e = document.createElement('div'); e.id = 'ml-toast'; e.className = 'ml-toast'; e.setAttribute('role', 'status'); document.body.appendChild(e); }
    e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 1800);
  }
  const rerender = () => { save(); render(); };
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
      case 'mealon': pr.meals[v] = !pr.meals[v]; refreshForm(); return;
      case 'bfst': pr.breakfast = v; refreshForm(); return;
      case 'generate': { const err = generate(); if (err) { toast(err); return; } closeSheet(); render(); toast('Week generated'); return; }
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
    render, init, load, save, generate, effortFor, targetFor, weight, tasks, shoppingList, shoppingText, dayTotals, activeSlots, fits,
    ING, TIERS,
    get state() { return S; },
    ui,
    _setRandom(f) { rnd = f || Math.random; },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Meals };
