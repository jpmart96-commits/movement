// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — APP LOGIC
// app.js — storage, profile, generator, history, timers
// ─────────────────────────────────────────────────────────────

'use strict';

// ═════════════════════════════════════════════════════════════
// 1. STORAGE
// ═════════════════════════════════════════════════════════════

const DB = {
  PREFIX: 'pb_',

  _key(k) { return this.PREFIX + k; },

  get(k) {
    try {
      const raw = localStorage.getItem(this._key(k));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  set(k, v) {
    try {
      localStorage.setItem(this._key(k), JSON.stringify(v));
      return true;
    } catch { return false; }
  },

  remove(k) {
    localStorage.removeItem(this._key(k));
  },

  // Export everything as a JSON blob
  exportAll() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(this.PREFIX)) {
        try { out[k.slice(this.PREFIX.length)] = JSON.parse(localStorage.getItem(k)); }
        catch { out[k.slice(this.PREFIX.length)] = localStorage.getItem(k); }
      }
    }
    return out;
  },

  importAll(data) {
    Object.entries(data).forEach(([k, v]) => this.set(k, v));
  },
};


// ═════════════════════════════════════════════════════════════
// 2. PROFILE
// ═════════════════════════════════════════════════════════════

const Profile = {
  DEFAULTS: {
    // Exercise states: { [exerciseId]: 'active' | 'notyet' | 'excluded' }
    exerciseStates: {},
    // Goal milestone indices: { [goalId]: number }
    goalMilestones: {},
    // Equipment owned: { [equipmentId]: boolean }
    equipment: {},
    // Rest timer overrides per exercise: { [exerciseId]: seconds }
    restOverrides: {},
    // Exercise ids tracked for weight / estimated-1RM (major compounds only —
    // toggle from Settings → Exercise library → Edit).
    trackedLifts: ['squat', 'incline-bench', 'deadlift', 'overhead-press', 'pull-up'],
    // General settings
    settings: {
      weightUnit: 'kg',
      defaultRestHeavy: 180,
      defaultRestAcc: 90,
      defaultRestSkill: 120,
      defaultRestPrehab: 60,
      defaultRestPower: 120,
      waketime: '06:30',
      breakfastTime: '07:45',
      // AI session generation — bring-your-own-key. Sent directly from the
      // browser to Anthropic (anthropic-dangerous-direct-browser-access),
      // never through any server of ours, since this app has none. Stored
      // in localStorage like everything else here — fine for a personal,
      // single-user tool, but never share/host this build publicly with
      // your key saved.
      anthropicApiKey: '',
      aiModel: 'claude-sonnet-5',
      // Heart-rate zone ceilings, bpm — each value is the TOP of that zone,
      // z5 being everything above z4. User-supplied 2026-09-20. Used by
      // js/import.js to report what zone a run was actually spent in, which
      // is the whole point of a Zone2 day having a Zone2 label.
      // Karvonen from RHR 54 / max 196. Each value is that zone's ceiling;
      // z5 is everything above z4. Easy work means at or under z2.
      hrZones: { z1: 133, z2: 153, z3: 168, z4: 182 },
      // Physiology the app cannot derive on its own. Shown on Progress and
      // used to sanity-check the zone model.
      restingHR: null,
      maxHR: null,
      vo2max: null,
      bodyweightKg: null,
      // 'system' | 'light' | 'dark'. The stylesheet follows the OS unless
      // <html data-theme> says otherwise; this is what sets it.
      theme: 'system',
    },
  },

  load() {
    const stored = DB.get('profile');
    if (!stored) return this._init();
    // Merge with defaults to handle new fields
    return { ...this.DEFAULTS, ...stored,
      settings: { ...this.DEFAULTS.settings, ...(stored.settings || {}) } };
  },

  save(profile) {
    DB.set('profile', profile);
  },

  _init() {
    // Build default exercise states from library
    const states = {};
    LIBRARY.forEach(ex => { states[ex.id] = ex.defaultState; });

    // Build default equipment (all true — user can disable)
    const equip = {};
    EQUIPMENT.forEach(e => { equip[e.id] = true; });

    // Build default goal milestones
    const milestones = {};
    GOALS.forEach(g => { milestones[g.id] = 0; });

    const profile = {
      ...this.DEFAULTS,
      exerciseStates: states,
      equipment: equip,
      goalMilestones: milestones,
    };
    this.save(profile);
    return profile;
  },

  getExerciseState(profile, id) {
    return profile.exerciseStates[id] || 'active';
  },

  setExerciseState(profile, id, state) {
    profile.exerciseStates[id] = state;
    this.save(profile);
  },

  getGoalMilestone(profile, goalId) {
    const g = GOALS.find(g => g.id === goalId);
    if (!g) return null;
    const idx = profile.goalMilestones[goalId] ?? 0;
    return { current: g.milestones[idx], next: g.milestones[idx + 1] || null, idx };
  },

  advanceGoalMilestone(profile, goalId) {
    const g = GOALS.find(g => g.id === goalId);
    if (!g) return;
    const cur = profile.goalMilestones[goalId] ?? 0;
    if (cur < g.milestones.length - 1) {
      profile.goalMilestones[goalId] = cur + 1;
      this.save(profile);
    }
  },

  getRestDefault(profile, restGroup) {
    const s = profile.settings;
    const map = {
      'strength-heavy': s.defaultRestHeavy,
      'strength-acc':   s.defaultRestAcc,
      'skill':          s.defaultRestSkill,
      'prehab':         s.defaultRestPrehab,
      'power':          s.defaultRestPower,
      'rings':          s.defaultRestSkill,
      'flexibility':    0,
      'somatic':        0,
      'meditation':     0,
      'cardio':         0,
    };
    return map[restGroup] ?? 90;
  },

  isTracked(profile, id) {
    return (profile.trackedLifts || []).includes(id);
  },

  toggleTracked(profile, id) {
    const list = profile.trackedLifts || (profile.trackedLifts = []);
    const idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1); else list.push(id);
    this.save(profile);
    return list.includes(id);
  },
};


// ═════════════════════════════════════════════════════════════
// 3. SESSION HISTORY
// ═════════════════════════════════════════════════════════════

const History = {
  // Save a completed session
  saveSession(session) {
    const id = 'session_' + Date.now();
    DB.set(id, session);

    // Update index
    const index = DB.get('session_index') || [];
    index.unshift({ id, date: session.date, theme: session.theme, themes: session.themes, duration: session.duration, source: session.source || 'generated', status: session.status || 'completed',
      ...(session.planRef ? { planRef: session.planRef } : {}) });
    // No cap: the index is a few hundred bytes per session, and dropping the
    // oldest entry here hid real sessions from Stats while sync.js pull()
    // rebuilds the full index from the sessions table anyway.
    DB.set('session_index', index);

    // Update exercise history cache
    this._updateExerciseCache(session);

    return id;
  },

  // Update an existing history entry in place — used when a live session
  // is "logged" mid-workout (checkpoint) and then logged again later as
  // more exercises get checked off, so we don't pile up duplicate entries
  // for the same session. Falls back to a normal save if the id is unknown.
  updateSession(id, session) {
    if (!DB.get(id)) return this.saveSession(session);
    DB.set(id, session);

    const index = DB.get('session_index') || [];
    const entry = index.find(e => e.id === id);
    if (entry) {
      entry.date = session.date;
      entry.theme = session.theme;
      entry.themes = session.themes;
      entry.duration = session.duration;
      entry.source = session.source || 'generated';
      entry.status = session.status || 'completed';
      if (session.planRef) entry.planRef = session.planRef;
      DB.set('session_index', index);
    }

    this._updateExerciseCache(session);
    return id;
  },

  // Get session index (list of sessions, most recent first)
  getIndex(limit = 30) {
    const index = DB.get('session_index') || [];
    return index.slice(0, limit);
  },

  // Get a specific session
  getSession(id) {
    return DB.get(id);
  },

  // Get last logged data for an exercise (weight, reps, duration)
  getLastExerciseLog(exerciseId) {
    const cache = DB.get('ex_cache') || {};
    return cache[exerciseId] || null;
  },

  // Get all logged data for an exercise (for progress chart)
  getExerciseHistory(exerciseId, limit = 20) {
    const index = DB.get('session_index') || [];
    const results = [];

    for (const entry of index) {
      if (results.length >= limit) break;
      const session = DB.get(entry.id);
      if (!session) continue;

      session.blocks?.forEach(block => {
        block.exercises?.forEach(ex => {
          if (ex.id === exerciseId && ex.sets?.length) {
            results.push({
              date: session.date,
              sets: ex.sets,
              // What was prescribed that day, so a progression judgement
              // compares against the day's own target (Insights.progression).
              target: ex.target || null,
              status: entry.status || session.status || 'completed',
            });
          }
        });
      });
    }
    return results;
  },

  // Get last time a goal was practiced
  getGoalLastPracticed(goalId) {
    const cache = DB.get('goal_cache') || {};
    return cache[goalId] || null;
  },

  // Get goals not touched in X days
  getStaledGoals(days = 7) {
    const cache = DB.get('goal_cache') || {};
    const cutoff = Date.now() - days * 86400000;
    return GOALS.filter(g => {
      const last = cache[g.id];
      return !last || new Date(last).getTime() < cutoff;
    });
  },

  // Get progression suggestion for an exercise
  // Returns: { suggest: true/false, message: string }
  getProgressionSuggestion(exerciseId) {
    const hist = this.getExerciseHistory(exerciseId, 5);
    if (hist.length < 3) return { suggest: false };

    // Look at last 3 sessions — if all sets were completed at same weight
    const last3 = hist.slice(0, 3);
    const weights = last3.flatMap(h => h.sets.map(s => s.weight).filter(Boolean));
    if (!weights.length) return { suggest: false };

    const maxWeight = Math.max(...weights);
    const allSame = weights.every(w => w === maxWeight);
    const allCompleted = last3.every(h => h.sets.every(s => s.completed));

    if (allSame && allCompleted) {
      return {
        suggest: true,
        message: `${maxWeight}kg for 3 sessions — consider adding 2.5–5kg`,
      };
    }
    return { suggest: false };
  },

  _updateExerciseCache(session) {
    const exCache = DB.get('ex_cache') || {};
    const goalCache = DB.get('goal_cache') || {};

    session.blocks?.forEach(block => {
      block.exercises?.forEach(ex => {
        if (ex.sets?.length) {
          // Store last log
          exCache[ex.id] = {
            date: session.date,
            sets: ex.sets,
            lastWeight: ex.sets.filter(s => s.weight).at(-1)?.weight,
            lastReps: ex.sets.filter(s => s.reps).at(-1)?.reps,
            lastDuration: ex.sets.filter(s => s.duration).at(-1)?.duration,
          };
        }

        // Update goal cache
        const libEx = LIBRARY.find(l => l.id === ex.id);
        if (libEx?.goals) {
          libEx.goals.forEach(gId => {
            goalCache[gId] = session.date;
          });
        }
      });
    });

    DB.set('ex_cache', exCache);
    DB.set('goal_cache', goalCache);
  },

  // Get personal best for an exercise
  getPR(exerciseId) {
    const hist = this.getExerciseHistory(exerciseId, 50);
    let maxWeight = 0, maxReps = 0, maxDuration = 0;

    hist.forEach(h => {
      h.sets.forEach(s => {
        if (s.weight > maxWeight) maxWeight = s.weight;
        if (s.reps > maxReps) maxReps = s.reps;
        if (s.duration > maxDuration) maxDuration = s.duration;
      });
    });

    return { weight: maxWeight || null, reps: maxReps || null, duration: maxDuration || null };
  },

  // Epley formula — decent approximation for reps in the ~1-10 range.
  estimateOneRM(weight, reps) {
    if (!weight || !reps) return null;
    if (reps === 1) return Math.round(weight * 10) / 10;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
  },

  // What a set actually loaded. A bodyweight lift logs reps and no weight —
  // a pull-up set is "6", not "6 at 74kg" — so estimateOneRM returned null
  // and the Tracked lifts card read "No sets logged yet" under a column of
  // real work. A weightless set on a weight+reps exercise was loaded by
  // bodyweight, so say so. logType is the guard: 'reps' exercises (toes to
  // bar, hollow rocks) are not lifts and stay out of the 1RM math entirely.
  // Falls back to null when no bodyweight is on file, which is the old
  // behaviour rather than a guess.
  setLoad(exerciseId, set) {
    const lib = (typeof LIBRARY !== 'undefined') ? LIBRARY.find(l => l.id === exerciseId) : null;
    const bw = (typeof Profile !== 'undefined') ? Profile.load()?.settings?.bodyweightKg : null;
    // Pull-ups and dips: a logged weight is ADDED load (Hevy's "Weighted"
    // variants log +10kg as 10), so the lift is bodyweight plus it. Without
    // this a +10kg dip read as a 10kg lift and its e1RM collapsed to ~12.
    if (lib && lib.bodyweightBase && bw && set.reps) return bw + (set.weight || 0);
    if (set.weight) return set.weight;
    if (!set.reps) return null;
    if (!lib || lib.logType !== 'weight+reps') return null;
    return bw || null;
  },

  // Estimated 1RM for one set, bodyweight included where it applies.
  estimateSet(exerciseId, set) {
    return this.estimateOneRM(this.setLoad(exerciseId, set), set.reps);
  },

  // Best estimated 1RM ever logged for this exercise, from completed
  // session history, with the set that produced it.
  getBestEstimate(exerciseId, limit = 50) {
    const hist = this.getExerciseHistory(exerciseId, limit);
    let best = null;
    hist.forEach(h => {
      h.sets.forEach(s => {
        const e1rm = this.estimateSet(exerciseId, s);
        if (e1rm && (!best || e1rm > best.e1rm)) {
          best = { e1rm, weight: this.setLoad(exerciseId, s), reps: s.reps,
                   bodyweight: !s.weight, date: h.date };
        }
      });
    });
    return best;
  },

  deleteSession(id) {
    DB.remove(id);
    const index = (DB.get('session_index') || []).filter(e => e.id !== id);
    DB.set('session_index', index);
  },

  // Map of exerciseId -> date it last appeared in a session (any block,
  // whether or not sets were logged). Used to rotate pool-style blocks
  // (light block, object manipulation, skill work) so the same handful
  // of exercises don't get picked every single day.
  getExerciseLastSeenMap(limit = 30) {
    const index = this.getIndex(limit);
    const map = {};
    for (const entry of index) {
      const session = this.getSession(entry.id);
      if (!session) continue;
      session.blocks?.forEach(block => {
        block.exercises?.forEach(ex => {
          if (ex.id && !(ex.id in map)) map[ex.id] = session.date;
        });
      });
    }
    return map;
  },

  // Intensity/load tier scale, ranked low → high (mirrors Generator._TIER_RANK).
  _TIER_RANK: { flexibility: 0, light: 1, moderate: 2, heavy: 3, explosive: 4 },

  // Map of muscle group -> highest intensity-tier rank it was trained at
  // within the last `days` days (default 2 — "yesterday and today"). Feeds
  // Generator's rotation logic: a candidate exercise for a muscle group
  // already hit at this tier or higher recently gets soft-deprioritized,
  // so the same muscle can train every day, just not at the same or
  // heavier load two days running. Counts any exercise that appeared in a
  // session (same signal getExerciseLastSeenMap uses), not just ones with
  // logged sets — an exercise you did but didn't bother logging weight for
  // still delivered the stimulus.
  getRecentMuscleIntensity(days = 2) {
    const DAY = 86400000;
    const cutoff = Date.now() - days * DAY;
    const out = {};
    const index = this.getIndex(50).filter(e => new Date(e.date).getTime() >= cutoff);
    index.forEach(entry => {
      const session = this.getSession(entry.id);
      if (!session) return;
      session.blocks?.forEach(block => {
        block.exercises?.forEach(ex => {
          if (!ex.id) return;
          const muscle = (typeof EXERCISE_TAGS !== 'undefined' && EXERCISE_TAGS[ex.id]?.muscle) || null;
          if (!muscle) return;
          const lib  = LIBRARY.find(l => l.id === ex.id);
          const rank = this._TIER_RANK[lib?.intensityTier];
          if (rank === undefined) return;
          if (out[muscle] === undefined || rank > out[muscle]) out[muscle] = rank;
        });
      });
    });
    return out;
  },

  // The muscle-group buckets used by EXERCISE_TAGS[id].muscle (see
  // data/library.js) and by the "Muscle distribution" card on the Log
  // screen. Order matches the radar chart's clockwise layout starting at
  // the top. Arms and legs were split into finer buckets (2026-07-12) —
  // Triceps/Biceps/Forearms and Quads/Hamstrings/Glutes/Calves — since
  // the generator's muscle-rotation logic needs that granularity (heavy
  // squats shouldn't block a hinge day tomorrow the way it should block
  // another squat day). buildMuscleRadarSVG (index.html) derives its axis
  // spacing from this array's length, so it doesn't need touching here.
  MUSCLE_GROUPS: ['back', 'chest', 'core', 'shoulders', 'triceps', 'biceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves'],

  // Hard-set / volume distribution across muscle groups for the last
  // `days` days, plus the same-length window immediately before it —
  // mirrors what Hevy's "Muscle distribution" screen shows, so the Log
  // page can render a current-vs-previous radar chart and stat deltas.
  //
  // Only exercises with a non-null EXERCISE_TAGS[id].muscle count toward
  // the hexagon (mobility/breathwork/skill practice has no meaningful
  // resistance stimulus to a specific muscle group and is excluded — see
  // the comment above EXERCISE_TAGS in data/library.js). Sets and volume
  // totals, however, count every logged set regardless of muscle tag, so
  // they still reflect the whole session.
  //
  // Returns { current, previous }, each shaped:
  //   { muscles: {back,chest,core,shoulders,arms,legs}, workouts, durationMin, volumeKg, sets }
  getMuscleDistribution(days = 30) {
    const zeroMuscles = () => Object.fromEntries(this.MUSCLE_GROUPS.map(m => [m, 0]));
    const zeroPeriod = () => ({ muscles: zeroMuscles(), workouts: 0, durationMin: 0, volumeKg: 0, sets: 0 });
    const out = { current: zeroPeriod(), previous: zeroPeriod() };

    const DAY = 86400000;
    const now = Date.now();
    const curStart = now - days * DAY;
    const prevStart = now - days * 2 * DAY;

    // session_index is capped at 200 entries (see saveSession) — plenty
    // for any realistic 30/60/90-day comparison window.
    const index = this.getIndex(200);
    index.forEach(entry => {
      const t = new Date(entry.date).getTime();
      const which = t >= curStart ? 'current' : (t >= prevStart ? 'previous' : null);
      if (!which) return;

      const session = this.getSession(entry.id);
      if (!session) return;

      out[which].workouts++;
      out[which].durationMin += session.duration || 0;

      session.blocks?.forEach(block => {
        block.exercises?.forEach(ex => {
          if (!ex.sets?.length) return;
          const tags = (typeof EXERCISE_TAGS !== 'undefined' && EXERCISE_TAGS[ex.id]) || null;
          const muscle = tags?.muscle;
          ex.sets.forEach(s => {
            out[which].sets++;
            if (muscle) out[which].muscles[muscle]++;
            if (s.weight && s.reps) out[which].volumeKg += s.weight * s.reps;
          });
        });
      });
    });

    return out;
  },
};


// ═════════════════════════════════════════════════════════════
// 4. SESSION GENERATOR
// ═════════════════════════════════════════════════════════════

const Generator = {

  // Time tiers — returns block durations in minutes
  getTier(duration) {
    if (duration < 60)  return 1;
    if (duration < 120) return 2;
    if (duration < 240) return 3;
    return 4;
  },

  // Ceilings — blocks never exceed these regardless of total time
  _CEILINGS: {
    lightBlock: 60, meditate: 40,
    warmup: 20, skill: 45, main: 90, cooldown: 30,
  },

  // Base allocations per tier before energy adjustment. 'skill'+'main' are
  // the pooled work-time budget, split evenly across however many modality
  // tags you select that day (see genToCompose in index.html) — there's no
  // per-tag entry here because the tag list itself is open-ended now.
  _BASE: {
    1: { lightBlock: 10, meditate: 10, warmup: 10, skill: 10, main: 15, cooldown: 5  },
    2: { lightBlock: 15, meditate: 12, warmup: 15, skill: 25, main: 35, cooldown: 15 },
    3: { lightBlock: 25, meditate: 20, warmup: 20, skill: 40, main: 55, cooldown: 20 },
    4: { lightBlock: 45, meditate: 30, warmup: 20, skill: 40, main: 75, cooldown: 25 },
  },

  getBlockDurations(duration, energy = 3) {
    const t    = this.getTier(duration);
    const raw  = this._BASE[t];
    const ceil = this._CEILINGS;
    const low  = energy > 0 && energy < 3;
    const high = energy >= 4;

    // Scale the tier's base "shape" proportionally to the actual requested
    // duration first. Without this, the tier's base minutes (a fixed
    // lookup table) could exceed — or undershoot — whatever you actually
    // asked for: tier 3's base alone sums to 195min, so picking 180min
    // still produced a 195min suggested split. Scaling keeps the relative
    // proportions between blocks but targets your number.
    const baseSum = Object.values(raw).reduce((a, b) => a + b, 0);
    const scale   = baseSum > 0 ? duration / baseSum : 1;
    const base    = {};
    Object.keys(raw).forEach(k => { base[k] = raw[k] * scale; });

    // Energy adjustments
    if (low) {
      base.lightBlock = Math.min(base.lightBlock + 15, ceil.lightBlock);
      base.meditate   = Math.min(base.meditate   + 10, ceil.meditate);
      base.cooldown   = Math.min(base.cooldown   + 5,  ceil.cooldown);
      base.skill      = base.skill * 0.7;
      base.main       = base.main  * 0.6;
    }

    // Enforce ceilings
    Object.keys(base).forEach(k => {
      if (ceil[k]) base[k] = Math.min(base[k], ceil[k]);
    });

    // Round to nearest 5 before reconciling against the target, so the
    // leftover/overshoot math below matches the numbers that actually render.
    Object.keys(base).forEach(k => { base[k] = Math.max(0, Math.round(base[k] / 5) * 5); });

    // Reconcile rounding + ceiling clamps against the requested total.
    // Undershoot (duration left unused) tops up main first, then light,
    // then meditation — same priority as before. Overshoot (still over
    // budget, usually from a low-energy nudge hitting a ceiling) trims out
    // of main first since it's the most elastic block, then light, then skill.
    let leftover = duration - Object.values(base).reduce((a, b) => a + b, 0);

    if (leftover > 0) {
      const toMain = Math.min(leftover, ceil.main - base.main);
      base.main   += toMain;
      leftover    -= toMain;
      if (leftover > 0) {
        const toLight    = Math.min(leftover, ceil.lightBlock - base.lightBlock);
        base.lightBlock += toLight;
        leftover         -= toLight;
      }
      if (leftover > 0) {
        base.meditate = Math.min(base.meditate + leftover, ceil.meditate);
      }
    } else if (leftover < 0) {
      let over = -leftover;
      const trimMain = Math.min(over, Math.max(0, base.main - 10));
      base.main -= trimMain; over -= trimMain;
      if (over > 0) {
        const trimLight  = Math.min(over, base.lightBlock);
        base.lightBlock -= trimLight; over -= trimLight;
      }
      if (over > 0) {
        const trimSkill = Math.min(over, base.skill);
        base.skill -= trimSkill; over -= trimSkill;
      }
    }

    // On long low-energy days, shift weight from main into light+meditation —
    // unconditional on tier/energy now rather than gated on leftover existing,
    // so recovery time is protected even on a tightly-budgeted low-energy day.
    if (low && t >= 3 && base.main > 15) {
      const stolen = Math.round(base.main * 0.2);
      base.main       = Math.max(15, base.main - stolen);
      base.lightBlock = Math.min(base.lightBlock + Math.round(stolen * 0.6), ceil.lightBlock);
      base.meditate   = Math.min(base.meditate   + Math.round(stolen * 0.4), ceil.meditate);
    }

    // Final rounding to nearest 5
    Object.keys(base).forEach(k => { base[k] = Math.max(0, Math.round(base[k] / 5) * 5); });

    return base;
  },

  // Rough per-exercise time estimate (minutes) — used only to decide how
  // many exercises fit inside a block's chosen duration. Not a promise of
  // exact live-session time, since actual sets/reps are logged by hand.
  // Per-exercise setup cost — getting into position, fetching the band,
  // walking to the rig. Also guarantees every exercise costs something, so
  // a pool can never fill a block indefinitely (a 'none'-type exercise
  // used to cost exactly 0 and would have looped through a whole pool).
  _SETUP_MIN: 0.5,

  // Bumped when generated plans change shape, so a stored-but-untouched
  // plan for today is rebuilt (index.html _todayPlan). 2 = 26 Sep 2026:
  // pinned main focus, recipe blocks, doses.
  GEN_VERSION: 4,

  _estimateExerciseMinutes(ex) {
    // A prescribed dose is the best estimate there is.
    if (ex && ex.target && ex.role !== 'main' && typeof Complementary !== 'undefined') {
      return this._SETUP_MIN + Complementary.doseSeconds(ex.target) / 60;
    }
    const rest = ex.restSeconds || 0;
    const setup = this._SETUP_MIN;
    switch (ex.logType) {
      case 'weight+reps': return setup + (3 * (40 + rest)) / 60;                    // 3 working sets
      case 'reps':        return setup + (2 * (30 + Math.min(rest, 30))) / 60;      // bodyweight/band, brief rest
      case 'hold':        return setup + (2 * (45 + Math.max(rest, 15))) / 60;      // 2 holds of 45s (was 2x30s @ 0 rest
                                                                                    // = exactly 1min, which let a 45min
                                                                                    // block "fit" 45 stretches)
      case 'cardio':      return 15;                                                // user logs actual time
      case 'none':
      default:            return setup;
    }
  },

  // Ceiling on how many exercises one block may hold, derived from its
  // duration. The time tally alone is not a sufficient brake: hold-type
  // work is cheap per exercise, so hold-heavy pools (flexibility 71,
  // mobility-movement 55, coordination 36, yoga 31) used to be emptied
  // wholesale into a single block — 36 coordination drills in one 45min
  // warm-up. Roughly one exercise per 5min of block time, floored at 2 so
  // a short block still has something to alternate, capped at 10 so a long
  // block stays a session rather than a checklist. Whichever brake binds
  // first wins: heavy strength work is still limited by time (a squat at
  // 180s rest costs ~11.5min, so a 60min block holds ~5-7 lifts), while
  // stretching and coordination are limited by this count.
  _MIN_PER_EXERCISE: 5,
  _MAX_EXERCISES_PER_BLOCK: 10,
  _MIN_EXERCISES_PER_BLOCK: 2,

  _maxExercisesFor(targetMin) {
    const n = Math.round((targetMin || 0) / this._MIN_PER_EXERCISE);
    return Math.max(this._MIN_EXERCISES_PER_BLOCK, Math.min(this._MAX_EXERCISES_PER_BLOCK, n));
  },

  // Reorders a candidate pool so exercises not seen recently bubble to the
  // front (never-seen first, then oldest-seen), instead of always reading
  // the array in its fixed, hardcoded order. Ties (equal or unknown
  // last-seen date) fall back to the original array order.
  _orderByRecency(ids, lastSeenMap) {
    if (!lastSeenMap) return ids;
    return [...ids].sort((a, b) => {
      const la = lastSeenMap[a] ? new Date(lastSeenMap[a]).getTime() : -Infinity;
      const lb = lastSeenMap[b] ? new Date(lastSeenMap[b]).getTime() : -Infinity;
      if (la !== lb) return la - lb;
      return ids.indexOf(a) - ids.indexOf(b);
    });
  },

  // ── PAIN / INJURY-AWARE GENERATION ──────────────────────────
  // Deterministic pipeline: free-text check-in note → joint tags with a
  // severity → excluded/deprioritized exercises → (when a fixed-exercise
  // block like a cardio pick or sprint main comes up empty) reclaimed time
  // pushed into skill + object manipulation, biased toward exercises that
  // still raise heart rate. No AI call — just keyword matching against
  // EXERCISE_TAGS (data/library.js), which is why it only reacts to
  // *joints/regions* it recognizes and never invents new information.

  // joint keyword → canonical joint tag used in EXERCISE_TAGS
  _JOINT_KEYWORDS: {
    ankle:    'ankle',
    achilles: 'ankle',
    knee:     'knee',
    hip:      'hip',
    groin:    'hip',
    back:     'back',
    spine:    'back',
    'lower back': 'back',
    shoulder: 'shoulder',
    rotator:  'shoulder',
    elbow:    'elbow',
    wrist:    'wrist',
    forearm:  'forearm',
    grip:     'forearm',
    neck:     'neck',
  },

  // Words that push a mentioned joint into the harder "avoid" bucket
  // (exclude moderate/high-impact work on it) rather than the softer
  // "caution" bucket (deprioritize, don't exclude).
  _PAIN_SEVERE_WORDS: [
    'sprain', 'sprained', 'strain', 'strained', 'tear', 'torn',
    'injury', 'injured', 'hurt', 'pain', 'sharp', 'swollen', 'swelling',
    'twisted', 'pulled',
  ],
  _PAIN_MILD_WORDS: [
    'sore', 'soreness', 'tight', 'tightness', 'stiff', 'stiffness',
    'achy', 'ache', 'tender', 'fatigued', 'tired',
  ],

  // Parses free text like "left ankle pain from spraining 1 week ago, sore
  // back and forearms" into { avoid: Set, caution: Set } of joint tags.
  // A joint mentioned near a severe word (sprain, injury, pain...) lands in
  // avoid; near only a mild word (sore, tight...) lands in caution. A joint
  // mentioned with no nearby severity word defaults to caution (better to
  // mildly deprioritize than ignore it outright).
  _parsePainTags(painText) {
    const avoid = new Set();
    const caution = new Set();
    if (!painText || typeof painText !== 'string') return { avoid, caution };

    const text = painText.toLowerCase();
    const hasSevere = this._PAIN_SEVERE_WORDS.some(w => text.includes(w));
    const hasMild   = this._PAIN_MILD_WORDS.some(w => text.includes(w));

    Object.keys(this._JOINT_KEYWORDS).forEach(keyword => {
      const idx = text.indexOf(keyword);
      if (idx === -1) return;
      const joint = this._JOINT_KEYWORDS[keyword];

      // Look at a window around the mention to judge severity locally
      // (so "sore back and sprained ankle" doesn't mark both as sprained).
      const windowStart = Math.max(0, idx - 25);
      const windowEnd   = Math.min(text.length, idx + keyword.length + 25);
      const window      = text.slice(windowStart, windowEnd);

      const localSevere = this._PAIN_SEVERE_WORDS.some(w => window.includes(w));
      const localMild   = this._PAIN_MILD_WORDS.some(w => window.includes(w));

      if (localSevere) avoid.add(joint);
      else if (localMild) caution.add(joint);
      else if (hasSevere && !hasMild) avoid.add(joint);
      else caution.add(joint);
    });

    // A joint in avoid doesn't need to also sit in caution
    avoid.forEach(j => caution.delete(j));
    return { avoid, caution };
  },

  _tagsFor(id) {
    return (typeof EXERCISE_TAGS !== 'undefined' && EXERCISE_TAGS[id]) || null;
  },

  // True if this exercise should be hard-excluded given the avoid set:
  // any avoided joint loaded at moderate or high impact. Low-impact work
  // on an avoided joint (gentle CARs, mobility) is left alone — it's
  // usually fine and sometimes actively useful during recovery.
  _isPainExcluded(id, painAvoid) {
    if (!painAvoid || !painAvoid.size) return false;
    const tags = this._tagsFor(id);
    if (!tags || !tags.joints.length) return false;
    const hits = tags.joints.some(j => painAvoid.has(j));
    return hits && (tags.impact === 'moderate' || tags.impact === 'high');
  },

  // True if this exercise touches a "caution" joint — used to push it to
  // the back of a pool's ordering rather than exclude it outright.
  _isPainCaution(id, painCaution) {
    if (!painCaution || !painCaution.size) return false;
    const tags = this._tagsFor(id);
    if (!tags || !tags.joints.length) return false;
    return tags.joints.some(j => painCaution.has(j));
  },

  // ── AI GENERATION SUPPORT ────────────────────────────────────
  // Free-text requests ("flexibility and yoga for 30 minutes", "floor
  // movement, balance, and new juggling patterns") map fairly directly onto
  // the existing category/subcategory taxonomy. Matching locally here,
  // for free, before any API call means we only ever send the AI a
  // relevant slice of the ~250-exercise library instead of the whole
  // thing — the difference between a few thousand tokens and tens of
  // thousands. Falls back to the full library when nothing matches rather
  // than guessing wrong.
  _CATEGORY_KEYWORDS: {
    'meditat':            { category: 'Meditation' },
    'breathwork':         { category: 'Meditation', subcategory: 'Breathwork' },
    'breathing':          { category: 'Meditation', subcategory: 'Breathwork' },
    'somatic':            { category: 'Somatic' },
    'nervous system':     { category: 'Somatic' },
    'gym':                { category: 'Gym' },
    'strength':           { category: 'Gym' },
    'weights':            { category: 'Gym' },
    'lifting':            { category: 'Gym' },
    'cardio':             { category: 'Cardio' },
    'run':                { category: 'Cardio', subcategory: 'Run' },
    'jog':                { category: 'Cardio', subcategory: 'Run' },
    'bike':               { category: 'Cardio', subcategory: 'Cycling' },
    'cycling':            { category: 'Cardio', subcategory: 'Cycling' },
    'power':              { category: 'Power' },
    'jump':                { category: 'Power', subcategory: 'Jumps' },
    'sprint':             { category: 'Power', subcategory: 'Sprint' },
    'throw':               { category: 'Power', subcategory: 'Throws' },
    'plyo':                { category: 'Power' },
    'rings':               { category: 'Rings' },
    'muscle up':           { category: 'Rings', subcategory: 'Skill' },
    'muscle-up':           { category: 'Rings', subcategory: 'Skill' },
    'front lever':         { category: 'Rings', subcategory: 'Lever' },
    'back lever':          { category: 'Rings', subcategory: 'Lever' },
    'juggling':            { category: 'Object Manipulation', subcategory: 'Juggling' },
    'juggle':              { category: 'Object Manipulation', subcategory: 'Juggling' },
    'stick balanc':        { category: 'Object Manipulation', subcategory: 'Stick Balancing' },
    'indian club':         { category: 'Object Manipulation', subcategory: 'Indian Clubs' },
    'contact ball':        { category: 'Object Manipulation', subcategory: 'Contact Juggling' },
    'object manipulation': { category: 'Object Manipulation' },
    'hang':                { category: 'Body Movement', subcategory: 'Hanging' },
    'tumbling':            { category: 'Body Movement', subcategory: 'Tumbling' },
    'cartwheel':           { category: 'Body Movement', subcategory: 'Tumbling' },
    'roll':                { category: 'Body Movement', subcategory: 'Tumbling' },
    'ground flow':         { category: 'Body Movement', subcategory: 'Ground Flow' },
    'floor movement':      { category: 'Body Movement', subcategory: 'Ground Flow' },
    'floor work':          { category: 'Body Movement', subcategory: 'Ground Flow' },
    'freestyle':           { category: 'Body Movement', subcategory: 'Flow' },
    'floreio':             { category: 'Body Movement', subcategory: 'Floreio' },
    'capoeira':            { category: 'Body Movement', subcategory: 'Floreio' },
    'handstand':           { category: 'Body Movement', subcategory: 'Handstand' },
    'arm balanc':          { category: 'Body Movement', subcategory: 'Arm Balancing' },
    'frog stand':          { category: 'Body Movement', subcategory: 'Arm Balancing' },
    'inversion':           { category: 'Body Movement', subcategory: 'Inversion' },
    'headstand':           { category: 'Body Movement', subcategory: 'Inversion' },
    'animal':              { category: 'Body Movement', subcategory: 'Animal Locomotion' },
    'crawl':               { category: 'Body Movement', subcategory: 'Animal Locomotion' },
    'balance':             { category: 'Body Movement', subcategory: 'Balance' },
    'gymnastics':          { category: 'Body Movement', subcategory: 'Gymnastics Conditioning' },
    'hollow body':         { category: 'Body Movement', subcategory: 'Gymnastics Conditioning' },
    'l-sit':               { category: 'Body Movement', subcategory: 'Gymnastics Conditioning' },
    'l sit':               { category: 'Body Movement', subcategory: 'Gymnastics Conditioning' },
    'flexibility':         { category: 'Flexibility' },
    'mobility':            { category: 'Flexibility' },
    'stretch':             { category: 'Flexibility' },
    'splits':              { category: 'Flexibility', subcategory: 'Splits' },
    'pancake':             { category: 'Flexibility', subcategory: 'Splits' },
    'hip flexor':          { category: 'Flexibility', subcategory: 'Hip' },
    'hamstring':           { category: 'Flexibility', subcategory: 'Hamstring' },
    'foam roll':           { category: 'Flexibility', subcategory: 'Self-Massage' },
    'yoga':                { category: 'Yoga' },
    'sun salutation':      { category: 'Yoga', subcategory: 'Flow' },
    'vinyasa':             { category: 'Yoga', subcategory: 'Flow' },
  },

  // Returns { candidates, matched } — matched is true only when at least one
  // keyword hit, so callers can tell "deliberately broad" apart from "we
  // just sent everything because nothing matched."
  _filterLibraryByIntent(text) {
    if (!text || typeof text !== 'string') return { candidates: LIBRARY, matched: false };
    const lower = text.toLowerCase();
    const categories = new Set();
    const subcatPairs = new Set(); // "Category::Subcategory"

    Object.keys(this._CATEGORY_KEYWORDS).forEach(keyword => {
      if (!lower.includes(keyword)) return;
      const rule = this._CATEGORY_KEYWORDS[keyword];
      if (rule.subcategory) subcatPairs.add(rule.category + '::' + rule.subcategory);
      else categories.add(rule.category);
    });

    if (!categories.size && !subcatPairs.size) return { candidates: LIBRARY, matched: false };

    const candidates = LIBRARY.filter(ex => {
      if (categories.has(ex.category)) return true;
      if (subcatPairs.has(ex.category + '::' + ex.subcategory)) return true;
      return false;
    });

    // A matched-but-empty result (shouldn't really happen given the
    // dictionary is built from the real taxonomy) still falls back to the
    // full library rather than handing the AI nothing to choose from.
    return candidates.length ? { candidates, matched: true } : { candidates: LIBRARY, matched: false };
  },

  // Which "group" an exercise belongs to for rotation purposes. Subcategory
  // is the right granularity for most of the library (e.g. Object
  // Manipulation splits into Juggling / Stick Balancing / Tennis Ball /
  // Indian Clubs; Body Movement splits Handstand from Gymnastics
  // Conditioning) — that's exactly the "juggling yesterday, sticks today"
  // distinction. Falls back to category, then a single bucket, so ungrouped
  // pools still work.
  _groupOf(id) {
    const lib = LIBRARY.find(e => e.id === id);
    return lib?.subcategory || lib?.category || '_';
  },

  // Two-level rotation: order GROUPS by recency (a group's last-seen date is
  // the most recent last-seen among its members), then order members within
  // each group by their own recency. This is what lets a block rotate
  // between movement families (sticks vs juggling, handstand vs core) day
  // to day instead of just cycling individual exercise ids in place.
  // Degrades to plain _orderByRecency when there's only one group present.
  _orderByGroupRecency(ids, lastSeenMap) {
    if (!lastSeenMap) return ids;
    const groups = [...new Set(ids.map(id => this._groupOf(id)))];
    if (groups.length <= 1) return this._orderByRecency(ids, lastSeenMap);

    // A group is "seen" as recently as its most-recently-seen member.
    const groupLastSeen = {};
    ids.forEach(id => {
      const g = this._groupOf(id);
      const seen = lastSeenMap[id];
      if (seen && (!groupLastSeen[g] || new Date(seen) > new Date(groupLastSeen[g]))) {
        groupLastSeen[g] = seen;
      }
    });

    const orderedGroups = this._orderByRecency(groups, groupLastSeen);
    const out = [];
    orderedGroups.forEach(g => {
      const members = ids.filter(id => this._groupOf(id) === g);
      out.push(...this._orderByRecency(members, lastSeenMap));
    });
    return out;
  },

  // Structured (not prose) explanation of what _orderByGroupRecency decided
  // for a pool, so the UI can say *why* a block looks the way it does
  // without recomputing rotation logic itself. Returns null when there's
  // nothing interesting to say (no history yet, or only one group in the
  // pool). Otherwise: { chosenGroup, deprioritizedGroup, deprioritizedDaysAgo }
  // — the group that lost out and how long ago it was last trained.
  _rotationNote(ids, lastSeenMap) {
    if (!lastSeenMap) return null;
    const groups = [...new Set(ids.map(id => this._groupOf(id)))];
    if (groups.length <= 1) return null;

    const groupLastSeen = {};
    ids.forEach(id => {
      const g = this._groupOf(id);
      const seen = lastSeenMap[id];
      if (seen && (!groupLastSeen[g] || new Date(seen) > new Date(groupLastSeen[g]))) {
        groupLastSeen[g] = seen;
      }
    });
    if (!Object.keys(groupLastSeen).length) return null; // nothing in this pool has history yet

    const ordered = this._orderByRecency(groups, groupLastSeen);
    const chosenGroup = ordered[0];
    const mostRecentGroup = ordered[ordered.length - 1];
    if (chosenGroup === mostRecentGroup || !groupLastSeen[mostRecentGroup]) return null;

    const days = Math.floor((Date.now() - new Date(groupLastSeen[mostRecentGroup]).getTime()) / 86400000);
    return { chosenGroup, deprioritizedGroup: mostRecentGroup, deprioritizedDaysAgo: days };
  },

  // Intensity/load tier scale (data/library.js: LIBRARY[id].intensityTier),
  // ranked low → high so two tiers can be compared numerically.
  _TIER_RANK: { flexibility: 0, light: 1, moderate: 2, heavy: 3, explosive: 4 },

  // True if this exercise should be soft-deprioritized because its muscle
  // group was already hit at this tier or higher recently (see
  // History.getRecentMuscleIntensity). Mirrors _isPainCaution's shape —
  // same "push to back, don't exclude" mechanism, different signal. An
  // exercise with no muscle tag (mobility/skill/cardio work) is never
  // affected, and a muscle trained only at a *lower* tier recently stays
  // fully eligible — that's what lets legs show up every day, just not at
  // heavy load two days running.
  _isMuscleDeprioritized(id, recentMuscleIntensity) {
    if (!recentMuscleIntensity || !Object.keys(recentMuscleIntensity).length) return false;
    const muscle = this._tagsFor(id)?.muscle;
    if (!muscle || !(muscle in recentMuscleIntensity)) return false;
    const lib = LIBRARY.find(e => e.id === id);
    const rank = this._TIER_RANK[lib?.intensityTier];
    if (rank === undefined) return false;
    return rank >= recentMuscleIntensity[muscle];
  },

  // Pick exercises off an ordered candidate list until the estimated time
  // reaches the block's target duration, instead of always dumping the
  // whole curated list regardless of how much time was allotted.
  // Always includes at least one exercise when targetMin > 0.
  // If lastSeenMap is provided, the pool is rotated group-first (see
  // _orderByGroupRecency) so pool-style blocks (light/skill/modality tags)
  // vary day to day — both which movement family shows up and which
  // specific exercise within it — rather than always surfacing the same
  // items.
  //
  // painCaution (optional Set of joint tags) pushes exercises that touch a
  // sore/tight joint to the back of the pool — they're still eligible, just
  // deprioritized behind safer options. Hard exclusion (avoid) happens one
  // level up, inside resolveEx, so it applies uniformly everywhere.
  //
  // recentMuscleIntensity (optional, from History.getRecentMuscleIntensity)
  // applies the same soft-deprioritize treatment for "this muscle group was
  // already hit this hard in the last day or two" — see
  // _isMuscleDeprioritized above.
  //
  // preferRaisesHR (optional bool) stable-sorts raisesHR:true candidates
  // first — for a caller that wants to bias a pool toward heart-rate-
  // raising picks specifically (not currently used by any block, kept for
  // pain-driven time-reclaim scenarios).
  _fitToTime(ids, targetMin, resolveEx, lastSeenMap, painCaution, preferRaisesHR, recentMuscleIntensity) {
    const picked = [];
    if (!targetMin || targetMin <= 0) return picked;
    let ordered = this._orderByGroupRecency(this._applyPoolFilters(ids), lastSeenMap);

    if (painCaution && painCaution.size) {
      const safe = ordered.filter(id => !this._isPainCaution(id, painCaution));
      const flagged = ordered.filter(id => this._isPainCaution(id, painCaution));
      ordered = [...safe, ...flagged];
    }
    if (recentMuscleIntensity) {
      const safe = ordered.filter(id => !this._isMuscleDeprioritized(id, recentMuscleIntensity));
      const flagged = ordered.filter(id => this._isMuscleDeprioritized(id, recentMuscleIntensity));
      ordered = [...safe, ...flagged];
    }
    if (preferRaisesHR) {
      const hr = ordered.filter(id => this._tagsFor(id)?.raisesHR);
      const rest = ordered.filter(id => !this._tagsFor(id)?.raisesHR);
      ordered = [...hr, ...rest];
    }

    const maxCount = this._maxExercisesFor(targetMin);
    let used = 0;
    for (const id of ordered) {
      if (picked.length >= maxCount) break;
      if (used >= targetMin && picked.length > 0) break;
      const ex = resolveEx(id);
      if (!ex) continue;
      picked.push(ex);
      used += this._estimateExerciseMinutes(ex);
    }
    this._allocateTime(picked, targetMin);
    return picked;
  },

  // Reserved per exercise for walking to the next station / brief rest
  // between exercises in a block — subtracted off the block's total before
  // splitting the remainder, so a 10min block with 4 exercises doesn't
  // pretend all 10 minutes are working time.
  _TRANSITION_BUFFER_MIN: 0.5,

  // Gives each exercise in a block a concrete `allocatedMinutes` target,
  // proportional to its own _estimateExerciseMinutes weight (a weight+reps
  // set with rest between sets naturally gets more time than a quick CAR
  // or a stretch hold) rather than a flat even split — same signal that
  // already decided how many exercises fit in _fitToTime, reused here so
  // the per-exercise numbers and the "how many fit" decision agree with
  // each other. Purely a displayed target on the exercise card — doesn't
  // drive any timer.
  _allocateTime(picked, targetMin) {
    if (!picked.length) return picked;
    const buffer = this._TRANSITION_BUFFER_MIN * picked.length;
    const available = Math.max(0, (targetMin || 0) - buffer);
    const weights = picked.map(ex => this._estimateExerciseMinutes(ex) || 0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    picked.forEach((ex, i) => {
      const share = totalWeight > 0 ? weights[i] / totalWeight : 1 / picked.length;
      const minutes = Math.max(0.5, available * share);
      ex.allocatedMinutes = Math.round(minutes * 2) / 2; // nearest 0.5min
    });
    return picked;
  },

  // Main generation function
  // Returns a structured session object ready for the live screen
  // `themes` is an array of selected modality tag ids, e.g. ['weights','cardio'].
  generate({ themes, duration, sleep, energy, pain, focus, profile, customDurations, blockOrder, cardioMode }) {
    const tier      = this.getTier(duration);
    const durations = customDurations || this.getBlockDurations(duration, energy);
    const lowEnergy = (sleep > 0 && sleep < 3) || (energy > 0 && energy < 3);
    const useExt    = tier >= 3 && !lowEnergy;
    const lastSeenMap = History.getExerciseLastSeenMap(30);
    const recentMuscleIntensity = History.getRecentMuscleIntensity(2);
    const painTags  = this._parsePainTags(pain);

    const session = {
      id:        null,          // set on save
      date:      new Date().toISOString(),
      themes,
      duration,
      tier,
      sleep,
      energy,
      pain,
      focus,
      status:    'active',      // 'active' | 'completed'
      startedAt: Date.now(),
      completedAt: null,
      notes:     '',
      blocks:    this._buildBlocks({ themes, tier, durations, lowEnergy, useExt, profile, focus, lastSeenMap, recentMuscleIntensity, painTags, blockOrder, cardioMode }),
      painNote:  (painTags.avoid.size || painTags.caution.size)
        ? { avoid: [...painTags.avoid], caution: [...painTags.caution] }
        : null,
    };

    return session;
  },

  // ── SCAFFOLD-SEEDED DAILY INSTANCE (project_scaffold_revamp, Phase 3) ──
  // Generates a full day's session from the week scaffold (data/scaffold.js)
  // instead of a manually-picked theme list. Produces the methodology doc's
  // block skeleton — Light Work (daily constants), Breakfast (non-fasting
  // days only), Meditate, Warm-up, Skill Training, Reading, Main Focus,
  // Cool-down — with Warm-up/Skill Training primed toward (or, in
  // anti-correlated mode, deliberately away from) that day's Main Focus
  // theme. Reuses _fitToTime/_poolForTag/_getModalityBlocks — the same
  // pool→rotate→fit-to-time→allocate-time pipeline the manual generator
  // uses, which already does the "fill to duration with a per-exercise time
  // tally" job (see _allocateTime) rather than needing new logic for it.
  //
  // `themeOverride` (a WEEK_SCAFFOLD key, e.g. 'sunday') lets a chat
  // override borrow a *different* day-type's whole skeleton for this one
  // date, per the confirmed "Thursday borrows Sunday's Active Rest" case —
  // the actual weekday is still recorded separately so this stays a
  // single-date override, never touching the week template itself.
  //
  // Muscle-group/intensity rotation is intentionally NOT recomputed here
  // against actual/overridden history — frozen at scaffold-design time,
  // per the 2026-08-06 decision in project_scaffold_revamp. recentMuscleIntensity
  // is still threaded through purely for pool *ordering* (same signal
  // _fitToTime already uses elsewhere), not as a gating feature.
  generateFromScaffold({ date, themeOverride, profile, sleep, energy, pain, focus, correlationMode, contentDay, contentKind }) {
    const d = this._parseDate(date);
    const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekdayKey = WEEKDAY_KEYS[d.getDay()];
    // The month plan decides what today is FOR; the scaffold and generator
    // decide what that means in exercises. Absent a plan the week stands on
    // its own exactly as before, so this layer is additive.
    const hasPlan   = typeof MonthPlan !== 'undefined';
    const ownDay    = hasPlan ? MonthPlan.dayFor(d) : null;
    const loadScale = hasPlan ? MonthPlan.loadScaleFor(d) : 1;

    // A plan day may borrow another day-type's whole skeleton. The second
    // quality session of a build week lands on a Saturday, whose own template
    // is the long easy run; without this the plan's theme changed only the
    // LABEL while the generator still built the template's day underneath.
    // An explicit themeOverride (chat, Adjust, a trade) still wins.
    const slotKey = themeOverride || (contentDay && contentDay.dayType) || (ownDay && ownDay.dayType) || weekdayKey;
    const slot = (typeof WEEK_SCAFFOLD !== 'undefined') ? WEEK_SCAFFOLD[slotKey] : null;
    if (!slot) return null;

    // Which plan day the CONTENT (lifts, loads, protocol, skill line) comes
    // from. Before this, a theme swap or trade changed the skeleton but kept
    // the calendar date's prescription — a "Zone 2 bike" block full of
    // squats. See MonthPlan.contentFor.
    let planDay = ownDay, planSource = { kind: ownDay ? 'plan' : 'none', from: ownDay ? ownDay.date : null };
    if (contentDay !== undefined) {
      planDay = contentDay;
      planSource = { kind: contentKind || 'traded', from: contentDay ? (contentDay._carriedFrom || contentDay.date) : null };
    } else if (hasPlan && MonthPlan.contentFor && (themeOverride || !ownDay)) {
      const r = MonthPlan.contentFor(d, slot.dayType || slotKey);
      planDay = r.day; planSource = { kind: r.kind, from: r.from };
    }

    const variant   = slot.variant || 'standard';
    const durations = this._scaffoldBlockDurations(variant);
    const tier      = this.getTier(this._skeletonTotalMinutes(variant));
    const lowEnergy = (sleep > 0 && sleep < 3) || (energy > 0 && energy < 3);
    const useExt    = tier >= 3 && !lowEnergy;
    const lastSeenMap = History.getExerciseLastSeenMap(30);
    const recentMuscleIntensity = History.getRecentMuscleIntensity(2);
    const painTags  = this._parsePainTags(pain);
    const painAvoid = painTags.avoid, painCaution = painTags.caution;
    const resolveEx = this._resolveExFactory(profile, painAvoid);

    const blocks = [];

    // Nothing should appear twice in one day. Thursday's Yoga accessory was
    // re-drawing the same three poses its own Mobility block had just used,
    // because both pull from the same tag. Each block's picks are banked
    // here and filtered out of every later pool.
    const used = new Set();
    const fresh = pool => pool.filter(id => !used.has(id));
    const bank  = block => { (block.exercises || []).forEach(e => used.add(e.id)); return block; };

    // Day type (strength-a, z2-bike, …) decides the recipes. Weekday slots
    // carry it; a plan day can borrow another type with `dayType`.
    const dayType = slot.dayType || slotKey;
    const hasRecipes = typeof MOBILITY_RECIPES !== 'undefined';

    // ── OPEN — four daily slots (hang, spine, squat, release); the variant
    // follows the day. Falls back to the old free-text constants.
    const open = (hasRecipes && this._buildOpenBlock(dayType, durations['open'], resolveEx))
      || this._buildDailyConstantsBlock(durations['open']);
    blocks.push(bank(open));

    // ── COMPLEMENTARY — one coordination domain, explored properly.
    // Pinned by the plan when there is one, so the block's published
    // schedule and what the app actually generates can never drift apart.
    // The coordination domain belongs to the DATE (its rotation), not to
    // whichever plan day the main work was borrowed from.
    const domain = (ownDay && ownDay.coordDomain) || this.coordDomainFor(d);
    const dayIdx = this._dayIndex(d);
    const weekSeed = Math.floor(dayIdx / 7);
    blocks.push(bank(this._buildComplementaryBlock({
      domain, durationMin: durations['complementary'], resolveEx, lastSeenMap, painCaution, dayType, used,
      skillLine: (planDay && planDay.skillLine) || slot.skillLine || null,
      seed: Math.floor(dayIdx / 6),
    })));

    // ── MOBILITY & FLEXIBILITY — prep before strength and speed (nothing
    // held over 30s), range-building on easy days. On a movement-practice
    // day it stays out of the movement families so nothing repeats.
    if (durations['mobility'] > 0) {
      const recipeKey = slot.mobility && typeof slot.mobility === 'string' ? slot.mobility : null;
      const recipe = hasRecipes && recipeKey ? MOBILITY_RECIPES[recipeKey] : null;
      if (recipe) {
        blocks.push(bank(this._buildRecipeBlock({
          key: 'mobility', label: 'Mobility & Flexibility', icon: 'flame', color: '#1D9E75', bg: '#E1F5EE',
          note: recipe.mode === 'prep'
            ? 'Prep for today’s main work. Nothing held longer than 30s.'
            : 'Range day. Long holds — nothing explosive follows.',
          steps: recipe.steps, duration: durations['mobility'], recipeKey, recipeKind: 'mobility',
          resolveEx, lastSeenMap, used, painCaution, seed: weekSeed,
          excludeFamilies: domain === 'movement' ? this._movementFamilies() : [],
        })));
      } else {
        const mobTags = (slot.mobility && slot.mobility.tags) || ['mobility-movement'];
        const mobPool = fresh([...new Set(mobTags.flatMap(t => this._poolForTag(t)))]);
        blocks.push(bank({
          key: 'mobility', label: 'Mobility & Flexibility', icon: 'flame', color: '#1D9E75', bg: '#E1F5EE',
          duration: durations['mobility'], note: (slot.mobility && slot.mobility.note) || '',
          exercises: this._fitToTime(mobPool, durations['mobility'], resolveEx, lastSeenMap, painCaution, false, recentMuscleIntensity),
          rotationNote: this._rotationNote(mobPool, lastSeenMap),
        }));
      }
    }

    // ── MAIN FOCUS — the day's spine. What the day is FOR is pinned first:
    // the plan day's `mainFocusPlan` (that date's loads), else the day
    // type's `core`. Only a day with neither falls back to pooled modality
    // blocks, and even then never from prehab/accessory work — that is how
    // 25 Sep's Strength B came out as ten wrist and neck drills.
    let mainTags = [];
    const mfPlan = planDay && planDay.mainFocusPlan;
    const pinnedMain = slot.mainFocus && durations['main-focus'] > 0
      ? this._buildPinnedMainFocus({ slot, planDay, mfPlan, loadScale, mainDurMax: durations['main-focus'], resolveEx })
      : null;
    if (pinnedMain) {
      mainTags = slot.mainFocus.tags || [];
      blocks.push(bank(pinnedMain));
    } else if (slot.mainFocus && durations['main-focus'] > 0) {
      mainTags = slot.mainFocus.tags || [];
      const mainDur = Math.min(Math.round(durations['main-focus'] * loadScale), 60);
      const mainDurations = {};
      mainTags.forEach(t => { mainDurations[t] = Math.round(mainDur / mainTags.length); });
      const prevExclude = this._excludeRestGroups;
      this._excludeRestGroups = new Set(['prehab']);
      let mainBlocks;
      try {
        ({ blocks: mainBlocks } = this._getModalityBlocks({
          themes: mainTags, tier, durations: mainDurations, lowEnergy, useExt, profile, focus,
          resolveEx, lastSeenMap, recentMuscleIntensity, painAvoid, painCaution,
          cardioMode: slot.mainFocus.cardioMode,
          cardioModality: slot.mainFocus.modality,
        }));
      } finally { this._excludeRestGroups = prevExclude; }
      mainBlocks.forEach(b => {
        b.key = 'main-focus:' + b.key;
        b.mainFocus = true;
        // A named protocol on the day beats the generator's generic
        // "N min hard / M min easy, repeat for the block" fallback. A
        // Norwegian 4x4 is four four-minute efforts, not a fill pattern,
        // and when the protocol changes week to week the plan is what
        // knows it — the scaffold only knows the day-type.
        const ivSpec = (planDay && planDay.intervalSpec) || (slot.mainFocus && slot.mainFocus.intervalSpec);
        if (ivSpec && /(^|:)cardio$/.test(b.key || '')) {
          (b.exercises || []).forEach(e => { e.notes = ivSpec; });
        }
        if (slot.mainFocus.note) b.note = slot.mainFocus.note;
        if (planDay && planDay.focusNote) b.note = planDay.focusNote + (b.note ? '  |  ' + b.note : '');
        bank(b);
      });
      blocks.push(...mainBlocks);
    }

    // ── ACCESSORY & SKILL — the day's skill line (prehab, handstand,
    // muscle-up prep, pancake & hips, hang project). The plan can name one.
    const skillLineKey = (planDay && planDay.skillLine) || slot.skillLine || null;
    const skillLine = hasRecipes && skillLineKey && typeof SKILL_LINES !== 'undefined' ? SKILL_LINES[skillLineKey] : null;
    if (durations['accessory'] > 0 && skillLine) {
      blocks.push(bank(this._buildRecipeBlock({
        key: 'accessory', label: 'Accessory & Skill — ' + skillLine.label, icon: 'star', color: '#185FA5', bg: '#E4EEF9',
        note: '', steps: skillLine.steps, duration: durations['accessory'], recipeKey: skillLineKey, recipeKind: 'skill',
        resolveEx, lastSeenMap, used, painCaution, seed: Math.floor(dayIdx / 3),
      })));
    } else if (durations['accessory'] > 0) {
      const accTags = (slot.accessory && slot.accessory.tags) || ['calisthenics'];
      const accPool = fresh([...new Set(accTags.flatMap(t => this._poolForTag(t)))]);
      blocks.push(bank({
        key: 'accessory', label: 'Accessory & Skill', icon: 'star', color: '#185FA5', bg: '#E4EEF9',
        duration: durations['accessory'], note: (slot.accessory && slot.accessory.note) || '',
        exercises: this._fitToTime(accPool, durations['accessory'], resolveEx, lastSeenMap, painCaution, false, recentMuscleIntensity),
        rotationNote: this._rotationNote(accPool, lastSeenMap),
      }));
    }

    // ── CLOSE — down-regulation. Cool-down pools of the day's main tags,
    // falling back to a body scan on days with no main focus.
    const coolDur = durations['close'] || 10;
    const closeKey = slot.close || null;
    const closeRecipe = hasRecipes && closeKey && typeof CLOSE_RECIPES !== 'undefined' ? CLOSE_RECIPES[closeKey] : null;
    if (closeRecipe) {
      blocks.push(bank(this._buildRecipeBlock({
        key: 'close', label: 'Close', icon: 'moon', color: '#5F5E5A', bg: '#F1EFE8',
        note: 'Down-regulate. Finish calm.', steps: closeRecipe, duration: coolDur,
        recipeKey: closeKey, recipeKind: 'close', resolveEx, lastSeenMap, used, painCaution, seed: dayIdx,
      })));
    } else {
      const coolIdsRaw = [...new Set(mainTags.flatMap(t => this._MODALITY_COOLDOWN[t] || []))];
      const coolIds = fresh(coolIdsRaw.length ? coolIdsRaw : ['body-scan', 'breathing-478']);
      blocks.push({
        key: 'close', label: 'Close', icon: 'moon', color: '#5F5E5A', bg: '#F1EFE8',
        duration: coolDur, note: 'Down-regulate. Finish calm.',
        exercises: this._fitToTime(coolIds, coolDur, resolveEx),
      });
    }

    const built = blocks.filter(b => b.exercises.length > 0);

    return {
      id: null,
      date: this._localDateKey(d),
      weekday: weekdayKey,
      theme: (planDay && planDay.theme) || slot.theme,
      planBlock: (planDay || ownDay) ? {
        week: (ownDay || planDay).week, load: (ownDay || planDay).load, benchmark: !!(planDay && planDay.benchmark),
        focusNote: (planDay && planDay.focusNote) || '',
      } : null,
      // Where the prescription came from: its own plan day, another date's
      // (borrowed for a theme swap, or traded), or carried forward past the
      // end of the written plan. Kept so a later regeneration (resize,
      // correlation flip, new GEN_VERSION) uses the same source.
      planSource,
      contentDate: planDay ? (planDay._carriedFrom ? null : planDay.date) : null,
      edits: [],
      removedBlocks: [],
      themes: mainTags.length ? mainTags : ['mobility-movement'],
      themeOverride: themeOverride || null,
      // The day-type actually used, so a later block resize re-pools from
      // the borrowed skeleton rather than from the calendar weekday.
      dayType: slotKey,
      dayKind: dayType,
      genVersion: this.GEN_VERSION,
      skillLine: skillLineKey,
      variant,
      coordDomain: domain,
      fuel: slot.fuel || '',
      // Kept for compatibility with existing daily_instance records and
      // ChatOverride's correlation_flip intent. The priming/anti-correlated
      // mechanic belonged to the old scaffold, where Warm-up and Skill were
      // selected to prime Main Focus. The new skeleton has no primed blocks,
      // so this is inert.
      correlationMode: correlationMode === 'anti_correlated' ? 'anti_correlated' : 'correlated',
      duration: built.reduce((sum, b) => sum + (b.duration || 0), 0),
      plannedDuration: built.reduce((sum, b) => sum + (b.duration || 0), 0),
      tier,
      sleep, energy, pain, focus,
      status: 'active',
      startedAt: Date.now(),
      completedAt: null,
      notes: '',
      blocks: built,
      chatLog: [],
      painNote: (painAvoid.size || painCaution.size)
        ? { avoid: [...painAvoid], caution: [...painCaution] }
        : null,
    };
  },

  // 'YYYY-MM-DD' strings are LOCAL dates. new Date('2026-09-28') is UTC
  // midnight — the previous evening anywhere west of UTC, which turned a
  // Monday override into a Sunday (review 3.10/15).
  _parseDate(date) {
    if (!date) return new Date();
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date + 'T12:00:00');
    return new Date(date);
  },

  // Local calendar date — never toISOString().slice(0,10), which files an
  // evening session under the previous day anywhere east of UTC.
  _localDateKey(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },

  // ── COORDINATION DOMAIN ROTATION ────────────────────────────
  // Which single domain today explores. Five domains against a seven-day
  // week drift past each other (5 and 7 are coprime), so over 35 days
  // every domain lands on every day type.
  coordDomainFor(date) {
    if (typeof COORD_DOMAINS === 'undefined' || !COORD_DOMAINS.length) return null;
    const anchorStr = (typeof COORD_ANCHOR_DATE !== 'undefined') ? COORD_ANCHOR_DATE : '2026-09-21';
    const [ay, am, ad] = anchorStr.split('-').map(Number);
    const anchor = new Date(ay, am - 1, ad);
    const day = new Date(date); day.setHours(0, 0, 0, 0); anchor.setHours(0, 0, 0, 0);
    const days = Math.round((day - anchor) / 86400000);
    const n = COORD_DOMAINS.length;
    return COORD_DOMAINS[((days % n) + n) % n];
  },

  // Exercises in one Complementary domain. Membership comes from the
  // exercise's family (data/complementary.js DOMAIN_FAMILIES); a per-exercise
  // coordDomain override still wins, so a re-domained exercise moves day
  // immediately. Without the families layer it falls back to the old
  // coordDomain + 'coordination' tag rule.
  //
  // Movement practice is load-gated: heavy/explosive Floreio and tumbling
  // only on easy days (MOVEMENT_FULL_DAY_TYPES). On a wrist skill-line day
  // (handstand) high-impact wrist work is out too; the rest is capped when
  // the block is built.
  _poolForCoordDomain(domain, dayType, skillLine) {
    if (!domain) return [];
    const fams = (typeof DOMAIN_FAMILIES !== 'undefined') ? DOMAIN_FAMILIES[domain] : null;
    const easyDay = typeof MOVEMENT_FULL_DAY_TYPES !== 'undefined' && MOVEMENT_FULL_DAY_TYPES.includes(dayType);
    const wristDay = this._isWristDay(skillLine);
    return LIBRARY.filter(ex => {
      const ov = Overrides.get(ex.id);
      if (ov && ov.coordDomain) return ov.coordDomain === domain;
      if (fams) {
        if (!fams.includes(ex.family)) return false;
        if (domain === 'movement') {
          if (!(ex.roles || []).includes('practice')) return false;
          if (ex.movementGate === 'easy-days' && dayType && !easyDay) return false;
          if (wristDay && this._wristLoad(ex.id) === 'high') return false;
        }
        return true;
      }
      const tags = (ov && ov.modalityTags) || ex.modalityTags || [];
      return ex.coordDomain === domain && tags.includes('coordination');
    }).map(ex => ex.id);
  },

  // With no history (a day not done yet, a fresh device) least-recently-
  // done is a tie for everything, so every Monday would read the same.
  // Rotating the candidate order by a date-derived index breaks the tie
  // differently each week; real history still decides once it exists.
  _rotateBy(ids, n) {
    if (!ids.length || !n) return ids;
    const k = ((n % ids.length) + ids.length) % ids.length;
    return ids.slice(k).concat(ids.slice(0, k));
  },

  _dayIndex(d) {
    const a = new Date(2026, 0, 5); a.setHours(0, 0, 0, 0);      // a Monday
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    return Math.round((x - a) / 86400000);
  },

  _isWristDay(skillLine) {
    return !!skillLine && typeof WRIST_SKILL_LINES !== 'undefined' && WRIST_SKILL_LINES.includes(skillLine);
  },

  // 'none' | 'some' | 'high'. Tagged items go by joints + impact. Untagged
  // crawls and floreio are hand-supported, so they count; the easy-day-gated
  // ones (presses, pistol-to-push-up) count as high.
  _wristLoad(id) {
    const t = (typeof EXERCISE_TAGS !== 'undefined') ? EXERCISE_TAGS[id] : null;
    if (t) {
      if (!(t.joints || []).includes('wrist')) return 'none';
      return t.impact === 'high' ? 'high' : 'some';
    }
    const ex = LIBRARY.find(e => e.id === id);
    if (!ex || !['E1', 'E2'].includes(ex.family)) return 'none';
    return ex.movementGate === 'easy-days' ? 'high' : 'some';
  },

  _movementFamilies() {
    return (typeof DOMAIN_FAMILIES !== 'undefined' && DOMAIN_FAMILIES.movement) || ['E1', 'E2', 'E3'];
  },

  // One theme, three to five items, longer sets. Rotation is family-first
  // (subcategory groups), so a day is a coherent family rather than a mix.
  _buildComplementaryBlock({ domain, durationMin, resolveEx, lastSeenMap, painCaution, dayType, used, seed, skillLine }) {
    const taken = used || new Set();
    const pool  = this._rotateBy(this._poolForCoordDomain(domain, dayType, skillLine).filter(id => !taken.has(id)), seed || 0);
    const label = (typeof COORD_DOMAIN_LABELS !== 'undefined' && COORD_DOMAIN_LABELS[domain]) || domain || 'Complementary';
    const block = {
      key: 'complementary', label: 'Complementary \u2014 ' + label,
      icon: 'star', color: '#D8890A', bg: '#FBEEDA',
      duration: durationMin, coordDomain: domain, skillLine: skillLine || null,
      note: 'One domain today. Stay with it long enough to actually be in it.',
      exercises: [],
      rotationNote: this._rotationNote(pool, lastSeenMap),
    };
    if (typeof Complementary === 'undefined') {
      block.exercises = this._fitToTime(pool, durationMin, resolveEx, lastSeenMap, painCaution);
      return block;
    }
    let ordered = this._orderByGroupRecency(this._applyPoolFilters(pool), lastSeenMap);
    if (painCaution && painCaution.size) {
      ordered = [...ordered.filter(id => !this._isPainCaution(id, painCaution)), ...ordered.filter(id => this._isPainCaution(id, painCaution))];
    }
    const n = Math.max(3, Math.min(5, Math.round((durationMin || 0) / 6)));
    const wristCap = (domain === 'movement' && this._isWristDay(skillLine) && typeof WRIST_CAP_ON_SKILL_DAYS === 'number')
      ? WRIST_CAP_ON_SKILL_DAYS : Infinity;
    let wristN = 0;
    const picked = [];
    for (const id of ordered) {
      if (picked.length >= n) break;
      const wrist = wristCap < Infinity && this._wristLoad(id) !== 'none';
      if (wrist && wristN >= wristCap) continue;
      const ex = resolveEx(id);
      if (ex) { picked.push(this._attachDose(ex, 'practice')); if (wrist) wristN++; }
    }
    block.exercises = this._fitBlockDoses(picked, durationMin);
    return block;
  },

  // \u2500\u2500 RECIPE-BUILT BLOCKS (Open, Mobility, Accessory, Close) \u2500\u2500\u2500\u2500\u2500
  // A recipe is ordered steps; each step picks `n` of its candidate ids,
  // least-recently-done first, skipping anything already in the day, and
  // doses them for the step's role. Steps keep their order, so a warm-up
  // reads raise \u2192 mobilise \u2192 activate \u2192 potentiate.
  _buildRecipeBlock({ key, label, icon, color, bg, note, steps, duration, recipeKey, recipeKind, resolveEx, lastSeenMap, used, painCaution, excludeFamilies, seed }) {
    const taken = used || new Set();
    const excl = new Set(excludeFamilies || []);
    const picked = [];
    const inBlock = new Set();
    (steps || []).forEach(step => {
      let ids = (step.ids || []).filter(id => !taken.has(id) && !inBlock.has(id));
      ids = ids.filter(id => { const l = LIBRARY.find(e => e.id === id); return l && !excl.has(l.family); });
      ids = this._rotateBy(this._applyPoolFilters(ids), seed || 0);
      if (lastSeenMap) ids = this._orderByRecency(ids, lastSeenMap);
      if (painCaution && painCaution.size) {
        ids = [...ids.filter(id => !this._isPainCaution(id, painCaution)), ...ids.filter(id => this._isPainCaution(id, painCaution))];
      }
      let got = 0;
      for (const id of ids) {
        if (got >= (step.n || 1)) break;
        const ex = resolveEx(id);
        if (!ex) continue;
        picked.push(this._attachDose(ex, step.role, step.dose));
        inBlock.add(id); got++;
      }
    });
    return {
      key, label, icon, color, bg, duration, note: note || '',
      recipeKey, recipeKind,
      exercises: this._fitBlockDoses(picked, duration),
    };
  },

  _buildOpenBlock(dayType, durationMin, resolveEx) {
    const variants = (typeof OPEN_VARIANTS !== 'undefined') ? OPEN_VARIANTS[dayType] : null;
    if (!variants || !resolveEx) return null;
    const picked = [];
    variants.forEach(v => {
      const ex = resolveEx(v.id);
      if (ex) picked.push(this._attachDose(ex, 'open', v.dose));
    });
    if (!picked.length) return null;
    return {
      key: 'open', label: 'Open', icon: 'sun', color: '#1D9E75', bg: '#E1F5EE',
      duration: durationMin, note: 'Hang, spine, squat, release. The version follows the day.',
      recipeKind: 'open', recipeKey: dayType,
      exercises: this._fitBlockDoses(picked, durationMin),
    };
  },

  // Dose an exercise for the job it is doing. `explicit` (from a recipe step
  // or an Open variant) beats the library entry's own dose, which beats the
  // role default in Complementary.doseFor.
  _attachDose(ex, role, explicit) {
    if (typeof Complementary === 'undefined') return ex;
    const lib = LIBRARY.find(e => e.id === ex.id) || {};
    const src = { ...lib, ...ex, family: lib.family, dose: lib.dose, perSide: lib.perSide };
    // Curated doses (Open variants, a recipe step's own dose) are kept as
    // written; only role defaults get scaled to fill the block.
    let dose = explicit ? { perSide: Complementary.isUnilateral(src), restSec: 20, ...explicit, fixed: true }
                        : Complementary.doseFor(src, role === 'open' ? 'mobilise' : role);
    ex.role = role;
    ex.target = { ...dose, text: Complementary.doseText(dose) };
    return ex;
  },

  // Scale every dose in a block so the block adds up to its minutes, then
  // hand out allocatedMinutes proportionally. The dose shown and the time
  // allotted come from the same numbers, so they cannot disagree.
  _fitBlockDoses(picked, durationMin) {
    if (!picked.length || typeof Complementary === 'undefined') return this._allocateTime(picked, durationMin);
    const available = Math.max(30, (durationMin || 0) * 60 - this._TRANSITION_BUFFER_MIN * 60 * picked.length);
    const secs = picked.map(ex => Math.max(20, Complementary.doseSeconds(ex.target)));
    const total = secs.reduce((a, b) => a + b, 0);
    picked.forEach((ex, i) => {
      if (!ex.target || ex.target.fixed) return;
      const share = available * secs[i] / total;
      const fitted = Complementary.fitDose(ex.target, share, ex.role);
      ex.target = { ...fitted, text: Complementary.doseText({ ...fitted, text: undefined }) };
    });
    return this._allocateTime(picked, durationMin);
  },

  // \u2500\u2500 PINNED MAIN FOCUS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Builds Main Focus from what the day is for: the plan day's
  // mainFocusPlan (exercises with loads, or a cardio protocol), else the day
  // type's `core` / `cardio`. Returns null when neither exists so the caller
  // can fall back to pooled modality blocks.
  _buildPinnedMainFocus({ slot, planDay, mfPlan, loadScale, mainDurMax, resolveEx }) {
    const mf = slot.mainFocus;
    if (!mf) return null;
    const mainDur = Math.min(Math.round(mainDurMax * (loadScale || 1)), 60);
    const tag = (mf.tags && mf.tags[0]) || 'weights';
    const cfg = this._MODALITY_CONFIG[tag] || this._MODALITY_CONFIG['weights'];
    const planNote = planDay && planDay.focusNote;
    const block = {
      key: 'main-focus:' + tag, label: mf.label || cfg.label,
      icon: cfg.icon, color: cfg.color, bg: cfg.bg,
      duration: mainDur, mainFocus: true, pinned: true,
      note: planNote ? planNote + (mfPlan && mfPlan.note ? '  |  ' + mfPlan.note : '') : ((mfPlan && mfPlan.note) || mf.note || ''),
      exercises: [],
    };
    const byIdOrName = spec => {
      if (!spec) return null;
      if (spec.id) { const ex = resolveEx(spec.id); if (ex) return ex; }
      if (spec.name) {
        const lib = LIBRARY.find(e => e.name.toLowerCase() === String(spec.name).toLowerCase());
        if (lib) return resolveEx(lib.id);
      }
      return null;
    };

    // Cardio: one exercise fills the block, the protocol is its target.
    const cardio = (mfPlan && mfPlan.cardio) || (!mfPlan && mf.cardio) || null;
    if (cardio) {
      const spec = cardio.exercise || cardio;
      const ex = byIdOrName(spec);
      if (!ex) return null;
      const modality = this._cardioModality(ex.id);
      const text = cardio.text || this._protocolText(cardio.protocol, modality) || '';
      // The protocol decides the minutes (a 4x4 is ~40, not the 60-minute
      // slot it sits in); the block keeps its slot and the rest is slack.
      const protoMin = this._protocolMinutes(cardio.protocol) || cardio.minutes || mainDur;
      ex.role = 'main';
      ex.target = { sets: 1, durationSec: Math.min(protoMin, mainDur) * 60, text, fixed: true,
        protocol: cardio.protocol || null, planNote: cardio.note || '' };
      ex.notes = [text, cardio.note].filter(Boolean).join(' \u2014 ');
      ex.allocatedMinutes = Math.min(protoMin, mainDur);
      block.exercises.push(ex);
      // A test day can carry a short extra after the run (max dead hang).
      ((mfPlan && mfPlan.extra) || []).forEach(x => {
        const e2 = byIdOrName(x); if (!e2) return;
        e2.role = 'main';
        e2.target = { sets: x.sets || 1, text: x.note || 'Max', fixed: true };
        e2.allocatedMinutes = 2;
        block.exercises.push(e2);
      });
      if (block.exercises.length > 1) { ex.allocatedMinutes = Math.max(5, mainDur - 2 * (block.exercises.length - 1)); }
      return block;
    }

    const specs = (mfPlan && mfPlan.exercises) || mf.core;
    if (!specs || !specs.length) return null;
    specs.forEach(s => {
      const ex = byIdOrName(s);
      if (!ex) return;
      const dose = {
        sets: s.sets || 1, reps: s.reps, durationSec: s.durationSec, distanceM: s.distanceM,
        loadKg: s.loadKg, rpe: s.rpe, restSec: s.restSec != null ? s.restSec : (ex.restSeconds || 90),
      };
      Object.keys(dose).forEach(k => dose[k] == null && delete dose[k]);
      ex.role = 'main';
      const text = (typeof Complementary !== 'undefined') ? Complementary.doseText(dose) : '';
      ex.target = { ...dose, text: s.bodyweightPlus && dose.loadKg ? text.replace('@ ' + dose.loadKg + 'kg', '+' + dose.loadKg + 'kg') : text, fixed: true };
      if (s.note) ex.notes = s.note;
      block.exercises.push(ex);
    });
    if (!block.exercises.length) return null;
    // Time weights from the prescription itself (sets \u00d7 (work + rest)).
    const w = block.exercises.map(ex => {
      const t = ex.target;
      const work = t.durationSec || (t.distanceM ? 30 : 40);
      return (t.sets || 1) * (work + (t.restSec || 0));
    });
    const tot = w.reduce((a, b) => a + b, 0);
    const avail = Math.max(0, mainDur - this._TRANSITION_BUFFER_MIN * block.exercises.length);
    block.exercises.forEach((ex, i) => { ex.allocatedMinutes = Math.max(1, Math.round(avail * w[i] / tot * 2) / 2); });
    return block;
  },

  // Total minutes a cardio protocol takes, warm-up to walk-down.
  _protocolMinutes(p) {
    if (!p) return 0;
    if (p.type === 'intervals' || p.type === 'tempo')
      return (p.warmupMin || 10) + p.reps * p.workMin + Math.max(0, p.reps - 1) * (p.recoveryMin || 0) + (p.cooldownMin || 5);
    if (p.type === 'fixed-hr-test') return (p.warmupMin || 0) + (p.testMin || 0) + (p.easyMin || 0) + (p.walkdownMin || 0);
    if (p.type === 'steady') return (p.warmupMin || 0) + (p.mainMin || 0) + (p.cooldownMin || 0) + (p.walkdownMin || 0);
    return 0;
  },

  // Run and bike versions of the same session. A swap keeps the protocol and
  // the heart-rate numbers; only the machine changes.
  _CARDIO_PAIRS: {
    run:  { 'easy-run': 'z2-cycling', 'long-run': 'z2-cycling', 'interval-run': 'interval-cycling', 'tempo-run': 'interval-cycling' },
    bike: { 'z2-cycling': 'easy-run', 'interval-cycling': 'interval-run' },
  },
  _cardioModality(id) {
    if (this._CARDIO_PAIRS.bike[id]) return 'bike';
    if (this._CARDIO_PAIRS.run[id]) return 'run';
    return null;
  },

  _protocolText(p, modality) {
    if (!p) return '';
    if (modality === 'bike' && p.type === 'steady') {
      return `${p.mainMin} min${p.hrMin ? ' at ' + p.hrMin + '\u2013' + p.hrMax : ' under ' + p.hrMax}${p.warmupMin ? ' \u00b7 ' + p.warmupMin + ' min spin-up' : ''}${(p.walkdownMin || p.cooldownMin) ? ' \u00b7 ' + (p.walkdownMin || p.cooldownMin) + ' min easy spin' : ''}`;
    }
    if (p.type === 'intervals') return `${p.name ? p.name + ' \u00b7 ' : ''}${p.warmupMin || 10} min warm-up \u00b7 ${p.reps} \u00d7 ${p.workMin} min at ${p.workHr[0]}\u2013${p.workHr[1]} \u00b7 ${p.recoveryMin} min easy between \u00b7 ${p.cooldownMin || 5} min cool-down`;
    if (p.type === 'tempo') return `${p.warmupMin || 10} min easy \u00b7 ${p.reps} \u00d7 ${p.workMin} min at ${p.workHr[0]}\u2013${p.workHr[1]} \u00b7 ${p.recoveryMin} min easy between \u00b7 ${p.cooldownMin || 5} min easy`;
    if (p.type === 'fixed-hr-test') return `${p.warmupMin} min build \u00b7 ${p.testMin} min at avg ~${p.targetAvgHr} (nothing above ${p.hrCeiling})${p.easyMin ? ' \u00b7 ' + p.easyMin + ' min easy under 153' : ''} \u00b7 ${p.walkdownMin} min walk`;
    if (p.type === 'steady') return `${p.mainMin} min${p.hrMin ? ' at ' + p.hrMin + '\u2013' + p.hrMax : ' under ' + p.hrMax}${p.warmupMin ? ' \u00b7 ' + p.warmupMin + ' min spin-up' : ''}${p.walkdownMin ? ' \u00b7 ' + p.walkdownMin + ' min walk' : ''}`;
    return '';
  },

  // Minutes between two 'HH:MM' clock strings.
  _clockDiffMin(from, to) {
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    return (th * 60 + tm) - (fh * 60 + fm);
  },

  // Per-block minutes from SKELETON_BLOCKS for the given day variant
  // ('standard' | 'light'). A block with no window for this variant
  // (Main Focus on the light day) comes back 0 and is dropped.
  _scaffoldBlockDurations(variant) {
    const out = {};
    if (typeof SKELETON_BLOCKS === 'undefined') return out;
    const key = variant === 'light' ? 'light' : 'standard';
    SKELETON_BLOCKS.forEach(b => {
      const window = b[key];
      out[b.key] = window ? this._clockDiffMin(window[0], window[1]) : 0;
    });
    return out;
  },

  _skeletonTotalMinutes(variant) {
    return Object.values(this._scaffoldBlockDurations(variant)).reduce((a, b) => a + b, 0);
  },

  // Open block content — the four daily constants, fixed every day with
  // internal variation rather than picked from a pool.
  _buildDailyConstantsBlock(durationMin) {
    const items = (typeof DAILY_CONSTANTS !== 'undefined' ? DAILY_CONSTANTS.items : []) || [];
    const exercises = items.map((it, i) => ({
      id: 'daily-constant-' + i,
      name: it.name + (it.vary && it.vary.length ? ` (vary: ${it.vary.join(' / ')})` : ''),
      logType: 'none', notes: '', sets: [], completed: false, skipped: false, link: null,
      allocatedMinutes: items.length ? Math.round((durationMin / items.length) * 2) / 2 : 0,
    }));
    return {
      key: 'open', label: 'Open', icon: 'sun', color: '#1D9E75', bg: '#E1F5EE',
      duration: durationMin, note: 'Daily constants \u2014 vary grip, depth and style day to day.', exercises,
    };
  },

  // ── CHAT OVERRIDE EXECUTION (project_scaffold_revamp, Phase 5) ──
  // Applies a validated `intent` (produced by ChatOverride.interpret — an
  // LLM call) to an existing scaffold-generated `instance`, deterministically.
  // The LLM only ever proposes WHICH block/theme; it never picks exercises,
  // durations, or invents a block itself — same "LLM proposes structure, app
  // code resolves it against real data" split AIGenerator._mapToBlocks
  // already uses. Returns a new instance, or null if the intent didn't
  // validate against the instance's actual blocks / WEEK_SCAFFOLD keys (the
  // caller falls back to a "couldn't apply that" note in that case).
  // Every change to a day goes through here. The raw action builds the new
  // instance; the wrapper then puts back everything already trained today
  // (review 2.2: Shorter/Lighter/chat used to regenerate blocks and drop
  // logged sets) and keeps the instance's identity, history link and log of
  // edits, so a mid-session change is never a new session.
  applyOverride(instance, intent, profile) {
    if (!instance || !intent) return null;
    const out = this._applyOverrideRaw(instance, intent, profile);
    if (!out) return null;
    const merged = this._preserveLogged(instance, out);
    merged.id = instance.id; merged.startedAt = instance.startedAt;
    if (instance.loggedHistoryId) merged.loggedHistoryId = instance.loggedHistoryId;
    merged.status = instance.status || merged.status;
    merged.chatLog = instance.chatLog || [];
    merged.edits = (instance.edits || []).concat([{ action: intent.action, at: Date.now(),
      ...(intent.blockKey ? { blockKey: intent.blockKey } : {}),
      ...(intent.modality ? { modality: intent.modality } : {}),
      ...(intent.targetTheme ? { targetTheme: intent.targetTheme } : {}) }]);
    if (!out.removedBlocks) merged.removedBlocks = instance.removedBlocks || [];
    merged.duration = merged.blocks.reduce((sum, b) => sum + (b.duration || 0), 0);
    return merged;
  },

  _exHasWork(ex) {
    return !!ex && !!(ex.completed || ex.skipped || (ex.sets || []).length || ex.cardioLog);
  },
  _blockHasWork(b) {
    return !!b && (b.exercises || []).some(e => this._exHasWork(e));
  },

  // Carries every trained exercise from `old` into `fresh`. A block that
  // still exists keeps its trained exercises (same id: the trained copy
  // wins; gone from the new list: put back at its old position). A block
  // that no longer exists but holds trained work is kept whole where it was.
  _preserveLogged(old, fresh) {
    const blocks = (fresh.blocks || []).map(b => ({ ...b, exercises: [...(b.exercises || [])] }));
    (old.blocks || []).forEach((ob, obIdx) => {
      const worked = (ob.exercises || []).map((e, i) => ({ e, i })).filter(x => this._exHasWork(x.e));
      if (!worked.length) return;
      const nb = blocks.find(b => b.key === ob.key);
      if (!nb) { blocks.splice(Math.min(obIdx, blocks.length), 0, { ...ob, exercises: [...ob.exercises] }); return; }
      worked.forEach(({ e, i }) => {
        const at = nb.exercises.findIndex(x => x.id === e.id);
        if (at !== -1) nb.exercises[at] = e;
        else nb.exercises.splice(Math.min(i, nb.exercises.length), 0, e);
      });
    });
    return { ...fresh, blocks };
  },

  // Lighter for a pinned Main Focus: the same lifts at ~90% with one set
  // fewer (never below two); an interval or tempo session becomes the same
  // minutes easy, under the Z2 cap. Steady easy work is already easy.
  _lightenPinned(block) {
    const exercises = (block.exercises || []).map(ex => {
      if (this._exHasWork(ex) || !ex.target) return ex;
      const t = { ...ex.target };
      const p = t.protocol;
      if (p && (p.type === 'intervals' || p.type === 'tempo')) {
        const mins = Math.round((t.durationSec || 2400) / 60);
        const easy = { type: 'steady', mainMin: Math.max(20, mins - 10), warmupMin: 5, cooldownMin: 5, hrMin: 134, hrMax: 153 };
        const mod = this._cardioModality(ex.id);
        const text = this._protocolText(easy, mod);
        return { ...ex, target: { ...t, protocol: easy, text, lightened: true }, notes: `${text} \u2014 lighter today: the intervals become easy minutes.` };
      }
      if (t.loadKg != null || (t.sets || 0) > 2) {
        if (t.loadKg != null) t.loadKg = Math.round(t.loadKg * 0.9 * 2) / 2;
        if ((t.sets || 0) > 2) t.sets = t.sets - 1;
        t.text = typeof Complementary !== 'undefined' ? Complementary.doseText({ ...t, text: undefined, protocol: undefined }) : t.text;
        t.lightened = true;
        return { ...ex, target: t };
      }
      return ex;
    });
    return { ...block, exercises, note: (block.note ? block.note + '  |  ' : '') + 'Lighter today: loads about 10% down, one set fewer.' };
  },

  // The arguments that regenerate an instance's own day: same date, same
  // borrowed/traded content source, same check-in.
  _regenArgs(instance, profile) {
    const src = instance.planSource || {};
    const args = {
      date: instance.date, correlationMode: instance.correlationMode,
      themeOverride: instance.themeOverride, profile,
      sleep: instance.sleep, energy: instance.energy, pain: instance.pain, focus: instance.focus,
    };
    if (src.kind === 'traded' && instance.contentDate && typeof MonthPlan !== 'undefined') {
      const plan = MonthPlan.load();
      const day = plan && (plan.days || []).find(x => x.date === instance.contentDate);
      if (day) { args.contentDay = day; args.contentKind = 'traded'; }
    }
    return args;
  },

  _applyOverrideRaw(instance, intent, profile) {
    if (!instance || !intent) return null;

    if (intent.action === 'theme_swap') {
      if (typeof WEEK_SCAFFOLD === 'undefined' || !WEEK_SCAFFOLD[intent.targetTheme]) return null;
      const fresh = this.generateFromScaffold({
        date: instance.date, correlationMode: instance.correlationMode,
        themeOverride: intent.targetTheme, profile,
        sleep: instance.sleep, energy: instance.energy, pain: instance.pain, focus: instance.focus,
      });
      if (!fresh) return null;
      return fresh;
    }

    if (intent.action === 'correlation_flip') {
      const mode = intent.mode === 'anti_correlated' ? 'anti_correlated' : 'correlated';
      const fresh = this.generateFromScaffold({ ...this._regenArgs(instance, profile), correlationMode: mode });
      if (!fresh) return null;
      return fresh;
    }

    // ── Remove a block: the day gets shorter ──
    // "I don't have time for Accessory today." Later blocks move up; the
    // block is kept aside on the instance so it can be put back. A block
    // with logged work can't be removed — that would delete training.
    if (intent.action === 'remove_block') {
      const blocks = instance.blocks.map(b => ({ ...b }));
      const idx = blocks.findIndex(b => b.key === intent.blockKey);
      if (idx === -1) return null;
      if (this._blockHasWork(blocks[idx])) return null;
      const [gone] = blocks.splice(idx, 1);
      const freedMinutes = gone.duration || 0;

      // Chat can still ask for the minutes to go somewhere specific.
      const tIdx = intent.giveMinutesTo ? blocks.findIndex(b => b.key === intent.giveMinutesTo) : -1;
      if (tIdx !== -1 && freedMinutes > 0) {
        const target = blocks[tIdx];
        blocks[tIdx] = this._regenerateBlockAtDuration(target, (target.duration || 0) + freedMinutes, instance, profile) || target;
      }
      const removedBlocks = (instance.removedBlocks || []).filter(r => r.block.key !== gone.key)
        .concat([{ block: gone, index: idx }]);
      return { ...instance, blocks, removedBlocks };
    }

    // ── Put a removed block back where it was ──
    if (intent.action === 'restore_block') {
      const rb = (instance.removedBlocks || []).find(r => r.block.key === intent.blockKey);
      if (!rb) return null;
      const blocks = instance.blocks.map(b => ({ ...b }));
      blocks.splice(Math.min(rb.index, blocks.length), 0, rb.block);
      return { ...instance, blocks, removedBlocks: (instance.removedBlocks || []).filter(r => r !== rb) };
    }

    // ── Resize one block; the day's total moves with it ──
    if (intent.action === 'resize_block') {
      const blocks = instance.blocks.map(b => ({ ...b }));
      const idx = blocks.findIndex(b => b.key === intent.blockKey);
      if (idx === -1) return null;
      const minutes = Math.max(5, Math.min(120, Math.round(Number(intent.minutes) || 0)));
      if (!minutes || minutes === blocks[idx].duration) return null;
      blocks[idx] = this._regenerateBlockAtDuration(blocks[idx], minutes, instance, profile) || { ...blocks[idx], duration: minutes };
      return { ...instance, blocks };
    }

    // ── Move a block earlier or later in the day ──
    // A test day wants Main Focus first, fresh (review 3.9).
    if (intent.action === 'move_block') {
      const blocks = instance.blocks.map(b => ({ ...b }));
      const idx = blocks.findIndex(b => b.key === intent.blockKey);
      const to = idx + (intent.delta < 0 ? -1 : 1);
      if (idx === -1 || to < 0 || to >= blocks.length) return null;
      [blocks[idx], blocks[to]] = [blocks[to], blocks[idx]];
      return { ...instance, blocks };
    }

    // ── A different coordination domain for Complementary, this date only ──
    if (intent.action === 'swap_domain') {
      const idx = instance.blocks.findIndex(b => b.key === 'complementary');
      if (idx === -1 || !intent.domain) return null;
      const old = instance.blocks[idx];
      const blocks = instance.blocks.map(b => ({ ...b }));
      const next = this._regenerateBlockAtDuration({ ...old, coordDomain: intent.domain }, old.duration, instance, profile);
      if (!next || !(next.exercises || []).length) return null;
      blocks[idx] = next;
      return { ...instance, blocks };
    }

    // ── A different skill line for Accessory & Skill, this date only ──
    if (intent.action === 'swap_skill_line') {
      const idx = instance.blocks.findIndex(b => b.key === 'accessory');
      const line = typeof SKILL_LINES !== 'undefined' ? SKILL_LINES[intent.line] : null;
      if (idx === -1 || !line) return null;
      const old = instance.blocks[idx];
      const blocks = instance.blocks.map(b => ({ ...b }));
      const next = this._regenerateBlockAtDuration(
        { ...old, recipeKind: 'skill', recipeKey: intent.line, label: 'Accessory & Skill \u2014 ' + line.label },
        old.duration, { ...instance, skillLine: intent.line }, profile);
      if (!next) return null;
      blocks[idx] = next;
      return { ...instance, blocks, skillLine: intent.line };
    }

    // ── Swap the cardio modality for this date only (rain, gym closed, no
    // time to get to the loop) ──
    // Rebuilds just the cardio exercise; everything else on the day is left
    // exactly as it is. The protocol and heart-rate numbers carry across —
    // an interval day stays an interval day on whichever machine — but the
    // text is rewritten for the machine, so a bike day never says "walk the
    // hills".
    if (intent.action === 'swap_modality') {
      const blocks = instance.blocks.map(b => ({ ...b }));
      const idx = blocks.findIndex(b => /^main-focus:cardio$/.test(b.key || '') || b.key === 'cardio');
      if (idx === -1) return null;
      const exs = blocks[idx].exercises || [];
      const oi = exs.findIndex(e => this._cardioModality(e.id));
      const old = oi === -1 ? null : exs[oi];
      if (!old || this._exHasWork(old)) return null;
      const from = this._cardioModality(old.id);
      const wantMod = intent.modality === 'run' ? 'run' : intent.modality === 'bike' ? 'bike' : (from === 'run' ? 'bike' : 'run');
      if (wantMod === from) return null;
      let protocol = old.target && old.target.protocol;
      if (!protocol && typeof MonthPlan !== 'undefined') {
        const src = MonthPlan.dayFor(instance.contentDate || instance.date);
        protocol = src && src.mainFocusPlan && src.mainFocusPlan.cardio && src.mainFocusPlan.cardio.protocol;
      }
      let wantId = this._CARDIO_PAIRS[from][old.id];
      if (wantMod === 'run' && protocol && protocol.type === 'tempo') wantId = 'tempo-run';
      const painTags = this._parsePainTags(instance.pain);
      const resolveEx = this._resolveExFactory(profile, painTags.avoid);
      const ex = wantId && resolveEx(wantId);
      if (!ex) return null;
      const text = (protocol && this._protocolText(protocol, wantMod)) || (old.target && old.target.text) || '';
      ex.role = old.role || 'main';
      ex.allocatedMinutes = old.allocatedMinutes || blocks[idx].duration;
      ex.target = { ...(old.target || {}), text, protocol: protocol || null, planNote: '' };
      ex.notes = `${text}${text ? ' \u2014 ' : ''}on the ${wantMod === 'bike' ? 'bike' : 'run'} today (planned: ${old.name}).`;
      ex.swappedFrom = old.id;
      const newExs = exs.slice(); newExs[oi] = ex;
      const cfgLabel = wantMod === 'bike' ? 'Zone 2 bike' : 'Zone 2 run';
      const label = /interval|tempo/.test(ex.id) ? (wantMod === 'bike' ? 'Intervals \u2014 bike' : 'Intervals \u2014 run') : cfgLabel;
      blocks[idx] = { ...blocks[idx], exercises: newExs, label,
        plannedNote: blocks[idx].plannedNote || blocks[idx].note,
        note: `${text}. Swapped from the ${from} \u2014 same minutes, same heart-rate numbers.` };
      return { ...instance, blocks, modalitySwapped: wantMod };
    }

    // ── Shorter: scale every block, keep the shape ──
    // Fixed-content blocks just shrink. Pool-backed blocks are refitted at
    // the new duration so the exercise count follows the time rather than
    // leaving ten exercises in a twenty-minute block.
    if (intent.action === 'scale_session') {
      const f = Math.min(1, Math.max(0.3, Number(intent.factor) || 0.7));
      const blocks = instance.blocks.map(b => {
        if (!b.duration) return { ...b };
        const nd = Math.max(5, Math.round(b.duration * f));
        return this._regenerateBlockAtDuration(b, nd, instance, profile) || { ...b, duration: nd };
      });
      return { ...instance, blocks, duration: blocks.reduce((s, b) => s + (b.duration || 0), 0), scaledBy: f };
    }

    // ── Lighter: same time, lower intensity ──
    // Caps the tier every pool can draw from, so a heavy day becomes a
    // moderate one without becoming a short one.
    if (intent.action === 'lighter') {
      const cap = intent.maxTier || 'moderate';
      const prev = this._tierCap;
      this._tierCap = cap;
      try {
        const blocks = instance.blocks.map(b => b.pinned
          ? this._lightenPinned(b)
          : (this._regenerateBlockAtDuration(b, b.duration, instance, profile) || { ...b }));
        return { ...instance, blocks, tierCapped: cap };
      } finally { this._tierCap = prev; }
    }

    // ── Swap one exercise, leave the rest of the day alone ──
    // Reached from the exercise sheet. The replacement comes from the same
    // pool the block was built from, minus everything already in the day,
    // and inherits the minutes so the block still adds up.
    if (intent.action === 'swap_exercise') {
      const blocks = instance.blocks.map(b => ({ ...b, exercises: [...(b.exercises || [])] }));
      const bi = blocks.findIndex(b => b.key === intent.blockKey);
      if (bi === -1) return null;
      const ei = blocks[bi].exercises.findIndex(e => e.id === intent.exerciseId);
      if (ei === -1) return null;
      const old = blocks[bi].exercises[ei];
      // Already trained: a swap would throw the logged sets away.
      if (this._exHasWork(old)) return null;
      // A run or ride swaps with its other-machine twin, protocol intact —
      // not with a kettlebell swing "for 10 minutes" (review 2.3).
      if (this._cardioModality(old.id) && /^main-focus:cardio$|^cardio$/.test(blocks[bi].key || '')) {
        return this._applyOverrideRaw(instance, { action: 'swap_modality' }, profile);
      }

      const used = new Set();
      instance.blocks.forEach(b => (b.exercises || []).forEach(e => used.add(e.id)));
      let pool = this._poolForBlock(blocks[bi], instance).filter(id => !used.has(id));
      // In Main Focus the replacement has to do the same job: same movement
      // pattern and same way of logging. A squat is replaced by a squat
      // pattern, never a lateral raise.
      // Closest job first: same pattern, then same main muscle, then at
      // least the same way of logging. A lift is never replaced by
      // something logged differently.
      // The weights pool alone is too thin for that (a squat's only squat-
      // pattern neighbour there is an isometric), so a Main Focus lift looks
      // across the whole library, never at prehab or explosive work, and
      // gives up rather than offer a lateral raise for a squat.
      if ((blocks[bi].key || '').startsWith('main-focus:') && old.logType !== 'cardio') {
        const tags = typeof EXERCISE_TAGS !== 'undefined' ? EXERCISE_TAGS : {};
        const mine = tags[old.id] || {};
        const cands = LIBRARY.filter(e => !used.has(e.id) && e.logType === old.logType
          && e.restGroup !== 'prehab' && e.subcategory !== 'Prehab' && e.intensityTier !== 'explosive').map(e => e.id);
        const byPat = mine.pattern && mine.pattern !== 'other' ? cands.filter(id => tags[id] && tags[id].pattern === mine.pattern) : [];
        const byMus = mine.muscle ? cands.filter(id => tags[id] && tags[id].muscle === mine.muscle) : [];
        pool = byPat.length ? byPat : byMus;
      }
      if (!pool.length) return null;

      const painTags  = this._parsePainTags(instance.pain);
      const resolveEx = this._resolveExFactory(profile, painTags.avoid);
      const lastSeen  = History.getExerciseLastSeenMap(60);
      // Longest-unseen first (never seen first of all), ties by id, so a
      // swap is also a rotation and repeated swaps walk the pool instead of
      // flipping between two picks.
      const ordered = pool.slice().sort((a, b) => {
        const la = lastSeen[a] || '', lb = lastSeen[b] || '';
        if (la !== lb) return la < lb ? -1 : 1;
        return a < b ? -1 : a > b ? 1 : 0;
      });

      let pick = null;
      for (const id of ordered) { pick = resolveEx(id); if (pick) break; }
      if (!pick) return null;
      // The replacement does the same job, dosed for the same minutes.
      if (old.role && old.role !== 'main' && typeof Complementary !== 'undefined') {
        this._attachDose(pick, old.role);
        const fitted = Complementary.fitDose(pick.target, Math.max(30, (old.allocatedMinutes || 2) * 60), old.role);
        pick.target = { ...fitted, text: Complementary.doseText({ ...fitted, text: undefined }) };
      } else if (old.target) {
        // Sets and reps carry; the load belonged to the old lift and does not.
        const t = { ...old.target }; delete t.loadKg; delete t.protocol;
        t.text = typeof Complementary !== 'undefined' ? Complementary.doseText({ ...t, text: undefined }) : (t.text || '');
        pick.role = old.role; pick.target = t;
      }
      pick.allocatedMinutes = old.allocatedMinutes;
      blocks[bi].exercises[ei] = pick;
      return { ...instance, blocks, swapped: { from: old.id, to: pick.id } };
    }

    // ── Reshuffle: same shape, different picks ──
    if (intent.action === 'reshuffle') {
      const used = new Set();
      instance.blocks.forEach(b => (b.exercises || []).forEach(e => used.add(e.id)));
      const prev = this._avoidIds;
      this._avoidIds = used;
      try {
        const blocks = instance.blocks.map(b =>
          this._regenerateBlockAtDuration(b, b.duration, instance, profile) || { ...b });
        return { ...instance, blocks };
      } finally { this._avoidIds = prev; }
    }

    return null; // 'note_only' or unrecognized action — caller handles the fallback message
  },

  // Intensity ordering, used by the 'lighter' override. Set transiently on
  // the Generator rather than threaded through every signature, because the
  // cap applies to a whole regeneration pass and nothing else reads it.
  _TIER_RANK: { flexibility: 0, light: 1, moderate: 2, heavy: 3, explosive: 4 },
  _tierCap: null,
  _avoidIds: null,
  _excludeRestGroups: null,

  _applyPoolFilters(ids) {
    let out = ids;
    if (this._tierCap) {
      const cap = this._TIER_RANK[this._tierCap];
      const kept = out.filter(id => {
        const ex = LIBRARY.find(e => e.id === id);
        const r = ex && this._TIER_RANK[ex.intensityTier];
        return r === undefined || r === null ? true : r <= cap;
      });
      if (kept.length) out = kept;   // never empty a block to honour a cap
    }
    if (this._avoidIds && this._avoidIds.size) {
      const kept = out.filter(id => !this._avoidIds.has(id));
      if (kept.length) out = kept;
    }
    // Main Focus never draws prehab (set transiently around main-focus
    // generation). Unlike the filters above this may empty a pool: an empty
    // Main Focus is visible, ten wrist drills labelled "Weights" are not.
    if (this._excludeRestGroups && this._excludeRestGroups.size) {
      out = out.filter(id => {
        const ex = LIBRARY.find(e => e.id === id);
        return !(ex && (this._excludeRestGroups.has(ex.restGroup) || ex.subcategory === 'Prehab'));
      });
    }
    return out;
  },

  // Regenerates a single block's exercise list at a new duration, reusing
  // the same pool the block was originally built from (re-derived from the
  // block key + the instance's own weekday/theme-override/correlation-mode,
  // not stored anywhere — a pure function of those, same as generateFromScaffold
  // itself). Fixed-content blocks (Reading, Breakfast, Meditate, Light Work)
  // just get their duration bumped, no pool involved.
  // The pool a given block was drawn from — re-derived, never stored, the
  // same way _regenerateBlockAtDuration derives it. Shared so a single-
  // exercise swap and a whole-block resize can never disagree about where
  // a block's exercises are allowed to come from.
  _recipeStepsFor(block) {
    if (!block || !block.recipeKind || !block.recipeKey) return null;
    if (block.recipeKind === 'mobility' && typeof MOBILITY_RECIPES !== 'undefined') return (MOBILITY_RECIPES[block.recipeKey] || {}).steps || null;
    if (block.recipeKind === 'skill' && typeof SKILL_LINES !== 'undefined') return (SKILL_LINES[block.recipeKey] || {}).steps || null;
    if (block.recipeKind === 'close' && typeof CLOSE_RECIPES !== 'undefined') return CLOSE_RECIPES[block.recipeKey] || null;
    return null;
  },

  _poolForBlock(block, instance) {
    const key = block.key || '';
    const steps = this._recipeStepsFor(block);
    if (steps) {
      let ids = [...new Set(steps.flatMap(st => st.ids || []))];
      if (block.recipeKind === 'mobility' && (block.coordDomain || instance.coordDomain) === 'movement') {
        const ex = new Set(this._movementFamilies());
        ids = ids.filter(id => { const l = LIBRARY.find(e => e.id === id); return l && !ex.has(l.family); });
      }
      return ids;
    }
    if (key === 'open' || key === 'close') return [];
    if (key === 'complementary') {
      return this._poolForCoordDomain(block.coordDomain || instance.coordDomain, instance.dayKind, block.skillLine || instance.skillLine);
    }
    if (key.startsWith('main-focus:')) {
      // Swapping inside a pinned lift day stays within real training work.
      return this._poolForTag(key.replace('main-focus:', '')).filter(id => {
        const ex = LIBRARY.find(e => e.id === id);
        return !(ex && (ex.restGroup === 'prehab' || ex.subcategory === 'Prehab'));
      });
    }
    if (key === 'mobility' || key === 'accessory') {
      const slotKey = instance.themeOverride || instance.dayType || instance.weekday;
      const slot = (typeof WEEK_SCAFFOLD !== 'undefined') ? WEEK_SCAFFOLD[slotKey] : null;
      const tags = (slot && slot[key] && slot[key].tags) || [];
      return [...new Set(tags.flatMap(t => this._poolForTag(t)))];
    }
    return [];
  },

  _regenerateBlockAtDuration(block, newDuration, instance, profile) {
    const painTags    = this._parsePainTags(instance.pain);
    const resolveEx   = this._resolveExFactory(profile, painTags.avoid);
    const lastSeenMap = History.getExerciseLastSeenMap(30);
    // Everything already in the rest of the day stays out of the redraw.
    const used = new Set();
    (instance.blocks || []).forEach(b => { if (b !== block && b.key !== block.key) (b.exercises || []).forEach(e => used.add(e.id)); });
    if (this._avoidIds) this._avoidIds.forEach(id => used.add(id));

    // Recipe blocks rebuild from their recipe at the new length.
    const steps = this._recipeStepsFor(block);
    if (steps) {
      return this._buildRecipeBlock({
        key: block.key, label: block.label, icon: block.icon, color: block.color, bg: block.bg, note: block.note,
        steps, duration: newDuration, recipeKey: block.recipeKey, recipeKind: block.recipeKind,
        resolveEx, lastSeenMap, used, painCaution: painTags.caution,
        excludeFamilies: block.recipeKind === 'mobility' && instance.coordDomain === 'movement' ? this._movementFamilies() : [],
      });
    }
    if (block.key === 'open') {
      return (block.recipeKind === 'open' && this._buildOpenBlock(block.recipeKey, newDuration, resolveEx))
        || this._buildDailyConstantsBlock(newDuration);
    }
    // Old-style Close (no recipe) just takes the new duration.
    if (block.key === 'close') return { ...block, duration: newDuration };

    // The day's coordination domain is recorded on the block itself, so a
    // resize keeps the same theme rather than silently jumping domains.
    if (block.key === 'complementary') {
      return this._buildComplementaryBlock({
        domain: block.coordDomain || instance.coordDomain,
        durationMin: newDuration, resolveEx, lastSeenMap, painCaution: painTags.caution,
        dayType: instance.dayKind, used, skillLine: block.skillLine || instance.skillLine,
      });
    }

    // Pinned Main Focus keeps what the day is for and is only retimed.
    if (block.pinned) {
      const ex = (block.exercises || []).map(e => ({ ...e }));
      return { ...block, duration: newDuration, exercises: this._allocateTime(ex, newDuration) };
    }

    if (block.key.startsWith('main-focus:')) {
      const tag = block.key.replace('main-focus:', '');
      // Cardio is the one tag _getModalityBlocks fills with exactly one
      // exercise. Re-pooling it here handed back "Easy run, Long run" on
      // every resize, so the existing pick is kept and only retimed.
      if (tag === 'cardio') {
        const ex = (block.exercises || [])[0];
        if (ex) return { ...block, duration: newDuration, exercises: [{ ...ex, allocatedMinutes: newDuration }] };
        return { ...block, duration: newDuration };
      }
      const pool = this._poolForTag(tag);
      return { ...block, duration: newDuration, exercises: this._fitToTime(pool, newDuration, resolveEx, lastSeenMap, painTags.caution) };
    }

    if (block.key === 'mobility' || block.key === 'accessory') {
      const slotKey = instance.themeOverride || instance.dayType || instance.weekday;
      const slot = (typeof WEEK_SCAFFOLD !== 'undefined') ? WEEK_SCAFFOLD[slotKey] : null;
      const tags = (slot && slot[block.key] && slot[block.key].tags) || [];
      const pool = [...new Set(tags.flatMap(t => this._poolForTag(t)))];
      return { ...block, duration: newDuration, exercises: this._fitToTime(pool, newDuration, resolveEx, lastSeenMap, painTags.caution) };
    }

    return { ...block, duration: newDuration };
  },

  // Builds a resolveEx(id) closure — the single funnel every block's
  // exercise picks pass through, applying profile exclusion and pain-aware
  // hard exclusion consistently. Factored out so AIGenerator can resolve
  // AI-picked ids into the exact same exercise-object shape the rest of
  // the app expects, without duplicating this logic.
  _resolveExFactory(profile, painAvoid) {
    return (id) => {
      const rawEx = LIBRARY.find(e => e.id === id);
      if (!rawEx) return null;
      // Apply any Settings → Exercise library → Edit override (image, link,
      // notes, rest group, etc.) before building the session instance — the
      // override store is separate from LIBRARY itself, so without this an
      // edited exercise still shows its original data once it lands in a
      // live session (this was the root cause of custom images not showing
      // up as exercise photos, since the plain LIBRARY entry never has one).
      const ex = Overrides.apply(rawEx);
      const state = Profile.getExerciseState(profile, ex.id);
      if (state === 'excluded') return null;
      if (this._isPainExcluded(ex.id, painAvoid)) return null;

      const lastLog = History.getLastExerciseLog(ex.id);
      const pr      = History.getPR(ex.id);
      const prog    = History.getProgressionSuggestion(ex.id);

      return {
        id:          ex.id,
        name:        ex.name,
        category:    ex.category,
        subcategory: ex.subcategory,
        energy:      ex.energy,
        logType:     ex.logType,
        restGroup:   ex.restGroup,
        restSeconds: Profile.getRestDefault(profile, ex.restGroup),
        notes:       ex.notes,
        link:        ex.link,
        imageUrl:    ex.imageUrl || null,
        image:       ex.image || null,
        state,
        lastLog,
        pr,
        progressionSuggestion: prog.suggest ? prog.message : null,
        sets:        [],
        skipped:     false,
        completed:   false,
      };
    };
  },

  // Builds an ExerciseInstance from an already-picked exercise object
  // (a LIBRARY entry or a custom exercise — both share the same shape),
  // without the profile-exclusion/pain-exclusion filtering _resolveExFactory
  // applies. Used for one-off mid-session additions (e.g. "Add random
  // exercise") where the user explicitly chose the exercise rather than
  // the generator picking it, so those exclusions shouldn't silently veto it.
  buildExerciseInstance(rawEx, profile) {
    if (!rawEx) return null;
    // Custom exercises store their own edits directly; library exercises
    // need the override store merged in (same reasoning as _resolveExFactory).
    const ex = rawEx.isCustom ? rawEx : Overrides.apply(rawEx);
    const lastLog = History.getLastExerciseLog(ex.id);
    const pr      = History.getPR(ex.id);
    const prog    = History.getProgressionSuggestion(ex.id);
    return {
      id:          ex.id,
      name:        ex.name,
      category:    ex.category,
      subcategory: ex.subcategory,
      energy:      ex.energy,
      logType:     ex.logType,
      restGroup:   ex.restGroup,
      restSeconds: Profile.getRestDefault(profile, ex.restGroup),
      notes:       ex.notes,
      link:        ex.link,
      imageUrl:    ex.imageUrl || null,
      image:       ex.image || null,
      state:       Profile.getExerciseState(profile, ex.id),
      lastLog,
      pr,
      progressionSuggestion: prog.suggest ? prog.message : null,
      sets:        [],
      skipped:     false,
      completed:   false,
    };
  },

  // Accepts either `themes` (new — array of modality tag ids) or a legacy
  // single `theme` string (still used internally by AIGenerator's
  // 'ai-freeform' path) — normalized to `themeList` below.
  _buildBlocks({ theme, themes, tier, durations, lowEnergy, useExt, profile, focus, lastSeenMap, recentMuscleIntensity, painTags, blockOrder, cardioMode }) {
    const blocks = [];
    const painAvoid   = painTags?.avoid   || new Set();
    const painCaution = painTags?.caution || new Set();
    const themeList   = themes || (theme ? [theme] : []);

    const resolveEx = this._resolveExFactory(profile, painAvoid);

    // ── LIGHT BLOCK ──────────────────────────────────────────
    const lightExIds = ['dead-hang', 'deep-squat-hold', 'spinal-waves-standing', 'vertical-shake'];
    if (tier >= 3) lightExIds.push('bear-crawl', 'crab-walk', 'inchworm', 'body-tapping', 'pandiculation');
    if (tier >= 3) lightExIds.push('ankle-dorsiflexion', 'balance-board');
    if (tier === 4) lightExIds.push(
      'spinal-waves-floor', 'feldenkrais', 'ground-get-ups',
      // Flexibility in light block on long days
      'couch-stretch', 'hamstring-hang', 'pancake', 'bridge', 'shoulder-overhead-stretch'
    );

    blocks.push({
      key:      'lightBlock',
      label:    'Light block',
      icon:     'sun',
      color:    '#1D9E75',
      bg:       '#E1F5EE',
      duration: durations.lightBlock,
      note:     'Pre-breakfast. Light load only — non-negotiable.',
      exercises: this._fitToTime(lightExIds, durations.lightBlock, resolveEx, lastSeenMap, painCaution, false, recentMuscleIntensity),
      rotationNote: this._rotationNote(lightExIds, lastSeenMap),
    });

    // ── BREAKFAST ────────────────────────────────────────────
    // A real, duration-controlled composer row now (rather than a fixed
    // 0-minute ritual step). `durations.breakfast` comes from the composer
    // for normal sessions; the ai-freeform scaffold never sets it, so it
    // falls back to a sensible default buffer instead of disappearing.
    const breakfastMin = durations.breakfast ?? 15;
    if (breakfastMin > 0) {
      blocks.push({
        key:      'breakfast',
        label:    'Breakfast',
        icon:     'coffee',
        color:    '#BA7517',
        bg:       '#FAEEDA',
        duration: breakfastMin,
        note:     'Eat. No heavy loading before this settles.',
        exercises: [{
          id:      'breakfast',
          name:    'Eat + digest',
          logType: 'none',
          notes:   'Buffer between light block and work. Non-negotiable.',
          sets:    [],
          completed: false,
          skipped:   false,
          link:    null,
        }],
      });
    }

    // ── MEDITATE ─────────────────────────────────────────────
    const meditateIds = tier >= 3
      ? ['box-breathing', 'visualization', 'trataka']
      : ['box-breathing', 'visualization'];

    blocks.push({
      key:      'meditate',
      label:    'Meditate',
      icon:     'brain',
      color:    '#7F77DD',
      bg:       '#EEEDFE',
      duration: durations.meditate,
      note:     'Post-breakfast. Fixed slot. Mental rehearsal before skill.',
      exercises: this._fitToTime(meditateIds, durations.meditate, resolveEx, null, painCaution),
    });

    // ── WARM-UP (skipped only when every selected tag is low-intensity) ──
    const LOW_INTENSITY_TAGS = ['flexibility', 'mobility-movement', 'yoga', 'coordination', 'cardio'];
    const skipWarmup = themeList.length > 0 && themeList.every(t => LOW_INTENSITY_TAGS.includes(t));
    if (!skipWarmup) {
      const warmupIds = useExt
        ? ['shoulder-cars', 'hip-cars', 'wrist-cars', 'wrist-prep',
           'ankle-cars', 'neck-cars', 'spine-cars',
           'band-pull-aparts', 'ext-rotation-bands', 'face-pulls',
           'rice-bucket', 'dynamic-stretches']
        : ['shoulder-cars', 'hip-cars', 'wrist-cars', 'wrist-prep',
           'band-pull-aparts', 'ext-rotation-bands', 'face-pulls'];

      blocks.push({
        key:      'warmup',
        label:    'Warm-up',
        icon:     'flame',
        color:    '#1D9E75',
        bg:       '#E1F5EE',
        duration: durations.warmup,
        note:     'CARs + prehab. Never skip.',
        exercises: this._fitToTime(warmupIds, durations.warmup, resolveEx, null, painCaution, false, recentMuscleIntensity),
      });
    }

    // ── ONE BLOCK PER SELECTED MODALITY TAG ───────────────────
    const { blocks: themeBlocks } = this._getModalityBlocks({
      themes: themeList, tier, durations, lowEnergy, useExt, profile, focus, resolveEx, lastSeenMap,
      recentMuscleIntensity, painAvoid, painCaution, cardioMode,
    });
    blocks.push(...themeBlocks);

    // ── COOL-DOWN ────────────────────────────────────────────
    // Merge cooldown pools from every selected tag (deduped) — a session
    // combining e.g. Strength A + Skill gets both tags' wind-down options.
    const coolIdsRaw = [...new Set(themeList.flatMap(t => this._MODALITY_COOLDOWN[t] || []))];
    const coolIds = coolIdsRaw.length ? coolIdsRaw : ['body-scan'];
    blocks.push({
      key:      'cooldown',
      label:    'Cool-down',
      icon:     'moon',
      color:    '#5F5E5A',
      bg:       '#F1EFE8',
      duration: durations.cooldown,
      note:     '',
      exercises: this._fitToTime(coolIds, durations.cooldown, resolveEx),
    });

    // Drop blocks you allocated 0 minutes to.
    const built = blocks.filter(b => b.exercises.length > 0);

    // ── APPLY COMPOSER ORDER ─────────────────────────────────
    // `blockOrder` is the list of block keys in the order the user chose
    // in the composer (session blocks composer supports free reordering,
    // including where Breakfast falls in the sequence). Any built block
    // whose key isn't listed (shouldn't normally happen) keeps its
    // built-in position by sorting to the end, stably.
    if (Array.isArray(blockOrder) && blockOrder.length) {
      const orderIndex = new Map(blockOrder.map((k, i) => [k, i]));
      built.forEach((b, i) => { b.__origIdx = i; });
      built.sort((a, b) => {
        const ai = orderIndex.has(a.key) ? orderIndex.get(a.key) : blockOrder.length + a.__origIdx;
        const bi = orderIndex.has(b.key) ? orderIndex.get(b.key) : blockOrder.length + b.__origIdx;
        return ai - bi;
      });
      built.forEach(b => { delete b.__origIdx; });
    }

    return built;
  },

  // Which library exercises currently carry a given modality tag — read
  // live off each exercise's `modalityTags` field (data/library.js), with
  // any user override applied first. This is what makes tag editing from
  // Settings → Exercise library → Edit → Modality tags actually take
  // effect in generation, instead of a hardcoded list living in this file.
  _poolForTag(tag) {
    return LIBRARY.filter(ex => {
      const ov = Overrides.get(ex.id);
      const modalityTags = ov?.modalityTags || ex.modalityTags || [];
      return modalityTags.includes(tag);
    }).map(ex => ex.id);
  },

  // The 10 selectable modalities (see project taxonomy notes — modality
  // list agreed 2026-07-12). Somatic (light block) and Meditation stay
  // fixed scaffolding, never selectable tags.
  _MODALITY_COOLDOWN: {
    'weights':                ['couch-stretch','hamstring-hang','pancake','middle-splits','shoulder-overhead-stretch','foam-rolling','tre-tremoring','body-scan'],
    'calisthenics':           ['couch-stretch','hamstring-hang','pancake','middle-splits','shoulder-overhead-stretch','foam-rolling','tre-tremoring','body-scan'],
    'gymnastics-conditioning':['couch-stretch','hamstring-hang','pancake','middle-splits','shoulder-overhead-stretch','foam-rolling','tre-tremoring','body-scan'],
    'mobility-movement':      ['body-tapping','feldenkrais','straightjacket-shake','body-scan'],
    'flexibility':            ['foam-rolling','tre-tremoring','yoga-nidra','body-scan'],
    'weighted-mobility':      ['foam-rolling','tre-tremoring','couch-stretch','body-scan'],
    'yoga':                   ['foam-rolling','tre-tremoring','yoga-nidra','body-scan'],
    'power-plyo':             ['tre-tremoring','vertical-shake','straightjacket-shake','couch-stretch','hamstring-hang','foam-rolling','body-scan'],
    'cardio':                 ['foam-rolling','tre-tremoring','body-tapping','straightjacket-shake','body-scan'],
    'coordination':           ['body-tapping','feldenkrais','straightjacket-shake','body-scan'],
  },

  _MODALITY_CONFIG: {
    'weights':                 { label: 'Weights',                 icon: 'barbell',    color: '#185FA5', bg: '#E6F0FA' },
    'calisthenics':             { label: 'Calisthenics',            icon: 'star',       color: '#2E7D5B', bg: '#E3F3EC' },
    'gymnastics-conditioning':  { label: 'Gymnastics Conditioning', icon: 'activity',   color: '#D8890A', bg: '#FBEEDA' },
    'mobility-movement':        { label: 'Mobility / Movement',     icon: 'run',        color: '#178F5A', bg: '#E1F5EE' },
    'flexibility':              { label: 'Flexibility',             icon: 'stretching', color: '#196F3D', bg: '#E1F5EE' },
    'weighted-mobility':        { label: 'Weighted Mobility',       icon: 'barbell',    color: '#7B5FC7', bg: '#F0EEFE' },
    'yoga':                     { label: 'Yoga',                    icon: 'sun',        color: '#9B59B6', bg: '#F5EAFB' },
    'power-plyo':                { label: 'Power / Plyo',            icon: 'bolt',       color: '#A32D2D', bg: '#FAE8E8' },
    'cardio':                    { label: 'Cardio',                  icon: 'heart-rate', color: '#1A7A4A', bg: '#E1F5EE' },
    'coordination':              { label: 'Coordination',            icon: 'circles',    color: '#7F77DD', bg: '#EEEDFE' },
  },

  // Builds one block per selected modality tag (each with its own
  // independently-sized duration from `durations[tagId]`). Every tag runs
  // through the same generic pool → rotate → fit-to-time pipeline — the
  // only special case left is Cardio, which still needs a single fixed
  // exercise pick (bike vs run) and a steady/intervals prescription rather
  // than a multi-exercise pool, same as it always has.
  _getModalityBlocks({ themes, tier, durations, lowEnergy, useExt, profile, focus, resolveEx, lastSeenMap, recentMuscleIntensity, painAvoid, painCaution, cardioMode, cardioModality }) {
    const blocks = [];
    painAvoid   = painAvoid   || new Set();
    painCaution = painCaution || new Set();

    // Ankle/knee pain (avoided or just sore) is exactly the case the bike
    // substitution is for — prefer it over ground-impact cardio regardless
    // of tier, rather than only switching to it on long sessions.
    const preferBike = ['ankle', 'knee'].some(j => painAvoid.has(j) || painCaution.has(j));

    (themes || []).forEach(tag => {
      const dur = durations?.[tag];
      const cfg = this._MODALITY_CONFIG[tag];
      if (!cfg) return; // unrecognized/legacy tag (e.g. 'ai-freeform') — no static block
      if (!dur || dur <= 0) return;

      if (tag === 'cardio') {
        // The day says which it is. Without this the branch picked the bike
        // on every session of tier 3+, so a week with two runs, a long easy
        // run and a bike day generated four identical indoor cycling blocks.
        // Ankle/knee pain still overrides to the bike.
        // The mode picks the exercise, not just its note. Before this an
        // interval day generated "Easy run" with an intervals note glued on,
        // so history recorded a 4x4 VO2max session as an easy run and every
        // zone stat downstream judged it against a zone-2 standard.
        const isIntervals = cardioMode === 'intervals';
        const runId  = isIntervals ? 'interval-run'     : 'easy-run';
        const bikeId = isIntervals ? 'interval-cycling' : 'z2-cycling';
        const byModality = cardioModality === 'run' ? runId
                         : cardioModality === 'bike' ? bikeId : null;
        const cardioId = preferBike ? bikeId
                       : (byModality || (tier >= 3 ? bikeId : runId));
        const cardioEx = resolveEx(cardioId) || resolveEx(bikeId) || resolveEx(runId);
        if (cardioEx) cardioEx.allocatedMinutes = dur; // one exercise fills the whole block, no transition buffer needed
        const swapNote = preferBike && cardioEx?.id === 'z2-cycling' ? ' Swapped to the bike — easier on the ankle/knee today.' : '';
        if (isIntervals) {
          if (cardioEx) {
            const work = useExt ? '3 min' : '2 min';
            const rest = useExt ? '2 min' : '90s';
            cardioEx.notes = `Intervals: ${work} hard / ${rest} easy, repeat for ${dur} min.` + swapNote;
          }
          blocks.push({ key: tag, label: cfg.label, icon: cfg.icon, color: cfg.color, bg: cfg.bg, duration: cardioEx ? dur : 0, note: 'Push the work intervals — recover fully on the easy ones.', exercises: cardioEx ? [cardioEx] : [] });
        } else {
          if (cardioEx) {
            cardioEx.notes = (tier >= 3 ? '45–60' : '30') + ' min. Nose breathing. Conversational pace.' + swapNote;
          }
          blocks.push({ key: tag, label: cfg.label, icon: cfg.icon, color: cfg.color, bg: cfg.bg, duration: cardioEx ? dur : 0, note: 'Nose breathing throughout. Conversational pace.', exercises: cardioEx ? [cardioEx] : [] });
        }
        return;
      }

      // Every other modality: generic pool → rotate → fit-to-time, same
      // machinery every other block in the app uses.
      const pool = this._poolForTag(tag);
      const exercises = this._fitToTime(pool, dur, resolveEx, lastSeenMap, painCaution, false, recentMuscleIntensity);
      blocks.push({
        key: tag, label: cfg.label, icon: cfg.icon, color: cfg.color, bg: cfg.bg,
        duration: dur, note: '', exercises,
        rotationNote: this._rotationNote(pool, lastSeenMap),
      });
    });

    return { blocks };
  },

  // Suggest focus adjustments based on stale goals
  getFocusSuggestions(profile) {
    const stale = History.getStaledGoals(7);
    const priority1 = stale.filter(g => {
      const pg = GOALS.find(x => x.id === g.id);
      return pg && pg.priority === 1;
    });
    return priority1.length > 0 ? priority1 : stale.slice(0, 2);
  },
};


// ═════════════════════════════════════════════════════════════
// 4b. AI GENERATION (bring-your-own-key, direct from browser)
// ═════════════════════════════════════════════════════════════
// Free-text session generation. Reuses Generator for everything it already
// does well (block-duration budgeting, light/meditate/warmup/cooldown
// scaffolding, pain parsing/exclusion, resolveEx) and only asks the model
// to do the one thing it's actually needed for: picking real exercises
// (and how to split the "work" time across them) from a pre-filtered,
// compact candidate list. The model never sees or invents an exercise id
// that isn't in the payload we sent it, and anything it returns is
// re-validated against that same list before it's allowed into a session.
const AIGenerator = {
  API_URL: 'https://api.anthropic.com/v1/messages',
  API_VERSION: '2023-06-01',

  // Strip candidates down to only what the model needs to make a good
  // pick — dropping notes/links/etc. is most of the token savings on top
  // of the category pre-filter.
  _compactCandidates(candidates) {
    return candidates.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      subcategory: ex.subcategory,
      difficulty: ex.difficulty,
      logType: ex.logType,
      energy: ex.energy,
    }));
  },

  // "id:daysAgo" pairs, candidates only, and only ones actually seen —
  // gives the model just enough to avoid repeating yesterday's picks
  // without shipping the full history.
  _compactRecency(lastSeenMap, candidateIds) {
    const idSet = new Set(candidateIds);
    const parts = [];
    Object.keys(lastSeenMap || {}).forEach(id => {
      if (!idSet.has(id)) return;
      const days = Math.floor((Date.now() - new Date(lastSeenMap[id]).getTime()) / 86400000);
      parts.push(`${id}:${days}d`);
    });
    return parts.join(', ');
  },

  buildPrompt({ freeText, workMinutes, candidates, lastSeenMap, painTags, focus }) {
    const compact = this._compactCandidates(candidates);
    const recency = this._compactRecency(lastSeenMap, candidates.map(c => c.id));
    const avoid   = painTags?.avoid?.size   ? [...painTags.avoid].join(', ')   : 'none';
    const caution = painTags?.caution?.size ? [...painTags.caution].join(', ') : 'none';

    const system = `You design a single practice-session's "core work" content for a personal movement/skill training app. You are given a fixed time budget and a pool of exercises the user is actually allowed to do today — pick real ids from that pool only, never invent an id, name, or exercise that isn't listed. Return ONLY valid JSON matching this exact shape, no markdown fences, no commentary outside the JSON:
{
  "blocks": [
    { "label": "string, short and specific", "minutes": number, "exerciseIds": ["id", "id"] }
  ],
  "rationale": "2-3 sentences, plain conversational coaching voice, explaining why you picked what you picked for today specifically"
}
Rules:
- 1 to 3 blocks total. Most requests only need 1-2.
- Block minutes must sum to approximately the given total work budget (small rounding is fine, don't pad).
- Only use exercise ids from the provided candidate list.
- Prefer exercises not recently trained (see the recency list) when the request doesn't specify otherwise — variety matters more than repeating favorites.
- If joints are flagged "avoid" or "caution", you won't see excluded exercises in the candidate list at all (already filtered out) — just don't dwell on it, the app handles exclusion separately.
- Keep the rationale short — 2-3 sentences, not a full essay. The JSON must always be complete and valid; never let the rationale run so long it gets cut off.`;

    const user = `Request: "${freeText}"
Total work time budget: ${workMinutes} minutes
Recent training focus note: ${focus || 'none given'}
Pain check-in — avoid: ${avoid}; caution (go lighter, don't exclude): ${caution}
Recently trained (id:days ago), candidates only: ${recency || 'no recent history'}

Candidate exercises (id, name, category, subcategory, difficulty 1-5, logType, energy):
${JSON.stringify(compact)}`;

    return { system, user };
  },

  async callClaude({ apiKey, model, system, user }) {
    const res = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': this.API_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        // Generous headroom above what a 1-3 block session + a short
        // rationale actually needs (a few hundred tokens in practice).
        // Anthropic bills by tokens actually generated, not this cap, so
        // raising it costs nothing unless the model really needs it — it
        // just stops the response getting cut off mid-JSON on longer
        // sessions (was 1024, too tight: a long candidate list + a
        // multi-block session + rationale could blow past it, producing
        // an unparseable truncated JSON string instead of a clean error).
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error?.message || ''; } catch {}
      throw new Error(`Anthropic API error (${res.status})${detail ? ': ' + detail : ''}`);
    }

    const data = await res.json();
    const text = data?.content?.find(b => b.type === 'text')?.text;
    if (!text) throw new Error('Anthropic API returned no text content.');
    // stop_reason 'max_tokens' means the response was cut off mid-generation
    // — surface that plainly instead of letting it fail as a confusing
    // "unterminated string" JSON parse error downstream.
    return { text, truncated: data.stop_reason === 'max_tokens' };
  },

  // Models sometimes wrap JSON in ```json fences despite instructions not
  // to — strip those before parsing rather than failing on them.
  _extractJSON(text, truncated) {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      if (truncated) {
        throw new Error('AI response got cut off before finishing — try again, or ask for a shorter/simpler session.');
      }
      throw new Error('Could not parse AI response as JSON: ' + e.message);
    }
    if (!parsed || !Array.isArray(parsed.blocks)) {
      throw new Error('AI response was missing a "blocks" array.');
    }
    return parsed;
  },

  // Re-validates every returned exercise id against the real candidate set
  // (defense in depth — never trust the model's word that it only used
  // what it was given) and resolves each into the same exercise-object
  // shape the rest of the app expects.
  _mapToBlocks(parsed, candidates, resolveEx) {
    const candidateIds = new Set(candidates.map(c => c.id));
    const keyOrder = ['skill', 'main', 'aiWork2'];
    const colors = [
      { color: '#378ADD', bg: '#E6F1FB', icon: 'star' },
      { color: '#D85A30', bg: '#FAECE7', icon: 'barbell' },
      { color: '#7F77DD', bg: '#EEEDFE', icon: 'circles' },
    ];

    const blocks = parsed.blocks
      .slice(0, 3)
      .map((b, i) => {
        const validIds = (b.exerciseIds || []).filter(id => candidateIds.has(id));
        const exercises = validIds.map(resolveEx).filter(Boolean);
        if (!exercises.length) return null;
        const style = colors[i] || colors[colors.length - 1];
        return {
          key:      keyOrder[i] || `aiWork${i}`,
          label:    b.label || 'AI-picked work',
          icon:     style.icon,
          color:    style.color,
          bg:       style.bg,
          duration: Math.max(5, Math.round(Number(b.minutes) || 0)),
          note:     'Picked by AI for today\'s request.',
          exercises,
          aiGenerated: true,
        };
      })
      .filter(Boolean);

    if (!blocks.length) throw new Error('AI response had no usable exercises after validation.');
    return blocks;
  },

  // Full pipeline: local filter → prompt → API call → validate → assemble
  // a session in the exact shape Generator.generate() produces, so it can
  // drop straight into the existing compose screen.
  async generateSession({ freeText, duration, sleep, energy, pain, focus, profile }) {
    const apiKey = profile?.settings?.anthropicApiKey;
    if (!apiKey) throw new Error('Add an Anthropic API key in Settings → AI generation first.');
    const model = profile?.settings?.aiModel || 'claude-sonnet-5';

    const tier      = Generator.getTier(duration);
    const durations = Generator.getBlockDurations(duration, energy);
    const lastSeenMap = History.getExerciseLastSeenMap(30);
    const painTags  = Generator._parsePainTags(pain);
    const painAvoid = painTags.avoid;

    const workMinutes = durations.skill + durations.main;

    const { candidates: rawCandidates } = Generator._filterLibraryByIntent(freeText);
    // Drop anything already excluded (profile or pain) before it ever
    // reaches the model — saves tokens and guarantees the model can't
    // pick something that would just get filtered out anyway.
    const resolveEx = Generator._resolveExFactory(profile, painAvoid);
    const candidates = rawCandidates.filter(ex => {
      if (Profile.getExerciseState(profile, ex.id) === 'excluded') return false;
      if (Generator._isPainExcluded(ex.id, painAvoid)) return false;
      return true;
    });
    if (!candidates.length) {
      throw new Error('No exercises matched that request after filtering — try different wording.');
    }

    const { system, user } = this.buildPrompt({ freeText, workMinutes, candidates, lastSeenMap, painTags, focus });
    const { text: responseText, truncated } = await this.callClaude({ apiKey, model, system, user });
    const parsed = this._extractJSON(responseText, truncated);
    const workBlocks = this._mapToBlocks(parsed, candidates, resolveEx);

    const lowEnergy = (sleep > 0 && sleep < 3) || (energy > 0 && energy < 3);
    const useExt    = tier >= 3 && !lowEnergy;
    const scaffold  = Generator._buildBlocks({
      theme: 'ai-freeform', tier, durations, lowEnergy, useExt, profile, focus, lastSeenMap, painTags,
    });

    // Scaffold gives light/breakfast/meditate/warmup/cooldown; splice the
    // AI's work blocks in between warmup and cooldown (or before cooldown
    // if warmup was somehow absent).
    const cooldownIdx = scaffold.findIndex(b => b.key === 'cooldown');
    const blocks = cooldownIdx === -1
      ? [...scaffold, ...workBlocks]
      : [...scaffold.slice(0, cooldownIdx), ...workBlocks, ...scaffold.slice(cooldownIdx)];

    return {
      id: null,
      date: new Date().toISOString(),
      theme: 'ai-freeform',
      themeLabel: freeText,
      duration,
      tier,
      sleep,
      energy,
      pain,
      focus,
      status: 'active',
      startedAt: Date.now(),
      completedAt: null,
      notes: '',
      blocks,
      aiRationale: parsed.rationale || null,
      painNote: (painTags.avoid.size || painTags.caution.size)
        ? { avoid: [...painTags.avoid], caution: [...painTags.caution] }
        : null,
    };
  },
};

// ── CHAT OVERRIDE (project_scaffold_revamp, Phase 5) ────────────
// Interprets a free-text request about TODAY's already-generated scaffold
// instance into one structured action (see Generator.applyOverride for the
// deterministic executor). Same direct-browser-to-Anthropic, bring-your-own-
// key pattern as AIGenerator above — reused rather than duplicated
// infrastructure, per the 2026-08-06 decision to not stand up a separate
// backend for this.
const ChatOverride = {
  API_URL: 'https://api.anthropic.com/v1/messages',
  API_VERSION: '2023-06-01',

  buildPrompt({ message, instance }) {
    const blockSummary = instance.blocks
      .map(b => `${b.key} — "${b.label}" (${b.duration}min)`)
      .join('\n');
    const themeOptions = (typeof WEEK_SCAFFOLD !== 'undefined')
      ? Object.keys(WEEK_SCAFFOLD).map(k => `${k}: ${WEEK_SCAFFOLD[k].theme}${WEEK_SCAFFOLD[k].fasting ? ' (fasted)' : ''}`).join('\n')
      : '';

    const system = `You interpret a single natural-language request about TODAY's already-generated movement practice session and translate it into ONE structured action. You never invent exercises, durations, or new blocks yourself — you only choose among the existing blocks/themes given to you. Return ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{
  "action": "theme_swap" | "swap_modality" | "scale_session" | "lighter" | "reshuffle" | "remove_block" | "note_only",
  "targetTheme": "<week scaffold key, only for theme_swap>",
  "modality": "run" | "bike",
  "factor": <0.3-1.0, only for scale_session>,
  "maxTier": "light" | "moderate",
  "blockKey": "<block key from today's blocks, only for remove_block>",
  "giveMinutesTo": "<another block key to receive the freed time, optional, only for remove_block>",
  "reply": "1-2 plain sentences, conversational, confirming what you changed — or, for note_only, briefly explaining you couldn't map this to a concrete change"
}
Rules:
- "theme_swap": requests to replace today's whole plan with a different day-type (e.g. "swap today for the rest day", "I'm exhausted, make today active rest instead"). targetTheme must be exactly one of the week-scaffold keys listed below — never invent one.
- "swap_modality": the aerobic work should happen on the other machine — rain, a closed gym, a sore ankle. "run" or "bike". Duration and heart-rate cap are unchanged; only the exercise swaps.
- "scale_session": less time today. 'factor' is the fraction of the normal session to keep — "half" is 0.5, "a bit shorter" is about 0.75. Every block shrinks; the shape stays.
- "lighter": the same time but easier — groggy, sore, run down. 'maxTier' caps how hard anything picked may be: "moderate" for most cases, "light" when they sound genuinely wrecked.
- "reshuffle": bored of these exercises, wants different ones at the same shape and duration.
- "remove_block": requests to cut/drop one specific existing block. blockKey must be exactly one of today's actual block keys listed below — never invent one. If the request also names where the freed time should go ("more time for reading"), set giveMinutesTo to that block's key; otherwise omit it (freed time is simply dropped from the session).
- If the request doesn't clearly map to one of these three, use "note_only" and explain briefly why in reply — never guess at a change you're not confident about.`;

    const user = `User request: "${message}"

Today's actual blocks (key — label (duration)):
${blockSummary}

Week scaffold options (key: theme):
${themeOptions}`;

    return { system, user };
  },

  // Same request shape as AIGenerator.callClaude — not factored into a
  // shared helper to keep each module's error handling independently
  // readable, mirroring how the two modules were already kept separate.
  async callClaude({ apiKey, model, system, user }) {
    const res = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': this.API_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024, // a single small action object + a short reply — never needs much
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error?.message || ''; } catch {}
      throw new Error(`Anthropic API error (${res.status})${detail ? ': ' + detail : ''}`);
    }

    const data = await res.json();
    const text = data?.content?.find(b => b.type === 'text')?.text;
    if (!text) throw new Error('Anthropic API returned no text content.');
    return { text, truncated: data.stop_reason === 'max_tokens' };
  },

  _extractJSON(text, truncated) {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      if (truncated) throw new Error('AI response got cut off before finishing — try again.');
      throw new Error('Could not parse AI response as JSON: ' + e.message);
    }
    if (!parsed || !parsed.action) throw new Error('AI response was missing an action.');
    return parsed;
  },

  async interpret({ message, instance, profile }) {
    const apiKey = profile?.settings?.anthropicApiKey;
    if (!apiKey) throw new Error('Add an Anthropic API key in Settings → AI generation first.');
    const model = profile?.settings?.aiModel || 'claude-sonnet-5';
    const { system, user } = this.buildPrompt({ message, instance });
    const { text, truncated } = await this.callClaude({ apiKey, model, system, user });
    return this._extractJSON(text, truncated);
  },
};


// ═════════════════════════════════════════════════════════════
// 5. TIMER
// ═════════════════════════════════════════════════════════════

const Timer = {
  _stopwatchInterval: null,
  _countdownInterval: null,
  _countdownRemaining: 0,
  _stopwatchElapsed: 0,
  _onTick: null,
  _onDone: null,

  // ── Stopwatch (for holds, cardio if needed) ───────────────
  // Elapsed time is read off the wall clock, not counted in ticks: a phone
  // with the screen locked throttles or pauses setInterval, so a 60s hold
  // used to log as a few seconds.
  _stopwatchStartedAt: 0,
  startStopwatch(onTick) {
    this.stopAll();
    this._stopwatchElapsed = 0;
    this._stopwatchStartedAt = Date.now();
    this._onTick = onTick;
    this._stopwatchInterval = setInterval(() => {
      this._stopwatchElapsed = Math.round((Date.now() - this._stopwatchStartedAt) / 1000);
      onTick && onTick(this._stopwatchElapsed);
    }, 1000);
  },

  stopStopwatch() {
    if (this._stopwatchInterval) this._stopwatchElapsed = Math.round((Date.now() - this._stopwatchStartedAt) / 1000);
    clearInterval(this._stopwatchInterval);
    this._stopwatchInterval = null;
    return this._stopwatchElapsed; // returns elapsed seconds
  },

  // ── Rest countdown ────────────────────────────────────────
  _countdownEndsAt: 0,
  startCountdown(seconds, onTick, onDone) {
    this.stopAll();
    this._countdownRemaining = seconds;
    this._countdownEndsAt = Date.now() + seconds * 1000;
    this._onTick = onTick;
    this._onDone = onDone;

    onTick && onTick(this._countdownRemaining);

    this._countdownInterval = setInterval(() => {
      this._countdownRemaining = Math.max(0, Math.round((this._countdownEndsAt - Date.now()) / 1000));
      onTick && onTick(this._countdownRemaining);
      if (this._countdownRemaining <= 0) {
        this.stopCountdown();
        onDone && onDone();
        // Vibrate on done if supported
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
  },

  adjustCountdown(deltaSecs) {
    // ±15s adjustment
    this._countdownRemaining = Math.max(0, this._countdownRemaining + deltaSecs);
    this._countdownEndsAt = Date.now() + this._countdownRemaining * 1000;
    this._onTick && this._onTick(this._countdownRemaining);
  },

  stopCountdown() {
    clearInterval(this._countdownInterval);
    this._countdownInterval = null;
  },

  stopAll() {
    this.stopStopwatch();
    this.stopCountdown();
  },

  isRunning() {
    return !!(this._stopwatchInterval || this._countdownInterval);
  },

  // Format seconds to mm:ss
  format(secs) {
    const s = Math.abs(Math.round(secs));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  },
};


// ═════════════════════════════════════════════════════════════
// 6. LIVE SESSION STATE
// ═════════════════════════════════════════════════════════════

const LiveSession = {
  _session: null,
  _onUpdate: null,

  start(session, onUpdate) {
    this._session = session;
    this._onUpdate = onUpdate;
    Timer.stopAll();
    this._persist();
  },

  getSession() { return this._session; },

  // Restore an in-progress session that survived a reload — phone locked
  // mid-exercise, PWA got evicted from memory while backgrounded, tab got
  // killed, etc. Mirrors start(), minus the "new session" setup, since the
  // saved object already has all logged sets/completion state.
  restore(onUpdate) {
    const saved = DB.get('active_session');
    if (!saved || saved.status !== 'active') return null;
    this._session = saved;
    this._onUpdate = onUpdate;
    return saved;
  },

  // Snapshot the in-progress session to localStorage so nothing is lost if
  // the page gets unloaded before "Complete session" is tapped. Cheap
  // (local write only — this key isn't synced to Supabase, see sync.js
  // _syncKey), so it's called after every mutation below rather than
  // throttled.
  _persist() {
    if (this._session) DB.set('active_session', this._session);
  },

  // Log a set for a specific exercise (block/exercise index — the session
  // screen renders every exercise at once, so the caller always knows
  // exactly which one it's logging against).
  logSet(blockIdx, exIdx, { weight, reps, duration, note, rpe, completed = true }) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (!ex) return;

    const set = {
      idx:       (ex.sets?.length || 0) + 1,
      weight:    weight || null,
      reps:      reps || null,
      duration:  duration || null, // seconds
      note:      note || '',
      completed,
      loggedAt:  Date.now(),
    };
    if (rpe) set.rpe = rpe;
    ex.sets = ex.sets || [];
    ex.sets.push(set);
    this._persist();
    this._onUpdate && this._onUpdate(this._session);

    // Auto-start rest timer if exercise has rest
    if (completed && ex.restSeconds > 0) {
      return { startRest: true, restSeconds: ex.restSeconds };
    }
    return { startRest: false };
  },

  // ── One tap: "done as prescribed" ──
  // Writes the target as logged sets (weight × reps, holds, the cardio
  // minutes), so a plain tick teaches history, e1RM and progression
  // something instead of nothing. Returns false when there is no target.
  logAsPrescribed(blockIdx, exIdx, { rpe } = {}) {
    const ex = this._getExercise(blockIdx, exIdx);
    const t = ex && ex.target;
    if (!ex || !t) return false;
    const n = Math.max(1, Math.min(12, t.sets || 1));
    const now = Date.now();
    const mk = (i, fields) => ({ idx: (ex.sets?.length || 0) + i + 1, weight: null, reps: null, duration: null,
      note: 'as prescribed', completed: true, loggedAt: now, ...(rpe ? { rpe } : {}), ...fields });
    ex.sets = ex.sets || [];
    if (ex.logType === 'cardio') {
      ex.cardioLog = ex.cardioLog || { duration: t.durationSec || (ex.allocatedMinutes || 0) * 60, distanceKm: null,
        appleFitnessLink: '', note: 'as prescribed', avgHr: null };
    } else if (ex.logType === 'weight+reps' || ex.logType === 'reps') {
      const reps = typeof t.reps === 'number' ? t.reps : parseInt(t.reps, 10) || null;
      const load = ex.logType === 'weight+reps' && t.loadKg != null ? t.loadKg : null;
      for (let i = 0; i < n; i++) ex.sets.push(mk(i, { weight: load, reps }));
    } else if (ex.logType === 'hold') {
      const dur = t.durationSec || null;
      for (let i = 0; i < n; i++) ex.sets.push(mk(i, { duration: dur }));
    }
    ex.completed = true;
    ex.skipped = false;
    ex.doneAsPrescribed = true;
    this._persist();
    this._onUpdate && this._onUpdate(this._session);
    return true;
  },

  // RPE for the exercise: stamped on every logged set (and the exercise),
  // which is what Insights.progression reads.
  setRpe(blockIdx, exIdx, rpe) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (!ex) return;
    ex.rpe = rpe || null;
    (ex.sets || []).forEach(st => { if (rpe) st.rpe = rpe; else delete st.rpe; });
    this._persist();
    this._onUpdate && this._onUpdate(this._session);
  },

  // Today's target for one exercise (accepting a progression suggestion).
  // The plan is not touched.
  setTarget(blockIdx, exIdx, patch) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (!ex) return;
    const t = { ...(ex.target || {}), ...patch, accepted: true };
    if (typeof Complementary !== 'undefined') {
      const txt = Complementary.doseText({ ...t, text: undefined, protocol: undefined });
      const lib = LIBRARY.find(l => l.id === ex.id);
      t.text = lib && lib.bodyweightBase && t.loadKg ? txt.replace('@ ' + t.loadKg + 'kg', '+' + t.loadKg + 'kg') : txt;
    }
    ex.target = t;
    this._persist();
    this._onUpdate && this._onUpdate(this._session);
  },

  // Everything untouched in a block, done as prescribed.
  markBlockDone(blockIdx) {
    const b = this._session?.blocks[blockIdx];
    if (!b) return;
    b.exercises.forEach((ex, i) => {
      if (ex.completed || ex.skipped || (ex.sets || []).length || ex.cardioLog) return;
      if (!this.logAsPrescribed(blockIdx, i)) { ex.completed = true; }
    });
    this._persist();
    this._onUpdate && this._onUpdate(this._session);
  },

  unmarkExerciseDone(blockIdx, exIdx) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (!ex) return;
    ex.completed = false;
    this._persist();
    this._onUpdate && this._onUpdate(this._session);
  },

  // Finishing with rows left open marks them skipped ("not done") instead of
  // refusing to finish.
  skipRemaining(reason) {
    if (!this._session) return 0;
    let n = 0;
    this._session.blocks.forEach(b => b.exercises.forEach(ex => {
      if (ex.logType !== 'none' && !ex.completed && !ex.skipped) { ex.skipped = true; ex.skipReason = reason || 'not done'; n++; }
    }));
    this._persist();
    return n;
  },

  // Mark exercise done (no sets — for holds, somatic, etc.)
  markExerciseDone(blockIdx, exIdx) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (ex) {
      ex.completed = true;
      this._persist();
      this._onUpdate && this._onUpdate(this._session);
    }
  },

  // Skip exercise
  skipExercise(blockIdx, exIdx) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (ex) {
      ex.skipped = true;
      this._persist();
      this._onUpdate && this._onUpdate(this._session);
    }
  },

  // Add a note to an exercise
  addExerciseNote(blockIdx, exIdx, note) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (ex) {
      ex.sessionNote = note;
      this._persist();
      this._onUpdate && this._onUpdate(this._session);
    }
  },

  // Log cardio exercise
  logCardio(blockIdx, exIdx, { durationMin, durationSec, distanceKm, appleFitnessLink, note, avgHr, rpe }) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (!ex) return;
    ex.cardioLog = {
      duration: durationMin * 60 + (durationSec || 0),
      distanceKm: distanceKm || null,
      appleFitnessLink: appleFitnessLink || '',
      note: note || '',
      avgHr: avgHr || null,
      ...(rpe ? { rpe } : {}),
    };
    ex.completed = true;
    this._persist();
    this._onUpdate && this._onUpdate(this._session);
  },

  // Add session-level note
  setSessionNote(note) {
    if (this._session) {
      this._session.notes = note;
      this._persist();
      this._onUpdate && this._onUpdate(this._session);
    }
  },

  // Remove a previously logged set — mis-tapped weight, stopped the
  // stopwatch by accident, etc. Renumbers the remaining sets so idx stays
  // contiguous (1, 2, 3…) for display.
  removeSet(blockIdx, exIdx, setIdx) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (!ex || !ex.sets || !ex.sets[setIdx]) return;
    ex.sets.splice(setIdx, 1);
    ex.sets.forEach((s, i) => { s.idx = i + 1; });
    this._persist();
    this._onUpdate && this._onUpdate(this._session);
  },

  // Fully remove an exercise from a block — distinct from skipExercise(),
  // which just soft-hides it (kept for history/progress accounting).
  // Splices the block's exercises array, so every exercise after this one
  // shifts down an index — callers must re-render the whole session/block
  // afterward rather than patching the single row that used to live here.
  removeExercise(blockIdx, exIdx) {
    const block = this._session?.blocks?.[blockIdx];
    if (!block || !block.exercises?.[exIdx]) return;
    block.exercises.splice(exIdx, 1);
    this._persist();
    this._onUpdate && this._onUpdate(this._session);
  },

  // Add an already-built ExerciseInstance (see Generator.buildExerciseInstance)
  // to the end of a block. Used for "Add random exercise".
  addExercise(blockIdx, ex) {
    const block = this._session?.blocks?.[blockIdx];
    if (!block || !ex) return;
    block.exercises.push(ex);
    this._persist();
    this._onUpdate && this._onUpdate(this._session);
  },

  // Finds (or lazily creates) a catch-all block for exercises added
  // mid-session that don't share a category with any existing block.
  // Returns the block's index.
  ensureExtraBlock() {
    if (!this._session) return -1;
    let idx = this._session.blocks.findIndex(b => b.key === 'extra');
    if (idx === -1) {
      this._session.blocks.push({
        key: 'extra', label: 'Extra exercises', icon: 'circles',
        color: '#6B6B6B', bg: '#EFEFEF', duration: 0,
        note: 'Added mid-session.', exercises: [],
      });
      idx = this._session.blocks.length - 1;
      this._persist();
      this._onUpdate && this._onUpdate(this._session);
    }
    return idx;
  },

  // Complete the session
  complete() {
    if (!this._session || this._session.status === 'completed') return null;
    this._session.status = 'completed';
    this._session.completedAt = Date.now();
    // Planned and executed are different things: record which plan day this
    // session carried out, and when, so a Strength B done on Thursday is
    // still Friday's Strength B (review 5.2).
    this._session.executedAt = this._session.completedAt;
    if (typeof Day !== 'undefined' && this._session.weekday) this._session.planRef = Day.planRef(this._session);
    Timer.stopAll();
    // If this session was already checkpoint-logged mid-workout (see
    // logCheckpoint), finish by updating that same history entry instead
    // of creating a duplicate one.
    const id = this._session.loggedHistoryId
      ? History.updateSession(this._session.loggedHistoryId, this._session)
      : History.saveSession(this._session);
    this._session.id = id;

    // Scaffold-generated sessions own a per-date daily_instance record
    // (project_scaffold_revamp Phase 4, key 'daily_instance_YYYY-MM-DD',
    // synced to Supabase daily_instances). That record was written at
    // generation time and never touched since, so without this write-back
    // it still holds the *pristine* plan: reopening the app later the same
    // day and tapping "Today's Plan" would restart the whole session from
    // zero as if it had never been trained. Store the finished copy so the
    // record is the truthful log of the day (status, sets, chat overrides)
    // and startScaffoldToday can see it's done.
    if (this._session.weekday && this._session.date) {
      DB.set('daily_instance_' + this._session.date, this._session);
    }

    DB.remove('active_session');
    // A finished session is no longer live. Keeping it here left Home on
    // "Session in progress → Continue", and a second Complete wrote a
    // duplicate History entry (review 2.4).
    this._session = null;
    return id;
  },

  // True if every loggable exercise in the session has been checked off
  // (completed) or explicitly skipped. Mirrors the done/total math used
  // for the on-screen block progress counters.
  isFullyDone() {
    if (!this._session) return true;
    let allDone = true;
    this._session.blocks.forEach(b => b.exercises.forEach(ex => {
      if (ex.logType !== 'none' && !ex.completed && !ex.skipped) allDone = false;
    }));
    return allDone;
  },

  // Save current progress to history WITHOUT ending the live session —
  // for hitting "Complete session" when something's still unchecked. Keeps
  // this._session.status as 'active' (untouched) so restore() still picks
  // the session back up after a reload; only the saved history snapshot is
  // marked 'in-progress'. Reuses the same history entry on repeat
  // checkpoints rather than creating duplicates.
  logCheckpoint() {
    if (!this._session) return null;
    this._session.duration = Math.round((Date.now() - this._session.startedAt) / 60000);
    const snapshot = JSON.parse(JSON.stringify(this._session));
    snapshot.status = 'in-progress';

    const id = this._session.loggedHistoryId
      ? History.updateSession(this._session.loggedHistoryId, snapshot)
      : History.saveSession(snapshot);
    this._session.loggedHistoryId = id;
    this._persist();
    return id;
  },

  // Discard session without saving
  discard() {
    Timer.stopAll();
    this._session = null;
    DB.remove('active_session');
  },

  _getExercise(blockIdx, exIdx) {
    return this._session?.blocks[blockIdx]?.exercises[exIdx] || null;
  },

  // Get progress stats for the session header
  getProgress() {
    if (!this._session) return null;
    let total = 0, done = 0;
    this._session.blocks.forEach(b => {
      b.exercises.forEach(ex => {
        if (ex.logType !== 'none') {
          total++;
          if (ex.completed || ex.skipped) done++;
        }
      });
    });
    const elapsed = Math.round((Date.now() - this._session.startedAt) / 60000);
    return { total, done, elapsed };
  },
};


// ═════════════════════════════════════════════════════════════
// 7. UTILITIES
// ═════════════════════════════════════════════════════════════

const Utils = {
  // Format a date string nicely
  formatDate(iso) {
    if (!iso) return '';
    // 'YYYY-MM-DD' is a local date; new Date() would read it as UTC midnight.
    const d = (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) ? new Date(iso + 'T12:00:00') : new Date(iso);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  },

  // Format duration in seconds to "Xm Ys"
  formatDuration(secs) {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
  },

  // Format duration in seconds to mm:ss
  formatMMSS(secs) {
    const s = Math.abs(Math.round(secs));
    return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  },

  // Format total minutes as "Xh Ymin" (used by the muscle distribution
  // card's Duration stat, where session.duration values get summed).
  formatHoursMin(totalMin) {
    const m = Math.round(totalMin || 0);
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (h === 0) return `${rem}min`;
    if (rem === 0) return `${h}h`;
    return `${h}h ${rem}min`;
  },

  // Days since a date string
  daysSince(iso) {
    if (!iso) return null;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  },

  // Export data as downloadable JSON
  exportToFile() {
    const data = DB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `practice-brain-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import data from JSON file
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          DB.importAll(data);
          resolve(data);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  // Get theme display config
  getThemeConfig(themeId) {
    const configs = {
      // Selectable modality tags (Generate screen multi-select) — the 10
      // modalities agreed 2026-07-12 (see project taxonomy notes).
      'weights':                 { label: 'Weights',                 color: '#185FA5', icon: 'barbell'    },
      'calisthenics':             { label: 'Calisthenics',            color: '#2E7D5B', icon: 'star'       },
      'gymnastics-conditioning':  { label: 'Gymnastics Conditioning', color: '#D8890A', icon: 'activity'   },
      'mobility-movement':        { label: 'Mobility / Movement',     color: '#178F5A', icon: 'run'        },
      'flexibility':               { label: 'Flexibility',             color: '#196F3D', icon: 'stretching' },
      'weighted-mobility':         { label: 'Weighted Mobility',       color: '#7B5FC7', icon: 'barbell'    },
      'yoga':                      { label: 'Yoga',                    color: '#9B59B6', icon: 'sun'        },
      'power-plyo':                 { label: 'Power / Plyo',            color: '#A32D2D', icon: 'bolt'       },
      'cardio':                     { label: 'Cardio',                  color: '#1A7A4A', icon: 'heart-rate' },
      'coordination':               { label: 'Coordination',            color: '#7F77DD', icon: 'circles'    },
      'ai-freeform':                { label: 'AI session',              color: '#378ADD', icon: 'star'       },
      // Legacy theme ids — retired from the picker (replaced 2026-07-12),
      // kept here only so old saved sessions still render a sensible
      // label/color/icon in history and the calendar.
      'strength-a':   { label: 'Strength A',       color: '#185FA5', icon: 'barbell'    },
      'strength-b':   { label: 'Strength B',       color: '#0E4A85', icon: 'barbell'    },
      'plio-a':       { label: 'Plio A',            color: '#7B5FC7', icon: 'barbell'    },
      'plio-b':       { label: 'Plio B',            color: '#533483', icon: 'barbell'    },
      'skill':        { label: 'Skill',             color: '#378ADD', icon: 'star'       },
      'z2':           { label: 'Zone 2',            color: '#1A7A4A', icon: 'run'        },
      'movement':     { label: 'Movement',          color: '#178F5A', icon: 'run'        },
      'power':        { label: 'Power',             color: '#A32D2D', icon: 'bolt'       },
      'intervals':    { label: 'Intervals',         color: '#C0392B', icon: 'heart-rate' },
      'rest':         { label: 'Rest + Recovery',   color: '#5D6D7E', icon: 'moon'       },
      'z2-movement':  { label: 'Z2 + Movement',     color: '#1A7A4A', icon: 'run'        },
      'intense':      { label: 'Intense',           color: '#A32D2D', icon: 'bolt'       },
      'z2-flex':      { label: 'Z2 + Flexibility',  color: '#196F3D', icon: 'run'        },
    };
    return configs[themeId] || { label: themeId, color: '#888', icon: 'activity' };
  },

  // ── Session theme helpers (support both new multi-tag sessions and
  // legacy single-theme sessions) ─────────────────────────────────
  // New sessions store `themes: string[]`; sessions saved before this
  // feature only have a single `theme` string. Both shapes may also show up
  // in the lightweight session-index entries (History.getIndex), not just
  // full session records, so these helpers accept either.
  getSessionThemeIds(session) {
    if (!session) return [];
    if (Array.isArray(session.themes) && session.themes.length) return session.themes;
    if (session.theme) return [session.theme];
    return [];
  },

  getSessionLabel(session) {
    const ids = this.getSessionThemeIds(session);
    if (!ids.length) return 'Session';
    return ids.map(id => this.getThemeConfig(id).label).join(' + ');
  },

  getSessionColor(session) {
    const ids = this.getSessionThemeIds(session);
    return ids.length ? this.getThemeConfig(ids[0]).color : '#888';
  },
};


// ═════════════════════════════════════════════════════════════
// 8. APP STATE (single source of truth for UI)
// ═════════════════════════════════════════════════════════════

const App = {
  profile:     null,
  screen:      'home',   // 'home' | 'generate' | 'session' | 'history' | 'settings'
  checkin:     { sleep: 0, energy: 0, pain: '', duration: 90, focus: '', cardioMode: 'steady' },
  theme:       null,
  session:     null,     // active LiveSession data
  _listeners:  [],

  init() {
    this.profile = Profile.load();
    this._render();
  },

  navigate(screen) {
    this.screen = screen;
    this._render();
  },

  subscribe(fn) {
    this._listeners.push(fn);
  },

  _render() {
    this._listeners.forEach(fn => fn(this));
  },

  // Called when session updates mid-session
  onSessionUpdate(session) {
    this.session = session;
    this._render();
  },
};
