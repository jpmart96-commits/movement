// ─────────────────────────────────────────────────────────────
// NOTES — memos that feed the next rewrite of the plan.
//
// Anything worth remembering when the plan is next refined: how a day
// felt, an exercise that is too easy or pinches, a schedule that doesn't
// fit, an idea for the next block. Each note is stamped with the day it is
// about and what that day was (theme, day type, block week), so it still
// makes sense weeks later.
//
// Storage: one list under 'plan_notes' (localStorage 'pb_plan_notes'),
// synced by js/sync.js one row per note to the Supabase `plan_notes` table.
// A plan review reads the open notes there (or from "Copy for Claude") and
// marks the ones it used as applied, with a line saying what changed; the
// app picks that up on its next pull. Per note, the later updatedAt wins.
//
// Nothing here calls a model. The in-app AI prompts don't read notes.
// ─────────────────────────────────────────────────────────────

const Notes = {
  KEY: 'plan_notes',

  KINDS: [
    { id: 'body',     label: 'Body',     hint: 'energy, sleep, soreness, pain' },
    { id: 'exercise', label: 'Exercise', hint: 'too easy, too hard, swap, cue' },
    { id: 'plan',     label: 'Plan',     hint: 'schedule, time, order, load' },
    { id: 'idea',     label: 'Idea',     hint: 'for the next block' },
  ],
  STATUSES: ['open', 'applied', 'dropped'],

  kindLabel(id) { return (this.KINDS.find(k => k.id === id) || { label: 'Note' }).label; },

  _now() { return new Date().toISOString(); },
  _today() { return (typeof Day !== 'undefined') ? Day.key(new Date()) : new Date().toISOString().slice(0, 10); },
  _id() { return 'note_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },

  // Newest day first; within a day, newest written first.
  _sort(a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return String(b.createdAt || '') < String(a.createdAt || '') ? -1 : 1;
  },

  all() {
    const list = DB.get(this.KEY);
    return (Array.isArray(list) ? list : []).filter(n => n && n.id).slice().sort(this._sort);
  },

  list({ status, kind } = {}) {
    return this.all().filter(n =>
      (!status || status === 'all' || (n.status || 'open') === status) &&
      (!kind || kind === 'all' || n.kind === kind));
  },

  counts() {
    const c = { open: 0, applied: 0, dropped: 0, all: 0 };
    this.all().forEach(n => { c[n.status || 'open']++; c.all++; });
    return c;
  },

  get(id) { return this.all().find(n => n.id === id) || null; },

  _save(list) { return DB.set(this.KEY, list); },

  // What the day was, frozen at the time of writing. A day that was edited
  // (theme swap, traded day) reads from today's stored instance; any other
  // day reads from the month plan.
  contextFor(dateKey, extra = {}) {
    const ctx = {};
    try {
      const pd = (typeof MonthPlan !== 'undefined') ? MonthPlan.dayFor(dateKey) : null;
      if (pd) {
        if (pd.theme) ctx.theme = pd.theme;
        if (pd.dayType) ctx.dayType = pd.dayType;
        if (pd.week) ctx.week = pd.week;
      }
      const inst = DB.get('daily_instance_' + dateKey);
      if (inst) {
        if (inst.theme) ctx.theme = inst.theme;
        if (inst.dayType) ctx.dayType = inst.dayType;
      }
    } catch (e) { /* context is a nicety — never block a note on it */ }
    Object.entries(extra || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') ctx[k] = v; });
    return ctx;
  },

  add({ text, kind, date, context, source } = {}) {
    const body = String(text || '').trim();
    if (!body) return null;
    const day = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : this._today();
    const now = this._now();
    const note = {
      id: this._id(),
      text: body,
      kind: this.KINDS.some(k => k.id === kind) ? kind : 'plan',
      date: day,
      status: 'open',
      context: this.contextFor(day, context),
      source: source || 'notes',
      createdAt: now,
      updatedAt: now,
    };
    const list = this.all();
    list.push(note);
    this._save(list);
    return note;
  },

  update(id, patch = {}) {
    const list = this.all();
    const i = list.findIndex(n => n.id === id);
    if (i < 0) return null;
    const next = { ...list[i] };
    if (patch.text !== undefined) {
      const t = String(patch.text).trim();
      if (!t) return null;
      next.text = t;
    }
    if (patch.kind && this.KINDS.some(k => k.id === patch.kind)) next.kind = patch.kind;
    if (patch.date && /^\d{4}-\d{2}-\d{2}$/.test(patch.date) && patch.date !== next.date) {
      next.date = patch.date;
      // Re-stamp what the day was, but keep anything specific (an exercise).
      const keep = {};
      ['exerciseId', 'exerciseName', 'blockKey', 'blockLabel', 'sessionId'].forEach(k => { if (next.context && next.context[k]) keep[k] = next.context[k]; });
      next.context = this.contextFor(patch.date, keep);
    }
    if (patch.status && this.STATUSES.includes(patch.status)) {
      next.status = patch.status;
      if (patch.status === 'open') { delete next.resolution; delete next.resolvedAt; }
      else next.resolvedAt = this._now();
    }
    if (patch.resolution !== undefined) {
      const r = String(patch.resolution || '').trim();
      if (r) next.resolution = r; else delete next.resolution;
    }
    next.updatedAt = this._now();
    list[i] = next;
    this._save(list);
    return next;
  },

  setStatus(id, status, resolution) {
    return this.update(id, resolution !== undefined ? { status, resolution } : { status });
  },

  remove(id) {
    const list = this.all();
    const next = list.filter(n => n.id !== id);
    if (next.length === list.length) return false;
    this._save(next);
    return true;
  },

  // One line of "what the day was": "Thu 1 Oct · Plyo power · wk 1 · Broad jump".
  contextLine(n) {
    const c = n.context || {};
    const d = (typeof Utils !== 'undefined' && Utils.formatDate) ? Utils.formatDate(n.date) : n.date;
    return [d, c.theme, c.week ? 'wk ' + c.week : null, c.exerciseName || c.blockLabel || null].filter(Boolean).join(' · ');
  },

  // Markdown for pasting into a planning conversation. Grouped by kind,
  // oldest first inside a group so a pattern reads in the order it formed.
  exportMarkdown({ status = 'open' } = {}) {
    const notes = this.list({ status }).slice().reverse();
    const today = (typeof Utils !== 'undefined' && Utils.formatDate) ? Utils.formatDate(this._today()) : this._today();
    const label = status === 'all' ? 'all' : status;
    let md = `# M0vement plan notes (${label}, ${notes.length}) · exported ${today}\n`;
    if (!notes.length) return md + '\nNo notes.\n';
    this.KINDS.forEach(k => {
      const group = notes.filter(n => n.kind === k.id);
      if (!group.length) return;
      md += `\n## ${k.label}\n`;
      group.forEach(n => {
        const tag = status === 'all' && n.status !== 'open' ? ` [${n.status}]` : '';
        md += `- ${this.contextLine(n)}${tag} (${n.id}): ${n.text.replace(/\s*\n\s*/g, ' / ')}\n`;
        if (n.resolution) md += `  - → ${n.resolution}\n`;
      });
    });
    return md;
  },
};
