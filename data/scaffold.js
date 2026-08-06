// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — DATA LAYER
// scaffold.js — month scaffold: daily skeleton + week template
//
// See memory: project_scaffold_revamp. This replaces on-demand daily
// generation with a stable week-level scaffold that the daily-instance
// generator (Phase 3, js/app.js) expands each day into a fully detailed
// session. Editing this file changes the *default* week shape — it does
// NOT touch any already-generated daily_instances row (those are
// per-date, in Supabase, and are what chat overrides mutate).
// ─────────────────────────────────────────────────────────────

// Fixed daily block order + clock times. Every day uses the same block
// sequence; only the clock times shift depending on the day's `fasting`
// flag (breakfast delayed until after Main Focus breaks the fast).
// Source: methodology doc table 1 (as run through August 2026).
const SKELETON_BLOCKS = [
  { key: 'wake',      label: 'Wake, hygiene, hydrate', fixed: true,
    nonFasting: ['06:30', '07:00'], fasting: ['06:30', '07:00'] },
  { key: 'meditation', label: 'Meditation', fixed: true,
    nonFasting: ['07:00', '07:30'], fasting: ['07:00', '07:30'] },
  { key: 'breakfast', label: 'Breakfast', fixed: true,
    nonFasting: ['07:35', '08:00'], fasting: null }, // skipped on fasting days
  { key: 'light-work', label: 'Light Work', dailyConstant: true,
    nonFasting: ['08:05', '08:50'], fasting: ['07:35', '08:20'] },
  { key: 'warmup', label: 'Warm-up', primed: true,
    nonFasting: ['08:55', '09:40'], fasting: ['08:25', '09:10'] },
  { key: 'skill', label: 'Skill Training', primed: true,
    nonFasting: ['09:45', '10:20'], fasting: ['09:15', '09:50'] },
  { key: 'reading', label: 'Reading', fixed: true,
    nonFasting: ['10:25', '10:55'], fasting: ['09:55', '10:25'] },
  { key: 'main-focus', label: 'Main Focus', capMinutes: 60,
    nonFasting: ['11:00', '12:00'], fasting: ['10:30', '11:30'] },
];

// Runs every day regardless of theme, with internal variation rather than
// a fixed single version — the "four daily constants" from the doc.
// Source: live "Light Work" calendar event description.
const DAILY_CONSTANTS = {
  label: 'Light Work — daily constants',
  items: [
    { name: 'Rings hanging', vary: ['dead hang', 'active hang', 'single-arm assisted', 'support hold'] },
    { name: 'Spinal waves', vary: [] },
    { name: 'Squats', vary: ['air', 'kettlebell goblet', 'box-assisted pistol', 'band-resisted'] },
    { name: 'Light flexibility & shaking', vary: [] },
  ],
};

// Week template: one entry per weekday. `mainFocus.tags` are the
// modalityTags (see data/library.js EXERCISE_TAGS / project_taxonomy_cleanup)
// the Main Focus block draws from. `priming.correlated` are the tags
// Warm-up/Skill Training draw from by default (primes Main Focus, per doc
// section 2); `priming.antiCorrelated` are the tags used when a chat
// override flips this specific day to lighter/unrelated warm-up content.
// `variants` is the A/B/C content-bank menu (manual pick within the day,
// per the "no auto-suggestion" rule carried over from the taxonomy work).
const WEEK_SCAFFOLD = {
  monday: {
    theme: 'Strength', fasting: false,
    mainFocus: { tags: ['weights'] },
    priming: {
      correlated:    { warmup: ['weighted-mobility', 'mobility-movement'], skill: ['calisthenics', 'gymnastics-conditioning'] },
      antiCorrelated:{ warmup: ['mobility-movement'], skill: ['coordination'] },
    },
    variants: null, // TODO: fill from live calendar event descriptions per block
  },
  tuesday: {
    theme: 'Zone2', fasting: true,
    mainFocus: { tags: ['cardio'], cardioMode: 'steady' },
    priming: {
      correlated:    { warmup: ['coordination'], skill: ['coordination'] },
      antiCorrelated:{ warmup: ['mobility-movement'], skill: ['flexibility'] },
    },
    variants: null,
  },
  wednesday: {
    theme: 'Interval Training + Power/Sprints', fasting: false,
    mainFocus: { tags: ['power-plyo', 'cardio'], cardioMode: 'intervals' },
    priming: {
      correlated:    { warmup: ['power-plyo'], skill: ['coordination', 'power-plyo'] },
      antiCorrelated:{ warmup: ['mobility-movement'], skill: ['flexibility'] },
    },
    variants: null,
  },
  thursday: {
    theme: 'Zone2', fasting: true,
    mainFocus: { tags: ['cardio'], cardioMode: 'steady' },
    priming: {
      correlated:    { warmup: ['coordination'], skill: ['coordination'] },
      antiCorrelated:{ warmup: ['mobility-movement'], skill: ['flexibility'] },
    },
    variants: null,
  },
  friday: {
    theme: 'Mobility/Plyometrics', fasting: false,
    mainFocus: { tags: ['mobility-movement', 'power-plyo'] },
    priming: {
      // Confirmed against the live "Warm-up — Mobility/Plyo prep" calendar
      // event: (A) band stretch + bear/crab crawl + yoga-block hip flow,
      // (B) knee-band activation + animal flow + spinal roll,
      // (C) yoga-block deep stretch + lizard crawl + shoulder CARs.
      correlated:    { warmup: ['mobility-movement', 'weighted-mobility'], skill: ['power-plyo'] },
      antiCorrelated:{ warmup: ['flexibility'], skill: ['coordination'] },
    },
    variants: {
      warmup: [
        { id: 'A', items: ['band stretch', 'bear/crab crawl (garden)', 'yoga-block hip flow'] },
        { id: 'B', items: ['knee-band activation', 'animal flow', 'spinal roll'] },
        { id: 'C', items: ['yoga-block deep stretch', 'lizard crawl', 'shoulder CARs'] },
      ],
    },
  },
  saturday: {
    theme: 'Strength', fasting: false,
    mainFocus: { tags: ['weights'] },
    priming: {
      correlated:    { warmup: ['weighted-mobility', 'mobility-movement'], skill: ['calisthenics', 'gymnastics-conditioning'] },
      antiCorrelated:{ warmup: ['mobility-movement'], skill: ['coordination'] },
    },
    variants: null,
  },
  sunday: {
    theme: 'Active Rest', fasting: true,
    mainFocus: { tags: ['mobility-movement', 'flexibility'] },
    priming: {
      correlated:    { warmup: ['mobility-movement'], skill: ['flexibility'] },
      antiCorrelated:{ warmup: ['mobility-movement'], skill: ['flexibility'] }, // already lightest day
    },
    variants: null,
  },
};

// Muscle-group/intensity rotation logic (project_taxonomy_cleanup) is
// intentionally NOT re-applied dynamically here — the week sequence above
// already spaces heavy stimulus (e.g. Power/Sprints Wed sits between two
// non-leg-heavy days; Strength Sat is followed by Active Rest Sun). Confirmed
// with the user 2026-08-06: don't build dynamic rotation recomputation
// against actual/overridden history for this feature.
