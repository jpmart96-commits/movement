// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — CUSTOM DATA
// custom.js — custom exercises, goals, milestone overrides
// ─────────────────────────────────────────────────────────────

'use strict';

const Custom = {

  // ── EXERCISES ───────────────────────────────────────────────

  getExercises() { return DB.get('custom_exercises') || []; },
  saveExercises(list) { DB.set('custom_exercises', list); },

  addExercise(ex) {
    const list = this.getExercises();
    const id   = 'custom_ex_' + Date.now();
    const item = {
      id, isCustom: true,
      name:         ex.name,
      category:     ex.category     || 'General',
      subcategory:  ex.subcategory  || '',
      difficulty:   ex.difficulty   || 3,
      energy:       ex.energy       || 'Med',
      segment:      ex.segment      || 'main',
      goals:        ex.goals        || [],
      equipment:    ex.equipment    || [],
      frequency:    ex.frequency    || '',
      restGroup:    ex.restGroup    || 'strength-acc',
      logType:      ex.logType      || 'weight+reps',
      notes:        ex.notes        || '',
      link:         ex.link         || '',
      imageUrl:     ex.imageUrl     || '',
      instructions: ex.instructions || '',
      defaultState: 'active',
    };
    list.push(item);
    this.saveExercises(list);
    if (App.profile) {
      App.profile.exerciseStates[id] = 'active';
      Profile.save(App.profile);
    }
    return item;
  },

  updateExercise(id, updates) {
    const list = this.getExercises();
    const idx  = list.findIndex(e => e.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...updates };
    this.saveExercises(list);
    return list[idx];
  },

  deleteExercise(id) {
    this.saveExercises(this.getExercises().filter(e => e.id !== id));
    if (App.profile) {
      delete App.profile.exerciseStates[id];
      Profile.save(App.profile);
    }
  },

  getExercise(id) {
    // Check custom first, then built-in with override applied
    const custom = this.getExercises().find(e => e.id === id);
    if (custom) return custom;
    const base = LIBRARY.find(e => e.id === id);
    if (base) return Overrides.resolve(base);
    return null;
  },

  // Full library: built-in (overrides applied) + custom
  getAllExercises() {
    const builtIn  = LIBRARY.map(ex => Overrides.resolve(ex));
    const custom   = this.getExercises();
    return [...builtIn, ...custom];
  },

  // ── GOALS ───────────────────────────────────────────────────

  getGoals() { return DB.get('custom_goals') || []; },
  saveGoals(list) { DB.set('custom_goals', list); },

  addGoal(g) {
    const list = this.getGoals();
    const id   = 'custom_goal_' + Date.now();
    const item = {
      id, isCustom: true,
      name:          g.name,
      category:      g.category      || 'General',
      priority:      g.priority      || 2,
      milestones:    g.milestones    || [],
      feedExercises: g.feedExercises || [],
      notes:         g.notes         || '',
      imageUrl:      g.imageUrl      || '',
    };
    list.push(item);
    this.saveGoals(list);
    if (App.profile) {
      App.profile.goalMilestones[id] = 0;
      Profile.save(App.profile);
    }
    return item;
  },

  updateGoal(id, updates) {
    const list = this.getGoals();
    const idx  = list.findIndex(g => g.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...updates };
    this.saveGoals(list);
    return list[idx];
  },

  deleteGoal(id) {
    this.saveGoals(this.getGoals().filter(g => g.id !== id));
    if (App.profile) {
      delete App.profile.goalMilestones[id];
      Profile.save(App.profile);
    }
  },

  getGoal(id) {
    return this.getGoals().find(g => g.id === id) || null;
  },

  // Full goal list: built-in (with overrides) + custom
  getAllGoals() {
    const gov     = DB.get('goal_overrides') || {};
    const builtIn = GOALS.map(g => gov[g.id] ? { ...g, ...gov[g.id] } : g);
    return [...builtIn, ...this.getGoals()];
  },

  // Get image for a goal: explicit imageUrl > auto-thumbnail from a feed exercise
  getGoalImage(goalId) {
    const allGoals = this.getAllGoals();
    const g = allGoals.find(x => x.id === goalId);
    if (!g) return null;

    // Explicit goal image wins
    if (g.imageUrl) return g.imageUrl;

    // Try to get thumbnail from the highest-difficulty feed exercise that has a link
    if (g.feedExercises?.length) {
      const allEx = this.getAllExercises();
      for (const eid of g.feedExercises) {
        const ex = allEx.find(e => e.id === eid);
        if (ex) {
          const thumb = Overrides.getYouTubeThumbnail(ex.link);
          if (thumb) return thumb;
        }
      }
    }

    return null;
  },

  // ── MILESTONES ───────────────────────────────────────────────

  getMilestones(goalId) {
    const cg = this.getGoal(goalId);
    if (cg) return cg.milestones;
    const overrides = DB.get('goal_milestone_overrides') || {};
    if (overrides[goalId]) return overrides[goalId];
    const base = GOALS.find(g => g.id === goalId);
    return base ? base.milestones : [];
  },

  resetGoalProgress(goalId) {
    if (App.profile) {
      App.profile.goalMilestones[goalId] = 0;
      Profile.save(App.profile);
    }
  },
};
