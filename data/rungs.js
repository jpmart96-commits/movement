// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — LADDER RUNGS
// data/rungs.js — what each rung on a Movements ladder actually is.
//
// Ladder rungs are free text ("Shrimp squat 3×5 each side"), and most of
// them are not library exercises. Tapping a rung on Progress opens a sheet
// that explains it from three sources, in this order:
//   1. RUNG_GLOSSARY — a short description matched by movement name
//   2. a library exercise whose name matches the rung (cues + video)
//   3. a YouTube search for the movement, always offered
// The dose ("3×5 each side", "5s", "first rep") is split off and shown
// as the target, so the same entry serves every rung of that movement.
//
// Entries are tried in order, most specific first. `goal` restricts an
// entry to ladders whose goal name matches — used for rungs that only make
// sense in context ("Top hold 3s", "One leg extended 3s").
// ─────────────────────────────────────────────────────────────

const RUNG_GLOSSARY = [
  // ── Pistol squat ────────────────────────────────────────────
  { re: /dorsiflexion|knee[- ]to[- ]wall/,
    what: 'Ankle range: how far the knee travels forward past the toes with the heel flat. A pistol needs a lot of it — without it you fall backwards at the bottom.',
    cue: 'Test: knee-to-wall. Foot a hand-width from the wall, drive the knee to touch it without the heel lifting. Around 10–12 cm between toes and wall is enough for a pistol.' },
  { re: /single[- ]leg box squat|box pistol|pistol.*to (a )?box/,
    what: 'A one-leg squat down to a box or bench behind you. Stand on one leg, the other held off the floor in front, sit back until you touch the box, then stand up on the same leg.',
    cue: 'Touch, don\'t sit and rock. A high box limits the depth; lower it over time until it is below knee height.' },
  { re: /shrimp/,
    what: 'A one-leg squat with the free leg bent behind you instead of out in front. Hold the back foot with the hand on the same side, lower until the back knee touches the floor (use a pad), and stand up.',
    cue: 'More knee-dominant and less hip-flexor demand than a pistol — a good strength builder for the bottom half.' },
  { re: /counter ?weight(ed)? pistol/,
    what: 'A full pistol holding a light weight (2.5–5 kg plate or kettlebell) out in front with straight arms. The weight pulls your balance forward, so the bottom is easier to hold.',
    cue: 'Less weight than you think. The goal is to reduce it towards zero.' },
  { re: /assisted pistol/,
    what: 'A full-depth pistol while holding something — a TRX, band, doorframe or post — that helps you out of the bottom.',
    cue: 'Use as little help as possible, and only on the way up. Lower under your own control.' },
  { re: /weighted pistol/,
    what: 'A pistol squat with extra load — a kettlebell or dumbbell held at the chest, or a vest.',
    cue: 'Holding the weight at the chest also acts as a counterweight; a vest is the honest version.' },
  { re: /pistol/,
    what: 'A one-leg squat to full depth with the other leg held straight out in front, then back up — no support.',
    cue: 'Working heel stays flat, knee tracks over the toes, free leg stays off the floor the whole rep.' },
  { re: /cossack.*(arm|reach)/,
    what: 'A full-depth Cossack squat with an arm reach added at the bottom — reach over the straight leg to add a side bend and open the adductors further.',
    cue: 'Keep the bent-leg heel down while you reach.' },
  { re: /cossack/,
    what: 'A wide-stance side squat: shift into one leg and squat deep on it while the other leg stays straight out to the side, toes pointing up.',
    cue: 'Full range means hips close to the working heel, heel still flat. Both sides.' },
  { re: /lateral lunge flow/,
    what: 'Moving continuously from one Cossack position to the other without standing up in between — low, smooth, side to side.' },

  // ── Handstand / forearm stand / press ───────────────────────
  { re: /wall plank/,
    what: 'Hands on the floor, feet on the wall, body held straight — a plank tilted up the wall. The first step to carrying your weight upside down.',
    cue: 'Shoulders over wrists, push the floor away, ribs in.' },
  { re: /back[- ]to[- ]wall/,
    what: 'Kick up into a handstand facing away from the wall, heels resting on it.',
    cue: 'Easy to get into but it lets you arch. Keep ribs in and try to take the heels off the wall.' },
  { re: /chest[- ]to[- ]wall/,
    what: 'Walk your feet up the wall facing it until your chest is close to the wall and your body is vertical. Teaches the straight line.',
    cue: 'Hands 10–20 cm from the wall. The closer, the straighter.' },
  { re: /wall forearm/,
    what: 'A forearm stand against the wall: forearms on the floor parallel and shoulder-width apart, legs up with heels on the wall.' },
  { re: /tuck kick ?up/,
    what: 'Kicking up into a freestanding forearm stand with the knees tucked, aiming to arrive without momentum carrying you over.' },
  { re: /pike press entry|pike entry/,
    what: 'Entering the handstand from a pike without a kick. Feet on the floor, hands down, lean the shoulders forward over the hands until the legs float up.',
    cue: 'Slow and controlled — it is a lean, not a jump.' },
  { re: /pike compression/,
    what: 'Seated with legs straight together, hands on the floor beside the knees or hips, lift the heels off the floor and hold. Builds the compression a press needs.' },
  { re: /straddle compression/,
    what: 'Seated in a wide straddle, hands on the floor between the legs, lift both legs off the floor and hold.' },
  { re: /negative press/,
    what: 'From a handstand, lower slowly through a straddle or pike until the feet touch down. The easier half of the press, built first.' },
  { re: /assisted press/,
    what: 'A press to handstand with help — feet starting on a box, or a partner or band taking some of the weight.' },
  { re: /press to (hs|handstand)/,
    what: 'Lifting into a handstand from standing or seated with straight arms and no jump — the legs float up through a straddle or pike.' },
  { re: /tuck freestanding|freestanding.*tuck/,
    what: 'Balancing away from the wall with the knees tucked towards the chest. Shorter lever, easier to hold.' },
  { re: /straddle freestanding|freestanding.*straddle/,
    what: 'Balancing away from the wall with legs straight and wide in a V. Lower centre of mass than a straight handstand.' },
  { re: /straight legs? freestanding|straight body/,
    what: 'A freestanding handstand (or forearm stand) with the body straight and legs together — wrists, shoulders, hips and ankles stacked.' },
  { re: /freestanding handstand/,
    what: 'Holding a handstand away from the wall for the time given.' },
  { re: /shifting weight/,
    what: 'In a handstand, shifting weight from one hand to the other without falling. The prerequisite for walking.' },
  { re: /walking|walk.*steps?|\bsteps?\b/, goal: /handstand/,
    what: 'Walking on your hands, one controlled step at a time — the step counts are hand placements without coming down.' },

  // ── Rings / pulling ─────────────────────────────────────────
  { re: /false grip/,
    what: 'A pull-up on rings with the wrist over the ring, so the ring sits in the heel of the palm. Needed for a strict muscle-up.',
    cue: 'Uncomfortable at first. Hold the grip in hangs before you pull with it.' },
  { re: /transition drill/,
    what: 'Practising the turnover from the top of the pull-up to the bottom of the dip — with a band, or on low rings with the feet on the floor.' },
  { re: /kipping muscle[- ]?up/,
    what: 'A muscle-up that uses a swing from the hips to help you through the transition over the rings.' },
  { re: /strict muscle[- ]?up/,
    what: 'A muscle-up with no swing: false-grip pull-up, turn over the rings, press out of the dip.' },
  { re: /archer pull/,
    what: 'A pull-up towards one hand while the other arm stays straight out along the bar (or ring). Builds one-arm strength for the typewriter.' },
  { re: /lateral shift/,
    what: 'At the top of a pull-up, sliding the chin from one hand to the other along the bar without dropping.' },
  { re: /top hold/, goal: /pull|typewriter/,
    what: 'Pull up and hold the top — chin over the bar, elbows tight — for the time given.' },
  { re: /typewriter/,
    what: 'Pull up to one hand, travel across to the other along the bar while staying at the top, then back — one arm bent, the other straight.' },
  { re: /ring pull[- ]?up/,
    what: 'A strict pull-up on rings: full dead hang to chest near the rings, no kip. The rings are free to turn, so the pull follows your shoulders.' },
  { re: /dead[- ]hang pull|strict pull[- ]?ups?|perfect pull[- ]?ups?|pull[- ]?ups?/,
    what: 'Strict pull-ups from a full dead hang: arms straight at the bottom, chin over the bar at the top, no kip or swing.' },

  // ── Levers / skin the cat ───────────────────────────────────
  { re: /german hang/,
    what: 'Hanging from rings or a bar with the arms behind you and the feet towards the floor — the end of skin the cat. A shoulder-extension stretch.',
    cue: 'Ease into it. Hands shoulder-width, let the shoulders open slowly.' },
  { re: /reverse skin the cat/,
    what: 'Coming back out of the German hang: tuck, rotate the legs back through the arms, and return to a normal hang.' },
  { re: /skin the cat|full rotation/,
    what: 'From a hang, tuck and roll the legs up and through the arms backwards into the German hang, then return the same way.' },
  { re: /advanced tuck.*back lever/,
    what: 'A back lever with the back flat and hips open, knees still bent. Body horizontal, face down, arms straight behind you.' },
  { re: /tuck back lever/,
    what: 'A back lever with the knees tucked to the chest: horizontal under the rings, face down, arms straight behind you.' },
  { re: /straddle back lever/,
    what: 'A back lever with legs straight and wide apart. Face down, horizontal, arms behind you.' },
  { re: /back lever/,
    what: 'Holding the body straight and horizontal under the bar or rings, face down, arms straight behind you.' },
  { re: /advanced tuck.*front lever/,
    what: 'A front lever with the back flat and hips open, knees still bent. Body horizontal, face up, arms straight.' },
  { re: /tuck front lever/,
    what: 'A front lever with the knees tucked to the chest: horizontal under the bar, face up, arms straight pulling down.' },
  { re: /one leg.*front lever|front lever.*one leg/,
    what: 'A front lever with one leg straight and the other tucked.' },
  { re: /straddle front lever/,
    what: 'A front lever with legs straight and wide apart. Face up, horizontal, arms straight.' },
  { re: /front lever/,
    what: 'Holding the body straight and horizontal under the bar, face up, arms straight pulling down.' },
  { re: /one leg extended/, goal: /lever/,
    what: 'The lever with one leg straight and the other tucked.' },

  // ── L-sit / V-sit ───────────────────────────────────────────
  { re: /tuck sit/,
    what: 'Hands on the floor beside the hips, push down and lift your body off the floor with the knees tucked to the chest.' },
  { re: /ring l[- ]sit/,
    what: 'An L-sit supported on rings — arms straight, rings turned out slightly. Harder than the floor because the rings move.' },
  { re: /l[- ]sit one leg/,
    what: 'An L-sit with one leg straight and the other tucked.' },
  { re: /l[- ]sit tuck/,
    what: 'Supported on straight arms with the knees tucked and thighs horizontal.' },
  { re: /l[- ]sit/,
    what: 'Supported on straight arms with the legs straight out in front, parallel to the floor.' },
  { re: /v[- ]sit/,
    what: 'Like an L-sit, but the legs rise above horizontal towards the face. Needs strong compression and hamstring flexibility.' },

  // ── Splits / floor skills ───────────────────────────────────
  { re: /straddle floor|middle split/,
    what: 'Standing side splits: feet slide out to the sides, hips square. The number is the gap between your crotch and the floor.' },
  { re: /round[- ]off/,
    what: 'Like a cartwheel, but the legs snap together overhead and you land on both feet facing back the way you came.' },
  { re: /one[- ]arm cartwheel/,
    what: 'A cartwheel with only the lead hand on the floor.' },
  { re: /cartwheel/,
    what: 'Sideways rotation hand-hand-foot-foot, passing through a straddle handstand, legs straight.' },
];

// The movement named by a rung, without its dose — used for matching and
// for the video search. The sheet shows the rung exactly as written.
function rungName(text) {
  let t = String(text || '');
  // A dash suffix is dose when it reads like one ("— first rep", "— consistent");
  // otherwise it is part of the movement ("Wall hold — back to wall").
  t = t.replace(/\s[—–-]\s(.*)$/, (m, tail) =>
    /^(first|consistent|daily|\d|each|both|every)/i.test(tail.trim()) ? ' ' : ' ' + tail);
  t = t.replace(/\b\d+\s*[×x]\s*\d+\s*s?\b/gi, ' ')                 // 3×5
       .replace(/~?\b\d+\s*(s|sec|secs|seconds|reps?|min|cm)\b/gi, ' ') // 5s, 3 reps, 60cm
       .replace(/^\s*\d+\s+/, ' ')                                     // "3 strict pull-ups"
       .replace(/\b(each|both) (side|sides|ways|arms?|legs?)\b/gi, ' ')
       .replace(/\bfull range\b/gi, ' ');
  const name = t.replace(/\s+/g, ' ').replace(/^[\s,·]+|[\s,·]+$/g, '').trim();
  return name || String(text || '').trim();
}

const _RUNG_STOP = new Set(['the', 'a', 'an', 'to', 'and', 'with', 'on', 'of', 'at', 'from', 'high', 'low', 'box',
  'controlled', 'comfortable', 'consistent', 'full', 'clean', 'basic', 'progression', 'progressions', 'drill']);
// Words that name a different rung of the same movement. A library exercise
// carrying one the rung doesn't have is a different rung, not a match.
const _RUNG_VARIANT = new Set(['tuck', 'straddle', 'advanced', 'assisted', 'weighted', 'one', 'one-arm', 'one-leg',
  'negative', 'eccentric', 'kipping', 'strict', 'archer', 'reverse', 'wall', 'freestanding']);
function _rungTokens(s) {
  return String(s || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9-]+/g, ' ')
    .split(' ').map(w => w.replace(/^-+|-+$/g, '')).filter(w => w && !/^\d+$/.test(w) && !_RUNG_STOP.has(w))
    .map(w => w.replace(/s$/, ''));
}

// Library exercise that is the same movement as the rung. Strict on
// purpose: "Pistol squat" must not land on the barbell "Squat", nor
// "Freestanding handstand" on "Handstand — tuck freestanding".
function rungExercise(name, exercises, feeds) {
  const rt = new Set(_rungTokens(name));
  if (!rt.size) return null;
  let best = null, bestScore = 0;
  (exercises || []).forEach(ex => {
    const et = [...new Set(_rungTokens(ex.name))];
    if (!et.length) return;
    if (et.some(w => _RUNG_VARIANT.has(w) && !rt.has(w))) return;
    const inter = et.filter(w => rt.has(w)).length;
    const jac = inter / new Set([...et, ...rt]).size;
    // every word of the exercise is in the rung, and it is most of the rung
    const covers = inter === et.length && et.length >= 2 && jac >= 0.4;
    if (!(covers || jac >= 0.6)) return;
    const score = jac + (covers ? 0.3 : 0) + ((feeds || []).includes(ex.id) ? 0.2 : 0);
    if (score > bestScore) { best = ex; bestScore = score; }
  });
  return best;
}

function rungGlossary(name, goalName) {
  const n = String(name || '').toLowerCase();
  const g = String(goalName || '').toLowerCase();
  return RUNG_GLOSSARY.find(e => e.re.test(n) && (!e.goal || e.goal.test(g))) || null;
}

// Everything the sheet needs for one rung.
function rungInfo(goal, text, exercises) {
  const name = rungName(text);
  const gName = (goal && goal.name) || '';
  const gloss = rungGlossary(name, gName);
  const ex = rungExercise(name, exercises, goal && goal.feedExercises);
  // A search for "Top hold" alone is useless; add the goal when the rung
  // doesn't already name the movement.
  const nt = new Set(_rungTokens(name));
  const q = _rungTokens(gName).some(w => nt.has(w)) ? name : `${name} ${gName}`;
  return { name, what: gloss ? gloss.what : '', cue: (gloss && gloss.cue) || '', ex,
           search: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q.trim() + ' tutorial') };
}
