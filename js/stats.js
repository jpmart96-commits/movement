// ─────────────────────────────────────────────────────────────
// STATS — volume and intensity over time.
//
// Progress asks "is the block working?". Stats asks two simpler things:
// where did the time go, and how hard was the heart working while it did.
//
// Modelled on the Apple Fitness statistics screen, repurposed for a
// Movement day. Apple counts workouts by type; a Movement day is ONE
// session holding several modalities (light work, mobility, a main focus,
// coordination…), so counting sessions by type would hide everything but
// the day's label. The top chart therefore stacks MINUTES by modality
// family, attributed exercise by exercise.
//
// The ten modality tags fold into six families — more than six hues can't
// be told apart in a stack. The families follow what the practice is for:
// strength and the aerobic engine first, then the supporting qualities.
//
// Heart-rate zones come only from imported watch sessions (cardioLog).
// When a run carries its 30s-binned series, zones are recomputed against
// the CURRENT profile zones, so a later change to the zone model applies
// to history too; otherwise the stored per-zone seconds are used.
// ─────────────────────────────────────────────────────────────

const Stats = {

  // Fixed order = stack order (bottom → top) = legend order. Colours are
  // CSS tokens (--st-f-<id>) defined in css/rework.css, validated as a
  // set for CVD and normal-vision separation in both themes.
  FAMILIES: [
    { id: 'strength',     label: 'Strength',         tags: ['weights', 'calisthenics', 'gymnastics-conditioning'] },
    { id: 'power',        label: 'Power',            tags: ['power-plyo'] },
    { id: 'aerobic',      label: 'Aerobic',          tags: ['cardio'] },
    { id: 'mobility',     label: 'Mobility',         tags: ['mobility-movement', 'flexibility', 'weighted-mobility', 'yoga'] },
    { id: 'coordination', label: 'Coordination',     tags: ['coordination'] },
    { id: 'somatic',      label: 'Somatic & breath', tags: [] },
    { id: 'other',        label: 'Unsorted',         tags: [] },
  ],

  ZONES: [
    { n: 1, label: 'Recovery' },
    { n: 2, label: 'Easy' },
    { n: 3, label: 'Grey zone' },
    { n: 4, label: 'Threshold' },
    { n: 5, label: 'VO2 max' },
  ],

  // Untagged exercises in these categories are the fixed scaffolding —
  // light work, meditation, breath — which the modality picker never sees.
  SOMATIC_CATEGORIES: new Set(['Somatic', 'Meditation', 'Breathwork', 'Self-Massage', 'Restorative',
    'Awareness', 'Visualization', 'Recovery', 'Neurological', 'Sensory Motor']),
  SOMATIC_BLOCKS: new Set(['lightBlock', 'meditate', 'open']),
  // Blocks that are part of the day but not practice.
  SKIP_BLOCKS: new Set(['breakfast', 'reading']),
  SKIP_EXERCISES: new Set(['breakfast', 'reading']),

  EASY_TARGET: 80,     // % of HR-tracked time at or under Z2
  WEEKS: 12,
  MONTHS: 6,

  // ── lookups ────────────────────────────────────────────────
  _tagFamily: null,
  _familyOfTag(tag) {
    if (!this._tagFamily) {
      this._tagFamily = {};
      this.FAMILIES.forEach(f => f.tags.forEach(t => { this._tagFamily[t] = f.id; }));
    }
    return this._tagFamily[tag] || null;
  },

  // Free-text fallback for manual logs and legacy sessions whose only
  // signal is the day's theme ("weights", "Zone 2", "Strength A"…).
  _familyOfText(s) {
    if (!s) return null;
    const t = String(s).toLowerCase();
    const direct = this._familyOfTag(t.replace(/^main-focus:/, ''));
    if (direct) return direct;
    if (/strength|weight|calisth|gymnast|lift/.test(t)) return 'strength';
    if (/power|plyo|sprint|jump|throw/.test(t)) return 'power';
    if (/zone|cardio|run|cycl|bike|ride|interval|aerobic|4\s*[x×]\s*4|tempo|walk/.test(t)) return 'aerobic';
    if (/mobil|flex|yoga|stretch|split/.test(t)) return 'mobility';
    if (/coord|balance|juggl|reaction/.test(t)) return 'coordination';
    if (/somatic|medit|breath|rest|light/.test(t)) return 'somatic';
    return null;
  },

  _exMap: null,
  _lookupEx(id) {
    if (!this._exMap) {
      this._exMap = new Map();
      const all = (typeof Custom !== 'undefined' && Custom.getAllExercises)
        ? Custom.getAllExercises()
        : (typeof LIBRARY !== 'undefined' ? LIBRARY : []);
      all.forEach(e => this._exMap.set(e.id, e));
    }
    return this._exMap.get(id) || null;
  },

  // Families an exercise counts toward. A multi-tag exercise (a yoga arm
  // balance tagged yoga + calisthenics) is split evenly across its distinct
  // families rather than credited wholly to whichever tag happens to be first.
  _familiesFor(ex, block, session) {
    const lib = this._lookupEx(ex.id);
    const tags = (ex.modalityTags && ex.modalityTags.length ? ex.modalityTags : (lib && lib.modalityTags)) || [];
    const fams = [...new Set(tags.map(t => this._familyOfTag(t)).filter(Boolean))];
    if (fams.length) return fams;
    const cat = (lib && lib.category) || ex.category;
    if (cat && this.SOMATIC_CATEGORIES.has(cat)) return ['somatic'];
    if (ex.cardioLog || ex.logType === 'cardio') return ['aerobic'];
    const key = (block && block.key) || '';
    if (this.SOMATIC_BLOCKS.has(key)) return ['somatic'];
    const byKey = this._familyOfText(key);
    if (byKey) return [byKey];
    const byTheme = this._familyOfText((session.themes && session.themes[0]) || session.theme);
    return [byTheme || 'other'];
  },

  // Minutes per family for one session. Each block's duration is shared
  // across the exercises actually done in it, weighted by their allocated
  // minutes. Skipped exercises get nothing; where a block records any
  // completions, only the completed exercises count.
  attribute(session) {
    const out = {};
    this.FAMILIES.forEach(f => { out[f.id] = 0; });
    const blocks = session.blocks || [];
    const add = (fam, min) => { out[fam] = (out[fam] || 0) + min; };

    if (!blocks.length) {
      const fam = this._familyOfText((session.themes && session.themes[0]) || session.theme) || 'other';
      add(fam, session.duration || 0);
      return out;
    }

    blocks.forEach(block => {
      if (this.SKIP_BLOCKS.has(block.key)) return;
      let dur = +block.duration || 0;
      let exs = (block.exercises || []).filter(e => !e.skipped && !this.SKIP_EXERCISES.has(e.id));
      if (exs.some(e => e.completed)) exs = exs.filter(e => e.completed);
      // A single-block manual log carries its time on the session.
      if (!dur && blocks.length === 1) dur = +session.duration || 0;
      // A cardio log knows how long it actually ran.
      if (!dur) dur = exs.reduce((s, e) => s + ((e.cardioLog && e.cardioLog.duration) ? e.cardioLog.duration / 60 : 0), 0);
      if (!dur) return;
      if (!exs.length) {
        if ((block.exercises || []).length) return;   // everything skipped
        const fam = this.SOMATIC_BLOCKS.has(block.key) ? 'somatic'
          : (this._familyOfText(block.key) || this._familyOfText(session.theme) || 'other');
        add(fam, dur);
        return;
      }
      const w = exs.map(e => +e.allocatedMinutes > 0 ? +e.allocatedMinutes : 1);
      const wSum = w.reduce((a, b) => a + b, 0);
      exs.forEach((e, i) => {
        const fams = this._familiesFor(e, block, session);
        const share = dur * w[i] / wSum / fams.length;
        fams.forEach(f => add(f, share));
      });
    });
    return out;
  },

  // Seconds per zone for one session, or null when no HR was recorded.
  zoneSeconds(session, z) {
    const secs = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let any = false;
    const zoneFor = bpm => bpm <= z.z1 ? 1 : bpm <= z.z2 ? 2 : bpm <= z.z3 ? 3 : bpm <= z.z4 ? 4 : 5;
    (session.blocks || []).forEach(b => (b.exercises || []).forEach(ex => {
      const c = ex.cardioLog;
      if (!c) return;
      const series = Array.isArray(c.series) ? c.series.filter(p => p && p.hr) : [];
      if (series.length) {
        // 30s bins (see RuttioImport._series). Bin width taken from the
        // data itself in case that ever changes.
        const all = c.series;
        const bin = all.length > 1 ? Math.max(1, (all[1].t - all[0].t) || 30) : 30;
        series.forEach(p => { secs[zoneFor(p.hr)] += bin; });
        any = true;
      } else if (c.zones) {
        [1, 2, 3, 4, 5].forEach(n => { secs[n] += (c.zones['z' + n] && c.zones['z' + n].seconds) || 0; });
        any = any || [1, 2, 3, 4, 5].some(n => secs[n] > 0);
      }
    }));
    return any ? secs : null;
  },

  // ── dates ──────────────────────────────────────────────────
  // 'YYYY-MM-DD' is a local calendar date: parse it at local noon, never
  // as UTC midnight (which files a Lisbon morning under the previous day
  // anywhere west of Greenwich).
  _date(s) {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12);
    const d = new Date(s);
    return isNaN(d) ? null : d;
  },
  _ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  _monday(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  },
  _MON: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

  periodKey(d, mode) {
    return mode === 'month'
      ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      : this._ymd(this._monday(d));
  },

  periods(mode, now = new Date()) {
    const out = [];
    if (mode === 'month') {
      for (let i = this.MONTHS - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1, 12);
        out.push({ key: this.periodKey(d, 'month'), label: this._MON[d.getMonth()],
          long: this._MON[d.getMonth()] + ' ' + d.getFullYear() });
      }
    } else {
      const mon = this._monday(now);
      for (let i = this.WEEKS - 1; i >= 0; i--) {
        const d = new Date(mon); d.setDate(mon.getDate() - i * 7);
        const lbl = d.getDate() + ' ' + this._MON[d.getMonth()];
        out.push({ key: this._ymd(d), label: lbl, long: 'Week of ' + lbl });
      }
    }
    return out;
  },

  // ── aggregate ──────────────────────────────────────────────
  _zones() {
    const p = (typeof App !== 'undefined' && App.profile && App.profile.settings) || {};
    return p.hrZones || { z1: 133, z2: 153, z3: 168, z4: 182 };
  },

  _emptyBucket(p) {
    const fam = {}; this.FAMILIES.forEach(f => { fam[f.id] = 0; });
    return { ...p, fam, total: 0, sessions: 0, zones: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, zoneTotal: 0, hrSessions: 0 };
  },

  // One read of the log per call; the index is capped at 200 sessions.
  _sessions() {
    const rows = (typeof History !== 'undefined') ? History.getIndex(200) : [];
    const out = [];
    rows.forEach(r => {
      const s = History.getSession(r.id);
      const d = this._date((s && s.date) || r.date);
      if (!d) return;
      out.push({ d, s: s || { date: r.date, theme: r.theme, themes: r.themes, duration: r.duration, blocks: [] } });
    });
    return out;
  },

  compute(mode, now = new Date()) {
    this._exMap = null;   // custom exercises can change between renders
    const buckets = this.periods(mode, now).map(p => this._emptyBucket(p));
    const byKey = new Map(buckets.map(b => [b.key, b]));
    const z = this._zones();
    this._sessions().forEach(({ d, s }) => {
      const b = byKey.get(this.periodKey(d, mode));
      if (!b) return;
      this._addSession(b, s, z);
    });
    return buckets;
  },

  _addSession(b, s, z) {
    b.sessions++;
    const fam = this.attribute(s);
    Object.keys(fam).forEach(k => { b.fam[k] += fam[k]; b.total += fam[k]; });
    const zs = this.zoneSeconds(s, z);
    if (zs) {
      b.hrSessions++;
      [1, 2, 3, 4, 5].forEach(n => { b.zones[n] += zs[n]; b.zoneTotal += zs[n]; });
    }
  },

  // This week (Mon–today) and this calendar month, for the summary cards.
  summary(now = new Date()) {
    const wk = this._emptyBucket({ key: this.periodKey(now, 'week') });
    const mo = this._emptyBucket({ key: this.periodKey(now, 'month') });
    const z = this._zones();
    this._sessions().forEach(({ d, s }) => {
      if (this.periodKey(d, 'week') === wk.key) this._addSession(wk, s, z);
      if (this.periodKey(d, 'month') === mo.key) this._addSession(mo, s, z);
    });
    return { week: wk, month: mo };
  },

  easyShare(b) {
    return b.zoneTotal ? Math.round((b.zones[1] + b.zones[2]) / b.zoneTotal * 100) : null;
  },

  fmtMin(min) {
    const m = Math.round(min);
    if (m < 60) return m + 'm';
    return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm';
  },

  // Clean axis: a max and tick step from 1/2/5 × 10^k, in minutes, with
  // steps that land on whole hours once the scale is past two hours.
  niceScale(maxMin) {
    const steps = [15, 30, 60, 120, 180, 300, 600, 900, 1200, 1800, 3000, 6000];
    const target = Math.max(maxMin, 30);
    const step = steps.find(s => target / s <= 4) || steps[steps.length - 1];
    return { step, max: Math.ceil(target / step) * step };
  },
  fmtAxis(min) {
    if (min === 0) return '0';
    return min < 60 ? min + 'm' : (min % 60 ? (min / 60).toFixed(1) : String(min / 60)) + 'h';
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports.Stats = Stats;


// ─────────────────────────────────────────────────────────────
// STATS — screen
// ─────────────────────────────────────────────────────────────
let _statsMode = 'week';
let _statsSel = null;     // selected period key; null → the current one

function setStatsMode(m) { _statsMode = m; _statsSel = null; renderStats(); }
function selectStatsPeriod(key) { _statsSel = key; renderStats(); }

function renderStats() {
  const el = document.getElementById('stats-body');
  if (!el) return;
  const esc = (typeof escAttr === 'function') ? escAttr : (s => String(s));
  const now = new Date();
  const sum = Stats.summary(now);
  const data = Stats.compute(_statsMode, now);
  const selKey = (_statsSel && data.some(b => b.key === _statsSel)) ? _statsSel : data[data.length - 1].key;
  const sel = data.find(b => b.key === selKey);
  const z = Stats._zones();
  // Label every bar when there are few; otherwise every third, counted back
  // from the current period so "now" always carries a label.
  const every = data.length > 6 ? 3 : 1;
  const showLbl = i => (data.length - 1 - i) % every === 0;

  let h = `<div style="padding:.4rem 0 .9rem">
    <div class="logo" style="font-size:1.45rem">Stats</div>
    <div style="font-size:.76rem;color:var(--text3);margin-top:.15rem">Where the time went, and how hard it was</div>
  </div>`;

  // summary
  const card = (title, b) => {
    const es = Stats.easyShare(b);
    return `<div class="mv-card st-sum">
      <div class="mv-eyebrow" style="margin-bottom:.55rem">${title}</div>
      <div class="st-sum-k">Sessions</div><div class="st-sum-v">${b.sessions}</div>
      <div class="st-sum-k">Practice time</div><div class="st-sum-v">${b.total ? Stats.fmtMin(b.total) : '0m'}</div>
      <div class="st-sum-k">Easy share</div><div class="st-sum-v" style="${es == null ? 'color:var(--text3)' : ''}">${es == null ? '—' : es + '%'}</div>
      <div class="st-sum-note">${es == null ? 'no heart-rate data' : 'of HR time at or under Z2'}</div>
    </div>`;
  };
  h += `<div class="st-sum-row">${card('This week', sum.week)}${card('This month', sum.month)}</div>`;

  // toggle
  h += `<div class="st-seg" role="tablist">
    <button role="tab" aria-selected="${_statsMode === 'week'}" class="${_statsMode === 'week' ? 'on' : ''}" onclick="setStatsMode('week')">Weekly</button>
    <button role="tab" aria-selected="${_statsMode === 'month'}" class="${_statsMode === 'month' ? 'on' : ''}" onclick="setStatsMode('month')">Monthly</button>
  </div>`;

  // ── chart 1: minutes by modality family ──
  const famsPresent = Stats.FAMILIES.filter(f => f.id !== 'other' || data.some(b => b.fam.other > 0.5));
  const maxTot = Math.max(0, ...data.map(b => b.total));
  const sc = Stats.niceScale(maxTot);
  const ticks = []; for (let v = 0; v <= sc.max; v += sc.step) ticks.push(v);

  const cols1 = data.map((b, i) => {
    const segs = famsPresent.filter(f => b.fam[f.id] > 0.5)
      .map(f => `<i style="flex-grow:${b.fam[f.id].toFixed(2)};background:var(--st-f-${f.id})"></i>`).join('');
    const pct = sc.max ? (b.total / sc.max) * 100 : 0;
    const tip = `${b.long}: ${Stats.fmtMin(b.total)}` + famsPresent.filter(f => b.fam[f.id] > 0.5).map(f => ` · ${f.label} ${Stats.fmtMin(b.fam[f.id])}`).join('');
    return `<button class="st-col ${b.key === selKey ? 'sel' : ''}" onclick="selectStatsPeriod('${b.key}')" title="${esc(tip)}" aria-label="${esc(tip)}">
      ${b.total > 0.5 ? `<div class="st-stack" style="height:${pct.toFixed(2)}%">${segs}</div>` : ''}
    </button>`;
  }).join('');

  const detail1 = sel.total > 0.5
    ? famsPresent.filter(f => sel.fam[f.id] > 0.5).map(f => `<div class="st-drow">
        <i style="background:var(--st-f-${f.id})"></i><span class="st-dname">${f.label}</span>
        <span class="st-dval">${Stats.fmtMin(sel.fam[f.id])}</span><span class="st-dpct">${Math.round(sel.fam[f.id] / sel.total * 100)}%</span>
      </div>`).join('')
    : `<div class="st-empty">Nothing logged.</div>`;

  h += `<div class="mv-card">
    <div class="st-title">Time by modality</div>
    <div class="st-sub">Minutes actually practised, split exercise by exercise</div>
    ${_statsPlot(cols1, ticks.map(v => ({ pos: sc.max ? v / sc.max * 100 : 0, label: Stats.fmtAxis(v) })), data, showLbl)}
    <div class="mv-legend st-legend">${famsPresent.map(f => `<span><i style="background:var(--st-f-${f.id})"></i>${f.label}</span>`).join('')}</div>
    <div class="st-detail">
      <div class="st-dhead"><span>${sel.long}</span><span>${sel.sessions} session${sel.sessions === 1 ? '' : 's'} · ${Stats.fmtMin(sel.total)}</span></div>
      ${detail1}
    </div>
  </div>`;

  // ── chart 2: heart-rate zones, 100% stacked ──
  const cols2 = data.map(b => {
    const tip = b.zoneTotal
      ? `${b.long}: ` + Stats.ZONES.map(zn => `Z${zn.n} ${Math.round(b.zones[zn.n] / b.zoneTotal * 100)}%`).join(' · ')
      : `${b.long}: no heart-rate data`;
    const segs = Stats.ZONES.filter(zn => b.zones[zn.n] > 0)
      .map(zn => `<i style="flex-grow:${b.zones[zn.n]};background:var(--st-z${zn.n})"></i>`).join('');
    return `<button class="st-col ${b.key === selKey ? 'sel' : ''}" onclick="selectStatsPeriod('${b.key}')" title="${esc(tip)}" aria-label="${esc(tip)}">
      ${b.zoneTotal ? `<div class="st-stack" style="height:100%">${segs}</div>` : '<div class="st-nodata"></div>'}
    </button>`;
  }).join('');

  const zRange = n => n === 1 ? `≤ ${z.z1}` : n === 5 ? `${z.z4 + 1}+` : `${z['z' + (n - 1)] + 1}–${z['z' + n]}`;
  const es = Stats.easyShare(sel);
  const detail2 = sel.zoneTotal
    ? Stats.ZONES.map(zn => `<div class="st-drow">
        <i style="background:var(--st-z${zn.n})"></i><span class="st-dname">Z${zn.n} ${zn.label} <em>${zRange(zn.n)}</em></span>
        <span class="st-dval">${Stats.fmtMin(sel.zones[zn.n] / 60)}</span><span class="st-dpct">${Math.round(sel.zones[zn.n] / sel.zoneTotal * 100)}%</span>
      </div>`).join('') +
      `<div class="st-dfoot">Easy share <b>${es}%</b> · target ${Stats.EASY_TARGET}%+ across the ${_statsMode}. A 4×4 day should sit well under it on its own.</div>`
    : `<div class="st-empty">No heart-rate data. Imported runs and rides fill this in.</div>`;

  h += `<div class="mv-card">
    <div class="st-title">Heart rate zones</div>
    <div class="st-sub">Share of HR-tracked time in each zone</div>
    ${_statsPlot(cols2, [0, 25, 50, 75, 100].map(v => ({ pos: v, label: v + '%' })), data, showLbl, Stats.EASY_TARGET)}
    <div class="mv-legend st-legend">${Stats.ZONES.map(zn => `<span><i style="background:var(--st-z${zn.n})"></i>Z${zn.n}</span>`).join('')}</div>
    <div class="st-detail">
      <div class="st-dhead"><span>${sel.long}</span><span>${sel.zoneTotal ? `${sel.hrSessions} with HR · ${Stats.fmtMin(sel.zoneTotal / 60)}` : ''}</span></div>
      ${detail2}
    </div>
  </div>`;

  el.innerHTML = h;
}

// Shared plot frame: horizontal gridlines with right-hand labels, a row of
// tappable columns, x labels. `ref` draws one labelled reference line.
function _statsPlot(cols, ticks, data, showLbl, ref) {
  return `<div class="st-plot">
    ${ticks.map(t => `<div class="st-grid" style="bottom:${t.pos}%"><span>${t.label}</span></div>`).join('')}
    ${ref != null ? `<div class="st-ref" style="bottom:${ref}%"><span>${ref}% easy</span></div>` : ''}
    <div class="st-cols">${cols}</div>
  </div>
  <div class="st-x">${data.map((b, i) => `<span>${showLbl(i) ? b.label : ''}</span>`).join('')}</div>`;
}
