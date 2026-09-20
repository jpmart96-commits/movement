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
// One theme per day, explored properly, rather than five domains
// skimmed in 25 minutes. The user was explicit: switching fast between
// domains leaves no time to consciously involve yourself in any of them.
//
// Five domains over a seven-day week means the cycle DRIFTS against the
// weekday — 5 and 7 are coprime, so over 35 days every domain lands on
// every day type. Vision work therefore happens sometimes fresh on a
// light day and sometimes tired after intervals, which is the point.
const COORD_DOMAINS = ['vision', 'ball-reaction', 'balance', 'stick', 'objects'];

// Anchored to the first day of the Sep-2026 block so the cycle is stable
// and reproducible rather than dependent on when the app happens to run.
const COORD_ANCHOR_DATE = '2026-09-21';

const COORD_DOMAIN_LABELS = {
  'vision':        'Vision & eyes',
  'ball-reaction': 'Ball & reaction',
  'balance':       'Balance',
  'stick':         'Stick work',
  'objects':       'Object manipulation',
};

// ── WEEK TEMPLATE ─────────────────────────────────────────────
// `mainFocus.tags` / `accessory.tags` / `mobility.tags` are modalityTags
// (data/library.js). Three easy aerobic days against one hard one is
// roughly the 80/20 split that actually builds an aerobic base — the
// reason the engine had not moved is that the easy days were being run
// at 89% of max heart rate.
const WEEK_SCAFFOLD = {
  monday: {
    theme: 'Strength A', variant: 'standard',
    mainFocus: { tags: ['weights'], note: 'Squat, incline bench, pull-up, core. Log every set.' },
    accessory: { tags: ['calisthenics'] },
    mobility:  { tags: ['mobility-movement', 'flexibility'] },
    fuel: 'Something light beforehand — this is a loaded session.',
  },
  tuesday: {
    theme: 'Zone 2 run', variant: 'standard',
    mainFocus: { tags: ['cardio'], cardioMode: 'steady', modality: 'run', note: 'Keep HR at or under 153. If you have to walk the hills, walk them.' },
    accessory: { tags: ['calisthenics'] },
    mobility:  { tags: ['mobility-movement', 'flexibility'] },
    fuel: 'Optional — easy enough to run on an empty stomach if you prefer.',
  },
  wednesday: {
    theme: 'Intervals + Power', variant: 'standard',
    mainFocus: { tags: ['cardio', 'power-plyo'], cardioMode: 'intervals', modality: 'run', note: 'The hard day. Work intervals near max, recover fully between.' },
    accessory: { tags: ['gymnastics-conditioning'] },
    mobility:  { tags: ['mobility-movement'] },
    fuel: 'Eat something light first — do not do this one empty.',
  },
  thursday: {
    theme: 'Zone 2 bike + Yoga', variant: 'standard',
    mainFocus: { tags: ['cardio'], cardioMode: 'steady', modality: 'bike', note: 'Bike. Under 153. Nose breathing, conversational.' },
    accessory: { tags: ['yoga'] },
    mobility:  { tags: ['yoga', 'flexibility'] },
    fuel: 'Optional.',
  },
  friday: {
    theme: 'Strength B', variant: 'standard',
    mainFocus: { tags: ['weights'], note: 'Deadlift, overhead press, row, dip. Log every set.' },
    accessory: { tags: ['calisthenics'] },
    mobility:  { tags: ['mobility-movement', 'weighted-mobility'] },
    fuel: 'Something light beforehand.',
  },
  saturday: {
    theme: 'Long Easy + Flexibility', variant: 'standard',
    mainFocus: { tags: ['cardio'], cardioMode: 'steady', modality: 'run', note: 'Longest easy session of the week. Strictly under 153.' },
    accessory: { tags: ['flexibility'] },
    mobility:  { tags: ['flexibility', 'weighted-mobility'], note: 'Pancake and hamstring work lives here.' },
    fuel: 'Eat properly — this is the long one.',
  },
  sunday: {
    theme: 'Light', variant: 'light',
    mainFocus: null,
    accessory: { tags: ['calisthenics'], note: 'Dead hang accumulation — building toward 2-3min.' },
    mobility:  { tags: ['yoga', 'mobility-movement'] },
    fuel: 'Whatever you like.',
    movable: true,
  },

  // ── NAMED DAY-TYPES ───────────────────────────────────────
  // Not weekdays. A month-plan day borrows one by setting `dayType`, which
  // is how the second quality session of a build week lands on a Saturday
  // without rewriting the week template. Chat's theme_swap can reach these
  // too, since it looks up the same map.
  'quality-4x4': {
    theme: 'Quality \u2014 4x4', variant: 'standard',
    mainFocus: {
      tags: ['cardio'], cardioMode: 'intervals', modality: 'run',
      intervalSpec: 'Norwegian 4x4 \u2014 10min warm-up at 118-137bpm, then 4 x 4min at 167-186bpm with 3min easy jogging between, 5min cool-down.',
      note: 'The four intervals are the session. Recover properly between them \u2014 the recovery is what lets the next one count.',
    },
    accessory: { tags: ['calisthenics'] },
    mobility:  { tags: ['mobility-movement'] },
    fuel: 'Eat something light first \u2014 do not do this one empty.',
  },

  'light-yoga': {
    theme: 'Yoga + Mobility', variant: 'light',
    mainFocus: null,
    accessory: { tags: ['yoga'] },
    mobility:  { tags: ['yoga', 'flexibility'] },
    fuel: 'Whatever you like.',
    movable: true,
  },
};
