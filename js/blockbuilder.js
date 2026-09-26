// ─────────────────────────────────────────────────────────────
// BLOCK BUILDER — drafts the next weeks of the plan from what was logged.
//
// The written plan ends 25 Oct. Twice before, the next block depended on a
// manual authoring session, and that is where the app stalled. This drafts
// it from the rules the plan already states, for review — nothing is used
// until "Adopt" (MonthPlan.adoptDraft):
//
//  - Strength moves one small step per block, never two. The step is taken
//    only if the retest landed: every prescribed set at the prescribed load.
//    A lift that missed repeats its number ("if a lift stalls, let it
//    stall"). No retest logged → the planned number, flagged.
//  - Easy volume grows 5 min a week on the long run to 70, the bike to 65.
//  - One quality session a week: 4x4 at the full range, then 5x4. The last
//    week is deload + retest: aerobic test Wednesday (day after the bike),
//    strength retests Monday and Friday, tempo not intervals on Saturday.
//  - Skill lines keep their weekdays; the coordination rotation continues.
//
// Pure: reads MonthPlan / History / Generator, returns a draft object.
// ─────────────────────────────────────────────────────────────

const BlockBuilder = {

  // One small step per lift per block (the plan's 16 Oct → 13 Nov numbers).
  STEP_KG: { squat: 2.5, deadlift: 5, 'incline-bench': 2.5, 'overhead-press': 2.5, 'cable-row': 2.5 },

  _key(d) { const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; },
  _add(k, n) { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); return this._key(d); },
  _dow(k) { return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(k + 'T12:00:00').getDay()]; },
  _r(x) { return Math.round(x * 2) / 2; },
  _clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); },

  // The latest complete, non-test week of the plan: the template the draft
  // continues from (week 5 of the Q4 plan: 19–25 Oct).
  _templateWeek(plan) {
    const days = (plan.days || []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
    const byType = {};
    days.slice().sort((a, b) => a.date < b.date ? -1 : 1).forEach(d => {
      if (MonthPlan._isTestDay(d)) return;
      byType[MonthPlan.typeOf(d)] = d;   // latest wins
    });
    const byDow = {};
    days.forEach(d => { if (!MonthPlan._isTestDay(d)) byDow[d.weekday || this._dow(d.date)] = d; });
    return { byType, byDow };
  },

  // How each tested lift went: the latest logged exposure on or after the
  // block's retest days, judged against that day's prescription.
  _retests(plan) {
    const out = {};
    const tests = (plan.days || []).filter(d => d.load === 'test' && d.mainFocusPlan && d.mainFocusPlan.exercises);
    tests.forEach(day => day.mainFocusPlan.exercises.forEach(spec => {
      if (!spec.id || spec.loadKg == null && !spec.reps) return;
      const hist = (typeof History !== 'undefined') ? History.getExerciseHistory(spec.id, 40) : [];
      const hit = hist.filter(h => h.date >= day.date && h.status !== 'in-progress')
        .sort((a, b) => a.date < b.date ? -1 : 1)[0];
      const rec = { id: spec.id, name: spec.name, date: day.date, planned: spec, logged: !!hit };
      if (hit) {
        const want = spec.sets || 1, reps = spec.reps || 0, load = spec.loadKg;
        const good = (hit.sets || []).filter(st => st.completed !== false
          && (st.reps || 0) >= reps && (load == null || (st.weight || 0) >= load));
        const rpes = (hit.sets || []).map(st => st.rpe).filter(Boolean);
        rec.met = good.length >= want;
        rec.maxRpe = rpes.length ? Math.max(...rpes) : null;
        rec.bestLoad = (hit.sets || []).reduce((m, st) => Math.max(m, st.weight || 0), 0) || null;
        rec.loggedDate = hit.date;
      }
      out[spec.id] = rec;
    }));
    return out;
  },

  // Base and target load for a lift. Returns { base, target, why }.
  _liftPlan(id, templateSpec, retest) {
    const step = this.STEP_KG[id] || 0;
    const planned = retest ? retest.planned.loadKg : templateSpec.loadKg;
    if (templateSpec.loadKg == null) return { base: null, target: null, why: '' };
    if (!retest) return { base: templateSpec.loadKg, target: this._r(templateSpec.loadKg + step), why: `not retested — continues from ${templateSpec.loadKg}` };
    if (!retest.logged) return { base: planned, target: this._r(planned + step), why: `no retest logged — using the planned ${planned}; check before adopting` };
    if (retest.met && (retest.maxRpe == null || retest.maxRpe <= 9)) {
      return { base: planned, target: this._r(planned + step), why: `retest ${retest.loggedDate}: 3x${retest.planned.reps} @${planned} landed${retest.maxRpe ? ' at RPE ' + retest.maxRpe : ''} → +${step}` };
    }
    return { base: planned, target: planned, why: `retest ${retest.loggedDate}: missed at ${planned} — repeats (a stalled lift stays put)` };
  },

  draft({ weeks = 3 } = {}) {
    if (typeof MonthPlan === 'undefined') return null;
    const plan = MonthPlan.load();
    if (!plan || !Array.isArray(plan.days) || !plan.days.length) return null;
    const last = plan.days.reduce((m, d) => d.date > m ? d.date : m, plan.days[0].date);
    const from = this._add(last, 1);
    const lastWeekN = plan.days.reduce((m, d) => Math.max(m, d.week || 0), 0);
    const T = this._templateWeek(plan);
    const R = this._retests(plan);
    const notes = [];
    const lifts = {};

    const noteOnce = (id, text) => { if (!lifts[id]) { lifts[id] = true; notes.push(text); } };

    const strengthDay = (type, wi, isTest) => {
      const tpl = T.byType[type];
      if (!tpl || !tpl.mainFocusPlan) return null;
      const exs = [];
      (tpl.mainFocusPlan.exercises || []).forEach(src => {
        const s = this._clone(src);
        if (s.loadKg != null && this.STEP_KG[s.id] != null) {
          const lp = this._liftPlan(s.id, src, R[s.id]);
          noteOnce(s.id, `${s.name}: ${lp.why}. Weeks: ${lp.base} → ${lp.target} → test ${lp.target}.`);
          s.loadKg = wi === 0 ? lp.base : lp.target;
        } else if (s.id === 'pull-up') {
          // Pull-ups: +1 rep a week toward the block's 3x8.
          const r0 = (R['pull-up'] && R['pull-up'].logged && R['pull-up'].met) ? (R['pull-up'].planned.reps || s.reps) : (s.reps || 6);
          s.sets = 3; s.reps = Math.min(8, r0 + 1 + wi);
          noteOnce('pull-up', `Pull-ups: 3x${Math.min(8, r0 + 1)} → 3x8${R['pull-up'] && !R['pull-up'].logged ? ' (no retest logged)' : ''}.`);
        } else if (s.id === 'triceps-dip') {
          s.reps = Math.min(8, (s.reps || 6) + (wi > 0 ? 1 : 0));
          noteOnce('triceps-dip', `Dips: 3x${s.reps} +${s.loadKg} → 3x8 +${s.loadKg}.`);
        }
        exs.push(s);
      });
      if (isTest) {
        // Retest: the two or three main lifts only, like 12 and 16 Oct.
        const keep = type === 'strength-a' ? ['squat', 'incline-bench', 'pull-up'] : ['deadlift', 'overhead-press'];
        const tested = exs.filter(e => keep.includes(e.id));
        if (type === 'strength-a') tested.push({ id: 'plank', name: 'Plank', sets: 3, durationSec: 45, restSec: 60 });
        return { exercises: tested, note: 'RETEST. Ramp properly, then test. Take what moves cleanly, leave what doesn’t.' };
      }
      return { exercises: exs, note: wi === 0 ? 'Block 2 build.' : 'Block 2 peak.' };
    };

    const cardioDay = (type, wi, isTest) => {
      const tpl = T.byType[type];
      if (!tpl || !tpl.mainFocusPlan || !tpl.mainFocusPlan.cardio) return null;
      const c = this._clone(tpl.mainFocusPlan.cardio);
      const p = c.protocol || {};
      if (type === 'z2-run') {
        // The template long run may itself be a check (fixed-hr-test), so its
        // length is warm-up + window + easy, not mainMin.
        const base = p.type === 'fixed-hr-test' ? (p.warmupMin || 0) + (p.testMin || 0) + (p.easyMin || 0) : (p.mainMin || 60);
        const mins = isTest ? 45 : Math.min(70, base + 5 * (wi + 1));
        if (isTest) {
          c.protocol = { type: 'steady', mainMin: mins, hrMax: 153, walkdownMin: 5 };
          c.note = 'Deload week: shorter, same cap.';
          return { cardio: c };
        } else {
          // Weekly aerobic check: the fixed-HR window rides inside the long
          // run, so every week has a running data point, not one per block.
          c.protocol = { type: 'fixed-hr-test', warmupMin: 10, testMin: 30, targetAvgHr: 148, hrCeiling: 156,
            easyMin: Math.max(0, mins - 40), walkdownMin: p.walkdownMin || 5 };
          c.note = `Aerobic check: minutes 10-40 as the test, avg ~148, nothing above 156, record the distance for that window. Then ${Math.max(0, mins - 40)} min easy under 153. Home loop, 08:00. Follows the sprint day, so it is a trend point; the retest is the clean comparison.`;
          return { cardio: c };
        }
      } else if (type === 'z2-bike') {
        p.mainMin = isTest ? 40 : Math.min(65, (p.mainMin || 60) + 5 * wi);
        c.note = isTest ? 'Kept short: tomorrow is the aerobic retest.' : 'Nose breathing throughout. If it breaks, slow down.';
      } else if (type === 'quality-run') {
        if (isTest) {
          c.exercise = { id: 'tempo-run', name: 'Tempo run' };
          c.protocol = { type: 'tempo', warmupMin: 10, reps: 2, workMin: 10, workHr: [153, 165], recoveryMin: 3, cooldownMin: 5 };
          c.note = 'Test week: controlled tempo, not a quality session.';
          return { cardio: c };
        }
        p.type = 'intervals'; p.name = wi === 0 ? 'Norwegian 4x4' : 'Norwegian 5x4';
        p.reps = wi === 0 ? 4 : 5; p.workMin = 4; p.workHr = [175, 186]; p.recoveryMin = 3;
        c.note = wi === 0 ? 'The full range now. First bout controlled.' : 'Extended to 5x4 after four weeks of 4x4.';
      }
      c.protocol = p;
      return { cardio: c };
    };

    const aerobicTest = () => {
      const t = (plan.days || []).filter(d => MonthPlan.typeOf(d) === 'aerobic-test' && d.mainFocusPlan)
        .sort((a, b) => a.date < b.date ? 1 : -1)[0];
      if (!t) return null;
      const mfp = this._clone(t.mainFocusPlan);
      const tgt = (plan.targets || []).find(x => /Fixed-HR/i.test(x.metric));
      const m = tgt && String(tgt.to).match(/([\d.]+-[\d.]+) by (\d+ Nov)/);
      if (mfp.cardio) mfp.cardio.note = `Same conditions as the baseline: home loop, 08:00, day after a Z2 bike. Hold avg ~148, nothing above 156.${m ? ' Target ' + m[1] + ' km.' : ''}`;
      return mfp;
    };

    const days = [], weeksOut = [];
    for (let wi = 0; wi < weeks; wi++) {
      const isTest = wi === weeks - 1;
      const n = lastWeekN + 1 + wi;
      const start = this._add(from, wi * 7);
      weeksOut.push({ n, label: isTest ? 'Deload + retest' : (wi === 0 ? 'Block 2 build' : 'Block 2 peak'),
        start, end: this._add(start, 6), load: isTest ? 'test' : (wi === 0 ? 'build' : 'peak'), qualitySessions: isTest ? 0 : 1,
        intent: isTest ? 'Retests Monday and Friday, aerobic test Wednesday. Tempo, not intervals, on Saturday.'
          : 'Drafted from block 1: one small strength step, easy volume +5 min, one quality run, aerobic check in Thursday\'s long run.' });
      for (let k = 0; k < 7; k++) {
        const date = this._add(start, k);
        const dow = this._dow(date);
        const tplDay = T.byDow[dow];
        if (!tplDay) continue;
        let type = MonthPlan.typeOf(tplDay);
        let mfp = null;
        if (type === 'strength-a' || type === 'strength-b') mfp = strengthDay(type, wi, isTest);
        else if (type === 'plyo-power' && isTest) { type = 'aerobic-test'; mfp = aerobicTest(); }
        else if (type === 'plyo-power') mfp = this._clone(tplDay.mainFocusPlan);
        else if (type !== 'light') mfp = cardioDay(type, wi, isTest);
        const slot = (typeof WEEK_SCAFFOLD !== 'undefined') ? WEEK_SCAFFOLD[type] : null;
        const day = {
          date, weekday: dow, week: n,
          theme: type === 'aerobic-test' ? 'Aerobic retest' : type === 'z2-run' ? (isTest ? 'Zone 2 long run' : 'Zone 2 long run + aerobic check') : (tplDay.theme || (slot && slot.theme) || type),
          variant: type === 'light' ? 'light' : 'standard',
          coordDomain: (typeof Generator !== 'undefined' && Generator.coordDomainFor) ? Generator.coordDomainFor(new Date(date + 'T12:00:00')) : tplDay.coordDomain,
          load: isTest ? 'test' : (wi === 0 ? 'build' : 'peak'),
          dayType: type, skillLine: tplDay.skillLine,
          // Benchmarks are running only: the retest, and the weekly check.
          benchmark: isTest ? type === 'aerobic-test' : type === 'z2-run',
          source: 'draft',
        };
        if (mfp) day.mainFocusPlan = mfp;
        const summary = MonthPlan.summarize(mfp);
        day.focusNote = type === 'light'
          ? 'No main focus. Hang project in Accessory, long passive holds in Mobility.'
          : `${summary}${mfp && (mfp.note || (mfp.cardio && mfp.cardio.note)) ? '. ' + (mfp.note || mfp.cardio.note) : ''}`;
        days.push(day);
      }
    }
    return { from, to: days.length ? days[days.length - 1].date : from, days, weeks: weeksOut, notes, retests: R, createdAt: Date.now() };
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { BlockBuilder };
