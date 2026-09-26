'use strict';
// Apple Health export read in the browser (js/healthimport.js): a small
// hand-made export.xml, zipped in memory, through AppleHealth.fromFile —
// the same path Settings → Data → Import vitals takes with export.zip.
const test = require('node:test');
const assert = require('node:assert');
const zlib = require('zlib');
const { AppleHealth: A } = require('../js/healthimport.js');

const rec = (type, start, end, value, unit) =>
  `<Record type="${type}" sourceName="Watch" unit="${unit || ''}" creationDate="${end}" startDate="${start}" endDate="${end}" value="${value}">\n  <MetadataEntry key="x" value="y"/>\n</Record>`;
const Q = 'HKQuantityTypeIdentifier', S = 'HKCategoryTypeIdentifierSleepAnalysis', V = 'HKCategoryValueSleepAnalysis';
const XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE HealthData [ <!ATTLIST Record type CDATA #REQUIRED> ]>
<HealthData locale="en_PT">
${rec(Q + 'HeartRate', '2026-09-20 08:00:00 +0100', '2026-09-20 08:00:00 +0100', '120', 'count/min')}
${rec(Q + 'RestingHeartRate', '2026-09-20 00:01:00 +0100', '2026-09-20 23:59:00 +0100', '56', 'count/min')}
${rec(Q + 'HeartRateVariabilitySDNN', '2026-09-20 07:00:00 +0100', '2026-09-20 07:01:00 +0100', '70', 'ms')}
${rec(Q + 'HeartRateVariabilitySDNN', '2026-09-20 15:00:00 +0100', '2026-09-20 15:01:00 +0100', '81', 'ms')}
${rec(Q + 'VO2Max', '2026-09-20 19:00:00 +0100', '2026-09-20 19:00:00 +0100', '44.1', 'mL/min·kg')}
${rec(Q + 'BodyMass', '2026-09-20 08:00:00 +0100', '2026-09-20 08:00:00 +0100', '165', 'lb')}
${rec(S, '2026-09-20 23:30:00 +0100', '2026-09-21 02:00:00 +0100', V + 'AsleepCore')}
${rec(S, '2026-09-21 01:30:00 +0100', '2026-09-21 03:00:00 +0100', V + 'AsleepDeep')}
${rec(S, '2026-09-21 03:00:00 +0100', '2026-09-21 06:30:00 +0100', V + 'AsleepREM')}
${rec(S, '2026-09-21 06:30:00 +0100', '2026-09-21 07:00:00 +0100', V + 'Awake')}
${rec(S, '2026-09-21 14:00:00 +0100', '2026-09-21 14:20:00 +0100', V + 'AsleepCore')}
</HealthData>`;

// Minimal zip (one deflated entry + a decoy) built by hand.
function zip(files) {
  const locals = [], cds = []; let off = 0;
  files.forEach(([name, data]) => {
    const nm = Buffer.from(name), comp = zlib.deflateRawSync(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26);
    const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(comp.length, 20); cd.writeUInt32LE(data.length, 24); cd.writeUInt16LE(nm.length, 28); cd.writeUInt32LE(off, 42);
    locals.push(lh, nm, comp); cds.push(cd, nm); off += 30 + nm.length + comp.length;
  });
  const cdBuf = Buffer.concat(cds), eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12); eocd.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cdBuf, eocd]);
}

function check(days) {
  assert.deepStrictEqual(Object.keys(days), ['2026-09-20', '2026-09-21']);
  assert.deepStrictEqual(days['2026-09-20'], { rhr: 56, hrv: 75.5, hrvN: 2, vo2: 44.1, weight: 74.8 });
  // 23:30 → 06:30 merged = 420 min, filed on the wake date; the 20-min nap is its own, later segment and adds.
  assert.strictEqual(days['2026-09-21'].sleep, 440);
  assert.strictEqual(days['2026-09-21'].deep, 90);
  assert.strictEqual(days['2026-09-21'].rem, 210);
}

test('export.zip → vitals doc (skips other records, merges sleep overlaps, lb → kg)', async () => {
  const buf = zip([['apple_health_export/export_cda.xml', Buffer.from('<x/>')], ['apple_health_export/export.xml', Buffer.from(XML)]]);
  let last = 0;
  const doc = await A.fromFile(new File([buf], 'export.zip'), p => { last = p; });
  assert.strictEqual(doc.kind, 'movement-vitals');
  assert.deepStrictEqual(doc.range, ['2026-09-20', '2026-09-21']);
  assert.strictEqual(last, 1);
  check(doc.days);
});

test('tags split across chunk boundaries still parse', () => {
  for (const size of [1, 7, 64, 333]) {
    const acc = A.accumulator();
    for (let i = 0; i < XML.length; i += size) acc.push(XML.slice(i, i + size));
    acc.end();
    check(acc.days());
  }
});

test('a zip without export.xml says so', async () => {
  await assert.rejects(A.fromFile(new File([zip([['notes.txt', Buffer.from('hi')]])], 'x.zip')), /no export\.xml/);
  await assert.rejects(A.fromFile(new File([Buffer.from('not a zip at all')], 'x.zip')), /not a zip/);
});

test('rounding matches Python (half to even on the exact value)', () => {
  assert.deepStrictEqual([A._round(2.5, 0), A._round(3.5, 0), A._round(45.55, 1), A._round(0.125, 2)], [2, 4, 45.5, 0.12]);
});
