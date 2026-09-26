// ─────────────────────────────────────────────────────────────
// INSIGHTS — pure read-only analysis of data the app already stores.
//
// No DOM, no DB, no globals written. Every function takes the data it
// reads as arguments, so the same code runs in the browser and in the
// Node tests (tests-insights/). Three jobs (app review §5.1, §5.4, §3.3):
//
//   readiness(vitalsDoc, dateKey)        HRV / RHR / sleep vs the user's own
//                                        baselines → good | ok | low | unknown
//   aerobic(cardioLog, opts)             speed at a fixed HR band + Pa:HR
//                                        decoupling for one run or ride
//   aerobicTrend(sessions, opts)         the above per session, runs and
//                                        rides kept apart (not comparable)
//   progression(exerciseId, history, target, opts)
//                                        next-session SUGGESTION for a lift;
//                                        the plan's target is never changed
//
// Data shapes read (see the report / tests for exact field lists):
//   vitals  { days: { 'YYYY-MM-DD': { rhr, hrv, hrvN, sleep, deep, rem } } }
//           (tools/health_vitals.py; Vitals.load() in js/stats.js)
//   cardio  ex.cardioLog { series:[{t,hr,sp,alt}] (30s bins, sp m/s),
//           structure:{kind}, elevGainM, distanceKm, duration }
//           (RuttioImport.review → Importer.applyRun, js/import.js)
//   sets    ex.sets[{ weight, reps, duration, rpe?, note, completed }]
//           (LiveSession.logSet / HevyImport._toAppSets, js/app.js)
// ─────────────────────────────────────────────────────────────

const Insights = {

  // ── date helpers (UTC arithmetic on 'YYYY-MM-DD'; no local-TZ drift) ──
  _addDays(key, n) {
    const [y, m, d] = key.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return t.toISOString().slice(0, 10);
  },
  _mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; },
  _r(v, dp) { if (v == null || isNaN(v)) return null; const f = Math.pow(10, dp || 0); return Math.round(v * f) / f; },

  // ═════════════════════════════════════════════════════════
  // 1. READINESS
  // ═════════════════════════════════════════════════════════
  READINESS: {
    HRV_BASE_DAYS: 60, HRV_BASE_MIN_N: 20,   // same window as the Stats HRV band
    HRV_AVG_DAYS: 7,   HRV_AVG_MIN_N: 4,     // same as the Stats 7-day line
    // Tuned on the real vitals.json (Mar–Sep 2026): the daily SD is ~16 ms
    // (CV ~21%), so a 7-day average never once fell below mean − 1 SD (the
    // lowest was −0.82 SD). At −0.5 SD — the usual "smallest worthwhile
    // change" band for HRV — it marks exactly three stretches: 13–18 Jun,
    // 4–6 Jul (RHR 71, HRV 39) and 28 Aug–7 Sep. −1 SD (the Stats chart's
    // shaded band) is kept as the extreme case.
    HRV_AVG_SD: 0.5,
    HRV_AVG_EXTREME_SD: 1.0,
    HRV_NIGHT_SD: 1.5,                       // single night below mean − 1.5 SD
    HRV_NIGHT_MIN_READINGS: 3,               // a 2-reading day is too noisy to flag alone
    RHR_BASE_DAYS: 60, RHR_BASE_MIN_N: 20,
    RHR_DELTA: 5, RHR_EXTREME_DELTA: 8,      // bpm over baseline
    SLEEP_SHORT: 360, SLEEP_EXTREME: 270,    // minutes (6h, 4.5h)
    PARTIAL_SLEEP_MIN: 180,                  // = Vitals.PARTIAL_SLEEP_MIN: watch off, not a night
  },

  _validVital(metric, v) {
    if (v == null || isNaN(v)) return false;
    if (metric === 'sleep') return v >= this.READINESS.PARTIAL_SLEEP_MIN;
    return true;
  },

  // Same maths as Vitals._trailing (js/stats.js), but reads the doc it is
  // given instead of DB, so it stays pure. Window ends at `date` inclusive.
  // Population SD, like the chart band.
  trailing(doc, metric, date, win, minN) {
    if (!doc || !doc.days) return null;
    const vals = [];
    for (let i = 0; i < win; i++) {
      const r = doc.days[this._addDays(date, -i)];
      if (r && this._validVital(metric, r[metric])) vals.push(r[metric]);
    }
    if (vals.length < (minN || Math.ceil(win / 2))) return null;
    const mean = this._mean(vals);
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
    return { mean, sd, n: vals.length };
  },

  _hasDay(doc, key) {
    const r = doc && doc.days && doc.days[key];
    return !!(r && (r.hrv != null || r.rhr != null || r.sleep != null));
  },

  _lastDate(doc) {
    if (!doc || !doc.days) return null;
    const keys = Object.keys(doc.days).filter(k => this._hasDay(doc, k)).sort();
    return keys.length ? keys[keys.length - 1] : null;
  },

  // dateKey is the morning being judged. Vitals file last night's sleep and
  // that day's HRV/RHR under the same date (health_vitals.py: sleep on the
  // wake date), so `dateKey` itself is "last night". If that day is not in
  // the file yet, yesterday is used (asOf says so); with neither, unknown.
  readiness(vitalsDoc, dateKey) {
    const C = this.READINESS;
    const lastDate = this._lastDate(vitalsDoc);
    let asOf = null;
    if (this._hasDay(vitalsDoc, dateKey)) asOf = dateKey;
    else if (this._hasDay(vitalsDoc, this._addDays(dateKey, -1))) asOf = this._addDays(dateKey, -1);
    if (!asOf) {
      return {
        level: 'unknown', stale: true, lastDate, asOf: null, flags: [],
        reasons: [lastDate ? `No vitals since ${lastDate} — import a fresh export` : 'No vitals imported'],
        metrics: {},
      };
    }
    const day = vitalsDoc.days[asOf];
    const reasons = [], flags = [];   // flags: { key, extreme }
    const m = {};

    // HRV — 7-day average against the 60-day band, and last night alone.
    const base = this.trailing(vitalsDoc, 'hrv', asOf, C.HRV_BASE_DAYS, C.HRV_BASE_MIN_N);
    const avg7 = this.trailing(vitalsDoc, 'hrv', asOf, C.HRV_AVG_DAYS, C.HRV_AVG_MIN_N);
    m.hrv = day.hrv != null ? day.hrv : null;
    m.hrvN = day.hrvN != null ? day.hrvN : null;
    m.hrv7 = avg7 ? this._r(avg7.mean, 1) : null;
    m.hrvBase = base ? this._r(base.mean, 1) : null;
    m.hrvSd = base ? this._r(base.sd, 1) : null;
    m.hrvLo = base ? this._r(base.mean - C.HRV_AVG_SD * base.sd, 1) : null;   // the 7-day flag line
    if (base && avg7) {
      if (avg7.mean < base.mean - C.HRV_AVG_EXTREME_SD * base.sd) {
        flags.push({ key: 'hrv7', extreme: true });
        reasons.push(`HRV 7-day ${Math.round(avg7.mean)} well under your usual ${Math.round(base.mean)} ms`);
      } else if (avg7.mean < base.mean - C.HRV_AVG_SD * base.sd) {
        flags.push({ key: 'hrv7', extreme: false });
        reasons.push(`HRV 7-day ${Math.round(avg7.mean)} under your usual ${Math.round(base.mean)} ms`);
      }
    }
    if (base && m.hrv != null && (m.hrvN == null || m.hrvN >= C.HRV_NIGHT_MIN_READINGS)
        && m.hrv < base.mean - C.HRV_NIGHT_SD * base.sd && !flags.some(f => f.key === 'hrv7')) {
      flags.push({ key: 'hrvNight', extreme: false });
      reasons.push(`HRV ${Math.round(m.hrv)} ms, low against your ${Math.round(base.mean)} average`);
    }

    // RHR — baseline excludes the 3 days being checked so an elevated
    // stretch doesn't drag its own baseline up.
    const rbase = this.trailing(vitalsDoc, 'rhr', this._addDays(asOf, -3), C.RHR_BASE_DAYS, C.RHR_BASE_MIN_N);
    m.rhr = day.rhr != null ? day.rhr : null;
    m.rhrBase = rbase ? this._r(rbase.mean, 1) : null;
    if (rbase) {
      const last3 = [0, 1, 2].map(i => (vitalsDoc.days[this._addDays(asOf, -i)] || {}).rhr).filter(v => v != null);
      const high = last3.filter(v => v >= rbase.mean + C.RHR_DELTA).length;
      const veryHigh = last3.filter(v => v >= rbase.mean + C.RHR_EXTREME_DELTA).length;
      m.rhrHighDays = high;
      if (high >= 2) {
        const extreme = veryHigh >= 2 || high === 3 && last3.length === 3;
        flags.push({ key: 'rhr', extreme });
        reasons.push(`Resting HR up ${Math.round(Math.max(...last3) - rbase.mean)} bpm on ${high} of the last 3 days (usual ${Math.round(rbase.mean)})`);
      }
    }

    // Sleep — last night only. A night under 3h is the watch coming off.
    m.sleepMin = day.sleep != null ? day.sleep : null;
    m.sleepPartial = day.sleep != null && !this._validVital('sleep', day.sleep);
    m.deep = day.deep != null ? day.deep : null;
    m.rem = day.rem != null ? day.rem : null;
    if (m.sleepMin != null && !m.sleepPartial && m.sleepMin < C.SLEEP_SHORT) {
      const extreme = m.sleepMin < C.SLEEP_EXTREME;
      flags.push({ key: 'sleep', extreme });
      const h = Math.floor(m.sleepMin / 60), mm = m.sleepMin % 60;
      reasons.push(`Slept ${h}h${String(mm).padStart(2, '0')}`);
    }

    const measured = (base && avg7 ? 1 : 0) + (rbase && m.rhr != null ? 1 : 0) + (m.sleepMin != null && !m.sleepPartial ? 1 : 0);
    let level;
    if (!measured) level = 'unknown';
    else if (flags.length >= 2 || flags.some(f => f.extreme)) level = 'low';
    else if (flags.length === 1) level = 'ok';
    else level = 'good';
    if (level === 'good') reasons.push('HRV, resting HR and sleep all in your normal range');
    if (level === 'unknown') reasons.push('Not enough history for baselines yet');
    if (asOf !== dateKey) reasons.push(`Using ${asOf} — ${dateKey} not imported yet`);

    return { level, stale: asOf !== dateKey, lastDate, asOf, flags: flags.map(f => f.key + (f.extreme ? '!' : '')), reasons, metrics: m };
  },

  // ═════════════════════════════════════════════════════════
  // 2. AEROBIC — speed at fixed HR, decoupling
  // ═════════════════════════════════════════════════════════
  AEROBIC: {
    HR_LO: 139, HR_HI: 153,        // Karvonen Z2, RHR 54 / max 196 (data/monthplan.js)
    WARMUP_SEC: 600,               // first 10 min excluded (HR still climbing)
    MIN_BAND_MIN: 10,              // minutes in band before speed-at-HR is reported
    MIN_STEADY_MIN: 20,            // minutes of moving data after warm-up for decoupling
    STOP_MS: { run: 1.0, bike: 2.0 },   // below this (m/s) = stopped; 1.0 m/s = 3.6 km/h
    HILLY_M_PER_KM: 15,
  },

  // run | bike | null from an exercise (id / name) or a cardioLog.
  kindOf(ex) {
    const s = [ex && ex.id, ex && ex.name, ex && ex.sport, ex && ex.cardioLog && ex.cardioLog.sport].filter(Boolean).join(' ').toLowerCase();
    if (/cycl|bike|spin|ride|velo/.test(s)) return 'bike';
    if (/run|jog|sprint|stride/.test(s)) return 'run';
    return null;
  },

  aerobic(cardioLog, opts) {
    const C = this.AEROBIC, o = opts || {};
    const hrLo = o.hrLo || C.HR_LO, hrHi = o.hrHi || C.HR_HI;
    const warm = o.warmupSec != null ? o.warmupSec : C.WARMUP_SEC;
    // Two stored shapes: the importer's {t, hr, sp, alt} objects, and the
    // compact [t, hr, (sp)] pairs the Sep backfill wrote (js/stats.js reads
    // both the same way).
    const series = ((cardioLog && cardioLog.series) || []).map(p => Array.isArray(p) ? { t: p[0], hr: p[1], sp: p[2] != null ? p[2] : null } : p);
    const bin = series.length > 1 ? (series[1].t - series[0].t) || 30 : 30;
    let kind = o.kind || this.kindOf(cardioLog) || null;
    const out = { valid: false, why: '', kind, avgHr: null, minutes: 0,
      speedAtHr: null, decoupling: null, hrDrift: null, hilly: false, notes: [] };

    if (!series.length) { out.why = 'no 30s series (manual log or pre-import session)'; return out; }
    const sps = series.map(p => p.sp).filter(v => v != null && v > 0).sort((a, b) => a - b);
    if (!kind) kind = out.kind = sps.length && sps[Math.floor(sps.length / 2)] > 5.5 ? 'bike' : 'run';
    const stop = o.stopSpeed || C.STOP_MS[kind] || 1.0;

    // Post-warm-up bins with heart rate. HR null at the head (the watch
    // needs a lock) or in gaps is just absent — never averaged in as 0.
    const post = series.filter(p => p.t >= warm && p.hr != null && p.hr > 0);
    const noSpeed = !sps.length;
    const moving = noSpeed ? post : post.filter(p => p.sp != null && p.sp >= stop);
    const stopped = noSpeed ? 0 : post.length - moving.length;
    out.minutes = this._r(moving.length * bin / 60, 1);
    out.avgHr = moving.length ? Math.round(this._mean(moving.map(p => p.hr))) : null;
    if (series.length && series[0].hr == null) {
      const first = series.find(p => p.hr != null);
      if (first) out.notes.push(`HR started at ${Math.floor(first.t / 60)}:${String(first.t % 60).padStart(2, '0')}`);
    }
    if (stopped >= 2) out.notes.push(`${this._r(stopped * bin / 60, 1)} min stopped, excluded`);
    if (!post.length) { out.why = 'no heart rate after the warm-up'; return out; }

    const structure = cardioLog.structure && cardioLog.structure.kind;
    const intervals = structure === 'intervals';
    if (intervals) out.notes.push('interval session — not a steady-state run');

    // Hills: speed is used as-is (no grade adjustment); flag it so a hilly
    // loop isn't read as the engine getting worse.
    const km = cardioLog.distanceKm || (moving.reduce((a, p) => a + (p.sp || 0) * bin, 0) / 1000);
    if (cardioLog.elevGainM != null && km > 0 && cardioLog.elevGainM / km >= C.HILLY_M_PER_KM) {
      out.hilly = true;
      out.notes.push(`hilly (${Math.round(cardioLog.elevGainM)} m gain) — speed not grade-adjusted`);
    }

    // Speed at HR — moving bins whose HR sits in the band.
    if (noSpeed) {
      out.notes.push('no speed in the series (indoor) — HR drift only');
    } else {
      const inBand = moving.filter(p => p.hr >= hrLo && p.hr <= hrHi);
      const mins = inBand.length * bin / 60;
      if (mins >= C.MIN_BAND_MIN && !intervals) {
        const ms = this._mean(inBand.map(p => p.sp));
        out.speedAtHr = { hrLo, hrHi, kmh: this._r(ms * 3.6, 2), paceSecPerKm: Math.round(1000 / ms),
          minutes: this._r(mins, 1), avgHr: Math.round(this._mean(inBand.map(p => p.hr))) };
      } else if (!intervals) {
        out.notes.push(`only ${this._r(mins, 1)} min at ${hrLo}–${hrHi}`);
      }
    }

    // Decoupling — first vs second half of the moving, post-warm-up time.
    // Pa:HR = (EF1 − EF2) / EF1, EF = speed / HR. Positive = HR drifted up
    // (or speed down) for the same work. For a ride with no speed, report
    // HR drift only.
    if (moving.length * bin / 60 >= C.MIN_STEADY_MIN && !intervals) {
      const half = Math.floor(moving.length / 2);
      const a = moving.slice(0, half), b = moving.slice(half);
      const hr1 = this._mean(a.map(p => p.hr)), hr2 = this._mean(b.map(p => p.hr));
      out.hrDrift = this._r(hr2 - hr1, 1);
      if (!noSpeed) {
        const ef1 = this._mean(a.map(p => p.sp)) / hr1, ef2 = this._mean(b.map(p => p.sp)) / hr2;
        out.decoupling = this._r((ef1 - ef2) / ef1 * 100, 1);
      }
    } else if (!intervals) {
      out.notes.push(`under ${C.MIN_STEADY_MIN} min steady after warm-up — no decoupling`);
    }

    out.valid = !!(out.speedAtHr || out.decoupling != null || (noSpeed && out.hrDrift != null));
    out.why = out.valid ? '' : (intervals ? 'interval session' : (out.notes[out.notes.length - 1] || 'not enough steady data'));
    return out;
  },

  // Every cardio log with a series, oldest first, split by kind.
  // `sessions` are stored sessions (History.getSession) — { date, blocks[] }.
  aerobicTrend(sessions, opts) {
    const res = { run: [], bike: [] };
    (sessions || []).forEach(s => {
      if (!s || !s.blocks) return;
      s.blocks.forEach(b => (b.exercises || []).forEach(ex => {
        const log = ex.cardioLog;
        if (!log || !log.series || !log.series.length) return;
        const kind = this.kindOf(ex) || this.kindOf(log);
        const a = this.aerobic(log, { ...(opts || {}), kind: kind || undefined });
        const pt = { date: s.date, kind: a.kind, exerciseId: ex.id || null,
          speedAtHr: a.speedAtHr, decoupling: a.decoupling, hrDrift: a.hrDrift,
          avgHr: a.avgHr, minutes: a.minutes, hilly: a.hilly, valid: a.valid, why: a.why };
        (res[a.kind] || res.run).push(pt);
      }));
    });
    res.run.sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : 0);
    res.bike.sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : 0);
    return res;
  },

  // ═════════════════════════════════════════════════════════
  // 3. PROGRESSION — suggestion only
  // ═════════════════════════════════════════════════════════
  // Load steps (kg). Plates: the user's logged loads (58.5, 55.5, 51.5, 54)
  // are 0.5 kg-granular, so everything rounds to 0.5 kg — a 1.25 kg plate
  // step would turn 54 → 5% into 50 instead of 51.5.
  PROGRESSION: {
    ROUND: 0.5,
    RPE_OK: 8,
    DECREASE_PCT: 0.05,
    REP_CAP_OVER: 2,          // bodyweight: target reps +2, then add load
    STEP: {
      // lower-body barbell: 2.5, or 5 when every set was RPE ≤ 7
      squat: { kg: 2.5, easyKg: 5 }, deadlift: { kg: 2.5, easyKg: 5 },
      'front-squat': { kg: 2.5, easyKg: 5 }, 'romanian-deadlift': { kg: 2.5, easyKg: 5 },
      'hip-thrust': { kg: 2.5, easyKg: 5 },
      // upper-body pressing: ~3–4% of a 35–55 kg working load
      'incline-bench': { kg: 2 }, 'bench-press': { kg: 2 },
      'overhead-press': { kg: 1 },
      'cable-row': { kg: 2.5 }, 'barbell-row': { kg: 2.5 },
    },
    DEFAULT_LOWER: { kg: 2.5, easyKg: 5 },
    DEFAULT_UPPER: { kg: 2 },
    BODYWEIGHT_ADD: 2.5,
    HOLD_STEP_SEC: 5,
  },

  _roundLoad(kg) { const s = this.PROGRESSION.ROUND; return Math.round(kg / s) * s; },

  _rpeOf(set) {
    if (set.rpe != null && !isNaN(set.rpe)) return +set.rpe;
    const m = /RPE\s*([\d.]+)/i.exec(set.note || '');   // Hevy import keeps RPE in the note
    return m ? parseFloat(m[1]) : null;
  },

  _isWarmup(set) { return /warm/i.test(set.note || '') || set.kind === 'warmup'; },

  // History in, exposures out: newest first, one per date, working sets only.
  // Accepts History.getExerciseHistory() rows ({date, sets, target?}) or
  // stored sessions ({date, blocks[]}), whichever the caller has.
  _exposures(exerciseId, history) {
    const byDate = {};
    (history || []).forEach(h => {
      if (!h) return;
      const add = (date, sets, target) => {
        const good = (sets || []).filter(s => s && s.completed !== false && !this._isWarmup(s));
        if (!good.length) return;
        const e = byDate[date] || (byDate[date] = { date, sets: [], target: null });
        e.sets = e.sets.concat(good);
        if (target && !e.target) e.target = target;
      };
      if (h.blocks) {
        h.blocks.forEach(b => (b.exercises || []).forEach(ex => {
          if (ex.id === exerciseId) add(h.date, ex.sets, ex.target);
        }));
      } else if (h.sets) add(h.date, h.sets, h.target);
    });
    return Object.values(byDate).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  },

  _lib(exerciseId, opts) {
    if (opts && opts.lib) return opts.lib;
    if (typeof LIBRARY !== 'undefined') return LIBRARY.find(e => e.id === exerciseId) || null;
    return null;
  },

  _mode(lib, target) {
    if (lib && lib.bodyweightBase) return 'bodyweight';
    if (target && target.durationSec && !target.reps) return 'hold';
    if (lib && (lib.logType === 'hold' || lib.logType === 'duration' || lib.logType === 'time')) return 'hold';
    if (target && target.loadKg != null) return 'load';
    if (lib && lib.logType === 'weight+reps') return 'load';
    return 'reps';
  },

  _step(exerciseId, lib) {
    const P = this.PROGRESSION;
    if (P.STEP[exerciseId]) return P.STEP[exerciseId];
    const s = [exerciseId, lib && lib.name, lib && lib.subcategory].filter(Boolean).join(' ').toLowerCase();
    return /squat|deadlift|lunge|hinge|hip thrust|leg press|rdl|split/.test(s) ? P.DEFAULT_LOWER : P.DEFAULT_UPPER;
  },

  // Judge one exposure against a target. Returns { met, workLoad, reps[], rpe }.
  // workLoad = the heaviest load at which `sets` sets reached `reps` reps
  // (ramp sets under it don't count against it).
  _judge(exp, target, mode) {
    const S = target.sets || 1, R = target.reps || 0;
    const rpes = exp.sets.map(s => this._rpeOf(s)).filter(v => v != null);
    const res = { met: false, workLoad: null, rpe: rpes.length ? Math.max(...rpes) : null, done: 0 };
    if (mode === 'hold') {
      const T = target.durationSec || 0;
      res.done = exp.sets.filter(s => (s.duration || 0) >= T).length;
      res.met = T > 0 && res.done >= S;
      res.best = Math.max(0, ...exp.sets.map(s => s.duration || 0));
      return res;
    }
    const loads = [...new Set(exp.sets.map(s => s.weight || 0))].sort((a, b) => b - a);
    for (const L of loads) {
      if (exp.sets.filter(s => (s.weight || 0) >= L && (s.reps || 0) >= R).length >= S) { res.workLoad = L; break; }
    }
    const tl = target.loadKg || 0;
    res.met = res.workLoad != null && res.workLoad >= tl - 1e-9;
    // Reps held at the working load (for double progression).
    const at = exp.sets.filter(s => (s.weight || 0) >= (res.workLoad != null ? res.workLoad : tl)).map(s => s.reps || 0)
      .sort((a, b) => b - a).slice(0, S);
    res.minReps = at.length >= S ? Math.min(...at) : 0;
    res.done = exp.sets.filter(s => (s.weight || 0) >= tl - 1e-9 && (s.reps || 0) >= R).length;
    return res;
  },

  // Target when the plan gave none: the last exposure's own top sets.
  _impliedTarget(exp, mode) {
    if (mode === 'hold') {
      const d = exp.sets.map(s => s.duration || 0).sort((a, b) => b - a);
      return { sets: exp.sets.length, durationSec: d[d.length - 1] || d[0] };
    }
    const top = Math.max(...exp.sets.map(s => s.weight || 0));
    const atTop = exp.sets.filter(s => (s.weight || 0) === top);
    return { sets: atTop.length, reps: Math.max(...atTop.map(s => s.reps || 0)), loadKg: top || null };
  },

  // target: the plan's prescription for the next exposure (Generator's
  // ex.target: { sets, reps, loadKg, durationSec }), optional. Each past
  // exposure is judged against the target it was done under when the
  // stored session carries one (ex.target), else against `target`, else
  // against its own top sets. opts: { lib } (library entry; defaults to the
  // LIBRARY global when present).
  progression(exerciseId, history, target, opts) {
    const P = this.PROGRESSION, o = opts || {};
    const lib = this._lib(exerciseId, o);
    const exps = this._exposures(exerciseId, history);
    if (!exps.length) {
      return { action: 'none', loadKg: null, reps: null, sets: null, durationSec: null,
        reason: 'No logged sets yet — do the plan’s prescription.' };
    }
    const last = exps[0];
    const implied = !last.target && !target;
    const tgt = last.target || target || this._impliedTarget(last, this._mode(lib, null));
    const mode = this._mode(lib, tgt);
    const j = this._judge(last, tgt, mode);
    const prevT = exps[1] && (exps[1].target || target || tgt);
    const prev = exps[1] ? this._judge(exps[1], prevT, mode) : null;

    const S = tgt.sets || 1, R = tgt.reps || null, TL = tgt.loadKg != null ? tgt.loadKg : null;
    const base = { sets: S, reps: R, loadKg: TL, durationSec: tgt.durationSec || null };
    const res = (action, fields, reason) => {
      const r = { action, ...base, ...fields, reason };
      if (implied) r.reason += ' (no plan target — judged against your last session)';
      if (target && target.loadKg != null && r.loadKg != null && Math.abs(target.loadKg - r.loadKg) > 1e-9) {
        r.reason += ` Plan says ${target.loadKg} kg.`;
      }
      return r;
    };
    const rpeTxt = j.rpe != null ? ` @ RPE ${j.rpe}` : '';
    const scheme = mode === 'hold' ? `${S}×${tgt.durationSec}s` : `${S}×${R}` + (TL ? (mode === 'bodyweight' ? ` +${TL} kg` : ` @ ${TL} kg`) : '');

    // ── missed ───────────────────────────────────────────
    if (!j.met) {
      if (prev && !prev.met) {
        if (mode === 'hold') {
          const d = Math.max(5, Math.min(tgt.durationSec - 5, Math.round((tgt.durationSec * 0.9) / 5) * 5));
          return res('decrease', { durationSec: d }, `Missed ${scheme} two sessions running — hold ${d}s and build back.`);
        }
        if (mode === 'load' && TL) {
          const kg = this._roundLoad(TL * (1 - P.DECREASE_PCT));
          return res('decrease', { loadKg: kg }, `Missed ${scheme} two sessions running — reset 5% to ${kg} kg.`);
        }
        if (mode === 'bodyweight' && TL) {
          const kg = Math.max(0, this._roundLoad(TL - P.BODYWEIGHT_ADD));
          return res('decrease', { loadKg: kg || null }, `Missed ${scheme} two sessions running — ${kg ? 'drop to +' + kg + ' kg' : 'go back to bodyweight'}.`);
        }
        const reps = Math.max(1, (R || 1) - 1);
        return res('decrease', { reps }, `Missed ${scheme} two sessions running — do ${S}×${reps} clean, then build back.`);
      }
      const got = mode === 'hold' ? `${j.done}/${S} holds reached ${tgt.durationSec}s` : `${j.done}/${S} sets reached ${R} reps`;
      return res('repeat', {}, `Last time ${got} of ${scheme} — repeat it.`);
    }

    // ── met: easy enough to move? ────────────────────────
    if (j.rpe != null && j.rpe > P.RPE_OK) {
      return res('repeat', {}, `Hit ${scheme}${rpeTxt} — repeat until it moves at RPE ${P.RPE_OK} or under.`);
    }
    if (j.rpe == null) {
      const prevOk = prev && prev.met && (prev.rpe == null || prev.rpe <= P.RPE_OK);
      if (!prevOk) return res('repeat', {}, `Hit ${scheme}, no RPE logged — one more clean session before adding (log RPE to move sooner).`);
    }
    const why = j.rpe != null ? `Hit ${scheme}${rpeTxt}` : `Hit ${scheme} two sessions running (no RPE logged)`;

    if (mode === 'hold') {
      const d = (tgt.durationSec || 0) + P.HOLD_STEP_SEC * (tgt.durationSec >= 30 ? 2 : 1);
      return res('increase', { durationSec: d }, `${why} — hold ${d}s.`);
    }
    if (mode === 'reps') {
      const reps = Math.max(R || 0, j.minReps || 0) + 1;
      return res('increase', { reps }, `${why} — ${S}×${reps}.`);
    }
    if (mode === 'bodyweight') {
      // Double progression: +1 rep a session up to target+2 at the same
      // added load, then +2.5 kg back at the target reps.
      const cap = (R || 0) + P.REP_CAP_OVER;
      const doneReps = Math.max(R || 0, j.minReps || 0);
      const add = j.workLoad || 0;
      if (doneReps < cap) {
        return res('increase', { reps: doneReps + 1, loadKg: add || null }, `${why} — ${S}×${doneReps + 1}${add ? ' at +' + add + ' kg' : ''}.`);
      }
      const kg = this._roundLoad(add + P.BODYWEIGHT_ADD);
      return res('increase', { reps: R, loadKg: kg }, `${why}, ${S}×${doneReps} done — add load: ${S}×${R} at +${kg} kg.`);
    }
    const step = this._step(exerciseId, lib);
    const easy = step.easyKg && j.rpe != null && j.rpe <= 7;
    const inc = easy ? step.easyKg : step.kg;
    const kg = this._roundLoad(Math.max(j.workLoad || 0, TL || 0) + inc);
    return res('increase', { loadKg: kg }, `${why} — try ${S}×${R} @ ${kg} kg (+${inc}).`);
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Insights };
