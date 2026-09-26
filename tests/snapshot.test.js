'use strict';
// Golden snapshot of Generator.generateFromScaffold for every date from
// 26 Sep to 31 Dec 2026 with an empty history. The plan's day-level
// prescription ends 27 Dec; the last days exercise the carry-forward.
//
//   UPDATE_GOLDEN=1 node tests/run.js      # re-baseline after an intended change
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { dateRange } = require('./load');
const { freshContext, generateDay, normDay, stringifyGolden, diffDay } = require('./helpers');

const FROM = '2026-09-26', TO = '2026-12-31';
const GOLDEN = path.join(__dirname, 'golden', 'days.json');
const MAX_DATES_SHOWN = 15;

function generateAll() {
  const app = freshContext({ quiet: true });
  const days = {};
  for (const d of dateRange(FROM, TO)) days[d] = normDay(generateDay(app, d));
  return days;
}

test(`snapshot: generateFromScaffold ${FROM}..${TO} matches tests/golden/days.json`, t => {
  const got = generateAll();
  if (process.env.UPDATE_GOLDEN === '1') {
    fs.mkdirSync(path.dirname(GOLDEN), { recursive: true });
    fs.writeFileSync(GOLDEN, stringifyGolden({ from: FROM, to: TO, days: got }) + '\n');
    t.diagnostic(`golden rewritten: ${Object.keys(got).length} days -> tests/golden/days.json`);
    return;
  }
  assert.ok(fs.existsSync(GOLDEN), 'tests/golden/days.json missing: run with UPDATE_GOLDEN=1 to create it');
  const want = JSON.parse(fs.readFileSync(GOLDEN, 'utf8')).days;
  const dates = [...new Set([...Object.keys(want), ...Object.keys(got)])].sort();
  const report = [];
  let changed = 0;
  for (const d of dates) {
    const lines = !(d in want) ? ['date not in golden'] : !(d in got) ? ['date no longer generated'] : diffDay(want[d], got[d]);
    if (!lines.length) continue;
    changed++;
    if (changed <= MAX_DATES_SHOWN) report.push(`${d}:\n    ` + lines.slice(0, 12).join('\n    ') + (lines.length > 12 ? `\n    … ${lines.length - 12} more` : ''));
  }
  if (changed) {
    assert.fail(`${changed} of ${dates.length} days differ from golden` +
      (changed > MAX_DATES_SHOWN ? ` (first ${MAX_DATES_SHOWN} shown)` : '') + ':\n' + report.join('\n') +
      '\nIf intended: UPDATE_GOLDEN=1 node tests/run.js');
  }
});

// Guards the snapshot itself: generation must not depend on hidden state
// (call order, a previous day in the same context, Math.random, the clock).
test('determinism: same day, fresh context vs reused context vs other seed/clock', () => {
  const shared = freshContext({ quiet: true });
  for (const d of ['2026-09-28', '2026-10-03', '2026-10-25', '2026-11-04', '2026-11-29']) {
    const a = JSON.stringify(normDay(generateDay(shared, d)));
    const again = JSON.stringify(normDay(generateDay(shared, d)));
    const other = freshContext({ quiet: true, seed: 12345, now: '2026-12-31T23:00:00' });
    other.setNow(d + 'T20:30:00');
    const b = JSON.stringify(normDay(other.Generator.generateFromScaffold({ date: other.date(d), profile: other.Profile.load(), sleep: 0, energy: 0, pain: '', focus: '' })));
    assert.equal(again, a, `${d}: second generation in the same context differs`);
    assert.equal(b, a, `${d}: generation depends on clock time or random seed`);
  }
});
