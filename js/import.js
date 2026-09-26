// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — IMPORT LAYER
// import.js — external workout log import (Hevy first; Ruttio/Apple next)
//
// Hevy has no public export beyond the per-workout share sheet, so the
// input here is the plain text you get from Hevy's "Share → Copy as text".
// The accompanying https://hevy.com/workout/<id> link is kept as metadata
// only: fetching it from the browser is blocked by CORS, so the text is
// the actual payload.
//
// Split of responsibilities, mirroring the AIGenerator/ChatOverride split
// already used elsewhere: this module PARSES and PROPOSES matches; it
// never silently writes a log. Every exercise the user hasn't confirmed
// before comes back with a confidence and candidate list for the UI to
// resolve, and confirmed answers are remembered in an alias table so the
// same Hevy name maps itself next time.
// ─────────────────────────────────────────────────────────────

const HevyImport = {

  ALIAS_KEY: 'hevy_aliases',   // DB key → synced to the generic `overrides` table

  _MONTHS: { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 },

  // Hevy appends the equipment in parentheses ("Squat (Barbell)"); the
  // library names don't carry it. Stripped before matching, kept on the
  // raw name so the UI can still show exactly what Hevy said.
  _EQUIP_SUFFIX: /\s*\((?:barbell|dumbbell|cable|machine|smith machine|kettlebell|band|resistance band|bodyweight|assisted|weighted|ez bar|plate loaded|suspension|trap bar|landmine)\)\s*$/i,

  // "Set 1:", "Warmup Set 2:", "Drop Set 3:", "Failure Set 1:"
  _SET_LINE: /^(?:(warm\s*-?up|drop|failure)\s+)?set\s+(\d+)\s*:\s*(.*)$/i,

  // Lines Hevy adds that aren't exercises or sets.
  _NOISE: /^(?:duration|volume|records?|prs?|notes?|@|https?:\/\/)/i,

  // ── PARSE ──────────────────────────────────────────────────
  // text → { title, date: 'YYYY-MM-DD', at: ISO, exercises: [{ name, rawName, sets: [...] }] }
  parse(text) {
    const lines = String(text || '').split(/\r?\n/).map(l => l.trim());
    const out = { title: '', date: null, at: null, link: null, exercises: [] };

    let i = 0;
    // Leading block: a link, a title, and a date line, in any order.
    for (; i < lines.length; i++) {
      const l = lines[i];
      if (!l) continue;
      const linkMatch = l.match(/https?:\/\/(?:www\.)?hevy\.com\/workout\/\S+/i);
      if (linkMatch) { out.link = linkMatch[0]; continue; }
      const d = this._parseDateLine(l);
      if (d) { out.at = d.toISOString(); out.date = this._localDateKey(d); i++; break; }
      if (!out.title && !this._NOISE.test(l) && !this._SET_LINE.test(l)) { out.title = l.replace(/^(?:link|text)\s*:\s*/i, ''); }
    }

    let current = null;
    for (; i < lines.length; i++) {
      const l = lines[i];
      if (!l) continue;
      if (this._NOISE.test(l)) continue;

      const m = l.match(this._SET_LINE);
      if (m) {
        if (!current) continue; // a set with no exercise heading — skip rather than invent one
        const set = this._parseSetBody(m[3]);
        set.idx = parseInt(m[2], 10) || current.sets.length + 1;
        set.kind = (m[1] || '').toLowerCase().replace(/\s|-/g, '') || 'normal';
        current.sets.push(set);
        continue;
      }

      // Anything else at this point is an exercise heading.
      const rawName = l;
      current = { rawName, name: rawName.replace(this._EQUIP_SUFFIX, '').trim(), sets: [] };
      out.exercises.push(current);
    }

    out.exercises = out.exercises.filter(e => e.sets.length > 0);
    return out;
  },

  // "Thursday, Sep 17, 2026 at 5:54pm" — weekday optional, time optional.
  _parseDateLine(line) {
    const m = line.match(/(?:^|,\s*)([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s*(\d{4})(?:\s+at\s+(\d{1,2}):(\d{2})\s*([ap]m)?)?/i);
    if (!m) return null;
    const mon = this._MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mon === undefined) return null;
    let hh = m[4] ? parseInt(m[4], 10) : 12;
    const mm = m[5] ? parseInt(m[5], 10) : 0;
    const ap = (m[6] || '').toLowerCase();
    if (ap === 'pm' && hh < 12) hh += 12;
    if (ap === 'am' && hh === 12) hh = 0;
    const d = new Date(parseInt(m[3], 10), mon, parseInt(m[2], 10), hh, mm);
    return isNaN(d.getTime()) ? null : d;
  },

  // Local calendar date, NOT toISOString().slice(0,10) — that shifts the
  // day backwards for anyone east of UTC on an evening workout, which is
  // exactly the case here (Europe/Lisbon, a 5:54pm session).
  _localDateKey(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },

  // "51.5 kg x 6 @ 6 rpe" | "6 reps" | "-20 kg x 5" | "0:45" | "5.2 km in 28:30"
  _parseSetBody(body) {
    const s = { weight: null, reps: null, duration: null, distanceKm: null, rpe: null, note: '' };
    const txt = String(body || '').trim();

    const rpe = txt.match(/@\s*([\d.]+)\s*rpe/i);
    if (rpe) s.rpe = parseFloat(rpe[1]);

    const wr = txt.match(/(-?[\d.]+)\s*(kg|lbs?)\s*(?:x|×)\s*(\d+)/i);
    if (wr) {
      const w = parseFloat(wr[1]);
      s.weight = /lb/i.test(wr[2]) ? Math.round(w * 0.45359237 * 100) / 100 : w;
      s.reps = parseInt(wr[3], 10);
      return s;
    }

    const bodyweightReps = txt.match(/^(\d+)\s*reps?\b/i);
    if (bodyweightReps) { s.reps = parseInt(bodyweightReps[1], 10); return s; }

    const dist = txt.match(/([\d.]+)\s*(km|mi)\b/i);
    if (dist) s.distanceKm = /mi/i.test(dist[2]) ? Math.round(parseFloat(dist[1]) * 1.609344 * 100) / 100 : parseFloat(dist[1]);

    const time = txt.match(/(?:^|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (time) {
      s.duration = time[3]
        ? (+time[1]) * 3600 + (+time[2]) * 60 + (+time[3])
        : (+time[1]) * 60 + (+time[2]);
    }

    const bareReps = txt.match(/(?:x|×)\s*(\d+)\s*$/);
    if (s.reps === null && bareReps) s.reps = parseInt(bareReps[1], 10);

    if (s.weight === null && s.reps === null && s.duration === null && s.distanceKm === null) s.note = txt;
    return s;
  },

  // ── NAME MATCHING ──────────────────────────────────────────
  normalizeName(n) {
    return String(n || '')
      .replace(this._EQUIP_SUFFIX, '')
      .toLowerCase()
      .replace(/[‐-―−]/g, '-')   // unicode dashes → hyphen
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  },

  _tokens(n) {
    const STOP = new Set(['the', 'a', 'of', 'and', 'with', 'to']);
    return new Set(
      this.normalizeName(n).split(' ')
        .filter(t => t && !STOP.has(t))
        .map(t => t.replace(/(ies)$/, 'y').replace(/([^s])s$/, '$1'))  // crude singularize
    );
  },

  _similarity(a, b) {
    const A = this._tokens(a), B = this._tokens(b);
    if (!A.size || !B.size) return 0;
    let inter = 0;
    A.forEach(t => { if (B.has(t)) inter++; });
    const jaccard = inter / (A.size + B.size - inter);
    const na = this.normalizeName(a), nb = this.normalizeName(b);
    const contains = (na.includes(nb) || nb.includes(na)) ? 0.15 : 0;
    return Math.min(1, jaccard + contains);
  },

  // Everything matchable: built-in library + the user's own custom
  // exercises, with library overrides applied so a renamed exercise
  // matches under its current name.
  _catalog() {
    const out = [];
    (typeof LIBRARY !== 'undefined' ? LIBRARY : []).forEach(ex => {
      const ov = (typeof Overrides !== 'undefined') ? Overrides.get(ex.id) : null;
      out.push({ id: ex.id, name: (ov && ov.name) || ex.name, logType: ex.logType });
    });
    if (typeof Custom !== 'undefined' && Custom.getAllExercises) {
      Custom.getAllExercises().forEach(ex => {
        if (!out.some(o => o.id === ex.id)) out.push({ id: ex.id, name: ex.name, logType: ex.logType });
      });
    }
    return out;
  },

  getAliases() { return (typeof DB !== 'undefined' && DB.get(this.ALIAS_KEY)) || {}; },

  setAlias(hevyName, exerciseId) {
    const map = this.getAliases();
    map[this.normalizeName(hevyName)] = exerciseId;
    if (typeof DB !== 'undefined') DB.set(this.ALIAS_KEY, map);
    return map;
  },

  // Returns { id, name, confidence, via } plus ranked alternatives.
  // `via`: 'alias' (user confirmed this before) | 'exact' | 'fuzzy' | null.
  // Nothing below FUZZY_FLOOR is offered as a match at all — an unmatched
  // exercise is a question for the user, never a silent guess.
  FUZZY_ACCEPT: 0.72,
  FUZZY_FLOOR:  0.34,

  matchExercise(name) {
    const catalog = this._catalog();
    const norm = this.normalizeName(name);

    const aliasId = this.getAliases()[norm];
    if (aliasId) {
      const hit = catalog.find(c => c.id === aliasId);
      if (hit) return { match: { id: hit.id, name: hit.name, confidence: 1, via: 'alias' }, candidates: [] };
    }

    const exact = catalog.find(c => this.normalizeName(c.name) === norm);
    if (exact) return { match: { id: exact.id, name: exact.name, confidence: 1, via: 'exact' }, candidates: [] };

    const ranked = catalog
      .map(c => ({ id: c.id, name: c.name, score: this._similarity(name, c.name) }))
      .filter(c => c.score >= this.FUZZY_FLOOR)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const top = ranked[0];
    if (top && top.score >= this.FUZZY_ACCEPT) {
      return { match: { id: top.id, name: top.name, confidence: top.score, via: 'fuzzy' }, candidates: ranked.slice(1) };
    }
    return { match: null, candidates: ranked };
  },

  // ── REVIEW OBJECT ──────────────────────────────────────────
  // Parse + match in one call. This is what the import screen renders:
  // every exercise with its proposed match, so nothing is written until
  // the user has seen the mapping.
  review(text) {
    const parsed = this.parse(text);
    const items = parsed.exercises.map(ex => {
      const { match, candidates } = this.matchExercise(ex.name);
      return { hevyName: ex.rawName, name: ex.name, sets: ex.sets, match, candidates };
    });
    return {
      title: parsed.title, date: parsed.date, at: parsed.at, link: parsed.link,
      items,
      matched:   items.filter(i => i.match).length,
      unmatched: items.filter(i => !i.match).length,
      needsReview: items.filter(i => i.match && i.match.via === 'fuzzy').length,
    };
  },

  // Hevy set → the app's own set shape (see LiveSession.logSet).
  _toAppSets(sets, at) {
    const loggedAt = at ? new Date(at).getTime() : Date.now();
    return sets.map((s, i) => ({
      idx: i + 1,
      weight: s.weight,
      reps: s.reps,
      duration: s.duration,
      note: [s.rpe ? `RPE ${s.rpe}` : '', s.kind && s.kind !== 'normal' ? s.kind : '', s.note].filter(Boolean).join(' · '),
      completed: true,
      loggedAt,
      source: 'hevy',
    }));
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { HevyImport };


// ─────────────────────────────────────────────────────────────
// RUTTIO / APPLE FITNESS IMPORT
//
// Ruttio exports the same Apple workout as GPX, TCX, FIT or JSON.
// What each one actually carries, measured against a real export
// (4.85km run, 2026-09-10):
//   JSON — richest: per-sample route (speed, altitude, position),
//          heartRateSamples, powerSamples, strideLengthSamples, plus
//          Apple's own totals. NO lap or interval structure at all.
//   TCX  — Garmin schema: <Lap> elements with totals + HR, and a
//          <Track> of trackpoints. The ONLY format with a lap container.
//   GPX/FIT — not used here; GPX is route-only, FIT needs a binary parser.
//
// So: JSON is the primary payload, TCX is imported alongside it purely
// for lap boundaries. When a run has one lap (a plain continuous run)
// the segmenter below infers structure from the data instead — clearly
// labelled as detected, never presented as if the watch reported it.
//
// TCX is parsed with regexes rather than DOMParser deliberately: the same
// code path then runs in the browser and in the Node test harness, so what
// ships is what was tested. Ruttio's TCX is machine-generated and regular.
// ─────────────────────────────────────────────────────────────

const RuttioImport = {

  // ── JSON (primary) ─────────────────────────────────────────
  parseJSON(text) {
    const d = typeof text === 'string' ? JSON.parse(text) : text;
    const t0 = Date.parse(d.startTime);
    const sec = ts => (Date.parse(ts) - t0) / 1000;

    return {
      format: 'json',
      sport: d.activityTypeName || 'Workout',
      startTime: d.startTime,
      endTime: d.endTime,
      date: this._localDateKey(new Date(t0)),
      durationSec: Math.round(d.durationSeconds || 0),
      distanceM: d.totalDistanceMeters || 0,
      calories: d.totalEnergyBurnedKilocalories || null,
      elevGainM: d.elevationGainMeters || null,
      avgHR: d.averageHeartRateBPM || null,
      maxHR: d.maxHeartRateBPM || null,
      avgPowerW: d.averagePowerWatts || null,
      // Apple's HR stream often starts late (the watch needs a lock) —
      // 0-bpm/absent samples at the head are dropped rather than averaged in.
      hr:    (d.heartRateSamples || []).filter(s => s.bpm > 0).map(s => ({ t: sec(s.timestamp), v: s.bpm })),
      speed: (d.route || []).map(p => ({ t: sec(p.timestamp), v: p.speedMetersPerSecond, alt: p.altitudeMeters })),
      laps: [],   // JSON carries none
    };
  },

  // ── TCX (lap structure only) ───────────────────────────────
  _tag(xml, name) {
    const m = xml.match(new RegExp('<' + name + '>([^<]*)</' + name + '>'));
    return m ? m[1] : null;
  },
  _num(xml, name) { const v = this._tag(xml, name); return v === null ? null : parseFloat(v); },

  parseTCX(text) {
    const s = String(text || '');
    const sport = (s.match(/<Activity\s+Sport="([^"]*)"/) || [])[1] || 'Workout';
    const id = this._tag(s, 'Id');
    const laps = [];
    const lapRe = /<Lap\s+StartTime="([^"]+)"\s*>([\s\S]*?)<\/Lap>/g;
    let m;
    while ((m = lapRe.exec(s)) !== null) {
      const body = m[2];
      const hrBlocks = body.match(/<(?:Average|Maximum)HeartRateBpm>\s*<Value>(\d+)<\/Value>/g) || [];
      const vals = hrBlocks.map(b => parseInt(b.match(/(\d+)/)[1], 10));
      laps.push({
        startTime: m[1],
        durationSec: this._num(body, 'TotalTimeSeconds'),
        distanceM: this._num(body, 'DistanceMeters'),
        calories: this._num(body, 'Calories'),
        maxSpeed: this._num(body, 'MaximumSpeed'),
        avgHR: vals[0] ?? null,
        maxHR: vals[1] ?? null,
        trigger: this._tag(body, 'TriggerMethod'),
      });
    }
    return { format: 'tcx', sport, startTime: id, laps };
  },

  // ── HEART-RATE ZONES ───────────────────────────────────────
  // Ceilings per zone; z5 is everything above z4. Read from the profile so
  // they can be edited in Settings, with these as the fallback.
  DEFAULT_ZONES: { z1: 133, z2: 148, z3: 155, z4: 185 },

  zones(profile) {
    return (profile && profile.settings && profile.settings.hrZones) || this.DEFAULT_ZONES;
  },

  zoneFor(bpm, z) {
    if (bpm == null) return null;
    if (bpm <= z.z1) return 1;
    if (bpm <= z.z2) return 2;
    if (bpm <= z.z3) return 3;
    if (bpm <= z.z4) return 4;
    return 5;
  },

  // Seconds spent in each zone, from the HR stream. Each sample covers the
  // gap to the next one rather than counting as a fixed tick — Apple's
  // sampling is irregular (303 samples over 31 min here, and none at all
  // for the first 5½ minutes while the watch got a lock), so even weighting
  // would quietly overstate whatever was sampled densest.
  zoneDistribution(activity, profile) {
    const z = this.zones(profile);
    const hr = activity.hr || [];
    if (!hr.length) return null;
    const secs = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (let i = 0; i < hr.length; i++) {
      const span = i < hr.length - 1
        ? Math.min(hr[i + 1].t - hr[i].t, 30)   // cap a gap so a dropout isn't credited to one zone
        : 5;
      const zone = this.zoneFor(hr[i].v, z);
      if (zone) secs[zone] += span;
    }
    const total = Object.values(secs).reduce((a, b) => a + b, 0) || 1;
    const out = {};
    [1, 2, 3, 4, 5].forEach(n => {
      out['z' + n] = { seconds: Math.round(secs[n]), pct: Math.round((secs[n] / total) * 1000) / 10 };
    });
    out.totalSeconds = Math.round(total);
    out.dominant = [1, 2, 3, 4, 5].reduce((a, b) => (secs[b] > secs[a] ? b : a), 1);
    return out;
  },

  // ── EFFORT SEGMENTATION ────────────────────────────────────
  // Only used when the watch reported a single lap. Bins the run, smooths,
  // and splits on sustained departures from the run's own median effort.
  //
  // Heart rate is the effort signal when present, pace only as a fallback:
  // on hilly ground pace is a poor proxy for effort (the fast parts are the
  // descents), which is exactly the shape of the sample run this was built
  // against. HR lags effort by roughly half a minute, so boundaries are
  // approximate and the result is always labelled `detected`.
  BIN_SEC: 15,
  MIN_SEGMENT_SEC: 45,
  WORK_BAND: 0.06,      // ±6% off median counts as steady

  detectSegments(activity) {
    const bins = this._bin(activity);
    if (bins.length < 8) return { kind: 'continuous', reason: 'too short to segment', segments: [] };

    const useHR = bins.filter(b => b.hr != null).length >= bins.length * 0.6;
    const sig = bins.map(b => (useHR ? b.hr : b.speed)).map(v => (v == null ? NaN : v));
    const smooth = this._movingMedian(sig, 3);
    const med = this._median(smooth.filter(v => !isNaN(v)));
    if (!med) return { kind: 'continuous', reason: 'no usable signal', segments: [] };

    const label = v => isNaN(v) ? 'steady'
      : v > med * (1 + this.WORK_BAND) ? 'work'
      : v < med * (1 - this.WORK_BAND) ? 'recovery' : 'steady';

    let segs = [];
    smooth.forEach((v, i) => {
      const l = label(v);
      const last = segs[segs.length - 1];
      if (last && last.label === l) { last.endBin = i; } else { segs.push({ label: l, startBin: i, endBin: i }); }
    });

    // Absorb anything too short to be a real interval into its neighbour.
    segs = this._absorbShort(segs, Math.round(this.MIN_SEGMENT_SEC / this.BIN_SEC));

    const out = segs.map(s => {
      const slice = bins.slice(s.startBin, s.endBin + 1);
      const hrs = slice.map(b => b.hr).filter(v => v != null);
      const sps = slice.map(b => b.speed).filter(v => v != null);
      const durSec = slice.length * this.BIN_SEC;
      const avgSp = sps.length ? sps.reduce((a, b) => a + b, 0) / sps.length : null;
      return {
        label: s.label,
        startSec: s.startBin * this.BIN_SEC,
        durationSec: durSec,
        avgHR: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null,
        avgSpeed: avgSp,
        paceMinPerKm: avgSp > 0.2 ? (1000 / avgSp) / 60 : null,
        distanceM: avgSp ? Math.round(avgSp * durSec) : null,
      };
    });

    // A stretch sitting between two work intervals is a recovery, even when
    // its heart rate never dropped far enough below the run's own median to
    // be labelled one on its own — on a hard interval session the median is
    // dragged up by the work, so the easy sections read as "steady".
    const workIdx = out.map((s, i) => (s.label === 'work' ? i : -1)).filter(i => i >= 0);
    if (workIdx.length >= 2) {
      for (let i = workIdx[0]; i < workIdx[workIdx.length - 1]; i++) {
        if (out[i].label === 'steady') out[i].label = 'recovery';
      }
    }

    const workSegs = out.filter(s => s.label === 'work');
    return {
      kind: workSegs.length >= 2 ? 'intervals' : 'continuous',
      signal: useHR ? 'heart rate' : 'pace',
      detected: true,
      workCount: workSegs.length,
      segments: out,
    };
  },

  _bin(activity) {
    const B = this.BIN_SEC, bins = [];
    const put = (t, key, v) => {
      const k = Math.floor(t / B);
      if (k < 0) return;
      bins[k] = bins[k] || { speed: null, hr: null, alt: null, _s: [], _h: [], _a: [] };
      bins[k][key].push(v);
    };
    (activity.speed || []).forEach(p => { put(p.t, '_s', p.v); if (p.alt != null) put(p.t, '_a', p.alt); });
    (activity.hr || []).forEach(p => put(p.t, '_h', p.v));
    const avg = a => a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    for (let i = 0; i < bins.length; i++) {
      if (!bins[i]) { bins[i] = { speed: null, hr: null, alt: null }; continue; }
      bins[i] = { speed: avg(bins[i]._s), hr: avg(bins[i]._h), alt: avg(bins[i]._a) };
    }
    return bins;
  },

  _median(a) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; },

  _movingMedian(arr, half) {
    return arr.map((_, i) => {
      const w = arr.slice(Math.max(0, i - half), i + half + 1).filter(v => !isNaN(v) && v != null);
      return w.length ? this._median(w) : NaN;
    });
  },

  _absorbShort(segs, minBins) {
    let changed = true;
    while (changed && segs.length > 1) {
      changed = false;
      for (let i = 0; i < segs.length; i++) {
        const len = segs[i].endBin - segs[i].startBin + 1;
        if (len >= minBins) continue;
        const prev = segs[i - 1], next = segs[i + 1];
        const into = prev || next;
        if (!into) break;
        if (prev) prev.endBin = segs[i].endBin; else next.startBin = segs[i].startBin;
        segs.splice(i, 1);
        changed = true;
        break;
      }
    }
    // Merge any neighbours that ended up with the same label.
    const merged = [];
    segs.forEach(s => {
      const last = merged[merged.length - 1];
      if (last && last.label === s.label) last.endBin = s.endBin; else merged.push({ ...s });
    });
    return merged;
  },

  // ── REVIEW ─────────────────────────────────────────────────
  // Combines the two files. Raw streams are NEVER stored — a single run is
  // ~815KB of JSON, and the app keeps sessions as jsonb in Supabase. What
  // gets persisted is this summary plus a 30s-binned series for the chart,
  // a few KB rather than a megabyte.
  review({ json, tcx, profile }) {
    const a = this.parseJSON(json);
    let lapSource = 'none';
    if (tcx) {
      const t = this.parseTCX(tcx);
      if (t.laps.length > 1) { a.laps = t.laps; lapSource = 'watch'; }
      else if (t.laps.length === 1) { lapSource = 'single-lap'; }
    }

    const structure = a.laps.length > 1
      ? { kind: 'intervals', signal: 'watch laps', detected: false, workCount: a.laps.length,
          segments: a.laps.map((l, i) => ({
            label: i % 2 === 0 ? 'work' : 'recovery', startSec: null,
            durationSec: l.durationSec, avgHR: l.avgHR, distanceM: l.distanceM,
            paceMinPerKm: l.distanceM > 0 ? (l.durationSec / 60) / (l.distanceM / 1000) : null,
          })) }
      : this.detectSegments(a);

    return {
      sport: a.sport, date: a.date, startTime: a.startTime,
      durationSec: a.durationSec, distanceKm: Math.round(a.distanceM / 10) / 100,  // metres → km, 2dp
      avgHR: a.avgHR ? Math.round(a.avgHR) : null, maxHR: a.maxHR,
      elevGainM: a.elevGainM ? Math.round(a.elevGainM) : null,
      calories: a.calories ? Math.round(a.calories) : null,
      paceMinPerKm: a.distanceM > 0 ? (a.durationSec / 60) / (a.distanceM / 1000) : null,
      lapSource, structure,
      avgZone: this.zoneFor(a.avgHR ? Math.round(a.avgHR) : null, this.zones(profile)),
      zones: this.zoneDistribution(a, profile),
      series: this._series(a, 30),
    };
  },

  _series(activity, binSec) {
    const saved = this.BIN_SEC;
    this.BIN_SEC = binSec;
    const bins = this._bin(activity);
    this.BIN_SEC = saved;
    return bins.map((b, i) => ({
      t: i * binSec,
      hr: b.hr ? Math.round(b.hr) : null,
      sp: b.speed ? Math.round(b.speed * 100) / 100 : null,
      alt: b.alt ? Math.round(b.alt * 10) / 10 : null,
    }));
  },

  _localDateKey(d) { return HevyImport._localDateKey(d); },
};

if (typeof module !== 'undefined' && module.exports) module.exports.RuttioImport = RuttioImport;


// ─────────────────────────────────────────────────────────────
// MERGE — external logs into a Movement session
//
// Movement is the source of truth. A Movement day is a superset of what
// any watch app recorded: Monday might be 20min stretching + 10min balance
// + 50min strength, of which Hevy only ever saw the strength. So the merge
// is scoped, never wholesale.
//
// The skip rule follows from that: for each block that received at least
// one imported exercise, anything still unlogged in THAT block is marked
// skipped — you were demonstrably in that block and didn't do it. Blocks
// the import never touched are left completely alone, because the external
// app was never going to know about them. Marking the stretching block
// skipped just because Hevy doesn't do stretching would be nonsense.
// ─────────────────────────────────────────────────────────────

const Importer = {

  EXTRA_BLOCK_KEY: 'imported',

  _findExercise(session, exerciseId) {
    for (let b = 0; b < session.blocks.length; b++) {
      const exs = session.blocks[b].exercises || [];
      for (let e = 0; e < exs.length; e++) {
        if (exs[e].id === exerciseId) return { blockIdx: b, exIdx: e, ex: exs[e] };
      }
    }
    return null;
  },

  _ensureExtraBlock(session) {
    let blk = session.blocks.find(b => b.key === this.EXTRA_BLOCK_KEY);
    if (!blk) {
      blk = {
        key: this.EXTRA_BLOCK_KEY, label: 'Imported — not in plan',
        icon: 'download', color: '#5F5E5A', bg: '#F1EFE8',
        duration: 0, note: 'Logged in an external app, no counterpart in today’s plan.',
        exercises: [],
      };
      session.blocks.push(blk);
    }
    return blk;
  },

  // resolutions: [{ hevyName, exerciseId, sets }] — already confirmed by the
  // user on the review screen. An entry with exerciseId null is skipped
  // outright; nothing here guesses.
  applyHevy(session, resolutions, at, profile) {
    const report = { logged: [], added: [], skipped: [], ignored: [] };
    const touchedBlocks = new Set();

    resolutions.forEach(r => {
      if (!r.exerciseId) { report.ignored.push(r.hevyName); return; }
      const sets = HevyImport._toAppSets(r.sets || [], at);
      const found = this._findExercise(session, r.exerciseId);

      if (found) {
        found.ex.sets = (found.ex.sets || []).concat(sets);
        found.ex.completed = true;
        found.ex.skipped = false;
        found.ex.importedFrom = 'hevy';
        touchedBlocks.add(found.blockIdx);
        report.logged.push({ id: r.exerciseId, name: found.ex.name, sets: sets.length });
      } else {
        const blk = this._ensureExtraBlock(session);
        const built = (typeof Generator !== 'undefined')
          ? Generator.buildExerciseInstance(
              (typeof LIBRARY !== 'undefined' ? LIBRARY.find(e => e.id === r.exerciseId) : null)
              || { id: r.exerciseId, name: r.hevyName, logType: 'weight+reps' },
              profile || (typeof Profile !== 'undefined' ? Profile.load() : null))
          : { id: r.exerciseId, name: r.hevyName, logType: 'weight+reps', sets: [] };
        built.sets = sets;
        built.completed = true;
        built.skipped = false;
        built.importedFrom = 'hevy';
        blk.exercises.push(built);
        report.added.push({ id: r.exerciseId, name: built.name, sets: sets.length });
      }
    });

    // Scoped skip — only blocks the import actually reached.
    touchedBlocks.forEach(b => {
      (session.blocks[b].exercises || []).forEach(ex => {
        const logged = (ex.sets && ex.sets.length) || ex.completed || ex.skipped;
        if (!logged && ex.logType !== 'none') {
          ex.skipped = true;
          ex.skipReason = 'not in imported log';
          report.skipped.push({ block: session.blocks[b].label, name: ex.name });
        }
      });
    });

    session.importSources = [...new Set([...(session.importSources || []), 'hevy'])];
    return { session, report };
  },

  // A run attaches to the session's cardio exercise when the plan has one,
  // otherwise it lands in the extra block. The summary rides along on the
  // existing cardioLog shape (see LiveSession.logCardio) with the zone and
  // interval detail added — raw streams are never stored.
  applyRun(session, run, profile) {
    const report = { attachedTo: null, verdict: null };
    // Target only a genuine cardio block. logType alone is not enough:
    // "Walking / hiking" is a mobility-movement exercise that happens to log
    // as cardio, and it sits in Monday's warm-up — matching on logType alone
    // filed a 31-minute 4.85km run as the warm-up's walk.
    let target = null;
    for (const b of session.blocks) {
      const isCardioBlock = b.key === 'cardio' || /^main-focus:cardio$/.test(b.key || '');
      if (!isCardioBlock) continue;
      const hit = (b.exercises || []).find(e => e.logType === 'cardio');
      if (hit) { target = hit; break; }
    }
    if (!target) {
      const blk = this._ensureExtraBlock(session);
      target = { id: 'imported-run', name: run.sport || 'Run', logType: 'cardio', notes: '', sets: [], completed: false, skipped: false, link: null };
      blk.exercises.push(target);
    }

    target.cardioLog = {
      duration: run.durationSec,
      distanceKm: run.distanceKm,
      appleFitnessLink: '',
      note: '',
      source: 'ruttio',
      avgHR: run.avgHR, maxHR: run.maxHR, avgZone: run.avgZone,
      elevGainM: run.elevGainM, calories: run.calories,
      paceMinPerKm: run.paceMinPerKm,
      zones: run.zones,
      structure: run.structure,
      lapSource: run.lapSource,
      series: run.series,
    };
    target.completed = true;
    target.skipped = false;
    target.importedFrom = 'ruttio';
    report.attachedTo = target.name;

    // Did the run match what the day asked for? The app knows the
    // prescription, so it can say — this is the whole reason a Zone2 label
    // is worth carrying on a weekday slot.
    const wantZone = this._plannedZone(session);
    if (wantZone && run.zones) {
      const inZone = run.zones['z' + wantZone];
      report.verdict = {
        plannedZone: wantZone,
        pctInZone: inZone ? inZone.pct : 0,
        dominantZone: run.zones.dominant,
        met: inZone ? inZone.pct >= 60 : false,
      };
    }
    session.importSources = [...new Set([...(session.importSources || []), 'ruttio'])];
    return { session, report };
  },

  _plannedZone(session) {
    // dayType first: a plan day that borrowed another day type (a test on a
    // Wednesday) is judged against what it actually was.
    const slotKey = session.themeOverride || session.dayType || session.weekday;
    const slot = (typeof WEEK_SCAFFOLD !== 'undefined' && slotKey) ? WEEK_SCAFFOLD[slotKey] : null;
    if (!slot || !slot.mainFocus) return null;
    if (slot.mainFocus.cardioMode === 'steady') return 2;
    return null;   // intervals have no single target zone — judged per segment
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports.Importer = Importer;
