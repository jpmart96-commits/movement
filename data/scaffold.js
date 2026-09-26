// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — DATA LAYER
// scaffold.js — week template + daily skeleton
//
// Rewritten 2026-09-20. The previous version assumed a 255–280min
// morning running 06:30–12:00 across seven days, which was the August
// methodology experiment rather than a real schedule. This one is built
// on what the practice actually is: 120–150min, 09:00–11:20, six
// training days plus one light day.
//
// Spine of the block: aerobic engine + strength. Everything else is
// support. Coordination/vision/balance work is NOT a warm-up garnish —
// it gets its own 25min block every day, because it is the part the
// user values most and the first thing that gets cut otherwise.
// ─────────────────────────────────────────────────────────────

// Fixed daily block order + clock times. Two variants: a normal training
// day and the light day. Fasting flags are gone — fuelling is a per-day
// note now (see WEEK_SCAFFOLD.fuel) rather than a protocol the app
// pretends to enforce.
const SKELETON_BLOCKS = [
  { key: 'open',          label: 'Open',                 dailyConstant: true,
    standard: ['09:00', '09:10'], light: ['09:00', '09:15'] },
  { key: 'complementary', label: 'Complementary',        coordThemed: true,
    standard: ['09:10', '09:35'], light: ['09:15', '09:35'] },
  { key: 'mobility',      label: 'Mobility & Flexibility',
    standard: ['09:35', '09:55'], light: ['09:35', '10:05'] },
  { key: 'main-focus',    label: 'Main Focus',           capMinutes: 60,
    standard: ['09:55', '10:55'], light: null },
  { key: 'accessory',     label: 'Accessory & Skill',
    standard: ['10:55', '11:10'], light: ['10:05', '10:15'] },
  { key: 'close',         label: 'Close',
    standard: ['11:10', '11:20'], light: ['10:15', '10:25'] },
];

// The four things that happen every single day regardless of theme.
// Source: the original methodology doc's "daily constants".
const DAILY_CONSTANTS = {
  label: 'Open — daily constants',
  items: [
    { name: 'Rings hanging', vary: ['dead hang', 'active hang', 'single-arm assisted', 'support hold'] },
    { name: 'Spinal waves', vary: ['standing', 'floor'] },
    { name: 'Squats', vary: ['air', 'kettlebell goblet', 'box-assisted pistol', 'band-resisted'] },
    { name: 'Shaking & light flexibility', vary: ['vertical shake', 'straightjacket', 'TRE-style'] },
  ],
};

// ── COORDINATION DOMAIN ROTATION ──────────────────────────────
// One theme per day, explored properly. Six domains since 26 Sep: movement
// practice (crawls, ground flow, Floreio, tumbling) joined the five
// coordination domains. Which families feed each domain lives in
// data/complementary.js (DOMAIN_FAMILIES).
//
// Six against a seven-day week drifts one day per week, so over six weeks
// every domain lands on every day type. The month plan pins the domain per
// date; this is the fallback when there is no plan day.
const COORD_DOMAINS = ['vision', 'ball-reaction', 'balance', 'stick', 'objects', 'movement'];

// Anchored so the fallback agrees with the plan: 26 Sep = vision,
// 27 Sep = ball-reaction, 28 Sep = balance.
const COORD_ANCHOR_DATE = '2026-09-26';

const COORD_DOMAIN_LABELS = {
  'vision':        'Vision & eyes',
  'ball-reaction': 'Ball & reaction',
  'balance':       'Balance',
  'stick':         'Stick work',
  'objects':       'Object manipulation',
  'movement':      'Movement practice',
};

// ── WEEK TEMPLATE ─────────────────────────────────────────────
// Rewritten 2026-09-26 to the agreed split:
//   Mon Strength A · Tue Z2 bike · Wed Plyo/Power/Sprints · Thu Z2 run ·
//   Fri Strength B · Sat Intervals/Tempo · Sun Light
// Three of the four hard days follow an easy one. The one exception —
// Saturday's quality run the day after deadlifts — is accepted: the lift is
// 3x5 submaximal.
//
// Each day type names:
//   mainFocus  — tags + `core`, the exercises the day is FOR, with a default
//                dose. A month-plan day's `mainFocusPlan` overrides `core`
//                with that date's loads. The generator pins these first and
//                never fills Main Focus from prehab or accessory work.
//   mobility   — a recipe key in MOBILITY_RECIPES (data/complementary.js):
//                prep before strength/speed, range-building on easy days.
//   skillLine  — the Accessory & Skill line (SKILL_LINES).
//   close      — a key in CLOSE_RECIPES.
//   open       — a key in OPEN_VARIANTS (same four slots, variant per day).
const _S = (id, sets, extra = {}) => ({ id, sets, ...extra });

const WEEK_SCAFFOLD_TYPES = {
  'strength-a': {
    theme: 'Strength A', variant: 'standard',
    mainFocus: { tags: ['weights'], label: 'Strength A',
      note: 'Squat, incline bench, pull-ups, core. Log every set.',
      core: [ _S('squat', 3, { reps: 5, restSec: 180, note: 'Ramp first: bar x8, ~50% x5, ~70% x3, then the work sets.' }),
              _S('incline-bench', 3, { reps: 5, restSec: 150 }),
              _S('pull-up', 3, { reps: 5, restSec: 120, note: 'Strict, full hang to chin over bar.' }),
              _S('toes-to-bar', 3, { reps: 8, restSec: 90 }) ] },
    mobility: 'strength-a', skillLine: 'prehab-shoulder-wrist', close: 'strength', open: 'strength-a',
    fuel: 'Something light beforehand — this is a loaded session.',
  },
  'z2-bike': {
    theme: 'Zone 2 bike', variant: 'standard',
    mainFocus: { tags: ['cardio'], cardioMode: 'steady', modality: 'bike', label: 'Zone 2 bike',
      note: 'Bike, 134–153. Nose breathing, conversational. Easy on the legs the day after squats.',
      cardio: { id: 'z2-cycling', minutes: 50, text: '50 min · HR 134–153 · nose breathing' } },
    mobility: 'z2-bike', skillLine: 'handstand', close: 'bike', open: 'z2-bike',
    fuel: 'Optional.',
  },
  'plyo-power': {
    theme: 'Plyo · Power · Sprints', variant: 'standard',
    mainFocus: { tags: ['power-plyo'], label: 'Plyo · Power · Sprints',
      note: 'Quality over volume. Stop a set the moment speed drops.',
      core: [ _S('easy-run', 1, { durationSec: 600, note: 'Build to HR ~140.' }),
              _S('uphill-sprints', 6, { durationSec: 20, note: 'Walk all the way down between reps.' }),
              _S('box-jump', 4, { reps: 4, restSec: 90, note: 'Full reset every rep. Step down.' }),
              _S('broad-jump', 3, { reps: 3, restSec: 90, note: 'Stick the landing.' }),
              _S('med-ball-slams', 3, { reps: 8, restSec: 60 }) ] },
    mobility: 'plyo-power', skillLine: 'muscle-up-prep', close: 'run', open: 'plyo-power',
    fuel: 'Eat something light first — do not do this one empty.',
  },
  'z2-run': {
    theme: 'Zone 2 long run', variant: 'standard',
    mainFocus: { tags: ['cardio'], cardioMode: 'steady', modality: 'run', label: 'Zone 2 long run',
      note: 'Continuous, strictly under 153. Walk the hills without negotiating.',
      cardio: { id: 'easy-run', minutes: 50, text: '50 min continuous · under 153' } },
    mobility: 'z2-run', skillLine: 'handstand', close: 'run', open: 'z2-run',
    fuel: 'Eat properly — this is the long one.',
  },
  'strength-b': {
    theme: 'Strength B', variant: 'standard',
    mainFocus: { tags: ['weights'], label: 'Strength B',
      note: 'Deadlift, overhead press, row, dips, carry. Log every set.',
      core: [ _S('deadlift', 3, { reps: 5, restSec: 180, note: 'Ramp first: bar x8, ~50% x5, ~70% x3, then the work sets.' }),
              _S('overhead-press', 3, { reps: 5, restSec: 150 }),
              _S('cable-row', 3, { reps: 8, restSec: 90, note: 'Same grip every session this block.' }),
              _S('triceps-dip', 3, { reps: 6, restSec: 120 }),
              _S('farmers-walk', 3, { distanceM: 40, restSec: 90, rpe: 8 }) ] },
    mobility: 'strength-b', skillLine: 'pancake-hips', close: 'strength', open: 'strength-b',
    fuel: 'Something light beforehand.',
  },
  'quality-run': {
    theme: 'Intervals / Tempo', variant: 'standard',
    mainFocus: { tags: ['cardio'], cardioMode: 'intervals', modality: 'run', label: 'Intervals / Tempo',
      note: 'The one quality run of the week. Recover properly between efforts.',
      cardio: { id: 'interval-run', minutes: 40,
        text: 'Norwegian 4x4 · 10 min warm-up 118–137 · 4 × 4 min at 167–186 · 3 min easy between · 5 min cool-down' } },
    mobility: 'quality-run', skillLine: 'muscle-up-prep', close: 'run', open: 'quality-run',
    fuel: 'Eat something light first — do not do this one empty.',
  },
  'aerobic-test': {
    theme: 'Aerobic retest', variant: 'standard',
    mainFocus: { tags: ['cardio'], cardioMode: 'steady', modality: 'run', label: 'Aerobic retest',
      note: 'Home loop, 08:00. Hold avg ~148, nothing above 156. Record distance for minutes 10–40.',
      cardio: { id: 'easy-run', minutes: 50, text: '10 min build · 30 min at avg ~148 (cap 156) · 10 min walk' } },
    mobility: 'aerobic-test', skillLine: 'hang-project', close: 'run', open: 'aerobic-test',
    fuel: 'Same breakfast as the baseline morning.',
  },
  'light': {
    theme: 'Light', variant: 'light',
    mainFocus: null,
    mobility: 'light', skillLine: 'hang-project', close: 'light', open: 'light',
    fuel: 'Whatever you like.',
    movable: true,
  },
};

// Calendar weekdays point at a day type. Month-plan days can borrow any day
// type with `dayType` (a test, a moved session), and chat's theme_swap can
// reach every key in WEEK_SCAFFOLD, weekdays and day types alike.
const WEEK_SCAFFOLD = {
  ...WEEK_SCAFFOLD_TYPES,
  monday:    { ...WEEK_SCAFFOLD_TYPES['strength-a'],  dayType: 'strength-a' },
  tuesday:   { ...WEEK_SCAFFOLD_TYPES['z2-bike'],     dayType: 'z2-bike' },
  wednesday: { ...WEEK_SCAFFOLD_TYPES['plyo-power'],  dayType: 'plyo-power' },
  thursday:  { ...WEEK_SCAFFOLD_TYPES['z2-run'],      dayType: 'z2-run' },
  friday:    { ...WEEK_SCAFFOLD_TYPES['strength-b'],  dayType: 'strength-b' },
  saturday:  { ...WEEK_SCAFFOLD_TYPES['quality-run'], dayType: 'quality-run' },
  sunday:    { ...WEEK_SCAFFOLD_TYPES['light'],       dayType: 'light' },
  // Names older plan days and stored instances still use.
  'quality-4x4': { ...WEEK_SCAFFOLD_TYPES['quality-run'], dayType: 'quality-run' },
  'light-yoga':  { ...WEEK_SCAFFOLD_TYPES['light'],       dayType: 'light' },
};
Object.keys(WEEK_SCAFFOLD_TYPES).forEach(k => { WEEK_SCAFFOLD[k].dayType = k; });
