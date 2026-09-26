// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — GOALS
// data/goals.js — what the practice is building, in one model.
//
// Added 27 Sep 2026 (Q4 revamp). Before this, goals were a list of skill
// ladders (data/library.js GOALS) that nothing read: the generator never
// looked at them, the month plan quoted them in prose, and the Progress
// card showed six of them in a corner. Now every goal has a kind, and each
// kind has a job in the plan:
//
//   ladder     A skill with rungs (handstand, muscle-up, pistol, tumbling,
//              L-sit). The rung you are on decides what the day's Accessory
//              & Skill block practises — move the dot on Progress and the
//              next session changes. Rungs live on the GOALS entries so the
//              editor, the rung sheet and profile.goalMilestones keep working.
//   benchmark  A measured number (broad jump, knee-to-wall, dead hang …).
//              Retested at the end of each block on a scheduled test day,
//              recorded from the test itself or from Progress. Exercises that
//              feed it are drawn first wherever they are already candidates.
//   practice   Worth doing, not worth measuring (vision, stick, objects,
//              movement practice, yoga). Tracked by how often it happens.
//
// Engine (fixed-HR test, Z2 speed and drift, resting HR) and Strength (the
// lifts) keep their own Progress cards; the fixed-HR test is also defined
// here as a benchmark so the plan can schedule and target it like the rest.
//
// The plan (data/monthplan.js) owns the dates: which goals each block
// focuses on (quarter.blocks[].focus), what each should reach by when
// (goalTargets), and which days test what (day.tests).
//
// Loaded after complementary.js (needs LIBRARY, SKILL_LINES, Complementary).
// ─────────────────────────────────────────────────────────────

// ── 1. EXERCISES THE LADDERS AND TESTS NEED ──────────────────
const _gx = (id, name, category, subcategory, family, roles, tier, logType, restGroup, equipment, notes, extra = {}) => ({
  id, name, modality: [], category, subcategory,
  modalityTags: extra.modalityTags || ['calisthenics'],
  difficulty: extra.difficulty || 2, energy: extra.energy || 'Med', segment: extra.segment || 'skill',
  goals: extra.goals || [], equipment, frequency: '',
  restGroup, intensityTier: tier, logType, notes,
  instructions: extra.instructions || '',
  link: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(extra.search || (name + ' tutorial')),
  defaultState: 'active',
  ...(family ? { family, roles } : {}),
  ...(extra.dose ? { dose: extra.dose } : {}),
  ...(typeof extra.perSide === 'boolean' ? { perSide: extra.perSide } : {}),
});

const GOAL_EXERCISES = [
  // Pistol ladder
  _gx('single-leg-box-squat', 'Single-leg box squat', 'Body Movement', 'Single-leg', 'D7', ['practice', 'develop'], 'moderate', 'reps', 'skill', ['Bench'],
    'Touch the box, don\'t sit and rock. Lower the box as it gets easy.', { goals: ['pistol-squat'], perSide: true,
      dose: { sets: 3, reps: 5, restSec: 60, perSide: true },
      instructions: '1. Stand on one leg in front of a box or bench, the other leg held off the floor in front.\n2. Sit back under control until you touch the box.\n3. Stand back up on the same leg without rocking.\n4. High box first; lower it until it is below knee height.' }),
  _gx('shrimp-squat', 'Shrimp squat', 'Body Movement', 'Single-leg', 'D7', ['practice', 'develop'], 'moderate', 'reps', 'skill', [],
    'Back knee touches a pad. Front heel stays down.', { goals: ['pistol-squat'], perSide: true,
      dose: { sets: 3, reps: 5, restSec: 60, perSide: true },
      instructions: '1. Stand on one leg, bend the other behind you and hold that foot with the same-side hand.\n2. Lower until the back knee touches a pad on the floor.\n3. Stand up without letting the back knee bounce.' }),
  _gx('assisted-pistol', 'Assisted pistol squat', 'Body Movement', 'Single-leg', 'D7', ['practice', 'develop'], 'moderate', 'reps', 'skill', [],
    'Hold a TRX, band, doorframe or post. As little help as possible, and only on the way up.', { goals: ['pistol-squat'], perSide: true,
      dose: { sets: 3, reps: 5, restSec: 75, perSide: true } }),
  _gx('pistol-squat-rep', 'Pistol squat', 'Body Movement', 'Single-leg', 'D7', ['practice', 'develop'], 'heavy', 'reps', 'skill', [],
    'Full depth, free leg straight out in front, working heel flat, no support.', { goals: ['pistol-squat'], perSide: true,
      dose: { sets: 3, reps: 3, restSec: 90, perSide: true } }),
  // Muscle-up ladder
  _gx('false-grip-pullup', 'False grip ring pull-up', 'Rings', 'Pulling', 'D4', ['practice', 'develop'], 'heavy', 'reps', 'rings', ['Rings'],
    'Set the false grip before you leave the floor and keep it to the top. Pull the rings to the lower chest.', { goals: ['ring-muscle-up'],
      dose: { sets: 4, reps: 2, restSec: 120 } }),
  // Handstand + tumbling
  _gx('hs-toe-pulls', 'Handstand — toe pulls off the wall', 'Body Movement', 'Handstand', 'D5', ['practice'], 'moderate', 'reps', 'skill', ['Wall'],
    'Chest to wall, then pull the toes off it by pressing through the fingers, and hold the balance 1–3s.', { goals: ['handstand'],
      dose: { sets: 4, reps: 3, restSec: 60 }, search: 'handstand toe pulls wall drill' }),
  _gx('cartwheel-bail', 'Cartwheel bail', 'Body Movement', 'Tumbling', 'E3', ['practice'], 'moderate', 'reps', 'skill', [],
    'From a small kick-up, turn one hand out and step down sideways into a cartwheel. The exit that makes freestanding practice safe.', { goals: ['handstand', 'cartwheel-roundoff'],
      perSide: true, dose: { sets: 3, reps: 4, restSec: 45, perSide: true }, search: 'handstand cartwheel bail out' }),
  // Test movements
  _gx('sprint-20m', 'Sprint — 20 m from standing', 'Power', 'Sprint', null, null, 'explosive', 'hold', 'power', [],
    'Split-stance start, maximal. Full rest between efforts.', { modalityTags: ['power-plyo'], energy: 'High', segment: 'main',
      dose: { sets: 3, durationSec: 5, restSec: 180 }, search: 'acceleration sprint technique 20m' }),
  _gx('med-ball-back-throw', 'Med-ball overhead back throw', 'Power', 'Throws', null, null, 'explosive', 'reps', 'power', ['6kg medicine ball'],
    'Back to the target, dip, then drive through the hips and throw the ball overhead behind you.', { modalityTags: ['power-plyo'], energy: 'High', segment: 'main',
      dose: { sets: 3, reps: 3, restSec: 90 }, search: 'medicine ball overhead backward throw' }),
  _gx('reaction-time-test', 'Reaction time test (phone)', 'Somatic', 'Reaction', null, null, 'light', 'reps', 'skill', [],
    'humanbenchmark.com/tests/reactiontime — same phone, same place, average of 5.', { modalityTags: ['coordination'], energy: 'Low', segment: 'warmup',
      dose: { sets: 1, reps: 5, restSec: 10 } }),
];
const GOAL_EXERCISE_TAGS = {
  'single-leg-box-squat': { joints: ['knee', 'hip', 'ankle'], impact: 'low', pattern: 'squat', raisesHR: false, muscle: 'quads' },
  'shrimp-squat':         { joints: ['knee', 'hip', 'ankle'], impact: 'low', pattern: 'squat', raisesHR: false, muscle: 'quads' },
  'assisted-pistol':      { joints: ['knee', 'hip', 'ankle'], impact: 'low', pattern: 'squat', raisesHR: false, muscle: 'quads' },
  'pistol-squat-rep':     { joints: ['knee', 'hip', 'ankle'], impact: 'moderate', pattern: 'squat', raisesHR: false, muscle: 'quads' },
  'false-grip-pullup':    { joints: ['shoulder', 'elbow', 'forearm'], impact: 'low', pattern: 'pull', raisesHR: false, muscle: 'back' },
  'hs-toe-pulls':         { joints: ['wrist', 'shoulder'], impact: 'low', pattern: 'balance', raisesHR: false, muscle: 'shoulders' },
  'cartwheel-bail':       { joints: ['wrist', 'shoulder'], impact: 'moderate', pattern: 'skill', raisesHR: false, muscle: null },
  'sprint-20m':           { joints: ['ankle', 'knee', 'hip'], impact: 'high', pattern: 'other', raisesHR: true, muscle: 'quads' },
  'med-ball-back-throw':  { joints: ['back', 'hip', 'shoulder'], impact: 'moderate', pattern: 'other', raisesHR: true, muscle: 'glutes' },
  'reaction-time-test':   { joints: [], impact: 'low', pattern: 'skill', raisesHR: false, muscle: null },
};
(function registerGoalExercises() {
  if (typeof LIBRARY === 'undefined') return;
  const have = new Set(LIBRARY.map(e => e.id));
  GOAL_EXERCISES.forEach(e => { if (!have.has(e.id)) LIBRARY.push(e); });
  if (typeof EXERCISE_TAGS !== 'undefined') Object.entries(GOAL_EXERCISE_TAGS).forEach(([id, t]) => { if (!EXERCISE_TAGS[id]) EXERCISE_TAGS[id] = t; });
})();

// ── 2. LADDERS ────────────────────────────────────────────────
// Each rung: `name` (shown), `pass` (what counts as done), `work` (recipe
// steps for the Accessory block while you are on it). A skill line adds its
// `pre` steps (wrist prep, ankle prep) in front of the rung's work.
// `from` maps the old ladder's rung indices onto the new one so a stored
// position survives the rewrite (Goals.migrate).
const _st = (role, ids, n = 1, dose) => ({ role, n, ids, ...(dose ? { dose } : {}) });

const GOAL_LADDERS = {
  'handstand': {
    name: 'Handstand', category: 'Handstand', status: 'focus', line: 'handstand',
    why: 'Body awareness upside down, shoulder and wrist strength. Built at the wall first; freestanding only once the bail is in.',
    feeds: ['hs-wall-plank', 'hs-wall-hold', 'wall-walk', 'wall-shoulder-taps', 'pike-pushup', 'hs-kick-up', 'hs-toe-pulls', 'hs-tuck'],
    from: { 0: 0, 1: 1, 2: 2, 3: 2, 4: 5, 5: 5, 6: 6, 7: 6, 8: 8 },
    rungs: [
      { name: 'Wall plank hold 30s', pass: '30s with the feet on the wall and a straight body line.',
        work: [_st('practice', ['hs-wall-plank']), _st('develop', ['pike-pushup']), _st('practice', ['front-line-drill'])] },
      { name: 'Back-to-wall hold 30s', pass: '30s, heels resting on the wall, ribs in.',
        work: [_st('practice', ['hs-wall-hold'], 1, { sets: 4, durationSec: 30, restSec: 60 }), _st('develop', ['wall-walk']), _st('develop', ['pike-pushup'])] },
      { name: 'Chest-to-wall hold 45s', pass: '45s, hands 10–20 cm from the wall, body straight.',
        work: [_st('develop', ['wall-walk']), _st('practice', ['hs-wall-hold'], 1, { sets: 4, durationSec: 40, restSec: 60 }), _st('develop', ['wall-shoulder-taps'])] },
      { name: 'Cartwheel bail + kick-up to the wall', pass: 'Bail both ways without thinking, and kick up to a light wall touch 5 times in a row.',
        work: [_st('practice', ['cartwheel-bail']), _st('practice', ['hs-kick-up']), _st('practice', ['hs-wall-hold'], 1, { sets: 3, durationSec: 40, restSec: 60 })] },
      { name: 'Toe pulls — 5 balances of 3s off the wall', pass: 'Five times in one session: pull off the wall and hold 3s.',
        work: [_st('practice', ['hs-toe-pulls']), _st('practice', ['hs-kick-up']), _st('develop', ['wall-shoulder-taps'])] },
      { name: 'Freestanding tuck 5s', pass: 'Kick or float into a tuck and hold 5s, three times.',
        work: [_st('practice', ['hs-tuck']), _st('practice', ['hs-kick-up']), _st('practice', ['hs-toe-pulls'])] },
      { name: 'Freestanding straight 10s', pass: '10s straight and stacked, three times in a session.',
        work: [_st('practice', ['hs-straight']), _st('practice', ['hs-kick-up']), _st('practice', ['hs-tuck'])] },
      { name: 'Freestanding 30s', pass: 'One 30s hold.',
        work: [_st('practice', ['hs-straight'], 1, { sets: 6, durationSec: 15, restSec: 60 }), _st('practice', ['hs-straddle'])] },
      { name: 'Walking handstand 5 steps', pass: 'Five controlled hand steps without coming down.',
        work: [_st('practice', ['hs-walking']), _st('practice', ['hs-straight'])] },
    ],
  },

  'ring-muscle-up': {
    name: 'Ring muscle-up', category: 'Rings', status: 'focus', line: 'muscle-up-prep',
    why: 'The bridge from upper-body strength to skill: pull, turn over, press. Pulling is the limiter, so the early rungs are pulling rungs.',
    feeds: ['false-grip-hang', 'ring-pull-up', 'false-grip-pullup', 'explosive-pullup', 'ring-dip', 'banded-mu-transition', 'low-bar-drill', 'scap-pullups'],
    from: { 0: 0, 1: 1, 2: 2, 3: 4, 4: 5, 5: 6, 6: 7 },
    rungs: [
      { name: 'Strict pull-ups 3×6', pass: 'Three sets of 6 strict from a dead hang (Strength A).',
        work: [_st('practice', ['low-bar-drill']), _st('develop', ['false-grip-hang'], 1, { sets: 3, durationSec: 20, restSec: 60 }), _st('activate', ['scap-pullups']), _st('develop', ['ring-row', 'false-grip-ring-row'])] },
      { name: 'False grip hang 30s + ring pull-ups ×5', pass: 'A 30s false grip hang, and 5 strict ring pull-ups.',
        work: [_st('practice', ['low-bar-drill']), _st('develop', ['false-grip-hang'], 1, { sets: 3, durationSec: 30, restSec: 60 }), _st('develop', ['ring-pull-up'], 1, { sets: 3, reps: 4, restSec: 90 })] },
      { name: 'False grip ring pull-up ×3', pass: 'Three strict ring pull-ups without losing the false grip.',
        work: [_st('practice', ['low-bar-drill']), _st('develop', ['false-grip-pullup']), _st('develop', ['false-grip-ring-row'])] },
      { name: 'Chest-to-rings pull-up ×3 + ring dips ×8', pass: 'Three pull-ups that bring the rings to the chest, and 8 ring dips.',
        work: [_st('develop', ['explosive-pullup']), _st('develop', ['ring-dip'], 1, { sets: 3, reps: 6, restSec: 90 }), _st('develop', ['russian-dip'])] },
      { name: 'Banded transition ×5, controlled', pass: 'Five slow banded turnovers, no snatching through the sticking point.',
        work: [_st('practice', ['banded-mu-transition']), _st('develop', ['explosive-pullup']), _st('develop', ['straight-bar-dip'])] },
      { name: 'First kipping muscle-up', pass: 'One, from a hang to support on the rings.',
        work: [_st('practice', ['muscle-up-kipping'], 1, { sets: 5, reps: 1, restSec: 120 }), _st('practice', ['banded-mu-transition']), _st('practice', ['low-bar-drill'])] },
      { name: '3 kipping muscle-ups in a row', pass: 'Three without coming down.',
        work: [_st('practice', ['muscle-up-kipping'], 1, { sets: 4, reps: 2, restSec: 150 }), _st('develop', ['false-grip-pullup'])] },
      { name: 'Strict muscle-up', pass: 'One, no kip.',
        work: [_st('practice', ['muscle-up-strict'], 1, { sets: 5, reps: 1, restSec: 150 }), _st('develop', ['false-grip-pullup'])] },
    ],
  },

  // Johnyy's own ladder (26 Sep), adopted as the built-in.
  'pistol-squat': {
    name: 'Pistol squat', category: 'Legs', status: 'focus', line: 'pistol',
    why: 'Single-leg strength through full range, with the ankle and hip mobility to own it. The most athletic of the ladders.',
    feeds: ['ankle-dorsiflexion', 'knee-over-toe-stretch', 'cossack-squat', 'single-leg-box-squat', 'shrimp-squat', 'assisted-pistol', 'pistol-squat-rep'],
    from: { 0: 2, 1: 5, 2: 5, 3: 6, 4: 9 },
    rungs: [
      { name: 'Ankle dorsiflexion mobility — consistent', pass: 'Knee-to-wall 10 cm or more on both sides.',
        work: [_st('develop', ['ankle-dorsiflexion']), _st('develop', ['knee-over-toe-stretch']), _st('practice', ['cossack-squat'], 1, { sets: 2, reps: 5, restSec: 45, perSide: true })] },
      { name: 'Cossack squat full range both sides', pass: 'Hips close to the heel, heel flat, 5 each side.',
        work: [_st('practice', ['cossack-squat'], 1, { sets: 3, reps: 5, restSec: 45, perSide: true }), _st('develop', ['deep-squat-hold']), _st('develop', ['ankle-dorsiflexion'])] },
      { name: 'Single-leg box squat (high box) 3×5 each side', pass: '3×5 each side to a box at knee height.',
        work: [_st('develop', ['single-leg-box-squat']), _st('practice', ['cossack-squat'], 1, { sets: 2, reps: 5, restSec: 45, perSide: true })] },
      { name: 'Single-leg box squat (low box) 3×5 each side', pass: '3×5 each side to a box below knee height.',
        work: [_st('develop', ['single-leg-box-squat']), _st('develop', ['ankle-dorsiflexion'])] },
      { name: 'Shrimp squat 3×5 each side', pass: '3×5 each side, back knee to a pad.',
        work: [_st('develop', ['shrimp-squat']), _st('develop', ['single-leg-box-squat'])] },
      { name: 'Assisted pistol squat 3×5 each side', pass: '3×5 each side with light hand support.',
        work: [_st('develop', ['assisted-pistol']), _st('develop', ['shrimp-squat'])] },
      { name: 'Pistol squat — first rep each side', pass: 'One clean pistol each side.',
        work: [_st('practice', ['pistol-squat-rep'], 1, { sets: 5, reps: 1, restSec: 60, perSide: true }), _st('develop', ['assisted-pistol'])] },
      { name: 'Pistol squat 3×3 each side', pass: '3×3 each side.',
        work: [_st('develop', ['pistol-squat-rep'])] },
      { name: 'Pistol squat 3×5 each side', pass: '3×5 each side.',
        work: [_st('develop', ['pistol-squat-rep'], 1, { sets: 3, reps: 5, restSec: 90, perSide: true })] },
      { name: 'Weighted pistol squat', pass: '3×3 each side with a vest or a kettlebell at the chest.',
        work: [_st('develop', ['pistol-squat-rep'])] },
    ],
  },

  'cartwheel-roundoff': {
    name: 'Tumbling', category: 'Movement', status: 'focus', line: 'tumbling',
    why: 'Being comfortable going over, sideways and upside down — and the cartwheel bail that makes freestanding handstands safe.',
    feeds: ['rolling-forward', 'rolling-backward', 'rolling-side', 'breakfalls', 'cartwheel', 'cartwheel-bail', 'round-off'],
    from: { 0: 1, 1: 3, 2: 4, 3: 5, 4: 5 },
    rungs: [
      { name: 'Forward and backward roll, both shoulders', pass: 'Smooth rolls both directions, over either shoulder.',
        work: [_st('practice', ['rolling-forward']), _st('practice', ['rolling-backward']), _st('practice', ['breakfalls'])] },
      { name: 'Cartwheel both sides', pass: 'A functional cartwheel to each side.',
        work: [_st('practice', ['cartwheel']), _st('practice', ['rolling-side', 'breakfalls'])] },
      { name: 'Cartwheel bail from a handstand kick', pass: 'Kick up, turn a hand out, step down sideways — both ways.',
        work: [_st('practice', ['cartwheel-bail']), _st('practice', ['cartwheel'])] },
      { name: 'Clean cartwheel on a line, both sides', pass: 'Hands and feet on one line, legs straight, both sides.',
        work: [_st('practice', ['cartwheel'], 1, { sets: 4, reps: 4, restSec: 30, perSide: true }), _st('practice', ['cartwheel-bail'])] },
      { name: 'One-arm cartwheel', pass: 'Lead hand only, both sides.',
        work: [_st('practice', ['cartwheel'], 1, { sets: 4, reps: 3, restSec: 30, perSide: true })] },
      { name: 'Round-off', pass: 'Legs snap together overhead; land on two feet facing back.',
        work: [_st('practice', ['round-off']), _st('practice', ['cartwheel'])] },
    ],
  },

  'l-sit-v-sit': {
    name: 'L-sit & compression', category: 'Gymnastics', status: 'active', line: 'l-sit',
    why: 'Trunk compression and straight-arm support — the base of the press to handstand, and a strong midline.',
    feeds: ['tuck-sit', 'l-sit-floor', 'hollow-body-hold', 'pike-sit-wall', 'pike-sit-free', 'straddle-sit-compression', 'l-sit-rings', 'v-sit'],
    from: { 0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 4, 7: 5 },
    rungs: [
      { name: 'Tuck sit 10s', pass: '10s, hands beside the hips, knees to chest, feet off the floor.',
        work: [_st('develop', ['tuck-sit']), _st('develop', ['hollow-body-hold'])] },
      { name: 'One-leg L-sit 10s', pass: '10s with one leg straight, each side.',
        work: [_st('develop', ['l-sit-floor']), _st('develop', ['pike-sit-wall']), _st('develop', ['hollow-body-rock'])] },
      { name: 'Full L-sit 10s', pass: '10s, both legs straight at hip height.',
        work: [_st('develop', ['l-sit-floor']), _st('develop', ['straddle-sit-compression'])] },
      { name: 'Full L-sit 20s', pass: '20s.',
        work: [_st('develop', ['l-sit-floor']), _st('develop', ['pike-sit-free'])] },
      { name: 'Ring L-sit 15s', pass: '15s on rings, rings turned out.',
        work: [_st('develop', ['l-sit-rings']), _st('develop', ['l-sit-floor'])] },
      { name: 'V-sit', pass: 'Legs above horizontal for 3s.',
        work: [_st('develop', ['v-sit']), _st('develop', ['pike-sit-free'])] },
    ],
  },
};
// Kept, not deleted: in the editor, off the Progress screen, never in a
// plan. `pullups-10` lives in Strength; `middle-splits` became the pancake
// benchmark.
const GOALS_PARKED = ['pullups-10', 'diagonal-stretch', 'middle-splits', 'back-lever', 'front-lever',
  'walking-handstand', 'typewriter-pull-up', 'forearm-stand', 'skin-the-cat', 'press-handstand'];

(function applyLadders() {
  if (typeof GOALS === 'undefined') return;
  Object.entries(GOAL_LADDERS).forEach(([id, L]) => {
    let g = GOALS.find(x => x.id === id);
    if (!g) { g = { id, currentMilestone: 0 }; GOALS.push(g); }
    Object.assign(g, {
      name: L.name, category: L.category, kind: 'ladder', status: L.status, line: L.line, why: L.why,
      priority: L.status === 'focus' ? 1 : 2,
      milestones: L.rungs.map(r => r.name), rungs: L.rungs, feedExercises: L.feeds, notes: L.why,
    });
  });
  GOALS.forEach(g => {
    if (GOALS_PARKED.includes(g.id)) { g.kind = 'ladder'; g.status = 'parked'; g.priority = 3; }
    else if (!g.kind) { g.kind = 'ladder'; g.status = g.status || 'active'; }
  });
  // Ladders first, in the order above.
  const order = Object.keys(GOAL_LADDERS);
  GOALS.sort((a, b) => {
    const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
})();

// ── 3. BENCHMARKS (capacities) ────────────────────────────────
// `test` is the protocol, identical every time — that is what makes two
// numbers comparable. `slot` is where it runs on a test day; `min` is about
// how long it takes. `ex` is the exercise the test block shows.
const CAPACITIES = [
  // Power & speed
  { id: 'cap-broad-jump', area: 'power', name: 'Standing broad jump', unit: 'cm', better: 'higher', ex: 'broad-jump', slot: 'main', min: 6,
    why: 'Horizontal power: how much force you put into the ground, and how fast.',
    test: 'Toes behind a line, feet hip-width, arm swing allowed. Jump forward and stick the landing on both feet — a step or a fall back doesn\'t count. Measure from the line to the back of the nearest heel. Three attempts, a minute between, best counts.',
    feeds: ['broad-jump', 'box-jump', 'kb-swing', 'snap-down-stick', 'depth-jump', 'pogo-hops'] },
  { id: 'cap-vertical-jump', area: 'power', name: 'Vertical jump (jump and reach)', unit: 'cm', better: 'higher', ex: 'vertical-jump', slot: 'main', min: 6,
    why: 'Vertical power and elastic stiffness.',
    test: 'Side-on to a wall, reach up with the near hand and mark your standing reach. From standing, dip and jump with an arm swing and touch the wall as high as you can (chalk on the fingertips, or film against a tape measure). Score = jump mark minus standing reach. Three attempts, best counts.',
    feeds: ['vertical-jump', 'box-jump', 'pogo-hops', 'depth-jump', 'mini-hurdle-hops'] },
  { id: 'cap-sprint-20', area: 'power', name: '20 m sprint', unit: 's', better: 'lower', ex: 'sprint-20m', slot: 'main', min: 10, decimals: 2,
    why: 'Acceleration — the most athletic single number there is.',
    test: 'Flat ground, after the full warm-up and three strides. Split-stance start, no rocking. Time from first movement to crossing 20 m — film side-on from the finish with the start in view and read it off the video, or have someone time it. Same method every time. Three efforts, 2–3 min rest, best counts.',
    feeds: ['uphill-sprints', 'sprint-20m', 'strides', 'a-skip', 'wall-accel-drill', 'straight-leg-bound'] },
  { id: 'cap-mb-throw', area: 'power', name: 'Med-ball back throw (6 kg)', unit: 'm', better: 'higher', ex: 'med-ball-back-throw', slot: 'main', min: 6, decimals: 1,
    why: 'Whole-body power through the hips — the jump\'s cousin, with the arms in it.',
    test: 'Heels on a line, back to the throwing direction, 6 kg ball at arm\'s length. Dip, then drive through the hips and throw the ball overhead behind you. Measure from the line to where the ball first lands. Three throws, best counts.',
    feeds: ['med-ball-back-throw', 'med-ball-slams', 'med-ball-rotational', 'kb-swing'] },
  // Grip & hang
  { id: 'cap-dead-hang', area: 'grip', name: 'Dead hang', unit: 's', better: 'higher', ex: 'dead-hang', slot: 'accessory', min: 4,
    why: 'Grip and shoulder tolerance. The 12-month marker is 2–3 min.',
    test: 'Overhand grip, shoulder width, feet off the floor, arms straight. Hang until the grip fails. One attempt, fresh-ish, after a short warm-up.',
    feeds: ['dead-hang', 'active-hang', 'meat-hook-hang', 'switch-grip-hang-beginner', 'one-arm-passive-hang'] },
  // Mobility
  { id: 'cap-knee-to-wall', area: 'mobility', name: 'Knee-to-wall (worse side)', unit: 'cm', better: 'higher', ex: 'ankle-dorsiflexion', slot: 'mobility', min: 4, decimals: 1,
    why: 'Ankle dorsiflexion. It gates the pistol, the deep squat and good landings.',
    test: 'Barefoot, foot straight at a wall. Drive the knee over the second toe to touch the wall with the heel flat, sliding the foot back until you can only just touch. Measure big toe to wall. Both sides; record the worse one.',
    feeds: ['ankle-dorsiflexion', 'knee-over-toe-stretch', 'deep-squat-hold', 'ankle-cars', 'squat-heel-raise-toe-stretch'] },
  { id: 'cap-pancake', area: 'mobility', name: 'Pancake (chest to floor)', unit: 'cm', better: 'lower', ex: 'pancake', slot: 'mobility', min: 4,
    why: 'Hip abduction and hamstrings together — one of the 12-month markers.',
    test: 'After 10 min of warm-up. Seated straddle as wide as it goes, knees and toes pointing up. Fold forward from the hips with a flat back and hold 5s. Measure from the bottom of the breastbone to the floor. Film it from the side so the next test copies the width.',
    feeds: ['pancake', 'straddle-fold-passive', 'straddle-sit-compression', 'frog-stretch', 'pancake-good-morning'] },
  { id: 'cap-toe-touch', area: 'mobility', name: 'Standing toe touch', unit: 'cm', better: 'higher', ex: 'yoga-standing-forward-fold', slot: 'mobility', min: 3,
    why: 'Posterior chain length — hamstrings and back together.',
    test: 'Standing on a step, feet together, knees locked. Fold slowly and hold 2s at the bottom. Fingertip distance below the toe line in cm (negative if above it).',
    feeds: ['hamstring-pike', 'jefferson-curl', 'single-leg-hamstring-stretch', 'yoga-standing-forward-fold'] },
  // Coordination & balance
  { id: 'cap-balance-ec', area: 'coordination', name: 'One-leg stand, eyes closed (worse side)', unit: 's', better: 'higher', ex: 'single-leg-eyes-closed', slot: 'complementary', min: 5, cap: 60,
    why: 'Balance without vision — proprioception and ankle control.',
    test: 'Barefoot, hands on hips, lift one foot. Close the eyes and start the clock. Stop when a hand leaves the hip, the lifted foot touches down or the standing foot shifts. Cap 60s. Two attempts each side; record the worse side\'s best.',
    feeds: ['single-leg-eyes-closed', 'balance-board-single-leg', 'edge-sl-eyes-closed-taps', 'single-leg-head-turns'] },
  { id: 'cap-juggle', area: 'coordination', name: '3-ball cascade', unit: 'catches', better: 'higher', ex: 'juggling-cascade', slot: 'complementary', min: 5,
    why: 'Hand-eye timing under a rhythm.',
    test: 'Three balls, standard cascade. Count catches until the first drop. Three attempts, best counts. Not juggling yet? Record how many catches you get.',
    feeds: ['juggling-cascade', 'juggling-variations', 'juggling-reverse-cascade'] },
  { id: 'cap-reaction', area: 'coordination', name: 'Reaction time', unit: 'ms', better: 'lower', ex: 'reaction-time-test', slot: 'complementary', min: 3,
    why: 'Simple visual reaction. Small changes are real here; the average of five is what counts.',
    test: 'humanbenchmark.com/tests/reactiontime on the same phone, in the same place, sitting. Record the average of 5.',
    feeds: ['drop-catch-reaction', 'reaction-ball-wall', 'tennis-ball-punch', 'two-ball-wall-alternating'] },
  // Engine — read from imported benchmark runs, not typed in
  { id: 'cap-fixed-hr', area: 'engine', name: 'Fixed-HR 30 min', unit: 'km', better: 'higher', ex: 'easy-run', slot: 'main', min: 50, decimals: 2, source: 'cardio',
    why: 'The aerobic engine: distance at the same heart rate. The one number that moves if the engine does.',
    test: 'Home loop, same morning slot. 10 min build, then 30 min held at avg ~148 with nothing above 156. The distance over those 30 min is the number.',
    baseline: { value: 4.40, date: '2026-09-23', note: 'avg 148, max 156' },
    feeds: ['easy-run', 'z2-cycling', 'interval-run'] },
];
const CAPACITY_AREAS = [
  { key: 'power',        label: 'Power & speed' },
  { key: 'mobility',     label: 'Mobility' },
  { key: 'coordination', label: 'Coordination & balance' },
  { key: 'grip',         label: 'Grip & hang' },
];

// ── 4. PRACTICE (unmeasured) ──────────────────────────────────
// Consistency, not a score. A session counts when its coordination domain
// was this one, or when it logged something from these families.
const PRACTICES = [
  { id: 'pr-vision',   name: 'Vision & eyes',      domain: 'vision',        families: ['C1'] },
  { id: 'pr-ball',     name: 'Ball & reaction',    domain: 'ball-reaction', families: ['C2'] },
  { id: 'pr-stick',    name: 'Stick work',         domain: 'stick',         families: ['C4a', 'C4b'] },
  { id: 'pr-objects',  name: 'Objects & juggling', domain: 'objects',       families: ['C5'] },
  { id: 'pr-movement', name: 'Movement practice',  domain: 'movement',      families: ['E1', 'E2'] },
  { id: 'pr-yoga',     name: 'Yoga & somatic',     domain: null,            families: ['E4', 'A2'] },
];

// ── 5. SKILL LINES FOR THE LADDERS ────────────────────────────
// A line with a `goalId` is rung-driven: its steps are `pre` + the current
// rung's `work` (Goals.skillSteps). The static `steps` stay as the fallback
// and for anything that reads SKILL_LINES directly.
if (typeof SKILL_LINES !== 'undefined') {
  Object.assign(SKILL_LINES, {
    'pistol': { label: 'Pistol squat', goalId: 'pistol-squat',
      pre: [_st('mobilise', ['ankle-cars', 'knee-over-toe-stretch', 'squat-heel-raise-toe-stretch'])],
      steps: [_st('develop', ['ankle-dorsiflexion']), _st('practice', ['cossack-squat']), _st('develop', ['single-leg-box-squat'])] },
    'tumbling': { label: 'Tumbling', goalId: 'cartwheel-roundoff',
      pre: [_st('mobilise', ['wrist-prep'])],
      steps: [_st('practice', ['rolling-forward']), _st('practice', ['cartwheel']), _st('practice', ['breakfalls'])] },
    'l-sit': { label: 'L-sit & compression', goalId: 'l-sit-v-sit',
      pre: [_st('mobilise', ['wrist-prep'])],
      steps: [_st('develop', ['tuck-sit']), _st('develop', ['hollow-body-hold']), _st('develop', ['pike-sit-wall'])] },
  });
  SKILL_LINES['handstand'].goalId = 'handstand';
  SKILL_LINES['handstand'].pre = [_st('mobilise', ['wrist-prep']), _st('activate', ['first-knuckle-raises', 'fin-pushups', 'slingshot-rebound-plank'])];
  SKILL_LINES['muscle-up-prep'].goalId = 'ring-muscle-up';
  SKILL_LINES['muscle-up-prep'].label = 'Muscle-up';
  SKILL_LINES['muscle-up-prep'].pre = [_st('activate', ['band-pull-aparts', 'face-pulls', 'ext-rotation-bands'])];
  SKILL_LINES['pancake-hips'].feeds = 'cap-pancake';
  SKILL_LINES['hang-project'].feeds = 'cap-dead-hang';
}
if (typeof WRIST_SKILL_LINES !== 'undefined' && !WRIST_SKILL_LINES.includes('tumbling')) WRIST_SKILL_LINES.push('tumbling');

// ── 6. THE API ────────────────────────────────────────────────
const Goals = {
  RESULTS_KEY: 'goal_results_override',   // key contains "override" → syncs via the overrides table
  STATE_KEY: 'goal_state_override',       // per-goal status edits (focus / active / parked)
  VERSION: 2,

  _db() { return typeof DB !== 'undefined' ? DB : null; },
  _plan() { return typeof MonthPlan !== 'undefined' ? MonthPlan.load() : null; },
  _key(d) {
    const x = d instanceof Date ? d : new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? d + 'T12:00:00' : d);
    const p = n => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  },
  _short(k) {
    const d = new Date(k + 'T12:00:00');
    return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
  },

  // ── what exists ──────────────────────────────────────────────
  _state() { const db = this._db(); return (db && db.get(this.STATE_KEY)) || {}; },
  setStatus(id, status) {
    const db = this._db(); if (!db) return;
    const st = this._state(); st[id] = { ...(st[id] || {}), status }; db.set(this.STATE_KEY, st);
  },
  _withState(g) { const s = this._state()[g.id]; return s && s.status ? { ...g, status: s.status } : g; },
  ladders() {
    const custom = (typeof Custom !== 'undefined') ? Custom.getGoals() : [];
    const cust = custom.map(g => ({ kind: 'ladder', status: (g.priority || 2) <= 1 ? 'focus' : (g.priority || 2) === 2 ? 'active' : 'parked', ...g, isCustom: true }));
    return [...GOALS, ...cust].filter(g => (g.kind || 'ladder') === 'ladder').map(g => this._withState(g));
  },
  capacities() { return CAPACITIES.map(c => this._withState({ status: 'active', kind: 'benchmark', ...c })); },
  practices() { return PRACTICES.map(p => ({ kind: 'practice', ...p })); },
  get(id) {
    return this.capacities().find(c => c.id === id) || this.ladders().find(g => g.id === id)
      || this.practices().find(p => p.id === id) || null;
  },

  // ── ladders: where you are, and what that means for today ────
  rung(id, profile) {
    const p = profile || (typeof App !== 'undefined' ? App.profile : null);
    const ms = (typeof Custom !== 'undefined') ? Custom.getMilestones(id) : ((GOALS.find(g => g.id === id) || {}).milestones || []);
    const raw = (p && p.goalMilestones && p.goalMilestones[id]) || 0;
    const idx = Math.max(0, Math.min(raw, Math.max(0, ms.length - 1)));
    return { idx, name: ms[idx] || '', next: ms[idx + 1] || null, total: ms.length };
  },
  rungDef(id, idx) {
    const g = GOALS.find(x => x.id === id);
    if (!g || !Array.isArray(g.rungs)) return null;
    const ms = (typeof Custom !== 'undefined') ? Custom.getMilestones(id) : g.milestones;
    // An edited ladder: match the rung by name, never by position.
    return g.rungs.find(x => x.name === ms[idx]) || null;
  },
  // Steps for a skill line: its `pre` + the current rung's work. Null when
  // the line isn't rung-driven or the rung has no recipe (the line's static
  // steps are used then).
  skillSteps(lineKey, profile) {
    const line = (typeof SKILL_LINES !== 'undefined') ? SKILL_LINES[lineKey] : null;
    if (!line || !line.goalId) return null;
    const def = this.rungDef(line.goalId, this.rung(line.goalId, profile).idx);
    if (!def || !def.work) return null;
    return [...(line.pre || []), ...def.work];
  },
  lineNote(lineKey, profile) {
    const line = (typeof SKILL_LINES !== 'undefined') ? SKILL_LINES[lineKey] : null;
    if (!line) return '';
    if (line.goalId) {
      const r = this.rung(line.goalId, profile);
      const def = this.rungDef(line.goalId, r.idx);
      return r.name ? `On rung ${r.idx + 1} of ${r.total}: ${r.name}.${def && def.pass ? ' Passed when: ' + def.pass : ''}` : '';
    }
    if (line.feeds) {
      const c = this.get(line.feeds);
      const t = c && this.nextTarget(c.id);
      return c ? `Feeds ${c.name}${t && t.value != null ? ' — next target ' + this.fmt(c, t.value) + ' by ' + t.label : ''}.` : '';
    }
    return '';
  },

  // ── focus: what this block is for, and the exercises that serve it
  blockFor(date) {
    const plan = this._plan(); const k = this._key(date || new Date());
    return ((plan && plan.quarter && plan.quarter.blocks) || []).find(b => k >= b.from && k <= b.to) || null;
  },
  focusFor(date) {
    const b = this.blockFor(date);
    return (b && Array.isArray(b.focus)) ? b.focus.filter(id => { const g = this.get(id); return g && g.status !== 'parked'; }) : [];
  },
  // Exercise ids that feed a goal in focus. The generator draws these first
  // wherever they are already candidates: it never adds work a block wasn't
  // going to do, it decides which of the options wins.
  boostFor(date) {
    const out = new Set();
    this.focusFor(date).forEach(id => {
      const g = this.get(id); if (!g) return;
      (g.feeds || g.feedExercises || []).forEach(x => out.add(x));
    });
    return out;
  },

  // ── benchmark results ────────────────────────────────────────
  results(id) {
    const db = this._db(); const all = (db && db.get(this.RESULTS_KEY)) || {};
    let list = Array.isArray(all[id]) ? all[id].slice() : [];
    const c = CAPACITIES.find(x => x.id === id);
    if (c && c.source === 'cardio') {
      const auto = this._cardioResults().filter(a => !list.some(r => r.date === a.date));
      list = list.concat(auto);
    }
    if (c && c.baseline && !list.some(r => r.date === c.baseline.date)) list.push({ ...c.baseline, seed: true });
    return list.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  },
  _cardioResults() {
    if (typeof History === 'undefined') return [];
    const out = [];
    try {
      History.getIndex(200).forEach(row => {
        const s = History.getSession(row.id); if (!s) return;
        (s.blocks || []).forEach(b => (b.exercises || []).forEach(ex => {
          const cl = ex.cardioLog;
          if (cl && cl.isBenchmark) {
            const km = cl.benchmark ? cl.benchmark.distanceKm : cl.distanceKm;
            if (km) out.push({ date: this._key(s.date), value: +(+km).toFixed(2),
              note: cl.benchmark && cl.benchmark.avgHR ? 'avg ' + cl.benchmark.avgHR : '', auto: true });
          }
        }));
      });
    } catch (e) { /* history unreadable — no automatic results */ }
    return out;
  },
  record(id, value, note, date) {
    const db = this._db(); if (!db) return null;
    const v = Number(value); if (value === '' || value == null || !isFinite(v)) return null;
    const all = db.get(this.RESULTS_KEY) || {};
    const k = date ? this._key(date) : this._key(new Date());
    const list = (all[id] || []).filter(r => r.date !== k);
    list.push({ date: k, value: v, note: note || '', at: Date.now() });
    all[id] = list.sort((a, b) => a.date < b.date ? -1 : 1);
    db.set(this.RESULTS_KEY, all);
    return all[id];
  },
  removeResult(id, date) {
    const db = this._db(); if (!db) return;
    const all = db.get(this.RESULTS_KEY) || {};
    all[id] = (all[id] || []).filter(r => r.date !== date);
    db.set(this.RESULTS_KEY, all);
  },
  isBetter(c, a, b) { return c.better === 'lower' ? a < b : a > b; },
  latest(id) { const r = this.results(id); return r.length ? r[r.length - 1] : null; },
  best(id) {
    const c = CAPACITIES.find(x => x.id === id); if (!c) return null;
    return this.results(id).reduce((m, x) => (!m || this.isBetter(c, x.value, m.value)) ? x : m, null);
  },
  // Baseline = the first result on or after the quarter's start (the
  // measurement days), else the earliest result there is.
  baseline(id) {
    const r = this.results(id); if (!r.length) return null;
    const plan = this._plan(); const from = plan && plan.quarter ? plan.quarter.from : null;
    const c = CAPACITIES.find(x => x.id === id);
    if (c && c.baseline) return r.find(x => x.date === c.baseline.date) || r[0];
    return (from && r.find(x => x.date >= from)) || r[0];
  },
  fmt(c, v) {
    if (v == null || !isFinite(v)) return '—';
    const d = c.decimals != null ? c.decimals : 0;
    const n = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
    return c.unit === 'catches' ? n : n + ' ' + c.unit;
  },

  // ── targets (plan.goalTargets[id]) ───────────────────────────
  // { value } absolute; { delta } or { pct } relative to the baseline, in
  // the direction that counts as better; { rung } for ladders.
  targets(id) {
    const plan = this._plan();
    const list = (plan && plan.goalTargets && plan.goalTargets[id]) || [];
    const c = CAPACITIES.find(x => x.id === id);
    const base = c ? this.baseline(id) : null;
    return list.map(t => {
      let value = t.value != null ? t.value : null;
      if (c && value == null && base && (t.delta != null || t.pct != null)) {
        const sgn = c.better === 'lower' ? -1 : 1;
        const inc = t.delta != null ? Math.abs(t.delta) : Math.abs(base.value) * Math.abs(t.pct) / 100;
        value = base.value + sgn * Math.max(inc, t.min || 0);
        if (c.cap != null) value = Math.min(value, c.cap);
        const d = c.decimals != null ? c.decimals : 0;
        value = Math.round(value * Math.pow(10, d)) / Math.pow(10, d);
      }
      return { ...t, value, label: this._short(t.by), relative: t.value == null && t.rung == null };
    });
  },
  nextTarget(id, date) {
    const k = this._key(date || new Date());
    return this.targets(id).find(t => t.by >= k) || null;
  },
  // Share of the way from baseline to the final target, 0..1.
  progressOf(id) {
    const c = CAPACITIES.find(x => x.id === id); if (!c) return null;
    const base = this.baseline(id), best = this.best(id);
    const ts = this.targets(id).filter(t => t.value != null);
    if (!base || !best || !ts.length) return null;
    const fin = ts[ts.length - 1].value;
    if (fin === base.value) return 1;
    return Math.max(0, Math.min(1, (best.value - base.value) / (fin - base.value)));
  },

  // ── test days ────────────────────────────────────────────────
  // plan day.tests = { main|complementary|mobility|accessory: [goal ids] }.
  testsFor(day) { return (day && day.tests && typeof day.tests === 'object') ? day.tests : null; },
  upcomingTests(date, n = 3) {
    const plan = this._plan(); const k = this._key(date || new Date());
    return ((plan && plan.days) || []).filter(d => d.date >= k && this.testsFor(d)).slice(0, n);
  },

  // ── practice: sessions in the last N days that touched it ─────
  practiceCounts(days = 28) {
    const out = {}; PRACTICES.forEach(p => { out[p.id] = { n: 0, dates: [] }; });
    if (typeof History === 'undefined') return out;
    const since = Date.now() - days * 864e5;
    const lib = new Map((typeof LIBRARY !== 'undefined' ? LIBRARY : []).map(e => [e.id, e]));
    try {
      History.getIndex(120).forEach(row => {
        if (!row.date || new Date(row.date).getTime() < since || row.status === 'in-progress') return;
        const s = History.getSession(row.id); if (!s) return;
        const fams = new Set();
        (s.blocks || []).forEach(b => (b.exercises || []).forEach(ex => {
          const done = (ex.sets || []).some(st => st && st.completed !== false) || ex.done || ex.completed;
          const e = lib.get(ex.id); if (done && e && e.family) fams.add(e.family);
        }));
        PRACTICES.forEach(p => {
          const byDomain = p.domain && (s.coordDomain === p.domain) && (s.blocks || []).some(b => b.key === 'complementary' && (b.exercises || []).some(ex => (ex.sets || []).length || ex.done));
          if (byDomain || p.families.some(f => fams.has(f))) { out[p.id].n++; out[p.id].dates.push(this._key(s.date)); }
        });
      });
    } catch (e) { /* ignore */ }
    return out;
  },

  // ── one-time migration to the rewritten ladders (27 Sep 2026) ──
  // Maps each stored rung onto the new ladder, and drops rung-list overrides
  // for the rewritten ladders — the new built-ins supersede them. The pistol
  // override was Johnyy's own list, now the built-in, so its position
  // carries over by name.
  migrate(profile) {
    if (!profile || (profile.goalsVersion || 0) >= this.VERSION) return false;
    const db = this._db();
    const ov = (db && db.get('goal_milestone_overrides')) || {};
    profile.goalMilestones = profile.goalMilestones || {};
    Object.entries(GOAL_LADDERS).forEach(([id, L]) => {
      const cur = profile.goalMilestones[id];
      if (cur == null) return;
      const own = ov[id];
      if (own) {
        const hit = L.rungs.findIndex(r => r.name === own[cur]);
        profile.goalMilestones[id] = hit >= 0 ? hit : Math.min(cur, L.rungs.length - 1);
      } else {
        profile.goalMilestones[id] = (L.from && L.from[cur] != null) ? L.from[cur] : Math.min(cur, L.rungs.length - 1);
      }
    });
    let changed = false;
    Object.keys(GOAL_LADDERS).forEach(id => { if (ov[id]) { delete ov[id]; changed = true; } });
    if (db && changed) db.set('goal_milestone_overrides', ov);
    profile.goalsVersion = this.VERSION;
    return true;
  },
};
