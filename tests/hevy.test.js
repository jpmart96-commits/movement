'use strict';
// Hevy "Copy as text" import: parser fixes (review 2.8) and merging into a
// session that was logged after the fact.
const test = require('node:test');
const assert = require('node:assert');
const { freshContext, generateDay } = require('./helpers');

const app = freshContext({ quiet: true, now: new Date('2026-09-25T12:00:00') });
const H = app.HevyImport, I = app.Importer, P = () => app.Profile.load();

const TEXT = `Strength B
Friday, Sep 25, 2026 at 9:05am

Deadlift (Barbell)
Warmup Set 1: 60 kg x 5
Set 1: 85 kg x 5 @ 8 rpe
Set 2: 85 kg x 5 @ 8,5 rpe
Set 3: 85 kg x 5 @ 9 rpe

Overhead Press (Barbell)
Set 1: 32,5 kg x 5
Set 2: 32,5 kg x 5
Set 3: 32,5 kg x 4

Preacher Curl (Dumbbell)
Set 1: 12 kg x 10

https://hevy.com/workout/abc123`;

test('parser: "Pr…" exercises are not noise, decimal commas, RPE on the set', () => {
  const p = H.parse(TEXT);
  assert.deepEqual(p.exercises.map(e => e.name), ['Deadlift', 'Overhead Press', 'Preacher Curl']);
  assert.equal(p.exercises[1].sets[0].weight, 32.5);
  assert.equal(p.exercises[0].sets[2].rpe, 8.5);
  assert.equal(p.date, '2026-09-25');
  assert.equal(p.link, 'https://hevy.com/workout/abc123');
});

test('parser: Portuguese day-first date lines', () => {
  const p = H.parse('Treino\nsexta, 25 de set. de 2026 às 09:05\n\nAgachamento (Barra)\nSet 1: 60 kg x 5');
  assert.equal(p.date, '2026-09-25');
  assert.equal(new Date(p.at).getHours(), 9);
  assert.equal(p.exercises.length, 1);
  assert.equal(H.parse('Treino\n17 set 2026, 17:54\n\nSquat\nSet 1: 60 kg x 5').date, '2026-09-17');
});

function friday() {
  // A Strength B day, logged after with "Already done — log it".
  const s = generateDay(app, '2026-10-02');
  const L = app.LiveSession;
  L.start(s, null);
  s.blocks.forEach((b, i) => L.markBlockDone(i));
  return L.getSession();
}

test('Hevy sets replace the auto-ticked prescription; the rest of the block becomes skipped', () => {
  const s = friday();
  const r = H.review(TEXT.replace('Sep 25', 'Oct 2'));
  const res = r.items.map(it => ({ hevyName: it.hevyName, exerciseId: it.match ? it.match.id : null, sets: it.sets }));
  const key = I.hevyKey({ link: r.link, date: r.date }, TEXT);
  const { report } = I.applyHevy(s, res, r.at, P(), key);
  const mf = s.blocks.find(b => b.mainFocus);
  const dl = mf.exercises.find(e => e.id === 'deadlift');
  assert.deepEqual(dl.sets.map(x => x.weight), [60, 85, 85, 85]);   // no "as prescribed" sets left
  assert.equal(dl.sets[3].rpe, 9);
  const row = mf.exercises.find(e => e.id === 'cable-row');
  assert.ok(row.skipped, 'row not in Hevy → skipped in that block');
  assert.ok(!s.blocks[0].exercises.some(e => e.skipped), 'blocks Hevy never touched are left alone');
  // same text again: nothing doubles
  const again = I.applyHevy(s, res, r.at, P(), key);
  assert.equal(again.report.duplicate, true);
  assert.equal(dl.sets.length, 4);
  assert.ok(report.logged.length >= 2);
});
