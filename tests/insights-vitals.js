// Runs Insights.readiness over every day of the real vitals.json and prints
// the level distribution + the days flagged low. `node tests-insights/run-vitals.js [path]`
const path = require('path');
const { Insights } = require(path.join(__dirname, '..', 'js', 'insights.js'));
const doc = require(process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'vitals.json'));
const [from, to] = doc.range;
const counts = {}, low = [], ok = {};
let n = 0;
for (let d = from; d <= to; d = Insights._addDays(d, 1)) {
  const r = Insights.readiness(doc, d);
  counts[r.level] = (counts[r.level] || 0) + 1; n++;
  if (r.level === 'low') low.push(`${d}  [${r.flags.join(',')}]  ${r.reasons.join(' · ')}`);
  if (r.level === 'ok') r.flags.forEach(f => { ok[f] = (ok[f] || 0) + 1; });
}
console.log(`${n} days ${from}..${to}`);
Object.entries(counts).forEach(([k, v]) => console.log(`  ${k.padEnd(8)} ${String(v).padStart(3)}  ${(100 * v / n).toFixed(1)}%`));
console.log('  ok-day single flags:', JSON.stringify(ok));
console.log('LOW days:'); low.forEach(l => console.log('  ' + l));
