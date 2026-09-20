// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — MONTH PLAN
// The block layer sitting above the week scaffold. Answers "what is
// today for" so the Generator can answer "what exactly do I do".
// ─────────────────────────────────────────────────────────────

const MonthPlan = {

  KEY: 'month_plan',

  // Deload is the only load that changes the shape of the day — Main Focus
  // shrinks so the week lands you fresh at the tests rather than fried.
  // Everything else is intent, carried in the note.
  LOAD_SCALE: { baseline: 1, build: 1, peak: 1, deload: 0.6, test: 1 },

  _key(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },

  load() {
    const stored = (typeof DB !== 'undefined') ? DB.get(this.KEY) : null;
    if (stored) return stored;
    return (typeof MONTH_PLAN_SEED !== 'undefined') ? MONTH_PLAN_SEED : null;
  },

  save(plan) { if (typeof DB !== 'undefined') DB.set(this.KEY, plan); },

  // Push the shipped seed into storage (and therefore Supabase) the first
  // time the app runs, so the .ics feed has something to serve.
  ensureSeeded() {
    if (typeof DB === 'undefined') return null;
    const seed = (typeof MONTH_PLAN_SEED !== 'undefined') ? MONTH_PLAN_SEED : null;
    if (!seed) return DB.get(this.KEY);
    const stored = DB.get(this.KEY);
    // Supersede by version, not just by absence. There is no in-app plan
    // editor yet, so a stored plan is only ever a copy of an older seed and
    // there is nothing of the user's to protect by keeping it. If an editor
    // ever lands, this needs to stop clobbering user edits.
    if (!stored || (stored.seedVersion || 0) < (seed.seedVersion || 0)) {
      DB.set(this.KEY, seed);
      return seed;
    }
    return stored;
  },

  dayFor(date) {
    const plan = this.load();
    if (!plan || !Array.isArray(plan.days)) return null;
    const k = this._key(date ? new Date(date) : new Date());
    return plan.days.find(d => d.date === k) || null;
  },

  weekFor(date) {
    const plan = this.load(), day = this.dayFor(date);
    if (!plan || !day) return null;
    return (plan.weeks || []).find(w => w.n === day.week) || null;
  },

  isActive(date) {
    const plan = this.load();
    if (!plan) return false;
    const k = this._key(date ? new Date(date) : new Date());
    return k >= plan.blockStart && k <= plan.blockEnd;
  },

  loadScaleFor(date) {
    const day = this.dayFor(date);
    if (!day) return 1;
    const s = this.LOAD_SCALE[day.load];
    return (typeof s === 'number') ? s : 1;
  },

  // Where you are in the block — for the home screen.
  progress(date) {
    const plan = this.load();
    if (!plan) return null;
    const d = date ? new Date(date) : new Date();
    const k = this._key(d);
    const idx = (plan.days || []).findIndex(x => x.date === k);
    const day = idx >= 0 ? plan.days[idx] : null;
    return {
      title: plan.title,
      blockStart: plan.blockStart, blockEnd: plan.blockEnd,
      dayNumber: idx >= 0 ? idx + 1 : null,
      totalDays: (plan.days || []).length,
      week: day ? day.week : null,
      weekLabel: day ? (plan.weeks || []).find(w => w.n === day.week)?.label : null,
      load: day ? day.load : null,
      benchmark: day ? !!day.benchmark : false,
      targets: plan.targets || [],
    };
  },

  // Remaining benchmark days, soonest first — so a test never arrives
  // as a surprise on the morning.
  upcomingBenchmarks(date) {
    const plan = this.load();
    if (!plan) return [];
    const k = this._key(date ? new Date(date) : new Date());
    return (plan.days || []).filter(d => d.benchmark && d.date >= k);
  },
};
