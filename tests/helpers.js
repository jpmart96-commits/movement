'use strict';
// Shared helpers for the *.test.js files: generating a day the way the app
// does, and a compact normal form for snapshots and diffs.
const { freshContext } = require('./load');

// Generate a day with an empty history, the clock set to 09:00 that morning.
function generateDay(app, ymd, extra = {}) {
  app.setNow(ymd + 'T09:00:00');
  const profile = extra.profile || app.Profile.load();
  return app.Generator.generateFromScaffold({
    date: app.date(ymd), profile, sleep: 0, energy: 0, pain: '', focus: '', ...extra,
  });
}

function planDayFor(app, ymd) { return app.MonthPlan.dayFor(app.date(ymd)); }

function normExercise(e) {
  const t = e.target || {};
  const o = { id: e.id, target: t.text || '' };
  if (t.sets != null) o.sets = t.sets;
  if (t.loadKg != null) o.loadKg = t.loadKg;
  return o;
}

function normDay(s) {
  if (!s) return null;
  return {
    dayType: s.dayType, theme: s.theme, minutes: s.duration,
    coordDomain: s.coordDomain || null, skillLine: s.skillLine || null,
    blocks: s.blocks.map(b => ({ key: b.key, label: b.label, minutes: b.duration, exercises: (b.exercises || []).map(normExercise) })),
  };
}

// Stable, diff-friendly JSON: one exercise per line.
function stringifyGolden(obj) {
  return JSON.stringify(obj, null, 2)
    .replace(/\{\n\s+"id": ([^\n]*)((?:,\n\s+"[a-zA-Z]+": [^\n]*)*)\n\s+\}/g, (m, id, rest) =>
      '{ "id": ' + id + rest.replace(/,\n\s+/g, ', ') + ' }');
}

const exStr = e => `${e.id} [${e.target}${e.loadKg != null ? ' | ' + e.loadKg + 'kg' : ''}${e.sets != null ? ' | sets ' + e.sets : ''}]`;

// Concise per-date diff between two normalised days. Returns [] when equal.
function diffDay(want, got) {
  const out = [];
  if (!want || !got) { if (want !== got) out.push(want ? 'day no longer generates (null)' : 'day now generates (was null)'); return out; }
  for (const k of ['dayType', 'theme', 'minutes', 'coordDomain', 'skillLine']) {
    if (JSON.stringify(want[k]) !== JSON.stringify(got[k])) out.push(`${k}: ${JSON.stringify(want[k])} -> ${JSON.stringify(got[k])}`);
  }
  const wk = want.blocks.map(b => b.key), gk = got.blocks.map(b => b.key);
  wk.filter(k => !gk.includes(k)).forEach(k => out.push(`block removed: ${k}`));
  gk.filter(k => !wk.includes(k)).forEach(k => out.push(`block added: ${k}`));
  if (JSON.stringify(wk.filter(k => gk.includes(k))) !== JSON.stringify(gk.filter(k => wk.includes(k)))) out.push(`block order: ${wk.join(',')} -> ${gk.join(',')}`);
  for (const wb of want.blocks) {
    const gb = got.blocks.find(b => b.key === wb.key);
    if (!gb) continue;
    const p = `  ${wb.key}: `;
    if (wb.minutes !== gb.minutes) out.push(p + `minutes ${wb.minutes} -> ${gb.minutes}`);
    if (wb.label !== gb.label) out.push(p + `label "${wb.label}" -> "${gb.label}"`);
    const wi = wb.exercises.map(e => e.id), gi = gb.exercises.map(e => e.id);
    const rem = wb.exercises.filter(e => !gi.includes(e.id)), add = gb.exercises.filter(e => !wi.includes(e.id));
    if (rem.length) out.push(p + '- ' + rem.map(exStr).join(', '));
    if (add.length) out.push(p + '+ ' + add.map(exStr).join(', '));
    for (const we of wb.exercises) {
      const ge = gb.exercises.find(e => e.id === we.id);
      if (ge && JSON.stringify(we) !== JSON.stringify(ge)) out.push(p + `~ ${exStr(we)} -> ${exStr(ge)}`);
    }
    if (!rem.length && !add.length && JSON.stringify(wi) !== JSON.stringify(gi)) out.push(p + 'order changed');
  }
  return out;
}

module.exports = { freshContext, generateDay, planDayFor, normDay, normExercise, stringifyGolden, diffDay };
