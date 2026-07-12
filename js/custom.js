// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — CUSTOM DATA
// custom.js — custom exercises and goals, stored in localStorage
// ─────────────────────────────────────────────────────────────

'use strict';

const Custom = {

  // ── EXERCISES ───────────────────────────────────────────────

  getExercises() {
    return DB.get('custom_exercises') || [];
  },

  saveExercises(list) {
    DB.set('custom_exercises', list);
  },

  addExercise(ex) {
    const list = this.getExercises();
    // Random suffix guards against two saves in the same millisecond
    // colliding on id — a real possibility now that "To try" lets you
    // extract several exercises from one idea back-to-back.
    const id   = 'custom_ex_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const item = {
      id,
      name:         ex.name,
      category:     ex.category,
      subcategory:  ex.subcategory || '',
      difficulty:   ex.difficulty  || 3,
      energy:       ex.energy      || 'Med',
      segment:      ex.segment     || 'main',
      goals:        ex.goals       || [],
      equipment:    ex.equipment   || [],
      frequency:    ex.frequency   || '',
      restGroup:    ex.restGroup   || 'strength-acc',
      logType:      ex.logType     || 'weight+reps',
      notes:        ex.notes       || '',
      link:         ex.link        || '',
      imageUrl:     ex.imageUrl    || '',
      instructions: ex.instructions|| '',
      defaultState: 'active',
      isCustom:     true,
    };
    list.push(item);
    this.saveExercises(list);
    // Also set state in profile
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
    const list = this.getExercises().filter(e => e.id !== id);
    this.saveExercises(list);
    // Remove from profile states
    if (App.profile) {
      delete App.profile.exerciseStates[id];
      Profile.save(App.profile);
    }
  },

  getExercise(id) {
    return this.getExercises().find(e => e.id === id) || null;
  },

  // Returns full library: built-in + custom
  getAllExercises() {
    return [...LIBRARY, ...this.getExercises()];
  },

  // ── GOALS ───────────────────────────────────────────────────

  getGoals() {
    return DB.get('custom_goals') || [];
  },

  saveGoals(list) {
    DB.set('custom_goals', list);
  },

  addGoal(g) {
    const list = this.getGoals();
    const id   = 'custom_goal_' + Date.now();
    const item = {
      id,
      name:         g.name,
      category:     g.category     || 'General',
      priority:     g.priority     || 2,
      milestones:   g.milestones   || [],
      feedExercises:g.feedExercises|| [],
      notes:        g.notes        || '',
      isCustom:     true,
    };
    list.push(item);
    this.saveGoals(list);
    // Init milestone in profile
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
    const list = this.getGoals().filter(g => g.id !== id);
    this.saveGoals(list);
    if (App.profile) {
      delete App.profile.goalMilestones[id];
      Profile.save(App.profile);
    }
  },

  getGoal(id) {
    return this.getGoals().find(g => g.id === id) || null;
  },

  // Returns full goal list: built-in + custom
  getAllGoals() {
    return [...GOALS, ...this.getGoals()];
  },

  // Add a milestone to a goal (built-in or custom)
  addMilestone(goalId, text, insertAfterIdx) {
    // Custom goals stored in DB
    const customList = this.getGoals();
    const cg = customList.find(g => g.id === goalId);
    if (cg) {
      const ms = [...cg.milestones];
      if (insertAfterIdx !== undefined) ms.splice(insertAfterIdx + 1, 0, text);
      else ms.push(text);
      cg.milestones = ms;
      this.saveGoals(customList);
      return;
    }
    // Built-in goals — store overrides in DB
    const overrides = DB.get('goal_milestone_overrides') || {};
    const base = GOALS.find(g => g.id === goalId);
    if (!base) return;
    const ms = overrides[goalId] ? [...overrides[goalId]] : [...base.milestones];
    if (insertAfterIdx !== undefined) ms.splice(insertAfterIdx + 1, 0, text);
    else ms.push(text);
    overrides[goalId] = ms;
    DB.set('goal_milestone_overrides', overrides);
  },

  deleteMilestone(goalId, idx) {
    const customList = this.getGoals();
    const cg = customList.find(g => g.id === goalId);
    if (cg) {
      cg.milestones.splice(idx, 1);
      this.saveGoals(customList);
      // Adjust profile index
      if (App.profile) {
        const cur = App.profile.goalMilestones[goalId] || 0;
        if (cur >= idx) App.profile.goalMilestones[goalId] = Math.max(0, cur - 1);
        Profile.save(App.profile);
      }
      return;
    }
    const overrides = DB.get('goal_milestone_overrides') || {};
    const base = GOALS.find(g => g.id === goalId);
    if (!base) return;
    const ms = overrides[goalId] ? [...overrides[goalId]] : [...base.milestones];
    ms.splice(idx, 1);
    overrides[goalId] = ms;
    DB.set('goal_milestone_overrides', overrides);
    if (App.profile) {
      const cur = App.profile.goalMilestones[goalId] || 0;
      if (cur >= idx) App.profile.goalMilestones[goalId] = Math.max(0, cur - 1);
      Profile.save(App.profile);
    }
  },

  // Get milestones for any goal (respects overrides for built-ins)
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


// ─────────────────────────────────────────────────────────────
// "TO TRY" INBOX — low-friction capture for exercise variations spotted
// in reels/shorts. Just a link, a name, and a rough category — everything
// else (subcategory, modality tags, log type, etc.) is deferred until you
// actually promote an idea into a real exercise via Custom.addExercise.
// Deliberately NOT part of LIBRARY/Custom.getAllExercises() and therefore
// invisible to session generation until promoted — a holding pen, not a
// commitment.
// ─────────────────────────────────────────────────────────────

const Ideas = {
  getAll() {
    return DB.get('exercise_ideas') || [];
  },

  save(list) {
    DB.set('exercise_ideas', list);
  },

  // { name, link, category } — name/category are optional at capture time
  // (falls back to a placeholder name), link is expected but not required
  // in case you just want to jot down "cossack jump variation" from memory.
  add({ name, link, category }) {
    const list = this.getAll();
    const item = {
      // Date.now() alone can collide if two ideas are saved in the same
      // millisecond (caught by an automated test, not a real user, but
      // cheap to make actually collision-safe).
      id:       'idea_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name:     (name || '').trim() || 'Untitled clip',
      link:     (link || '').trim(),
      category: category || '',
      addedAt:  Date.now(),
    };
    list.unshift(item); // newest first
    this.save(list);
    return item;
  },

  remove(id) {
    this.save(this.getAll().filter(i => i.id !== id));
  },

  get(id) {
    return this.getAll().find(i => i.id === id) || null;
  },

  update(id, updates) {
    const list = this.getAll();
    const idx  = list.findIndex(i => i.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...updates };
    this.save(list);
    return list[idx];
  },
};
