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

  // 'YYYY-MM-DD' parsed as a LOCAL date. new Date('2026-10-26') is UTC
  // midnight, which is the previous evening anywhere west of UTC.
  _parse(date) {
    if (!date) return new Date();
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date + 'T12:00:00');
    return new Date(date);
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
      // Days adopted from a block draft (BlockBuilder) live only in the
      // stored plan. A newer seed replaces the seed's own days but keeps
      // those, or re-seeding would silently delete block 2.
      const adopted = (stored && Array.isArray(stored.days))
        ? stored.days.filter(d => d.source === 'draft' && !(seed.days || []).some(x => x.date === d.date))
        : [];
      const next = adopted.length
        ? { ...seed, days: [...seed.days, ...adopted].sort((a, b) => a.date < b.date ? -1 : 1),
            blockEnd: adopted.reduce((m, d) => d.date > m ? d.date : m, seed.blockEnd) }
        : seed;
      DB.set(this.KEY, next);
      return next;
    }
    return stored;
  },

  // ── WHICH PLAN DAY A DATE TAKES ITS CONTENT FROM ──────────────
  // A date normally runs its own plan day. Three cases don't:
  //  - it is changed to another day type (Adjust → a theme swap): the
  //    content comes from the nearest plan day of that type, same week
  //    first, so a Monday done as Z2 bike gets this week's bike protocol
  //    and never keeps Monday's squats (review 2.1);
  //  - it is traded with another date: the caller passes that day in;
  //  - it is past the end of the plan: the latest non-test day of the
  //    same type carries forward — its loads and protocol, never a bare
  //    scaffold default (review 3.1).
  // Returns { day, kind: 'plan'|'borrowed'|'carry-forward'|'none', from }.
  typeOf(day) {
    if (!day) return null;
    const t = day.dayType || day.weekday;
    const slot = (typeof WEEK_SCAFFOLD !== 'undefined') ? WEEK_SCAFFOLD[t] : null;
    return (slot && slot.dayType) || t;
  },

  _isTestDay(day) {
    return !!day && (day.load === 'test' || day.dayType === 'aerobic-test'
      || /RETEST|BASELINE/.test(day.focusNote || '') || /^DONE AS/.test(day.focusNote || ''));
  },

  contentFor(date, dayType) {
    const plan = this.load();
    const days = (plan && Array.isArray(plan.days)) ? plan.days : [];
    const d = this._parse(date);
    const k = this._key(d);
    const own = days.find(x => x.date === k) || null;
    if (own && (!dayType || this.typeOf(own) === dayType)) return { day: own, kind: 'plan', from: own.date };
    if (!dayType) return { day: null, kind: 'none', from: null };

    const t0 = new Date(k + 'T12:00:00').getTime();
    const gap = x => Math.abs(new Date(x.date + 'T12:00:00').getTime() - t0);
    const sameType = days.filter(x => this.typeOf(x) === dayType && x.date !== k);
    if (own) {
      const near = sameType
        .filter(x => (own.week != null && x.week === own.week) || gap(x) <= 3.5 * 864e5)
        .sort((a, b) => gap(a) - gap(b))[0];
      if (near) return { day: near, kind: 'borrowed', from: near.date };
    }
    const src = this.carryForward(k, dayType);
    return src ? { day: src, kind: own ? 'borrowed' : 'carry-forward', from: src._carriedFrom } : { day: null, kind: 'none', from: null };
  },

  // Latest plan day of this type on or before `dateKey` that isn't a test,
  // re-dressed for reuse: its prescription (mainFocusPlan, skill line,
  // interval spec, theme) and nothing date-specific (benchmark flag,
  // coordination domain, prose written for that morning).
  carryForward(dateKey, dayType) {
    const plan = this.load();
    const days = (plan && Array.isArray(plan.days)) ? plan.days : [];
    const src = days
      .filter(x => x.date < dateKey && this.typeOf(x) === dayType && !this._isTestDay(x))
      .sort((a, b) => a.date < b.date ? 1 : -1)[0];
    if (!src) return null;
    const summary = this.summarize(src.mainFocusPlan);
    return {
      date: dateKey, dayType: src.dayType, theme: src.theme, variant: src.variant,
      skillLine: src.skillLine, intervalSpec: src.intervalSpec,
      // The day's own framing ("Block 2 opens…", "measure the pancake
      // today") belonged to that morning; the exercises and doses carry.
      mainFocusPlan: src.mainFocusPlan ? { ...src.mainFocusPlan, note: undefined } : src.mainFocusPlan,
      focusNote: `Carried forward from ${this._short(src.date)}${summary ? ': ' + summary : ''}. The written plan ends ${this._short((plan && plan.blockEnd) || src.date)}.`,
      benchmark: false, _carriedFrom: src.date,
    };
  },

  // One line for a mainFocusPlan: "Squat 3x5 @60, Pull-up 3x6" or the
  // cardio protocol's minutes and cap.
  summarize(mfp) {
    if (!mfp) return '';
    if (mfp.cardio) {
      const p = mfp.cardio.protocol || {};
      const name = (mfp.cardio.exercise && mfp.cardio.exercise.name) || 'Cardio';
      if (p.type === 'intervals' || p.type === 'tempo') return `${name} ${p.reps}x${p.workMin} min at ${p.workHr[0]}-${p.workHr[1]}`;
      if (p.type === 'fixed-hr-test') return `${name}: ${p.testMin} min at avg ~${p.targetAvgHr} (nothing above ${p.hrCeiling})`;
      if (p.mainMin) return `${name} ${p.mainMin} min${p.hrMax ? ' under ' + p.hrMax : ''}`;
      return name;
    }
    return (mfp.exercises || []).map(e => {
      const dose = e.reps ? `${e.sets}x${e.reps}`
        : e.durationSec ? ((e.sets || 1) === 1 && e.durationSec >= 120 ? `${Math.round(e.durationSec / 60)}min` : `${e.sets}x${e.durationSec}s`)
        : e.distanceM ? `${e.sets}x${e.distanceM}m` : `${e.sets || 1}`;
      return `${e.name || e.id} ${dose}${e.loadKg != null ? (e.bodyweightPlus ? ' +' : ' @') + e.loadKg : ''}`;
    }).join(', ');
  },

  // Append drafted days (BlockBuilder) to the stored plan. Existing days on
  // those dates are replaced only if they were drafted too; the written
  // plan always wins. Marked source:'draft' so a newer shipped seed keeps
  // them (ensureSeeded).
  adoptDraft(draft) {
    const plan = this.load();
    if (!plan || !draft || !Array.isArray(draft.days) || !draft.days.length) return null;
    const byDate = new Map((plan.days || []).map(d => [d.date, d]));
    draft.days.forEach(d => {
      const cur = byDate.get(d.date);
      if (!cur || cur.source === 'draft') byDate.set(d.date, { ...d, source: 'draft' });
    });
    const days = [...byDate.values()].sort((a, b) => a.date < b.date ? -1 : 1);
    const weeks = (plan.weeks || []).filter(w => !(draft.weeks || []).some(x => x.n === w.n)).concat(draft.weeks || [])
      .sort((a, b) => a.n - b.n);
    const next = { ...plan, days, weeks, blockEnd: days[days.length - 1].date,
      draftAdoptedAt: Date.now(), draftNotes: draft.notes || [] };
    this.save(next);
    return next;
  },

  _short(k) {
    const d = new Date(k + 'T12:00:00');
    return `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]} ${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
  },

  dayFor(date) {
    const plan = this.load();
    if (!plan || !Array.isArray(plan.days)) return null;
    const k = this._key(this._parse(date));
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
    const k = this._key(this._parse(date));
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
    const d = this._parse(date);
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
    const k = this._key(this._parse(date));
    return (plan.days || []).filter(d => d.benchmark && d.date >= k);
  },
};
