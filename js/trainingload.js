// ─────────────────────────────────────────────────────────────
// TRAINING LOAD — how hard the weeks actually were.
//
// Session RPE × minutes (Foster's session-RPE method): one number per
// session, asked once at Complete ("how hard was the whole thing, 1–10").
// Summed per day and per week, it answers the question the plan can't:
// is this week much more than you're used to? Six 140-minute days is a lot
// for someone returning from long gaps, and nothing else in the app notices
// when a week runs hot.
//
//   acute    = last 7 days
//   chronic  = average week over the last 28 days
//   ratio    = acute / chronic      > 1.5 → spike (warn), 1.3–1.5 → high
//   monotony = mean daily / SD over the last 7 days — computed, but NOT a
//              warning: the usual threshold (2) assumes rest days, and this
//              plan's normal week (hard/easy alternating, one light day, no
//              zero day) already scores ~2.4, so it would fire every week.
//
// Sessions without a session RPE are estimated — from their set RPEs if any,
// else from the day type — and marked as estimates everywhere they show, so
// the history back to June counts from day one without pretending.
// Pure logic first; the small UI helpers at the bottom only run in a browser.
// ─────────────────────────────────────────────────────────────

const TrainingLoad = {

  // Typical session RPE per day type, used only when nothing was logged.
  DEFAULT_RPE: { 'strength-a': 7, 'strength-b': 7, 'plyo-power': 7, 'quality-run': 8, 'aerobic-test': 7,
                 'z2-run': 4, 'z2-bike': 4, 'light': 2 },
  RPE_LABELS: { 1: 'very easy', 2: 'easy', 3: 'moderate', 4: 'somewhat hard', 5: 'hard', 6: 'hard',
                7: 'very hard', 8: 'very hard', 9: 'near max', 10: 'max' },
  SPIKE: 1.5, HIGH: 1.3, MONOTONY: 2, MIN_HISTORY_DAYS: 21,

  _key(d) { const p = n => String(n).padStart(2, '0'); const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`; },
  _day(k) { return new Date(k + 'T12:00:00'); },
  _add(k, n) { const d = this._day(k); d.setDate(d.getDate() + n); return this._key(d); },

  // { rpe, estimated, source }
  sessionRpe(s) {
    if (!s) return { rpe: null, estimated: true, source: 'none' };
    if (typeof s.sessionRpe === 'number' && s.sessionRpe > 0) return { rpe: s.sessionRpe, estimated: false, source: 'session' };
    const rpes = [];
    (s.blocks || []).forEach(b => (b.exercises || []).forEach(e => {
      (e.sets || []).forEach(x => { if (typeof x.rpe === 'number') rpes.push(x.rpe); });
      if (e.cardioLog && typeof e.cardioLog.rpe === 'number') rpes.push(e.cardioLog.rpe);
    }));
    // Hardest efforts dominate how a session feels; the mean of the top
    // half of set RPEs, minus one, is a fair stand-in.
    if (rpes.length) {
      const top = rpes.sort((a, b) => b - a).slice(0, Math.max(1, Math.ceil(rpes.length / 2)));
      return { rpe: Math.max(1, Math.round((top.reduce((a, b) => a + b, 0) / top.length - 1) * 2) / 2), estimated: true, source: 'sets' };
    }
    const kind = s.dayKind || (s.planRef && s.planRef.dayType) || null;
    if (kind && this.DEFAULT_RPE[kind] != null) return { rpe: this.DEFAULT_RPE[kind], estimated: true, source: 'day-type' };
    return { rpe: 5, estimated: true, source: 'default' };
  },

  // Minutes actually trained: the watch window when there is one, else the
  // session's own duration.
  minutes(s) {
    if (s && s.watchWindow && s.watchWindow.start && s.watchWindow.end) {
      const m = Math.round((Date.parse(s.watchWindow.end) - Date.parse(s.watchWindow.start)) / 60000);
      if (m > 5 && m < 400) return m;
    }
    return Math.max(0, Math.round((s && s.duration) || 0));
  },

  // sessions: full session objects. Returns { 'YYYY-MM-DD': { load, minutes, estimated, n } }.
  daily(sessions) {
    const out = {};
    (sessions || []).forEach(s => {
      if (!s || !s.date || s.status === 'in-progress') return;
      const k = String(s.date).length === 10 ? s.date : this._key(s.date);
      const r = this.sessionRpe(s), m = this.minutes(s);
      if (!m || !r.rpe) return;
      const d = out[k] || (out[k] = { load: 0, minutes: 0, estimated: false, n: 0 });
      d.load += r.rpe * m; d.minutes += m; d.n++;
      if (r.estimated) d.estimated = true;
    });
    return out;
  },

  summary(sessions, todayKey) {
    const today = todayKey || this._key(new Date());
    const days = this.daily(sessions);
    const keys = Object.keys(days).sort();
    const sumRange = (from, to) => keys.filter(k => k >= from && k <= to).reduce((a, k) => a + days[k].load, 0);
    const acute = sumRange(this._add(today, -6), today);
    const chronic28 = sumRange(this._add(today, -27), today);
    const chronicWeek = chronic28 / 4;
    const first = keys[0] || null;
    const historyDays = first ? Math.round((this._day(today) - this._day(first)) / 864e5) : 0;
    const enough = historyDays >= this.MIN_HISTORY_DAYS && chronicWeek > 0;
    const ratio = enough ? Math.round(acute / chronicWeek * 100) / 100 : null;
    const last7 = Array.from({ length: 7 }, (_, i) => (days[this._add(today, -i)] || {}).load || 0);
    const mean = last7.reduce((a, b) => a + b, 0) / 7;
    const sd = Math.sqrt(last7.reduce((a, b) => a + (b - mean) ** 2, 0) / 7);
    const monotony = sd > 0 ? Math.round(mean / sd * 10) / 10 : null;
    // Eight Monday-to-Sunday weeks, oldest first, the current one partial.
    const dow = (this._day(today).getDay() + 6) % 7;
    const monday = this._add(today, -dow);
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = this._add(monday, -7 * (7 - i)), end = this._add(start, 6);
      const ks = keys.filter(k => k >= start && k <= end);
      return { start, load: Math.round(ks.reduce((a, k) => a + days[k].load, 0)),
        minutes: ks.reduce((a, k) => a + days[k].minutes, 0), estimated: ks.some(k => days[k].estimated), current: i === 7 };
    });
    const estimatedShare = keys.length ? keys.filter(k => days[k].estimated).length / keys.length : 0;
    let flag = null, reason = '';
    if (ratio != null && ratio > this.SPIKE) { flag = 'spike'; reason = `This week is ${ratio}× your usual week.`; }
    else if (ratio != null && ratio > this.HIGH) { flag = 'high'; reason = `This week is ${ratio}× your usual week — at the top of what's safe to build on.`; }
    return { today, acute: Math.round(acute), chronicWeek: Math.round(chronicWeek), ratio, monotony, weeks,
      enough, historyDays, estimatedShare: Math.round(estimatedShare * 100) / 100, flag, reason, days };
  },
};

// ── Browser helpers ───────────────────────────────────────────
// All sessions in History, full objects.
TrainingLoad.allSessions = function () {
  if (typeof History === 'undefined') return [];
  return History.getIndex(100000).map(r => History.getSession(r.id)).filter(Boolean);
};

// Asks "how hard was the whole session?" once at Complete. cb(rpe|null).
TrainingLoad.askRpe = function (cb) {
  if (typeof document === 'undefined') { cb(null); return; }
  const old = document.getElementById('srpe-backdrop'); if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'srpe-backdrop'; el.className = 'modal-backdrop'; el.style.display = 'flex';
  el.innerHTML = `<div class="modal" onclick="event.stopPropagation()">
    <div class="ex-edit-header"><div class="ex-edit-name">How hard was the whole session?</div></div>
    <div style="font-size:.78rem;color:var(--text3);margin:-.2rem 0 .8rem">One number for everything together, 1 = very easy, 10 = max. It turns minutes into training load.</div>
    <div class="srpe-grid">${[1,2,3,4,5,6,7,8,9,10].map(v => `<button type="button" class="srpe-chip" data-v="${v}"><b>${v}</b><span>${TrainingLoad.RPE_LABELS[v]}</span></button>`).join('')}</div>
    <button type="button" class="mv-ghost" style="margin-top:.8rem" data-v="skip">Skip</button></div>`;
  const done = v => { el.remove(); cb(v); };
  // Capture phase: the inner .modal stops click propagation.
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (b) done(b.dataset.v === 'skip' ? null : +b.dataset.v);
  }, true);
  document.body.appendChild(el);
};

// Progress card: this week against the usual, eight weeks of bars.
TrainingLoad.card = function () {
  const s = TrainingLoad.summary(TrainingLoad.allSessions());
  const max = Math.max(1, ...s.weeks.map(w => w.load), s.chronicWeek);
  const bars = s.weeks.map(w => {
    const h = Math.max(3, Math.round(w.load / max * 100));
    const hot = s.chronicWeek && w.load > s.chronicWeek * TrainingLoad.SPIKE;
    return `<div title="${w.start} · ${w.load} (${w.minutes} min)${w.estimated ? ' · partly estimated' : ''}" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:64px">
      <div style="height:${h}%;border-radius:3px 3px 0 0;background:${hot ? 'var(--warm)' : 'var(--accent)'};opacity:${w.current ? .55 : (w.estimated ? .7 : 1)}"></div></div>`;
  }).join('');
  const usual = s.chronicWeek ? `<div style="position:relative;margin-top:-${Math.round(s.chronicWeek / max * 64) + 1}px;border-top:1px dashed var(--text3);height:0" title="usual week"></div>` : '';
  const head = !s.enough
    ? `Building a baseline — needs about three weeks of sessions.`
    : `This week <b>${s.acute}</b> · usual <b>${s.chronicWeek}</b> · <b>${s.ratio}×</b>`;
  return `<div class="mv-card"><div class="mv-eyebrow" style="margin-bottom:.4rem">Training load</div>
    <div style="font-size:.8rem;color:var(--text2);margin-bottom:.6rem">${head}</div>
    ${s.flag ? `<div class="mv-note" style="margin-bottom:.6rem">${s.reason}</div>` : ''}
    <div style="display:flex;align-items:flex-end;gap:5px">${bars}</div>${usual}
    <div style="display:flex;justify-content:space-between;margin-top:.35rem;font-size:.64rem;color:var(--text3)"><span>8 weeks ago</span><span>this week</span></div>
    <div style="font-size:.68rem;color:var(--text3);margin-top:.5rem;line-height:1.4">Session RPE × minutes. ${s.estimatedShare > 0 ? `${Math.round(s.estimatedShare * 100)}% of days are estimated (no session RPE logged) — faded bars.` : ''}</div></div>`;
};

// Today: a note when this week runs hot, offering Lighter. Never automatic.
TrainingLoad.todayBanner = function (session) {
  let s; try { s = TrainingLoad.summary(TrainingLoad.allSessions()); } catch (e) { return ''; }
  if (!s.flag) return '';
  const already = session && (session.edits || []).some(e => e.action === 'lighter');
  return `<div class="mv-card mv-card--warm mv-ready">
    <div class="mv-ready-k">Load ${s.flag === 'spike' ? 'spike' : 'high'}</div>
    <div class="mv-ready-v">${s.reason} Last 7 days ${s.acute}, usual week ${s.chronicWeek}.</div>
    ${already ? '<div class="mv-ready-v" style="margin-top:.35rem">Lighter is on for today.</div>'
      : `<button type="button" class="mv-pill" style="margin-top:.5rem" onclick="dayEdit({action:'lighter',maxTier:'moderate'},'Lighter: load was high this week')">Make today lighter</button>`}
  </div>`;
};

// Session detail (Log): set or change the session RPE after the fact.
TrainingLoad.detailRow = function (id, session) {
  const r = TrainingLoad.sessionRpe(session);
  return `<div style="margin:.8rem 0 .2rem;font-size:.72rem;color:var(--text3)">Session RPE${r.estimated ? ` · estimated ${r.rpe}` : ''} · load ${Math.round((r.rpe || 0) * TrainingLoad.minutes(session))}</div>
    <div class="rpe-chips">${[1,2,3,4,5,6,7,8,9,10].map(v => `<button type="button" class="rpe-chip${!r.estimated && r.rpe === v ? ' on' : ''}" onclick="TrainingLoad.setFor('${id}',${v})">${v}</button>`).join('')}</div>`;
};
TrainingLoad.setFor = function (id, v) {
  const s = History.getSession(id); if (!s) return;
  s.sessionRpe = v;
  History.updateSession(id, s);
  if (s.weekday && s.date && s.status === 'completed') DB.set('daily_instance_' + s.date, s);
  if (typeof openSessionModal === 'function') openSessionModal(id);
};

if (typeof module !== 'undefined' && module.exports) module.exports = { TrainingLoad };
