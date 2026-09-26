// ─────────────────────────────────────────────────────────────
// APPLE HEALTH — read export.zip (or export.xml) in the browser.
//
// Settings → Data → Import vitals takes the zip straight from the iPhone's
// "Export All Health Data" — no Python step. Same rules as
// tools/health_vitals.py, which stays as the command-line route:
//
//   rhr    Apple's daily resting HR, filed on the day the sample window ENDS
//   hrv    mean of that day's SDNN readings (ms); hrvN = how many readings
//   vo2    last estimate that day
//   sleep  minutes asleep (core+deep+REM+unspecified, overlaps merged), filed
//          on the WAKE date; deep/rem kept alongside; < 60 min is dropped
//   weight last body-mass reading that day, kg; fat = body-fat %
//
// The ~400 MB XML is never held in memory: the zip entry is streamed through
// DecompressionStream('deflate-raw') and scanned chunk by chunk for the
// opening <Record …> tags of the six types we keep. Everything else in the
// export is skipped. Needs Safari 16.4+ / Chrome 80+ / Firefox 113+.
// ─────────────────────────────────────────────────────────────
const AppleHealth = {
  TYPES: {
    HKQuantityTypeIdentifierRestingHeartRate: 'rhr',
    HKQuantityTypeIdentifierHeartRateVariabilitySDNN: 'hrv',
    HKQuantityTypeIdentifierVO2Max: 'vo2',
    HKQuantityTypeIdentifierBodyMass: 'weight',
    HKQuantityTypeIdentifierBodyFatPercentage: 'fat',
    HKCategoryTypeIdentifierSleepAnalysis: 'sleep',
  },

  // File/Blob → movement-vitals doc. onProgress(0..1) is optional.
  async fromFile(file, onProgress) {
    if (typeof DecompressionStream === 'undefined' && /\.zip$/i.test(file.name || '')) {
      throw new Error('this browser can\'t unzip — update it, or unzip and pick export.xml');
    }
    let raw, total;
    if (/\.xml$/i.test(file.name || '')) {
      raw = file.stream(); total = file.size;
    } else {
      const entry = await this._findExportXml(file);
      const data = file.slice(entry.dataStart, entry.dataStart + entry.csize);
      raw = data.stream(); total = entry.csize;
      if (entry.method === 8) raw = this._counted(raw, total, onProgress).pipeThrough(new DecompressionStream('deflate-raw'));
      else if (entry.method === 0) raw = this._counted(raw, total, onProgress);
      else throw new Error('export.xml uses an unsupported zip compression (' + entry.method + ')');
      onProgress = null;                          // already counted on the compressed side
    }
    if (onProgress) raw = this._counted(raw, total, onProgress);
    const text = raw.pipeThrough(new TextDecoderStream());
    const acc = this.accumulator();
    const reader = text.getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      acc.push(value);
    }
    acc.end();
    const days = acc.days();
    const keys = Object.keys(days);
    if (!keys.length) throw new Error('no resting HR, HRV, VO2 max, sleep or weight found in that export');
    return {
      kind: 'movement-vitals', version: 1, source: 'apple-health',
      generatedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
      range: [keys[0], keys[keys.length - 1]],
      days,
    };
  },

  _counted(stream, total, onProgress) {
    if (!onProgress) return stream;
    let seen = 0, last = -1;
    return stream.pipeThrough(new TransformStream({
      transform(chunk, ctl) {
        seen += chunk.byteLength;
        const pct = Math.floor(seen / total * 100);
        if (pct !== last) { last = pct; try { onProgress(Math.min(1, seen / total)); } catch (e) {} }
        ctl.enqueue(chunk);
      },
    }));
  },

  // ── zip: central directory → the export.xml entry ────────────
  async _bytes(file, start, end) {
    return new DataView(await file.slice(start, end).arrayBuffer());
  },

  async _findExportXml(file) {
    const size = file.size;
    const tailLen = Math.min(size, 65535 + 22 + 20);
    const tail = await this._bytes(file, size - tailLen, size);
    let eocd = -1;
    for (let i = tail.byteLength - 22; i >= 0; i--) {
      if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('not a zip file — pick the export.zip from Apple Health');
    let count = tail.getUint16(eocd + 10, true);
    let cdSize = tail.getUint32(eocd + 12, true);
    let cdOff = tail.getUint32(eocd + 16, true);
    if (count === 0xffff || cdSize === 0xffffffff || cdOff === 0xffffffff) {   // zip64
      const loc = eocd - 20;
      if (loc < 0 || tail.getUint32(loc, true) !== 0x07064b50) throw new Error('broken zip64 export');
      const z64 = Number(tail.getBigUint64(loc + 8, true));
      const rec = await this._bytes(file, z64, z64 + 56);
      if (rec.getUint32(0, true) !== 0x06064b50) throw new Error('broken zip64 export');
      count = Number(rec.getBigUint64(32, true));
      cdSize = Number(rec.getBigUint64(40, true));
      cdOff = Number(rec.getBigUint64(48, true));
    }
    const cd = await this._bytes(file, cdOff, cdOff + cdSize);
    const dec = new TextDecoder();
    let p = 0, hit = null;
    for (let n = 0; n < count && p + 46 <= cd.byteLength; n++) {
      if (cd.getUint32(p, true) !== 0x02014b50) break;
      const method = cd.getUint16(p + 10, true);
      let csize = cd.getUint32(p + 20, true), usize = cd.getUint32(p + 24, true);
      const nameLen = cd.getUint16(p + 28, true), extraLen = cd.getUint16(p + 30, true), commLen = cd.getUint16(p + 32, true);
      let off = cd.getUint32(p + 42, true);
      const name = dec.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen));
      if (name === 'export.xml' || /\/export\.xml$/.test(name)) {
        let e = p + 46 + nameLen; const eEnd = e + extraLen;
        while (e + 4 <= eEnd) {                    // zip64 extra: usize, csize, offset (only the maxed ones)
          const id = cd.getUint16(e, true), len = cd.getUint16(e + 2, true);
          if (id === 0x0001) {
            let q = e + 4;
            if (usize === 0xffffffff) { usize = Number(cd.getBigUint64(q, true)); q += 8; }
            if (csize === 0xffffffff) { csize = Number(cd.getBigUint64(q, true)); q += 8; }
            if (off === 0xffffffff) { off = Number(cd.getBigUint64(q, true)); q += 8; }
          }
          e += 4 + len;
        }
        hit = { name, method, csize, usize, off };
        break;
      }
      p += 46 + nameLen + extraLen + commLen;
    }
    if (!hit) throw new Error('no export.xml inside that zip — is it the Apple Health export?');
    const lh = await this._bytes(file, hit.off, hit.off + 30);
    if (lh.getUint32(0, true) !== 0x04034b50) throw new Error('broken zip entry for export.xml');
    hit.dataStart = hit.off + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    return hit;
  },

  // ── XML text → per-day values ─────────────────────────────────
  // Push text chunks in order; days() when done. Pure: tested in node.
  accumulator() {
    const self = this;
    const re = /<Record\s+type="(HKQuantityTypeIdentifier(?:RestingHeartRate|HeartRateVariabilitySDNN|VO2Max|BodyMass|BodyFatPercentage)|HKCategoryTypeIdentifierSleepAnalysis)"([^>]*)>/g;
    const rhr = {}, hrv = {}, vo2 = {}, weight = {}, fat = {}, sleep = {};
    let buf = '';
    const attrs = s => {
      const o = {}; const ar = /(\w+)="([^"]*)"/g; let m;
      while ((m = ar.exec(s))) o[m[1]] = m[2];
      return o;
    };
    const record = (type, a) => {
      const kind = self.TYPES[type];
      if (kind === 'rhr') {
        if (!a.endDate) return;
        (rhr[a.endDate.slice(0, 10)] = rhr[a.endDate.slice(0, 10)] || []).push(parseFloat(a.value));
      } else if (kind === 'hrv') {
        if (!a.startDate) return;
        (hrv[a.startDate.slice(0, 10)] = hrv[a.startDate.slice(0, 10)] || []).push(parseFloat(a.value));
      } else if (kind === 'vo2') {
        if (a.startDate) vo2[a.startDate.slice(0, 10)] = parseFloat(a.value);
      } else if (kind === 'weight') {
        if (!a.startDate) return;
        let v = parseFloat(a.value); const unit = (a.unit || 'kg').toLowerCase();
        if (unit === 'lb' || unit === 'lbs') v *= 0.45359237; else if (unit === 'g') v /= 1000;
        const k = a.startDate.slice(0, 10), t = self._ms(a.startDate);
        if (!weight[k] || t >= weight[k][0]) weight[k] = [t, v];
      } else if (kind === 'fat') {
        if (!a.startDate) return;
        const v = parseFloat(a.value), k = a.startDate.slice(0, 10), t = self._ms(a.startDate);
        if (!fat[k] || t >= fat[k][0]) fat[k] = [t, v <= 1 ? v * 100 : v];
      } else if (kind === 'sleep') {
        const stage = (a.value || '').replace('HKCategoryValueSleepAnalysis', '');
        if (!stage.startsWith('Asleep') || !a.startDate || !a.endDate) return;
        const wake = +a.endDate.slice(11, 13) < 18 ? a.endDate.slice(0, 10) : self._nextDay(a.endDate.slice(0, 10));
        (sleep[wake] = sleep[wake] || []).push([self._ms(a.startDate), self._ms(a.endDate), stage]);
      }
    };
    const scan = s => { re.lastIndex = 0; let m; while ((m = re.exec(s))) record(m[1], attrs(m[2])); };
    return {
      push(chunk) {
        buf += chunk;
        // Keep an unfinished tag (a '<' with no '>' after it) for the next chunk.
        const lt = buf.lastIndexOf('<');
        if (lt >= 0 && buf.indexOf('>', lt) === -1) { scan(buf.slice(0, lt)); buf = buf.slice(lt); }
        else { scan(buf); buf = ''; }
      },
      end() { if (buf) scan(buf); buf = ''; },
      days() {
        const days = {};
        const day = d => (days[d] = days[d] || {});
        const mean = v => v.reduce((a, b) => a + b, 0) / v.length;
        const R = self._round;
        Object.entries(rhr).forEach(([d, v]) => { day(d).rhr = R(mean(v), 0); });
        Object.entries(hrv).forEach(([d, v]) => { day(d).hrv = R(mean(v), 1); day(d).hrvN = v.length; });
        Object.entries(vo2).forEach(([d, v]) => { day(d).vo2 = R(v, 1); });
        Object.entries(weight).forEach(([d, [, v]]) => { day(d).weight = R(v, 1); });
        Object.entries(fat).forEach(([d, [, v]]) => { day(d).fat = R(v, 1); });
        Object.entries(sleep).forEach(([d, segs]) => {
          segs.sort((a, b) => a[0] - b[0] || a[1] - b[1] || (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0));
          let total = 0, cs = null, ce = null;
          segs.forEach(([s, e]) => {
            if (ce === null || s > ce) { if (ce !== null) total += ce - cs; cs = s; ce = e; }
            else ce = Math.max(ce, e);
          });
          if (ce !== null) total += ce - cs;
          const mins = R(total / 60000, 0);
          if (mins < 60) return;                   // a stray nap isn't a night
          const o = day(d);
          o.sleep = mins;
          o.deep = R(segs.filter(x => x[2] === 'AsleepDeep').reduce((a, x) => a + x[1] - x[0], 0) / 60000, 0);
          o.rem = R(segs.filter(x => x[2] === 'AsleepREM').reduce((a, x) => a + x[1] - x[0], 0) / 60000, 0);
        });
        const out = {};
        Object.keys(days).sort().forEach(k => { out[k] = days[k]; });
        return out;
      },
    };
  },

  // '2026-09-20 22:13:04 +0100' → epoch ms
  _ms(s) {
    return Date.parse(s.slice(0, 10) + 'T' + s.slice(11, 19) + s.slice(20, 23) + ':' + s.slice(23, 25));
  },
  _nextDay(ymd) {
    const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  },
  // Python's round(): half to even, so the app and the script agree.
  // Works on the double's exact decimal value (toFixed is exact), so 45.55
  // — really 45.5499… — goes to 45.5 as it does in Python.
  _round(x, dec) {
    const exact = x.toFixed(dec + 30), dot = exact.indexOf('.');
    const rest = exact.slice(dot + 1 + dec);
    if (/^50*$/.test(rest)) {                     // a true tie: to even
      const kept = Number(exact.slice(0, dot + 1 + dec).replace(/\.$/, ''));
      const last = Math.round(Math.abs(kept) * Math.pow(10, dec)) % 10;
      return last % 2 === 0 ? kept : Number((kept + Math.sign(x) * Math.pow(10, -dec)).toFixed(dec));
    }
    return Number(x.toFixed(dec));
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports.AppleHealth = AppleHealth;
