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
    index.unshift({ id, date: session.date, theme: session.theme, themes: session.themes, duration: session.duration, source: session.source || 'generated' });
    // Keep last 200 sessions in index
    if (index.length > 200) index.pop();
    DB.set('session_index', index);

    // Update exercise history cache
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

  // Best estimated 1RM ever logged for this exercise, from completed
  // session history, with the set that produced it.
  getBestEstimate(exerciseId, limit = 50) {
    const hist = this.getExerciseHistory(exerciseId, limit);
    let best = null;
    hist.forEach(h => {
      h.sets.forEach(s => {
        const e1rm = this.estimateOneRM(s.weight, s.reps);
        if (e1rm && (!best || e1rm > best.e1rm)) {
          best = { e1rm, weight: s.weight, reps: s.reps, date: h.date };
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

  // The six muscle-group buckets used by EXERCISE_TAGS[id].muscle (see
  // data/library.js) and by the "Muscle distribution" card on the Log
  // screen. Order matches the hexagon's clockwise layout starting at
  // the top: Back, Chest, Core, Shoulders, Arms, Legs.
  MUSCLE_GROUPS: ['back', 'chest', 'core', 'shoulders', 'arms', 'legs'],

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
    lightBlock: 60, objManip: 40, meditate: 40,
    warmup: 20, skill: 45, main: 90, cooldown: 30,
  },

  // Base allocations per tier before energy adjustment
  _BASE: {
    1: { lightBlock: 10, objManip: 0,  meditate: 10, warmup: 10, skill: 10, main: 15, cooldown: 5  },
    2: { lightBlock: 15, objManip: 0,  meditate: 12, warmup: 15, skill: 25, main: 35, cooldown: 15 },
    3: { lightBlock: 25, objManip: 15, meditate: 20, warmup: 20, skill: 40, main: 55, cooldown: 20 },
    4: { lightBlock: 45, objManip: 25, meditate: 30, warmup: 20, skill: 40, main: 75, cooldown: 25 },
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
      base.objManip   = base.objManip > 0 ? Math.min(base.objManip + 10, ceil.objManip) : base.objManip;
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
  _estimateExerciseMinutes(ex) {
    const rest = ex.restSeconds || 0;
    switch (ex.logType) {
      case 'weight+reps': return (3 * (40 + rest)) / 60;              // 3 working sets
      case 'reps':        return (2 * (30 + Math.min(rest, 30))) / 60; // bodyweight/band, brief rest
      case 'hold':         return (2 * (30 + rest)) / 60;              // 2 holds
      case 'cardio':       return 15;                                  // user logs actual time
      case 'none':
      default:              return 0;
    }
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

  // Pick exercises off an ordered candidate list until the estimated time
  // reaches the block's target duration, instead of always dumping the
  // whole curated list regardless of how much time was allotted.
  // Always includes at least one exercise when targetMin > 0.
  // If lastSeenMap is provided, the pool is rotated group-first (see
  // _orderByGroupRecency) so pool-style blocks (light/objManip/skill) vary
  // day to day — both which movement family shows up and which specific
  // exercise within it — rather than always surfacing the same items.
  //
  // painCaution (optional Set of joint tags) pushes exercises that touch a
  // sore/tight joint to the back of the pool — they're still eligible, just
  // deprioritized behind safer options. Hard exclusion (avoid) happens one
  // level up, inside resolveEx, so it applies uniformly everywhere.
  //
  // preferRaisesHR (optional bool) is only set when this call is topping up
  // a block with time reclaimed from a pain-excluded exercise elsewhere
  // (see _getThemeBlocks) — it stable-sorts raisesHR:true candidates first
  // so the reclaimed time goes toward something that still keeps HR up.
  _fitToTime(ids, targetMin, resolveEx, lastSeenMap, painCaution, preferRaisesHR) {
    const picked = [];
    if (!targetMin || targetMin <= 0) return picked;
    let ordered = this._orderByGroupRecency(ids, lastSeenMap);

    if (painCaution && painCaution.size) {
      const safe = ordered.filter(id => !this._isPainCaution(id, painCaution));
      const flagged = ordered.filter(id => this._isPainCaution(id, painCaution));
      ordered = [...safe, ...flagged];
    }
    if (preferRaisesHR) {
      const hr = ordered.filter(id => this._tagsFor(id)?.raisesHR);
      const rest = ordered.filter(id => !this._tagsFor(id)?.raisesHR);
      ordered = [...hr, ...rest];
    }

    let used = 0;
    for (const id of ordered) {
      if (used >= targetMin && picked.length > 0) break;
      const ex = resolveEx(id);
      if (!ex) continue;
      picked.push(ex);
      used += this._estimateExerciseMinutes(ex);
    }
    return picked;
  },

  // Main generation function
  // Returns a structured session object ready for the live screen
  // `themes` is an array of selected modality tag ids, e.g. ['strength-a','skill','z2'].
  generate({ themes, duration, sleep, energy, pain, focus, profile, customDurations, blockOrder }) {
    const tier      = this.getTier(duration);
    const durations = customDurations || this.getBlockDurations(duration, energy);
    const lowEnergy = (sleep > 0 && sleep < 3) || (energy > 0 && energy < 3);
    const useExt    = tier >= 3 && !lowEnergy;
    const lastSeenMap = History.getExerciseLastSeenMap(30);
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
      blocks:    this._buildBlocks({ themes, tier, durations, lowEnergy, useExt, profile, focus, lastSeenMap, painTags, blockOrder }),
      painNote:  (painTags.avoid.size || painTags.caution.size)
        ? { avoid: [...painTags.avoid], caution: [...painTags.caution] }
        : null,
    };

    return session;
  },

  // Builds a resolveEx(id) closure — the single funnel every block's
  // exercise picks pass through, applying profile exclusion and pain-aware
  // hard exclusion consistently. Factored out so AIGenerator can resolve
  // AI-picked ids into the exact same exercise-object shape the rest of
  // the app expects, without duplicating this logic.
  _resolveExFactory(profile, painAvoid) {
    return (id) => {
      const ex = LIBRARY.find(e => e.id === id);
      if (!ex) return null;
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
  buildExerciseInstance(ex, profile) {
    if (!ex) return null;
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
  _buildBlocks({ theme, themes, tier, durations, lowEnergy, useExt, profile, focus, lastSeenMap, painTags, blockOrder }) {
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
      exercises: this._fitToTime(lightExIds, durations.lightBlock, resolveEx, lastSeenMap, painCaution),
      rotationNote: this._rotationNote(lightExIds, lastSeenMap),
    });

    // ── OBJECT MANIPULATION (only if you've allocated time to it) ──
    // objIds/objManipMin are hoisted to _buildBlocks scope (not just this
    // if-block) so a pain-driven time reallocation from the theme's main
    // block — computed later, after _getThemeBlocks runs — can top this
    // block back up even if it started at 0 allotted minutes.
    const objIds = tier >= 4
      ? ['stick-static', 'stick-walking', 'stick-transfer',
         'juggling-cascade', 'juggling-variations',
         'tennis-ball-dribble', 'ball-eye-patched', 'contact-juggling']
      : ['stick-static', 'juggling-cascade', 'tennis-ball-dribble'];
    let objManipMin = durations.objManip;

    // In AI-freeform mode, AIGenerator owns the whole objManip+skill+main
    // time budget itself and builds its own blocks for it — building a
    // separate deterministic object-manipulation block here would double
    // up that time.
    if (objManipMin > 0 && !themeList.includes('ai-freeform')) {
      blocks.push({
        key:      'objManip',
        label:    'Object manipulation',
        icon:     'circles',
        color:    '#7F77DD',
        bg:       '#EEEDFE',
        duration: objManipMin,
        note:     'Activating without loading — sharpen focus before meditation.',
        exercises: this._fitToTime(objIds, objManipMin, resolveEx, lastSeenMap, painCaution),
        rotationNote: this._rotationNote(objIds, lastSeenMap),
      });
    }

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
    const LOW_INTENSITY_TAGS = ['rest', 'z2', 'movement', 'flexibility'];
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
        exercises: this._fitToTime(warmupIds, durations.warmup, resolveEx, null, painCaution),
      });
    }

    // ── ONE BLOCK PER SELECTED MODALITY TAG ───────────────────
    const { blocks: themeBlocks, objManipBoost } = this._getModalityBlocks({
      themes: themeList, tier, durations, lowEnergy, useExt, profile, focus, resolveEx, lastSeenMap,
      painAvoid, painCaution, objIds,
    });
    blocks.push(...themeBlocks);

    // A pain-excluded fixed exercise (e.g. a sprint/run main block with an
    // avoided ankle/knee) can leave real, unspent minutes on the table.
    // _getThemeBlocks already reclaims most of that into its own skill
    // block; whatever it hands back here tops up object manipulation too,
    // per the original "increase skill + object manipulation, still raise
    // HR" ask — biased toward exercises that still raise heart rate.
    if (objManipBoost > 0) {
      objManipMin += objManipBoost;
      const boostedObjEx = this._fitToTime(objIds, objManipMin, resolveEx, lastSeenMap, painCaution, true);
      const existingObjBlock = blocks.find(b => b.key === 'objManip');
      if (existingObjBlock) {
        existingObjBlock.duration  = objManipMin;
        existingObjBlock.exercises = boostedObjEx;
        if (!existingObjBlock.note.includes('reclaimed')) {
          existingObjBlock.note += ' Extra minutes reclaimed from today’s pain-adjusted plan.';
        }
      } else if (boostedObjEx.length) {
        blocks.push({
          key:      'objManip',
          label:    'Object manipulation',
          icon:     'circles',
          color:    '#7F77DD',
          bg:       '#EEEDFE',
          duration: objManipMin,
          note:     'Extra time reclaimed from today’s pain-adjusted plan — picked to still raise heart rate.',
          exercises: boostedObjEx,
          rotationNote: this._rotationNote(objIds, lastSeenMap),
        });
      }
    }

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
  // live off each exercise's `modality` field (data/library.js), with any
  // user override applied first. This is what makes tag editing from
  // Settings → Exercise library → Edit → Modality tags actually take
  // effect in generation, instead of a hardcoded list living in this file.
  _poolForTag(tag) {
    return LIBRARY.filter(ex => {
      const ov = Overrides.get(ex.id);
      const modality = ov?.modality || ex.modality || [];
      return modality.includes(tag);
    }).map(ex => ex.id);
  },

  _MODALITY_COOLDOWN: {
    'strength-a': ['couch-stretch','hamstring-hang','pancake','middle-splits','shoulder-overhead-stretch','foam-rolling','tre-tremoring','body-scan'],
    'strength-b': ['couch-stretch','hamstring-hang','pancake','middle-splits','shoulder-overhead-stretch','foam-rolling','tre-tremoring','body-scan'],
    'plio-a':     ['pancake','middle-splits','bridge','couch-stretch','foam-rolling','tre-tremoring','straightjacket-shake','body-scan'],
    'plio-b':     ['pancake','middle-splits','bridge','couch-stretch','foam-rolling','tre-tremoring','straightjacket-shake','body-scan'],
    'skill':      ['couch-stretch','hamstring-hang','pancake','middle-splits','shoulder-overhead-stretch','foam-rolling','tre-tremoring','body-scan'],
    'z2':         ['body-tapping','feldenkrais','straightjacket-shake','body-scan'],
    'movement':   ['body-tapping','feldenkrais','straightjacket-shake','body-scan'],
    'flexibility':['foam-rolling','tre-tremoring','yoga-nidra','body-scan'],
    'power':      ['tre-tremoring','vertical-shake','straightjacket-shake','couch-stretch','hamstring-hang','foam-rolling','body-scan'],
    'intervals':  ['foam-rolling','tre-tremoring','body-tapping','straightjacket-shake','body-scan'],
    'rest':       ['yoga-nidra','body-scan'],
  },

  _MODALITY_CONFIG: {
    'strength-a': { label: 'Strength A', icon: 'barbell',    color: '#D85A30', bg: '#FAECE7' },
    'strength-b': { label: 'Strength B', icon: 'barbell',    color: '#B8451F', bg: '#FAECE7' },
    'plio-a':     { label: 'Plio A',     icon: 'barbell',    color: '#7B5FC7', bg: '#F0EEFE' },
    'plio-b':     { label: 'Plio B',     icon: 'barbell',    color: '#533483', bg: '#F0EEFE' },
    'skill':      { label: 'Skill',      icon: 'star',       color: '#378ADD', bg: '#E6F1FB' },
    'z2':         { label: 'Zone 2',     icon: 'heart-rate', color: '#1A7A4A', bg: '#E1F5EE' },
    'movement':   { label: 'Movement',   icon: 'run',        color: '#178F5A', bg: '#E1F5EE' },
    'flexibility':{ label: 'Flexibility',icon: 'stretching', color: '#196F3D', bg: '#E1F5EE' },
    'power':      { label: 'Power',      icon: 'bolt',       color: '#A32D2D', bg: '#FAE8E8' },
    'intervals':  { label: 'Intervals',  icon: 'heart-rate', color: '#C0392B', bg: '#FAE8E8' },
    'rest':       { label: 'Rest',       icon: 'walk',       color: '#5D6D7E', bg: '#EFF0F1' },
  },

  // Builds one block per selected modality tag (each with its own
  // independently-sized duration from `durations[tagId]`), replacing the
  // old single-theme switch. Static-pool tags reuse the same
  // rotation/pain-caution machinery every other block uses; z2/intervals/
  // rest keep their previous dynamic, non-pool logic since they were never
  // plain fit-to-time picks (cardio choice, a single fixed prescription,
  // a synthetic no-target activity).
  _getModalityBlocks({ themes, tier, durations, lowEnergy, useExt, profile, focus, resolveEx, lastSeenMap, painAvoid, painCaution, objIds }) {
    const blocks = [];
    painAvoid   = painAvoid   || new Set();
    painCaution = painCaution || new Set();
    let objManipBoost = 0;

    // Ankle/knee pain (avoided or just sore) is exactly the case the bike
    // substitution is for — prefer it over ground-impact cardio regardless
    // of tier, rather than only switching to it on long sessions.
    const preferBike = ['ankle', 'knee'].some(j => painAvoid.has(j) || painCaution.has(j));

    (themes || []).forEach(tag => {
      const dur = durations?.[tag];
      const cfg = this._MODALITY_CONFIG[tag];
      if (!cfg) return; // unrecognized/legacy tag (e.g. 'ai-freeform') — no static block
      if (!dur || dur <= 0) return;

      if (tag === 'z2') {
        const cardioId = preferBike ? 'z2-cycling' : (tier >= 3 ? 'z2-cycling' : 'easy-run');
        const cardioEx = resolveEx(cardioId) || resolveEx('z2-cycling') || resolveEx('easy-run');
        if (cardioEx) {
          cardioEx.notes = (tier >= 3 ? '45–60' : '30') + ' min. Nose breathing. Conversational pace.' +
            (preferBike && cardioEx.id === 'z2-cycling' ? ' Swapped to the bike — easier on the ankle/knee today.' : '');
        }
        blocks.push({ key: tag, label: cfg.label, icon: cfg.icon, color: cfg.color, bg: cfg.bg, duration: cardioEx ? dur : 0, note: 'Nose breathing throughout. Conversational pace.', exercises: cardioEx ? [cardioEx] : [] });
        return;
      }

      if (tag === 'intervals') {
        // Cardio work/rest cycling — same exercise pool as Z2 (bike/run),
        // distinguished from Z2 by prescription (on/off effort) rather than
        // conversational steady-state. Uphill sprints live under Power now.
        const cardioId = preferBike ? 'z2-cycling' : (tier >= 3 ? 'z2-cycling' : 'easy-run');
        const cardioEx = resolveEx(cardioId) || resolveEx('z2-cycling') || resolveEx('easy-run');
        if (cardioEx) {
          const work = useExt ? '3 min' : '2 min';
          const rest = useExt ? '2 min' : '90s';
          cardioEx.notes = `Intervals: ${work} hard / ${rest} easy, repeat for ${dur} min.` +
            (preferBike && cardioEx.id === 'z2-cycling' ? ' Swapped to the bike — easier on the ankle/knee today.' : '');
        }
        blocks.push({ key: tag, label: cfg.label, icon: cfg.icon, color: cfg.color, bg: cfg.bg, duration: cardioEx ? dur : 0, note: 'Push the work intervals — recover fully on the easy ones.', exercises: cardioEx ? [cardioEx] : [] });
        return;
      }

      if (tag === 'rest') {
        const walkExcluded = this._isPainExcluded('walking', painAvoid);
        const walkEx = walkExcluded ? null : {
          id: 'walking', name: 'Walking / hiking', logType: 'cardio', energy: 'Low',
          restGroup: 'cardio', restSeconds: 0, notes: 'No targets. Just move.', link: null,
          sets: [], completed: false, skipped: false,
        };
        if (walkExcluded) objManipBoost += dur;
        blocks.push({ key: tag, label: cfg.label, icon: cfg.icon, color: cfg.color, bg: cfg.bg, duration: walkEx ? dur : 0, note: walkEx ? 'No targets. Just move.' : '', exercises: walkEx ? [walkEx] : [] });
        return;
      }

      // Static-pool tags: strength-a/b, plio-a/b, skill, movement, flexibility, power
      const pool = this._poolForTag(tag);
      const exercises = this._fitToTime(pool, dur, resolveEx, lastSeenMap, painCaution);
      blocks.push({
        key: tag, label: cfg.label, icon: cfg.icon, color: cfg.color, bg: cfg.bg,
        duration: dur, note: '', exercises,
        rotationNote: this._rotationNote(pool, lastSeenMap),
      });
    });

    return { blocks, objManipBoost };
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
    const keyOrder = ['skill', 'main', 'objManip'];
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

    const workMinutes = durations.objManip + durations.skill + durations.main;

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
  startStopwatch(onTick) {
    this.stopAll();
    this._stopwatchElapsed = 0;
    this._onTick = onTick;
    this._stopwatchInterval = setInterval(() => {
      this._stopwatchElapsed++;
      onTick && onTick(this._stopwatchElapsed);
    }, 1000);
  },

  stopStopwatch() {
    clearInterval(this._stopwatchInterval);
    this._stopwatchInterval = null;
    return this._stopwatchElapsed; // returns elapsed seconds
  },

  // ── Rest countdown ────────────────────────────────────────
  startCountdown(seconds, onTick, onDone) {
    this.stopAll();
    this._countdownRemaining = seconds;
    this._onTick = onTick;
    this._onDone = onDone;

    onTick && onTick(this._countdownRemaining);

    this._countdownInterval = setInterval(() => {
      this._countdownRemaining--;
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
  logSet(blockIdx, exIdx, { weight, reps, duration, note, completed = true }) {
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
  logCardio(blockIdx, exIdx, { durationMin, durationSec, distanceKm, appleFitnessLink, note }) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (!ex) return;
    ex.cardioLog = {
      duration: durationMin * 60 + (durationSec || 0),
      distanceKm: distanceKm || null,
      appleFitnessLink: appleFitnessLink || '',
      note: note || '',
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
    if (!this._session) return null;
    this._session.status = 'completed';
    this._session.completedAt = Date.now();
    Timer.stopAll();
    const id = History.saveSession(this._session);
    this._session.id = id;
    DB.remove('active_session');
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
    const d = new Date(iso);
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
      // Selectable modality tags (Generate screen multi-select)
      'strength-a':   { label: 'Strength A',       color: '#185FA5', icon: 'barbell'    },
      'strength-b':   { label: 'Strength B',       color: '#0E4A85', icon: 'barbell'    },
      'plio-a':       { label: 'Plio A',            color: '#7B5FC7', icon: 'barbell'    },
      'plio-b':       { label: 'Plio B',            color: '#533483', icon: 'barbell'    },
      'skill':        { label: 'Skill',             color: '#378ADD', icon: 'star'       },
      'z2':           { label: 'Zone 2',            color: '#1A7A4A', icon: 'run'        },
      'movement':     { label: 'Movement',          color: '#178F5A', icon: 'run'        },
      'flexibility':  { label: 'Flexibility',       color: '#196F3D', icon: 'stretching' },
      'power':        { label: 'Power',             color: '#A32D2D', icon: 'bolt'       },
      'intervals':    { label: 'Intervals',         color: '#C0392B', icon: 'heart-rate' },
      'rest':         { label: 'Rest + Recovery',   color: '#5D6D7E', icon: 'moon'       },
      'ai-freeform':  { label: 'AI session',        color: '#378ADD', icon: 'star'       },
      // Legacy theme ids — retired from the picker, kept here only so old
      // saved sessions (from before the multi-select tag system) still
      // render a sensible label/color/icon in history and the calendar.
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
  checkin:     { sleep: 0, energy: 0, pain: '', duration: 90, focus: '' },
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
