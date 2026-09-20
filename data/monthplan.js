// ────────────────────────────────────────────────────────────
// PRACTICE BRAIN — DATA LAYER
// monthplan.js — the block skeleton the app fills in day by day.
//
// Three layers live here:
//   quarter  — 13 weeks, three 4-week blocks plus an assessment week.
//   ladders  — the stepped targets. Every primary line (aerobic engine,
//              muscle-up, handstand, weights) has a dated rung for each
//              checkpoint, most of them tied to a real GOALS ladder id in
//              data/library.js so the app's Progress screen and this plan
//              are talking about the same thing.
//   days     — theme, day-type, coordination domain, load, prescription.
//
// This layer never picks exercises: the Generator resolves the skeleton
// against the real library, same split the chat override already uses
// (propose structure, resolve deterministically).
//
// Seed only. Once the app has written it to Supabase (month_plans), the
// stored copy wins and this file is just the fallback for a fresh device.
//
// Revised 2026-09-20 (second pass):
//   - Block starts 20 Sep, not 21 — the quarter opened with a 4x4 today.
//   - VO2max is now a named primary line with the Norwegian 4x4 as its
//     protocol, and the week carries 1 or 2 quality sessions depending on
//     where it sits in the block (2 every week overreaches most non-elite
//     athletes inside 3-4 weeks; the research is consistent on this).
//   - A second quality session needs a day that is not Wednesday, so plan
//     days can now carry `dayType` and borrow another day-type's whole
//     skeleton. Saturday becomes a 4x4 on double weeks and the long easy
//     run slides to Sunday.
//   - `intervalSpec` carries the actual protocol, because the generator's
//     generic "N min hard / M min easy" fallback is not a 4x4.
//   - Strength targets recalculated from estimated 1RM rather than carried
//     over. The previous squat target (62.5 3x5) sat at ~89% of a ~70kg
//     estimated max, which is a hard triple, not a 3x5.
// ────────────────────────────────────────────────────────────

const MONTH_PLAN_SEED = {
  // Bumped whenever this file's plan changes. ensureSeeded() supersedes a
  // stored plan with a lower version, and a pull refuses to downgrade past
  // it — without that, the seed reaches storage exactly once and every
  // later revision is silently ignored on the one device that matters.
  "seedVersion": 2,

  "title": "Block 1 — Aerobic engine + strength",
  "blockStart": "2026-09-20",
  "blockEnd": "2026-10-25",

  "spine": ["aerobic engine", "strength"],
  "support": ["mobility & flexibility", "coordination / vision / balance", "power", "yoga"],
  "horizon": "12 months: 10km in 60min held in zone 2; handstand; pancake; muscle-up; 2-3min dead hang.",

  "hrZones": {
    "z1": 133, "z2": 153, "z3": 168, "z4": 182,
    "note": "Karvonen from RHR 54 / max 196. Easy work means at or under 153. 4x4 work intervals live at 167-186 (85-95% of max), which is upper Z4 into Z5."
  },

  // ── THE QUARTER ────────────────────────────────────────────
  "quarter": {
    "from": "2026-09-20", "to": "2026-12-20", "weeks": 13,
    "premise": "Never trained consistently; good raw endurance but inefficient — an hour is available, it just costs a high heart rate. VO2max has sat around 42-47. Push strength is well ahead of pull (12+ dips against 6-8 pull-ups), which is the single clearest thing standing between here and a muscle-up.",
    "spine": "Aerobic engine first, built by two mechanisms that do different jobs: easy volume under 153 raises the ceiling you can sit under, and 4x4 intervals raise the ceiling itself. Strength progresses linearly underneath, sized so it never competes with the intervals. Skill lines (muscle-up, handstand) run the whole quarter inside the Accessory block rather than as extra sessions.",
    "qualityDayRule": "Two 4x4 sessions in build and peak weeks, one in baseline and deload weeks. Three a week, or two every week without a break, drives most non-elite athletes into overreaching within 3-4 weeks — the undulation is what keeps the stimulus working for 13 weeks instead of 4.",
    "interferenceRule": "Strength moves one small step per block, never two. Concurrent aerobic work mostly blunts lower-body power and hypertrophy, not maximal strength, so the lifts are sized to keep progressing quietly rather than to be chased. If a week's quality sessions are being hit properly and a lift stalls, let it stall.",
    "blocks": [
      { "n": 1, "name": "Find the floor", "weeks": "1-4", "from": "2026-09-20", "to": "2026-10-18",
        "aerobic": "Establish real numbers. Learn what under-153 actually costs, and learn to pace a 4x4 — the first interval is always too fast.",
        "strength": "Baseline every lift in week 1, then one step to the block targets, tested across two days.",
        "skill": "Handstand to chest-to-wall 30s. Pull side starts closing on the push side.",
        "hardPart": "Pacing. Both directions — easy days too fast, first interval too hard." },
      { "n": 2, "name": "Widen the window", "weeks": "5-8", "from": "2026-10-19", "to": "2026-11-15",
        "aerobic": "Volume up, and the interval extends to 5x4 once four consistent weeks of 4x4 are in the bank.",
        "strength": "Second step. Dips go weighted rather than higher-rep.",
        "skill": "False grip pull-ups. Handstand consolidates at the wall rather than rushing off it.",
        "hardPart": "The long easy day reaching 70min without the heart rate drifting up in the last 20." },
      { "n": 3, "name": "Put the engine to work", "weeks": "9-12", "from": "2026-11-16", "to": "2026-12-13",
        "aerobic": "10km continuous under 153, and one threshold session per week (4x8min) alongside the 5x4.",
        "strength": "Third step. First weighted pull-ups.",
        "skill": "Transition drills, then the first kipping muscle-up. Handstand to freestanding tuck.",
        "hardPart": "Holding skill quality while the aerobic load is at its highest." }
    ],
    "assessmentWeek": { "n": 13, "from": "2026-12-14", "to": "2026-12-20",
      "intent": "Retest everything: five lifts, fixed-HR 30min, dead hang, pancake, handstand and muscle-up rungs. Then decide Q1's spine." }
  },

  // ── LADDERS ────────────────────────────────────────────────
  // The stepped targets. `goalId` + `rung` point at the real ladders in
  // data/library.js GOALS, so advancing a rung here means tapping the same
  // rung on the Progress screen. Every goal is currently recorded at 0
  // because nothing has ever been advanced — the `from` values below are
  // the honest starting positions, not the stored ones.
  "ladders": {

    "aerobic": {
      "line": "Aerobic engine / VO2max",
      "goalId": null,
      "from": "VO2max 42-47 historically. Fixed-HR 30min@150 distance unknown until 22 Sep.",
      "protocol": "Norwegian 4x4 — 10min warm-up at 118-137bpm, 4 x 4min at 167-186bpm, 3min easy between, 5min cool-down. About 40min, 16 of them at intensity.",
      "evidence": "8-12 weeks is where the response peaks; 5-10% VO2max gains are typical over 8 weeks. Extending to 5x4 is only appropriate after 4+ consistent weeks of 4x4.",
      "quarterTarget": "Fixed-HR 30min distance +8-12% on the 22 Sep baseline. VO2max +3-5 points. 10km continuous under 153.",
      "steps": [
        { "week": 1,  "by": "2026-09-22", "target": "BASELINE — 30min capped at 150bpm. Distance, avg HR, route, conditions all recorded." },
        { "week": 2,  "by": "2026-10-04", "target": "Two 4x4s completed. Intervals at 167-175 — the low end on purpose, this week is about not blowing up on interval 1." },
        { "week": 3,  "by": "2026-10-11", "target": "Two 4x4s at 172-182. All four intervals the same speed, not a descending set." },
        { "week": 4,  "by": "2026-10-17", "target": "RETEST fixed-HR 30min, same route and conditions. Target +3-5% distance." },
        { "week": 6,  "by": "2026-11-01", "target": "Two 4x4s at the full 175-186. Four consistent weeks of 4x4 now banked." },
        { "week": 7,  "by": "2026-11-08", "target": "Extend to 5x4. Long easy day reaches 70min under 153." },
        { "week": 8,  "by": "2026-11-14", "target": "RETEST fixed-HR 30min. Target +6-8% on the September baseline." },
        { "week": 10, "by": "2026-11-29", "target": "5x4 plus one threshold session (4 x 8min at 168-178) in the same week." },
        { "week": 12, "by": "2026-12-12", "target": "10km continuous under 153. Time is whatever it is — 68-78min is the honest expectation." },
        { "week": 13, "by": "2026-12-19", "target": "FINAL fixed-HR 30min. Target +8-12% on September. Read the VO2max estimate." }
      ]
    },

    "muscleUp": {
      "line": "Ring muscle-up",
      "goalId": "ring-muscle-up",
      "from": "Rung 0-1. About 8 strict pull-ups, 12+ strict bar dips, false grip hold around 20s.",
      "diagnosis": "The push side is not the problem and has not been for a while — 12+ dips against 6-8 pull-ups is a real imbalance. Pull volume goes up, push goes weighted instead of higher-rep, and the transition gets its own practice time because it is its own skill.",
      "evidence": "Prerequisites commonly cited: 8-10 strict pull-ups, 8-10 strict dips, 20-30s false grip hold. Unassisted attempts want 12+ pull-ups. 3-6 months from prerequisites met is the usual timeline.",
      "quarterTarget": "First kipping muscle-up by 13 Dec. The STRICT muscle-up is explicitly not a Q4 target — that is Q1.",
      "steps": [
        { "week": 3,  "by": "2026-10-11", "goalId": "ring-muscle-up", "rung": 1, "target": "Strict ring pull-up x 5. False grip hold 30s." },
        { "week": 4,  "by": "2026-10-18", "goalId": "pullups-10",     "rung": 2, "target": "Pull-ups 3x8 strict. Dips go weighted: 3x10 at +5kg." },
        { "week": 6,  "by": "2026-11-01", "goalId": "ring-muscle-up", "rung": 2, "target": "False grip pull-up x 3. This is the rung most people skip and then stall on." },
        { "week": 8,  "by": "2026-11-15", "goalId": "pullups-10",     "rung": 3, "target": "Pull-ups 3x10 strict. False grip hold 45s. Dips 3x8 at +10kg." },
        { "week": 9,  "by": "2026-11-22", "goalId": "ring-muscle-up", "rung": 3, "target": "Banded transition drill, 5 controlled reps. Slow through the sticking point, no snatching." },
        { "week": 11, "by": "2026-12-06", "target": "Transition with minimal band. Explosive pull-ups x 3 to chest-height or above." },
        { "week": 12, "by": "2026-12-13", "goalId": "ring-muscle-up", "rung": 4, "target": "FIRST KIPPING MUSCLE-UP." },
        { "week": 13, "by": "2026-12-20", "goalId": "ring-muscle-up", "rung": 5, "target": "STRETCH — 3 kipping muscle-ups." }
      ]
    },

    "handstand": {
      "line": "Handstand",
      "goalId": "handstand",
      "from": "Rung 1-2. Wall plank 30s solid, back-to-wall held, chest-to-wall 30s still a fight.",
      "protocol": "3 sessions a week of 15min inside Accessory & Skill. Wrist preparation comes first every single time — not as a warm-up nicety, as the thing that decides whether this line survives the quarter.",
      "evidence": "2-4 sessions a week, 15-20min each, is the standard recommendation. Timelines range from 6-8 weeks for people with a strong background to years for beginners with limited practice — rung-by-rung targets, not a date for the finished skill.",
      "quarterTarget": "Rung 4 — freestanding tuck 5s — by 13 Dec. That is three rungs in 13 weeks from wall holds, which is a real but reachable rate.",
      "steps": [
        { "week": 3,  "by": "2026-10-11", "goalId": "handstand", "rung": 2, "target": "Chest-to-wall hold 30s." },
        { "week": 4,  "by": "2026-10-18", "target": "Wrists tolerate three handstand sessions in a week with no lingering soreness. If they do not, this line pauses and the wrist work continues alone." },
        { "week": 6,  "by": "2026-11-01", "goalId": "handstand", "rung": 2, "target": "Chest-to-wall 3 x 45s, plus 10min handstand taps. Consolidating, not advancing — time at the wall is what buys the float later." },
        { "week": 9,  "by": "2026-11-22", "goalId": "handstand", "rung": 3, "target": "Pike press entry, controlled." },
        { "week": 12, "by": "2026-12-13", "goalId": "handstand", "rung": 4, "target": "Freestanding tuck 5s." },
        { "week": 13, "by": "2026-12-20", "goalId": "handstand", "rung": 5, "target": "STRETCH — straddle freestanding 5s." }
      ]
    },

    "weights": {
      "line": "Barbell strength",
      "goalId": null,
      "from": "Squat 58.5x6, deadlift 80x7, incline bench 55.5x5, overhead press 28x8, pull-ups 6-8. Bodyweight 74kg.",
      "method": "Targets derived from estimated 1RM (Epley) with a 3x5 sitting near 82% of max, then +10-14% on estimated max across the quarter. Lower body takes 2.5kg steps per block, upper body 1.5-2.5kg — upper body simply does not move at the same rate and pretending otherwise is how a linear progression dies in week 6.",
      "quarterTarget": "Deadlift 80x7 to 92.5 3x5 — a +12.5kg working weight. Squat to 65 3x5. First weighted pull-up.",
      "steps": [
        { "week": 1,  "by": "2026-09-25", "target": "BASELINE all five lifts. Work up to a heavy-ish 5, stop when bar speed drops. This is a measurement, not a max attempt." },
        { "week": 4,  "by": "2026-10-16", "target": "BLOCK 1 TEST — squat 60 3x5, incline 55 3x5, pull-ups 3x8 (Mon 12) · deadlift 85 3x5, overhead press 30 3x6 (Fri 16)." },
        { "week": 8,  "by": "2026-11-13", "target": "BLOCK 2 TEST — squat 62.5 3x5, incline 57.5 3x5, pull-ups 3x10 · deadlift 90 3x5, overhead press 31.5 3x6. Dips 3x8 at +10kg." },
        { "week": 12, "by": "2026-12-11", "target": "BLOCK 3 TEST — squat 65 3x5 (stretch 67.5), incline 60 3x5, first weighted pull-up 3x8 at +5kg · deadlift 92.5 3x5 (stretch 95), overhead press 33 3x6 (stretch 35). Dips 3x8 at +15kg." }
      ]
    },

    "support": {
      "line": "Supporting lines — these complement the four above, they are not extra goals",
      "deadHang":    { "from": "untested", "steps": [
        { "week": 4,  "by": "2026-10-17", "target": "60s unbroken" },
        { "week": 8,  "by": "2026-11-14", "target": "90s unbroken" },
        { "week": 12, "by": "2026-12-12", "target": "2min unbroken — the 12-month marker is 2-3min" } ] },
      "pancake":     { "goalId": "middle-splits", "from": "unmeasured", "steps": [
        { "week": 5,  "by": "2026-10-19", "rung": 0, "target": "MEASURE — chest height off the floor in a straddle. Everything after is compared to this." },
        { "week": 8,  "by": "2026-11-15", "rung": 1, "target": "Straddle floor ~40cm" },
        { "week": 13, "by": "2026-12-20", "rung": 2, "target": "STRETCH — straddle floor ~20cm" } ] },
      "coordination": { "note": "Five domains on a 5-day rotation against a 7-day week, so every domain lands on every day type over 35 days. No target beyond turning up and staying in the domain long enough to be in it. Balance is the thin pool — four exercises against vision's six, stick's nine and object manipulation's sixteen." },
      "yoga":        { "note": "Thursday carries it on single-quality weeks as Zone 2 bike + Yoga, and on double-quality weeks Thursday becomes the light day and yoga owns it outright." },
      "pistol":      { "goalId": "pistol-squat", "from": "rung 0 — box pistol", "steps": [
        { "week": 13, "by": "2026-12-20", "rung": 2, "target": "Counterweight pistol" } ] }
    }
  },

  "targets": [
    { "metric": "Squat 3x5",              "from": "58.5x6 (est. 1RM ~70)", "to": "60 by 16 Oct · 62.5 by 13 Nov · 65 by 11 Dec" },
    { "metric": "Deadlift 3x5",           "from": "80x7 (est. 1RM ~99)",   "to": "85 by 16 Oct · 90 by 13 Nov · 92.5 by 11 Dec" },
    { "metric": "Incline bench 3x5",      "from": "55.5x5 (est. 1RM ~65)", "to": "55 by 16 Oct · 57.5 by 13 Nov · 60 by 11 Dec" },
    { "metric": "Overhead press 3x6",     "from": "28x8 (est. 1RM ~35)",   "to": "30 by 16 Oct · 31.5 by 13 Nov · 33 by 11 Dec" },
    { "metric": "Pull-ups",               "from": "6-8 strict",            "to": "3x8 by 18 Oct · 3x10 by 15 Nov · 3x8 at +5kg by 13 Dec" },
    { "metric": "Dips",                   "from": "12+ strict on bars",    "to": "weighted, not higher-rep: +5kg · +10kg · +15kg" },
    { "metric": "Fixed-HR 30min @150bpm", "from": "baseline 22 Sep",       "to": "+3-5% by 17 Oct · +6-8% by 14 Nov · +8-12% by 19 Dec" },
    { "metric": "Handstand (rung 0-8)",   "from": "rung 1-2 — wall holds", "to": "rung 2 by 11 Oct · rung 3 by 22 Nov · rung 4 by 13 Dec" },
    { "metric": "Ring muscle-up (0-6)",   "from": "rung 0-1",              "to": "rung 1 by 11 Oct · rung 2 by 1 Nov · rung 3 by 22 Nov · rung 4 by 13 Dec" },
    { "metric": "Dead hang",              "from": "untested",              "to": "60s by 17 Oct · 90s by 14 Nov · 2min by 12 Dec" },
    { "metric": "10km continuous",        "from": "not attempted",         "to": "under 153 the whole way, by 12 Dec" }
  ],

  "weeks": [
    { "n": 1, "label": "Baseline", "start": "2026-09-20", "end": "2026-09-27",
      "load": "baseline", "qualitySessions": 1,
      "intent": "Establish real numbers. The quality session already happened on the 20th, so Wednesday is sprints instead. Easy days strictly under 153 — this is the week you find out what that costs." },
    { "n": 2, "label": "Build", "start": "2026-09-28", "end": "2026-10-04",
      "load": "build", "qualitySessions": 2,
      "intent": "Two 4x4s, Wednesday and Saturday, both at the low end. Thursday goes light and the long easy run slides to Sunday to make room. Strength: first real working sets." },
    { "n": 3, "label": "Peak", "start": "2026-10-05", "end": "2026-10-11",
      "load": "peak", "qualitySessions": 2,
      "intent": "Hardest week of the block. Two 4x4s at 172-182, strength at the block-1 targets. Saturday's session will feel worse than Wednesday's; that is the week working." },
    { "n": 4, "label": "Deload + retest", "start": "2026-10-12", "end": "2026-10-18",
      "load": "deload", "qualitySessions": 1,
      "intent": "Volume down about 40%. One half-length quality session on Wednesday. Strength retested across Monday and Friday so neither is a five-lift marathon; aerobic and dead hang retested Saturday, fresh." },
    { "n": 5, "label": "Block 2 W1 — Re-establish", "start": "2026-10-19", "end": "2026-10-25",
      "load": "baseline", "qualitySessions": 1,
      "intent": "Block 2 opens the way Block 1 did — one quality session before doubling up in week 6. Intervals reach full intensity. The pancake gets measured Monday." }
  ],

  "days":
    [
      {
        "date": "2026-09-20",
        "weekday": "sunday",
        "week": 1,
        "theme": "Quality — 4x4",
        "variant": "standard",
        "coordDomain": "objects",
        "load": "baseline",
        "dayType": "quality-4x4",
        "intervalSpec": "Norwegian 4x4 — 4 x 4min at 167-186bpm, 3min easy between.",
        "focusNote": "DONE — today's session, logged after the fact. This is week 1's quality session, which is why Wednesday is sprints rather than another 4x4. Write down what the intervals actually averaged; it sets the pacing reference for week 2.",
        "benchmark": false
      },
      {
        "date": "2026-09-21",
        "weekday": "monday",
        "week": 1,
        "theme": "Strength A",
        "variant": "standard",
        "coordDomain": "vision",
        "load": "baseline",
        "focusNote": "BASELINE. Squat: ramp 20x8 / 40x5 / 50x3, then work up to a heavy-ish 5 — stop the ramp the moment bar speed drops. This is a measurement, not a max. Incline bench the same. Then pull-ups: max strict, then 2 x (max-2). Log every set; the app has no strength history at all yet. In Open: one max unbroken dead hang, recorded.",
        "benchmark": true
      },
      {
        "date": "2026-09-22",
        "weekday": "tuesday",
        "week": 1,
        "theme": "Aerobic baseline test",
        "variant": "standard",
        "coordDomain": "ball-reaction",
        "load": "test",
        "focusNote": "BASELINE. 10min build until HR settles under 140, then 30min capped at 150bpm, then 10min walk down. Record distance, average HR, route, weather. Do not exceed the cap even uphill — walk if that is what it costs. Every aerobic number this quarter is measured against this one, so it is worth being strict about.",
        "benchmark": true
      },
      {
        "date": "2026-09-23",
        "weekday": "wednesday",
        "week": 1,
        "theme": "Power + Sprints",
        "variant": "standard",
        "coordDomain": "balance",
        "load": "baseline",
        "intervalSpec": "Short sprints: 6 x 20s uphill at about 85%, walking all the way down between.",
        "focusNote": "Not a 4x4 — Sunday already took this week's quality session. 6 x 20s uphill at about 85%, full walk-down recovery. Then box jumps 4 x 4 with a complete reset each rep, med-ball slams 3 x 8. Finding the shape of the day, not racing it.",
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
        "focusNote": "40min steady on the bike, HR 134-153, nose breathing throughout. If the nose breathing breaks, that is the signal — slow down rather than opening your mouth and holding the pace.",
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
        "focusNote": "BASELINE. Deadlift: ramp 60x5 / 70x3, then to a heavy-ish 5. Overhead press to a heavy 5-8. Then cable row 3x10, dips 3x10 (you have 12+, so this is volume not a test), farmer's walk 3 x 40m. Log everything.",
        "benchmark": true
      },
      {
        "date": "2026-09-26",
        "weekday": "saturday",
        "week": 1,
        "theme": "Long Easy + Flexibility",
        "variant": "standard",
        "coordDomain": "vision",
        "load": "baseline",
        "focusNote": "45min continuous under 153 — the longest easy run of the week. Walk the hills without negotiating. Accessory: first handstand session of the block, wrist prep first, then chest-to-wall holds.",
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
        "focusNote": "No main focus. Dead hang accumulation is the day — 5 x 45-60s in Open, a full minute between. Total time on the bar is the target, not any single hang.",
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
        "focusNote": "First real working sets: squat 57.5 3x5, incline bench 54 3x5, pull-ups 3x6. If all three sets moved cleanly, note it — week 3 builds off that, not off the baseline.",
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
        "focusNote": "40min continuous under 153. Five minutes longer than last week at the same ceiling — the duration moves, the cap never does.",
        "benchmark": false
      },
      {
        "date": "2026-09-30",
        "weekday": "wednesday",
        "week": 2,
        "theme": "Quality — 4x4",
        "variant": "standard",
        "coordDomain": "objects",
        "load": "build",
        "dayType": "quality-4x4",
        "intervalSpec": "Norwegian 4x4 — 10min warm-up at 118-137, then 4 x 4min at 167-175, 3min easy between, 5min cool-down.",
        "focusNote": "First properly structured 4x4. Deliberately at the LOW end, 167-175. The universal mistake is running interval 1 too hard and fading; all four should be the same speed. If interval 4 is slower than interval 1, you went out too fast.",
        "benchmark": false
      },
      {
        "date": "2026-10-01",
        "weekday": "thursday",
        "week": 2,
        "theme": "Yoga + Mobility",
        "variant": "light",
        "coordDomain": "vision",
        "load": "build",
        "dayType": "light-yoga",
        "focusNote": "Light day. Thursday gives up the bike this week because Saturday is a second 4x4 and the legs need somewhere to recover. Yoga owns the time.",
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
        "focusNote": "Deadlift 80 3x5, overhead press 28 3x6, cable row 3x10, dips 3x10 at +2.5kg. Keep the deadlift top set honest rather than heavy — there is a 4x4 in two days.",
        "benchmark": false
      },
      {
        "date": "2026-10-03",
        "weekday": "saturday",
        "week": 2,
        "theme": "Quality — 4x4",
        "variant": "standard",
        "coordDomain": "balance",
        "load": "build",
        "dayType": "quality-4x4",
        "intervalSpec": "Norwegian 4x4 — 4 x 4min at 167-175, 3min easy between.",
        "focusNote": "Second quality session of the week, three days after the first. Same prescription as Wednesday — repeat it rather than escalate. Two in a week is new; the point is tolerating it, not beating it.",
        "benchmark": false
      },
      {
        "date": "2026-10-04",
        "weekday": "sunday",
        "week": 2,
        "theme": "Long Easy + Flexibility",
        "variant": "standard",
        "coordDomain": "stick",
        "load": "build",
        "dayType": "saturday",
        "focusNote": "The long easy run moves to Sunday this week. 55min continuous under 153. Ten minutes longer than last Saturday.",
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
        "focusNote": "Squat 60 3x5, incline bench 55 3x5, pull-ups 3x7. Hardest strength day of the block and the block-1 target for squat.",
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
        "focusNote": "45min under 153.",
        "benchmark": false
      },
      {
        "date": "2026-10-07",
        "weekday": "wednesday",
        "week": 3,
        "theme": "Quality — 4x4",
        "variant": "standard",
        "coordDomain": "ball-reaction",
        "load": "peak",
        "dayType": "quality-4x4",
        "intervalSpec": "Norwegian 4x4 — 4 x 4min at 172-182, 3min easy between.",
        "focusNote": "Intensity moves up to 172-182. Still four intervals of the same speed — the target is evenness, not a hero first rep.",
        "benchmark": false
      },
      {
        "date": "2026-10-08",
        "weekday": "thursday",
        "week": 3,
        "theme": "Yoga + Mobility",
        "variant": "light",
        "coordDomain": "balance",
        "load": "peak",
        "dayType": "light-yoga",
        "focusNote": "Light day inside the peak week. It only works if you actually take it — this is the day that makes Saturday possible.",
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
        "focusNote": "Deadlift 82.5 3x5, overhead press 29 3x6, cable row 3x10, dips 3x10 at +5kg.",
        "benchmark": false
      },
      {
        "date": "2026-10-10",
        "weekday": "saturday",
        "week": 3,
        "theme": "Quality — 4x4",
        "variant": "standard",
        "coordDomain": "objects",
        "load": "peak",
        "dayType": "quality-4x4",
        "intervalSpec": "Norwegian 4x4 — 4 x 4min at 172-182, 3min easy between.",
        "focusNote": "Second quality of the peak week. Expect this one to feel considerably worse than Wednesday's — that is the week doing its job, not a sign something is wrong. If you cannot reach 172 on interval 3, stop at 3.",
        "benchmark": false
      },
      {
        "date": "2026-10-11",
        "weekday": "sunday",
        "week": 3,
        "theme": "Long Easy + Flexibility",
        "variant": "standard",
        "coordDomain": "vision",
        "load": "peak",
        "dayType": "saturday",
        "focusNote": "60min continuous under 153, on tired legs. Staying under the cap when you are fatigued is the whole test — it will be slower than last Sunday and that is correct.",
        "benchmark": false
      },
      {
        "date": "2026-10-12",
        "weekday": "monday",
        "week": 4,
        "theme": "Strength retest A",
        "variant": "standard",
        "coordDomain": "ball-reaction",
        "load": "test",
        "focusNote": "RETEST A: squat 60 3x5, incline bench 55 3x5, pull-ups 3x8. Take what moves cleanly, leave what does not. Nothing else heavy today.",
        "benchmark": true
      },
      {
        "date": "2026-10-13",
        "weekday": "tuesday",
        "week": 4,
        "theme": "Zone 2 run",
        "variant": "standard",
        "coordDomain": "balance",
        "load": "deload",
        "focusNote": "30min easy under 153. Deliberately short.",
        "benchmark": false
      },
      {
        "date": "2026-10-14",
        "weekday": "wednesday",
        "week": 4,
        "theme": "Quality — reduced",
        "variant": "standard",
        "coordDomain": "stick",
        "load": "deload",
        "dayType": "quality-4x4",
        "intervalSpec": "Reduced: 2 x 4min at 167-175 only. Half the usual session.",
        "focusNote": "Half a 4x4 and nothing else. No jumps, no slams. You are resting for Friday and Saturday — the temptation to make this a real session is exactly what ruins the retest.",
        "benchmark": false
      },
      {
        "date": "2026-10-15",
        "weekday": "thursday",
        "week": 4,
        "theme": "Yoga + Mobility",
        "variant": "light",
        "coordDomain": "objects",
        "load": "deload",
        "dayType": "light-yoga",
        "focusNote": "Light. Legs should feel fresh by tonight. If they do not, cut Friday's warm-up ramps rather than the test itself.",
        "benchmark": false
      },
      {
        "date": "2026-10-16",
        "weekday": "friday",
        "week": 4,
        "theme": "Strength retest B",
        "variant": "standard",
        "coordDomain": "vision",
        "load": "test",
        "focusNote": "RETEST B: deadlift 85 3x5, overhead press 30 3x6. Two lifts only — ramp properly, then test. Splitting the five lifts across Monday and Friday is why both can be done fresh.",
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
        "focusNote": "RETEST: 30min capped at 150bpm, same route, same conditions, same time of day as 22 Sep. Target +3-5% distance. Then, rested: one max unbroken dead hang, target 60s.",
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
        "focusNote": "Block 1 closes. Before anything else, write down the numbers: fixed-HR distance, dead hang, and where the five lifts actually landed. Block 2's targets are computed off these, not off the estimates.",
        "benchmark": false
      },
      {
        "date": "2026-10-19",
        "weekday": "monday",
        "week": 5,
        "theme": "Strength A",
        "variant": "standard",
        "coordDomain": "stick",
        "load": "baseline",
        "focusNote": "Block 2 opens. Squat and incline at whatever 12 Oct actually gave you, 3x5. In Accessory: MEASURE THE PANCAKE — chest height off the floor in a straddle, written down before you train it. Everything in the pancake line is compared to today.",
        "benchmark": true
      },
      {
        "date": "2026-10-20",
        "weekday": "tuesday",
        "week": 5,
        "theme": "Zone 2 run",
        "variant": "standard",
        "coordDomain": "objects",
        "load": "baseline",
        "focusNote": "40min under 153. Worth comparing how this feels against 29 Sep at the same duration and cap — four weeks of base in between.",
        "benchmark": false
      },
      {
        "date": "2026-10-21",
        "weekday": "wednesday",
        "week": 5,
        "theme": "Quality — 4x4",
        "variant": "standard",
        "coordDomain": "vision",
        "load": "baseline",
        "dayType": "quality-4x4",
        "intervalSpec": "Norwegian 4x4 — 4 x 4min at 175-186, 3min easy between.",
        "focusNote": "Full prescribed intensity now, 175-186. One quality session this week — Block 2 opens the same way Block 1 did, with a single session before doubling up again in week 6.",
        "benchmark": false
      },
      {
        "date": "2026-10-22",
        "weekday": "thursday",
        "week": 5,
        "theme": "Zone 2 bike + Yoga",
        "variant": "standard",
        "coordDomain": "ball-reaction",
        "load": "baseline",
        "focusNote": "45min on the bike under 153.",
        "benchmark": false
      },
      {
        "date": "2026-10-23",
        "weekday": "friday",
        "week": 5,
        "theme": "Strength B",
        "variant": "standard",
        "coordDomain": "balance",
        "load": "baseline",
        "focusNote": "Deadlift and overhead press at the 16 Oct numbers, 3x5 and 3x6. Cable row 3x10, dips 3x8 at +7.5kg — weighted from here, not higher-rep.",
        "benchmark": false
      },
      {
        "date": "2026-10-24",
        "weekday": "saturday",
        "week": 5,
        "theme": "Long Easy + Flexibility",
        "variant": "standard",
        "coordDomain": "stick",
        "load": "baseline",
        "focusNote": "60min under 153. Pancake work owns Accessory from here: 3 x 90s passive plus loaded pancake good mornings at a genuinely light weight.",
        "benchmark": false
      },
      {
        "date": "2026-10-25",
        "weekday": "sunday",
        "week": 5,
        "theme": "Light",
        "variant": "light",
        "coordDomain": "objects",
        "load": "baseline",
        "focusNote": "Pancake accumulation replaces hang accumulation in Open. Same principle as the hang — time in the position, not intensity.",
        "benchmark": false
      }
    ]
};
