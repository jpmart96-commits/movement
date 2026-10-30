#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// tools/build-q4-plan.js — writes data/monthplan.js (the Q4 seed).
//
//   node tools/build-q4-plan.js          # rewrite data/monthplan.js
//   node tools/build-q4-plan.js --check  # print a week-by-week summary only
//
// The plan is data, but 92 days of it are easier to get right as rules
// than by hand: every load, protocol, skill line, coordination domain and
// test day below comes from the tables in this file. Change a table, run
// it, bump SEED_VERSION, and ensureSeeded() replaces the stored copy on the
// next boot.
// ─────────────────────────────────────────────────────────────
'use strict';
const fs = require('fs');
const path = require('path');

const SEED_VERSION = 8;
const FROM = '2026-09-27', TO = '2026-12-27';

// ── calendar helpers ──────────────────────────────────────────
const D = k => new Date(k + 'T12:00:00');
const key = d => { const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const add = (k, n) => { const d = D(k); d.setDate(d.getDate() + n); return key(d); };
const DOW = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const short = k => { const d = D(k); return `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
const dm = k => { const d = D(k); return `${d.getDate()} ${MON[d.getMonth()]}`; };

// Coordination rotation — same anchor and order as data/scaffold.js
// (26 Sep = vision), so the plan and Generator.coordDomainFor agree.
const COORD = ['vision', 'ball-reaction', 'balance', 'stick', 'objects', 'movement'];
const coordFor = k => COORD[((Math.round((D(k) - D('2026-09-26')) / 864e5) % 6) + 6) % 6];

// ── weeks and blocks ──────────────────────────────────────────
// 20–26 Sep ran on the previous plan and stay in it as history (week -1):
// four logged sessions tick those squares, and today's plan day doesn't
// change under a session that may already be open.
const HISTORY_DAYS = JSON.parse(fs.readFileSync(path.join(__dirname, 'q4-history-sep20-26.json'), 'utf8'));
const WEEKS = [
  { n: 0, label: 'Pre',  start: '2026-09-20', end: '2026-09-26', load: 'baseline', block: 0,
    intent: 'The last week of the previous plan, kept as history: the aerobic baseline (23 Sep, 4.40 km at avg 148) and the Strength B baseline (24 Sep) come from here.' },
  { n: 1,  label: 'Measure',   start: '2026-09-27', end: '2026-09-30', load: 'test',   block: 1,
    intent: 'Four days of measuring before the plan starts: coordination, mobility and the handstand/tumbling/L-sit checks on Sunday; the Strength A baseline and the pistol check on Monday; an easy bike and the muscle-up check on Tuesday; power and speed, then a max dead hang, on Wednesday. Every number set here is what the quarter is measured against.' },
  { n: 2,  label: 'Start',     start: '2026-10-01', end: '2026-10-04', load: 'build',  block: 1,
    intent: 'A short first week: long easy run, Strength B, the first 4x4 at the low end, light Sunday.' },
  { n: 3,  label: 'B1',   start: '2026-10-05', end: '2026-10-11', load: 'build',  block: 1,
    intent: 'First full week of the split. Strength at the baseline numbers; the 4x4 moves to 172–182. Skill work follows the rungs set on the measurement days.' },
  { n: 4,  label: 'B1',   start: '2026-10-12', end: '2026-10-18', load: 'build',  block: 1,
    intent: 'One step on squat, deadlift and press. Thursday\'s long run carries a fixed-HR check as a trend point.' },
  { n: 5,  label: 'Peak', start: '2026-10-19', end: '2026-10-25', load: 'peak',   block: 1,
    intent: 'Hardest week of the block: 4x4 at the full 175–186, 8 uphill sprints, dips 3x7.' },
  { n: 6,  label: 'Test', start: '2026-10-26', end: '2026-11-01', load: 'deload', block: 1,
    intent: 'Deload and retest. Strength A Monday, aerobic test Wednesday (the day after an easy bike), mobility tests Thursday, Strength B Friday, power and speed Saturday, coordination and skill checks Sunday.' },
  { n: 7,  label: 'Base',  start: '2026-11-02', end: '2026-11-08', load: 'build',  block: 2,
    intent: 'The Nov–Dec plan starts, and this week doubles as the baseline the September measure week never got: the wall handstand check after Strength A, the pancake and the other mobility tests after Tuesday\'s bike, the power tests on Wednesday, max dead hang after Strength B on Thursday. Saturday\'s 4x4 is the aerobic marker. Every session has one skill, and the days can be swapped freely: the skill travels with the session.' },
  { n: 8,  label: 'B2',   start: '2026-11-09', end: '2026-11-15', load: 'build',  block: 2,
    intent: 'First build week. On target means handstand ×3, pancake ×3 and hang ×2 by Sunday, in whatever order the week allows.' },
  { n: 9,  label: 'Peak', start: '2026-11-16', end: '2026-11-22', load: 'peak',   block: 2,
    intent: 'Peak week: 5x4, one step on squat, deadlift and press.' },
  { n: 10,  label: 'Check', start: '2026-11-23', end: '2026-11-29', load: 'deload', block: 2,
    intent: 'Lighter week and re-checks: pancake Tuesday, power and handstand Wednesday, hang Thursday. No 4x4: Saturday is an easy bike, Friday a light handstand day, and Sunday 29 is the first long easy run, 60 min under 153 with a fixed-HR window inside it.' },
  { n: 11, label: 'B3',   start: '2026-11-30', end: '2026-12-06', load: 'build',  block: 3,
    intent: 'Block 3 opens: power gets expressed — fewer, faster reps. The handstand work moves on to the kick-up and toe pulls once the chest-to-wall hold is in.' },
  { n: 12, label: 'B3',   start: '2026-12-07', end: '2026-12-13', load: 'build',  block: 3,
    intent: 'Threshold 4x8 replaces the 4x4 this week. Squat 67.5, deadlift 97.5.' },
  { n: 13, label: 'Peak', start: '2026-12-14', end: '2026-12-20', load: 'peak',   block: 3,
    intent: 'Last hard week before Christmas: 5x4, deadlift 100.' },
  { n: 14, label: 'Final',     start: '2026-12-21', end: '2026-12-27', load: 'test',   block: 3,
    intent: 'Final checks around Christmas. Tuesday\'s bike is traded for the second long run of the plan: 10 km under 153. Strength A Monday, power and the handstand check Wednesday, Strength B and the hang Thursday, mobility tests on Christmas Day if the morning allows, an easy bike Saturday, coordination and skill checks Sunday. Then read the two months and choose Q1.' },
];
const weekOf = k => WEEKS.find(w => w.n >= 1 && k >= w.start && k <= w.end);

const BLOCKS = [
  { n: 1, name: 'Foundations', weeks: '1-6', from: '2026-09-27', to: '2026-11-01',
    focus: ['handstand', 'ring-muscle-up', 'pistol-squat', 'cartwheel-roundoff',
            'cap-knee-to-wall', 'cap-dead-hang', 'cap-broad-jump', 'cap-balance-ec', 'cap-pancake', 'cap-fixed-hr'],
    aerobic: 'Learn to pace a 4x4 — the first interval is always too fast — and build the long run to 60 min under 153.',
    strength: 'One small step per lift, from the baseline numbers.',
    skill: 'Handstand at the wall (twice a week) with the cartwheel bail learned on Sundays; muscle-up is a pulling block; pistol works the ankle and the box.',
    capacities: 'Landing mechanics (snap-downs, stuck broad jumps), uphill sprints, ankles, hanging, and balance with the eyes closed.',
    hardPart: 'Not adding. The first block is about turning up six days a week with the heart rate where it belongs.' },
  { n: 2, name: 'Skills back in', weeks: '7-10', from: '2026-11-02', to: '2026-11-29',
    focus: ['handstand', 'cap-pancake', 'cap-dead-hang', 'cap-toe-touch', 'cap-knee-to-wall',
            'cap-vertical-jump', 'cap-sprint-20', 'cap-mb-throw', 'cap-fixed-hr'],
    aerobic: 'Zone 2 on the bike twice a week, one 4x4 run, and the first long easy run on 29 Nov.',
    strength: 'One step per lift from the October numbers. The deadlift stays at clean sets until the shoulder blade is quiet.',
    skill: 'Three pushed: handstand (wall line to chest-to-wall 45s, then the bail), pancake and hips, dead hang. Each session carries one of them; muscle-up, pistol, tumbling and L-sit wait.',
    capacities: 'Flat accelerations, low depth jumps, throws — short, on the handstand day.',
    hardPart: 'Doing the skill part when the session runs short. It is the one thing that got cut in October.' },
  { n: 3, name: 'Express', weeks: '11-14', from: '2026-11-30', to: '2026-12-27',
    focus: ['handstand', 'cap-pancake', 'cap-dead-hang', 'cap-broad-jump', 'cap-sprint-20', 'cap-reaction', 'cap-fixed-hr'],
    aerobic: '5x4 alternating with threshold 4x8; 10 km under 153 in the Christmas week.',
    strength: 'Second step, then the final check.',
    skill: 'Kick-ups and toe pulls once the chest-to-wall hold is in; hang to 90 s; pancake measured against the 3 Nov baseline.',
    capacities: 'Fewer, faster reps: full sprints, depth jumps, max throws.',
    hardPart: 'December. The final week lands on Christmas, so it is planned around it rather than pretending it isn\'t there.' },
];

// ── strength tables (week n → prescription) ───────────────────
const SQUAT   = { 1: 57.5, 3: 57.5, 4: 60, 5: 60, 6: 60, 7: 62.5, 8: 65, 9: 65, 10: 65, 11: 65, 12: 67.5, 13: 67.5, 14: 67.5 };
const INCLINE = { 1: 54, 3: 54, 4: 55, 5: 55, 6: 55, 7: 57.5, 8: 60, 9: 60, 10: 60, 11: 60, 12: 62.5, 13: 62.5, 14: 62.5 };
const PULL    = { 1: [4, 4], 3: [4, 5], 4: [3, 6], 5: [4, 6], 6: [3, 6], 7: [4, 5], 8: [4, 6], 9: [3, 7], 10: [3, 7], 11: [4, 7], 12: [3, 8], 13: [3, 8], 14: [3, 8] };
const T2B     = { 1: [3, 8], 3: [3, 8], 4: [3, 8], 5: [3, 10], 6: [2, 8], 7: [3, 10], 8: [3, 10], 9: [3, 12], 10: [2, 8], 11: [3, 12], 12: [3, 12], 13: [3, 12], 14: [2, 8] };
const DEAD    = { 2: 80, 3: 82.5, 4: 85, 5: 85, 6: 85, 7: 90, 8: 92.5, 9: 95, 10: 95, 11: 95, 12: 97.5, 13: 100, 14: 100 };
const OHP     = { 2: 32, 3: 34, 4: 35, 5: 35, 6: 35, 7: 35, 8: 35, 9: 36, 10: 36, 11: 37.5, 12: 37.5, 13: 38.5, 14: 38.5 };
const ROW     = { 2: 50, 3: 52, 4: 52, 5: 54, 6: 52, 7: 54, 8: 55, 9: 56, 10: 54, 11: 56, 12: 57.5, 13: 58, 14: 56 };
const DIPS    = { 2: [3, 6, 7.5], 3: [3, 6, 10], 4: [3, 6, 10], 5: [3, 7, 10], 6: [3, 6, 10], 7: [3, 6, 10], 8: [3, 7, 10], 9: [3, 6, 12.5], 10: [3, 6, 12.5],
                  11: [3, 7, 12.5], 12: [3, 6, 15], 13: [3, 6, 15], 14: [3, 6, 15] };
const RAMP = 'Ramp first: bar x8, ~50% x5, ~70% x3, then the work sets.';

function strengthA(w, test, firstSetMax) {
  const [ps, pr] = PULL[w], [ts, tr] = T2B[w];
  const ex = [
    { id: 'squat', name: 'Squat', sets: 3, reps: 5, loadKg: SQUAT[w], restSec: 180, note: RAMP },
    { id: 'incline-bench', name: 'Incline bench press', sets: 3, reps: 5, loadKg: INCLINE[w], restSec: 150 },
    w === 1
      ? { id: 'pull-up', name: 'Pull-up', sets: 4, reps: 4, restSec: 120, note: 'First set: max strict reps from a dead hang — log it, it\'s the pull-up baseline. Then 3 more sets of 4.' }
      : { id: 'pull-up', name: 'Pull-up', sets: ps, reps: pr, restSec: 120, note: firstSetMax ? `First set: max strict reps from a dead hang — the Nov–Dec baseline. Then ${ps - 1} more sets of ${pr}.` : 'Strict, full hang to chin over bar.' },
    { id: 'toes-to-bar', name: 'Toes to bar', sets: ts, reps: tr, restSec: 90 },
  ];
  const note = w === 1 ? 'Strength A baseline (the 21 Sep one was never logged). Log every set with RPE.'
    : test ? 'RETEST. Every prescribed set at the prescribed load in one session means the next block takes a step.'
    : 'Log every set with RPE.';
  return { exercises: ex, note };
}
function strengthB(w, test) {
  const [ds, dr, dk] = DIPS[w];
  const ex = [
    { id: 'deadlift', name: 'Deadlift', sets: 3, reps: 5, loadKg: DEAD[w], restSec: 180, note: RAMP },
    { id: 'overhead-press', name: 'Overhead press', sets: 3, reps: 5, loadKg: OHP[w], restSec: 150 },
    { id: 'cable-row', name: 'Seated cable row', sets: test ? 2 : 3, reps: 8, loadKg: ROW[w], restSec: 90, note: 'Wide grip, every session this quarter.' },
    { id: 'triceps-dip', name: 'Triceps dip', sets: ds, reps: dr, loadKg: dk, restSec: 120, note: `+${dk}kg on the belt.`, bodyweightPlus: true },
    { id: 'farmers-walk', name: "Farmer's walk", sets: test ? 2 : 3, rpe: 8, restSec: 90, distanceM: 40, note: '40 m. Heavy, posture holds.' },
  ];
  return { exercises: ex, note: test ? 'RETEST. Deadlift and press at the block target, 3x5, one session.'
    : w >= 7 ? 'Deadlift: clean sets only. If the shoulder blade talks, hold at 92.5–95 rather than taking the step.' : 'Keep the deadlift honest, not heavy.' };
}

// ── aerobic tables ────────────────────────────────────────────
const BIKE = { 1: 45, 3: 50, 4: 55, 5: 60, 6: 40, 7: 45, 8: 45, 9: 50, 10: 40, 11: 45, 12: 50, 13: 50, 14: 40 };
const LONG = { 2: 45, 3: 50, 4: 55, 5: 60, 6: 40, 7: 55, 8: 60, 9: 60, 10: 40, 11: 60, 12: 60 };
const CHECK_WEEKS = [4, 8, 12];            // long run carries the fixed-HR window
const QUALITY = {
  2:  { kind: '4x4', hr: [167, 175], note: 'Low end of the range on purpose: the first 4x4 is about not blowing up on interval 1. Record avg HR per bout.' },
  3:  { kind: '4x4', hr: [172, 182], note: 'All four bouts at the same speed — not a descending set.' },
  4:  { kind: '4x4', hr: [172, 182], note: 'Same range; bout-to-bout pace should now hold.' },
  5:  { kind: '4x4', hr: [175, 186], note: 'The full range for the first time.' },
  7:  { kind: '4x4', hr: [175, 186], note: 'Full range, and this week\'s aerobic marker: record avg HR and pace per bout. Raining? Do it on the bike, same structure and heart rates.' },
  8:  { kind: '4x4', hr: [175, 186], note: 'Same 4x4. Raining? Bike, same structure.' },
  9:  { kind: '5x4', hr: [175, 186], note: 'Extend to 5x4. Bout 5 matches bout 1 or the session ends at 4.' },
  11: { kind: '5x4', hr: [175, 186], note: '5x4. Raining? Bike, same structure.' },
  12: { kind: 'threshold', hr: [168, 178], note: 'Threshold: long, controlled, comfortably hard. Not a 4x4 in disguise.' },
  13: { kind: '5x4', hr: [175, 186], note: 'Last hard run before Christmas.' },
};
function qualityPlan(q) {
  if (q.kind === 'threshold') return { cardio: { exercise: { id: 'tempo-run', name: 'Tempo run' },
    protocol: { type: 'intervals', name: 'Threshold 4x8', warmupMin: 10, warmupHr: [118, 137], reps: 4, workMin: 8, workHr: q.hr, recoveryMin: 2, cooldownMin: 5 }, note: q.note } };
  const reps = q.kind === '5x4' ? 5 : 4;
  return { cardio: { exercise: { id: 'interval-run', name: 'Interval run' },
    protocol: { type: 'intervals', name: `Norwegian ${reps}x4`, warmupMin: 10, warmupHr: [118, 137], reps, workMin: 4, workHr: q.hr, recoveryMin: 3, cooldownMin: 5 }, note: q.note } };
}
const bikePlan = (min, note) => ({ cardio: { exercise: { id: 'z2-cycling', name: 'Zone 2 indoor cycling' },
  protocol: { type: 'steady', warmupMin: 5, mainMin: min - 10, cooldownMin: 5, hrMin: 134, hrMax: 153 }, note: note || 'Nose breathing throughout. If it breaks, slow down.' } });
const runPlan = (min, note) => ({ cardio: { exercise: { id: 'easy-run', name: 'Easy run' },
  protocol: { type: 'steady', mainMin: min, hrMax: 153, walkdownMin: 5 }, note: note || 'Continuous, strictly under 153. Walk the hills without negotiating.' } });
const checkRunPlan = (min, wk) => ({ cardio: { exercise: { id: 'easy-run', name: 'Easy run' },
  protocol: { type: 'fixed-hr-test', warmupMin: 10, testMin: 30, targetAvgHr: 148, hrCeiling: 156, easyMin: Math.max(0, min - 45), walkdownMin: 5 },
  note: `Fixed-HR check inside the long run (week ${wk}): minutes 10–40 at avg ~148, nothing above 156 — record that window's distance. Then easy under 153. A trend point; the retests are the clean comparison.` } });
const aerobicTest = (target) => ({ cardio: { exercise: { id: 'easy-run', name: 'Easy run' },
  protocol: { type: 'fixed-hr-test', warmupMin: 10, testMin: 30, targetAvgHr: 148, hrCeiling: 156, walkdownMin: 10 },
  note: `Same conditions as the 23 Sep baseline: home loop, morning, the day after an easy bike. Hold avg ~148, nothing above 156. Distance for minutes 10–40 is the number. Target ${target}.` } });

// ── plyo / power by block and week ────────────────────────────
function plyo(w) {
  const warm = { id: 'easy-run', name: 'Easy run', sets: 1, durationSec: 480, note: 'Build to HR ~140, then the drills in Mobility were the rest of the warm-up.' };
  const walk = { id: 'walking', name: 'Walking / hiking', sets: 1, durationSec: 300, note: 'Walk down.' };
  const B1 = {
    3: [{ id: 'uphill-sprints', name: 'Uphill sprint repeats', sets: 6, durationSec: 20, restSec: 90, note: '6 x 20s at 85–90%. Walk all the way down.' },
        { id: 'box-jump', name: 'Box jump', sets: 4, reps: 4, restSec: 90, note: 'Full reset every rep. Step down.' },
        { id: 'broad-jump', name: 'Broad jump', sets: 3, reps: 3, restSec: 90, note: 'Stick every landing.' },
        { id: 'med-ball-slams', name: 'Medicine ball slams', sets: 3, reps: 8, restSec: 60 }],
    4: [{ id: 'uphill-sprints', name: 'Uphill sprint repeats', sets: 7, durationSec: 20, restSec: 90, note: '7 x 20s at 90%.' },
        { id: 'box-jump', name: 'Box jump', sets: 5, reps: 3, restSec: 90 },
        { id: 'broad-jump', name: 'Broad jump', sets: 4, reps: 3, restSec: 90, note: 'Stick it. Measure the best one.' },
        { id: 'med-ball-back-throw', name: 'Med-ball overhead back throw', sets: 3, reps: 3, restSec: 90 }],
    5: [{ id: 'uphill-sprints', name: 'Uphill sprint repeats', sets: 8, durationSec: 20, restSec: 90, note: '8 x 20s at 90%.' },
        { id: 'box-jump', name: 'Box jump', sets: 5, reps: 3, restSec: 90 },
        { id: 'broad-jump', name: 'Broad jump', sets: 4, reps: 3, restSec: 90 },
        { id: 'med-ball-back-throw', name: 'Med-ball overhead back throw', sets: 4, reps: 3, restSec: 90 }],
  };
  const B2 = {
    7: [{ id: 'sprint-20m', name: 'Sprint — 20 m from standing', sets: 5, durationSec: 5, restSec: 150, note: 'Flat accelerations. Full rest — every rep fast or it doesn\'t count.' },
        { id: 'depth-jump', name: 'Depth jump', sets: 3, reps: 4, restSec: 90, note: 'Low box (30 cm). Step off, touch and go — minimal ground time.' },
        { id: 'vertical-jump', name: 'Vertical jump', sets: 3, reps: 3, restSec: 90, note: 'Jump and reach. Mark the wall.' },
        { id: 'med-ball-rotational', name: 'Med-ball rotational throw', sets: 3, reps: 5, restSec: 60, note: 'Each side, into a wall.' }],
    8: [{ id: 'sprint-20m', name: 'Sprint — 20 m from standing', sets: 6, durationSec: 5, restSec: 150 },
        { id: 'depth-jump', name: 'Depth jump', sets: 4, reps: 4, restSec: 90 },
        { id: 'vertical-jump', name: 'Vertical jump', sets: 3, reps: 3, restSec: 90 },
        { id: 'med-ball-back-throw', name: 'Med-ball overhead back throw', sets: 3, reps: 3, restSec: 90 },
        { id: 'med-ball-rotational', name: 'Med-ball rotational throw', sets: 3, reps: 5, restSec: 60 }],
    9: [{ id: 'uphill-sprints', name: 'Uphill sprint repeats', sets: 6, durationSec: 20, restSec: 90 },
        { id: 'sprint-20m', name: 'Sprint — 20 m from standing', sets: 4, durationSec: 5, restSec: 150 },
        { id: 'depth-jump', name: 'Depth jump', sets: 4, reps: 4, restSec: 90 },
        { id: 'broad-jump', name: 'Broad jump', sets: 3, reps: 3, restSec: 90 },
        { id: 'med-ball-back-throw', name: 'Med-ball overhead back throw', sets: 3, reps: 3, restSec: 90 }],
  };
  const B3 = {
    11: [{ id: 'sprint-20m', name: 'Sprint — 20 m from standing', sets: 6, durationSec: 5, restSec: 180, note: 'Max effort, full rest.' },
         { id: 'depth-jump', name: 'Depth jump', sets: 4, reps: 3, restSec: 120, note: '40 cm box if the 30 cm contacts were fast.' },
         { id: 'broad-jump', name: 'Broad jump', sets: 4, reps: 2, restSec: 120 },
         { id: 'med-ball-back-throw', name: 'Med-ball overhead back throw', sets: 4, reps: 2, restSec: 90 }],
    12: [{ id: 'uphill-sprints', name: 'Uphill sprint repeats', sets: 6, durationSec: 15, restSec: 120, note: 'Short and max.' },
         { id: 'sprint-20m', name: 'Sprint — 20 m from standing', sets: 4, durationSec: 5, restSec: 180 },
         { id: 'depth-jump', name: 'Depth jump', sets: 4, reps: 3, restSec: 120 },
         { id: 'vertical-jump', name: 'Vertical jump', sets: 3, reps: 2, restSec: 90 },
         { id: 'med-ball-rotational', name: 'Med-ball rotational throw', sets: 3, reps: 4, restSec: 60 }],
    13: [{ id: 'sprint-20m', name: 'Sprint — 20 m from standing', sets: 5, durationSec: 5, restSec: 180 },
         { id: 'depth-jump', name: 'Depth jump', sets: 3, reps: 3, restSec: 120 },
         { id: 'broad-jump', name: 'Broad jump', sets: 3, reps: 2, restSec: 120 },
         { id: 'med-ball-back-throw', name: 'Med-ball overhead back throw', sets: 3, reps: 2, restSec: 90 }],
  };
  // Nov–Dec: ~25 min of power. Mobility is the sprint prep, so no warm-up
  // run; three things per session, full rest kept where speed needs it.
  const ND = {
    8:  [{ id: 'sprint-20m', name: 'Sprint — 20 m from standing', sets: 5, durationSec: 5, restSec: 120, note: 'Flat accelerations. Two easy strides first. Every rep fast or it doesn\'t count.' },
         { id: 'depth-jump', name: 'Depth jump', sets: 3, reps: 4, restSec: 75, note: 'Low box (30 cm). Step off, touch and go.' },
         { id: 'med-ball-back-throw', name: 'Med-ball overhead back throw', sets: 3, reps: 3, restSec: 60 }],
    9:  [{ id: 'uphill-sprints', name: 'Uphill sprint repeats', sets: 6, durationSec: 15, restSec: 90, note: '6 x 15s at 90%. Walk down.' },
         { id: 'depth-jump', name: 'Depth jump', sets: 4, reps: 4, restSec: 75 },
         { id: 'broad-jump', name: 'Broad jump', sets: 3, reps: 3, restSec: 75, note: 'Stick every landing.' }],
    11: [{ id: 'sprint-20m', name: 'Sprint — 20 m from standing', sets: 6, durationSec: 5, restSec: 120, note: 'Max effort. Two easy strides first.' },
         { id: 'depth-jump', name: 'Depth jump', sets: 3, reps: 3, restSec: 90, note: '40 cm box if the 30 cm contacts were fast.' },
         { id: 'med-ball-back-throw', name: 'Med-ball overhead back throw', sets: 3, reps: 2, restSec: 75 }],
    12: [{ id: 'uphill-sprints', name: 'Uphill sprint repeats', sets: 5, durationSec: 15, restSec: 120, note: 'Short and max.' },
         { id: 'depth-jump', name: 'Depth jump', sets: 3, reps: 3, restSec: 90 },
         { id: 'vertical-jump', name: 'Vertical jump', sets: 3, reps: 2, restSec: 75, note: 'Jump and reach. Mark the wall.' }],
    13: [{ id: 'sprint-20m', name: 'Sprint — 20 m from standing', sets: 5, durationSec: 5, restSec: 150 },
         { id: 'depth-jump', name: 'Depth jump', sets: 3, reps: 3, restSec: 90 },
         { id: 'broad-jump', name: 'Broad jump', sets: 3, reps: 2, restSec: 90 }],
  };
  if (ND[w]) return { exercises: ND[w], note: 'Quality over volume. Stop a set the moment speed drops.' };
  const body = B1[w] || B2[w] || B3[w];
  return { exercises: [warm, ...body, walk], note: 'Quality over volume. Stop a set the moment speed drops.' };
}

// ── skill line by day type and block ──────────────────────────
// Follows the day type, not the weekday, so a moved day (Christmas week)
// keeps the line that belongs to its session.
function skillLine(dayType, w, blockN, dow) {
  // Nov–Dec: three skills pushed — handstand, pancake/hips, dead hang.
  // Each session carries one; the two bikes split pancake (Tue) and
  // handstand (Fri). Weekly target: handstand x3, pancake x3, hang x2.
  if (w >= 7) switch (dayType) {
    case 'strength-a': case 'strength-b': return 'hang-project';
    case 'z2-bike':      return dow === 'tuesday' || dow === 'saturday' ? 'pancake-hips' : 'handstand';
    case 'plyo-power':   return 'handstand';
    case 'quality-run':  return 'pancake-hips';
    case 'z2-run':       return 'hang-project';
    case 'light':        return dow === 'friday' ? 'handstand' : 'pancake-hips';
  }
  switch (dayType) {
    case 'strength-a':   return 'pistol';
    case 'z2-bike':      return 'handstand';
    case 'plyo-power':   return 'muscle-up-prep';
    case 'z2-run':       return 'handstand';
    case 'strength-b':   return 'pancake-hips';
    case 'quality-run':  return 'muscle-up-prep';
    case 'aerobic-test': return 'handstand';
    case 'light':        return blockN === 1 ? 'tumbling' : (w % 2 === 1 ? 'l-sit' : 'tumbling');
  }
  return null;
}

// ── minutes per block, Nov–Dec (~75–90 min days) ──────────────
// Keys are the skeleton's block keys; 0 drops the block. The skill block
// (accessory) gets real time on the easy days.
function blockMinutes(dayType, skill) {
  const M = (open, complementary, mobility, main, accessory, close) =>
    ({ open, complementary, mobility, 'main-focus': main, accessory, close });
  switch (dayType) {
    case 'strength-a': case 'strength-b': return M(10, 10, 10, 45, 15, 0);
    case 'z2-bike':    return skill === 'pancake-hips' ? M(10, 5, 0, 45, 30, 0) : M(10, 10, 0, 45, 20, 5);
    case 'plyo-power': return M(10, 15, 10, 30, 25, 0);
    case 'quality-run': return M(10, 5, 10, 40, 20, 5);
    case 'z2-run':     return M(10, 0, 5, 60, 10, 5);
    case 'light':      return M(15, 10, 15, 0, 25, 5);
  }
  return null;
}

// ── tests ─────────────────────────────────────────────────────
const T_COORD = ['cap-balance-ec', 'cap-juggle', 'cap-reaction'];
const T_MOB   = ['cap-knee-to-wall', 'cap-pancake', 'cap-toe-touch'];
const T_POWER = ['cap-broad-jump', 'cap-vertical-jump', 'cap-sprint-20', 'cap-mb-throw'];
const T_HANG  = ['cap-dead-hang'];
const T_SKILL_SUN = ['handstand', 'cartwheel-roundoff', 'l-sit-v-sit'];

// Special days: date → overrides. Everything else follows its weekday.
const AEROBIC_TARGET = { 6: '4.53 km or more', 10: '4.66 km or more', 14: '4.80 km (4.75–4.93)' };
const SPECIAL = {
  // Week 0 — measure
  '2026-09-27': { dayType: 'light', theme: 'Measure — coordination & mobility', load: 'test',
    tests: { complementary: T_COORD, mobility: T_MOB, accessory: T_SKILL_SUN },
    note: 'Measurement day 1. Complementary is the coordination tests, Mobility the three mobility tests, Accessory the handstand, tumbling and L-sit checks — try your rung and the next ones, and mark the first you can\'t pass yet. Every number goes in with Record.' },
  '2026-09-28': { dayType: 'strength-a', theme: 'Strength A — baseline', load: 'test', tests: { accessory: ['pistol-squat'] },
    note: 'Measurement day 2. The Strength A baseline, with a max-rep set of pull-ups first. Accessory is the pistol check.' },
  '2026-09-29': { dayType: 'z2-bike', theme: 'Zone 2 bike + muscle-up check', load: 'test', bike: 45, tests: { accessory: ['ring-muscle-up'] },
    note: 'Measurement day 3. An easy bike, then the muscle-up check: max false grip hang, max strict ring pull-ups.' },
  '2026-09-30': { dayType: 'plyo-power', theme: 'Measure — power & speed', load: 'test', tests: { main: T_POWER, accessory: T_HANG },
    note: 'Measurement day 4. Mobility is the sprint warm-up — do all of it. Then broad jump, vertical jump, 20 m sprint, med-ball throw, full rest between. Max dead hang last.' },

  // Week 5 — block 1 retest
  '2026-10-26': { test: 'A', tests: null },
  '2026-10-27': { bike: 40, tests: { accessory: ['ring-muscle-up'] }, note: 'Easy, and short on purpose: tomorrow is the aerobic test. Accessory is the muscle-up check.' },
  '2026-10-28': { dayType: 'aerobic-test', theme: 'Aerobic retest', load: 'test', aerobic: 6 },
  '2026-10-29': { long: 40, tests: { mobility: T_MOB, accessory: ['pistol-squat'] }, note: 'Easy 40. Mobility is the three mobility tests (after Open and Complementary, so you\'re warm); Accessory the pistol check.' },
  '2026-10-30': { test: 'B' },
  '2026-10-31': { dayType: 'plyo-power', theme: 'Retest — power & speed', load: 'test', tests: { main: T_POWER, accessory: T_HANG },
    note: 'Block 1 power and speed retest, same order and method as 30 Sep. Max dead hang last.' },
  '2026-11-01': { dayType: 'light', theme: 'Retest — coordination & skills', load: 'test', tests: { complementary: T_COORD, accessory: T_SKILL_SUN },
    note: 'Coordination tests in Complementary; handstand, tumbling and L-sit checks in Accessory. Then look at Progress: every number from block 1 is in.' },

  // Week 7 — the Nov–Dec baseline, inside normal sessions
  '2026-11-02': { tests: { accessory: ['handstand'] }, firstSetMax: true,
    note: 'Nov–Dec plan, day 1. First pull-up set is max strict reps from a dead hang; Accessory is the wall handstand check — try your rung and the next, mark the first you can\'t pass yet.' },
  '2026-11-03': { tests: { accessory: T_MOB },
    note: 'Baseline: the pancake (cm), knee-to-wall and toe touch go in Accessory, after the bike, while you\'re warm. These are the numbers December is measured against.' },
  '2026-11-04': { theme: 'Baseline — power & speed', tests: { main: T_POWER },
    note: 'Baseline power tests: broad jump, vertical jump, 20 m sprint, med-ball throw, full rest between. Then the handstand block — or do it first while fresh.' },
  '2026-11-05': { tests: { accessory: T_HANG }, note: 'Baseline: max dead hang in Accessory, after the lifts.' },
  '2026-11-08': { tests: { complementary: T_COORD }, note: 'Optional: the coordination tests in Complementary. Pancake work in Accessory, then 5 min at the wall.' },

  // Week 10 — lighter, re-checks, first long run
  '2026-11-23': { test: 'A' },
  '2026-11-24': { bike: 40, tests: { accessory: T_MOB }, note: 'Re-check: pancake, knee-to-wall, toe touch in Accessory, against 3 Nov.' },
  '2026-11-25': { theme: 'Re-check — power & handstand', tests: { main: T_POWER, accessory: ['handstand'] },
    note: 'Power re-check, same order as 4 Nov. Then the handstand check in Accessory.' },
  '2026-11-26': { test: 'B', tests: { accessory: T_HANG }, note: 'Strength B at the block numbers. Max dead hang in Accessory.' },
  '2026-11-27': { dayType: 'light', theme: 'Light — handstand',
    note: 'Light day in place of the bike. Handstand in Accessory, long holds in Mobility.' },
  '2026-11-28': { dayType: 'z2-bike', bike: 40, note: 'Easy bike instead of the 4x4 — tomorrow is the long run. Pancake work after.' },
  '2026-11-29': { dayType: 'z2-run', theme: 'Long easy run — 60 min', longCheck: 60,
    note: 'The first long easy run of the plan, in place of a bike. 60 min under 153, with the fixed-HR window inside it (minutes 10–40 at avg ~148). Raining? Move it to the next dry day and bike today.' },

  // Week 14 — final, planned around Christmas
  '2026-12-21': { test: 'A', note: 'Final week. Strength A at the final numbers, every prescribed set in one session.' },
  '2026-12-22': { dayType: 'z2-run', theme: '10 km under 153', tenK: true, load: 'test' },
  '2026-12-23': { theme: 'Final — power & handstand', load: 'test', tests: { main: T_POWER, accessory: ['handstand'] },
    note: 'Final power tests, same order as 4 Nov. Then the handstand check.' },
  '2026-12-24': { test: 'B', tests: { accessory: T_HANG }, theme: 'Strength B — final', note: 'Final Strength B. Max dead hang in Accessory.' },
  '2026-12-25': { dayType: 'light', theme: 'Christmas — light + mobility tests', load: 'test', tests: { accessory: T_MOB },
    note: 'Christmas Day. The pancake and mobility tests in Accessory if the morning allows — otherwise Sunday.' },
  '2026-12-26': { dayType: 'z2-bike', bike: 40, note: 'Easy bike. Pancake work after.' },
  '2026-12-27': { dayType: 'light', theme: 'Final — coordination & skills', load: 'test', tests: { complementary: T_COORD, accessory: ['handstand'] },
    note: 'The last checks. Then read the two months on Progress and choose Q1.' },
};

// ── build the days ────────────────────────────────────────────
const TYPE_BY_DOW = { monday: 'strength-a', tuesday: 'z2-bike', wednesday: 'plyo-power', thursday: 'z2-run', friday: 'strength-b', saturday: 'quality-run', sunday: 'light' };
// Nov–Dec default order. Any day can be swapped (rain, sore legs); the
// skill travels with the session. Spacing: A and B never on consecutive
// days; no power or 4x4 the day after heavy legs.
const TYPE_BY_DOW_ND = { monday: 'strength-a', tuesday: 'z2-bike', wednesday: 'plyo-power', thursday: 'strength-b', friday: 'z2-bike', saturday: 'quality-run', sunday: 'light' };
const THEME = { 'strength-a': 'Strength A', 'z2-bike': 'Zone 2 bike', 'plyo-power': 'Plyo · Power · Sprints', 'z2-run': 'Zone 2 long run',
  'strength-b': 'Strength B', 'quality-run': 'Intervals / Tempo', 'light': 'Light', 'aerobic-test': 'Aerobic retest' };

const summarize = mfp => {
  if (!mfp) return '';
  if (mfp.cardio) {
    const p = mfp.cardio.protocol;
    if (p.type === 'intervals') return `${p.name}: ${p.reps} x ${p.workMin}min at ${p.workHr[0]}-${p.workHr[1]}, ${p.recoveryMin}min easy between.`;
    if (p.type === 'fixed-hr-test') return `${p.warmupMin}min build, 30min at avg ~${p.targetAvgHr} (nothing above ${p.hrCeiling})${p.easyMin ? ', then ' + p.easyMin + 'min easy' : ''}.`;
    if (p.type === 'steady') return `${(p.warmupMin || 0) + p.mainMin + (p.cooldownMin || 0)}min${p.hrMin ? ' at ' + p.hrMin + '-' + p.hrMax : ' under ' + p.hrMax}.`;
    return '';
  }
  return mfp.exercises.map(e => {
    const dose = e.reps ? `${e.sets}x${e.reps}` : e.durationSec ? (e.sets === 1 && e.durationSec >= 120 ? `${Math.round(e.durationSec / 60)}min` : `${e.sets}x${e.durationSec}s`) : e.distanceM ? `${e.sets}x${e.distanceM}m` : `${e.sets}`;
    return `${e.name} ${dose}${e.loadKg != null ? (e.bodyweightPlus ? ' +' + e.loadKg + 'kg' : ' @' + e.loadKg) : ''}`;
  }).join(', ') + '.';
};

const days = [];
for (let k = FROM; k <= TO; k = add(k, 1)) {
  const wk = weekOf(k);
  const dow = DOW[D(k).getDay()];
  const sp = SPECIAL[k] || {};
  const dayType = sp.dayType || (weekOf(k).n >= 7 ? TYPE_BY_DOW_ND : TYPE_BY_DOW)[dow];
  const blockN = BLOCKS.find(b => k >= b.from && k <= b.to).n;
  const testWeek = wk.load === 'deload' || wk.n === 14;
  const load = sp.load || (testWeek && (sp.test || dayType === 'aerobic-test') ? 'test' : wk.load);
  const day = {
    date: k, weekday: dow, week: wk.n,
    theme: sp.theme || THEME[dayType],
    variant: dayType === 'light' ? 'light' : 'standard',
    // Nov–Dec: the power day's Complementary is always ball and reaction
    // (keepie-uppies live there); the rest keep the rotation.
    coordDomain: wk.n >= 7 && dayType === 'plyo-power' ? 'ball-reaction' : coordFor(k),
    load, dayType,
    skillLine: skillLine(dayType, wk.n, blockN, dow),
  };
  if (wk.n >= 7) {
    const bm = blockMinutes(dayType, day.skillLine); if (bm) day.blockMinutes = bm;
    // The light day's pancake block ends with 5 min of wall handstand, so a
    // default week reaches handstand x3 (Wed, Fri, Sun).
    if (dayType === 'light' && day.skillLine === 'pancake-hips') day.skillFinisher = 'handstand';
  }
  let mfp = null, note = '';
  const w = wk.n;
  if (dayType === 'strength-a') {
    const r = strengthA(w, !!sp.test, !!sp.firstSetMax);
    mfp = { exercises: r.exercises, note: r.note };
  } else if (dayType === 'strength-b') {
    const r = strengthB(w, !!sp.test);
    mfp = { exercises: r.exercises, note: r.note };
  } else if (dayType === 'z2-bike') {
    const min = sp.bike || BIKE[w] || 50;
    mfp = bikePlan(min);
  } else if (dayType === 'z2-run') {
    if (sp.tenK) {
      mfp = { cardio: { exercise: { id: 'easy-run', name: 'Easy run' }, protocol: { type: 'steady', mainMin: 75, hrMax: 153, walkdownMin: 5 },
        note: '10 km continuous, heart rate under 153 the whole way. Walk the hills if that is what it takes. The time is whatever it is — 68–78 min is the honest expectation.' } };
      note = 'THE 10 KM. Under 153 the whole way — the pace doesn\'t matter today, the heart rate does. Raining? Move it to the next dry day.';
      day.blockMinutes = { open: 10, complementary: 0, mobility: 5, 'main-focus': 80, accessory: 0, close: 5 };
    } else if (sp.longCheck) mfp = checkRunPlan(sp.longCheck, w);
    else if (CHECK_WEEKS.includes(w)) mfp = checkRunPlan(LONG[w], w);
    else mfp = runPlan(sp.long || LONG[w] || 50);
  } else if (dayType === 'quality-run') {
    mfp = qualityPlan(QUALITY[w]);
  } else if (dayType === 'plyo-power') {
    mfp = sp.tests && sp.tests.main ? null : plyo(w);
  } else if (dayType === 'aerobic-test') {
    mfp = aerobicTest(AEROBIC_TARGET[sp.aerobic]);
    note = `AEROBIC ${w === 14 ? 'FINAL TEST' : 'RETEST'}. ${mfp.cardio.note}`;
  }
  if (mfp) day.mainFocusPlan = mfp;
  if (sp.tests) day.tests = sp.tests;
  if (!note) {
    const body = mfp ? summarize(mfp) : '';
    const tail = mfp && mfp.cardio ? mfp.cardio.note : (mfp && mfp.note) || '';
    if (sp.note) note = sp.note + (body ? ' Main Focus: ' + body : '');
    else if (dayType === 'light' && w >= 7) note = day.skillLine === 'handstand'
      ? 'No main focus. Handstand in Accessory, long holds in Mobility.'
      : 'No main focus. Pancake and hips in Accessory, long holds in Mobility — then finish with 5 min of wall handstand.';
    else if (dayType === 'plyo-power' && w >= 7) note = [body, 'Handstand is this day\'s skill: the app puts it after the power work, but do it first while fresh if you prefer.'].filter(Boolean).join(' ');
    else if (dayType === 'light') note = day.skillLine === 'l-sit' ? 'No main focus. L-sit and compression in Accessory, long holds in Mobility.' : 'No main focus. Tumbling in Accessory — rolls, cartwheels, the bail — and long holds in Mobility.';
    else note = [body, tail].filter(Boolean).join(' ');
  }
  day.focusNote = note;
  day.benchmark = !!(sp.tests || sp.tenK || sp.longCheck || dayType === 'aerobic-test' || (dayType === 'z2-run' && w < 7 && CHECK_WEEKS.includes(w)));
  days.push(day);
}

// ── targets ───────────────────────────────────────────────────
const R1 = '2026-11-01', R2 = '2026-11-29', R3 = '2026-12-27', ND = '2026-11-02';
const goalTargets = {
  // Ladders: the rung to be on (index) by each check.
  // Nov–Dec pushes three: handstand, pancake, dead hang.
  'handstand':          [{ by: R1, rung: 3, note: 'Bail + kick-up to the wall' }, { by: R2, rung: 3, note: 'Chest-to-wall 45s in, then the bail and kick-up' }, { by: R3, rung: 4, note: 'Toe pulls; stretch: freestanding tuck 5s' }],
  // Not pushed this block — targets from block 1 kept as history.
  'ring-muscle-up':     [{ by: R1, rung: 1 }],
  'pistol-squat':       [{ by: R1, rung: 3 }],
  'cartwheel-roundoff': [{ by: R1, rung: 2, note: 'The bail — the handstand needs it' }],
  'l-sit-v-sit':        [{ by: R1, rung: 1 }],
  // Benchmarks. Relative ones resolve against the latest baseline before
  // the target (Nov–Dec: the 2–8 Nov week).
  'cap-broad-jump':     [{ by: R1, pct: 3 }, { by: R2, baseFrom: ND, pct: 3 }, { by: R3, baseFrom: ND, pct: 6 }],
  'cap-vertical-jump':  [{ by: R1, delta: 2 }, { by: R2, baseFrom: ND, delta: 1 }, { by: R3, baseFrom: ND, delta: 3 }],
  'cap-sprint-20':      [{ by: R1, delta: 0.05 }, { by: R2, baseFrom: ND, delta: 0.05 }, { by: R3, baseFrom: ND, delta: 0.1 }],
  'cap-mb-throw':       [{ by: R1, delta: 0.3 }, { by: R2, baseFrom: ND, delta: 0.3 }, { by: R3, baseFrom: ND, delta: 0.6 }],
  'cap-dead-hang':      [{ by: R1, value: 60 }, { by: R2, value: 75 }, { by: R3, value: 90 }],
  'cap-knee-to-wall':   [{ by: R1, delta: 1 }, { by: R2, baseFrom: ND, delta: 1 }, { by: R3, baseFrom: ND, delta: 2 }],
  'cap-pancake':        [{ by: R1, delta: 3 }, { by: R2, baseFrom: ND, delta: 3 }, { by: R3, baseFrom: ND, delta: 6 }],
  'cap-toe-touch':      [{ by: R1, delta: 2 }, { by: R2, baseFrom: ND, delta: 2 }, { by: R3, baseFrom: ND, delta: 4 }],
  'cap-balance-ec':     [{ by: R1, delta: 5 }, { by: R3, baseFrom: ND, delta: 10 }],
  'cap-juggle':         [{ by: R1, pct: 50, min: 5 }, { by: R3, baseFrom: ND, pct: 100, min: 15 }],
  'cap-reaction':       [{ by: R1, delta: 10 }, { by: R3, baseFrom: ND, delta: 15 }],
  'cap-fixed-hr':       [{ by: '2026-10-28', value: 4.53 }, { by: R2, value: 4.66 }, { by: '2026-12-22', value: 4.80 }],
};

// Strength + engine targets in the prose shape Progress already parses.
const targets = [
  { metric: 'Squat 3x5',              from: '63.5x8 (Oct)',             to: '65 by 23 Nov · 67.5 by 21 Dec' },
  { metric: 'Deadlift 3x5',           from: '98x4 (Oct)',               to: '95 by 26 Nov · 100 by 24 Dec, clean sets only' },
  { metric: 'Incline bench 3x5',      from: '59.5x5 (Oct)',             to: '60 by 23 Nov · 62.5 by 21 Dec' },
  { metric: 'Overhead press 3x5',     from: '35x6 (Oct)',               to: '36 by 26 Nov · 38.5 by 24 Dec' },
  { metric: 'Pull-ups',               from: '7/6/5/5 strict',           to: '3x7 by 23 Nov · 3x8 by 21 Dec' },
  { metric: 'Dips',                   from: '+10kg x8',                 to: '3x6 +12.5kg by 26 Nov · 3x6 +15kg by 24 Dec' },
  { metric: 'Dead hang',              from: '52s',                      to: '75s by 26 Nov · 90s by 24 Dec' },
  { metric: 'Fixed-HR 30min (avg 148)', from: '4.40km (23 Sep)',        to: '4.66 inside the 29 Nov long run · 4.80 by 22 Dec' },
  { metric: '10km continuous',        from: 'not attempted',            to: 'under 153 the whole way, 22 Dec' },
];

const seed = {
  seedVersion: SEED_VERSION,
  title: 'Q4 — Engine, strength, athletic base',
  blockStart: HISTORY_DAYS[0].date, blockEnd: TO,
  spine: ['aerobic engine', 'strength'],
  support: ['capacities: power, speed, mobility, balance, grip', 'skills (Nov–Dec): handstand, pancake/hips, dead hang', 'practice: vision, ball and reaction, stick, objects, movement, yoga'],
  horizon: '12 months: 10km in 60min held in zone 2; handstand; pancake; muscle-up; 2-3min dead hang — and measurably more athletic: jump, sprint, balance.',
  hrZones: { z1: 133, z2: 153, z3: 168, z4: 182,
    note: 'Karvonen from RHR 54 / max 196. Easy work means at or under 153. 4x4 work intervals live at 167-186 (85-95% of max).' },
  quarter: {
    from: FROM, to: TO, weeks: 13,
    premise: 'Never trained consistently; good raw endurance but inefficient. Push strength ahead of pull. Until this revision the quarter had two spines and a list of ladders nobody read; the capacities that make someone athletic — jumping, sprinting, balance, ankles — had no number at all.',
    spine: 'Aerobic engine and strength stay the spine. Around them, every goal now has a kind: skills climb ladders inside the Accessory block, capacities are measured at the start and retested at the end of every block, and practices are tracked by how often they happen.',
    qualityDayRule: 'One quality run a week (Saturday by default); Wednesday\'s sprints and jumps are the second hard day. Nov–Dec: 4x4, then 5x4, one threshold 4x8 in December. Other aerobic work stays on the bike, with one long easy run a month in place of a ride.',
    interferenceRule: 'Strength moves one small step per block. If the quality sessions land and a lift stalls, let it stall.',
    testRule: 'Every test runs the same protocol, in the same slot of the same kind of day, each time. The numbers are only comparable because nothing else moved.',
    blocks: BLOCKS,
    // Nov–Dec: the week is on target when these many sessions carried each
    // skill, whatever order the days ran in. The Today screen counts them.
    weeklySkillTargets: { from: '2026-11-02', handstand: 3, 'pancake-hips': 3, 'hang-project': 2 },
    sessionMinutes: '75–90',
    swapRule: 'Any day can be swapped for another (rain, sore legs) and the skill travels with the session. Raining on the 4x4: do it on the bike, same structure and heart rates; a long run moves to the next dry day. Strength A and B never on consecutive days; no power or 4x4 the day after heavy legs.',
    assessmentWeek: { n: 14, from: '2026-12-21', to: '2026-12-27',
      intent: 'Final tests around Christmas, then decide Q1\'s spine from the numbers.' },
  },
  goalTargets,
  targets,
  weeks: WEEKS.map(({ block, ...w }) => ({ ...w, block })),
  days: [...HISTORY_DAYS, ...days],
};

// ── write ─────────────────────────────────────────────────────
if (process.argv.includes('--check')) {
  WEEKS.forEach(w => {
    console.log(`\nWeek ${w.n} · ${w.label} (${dm(w.start)}–${dm(w.end)})`);
    days.filter(d => d.week === w.n).forEach(d => console.log(`  ${short(d.date).padEnd(11)} ${d.theme.padEnd(36)} ${String(d.skillLine).padEnd(15)} ${d.coordDomain.padEnd(14)} ${d.tests ? 'TESTS ' + Object.entries(d.tests).map(([s, l]) => s + ':' + l.length).join(' ') : ''}`));
  });
  process.exit(0);
}

const header = `// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — DATA LAYER
// monthplan.js — the quarter the app fills in day by day.
//
// GENERATED by tools/build-q4-plan.js — edit the tables there and re-run,
// don't hand-edit the days below.
//
// Revision 30 Oct 2026 (seedVersion 8) — the Nov–Dec plan, weeks 7–14:
//   - Days of ~75–90 min: day.blockMinutes sizes each block (0 drops one).
//   - Three skills pushed — handstand, pancake/hips, dead hang. Each session
//     carries one (Strength A/B hang · Tue bike pancake · Wed power and Fri
//     bike handstand · Sat 4x4 and Sun light pancake). Weekly target in
//     quarter.weeklySkillTargets: handstand x3, pancake x3, hang x2.
//   - Default order Mon A · Tue bike · Wed power + ball/reaction · Thu B ·
//     Fri bike · Sat 4x4 · Sun light; days swap freely.
//   - 2–8 Nov is the baseline inside normal sessions; 23–29 Nov lighter with
//     re-checks and the first long easy run (29 Nov); 22 Dec 10 km.
//   - Muscle-up, pistol, tumbling, L-sit not pushed.
//   - Weeks 1–6 (27 Sep – 1 Nov) unchanged: they are history.
// Revision 27 Sep 2026 (seedVersion 7) — the goals revamp:
//   - The quarter restarts: 27–30 Sep are measurement days, 1 Oct – 27 Dec
//     is three 4-week blocks, each ending in a retest week (26 Oct, 23 Nov,
//     21 Dec). The final week is planned around Christmas.
//   - Goals have kinds (data/goals.js): ladders, benchmarks, practices.
//     quarter.blocks[].focus names the goals each block is for; the
//     generator draws exercises that feed them first. goalTargets holds
//     what each should reach by each retest. day.tests schedules the tests
//     into a slot of the day (main, complementary, mobility, accessory).
//   - Skill lines are rung-driven: the Accessory block practises the rung
//     you are on. Mon pistol · Tue/Thu handstand · Wed/Sat muscle-up ·
//     Fri pancake & hips · Sun tumbling (block 1), then tumbling / L-sit.
//   - Strength keeps the one-step-per-block rule from the earlier passes;
//     the aerobic line keeps the 23 Sep baseline (4.40 km at avg 148).
// Earlier revisions (20–26 Sep, seedVersions 1–6) are in git history.
// ─────────────────────────────────────────────────────────────

const MONTH_PLAN_SEED = `;
const out = header + JSON.stringify(seed, null, 2) + ';\n';
const target = path.join(__dirname, '..', 'data', 'monthplan.js');
fs.writeFileSync(target, out);
console.log(`wrote ${target}: ${days.length} days, ${WEEKS.length} weeks, seedVersion ${SEED_VERSION}`);
