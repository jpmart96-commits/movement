// ────────────────────────────────────────────────────────────
// PRACTICE BRAIN — DATA LAYER
// monthplan.js — the block skeleton the app fills in day by day.
//
// A block is four weeks and starts when you start, not on the 1st. This
// layer decides WHAT each day is for — theme, coordination domain, load,
// and the note that matters that day. It never picks exercises: the
// Generator resolves the skeleton against the real library, same split
// the chat override already uses (propose structure, resolve deterministically).
//
// Seed only. Once the app has written it to Supabase (month_plans), the
// stored copy wins and this file is just the fallback for a fresh device.
// ────────────────────────────────────────────────────────────

const MONTH_PLAN_SEED = {
  "title": "Block 1 — Aerobic base + strength",
  "blockStart": "2026-09-21",
  "blockEnd": "2026-10-18",
  "spine": [
    "aerobic base",
    "strength"
  ],
  "support": [
    "mobility & flexibility",
    "coordination / vision / balance",
    "power",
    "yoga"
  ],
  "horizon": "12 months: 10km in 60min held in zone 2; handstand; pancake; muscle-up; 2-3min dead hang. Those are consequences, not the training targets.",
  "hrZones": {
    "z1": 133,
    "z2": 153,
    "z3": 168,
    "z4": 182,
    "note": "Karvonen from RHR 54 / max 196. Easy work means at or under 153."
  },
  "targets": [
    {
      "metric": "Squat",
      "from": "58.5kg x 6",
      "to": "62.5kg 3x5"
    },
    {
      "metric": "Deadlift",
      "from": "80kg x 7",
      "to": "85kg 3x5"
    },
    {
      "metric": "Incline bench",
      "from": "55.5kg x 5",
      "to": "57.5kg 3x5"
    },
    {
      "metric": "Overhead press",
      "from": "28kg x 8",
      "to": "30kg 3x6"
    },
    {
      "metric": "Pull-ups",
      "from": "6-8",
      "to": "3x8 strict"
    },
    {
      "metric": "Fixed-HR 30min @150bpm",
      "from": "baseline 22 Sep",
      "to": "+2-4% distance by 17 Oct"
    },
    {
      "metric": "Dead hang",
      "from": "untested",
      "to": "test 17 Oct; daily accumulation in Open"
    }
  ],
  "weeks": [
    {
      "n": 1,
      "label": "Baseline",
      "start": "2026-09-21",
      "end": "2026-09-27",
      "load": "baseline",
      "intent": "Establish real numbers. Easy days strictly under 153 — this is the week you find out how slow that actually is."
    },
    {
      "n": 2,
      "label": "Build",
      "start": "2026-09-28",
      "end": "2026-10-04",
      "load": "build",
      "intent": "Aerobic volume up. Add 10min to the long easy day. Strength: same weights, one more set where it moved cleanly."
    },
    {
      "n": 3,
      "label": "Peak",
      "start": "2026-10-05",
      "end": "2026-10-11",
      "load": "peak",
      "intent": "Hardest week. Intervals at full effort, strength at the block targets. Expect to be tired by Friday."
    },
    {
      "n": 4,
      "label": "Deload + retest",
      "start": "2026-10-12",
      "end": "2026-10-18",
      "load": "deload",
      "intent": "Volume down about 40% Mon-Thu so Friday and Saturday are tested fresh, not fatigued."
    }
  ],
  "days": [
    {
      "date": "2026-09-21",
      "weekday": "monday",
      "week": 1,
      "theme": "Strength A",
      "variant": "standard",
      "coordDomain": "vision",
      "load": "baseline",
      "focusNote": "BASELINE: work up to a heavy-ish set of 5 on squat and incline bench. Log everything — the app has no strength history yet.",
      "benchmark": false
    },
    {
      "date": "2026-09-22",
      "weekday": "tuesday",
      "week": 1,
      "theme": "Aerobic baseline test",
      "variant": "standard",
      "coordDomain": "ball-reaction",
      "load": "test",
      "focusNote": "BASELINE: 30min capped at 150bpm. Record distance. Do not exceed the cap even uphill — walk if you have to. This number is what the whole block is measured against.",
      "benchmark": true
    },
    {
      "date": "2026-09-23",
      "weekday": "wednesday",
      "week": 1,
      "theme": "Intervals + Power",
      "variant": "standard",
      "coordDomain": "balance",
      "load": "baseline",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-09-24",
      "weekday": "thursday",
      "week": 1,
      "theme": "Zone 2 bike + Yoga",
      "variant": "standard",
      "coordDomain": "stick",
      "load": "baseline",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-09-25",
      "weekday": "friday",
      "week": 1,
      "theme": "Strength B",
      "variant": "standard",
      "coordDomain": "objects",
      "load": "baseline",
      "focusNote": "BASELINE: same for deadlift and overhead press. Log every set.",
      "benchmark": false
    },
    {
      "date": "2026-09-26",
      "weekday": "saturday",
      "week": 1,
      "theme": "Long Easy + Flexibility",
      "variant": "standard",
      "coordDomain": "vision",
      "load": "baseline",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-09-27",
      "weekday": "sunday",
      "week": 1,
      "theme": "Light",
      "variant": "light",
      "coordDomain": "ball-reaction",
      "load": "baseline",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-09-28",
      "weekday": "monday",
      "week": 2,
      "theme": "Strength A",
      "variant": "standard",
      "coordDomain": "balance",
      "load": "build",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-09-29",
      "weekday": "tuesday",
      "week": 2,
      "theme": "Zone 2 run",
      "variant": "standard",
      "coordDomain": "stick",
      "load": "build",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-09-30",
      "weekday": "wednesday",
      "week": 2,
      "theme": "Intervals + Power",
      "variant": "standard",
      "coordDomain": "objects",
      "load": "build",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-01",
      "weekday": "thursday",
      "week": 2,
      "theme": "Zone 2 bike + Yoga",
      "variant": "standard",
      "coordDomain": "vision",
      "load": "build",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-02",
      "weekday": "friday",
      "week": 2,
      "theme": "Strength B",
      "variant": "standard",
      "coordDomain": "ball-reaction",
      "load": "build",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-03",
      "weekday": "saturday",
      "week": 2,
      "theme": "Long Easy + Flexibility",
      "variant": "standard",
      "coordDomain": "balance",
      "load": "build",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-04",
      "weekday": "sunday",
      "week": 2,
      "theme": "Light",
      "variant": "light",
      "coordDomain": "stick",
      "load": "build",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-05",
      "weekday": "monday",
      "week": 3,
      "theme": "Strength A",
      "variant": "standard",
      "coordDomain": "objects",
      "load": "peak",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-06",
      "weekday": "tuesday",
      "week": 3,
      "theme": "Zone 2 run",
      "variant": "standard",
      "coordDomain": "vision",
      "load": "peak",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-07",
      "weekday": "wednesday",
      "week": 3,
      "theme": "Intervals + Power",
      "variant": "standard",
      "coordDomain": "ball-reaction",
      "load": "peak",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-08",
      "weekday": "thursday",
      "week": 3,
      "theme": "Zone 2 bike + Yoga",
      "variant": "standard",
      "coordDomain": "balance",
      "load": "peak",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-09",
      "weekday": "friday",
      "week": 3,
      "theme": "Strength B",
      "variant": "standard",
      "coordDomain": "stick",
      "load": "peak",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-10",
      "weekday": "saturday",
      "week": 3,
      "theme": "Long Easy + Flexibility",
      "variant": "standard",
      "coordDomain": "objects",
      "load": "peak",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-11",
      "weekday": "sunday",
      "week": 3,
      "theme": "Light",
      "variant": "light",
      "coordDomain": "vision",
      "load": "peak",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-12",
      "weekday": "monday",
      "week": 4,
      "theme": "Strength A",
      "variant": "standard",
      "coordDomain": "ball-reaction",
      "load": "deload",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-13",
      "weekday": "tuesday",
      "week": 4,
      "theme": "Zone 2 run",
      "variant": "standard",
      "coordDomain": "balance",
      "load": "deload",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-14",
      "weekday": "wednesday",
      "week": 4,
      "theme": "Intervals + Power",
      "variant": "standard",
      "coordDomain": "stick",
      "load": "deload",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-15",
      "weekday": "thursday",
      "week": 4,
      "theme": "Zone 2 bike + Yoga",
      "variant": "standard",
      "coordDomain": "objects",
      "load": "deload",
      "focusNote": "",
      "benchmark": false
    },
    {
      "date": "2026-10-16",
      "weekday": "friday",
      "week": 4,
      "theme": "Strength retest",
      "variant": "standard",
      "coordDomain": "vision",
      "load": "test",
      "focusNote": "RETEST: squat 62.5 3x5, incline bench 57.5 3x5, deadlift 85 3x5, overhead press 30 3x6, pull-ups 3x8. Take what moves cleanly, leave what does not.",
      "benchmark": true
    },
    {
      "date": "2026-10-17",
      "weekday": "saturday",
      "week": 4,
      "theme": "Aerobic retest",
      "variant": "standard",
      "coordDomain": "ball-reaction",
      "load": "test",
      "focusNote": "RETEST: 30min capped at 150bpm, same route and conditions as 22 Sep. Compare distance. Also test a max dead hang.",
      "benchmark": true
    },
    {
      "date": "2026-10-18",
      "weekday": "sunday",
      "week": 4,
      "theme": "Light",
      "variant": "light",
      "coordDomain": "balance",
      "load": "deload",
      "focusNote": "",
      "benchmark": false
    }
  ]
};
