// ─────────────────────────────────────────────────────────────
// DAY — one place that knows what a date is and how it changes.
//
// Before this, the instance key was built in four places with two date
// conventions (index.html used the UTC date, everything else the local
// one), a trade regenerated each date with the other date's WEEKDAY while
// still reading its own plan day (a "Zone 2 long run" full of squats), and
// every edit path decided for itself whether to keep logged work.
//
// Everything here is plain data in, plain data out. The UI in index.html
// calls it and persists the result; nothing here touches the DOM.
// ─────────────────────────────────────────────────────────────

const Day = {

  // Local calendar date 'YYYY-MM-DD'. Never toISOString(), which gives the
  // UTC date: at 00:30 in Lisbon summer time that is still yesterday.
  key(date) {
    const d = this.parse(date);
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },

  // 'YYYY-MM-DD' → local noon, so no timezone or DST change moves the day.
  parse(date) {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date + 'T12:00:00');
    return new Date(date);
  },

  instanceKey(date) { return 'daily_instance_' + this.key(date); },

  // Whole local days from a to b ('YYYY-MM-DD' or Date). Counted on the
  // calendar, not by 86 400 000 ms steps, which break across a DST change.
  daysBetween(a, b) {
    const ua = Date.UTC(...this.key(a).split('-').map((x, i) => i === 1 ? x - 1 : +x));
    const ub = Date.UTC(...this.key(b).split('-').map((x, i) => i === 1 ? x - 1 : +x));
    return Math.round((ub - ua) / 864e5);
  },

  addDays(date, n) {
    const d = this.parse(this.key(date));
    d.setDate(d.getDate() + n);
    return this.key(d);
  },

  // Anything done or decided on this day that a regeneration must not undo:
  // logged work, an edit, a trade, a chat change. A plan built by an older
  // generator is only rebuilt when this is false.
  isTouched(instance) {
    if (!instance) return false;
    if (instance.status === 'completed') return true;
    if ((instance.edits || []).length) return true;
    if ((instance.chatLog || []).length) return true;
    const src = instance.planSource || {};
    if (src.kind === 'traded' || instance.themeOverride) return true;
    return (instance.blocks || []).some(b => (b.exercises || []).some(e =>
      e.completed || e.skipped || (e.sets || []).length || e.cardioLog));
  },

  // Which plan day a session belongs to, recorded on the executed session so
  // the plan and what was done stay two different things: a Strength B done
  // on Thursday is still Friday's Strength B.
  planRef(instance) {
    if (!instance) return null;
    const src = instance.planSource || {};
    return {
      date: instance.date,
      dayType: instance.dayKind || instance.dayType || null,
      contentDate: instance.contentDate || src.from || null,
      kind: src.kind || (instance.weekday ? 'plan' : 'manual'),
    };
  },

  // Trade today's content with another date's. Each date keeps its own
  // coordination domain and calendar slot; the prescriptions swap. Anything
  // already trained today is kept.
  trade(todayInstance, otherDateKey, { profile, checkin } = {}) {
    if (typeof MonthPlan === 'undefined' || typeof Generator === 'undefined') return null;
    const plan = MonthPlan.load();
    const days = (plan && plan.days) || [];
    const todayKey = (todayInstance && todayInstance.date) || this.key(new Date());
    const a = days.find(d => d.date === todayKey);
    const b = days.find(d => d.date === otherDateKey);
    if (!a || !b) return null;
    const c = checkin || {};
    const mk = (dateKey, content) => Generator.generateFromScaffold({
      date: dateKey, themeOverride: MonthPlan.typeOf(content),
      contentDay: content, contentKind: 'traded',
      profile, sleep: c.sleep, energy: c.energy, pain: c.pain, focus: c.focus,
    });
    let mine = mk(todayKey, b);
    const theirs = mk(otherDateKey, a);
    if (!mine || !theirs) return null;
    if (todayInstance) {
      mine = Generator._preserveLogged(todayInstance, mine);
      mine.id = todayInstance.id; mine.startedAt = todayInstance.startedAt;
      if (todayInstance.loggedHistoryId) mine.loggedHistoryId = todayInstance.loggedHistoryId;
      mine.chatLog = todayInstance.chatLog || [];
      mine.duration = mine.blocks.reduce((s, x) => s + (x.duration || 0), 0);
    }
    const at = Date.now();
    mine.edits = ((todayInstance && todayInstance.edits) || []).concat([{ action: 'trade', with: otherDateKey, at }]);
    theirs.edits = [{ action: 'trade', with: todayKey, at }];
    return { mine, theirs, a, b };
  },

  // Human line for one edit, for the "changed today" strip on Today.
  editLabel(e, instance) {
    const blockName = key => {
      const all = ((instance && instance.blocks) || []).concat(((instance && instance.removedBlocks) || []).map(r => r.block));
      const b = all.find(x => x.key === key);
      return b ? String(b.label || key).replace(/ — .*$/, '') : key;
    };
    switch (e.action) {
      case 'remove_block':    return `${blockName(e.blockKey)} removed`;
      case 'restore_block':   return `${blockName(e.blockKey)} back`;
      case 'resize_block':    return `${blockName(e.blockKey)} resized`;
      case 'move_block':      return `${blockName(e.blockKey)} moved`;
      case 'swap_modality':   return e.modality === 'run' ? 'Bike → run' : 'Run → bike';
      case 'swap_domain':     return 'Complementary changed';
      case 'swap_skill_line': return 'Skill line changed';
      case 'swap_exercise':   return 'Exercise swapped';
      case 'scale_session':   return 'Shorter';
      case 'lighter':         return 'Lighter';
      case 'reshuffle':       return 'Reshuffled';
      case 'theme_swap':      return 'Day type changed';
      case 'trade':           return `Traded with ${e.with}`;
      default:                return e.action;
    }
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Day };
