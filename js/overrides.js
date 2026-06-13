'use strict';

const Overrides = {
  _key: 'library_overrides',

  getAll() { return DB.get(this._key) || {}; },

  get(id) { return this.getAll()[id] || null; },

  save(id, data) {
    const all = this.getAll();
    all[id] = { ...all[id], ...data };
    DB.set(this._key, all);
  },

  apply(baseEx) {
    const ov = this.get(baseEx.id);
    return ov ? { ...baseEx, ...ov } : baseEx;
  },

  extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^?&]+)/);
    return m ? m[1] : null;
  },

  thumbFromYouTube(url) {
    const id = this.extractYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  },
};
