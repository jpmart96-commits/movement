// ─────────────────────────────────────────────────────────────
// DAILY LOG — two touches a day, a routine checklist, sleep, trends
//
// Agreed 28 Sep 2026:
//  - Two touches: morning (sleep quality, mood, energy, calm) and evening
//    (how the day landed, calm, one line). Every tap saves; there is no
//    submit button.
//  - Routine checklist from the daily shape: up by 7, morning meditation,
//    breakfast before training, training, second meditation, desk by
//    13:15, off the desk by 18:30, 2 h coding block, wind-down. Training
//    ticks itself when a session is logged. The list is editable.
//  - No trading state here: it lives in the trading hub and will be synced
//    in later (day.ext is reserved for that).
//  - Sleep hours come from the watch (Vitals), never typed.
// State: DB key 'daylog' (pb_daylog), synced as an overrides row.
// The morning ratings also seed App.checkin (sleep, energy), so the
// Generate screen doesn't ask again.
// ─────────────────────────────────────────────────────────────

const DayLog = (() => {
  const KEY = 'daylog';
  const DEFAULT_ROUTINES = [
    { id: 'wake',      label: 'Up by 7:00',               when: 'am' },
    { id: 'med1',      label: 'Morning meditation',       when: 'am', minutes: true },
    { id: 'breakfast', label: 'Breakfast before training', when: 'am' },
    { id: 'train',     label: 'Training',                 when: 'am', auto: 'train' },
    { id: 'med2',      label: 'Second meditation',        when: 'am', minutes: true },
    { id: 'desk',      label: 'At the desk by 13:15',     when: 'pm' },
    { id: 'offdesk',   label: 'Off the desk by 18:30',    when: 'pm' },
    { id: 'code',      label: '2 h coding block',         when: 'pm' },
    { id: 'winddown',  label: 'Wind-down',                when: 'pm' },
  ];
  const AM = [['sleepQ', 'Sleep', 'poor', 'great'], ['mood', 'Mood', 'low', 'good'], ['energy', 'Energy', 'flat', 'full'], ['calm', 'Calm', 'agitated', 'still']];
  const PM = [['day', 'The day', 'rough', 'good'], ['calm', 'Calm', 'agitated', 'still']];
  const MINS = [10, 15, 20, 30];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let S = null;
  const ui = { tab: 'checkin', date: null, editing: false };

  // ── dates ────────────────────────────────────────────────
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = k => new Date(k + 'T12:00:00');
  const todayKey = () => keyOf(new Date());
  function addDays(k, n) { const d = parse(k); d.setDate(d.getDate() + n); return keyOf(d); }
  const fmtD = k => { const d = parse(k); return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── state ────────────────────────────────────────────────
  function load() {
    const v = (typeof DB !== 'undefined') ? DB.get(KEY) : null;
    if (v && typeof v === 'object' && v.v === 1) {
      S = v;
      if (!S.days || typeof S.days !== 'object') S.days = {};
      if (!Array.isArray(S.routines) || !S.routines.length) S.routines = DEFAULT_ROUTINES.map(r => ({ ...r }));
    } else S = { v: 1, routines: DEFAULT_ROUTINES.map(r => ({ ...r })), days: {} };
    return S;
  }
  function save() { S.updatedAt = Date.now(); if (typeof DB !== 'undefined') DB.set(KEY, S); }
  const dayRec = (k, create) => {
    let d = S.days[k];
    if (!d) { d = { am: {}, pm: {}, done: {}, med: {} }; if (create) S.days[k] = d; }
    ['am', 'pm', 'done', 'med'].forEach(x => { if (!d[x] || typeof d[x] !== 'object') d[x] = {}; });
    return d;
  };

  // ── links to the rest of the app ─────────────────────────
  function trained(k) {
    if (typeof DB !== 'undefined') {
      const inst = DB.get('daily_instance_' + k);
      if (inst && inst.status === 'completed') return true;
    }
    if (typeof History !== 'undefined' && History.getIndex) {
      try {
        return History.getIndex(60).some(e => {
          if (!e || !e.date) return false;
          const s = String(e.date); return (s.length === 10 ? s : keyOf(new Date(s))) === k;
        });
      } catch (e) { return false; }
    }
    return false;
  }
  function vitalsFor(k) {
    const doc = (typeof Vitals !== 'undefined' && Vitals.load) ? Vitals.load() : null;
    return (doc && doc.days && doc.days[k]) || null;
  }
  const hm = m => m == null ? '—' : `${Math.floor(m / 60)}h ${pad(Math.round(m % 60))}`;

  // Is routine r done on day k? { on, auto }
  function isDone(r, k) {
    const d = dayRec(k);
    if (d.done[r.id] === true) return { on: true, auto: false };
    if (d.done[r.id] === false) return { on: false, auto: false };
    if (r.auto === 'train' && trained(k)) return { on: true, auto: true };
    return { on: false, auto: false };
  }
  function amDone(d) { return AM.every(([f]) => d.am[f] != null); }
  function pmDone(d) { return PM.every(([f]) => d.pm[f] != null); }

  // Sync the morning ratings into the training check-in.
  function seedCheckin(k) {
    if (k !== todayKey() || typeof App === 'undefined' || !App.checkin) return;
    const d = dayRec(k);
    if (d.am.sleepQ != null) App.checkin.sleep = d.am.sleepQ;
    if (d.am.energy != null) App.checkin.energy = d.am.energy;
  }

  // ── render ───────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const TITLES = { checkin: 'Check-in', sleep: 'Sleep', trends: 'Trends' };

  function render(tab) {
    if (tab && TITLES[tab]) ui.tab = tab;
    load();
    if (!ui.date) ui.date = todayKey();
    const body = $('daylog-body'); if (!body) return;
    const t = ui.tab;
    body.innerHTML = `<header class="dl-top"><div><div class="mv-eyebrow mv-eyebrow--accent">Daily log</div>
      <h1 class="dl-h1">${t === 'checkin' ? (ui.date === todayKey() ? 'Today' : ui.date === addDays(todayKey(), -1) ? 'Yesterday' : fmtD(ui.date)) : TITLES[t]}</h1>
      ${t === 'checkin' ? `<div class="dl-sub">${fmtD(ui.date)}</div>` : ''}</div>
      ${t === 'checkin' ? `<div class="dl-top-r"><button class="dl-iconbtn" data-dl="date" data-v="-1" aria-label="Previous day">‹</button><button class="dl-iconbtn" data-dl="date" data-v="1" aria-label="Next day" ${ui.date >= todayKey() ? 'disabled' : ''}>›</button></div>` : ''}
      </header>${({ checkin: vCheckin, sleep: vSleep, trends: vTrends })[t]()}`;
  }

  function scale(part, f, label, lo, hi, val) {
    return `<div class="dl-q"><div class="dl-ql"><span>${label}</span><span class="dl-qe">${lo} · ${hi}</span></div>
      <div class="dl-scale" role="radiogroup" aria-label="${label}">${[1, 2, 3, 4, 5].map(n => `<button role="radio" aria-checked="${val === n}" data-dl="rate" data-part="${part}" data-f="${f}" data-v="${n}" aria-label="${label} ${n} of 5">${n}</button>`).join('')}</div></div>`;
  }
  function routineRow(r, k) {
    const d = dayRec(k), st = isDone(r, k), m = d.med[r.id];
    return `<div class="dl-rt ${st.on ? 'is-on' : ''}"><button class="dl-tick" data-dl="tick" data-v="${r.id}" aria-pressed="${st.on}" aria-label="${esc(r.label)}">
        <span class="dl-box">${st.on ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>' : ''}</span>
        <span class="dl-rl">${esc(r.label)}${st.auto ? ' <span class="dl-auto">logged</span>' : ''}${m ? ` <span class="dl-auto">${m} min</span>` : ''}</span></button>
      ${r.minutes ? `<div class="dl-mins">${MINS.map(n => `<button data-dl="mins" data-v="${r.id}" data-n="${n}" aria-pressed="${m === n}" aria-label="${n} minutes">${n}</button>`).join('')}</div>` : ''}</div>`;
  }
  function vCheckin() {
    const k = ui.date, d = dayRec(k), v = vitalsFor(k);
    const hour = new Date().getHours(), isToday = k === todayKey();
    const evening = !isToday || hour >= 17 || amDone(d);
    const am = S.routines.filter(r => r.when !== 'pm'), pm = S.routines.filter(r => r.when === 'pm');
    const doneN = S.routines.filter(r => isDone(r, k).on).length;
    const sleepLine = v && v.sleep != null ? `Watch: ${hm(v.sleep)} asleep${v.deep != null ? ` · deep ${hm(v.deep)}` : ''}${v.rem != null ? ` · REM ${hm(v.rem)}` : ''}${v.hrv != null ? ` · HRV ${Math.round(v.hrv)}` : ''}` : 'No watch sleep for this night yet — it arrives with the next Health import.';
    const morning = `<div class="card dl-touch ${amDone(d) ? 'is-done' : ''}"><div class="dl-th"><h2 class="dl-h2">Morning</h2><span class="dl-state">${amDone(d) ? 'Done' : 'About 10 s'}</span></div>
      <div class="dl-small dl-muted dl-watch">${sleepLine}</div>
      ${AM.map(([f, l, lo, hi]) => scale('am', f, l, lo, hi, d.am[f])).join('')}</div>`;
    const evn = `<div class="card dl-touch ${pmDone(d) ? 'is-done' : ''}"><div class="dl-th"><h2 class="dl-h2">Evening</h2><span class="dl-state">${pmDone(d) ? 'Done' : 'About 15 s'}</span></div>
      ${PM.map(([f, l, lo, hi]) => scale('pm', f, l, lo, hi, d.pm[f])).join('')}
      <label class="dl-f" for="dl-note">One line about the day</label>
      <input class="dl-in" id="dl-note" data-dl-note="pm" value="${esc(d.pm.note || '')}" placeholder="Optional" maxlength="280"></div>`;
    const routines = `<div class="card"><div class="dl-th"><h2 class="dl-h2">Routine</h2><span class="dl-state">${doneN} of ${S.routines.length}</span></div>
      <div class="dl-sec">Morning to midday</div>${am.map(r => routineRow(r, k)).join('')}
      <div class="dl-sec">Afternoon and night</div>${pm.map(r => routineRow(r, k)).join('')}
      <button class="dl-linkbtn" data-dl="editlist">${ui.editing ? 'Done editing' : 'Edit the list'}</button>
      ${ui.editing ? editor() : ''}</div>`;
    // Morning first until it's done; after 17:00 (or once the morning is in) the evening leads.
    return evening && !pmDone(d) && amDone(d) ? evn + routines + morning : morning + routines + evn;
  }
  function editor() {
    return `<div class="dl-edit">${S.routines.map((r, i) => `<div class="dl-erow">
      <input class="dl-in" data-dl-label="${r.id}" value="${esc(r.label)}" aria-label="Routine name">
      <button class="dl-iconbtn dl-iconbtn--sm" data-dl="when" data-v="${r.id}" aria-label="Morning or evening">${r.when === 'pm' ? 'PM' : 'AM'}</button>
      <button class="dl-iconbtn dl-iconbtn--sm" data-dl="up" data-v="${i}" aria-label="Move up" ${i ? '' : 'disabled'}>↑</button>
      <button class="dl-iconbtn dl-iconbtn--sm" data-dl="del" data-v="${r.id}" aria-label="Remove">×</button></div>`).join('')}
      <div class="dl-erow"><input class="dl-in" id="dl-newr" placeholder="Add a routine, e.g. Screens off by 22:30"><button class="dl-btn" data-dl="addr">Add</button></div>
      <div class="dl-small dl-muted">Removing a routine keeps what was already ticked.</div></div>`;
  }

  // ── sleep ────────────────────────────────────────────────
  function vSleep() {
    const t = todayKey(), nights = [];
    for (let i = 0; i < 14; i++) { const k = addDays(t, -i); const v = vitalsFor(k) || {}; nights.push({ k, min: v.sleep, deep: v.deep, rem: v.rem, q: dayRec(k).am.sleepQ, wd: isDone(S.routines.find(r => r.id === 'winddown') || { id: 'winddown' }, addDays(k, -1)).on }); }
    const valid = nights.filter(n => n.min >= 180);
    const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    const avgMin = avg(valid.slice(0, 7).map(n => n.min)), avgQ = avg(nights.slice(0, 7).filter(n => n.q != null).map(n => n.q));
    const max = Math.max(540, ...valid.map(n => n.min));
    const rows = nights.map(n => `<div class="dl-night"><span class="dl-nd">${fmtD(n.k)}</span>
      <span class="dl-nbar" aria-hidden="true">${n.min != null ? `<i style="width:${Math.min(100, n.min / max * 100)}%" class="${n.min < 180 ? 'is-partial' : ''}"></i>` : ''}</span>
      <span class="dl-nv">${n.min != null ? hm(n.min) : '—'}</span>
      <span class="dl-nq" aria-label="${n.q ? 'quality ' + n.q + ' of 5' : 'not rated'}">${n.q ? '●'.repeat(n.q) + '<b>' + '●'.repeat(5 - n.q) + '</b>' : '<b>·····</b>'}</span>
      <span class="dl-nw" title="Wind-down the evening before">${n.wd ? 'WD' : ''}</span></div>`).join('');
    const cmp = windDownCompare();
    return `<div class="dl-sumrow"><div class="card"><div class="mv-eyebrow">Last 7 nights</div><div class="dl-big">${avgMin != null ? hm(avgMin) : '—'}</div><div class="dl-small dl-muted">average asleep (watch)</div></div>
      <div class="card"><div class="mv-eyebrow">Your rating</div><div class="dl-big">${avgQ != null ? avgQ.toFixed(1) : '—'}<span class="dl-of"> / 5</span></div><div class="dl-small dl-muted">average sleep quality</div></div></div>
      <div class="card"><div class="dl-th"><h2 class="dl-h2">Two weeks</h2><span class="dl-small dl-muted">bar: watch · dots: your rating · WD: wind-down the night before</span></div>${rows}</div>
      ${cmp}<p class="dl-small dl-muted">Nights under 3 h are usually the watch coming off; they are drawn faded and left out of averages. Longer history: Stats → Body.</p>`;
  }
  function windDownCompare() {
    const t = todayKey(), yes = [], no = [];
    for (let i = 1; i < 90; i++) {
      const k = addDays(t, -i), prev = addDays(k, -1), v = vitalsFor(k), pd = S.days[prev];
      if (!v || !(v.sleep >= 180) || !pd) continue;
      (dayRec(prev).done.winddown === true ? yes : no).push(v.sleep);
    }
    if (yes.length < 5 || no.length < 5) return `<div class="card dl-cmp"><div class="dl-small dl-muted">After ${Math.max(0, 5 - yes.length)} more wind-down nights and ${Math.max(0, 5 - no.length)} without, this compares how long you sleep after each.</div></div>`;
    const a = yes.reduce((x, y) => x + y, 0) / yes.length, b = no.reduce((x, y) => x + y, 0) / no.length;
    return `<div class="card dl-cmp"><div class="mv-eyebrow">After a wind-down</div><div class="dl-cmpv"><b>${hm(a)}</b> vs <b>${hm(b)}</b> without</div><div class="dl-small dl-muted">${yes.length} and ${no.length} nights. A pattern in your data, not proof of cause.</div></div>`;
  }

  // ── trends ───────────────────────────────────────────────
  function vTrends() {
    const t = todayKey(), days = [...Array(28)].map((_, i) => addDays(t, i - 27));
    const logged = Object.keys(S.days).length;
    const grid = `<div class="card"><div class="dl-th"><h2 class="dl-h2">Four weeks</h2><span class="dl-small dl-muted">${fmtD(days[0])} – today</span></div>
      <div class="dl-grid" role="table" aria-label="Routine adherence, last 28 days">${S.routines.map(r => {
        const n = days.filter(k => isDone(r, k).on).length;
        return `<div class="dl-grow" role="row"><span class="dl-gl" role="rowheader">${esc(r.label)}</span><span class="dl-gcells">${days.map(k => `<i class="${isDone(r, k).on ? 'on' : ''} ${k === t ? 'now' : ''}" title="${fmtD(k)}"></i>`).join('')}</span><span class="dl-gn">${n}</span></div>`;
      }).join('')}</div></div>`;
    const avg = (from, to, part, f) => { const xs = []; for (let i = from; i < to; i++) { const d = S.days[addDays(t, -i)]; if (d && d[part] && d[part][f] != null) xs.push(d[part][f]); } return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
    const metric = (label, part, f) => { const a = avg(0, 7, part, f), b = avg(7, 14, part, f); const dlt = a != null && b != null ? a - b : null;
      return `<div class="dl-met"><span>${label}</span><b>${a != null ? a.toFixed(1) : '—'}</b><span class="dl-small dl-muted">${dlt == null ? '' : (dlt >= 0 ? '+' : '') + dlt.toFixed(1) + ' vs week before'}</span></div>`; };
    const mets = `<div class="card"><div class="dl-th"><h2 class="dl-h2">This week</h2><span class="dl-small dl-muted">average of 1–5</span></div>
      ${metric('Morning mood', 'am', 'mood')}${metric('Morning energy', 'am', 'energy')}${metric('Morning calm', 'am', 'calm')}${metric('Evening calm', 'pm', 'calm')}${metric('How the day landed', 'pm', 'day')}</div>`;
    return (logged ? '' : `<div class="card dl-empty"><h2 class="dl-h2">Nothing logged yet</h2><p class="dl-muted">Start with this morning's check-in. Trends fill in as days come in.</p><button class="dl-btn" data-dl="gocheckin">Open today</button></div>`)
      + grid + mets + compare();
  }
  // Days with routine X vs without, on evening calm and how the day landed.
  function compare() {
    const t = todayKey(), out = [];
    S.routines.forEach(r => {
      const yes = [], no = [];
      for (let i = 0; i < 90; i++) {
        const k = addDays(t, -i), d = S.days[k]; if (!d || !d.pm || d.pm.calm == null) continue;
        (isDone(r, k).on ? yes : no).push(d.pm.calm);
      }
      if (yes.length >= 5 && no.length >= 5) {
        const a = yes.reduce((x, y) => x + y, 0) / yes.length, b = no.reduce((x, y) => x + y, 0) / no.length;
        out.push({ r, a, b, n1: yes.length, n2: no.length, gap: a - b });
      }
    });
    if (!out.length) return `<div class="card dl-cmp"><div class="mv-eyebrow">With and without</div><div class="dl-small dl-muted" style="margin-top:4px">Once a routine has at least 5 evenings with it and 5 without, this shows your evening calm on each side.</div></div>`;
    out.sort((x, y) => Math.abs(y.gap) - Math.abs(x.gap));
    return `<div class="card dl-cmp"><div class="dl-th"><h2 class="dl-h2">With and without</h2><span class="dl-small dl-muted">evening calm</span></div>
      ${out.map(o => `<div class="dl-met"><span>${esc(o.r.label)}</span><b>${o.a.toFixed(1)} <span class="dl-muted">vs</span> ${o.b.toFixed(1)}</b><span class="dl-small dl-muted">${o.n1} / ${o.n2} days</span></div>`).join('')}
      <div class="dl-small dl-muted" style="margin-top:8px">Patterns in your own days, not proof of cause.</div></div>`;
  }

  // ── events ───────────────────────────────────────────────
  function onClick(e) {
    const b = e.target.closest('[data-dl]'); if (!b) return;
    load();
    const a = b.dataset.dl, v = b.dataset.v, k = ui.date || todayKey();
    switch (a) {
      case 'date': { const n = addDays(k, +v); if (n > todayKey()) return; ui.date = n; render(); return; }
      case 'gocheckin': ui.date = todayKey(); navTo('daylog-checkin'); return;
      case 'rate': {
        const d = dayRec(k, true), part = b.dataset.part, f = b.dataset.f, n = +v;
        if (d[part][f] === n) delete d[part][f]; else d[part][f] = n;
        d[part].at = Date.now(); save(); seedCheckin(k); render(); return;
      }
      case 'tick': {
        const d = dayRec(k, true), r = S.routines.find(x => x.id === v); if (!r) return;
        if (isDone(r, k).on) {
          // A logged session would tick it again, so unticking one is an explicit "no".
          if (r.auto === 'train' && trained(k)) d.done[v] = false; else delete d.done[v];
          delete d.med[v];
        } else d.done[v] = true;
        save(); render(); return;
      }
      case 'mins': {
        const d = dayRec(k, true), n = +b.dataset.n;
        if (d.med[v] === n) { delete d.med[v]; } else { d.med[v] = n; d.done[v] = true; }
        save(); render(); return;
      }
      case 'editlist': ui.editing = !ui.editing; render(); return;
      case 'when': { const r = S.routines.find(x => x.id === v); if (r) { r.when = r.when === 'pm' ? 'am' : 'pm'; save(); render(); } return; }
      case 'up': { const i = +v; if (i > 0) { const x = S.routines.splice(i, 1)[0]; S.routines.splice(i - 1, 0, x); save(); render(); } return; }
      case 'del': { if (S.routines.length <= 1) return; S.routines = S.routines.filter(x => x.id !== v); save(); render(); return; }
      case 'addr': {
        const i = $('dl-newr'), txt = i && i.value.trim(); if (!txt) return;
        S.routines.push({ id: 'r' + Date.now().toString(36), label: txt.slice(0, 60), when: new Date().getHours() >= 14 ? 'pm' : 'am' });
        save(); render(); return;
      }
      default: return;
    }
  }
  function onChange(e) {
    const t = e.target; load();
    const k = ui.date || todayKey();
    if (t.dataset.dlNote) { const d = dayRec(k, true); const val = t.value.trim().slice(0, 280); if (val) d.pm.note = val; else delete d.pm.note; save(); return; }
    if (t.dataset.dlLabel) { const r = S.routines.find(x => x.id === t.dataset.dlLabel); const val = t.value.trim(); if (r && val) { r.label = val.slice(0, 60); save(); } return; }
  }
  function onKey(e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'dl-newr') { e.preventDefault(); const b = document.querySelector('[data-dl="addr"]'); if (b) b.click(); }
    if (e.key === 'Enter' && e.target && e.target.id === 'dl-note') e.target.blur();
  }
  function init() {
    const scr = typeof document !== 'undefined' && $('screen-daylog');
    if (!scr || scr._dl) return; scr._dl = true;
    scr.addEventListener('click', onClick); scr.addEventListener('change', onChange); scr.addEventListener('keydown', onKey);
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }

  return {
    render, init, load, isDone, trained, DEFAULT_ROUTINES, ui,
    get state() { return S; },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { DayLog };
