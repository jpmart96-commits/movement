// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — LIBRARY OVERRIDES
// overrides.js — edit built-in exercises without touching library.js
// ─────────────────────────────────────────────────────────────

'use strict';

const Overrides = {

  _key: 'library_overrides',

  getAll() {
    return DB.get(this._key) || {};
  },

  get(exerciseId) {
    return this.getAll()[exerciseId] || null;
  },

  save(exerciseId, data) {
    const all = this.getAll();
    all[exerciseId] = { ...all[exerciseId], ...data };
    DB.set(this._key, all);
  },

  delete(exerciseId) {
    const all = this.getAll();
    delete all[exerciseId];
    DB.set(this._key, all);
  },

  // Merge override onto a base exercise object
  apply(baseEx) {
    const ov = this.get(baseEx.id);
    if (!ov) return baseEx;
    return { ...baseEx, ...ov };
  },

  // Get full exercise with overrides applied (searches built-in + custom)
  resolve(id) {
    const base = Custom.getAllExercises().find(e => e.id === id);
    if (!base) return null;
    if (base.isCustom) return base; // custom exercises are edited directly
    return this.apply(base);
  },

  // Extract YouTube video ID from various URL formats
  extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/embed\/([^?]+)/,
      /youtube\.com\/shorts\/([^?]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  },

  // Generate thumbnail URL from YouTube link
  thumbFromYouTube(url) {
    const id = this.extractYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  },

};
