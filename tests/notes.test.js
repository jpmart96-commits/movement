'use strict';
// Notes tab (js/notes.js): memos for the next plan rewrite, stamped with the
// day they are about, synced as a per-note list (pb_plan_notes → plan_notes).
const test = require('node:test');
const assert = require('node:assert');
const { freshContext } = require('./load');

function ctx(now = '2026-09-30T20:00:00') {
  const app = freshContext({ quiet: true, now });
  if (app.MonthPlan.ensureSeeded) app.MonthPlan.ensureSeeded();
  return app;
}

test('add stamps the day it is about from the month plan', () => {
  const app = ctx();
  const n = app.Notes.add({ text: '  Broad jumps felt flat after Tuesday\'s ride  ', kind: 'body', date: '2026-09-30' });
  const pd = app.MonthPlan.dayFor('2026-09-30');
  assert.equal(n.text, "Broad jumps felt flat after Tuesday's ride");
  assert.equal(n.status, 'open');
  assert.equal(n.date, '2026-09-30');
  assert.equal(n.context.theme, pd.theme);
  assert.equal(n.context.week, pd.week);
  assert.ok(n.createdAt && n.updatedAt);
  assert.deepEqual(app.DB.get('plan_notes').map(x => x.id), [n.id]);
});

test('empty text is refused; unknown kind falls back to plan; bad date to today', () => {
  const app = ctx();
  assert.equal(app.Notes.add({ text: '   ' }), null);
  const n = app.Notes.add({ text: 'x', kind: 'nonsense', date: 'yesterday' });
  assert.equal(n.kind, 'plan');
  assert.equal(n.date, '2026-09-30');
});

test('exercise context is kept, and survives a date change', () => {
  const app = ctx();
  const n = app.Notes.add({ text: 'Pins too high', kind: 'exercise', date: '2026-09-29',
    context: { exerciseId: 'iso-squat-pins', exerciseName: 'Overcoming iso squat', blockLabel: 'Main Focus' } });
  assert.equal(n.context.exerciseId, 'iso-squat-pins');
  const u = app.Notes.update(n.id, { date: '2026-10-05' });
  assert.equal(u.context.exerciseName, 'Overcoming iso squat');
  assert.equal(u.context.theme, app.MonthPlan.dayFor('2026-10-05').theme);
  assert.match(app.Notes.contextLine(u), /Overcoming iso squat/);
});

test('status: applied with a resolution, reopen clears it; filters and counts', () => {
  const app = ctx();
  const a = app.Notes.add({ text: 'a', kind: 'body' });
  app.setNow('2026-09-30T20:01:00');
  const b = app.Notes.add({ text: 'b', kind: 'idea' });
  app.Notes.setStatus(a.id, 'applied', 'Wed plyo moved after the rest day');
  let x = app.Notes.get(a.id);
  assert.equal(x.status, 'applied');
  assert.equal(x.resolution, 'Wed plyo moved after the rest day');
  assert.ok(x.resolvedAt);
  assert.deepEqual(app.Notes.counts(), { open: 1, applied: 1, dropped: 0, all: 2 });
  assert.deepEqual(app.Notes.list({ status: 'open' }).map(n => n.id), [b.id]);
  assert.deepEqual(app.Notes.list({ status: 'all', kind: 'idea' }).map(n => n.id), [b.id]);
  app.Notes.setStatus(a.id, 'open');
  x = app.Notes.get(a.id);
  assert.equal(x.resolution, undefined);
  assert.equal(x.resolvedAt, undefined);
  assert.ok(x.updatedAt > a.updatedAt);
});

test('newest day first, newest written first within a day', () => {
  const app = ctx();
  const old = app.Notes.add({ text: 'old day', date: '2026-09-27' });
  const first = app.Notes.add({ text: 'first', date: '2026-09-30' });
  app.setNow('2026-09-30T21:00:00');
  const second = app.Notes.add({ text: 'second', date: '2026-09-30' });
  assert.deepEqual(app.Notes.all().map(n => n.id), [second.id, first.id, old.id]);
});

test('remove deletes and is tombstoned for sync', () => {
  const app = ctx();
  const n = app.Notes.add({ text: 'gone soon' });
  assert.equal(app.Notes.remove(n.id), true);
  assert.equal(app.Notes.remove(n.id), false);
  assert.equal(app.Notes.all().length, 0);
  const tomb = JSON.parse(app.storage.api.getItem('sb_tombstones'));
  assert.ok(tomb.plan_notes[n.id] > 0);
});

test('writes go to the outbox as the plan_notes list', () => {
  const app = ctx();
  app.Notes.add({ text: 'queued' });
  const ob = JSON.parse(app.storage.api.getItem('sb_outbox'));
  assert.ok(ob.items.pb_plan_notes);
  assert.equal(app.run("_route('pb_plan_notes')"), 'plan_notes');
  assert.equal(app.run("_LISTS.pb_plan_notes.idCol"), 'note_id');
});

test('export: open notes grouped by kind, oldest first, with ids', () => {
  const app = ctx();
  const a = app.Notes.add({ text: 'Knees ok\non stairs', kind: 'body', date: '2026-09-28' });
  const b = app.Notes.add({ text: 'Add a second 4x4', kind: 'plan', date: '2026-09-29' });
  const c = app.Notes.add({ text: 'Later body note', kind: 'body', date: '2026-09-30' });
  app.Notes.setStatus(b.id, 'dropped');
  const md = app.Notes.exportMarkdown();
  assert.match(md, /plan notes \(open, 2\)/);
  assert.ok(md.indexOf(a.id) < md.indexOf(c.id));
  assert.ok(!md.includes(b.id));
  assert.match(md, /## Body/);
  assert.ok(!md.includes('## Plan'));
  assert.match(md, /Knees ok \/ on stairs/);
  const all = app.Notes.exportMarkdown({ status: 'all' });
  assert.match(all, /\[dropped\]/);
});
