#!/usr/bin/env node
'use strict';
// M0vement regression suite runner. Node 22+, no dependencies, no build.
//
//   node tests/run.js                  # run every tests/*.test.js
//   node tests/run.js snapshot         # only files whose name contains "snapshot"
//   UPDATE_GOLDEN=1 node tests/run.js  # re-baseline tests/golden/days.json
//   VERBOSE=1 node tests/run.js        # also show KNOWN diagnostics and test stdout
//
// Also works with the stock runner: `node --test 'tests/*.test.js'` (todo tests never
// fail the run there either; this runner just groups the output).
//
// Exit code is 1 only for real failures. Reported separately, never failing:
//   * expected failures — tests marked { todo: 'known bug: …' } that still fail
//   * now passing       — todo tests that pass: the bug is fixed, drop the marker
//   * KNOWN invariants  — violations matched by KNOWN in invariants.test.js
process.env.TZ = 'Europe/Lisbon';

const { run } = require('node:test');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const filters = process.argv.slice(2);
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.test.js') && (!filters.length || filters.some(x => f.includes(x))))
  .sort().map(f => path.join(dir, f));
if (!files.length) { console.error('no test files match', filters); process.exit(2); }

const verbose = process.env.VERBOSE === '1';
const t0 = Date.now();
const pass = [], fail = [], xfail = [], xpass = [], known = [], knownFixed = [], knownSummary = [], notes = [];
const short = f => (f ? path.relative(path.dirname(dir), f) : '');
const errText = d => {
  const e = d.details && d.details.error;
  const c = (e && e.cause) || e;
  return String((c && (c.message || c)) || 'failed').trim();
};

const stream = run({ files, concurrency: true });
stream.on('test:pass', d => { if (d.skip) return; (d.todo !== undefined ? xpass : pass).push(d); });
stream.on('test:fail', d => {
  if (d.todo !== undefined) { xfail.push(d); return; }
  const ft = d.details && d.details.error && d.details.error.failureType;
  if (ft === 'subtestsFailed') return; // counted at the leaf
  fail.push(d);
});
stream.on('test:diagnostic', d => {
  const m = String(d.message);
  if (m.startsWith('KNOWN-FIXED')) knownFixed.push(m);
  else if (m.startsWith('KNOWN-SUMMARY')) knownSummary.push(m.replace(/^KNOWN-SUMMARY /, ''));
  else if (m.startsWith('KNOWN ')) known.push(m);
  else if (d.nesting > 0 || !/^(tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) /.test(m)) notes.push(m);
});
stream.on('test:stdout', d => { if (verbose) process.stdout.write(d.message); });
stream.on('test:stderr', d => { process.stderr.write(d.message); });

stream.resume(); // flowing mode, so 'end' fires
stream.on('end', () => {
  const ms = Date.now() - t0;
  const line = s => console.log(s);
  line(`\nM0vement tests — ${files.map(f => path.basename(f)).join(', ')}`);
  if (notes.length) { line('\nnotes'); notes.forEach(n => line('  ' + n)); }

  if (known.length || knownSummary.length) {
    line(`\nKNOWN invariant violations (accepted, not failing): ${known.length}`);
    knownSummary.forEach(s => line('  ' + s));
    if (verbose) known.forEach(k => line('    ' + k));
  }
  if (knownFixed.length) { line('\nKNOWN entries that no longer occur (remove them):'); knownFixed.forEach(k => line('  ' + k)); }

  if (xfail.length) {
    line(`\nexpected failures (known bugs): ${xfail.length}`);
    xfail.forEach(d => {
      line(`  ✗ ${d.name}\n      ${d.todo}`);
      line('      ' + errText(d).split('\n').filter(Boolean).slice(0, 6).join('\n      '));
    });
  }
  if (xpass.length) {
    line(`\nnow passing (was marked todo — bug fixed? remove the todo marker): ${xpass.length}`);
    xpass.forEach(d => line(`  ✓ ${d.name}  (${short(d.file)}:${d.line})`));
  }
  if (fail.length) {
    line(`\nFAILURES: ${fail.length}`);
    fail.forEach(d => {
      line(`  ✗ ${d.name}  (${short(d.file)}${d.line ? ':' + d.line : ''})`);
      line('      ' + errText(d).split('\n').join('\n      '));
    });
  }
  line(`\n${pass.length} passed · ${fail.length} failed · ${known.length} known violations · ${xfail.length} expected failures · ${xpass.length} now passing · ${ms} ms`);
  process.exitCode = fail.length ? 1 : 0;
});
