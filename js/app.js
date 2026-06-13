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
    // Current week in cycle (1 or 2)
    currentWeek: 1,
    // Rest timer overrides per exercise: { [exerciseId]: seconds }
    restOverrides: {},
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

  toggleWeek(profile) {
    profile.currentWeek = profile.currentWeek === 1 ? 2 : 1;
    this.save(profile);
    return profile.currentWeek;
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
    index.unshift({ id, date: session.date, theme: session.theme, duration: session.duration });
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

  deleteSession(id) {
    DB.remove(id);
    const index = (DB.get('session_index') || []).filter(e => e.id !== id);
    DB.set('session_index', index);
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

  getBlockDurations(duration) {
    const t = this.getTier(duration);
    // [lightBlock, objManip, meditate, warmup, skill, main, cooldown]
    const tiers = {
      1: { lightBlock: 10, objManip: 0,  meditate: 10, warmup: 10, skill: 10, main: 15, cooldown: 5  },
      2: { lightBlock: 15, objManip: 0,  meditate: 12, warmup: 15, skill: 25, main: 35, cooldown: 15 },
      3: { lightBlock: 25, objManip: 15, meditate: 15, warmup: 20, skill: 40, main: 55, cooldown: 25 },
      4: { lightBlock: 55, objManip: 20, meditate: 15, warmup: 20, skill: 60, main: 90, cooldown: 45 },
    };
    return tiers[t];
  },

  // Main generation function
  // Returns a structured session object ready for the live screen
  generate({ theme, duration, sleep, energy, pain, focus, profile }) {
    const tier      = this.getTier(duration);
    const durations = this.getBlockDurations(duration);
    const lowEnergy = (sleep > 0 && sleep < 3) || (energy > 0 && energy < 3);
    const useExt    = tier >= 3 && !lowEnergy;

    const session = {
      id:        null,          // set on save
      date:      new Date().toISOString(),
      theme,
      duration,
      tier,
      sleep,
      energy,
      pain,
      focus,
      weekCycle: profile.currentWeek,
      status:    'active',      // 'active' | 'completed'
      startedAt: Date.now(),
      completedAt: null,
      notes:     '',
      blocks:    this._buildBlocks({ theme, tier, durations, lowEnergy, useExt, profile, focus }),
    };

    return session;
  },

  _buildBlocks({ theme, tier, durations, lowEnergy, useExt, profile, focus }) {
    const blocks = [];

    // Helper: filter exercises by profile state
    const isEnabled = (id) => {
      const state = Profile.getExerciseState(profile, id);
      return state === 'active';
    };

    const resolveEx = (id) => {
      const ex = LIBRARY.find(e => e.id === id);
      if (!ex) return null;
      const state = Profile.getExerciseState(profile, ex.id);
      if (state === 'excluded') return null;

      // Get last log for placeholder
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
        sets:        [],        // filled during live session
        skipped:     false,
        completed:   false,
      };
    };

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
      exercises: lightExIds.map(resolveEx).filter(Boolean),
    });

    // ── OBJECT MANIPULATION (tier 3+) ────────────────────────
    if (tier >= 3) {
      const objIds = tier === 3
        ? ['stick-static', 'juggling-cascade', 'tennis-ball-dribble']
        : ['stick-static', 'stick-walking', 'stick-transfer',
           'juggling-cascade', 'juggling-variations',
           'tennis-ball-dribble', 'ball-eye-patched', 'contact-juggling'];

      blocks.push({
        key:      'objManip',
        label:    'Object manipulation',
        icon:     'circles',
        color:    '#7F77DD',
        bg:       '#EEEDFE',
        duration: durations.objManip,
        note:     'Activating without loading — sharpen focus before meditation.',
        exercises: objIds.map(resolveEx).filter(Boolean),
      });
    }

    // ── BREAKFAST ────────────────────────────────────────────
    blocks.push({
      key:      'breakfast',
      label:    'Breakfast',
      icon:     'coffee',
      color:    '#BA7517',
      bg:       '#FAEEDA',
      duration: 0,
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
      exercises: meditateIds.map(resolveEx).filter(Boolean),
    });

    // ── WARM-UP (not on rest or z2 days) ─────────────────────
    const skipWarmup = ['rest', 'z2-movement', 'z2-flex'].includes(theme);
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
        exercises: warmupIds.map(resolveEx).filter(Boolean),
      });
    }

    // ── SKILL + MAIN blocks by theme ─────────────────────────
    const themeBlocks = this._getThemeBlocks({ theme, tier, durations, lowEnergy, useExt, profile, focus, resolveEx });
    blocks.push(...themeBlocks);

    // ── COOL-DOWN ────────────────────────────────────────────
    const cooldownMap = {
      'strength-a': useExt
        ? ['couch-stretch','hamstring-hang','pancake','middle-splits','shoulder-overhead-stretch','foam-rolling','tre-tremoring','body-scan']
        : ['couch-stretch','hamstring-hang','straightjacket-shake'],
      'plio-b': useExt
        ? ['pancake','middle-splits','bridge','couch-stretch','foam-rolling','tre-tremoring','straightjacket-shake','body-scan']
        : ['pancake','bridge','tre-tremoring'],
      'z2-movement': useExt
        ? ['body-tapping','feldenkrais','straightjacket-shake','body-scan']
        : ['body-tapping','straightjacket-shake'],
      'intense': useExt
        ? ['tre-tremoring','vertical-shake','straightjacket-shake','couch-stretch','hamstring-hang','foam-rolling','body-scan']
        : ['tre-tremoring','vertical-shake','body-scan'],
      'z2-flex': useExt
        ? ['foam-rolling','tre-tremoring','yoga-nidra']
        : ['foam-rolling','body-scan'],
      'rest': useExt
        ? ['yoga-nidra','body-scan']
        : ['body-scan'],
    };

    const coolIds = cooldownMap[theme] || ['body-scan'];
    blocks.push({
      key:      'cooldown',
      label:    'Cool-down',
      icon:     'moon',
      color:    '#5F5E5A',
      bg:       '#F1EFE8',
      duration: durations.cooldown,
      note:     '',
      exercises: coolIds.map(resolveEx).filter(Boolean),
    });

    return blocks;
  },

  _getThemeBlocks({ theme, tier, durations, lowEnergy, useExt, profile, focus, resolveEx }) {
    const blocks = [];
    const trim = (arr) => lowEnergy ? arr.slice(0, Math.ceil(arr.length * 0.5)) : arr;

    switch (theme) {

      case 'strength-a': {
        const skillIds = trim(useExt
          ? ['hollow-body-hold','hollow-body-rock','arch-body-hold','tuck-sit',
             'pike-sit-wall','pike-sit-free','straddle-leg-circles','straddle-leg-raises',
             'hs-wall-hold','hs-pike-entry','hs-tuck','ring-pull-up','skin-the-cat','l-sit-floor','back-lever']
          : ['hollow-body-hold','arch-body-hold','pike-sit-wall',
             'hs-wall-hold','hs-pike-entry','ring-pull-up','skin-the-cat']);

        const mainIds = trim(useExt
          ? ['squat','incline-bench','pull-up','lateral-raise','toes-to-bar','ring-row','hip-thrust']
          : ['squat','incline-bench','pull-up','lateral-raise','toes-to-bar']);

        blocks.push(
          { key:'skill', label:'Skill block', icon:'star',    color:'#378ADD', bg:'#E6F1FB', duration: durations.skill, note:'CNS is fresh — skill work first.', exercises: skillIds.map(resolveEx).filter(Boolean) },
          { key:'main',  label:'Strength A',  icon:'barbell', color:'#D85A30', bg:'#FAECE7', duration: durations.main,  note:'', exercises: mainIds.map(resolveEx).filter(Boolean) }
        );
        break;
      }

      case 'plio-b': {
        const skillIds = trim(useExt
          ? ['hollow-body-hold','hollow-body-rock','arch-body-hold',
             'straddle-sit-compression','straddle-leg-circles','straddle-leg-raises','straddle-fold-passive',
             'hs-pike-entry','hs-tuck','tuck-sit','l-sit-floor',
             'ring-hold-support','skin-the-cat','ring-dip','back-lever']
          : ['hollow-body-hold','straddle-sit-compression','straddle-leg-raises',
             'hs-pike-entry','tuck-sit','ring-hold-support','skin-the-cat']);

        const mainIds = trim(useExt
          ? ['deadlift','overhead-press','cable-row','triceps-dip','plank',
             'box-jump','kb-swing','bulgarian-split-squat','cossack-squat',
             'pallof-press','farmers-walk','jefferson-curl']
          : ['deadlift','overhead-press','cable-row','triceps-dip',
             'box-jump','kb-swing','cossack-squat']);

        blocks.push(
          { key:'skill', label:'Skill block', icon:'star',    color:'#378ADD', bg:'#E6F1FB', duration: durations.skill, note:'CNS is fresh — skill work first.', exercises: skillIds.map(resolveEx).filter(Boolean) },
          { key:'main',  label:'Plio B',      icon:'barbell', color:'#533483', bg:'#F0EEFE', duration: durations.main,  note:'', exercises: mainIds.map(resolveEx).filter(Boolean) }
        );
        break;
      }

      case 'z2-movement': {
        const cardioEx = resolveEx(tier >= 3 ? 'z2-cycling' : 'easy-run') || resolveEx('easy-run');
        if (cardioEx) cardioEx.notes = (tier >= 3 ? '45–60' : '30') + ' min. Nose breathing. Conversational pace.';

        const movementIds = trim(useExt
          ? ['rolling-forward','rolling-backward','rolling-side','lizard-crawl',
             'frog-hop','scorpion-walk','ground-flow','brachiation','cartwheel','freestyle']
          : ['rolling-forward','rolling-side','lizard-crawl','ground-flow','freestyle']);

        blocks.push(
          { key:'skill', label:'Zone 2',       icon:'heart-rate', color:'#1A7A4A', bg:'#E1F5EE', duration: durations.skill, note:'Nose breathing throughout. Conversational pace.', exercises: [cardioEx].filter(Boolean) },
          { key:'main',  label:'Ground flow',  icon:'run',        color:'#1A7A4A', bg:'#E1F5EE', duration: durations.main,  note:'', exercises: movementIds.map(resolveEx).filter(Boolean) }
        );
        break;
      }

      case 'intense': {
        const powerIds = trim(useExt
          ? ['med-ball-slams','med-ball-rotational','broad-jump','depth-jump']
          : ['med-ball-slams','med-ball-rotational','broad-jump']);

        const sprintEx = resolveEx('uphill-sprints');
        if (sprintEx) sprintEx.notes = useExt ? '10×20s / 90s full rest' : '6×20s / 90s full rest';

        blocks.push(
          { key:'skill', label:'Power',         icon:'bolt',    color:'#A32D2D', bg:'#FAE8E8', duration: durations.skill, note:'Maximal intent every rep.', exercises: powerIds.map(resolveEx).filter(Boolean) },
          { key:'main',  label:'Sprint / intervals', icon:'run', color:'#A32D2D', bg:'#FAE8E8', duration: durations.main, note:'Full recovery between efforts.', exercises: [sprintEx].filter(Boolean) }
        );
        break;
      }

      case 'z2-flex': {
        const cardioEx = resolveEx('z2-cycling') || resolveEx('easy-run');
        if (cardioEx) cardioEx.notes = (tier >= 3 ? '45–60' : '30') + ' min. Nose breathing.';

        const flexIds = trim(useExt
          ? ['pancake','middle-splits','straddle-sit-compression','straddle-fold-passive',
             'hamstring-pnf','bridge','front-splits','couch-stretch-weighted','pancake-good-morning','jefferson-curl']
          : ['pancake','middle-splits','straddle-sit-compression','hamstring-pnf','bridge','front-splits']);

        blocks.push(
          { key:'skill', label:'Zone 2',         icon:'heart-rate', color:'#196F3D', bg:'#E1F5EE', duration: durations.skill, note:'Nose breathing throughout.', exercises: [cardioEx].filter(Boolean) },
          { key:'main',  label:'Flexibility',    icon:'stretching', color:'#196F3D', bg:'#E1F5EE', duration: durations.main,  note:'Long passive holds. PNF where noted.', exercises: flexIds.map(resolveEx).filter(Boolean) }
        );
        break;
      }

      case 'rest': {
        const walkEx = {
          id:      'walking',
          name:    'Walking / hiking',
          logType: 'cardio',
          energy:  'Low',
          restGroup: 'cardio',
          restSeconds: 0,
          notes:   'Main rest day activity. No targets.',
          link:    null,
          sets:    [], completed: false, skipped: false,
        };

        const restIds = trim(useExt
          ? ['pancake','middle-splits','couch-stretch','bridge','front-splits','hamstring-hang','shoulder-overhead-stretch','freestyle']
          : ['pancake','couch-stretch','bridge','freestyle']);

        blocks.push(
          { key:'skill', label:'Walk / hike',    icon:'walk',    color:'#5D6D7E', bg:'#EFF0F1', duration: durations.skill, note:'No targets. Just move.', exercises: [walkEx] },
          { key:'main',  label:'Flexibility',    icon:'stretching', color:'#5D6D7E', bg:'#EFF0F1', duration: durations.main, note:'No load. Long holds.', exercises: restIds.map(resolveEx).filter(Boolean) }
        );
        break;
      }
    }

    return blocks;
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
  _currentBlockIdx: 0,
  _currentExIdx: 0,
  _currentSetIdx: 0,
  _onUpdate: null,

  start(session, onUpdate) {
    this._session = session;
    this._currentBlockIdx = 0;
    this._currentExIdx = 0;
    this._currentSetIdx = 0;
    this._onUpdate = onUpdate;
    Timer.stopAll();
  },

  getSession() { return this._session; },

  getCurrentBlock() {
    return this._session?.blocks[this._currentBlockIdx] || null;
  },

  getCurrentExercise() {
    const block = this.getCurrentBlock();
    return block?.exercises[this._currentExIdx] || null;
  },

  // Log a set for the current exercise
  logSet({ weight, reps, duration, note, completed = true }) {
    const ex = this._getExercise(this._currentBlockIdx, this._currentExIdx);
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
      this._onUpdate && this._onUpdate(this._session);
    }
  },

  // Skip exercise
  skipExercise(blockIdx, exIdx) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (ex) {
      ex.skipped = true;
      this._onUpdate && this._onUpdate(this._session);
    }
  },

  // Add a note to an exercise
  addExerciseNote(blockIdx, exIdx, note) {
    const ex = this._getExercise(blockIdx, exIdx);
    if (ex) {
      ex.sessionNote = note;
      this._onUpdate && this._onUpdate(this._session);
    }
  },

  // Log cardio exercise
  logCardio({ durationMin, durationSec, appleFitnessLink, note }) {
    const ex = this._getExercise(this._currentBlockIdx, this._currentExIdx);
    if (!ex) return;
    ex.cardioLog = {
      duration: durationMin * 60 + (durationSec || 0),
      appleFitnessLink: appleFitnessLink || '',
      note: note || '',
    };
    ex.completed = true;
    this._onUpdate && this._onUpdate(this._session);
  },

  // Add session-level note
  setSessionNote(note) {
    if (this._session) {
      this._session.notes = note;
      this._onUpdate && this._onUpdate(this._session);
    }
  },

  // Complete the session
  complete() {
    if (!this._session) return null;
    this._session.status = 'completed';
    this._session.completedAt = Date.now();
    Timer.stopAll();
    const id = History.saveSession(this._session);
    this._session.id = id;
    return id;
  },

  // Discard session without saving
  discard() {
    Timer.stopAll();
    this._session = null;
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

  // Today's suggested theme based on cycle and day of week
  getTodayTheme(profile) {
    const dow = new Date().getDay(); // 0=Sun, 1=Mon, ...
    // Map Sunday=6, Monday=0, ...
    const dayIdx = dow === 0 ? 6 : dow - 1;
    const week = profile.currentWeek === 1 ? WEEKLY_CYCLE.week1 : WEEKLY_CYCLE.week2;
    return week[dayIdx] || week[6];
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
      'strength-a':   { label: 'Strength A',       color: '#185FA5', icon: 'barbell' },
      'plio-b':       { label: 'Plio B',            color: '#533483', icon: 'barbell' },
      'z2-movement':  { label: 'Z2 + Movement',     color: '#1A7A4A', icon: 'run'     },
      'intense':      { label: 'Intense',           color: '#A32D2D', icon: 'bolt'    },
      'z2-flex':      { label: 'Z2 + Flexibility',  color: '#196F3D', icon: 'run'     },
      'rest':         { label: 'Rest + Recovery',   color: '#5D6D7E', icon: 'moon'    },
    };
    return configs[themeId] || { label: themeId, color: '#888', icon: 'activity' };
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
