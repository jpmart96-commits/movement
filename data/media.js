// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — EXERCISE MEDIA
// data/media.js — instructions, demo video and image links, keyed by id.
//
// Loaded after library.js (and complementary.js). Fills link / imageUrl /
// instructions onto LIBRARY entries so library.js itself stays untouched.
// Settings → Exercise library overrides still win: Overrides.apply() layers
// on top of these values at session time.
//
//   link      — a real YouTube video (replaces the search-results link)
//   imageUrl  — optional. When empty, the app shows the YouTube thumbnail.
//               Photos from free-exercise-db (public domain, Unlicense):
//               github.com/yuhonas/free-exercise-db
//   instructions — "How" steps, one per line. "Watch for" stays in notes.
//   videoBy   — channel, for review only (not read by the app).
//
// Batch 1 (26 Sep 2026): Tier 1 — exercises in the month plan or logged.
// Batch 2 (26 Sep 2026): Tier 2 — the complementary rotation (129).
// ─────────────────────────────────────────────────────────────

const EXERCISE_MEDIA = {
  // ── Batch 1: Tier 1 ─────────────────────────────────────────
  'breathing-478': {
    link: "https://www.youtube.com/watch?v=YRPh_GaiL8s",
    videoBy: "Andrew Weil, M.D.",
    instructions: "1. Sit or lie comfortably. Rest the tip of the tongue just behind the upper front teeth.\n2. Exhale fully through the mouth with a soft whoosh.\n3. Close the mouth and inhale quietly through the nose for 4 counts.\n4. Hold the breath for 7 counts.\n5. Exhale through the mouth for 8 counts. That is one breath; repeat for 4 breaths to start.",
  },
  'body-scan': {
    link: "https://www.youtube.com/watch?v=MHc-rbfSbwk",
    videoBy: "Fostering Resilience",
    instructions: "1. Lie on your back or sit, eyes closed. Take a few slow breaths.\n2. Bring attention to the toes of one foot. Notice what is there without changing it.\n3. Move attention slowly up: foot, ankle, calf, knee, thigh, hip. Then the other leg.\n4. Continue through pelvis, belly, chest, back, hands, arms, shoulders, neck, face and scalp.\n5. Finish by sensing the whole body at once for a few breaths.",
  },
  'tre-tremoring': {
    link: "https://www.youtube.com/watch?v=FeUioDuJjFI",
    videoBy: "TRE FOR ALL",
    instructions: "1. Warm up the legs: slow calf raises, a wall sit or a held lunge until the legs feel tired.\n2. Lie on your back, soles of the feet together, knees dropped open.\n3. Lift the pelvis slightly, then lower it and slowly bring the knees an inch or two toward each other.\n4. Pause at each position and let any tremor in the legs and pelvis happen on its own.\n5. Stay 5–15 minutes. To stop, straighten the legs and rest flat for a couple of minutes.",
  },
  'eye-cars': {
    link: "https://www.youtube.com/watch?v=dfPY10zCZxQ",
    videoBy: "CreativeLive",
    instructions: "1. Sit or stand tall, head still. Look straight ahead.\n2. Move the eyes up as far as they go without strain.\n3. Trace the largest slow circle you can: up, out to the side, down, across, back up.\n4. Keep the head and face relaxed; only the eyes move.\n5. Do 3 slow circles each direction, then close the eyes for a few breaths.",
  },
  'near-far-focus': {
    link: "https://www.youtube.com/watch?v=DTopAJ7iwMg",
    videoBy: "naturaleyecare",
    instructions: "1. Hold a thumb or small target about 25 cm in front of your nose.\n2. Focus on it until it is sharp.\n3. Shift focus to something far away (the horizon or across the room) until it is sharp.\n4. Shift back to the thumb. Keep the head still; only the focus changes.\n5. Continue for 1–2 minutes at a steady rhythm.",
  },
  'peripheral-tracking': {
    link: "https://www.youtube.com/watch?v=RhdUV4F_ybM",
    videoBy: "Neurobuff",
    instructions: "1. Pick a fixed point straight ahead and keep your eyes on it the whole time.\n2. Hold a finger or pen at arm's length in front of you.\n3. Move it slowly out to the side and around the edge of your vision.\n4. Notice how far out you can still sense its movement without looking at it.\n5. Work both sides, above and below. 1–2 minutes.",
  },
  'squat': {
    link: "https://www.youtube.com/watch?v=gcNh17Ckjgg",
    videoBy: "Jeremy Ethier",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Full_Squat/1.jpg",
    instructions: "1. Bar on the upper back, hands just outside the shoulders, feet shoulder-width, toes slightly out.\n2. Brace: big breath into the belly, ribs down.\n3. Sit down and back between the hips, knees tracking over the toes.\n4. Reach at least parallel with the back neutral and heels down.\n5. Drive up through the whole foot, chest and hips rising together.",
  },
  'incline-bench': {
    link: "https://www.youtube.com/watch?v=5kyLUGVq_pk",
    videoBy: "Colossus Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
    instructions: "1. Bench at about 30°. Eyes under the bar, feet planted.\n2. Squeeze the shoulder blades back and down; keep a slight arch.\n3. Grip just outside shoulder-width. Unrack over the upper chest.\n4. Lower with control to the upper chest, elbows about 45–60° from the body.\n5. Press up and slightly back to lockout over the shoulders.",
  },
  'pull-up': {
    link: "https://www.youtube.com/watch?v=rmdn5X_KLkY",
    videoBy: "SaturnoMovement",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/1.jpg",
    instructions: "1. Hang from the bar, hands just outside shoulder-width, arms straight.\n2. Start by pulling the shoulder blades down.\n3. Pull the chest toward the bar, elbows driving down to the ribs.\n4. Chin clears the bar without craning the neck.\n5. Lower all the way to a dead hang before the next rep.",
  },
  'lateral-raise': {
    link: "https://www.youtube.com/watch?v=pgrWjBfaFe8",
    videoBy: "Colossus Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/1.jpg",
    instructions: "1. Stand tall, dumbbells at your sides, slight bend in the elbows.\n2. Lean slightly forward from the hips.\n3. Raise the arms out to the side, leading with the elbows.\n4. Stop at shoulder height, hands no higher than elbows.\n5. Lower slowly over 2–3 seconds.",
  },
  'toes-to-bar': {
    link: "https://www.youtube.com/watch?v=j2r4iMy8Hb0",
    videoBy: "The Strength Institute",
    instructions: "1. Hang from the bar, arms straight, shoulders engaged.\n2. Brace the core and tilt the pelvis back slightly.\n3. Keeping legs as straight as you can, raise the feet toward the bar.\n4. Touch the bar with the toes without swinging.\n5. Lower slowly to the hang and kill any swing before the next rep.",
  },
  'deadlift': {
    link: "https://www.youtube.com/watch?v=XxWcirHIwVo",
    videoBy: "Jeremy Ethier",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg",
    instructions: "1. Bar over mid-foot, feet hip-width. Grip just outside the legs.\n2. Hips down until the shins touch the bar; chest up, back flat.\n3. Take the slack out of the bar, brace hard.\n4. Push the floor away, bar dragging up the legs.\n5. Lock out with hips and knees together. Lower by hinging the hips back first.",
  },
  'overhead-press': {
    link: "https://www.youtube.com/watch?v=KEAS2bypjFg",
    videoBy: "Colossus Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/1.jpg",
    instructions: "1. Bar on the front of the shoulders, grip just outside shoulder-width, elbows slightly forward.\n2. Squeeze glutes and brace; ribs down.\n3. Press straight up, moving the head back out of the way.\n4. At the top, push the head through so the bar is over the mid-foot and ears are between the arms.\n5. Lower under control to the shoulders.",
  },
  'cable-row': {
    link: "https://www.youtube.com/watch?v=OeLb503NZHk",
    videoBy: "The Healthy Habit",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg",
    instructions: "1. Sit tall, feet on the platform, knees slightly bent.\n2. Grab the handle with arms straight, shoulders reaching forward.\n3. Pull the shoulder blades back first, then the elbows past the torso.\n4. Touch the handle to the lower ribs without leaning back.\n5. Return slowly until the arms are straight and the shoulders reach forward.",
  },
  'triceps-dip': {
    link: "https://www.youtube.com/watch?v=KoS_NMmuxMM",
    videoBy: "FitnessFAQs",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Triceps_Version/0.jpg",
    instructions: "1. Support yourself on parallel bars, arms locked, shoulders down.\n2. Keep the torso fairly upright for triceps emphasis.\n3. Lower until the upper arms are about parallel to the floor.\n4. Keep elbows tracking back, not flaring out.\n5. Press back up to full lockout.",
  },
  'plank': {
    link: "https://www.youtube.com/watch?v=A2b2EmIg0dA",
    videoBy: "E3 Rehab",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/1.jpg",
    instructions: "1. Forearms on the floor, elbows under the shoulders.\n2. Legs straight, feet together or hip-width.\n3. Tuck the pelvis slightly and squeeze the glutes.\n4. Push the floor away so the upper back doesn't sag.\n5. Hold a straight line from head to heels; breathe steadily.",
  },
  'hip-thrust': {
    link: "https://www.youtube.com/watch?v=mJObkwsEkWs",
    videoBy: "Colossus Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg",
    instructions: "1. Sit with the upper back against a bench, bar padded over the hips.\n2. Feet flat, about hip-width, shins vertical at the top.\n3. Tuck the chin and ribs; tilt the pelvis back.\n4. Drive through the heels until hips are fully extended.\n5. Squeeze the glutes for 1–2 seconds, then lower under control.",
  },
  'face-pulls': {
    link: "https://www.youtube.com/watch?v=ljgqer1ZpXg",
    videoBy: "ATHLEAN-X",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg",
    instructions: "1. Rope at upper-chest or face height. Grip with thumbs toward you.\n2. Step back until the arms are straight and the cable is taut.\n3. Pull the rope toward the face, elbows high and wide.\n4. Finish by rotating the hands back so they end beside the ears.\n5. Pause, then return slowly.",
  },
  'band-pull-aparts': {
    link: "https://www.youtube.com/watch?v=KLb758dtKwU",
    videoBy: "The Chiropractic Biomechanic",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Band_Pull_Apart/0.jpg",
    instructions: "1. Hold a light band at shoulder height, arms straight, hands shoulder-width.\n2. Keep the ribs down; don't arch.\n3. Pull the band apart by squeezing the shoulder blades together.\n4. Bring the band to the chest, arms still straight.\n5. Return slowly, keeping tension on the band.",
  },
  'ext-rotation-bands': {
    link: "https://www.youtube.com/watch?v=4HqMXMn3FBk",
    videoBy: "Lift With Michelle",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/External_Rotation_with_Band/1.jpg",
    instructions: "1. Anchor the band at elbow height. Stand side-on to it.\n2. Elbow bent at 90°, tucked against your side (a rolled towel helps).\n3. Start with the forearm across the belly.\n4. Rotate the forearm out, away from the body, keeping the elbow pinned.\n5. Return slowly. Do both arms.",
  },
  'neck-work': {
    link: "https://www.youtube.com/watch?v=6k9VQNN8B5U",
    videoBy: "TrackActive",
    instructions: "1. Sit or stand tall, shoulders relaxed.\n2. Flexion: nod the chin toward the chest, then return.\n3. Extension: look up and back slowly, then return.\n4. Lateral: tilt the ear toward the shoulder on each side.\n5. Add light hand or band resistance only once each direction moves pain-free. Slow reps.",
  },
  'wrist-prep': {
    link: "https://www.youtube.com/watch?v=mSZWSQSSEjE",
    videoBy: "GMB Fitness",
    instructions: "1. Kneel on all fours, hands shoulder-width.\n2. Circle the wrists with the palms on the floor, both directions.\n3. Turn the fingers to face your knees and gently lean back.\n4. Turn the backs of the hands down and gently lean back.\n5. Finish with finger extensions: spread and press the fingers into the floor, lifting the palms.",
  },
  'rice-bucket': {
    link: "https://www.youtube.com/watch?v=EX_XDq71IGQ",
    videoBy: "Hunter Physio",
    instructions: "1. Fill a bucket with rice deep enough to cover the forearm.\n2. Push the hand in to mid-forearm.\n3. Open and close the hand repeatedly.\n4. Then rotate, twist, and flex/extend the wrist through the rice.\n5. Do 20–30 seconds per movement, both hands.",
  },
  'first-knuckle-raises': {
    link: "https://www.youtube.com/watch?v=Un4TtjbHLjg",
    videoBy: "Hybrid Spine and Sport",
    instructions: "1. Start in a plank with index fingers parallel.\n2. Press off the palms onto the fingers only, thumbs off the ground.\n3. Use whole fingers, not just the tips.\n4. Lower the palms back down under control.\n5. If too hard: knees down, then knees with hips on heels, then leaning on a wall.",
  },
  'fin-pushups': {
    link: "https://www.youtube.com/watch?v=FZvvs9rx4gs",
    videoBy: "Kimmo",
    instructions: "1. Kneel and place the backs of the wrists on the floor, fingers pointing back.\n2. Hands wide enough that forearms stay vertical at the bottom.\n3. Start on the knees; lower slowly.\n4. Press back up without letting the wrists roll.\n5. Progress to full push-ups when comfortable. Keep volume low.",
  },
  'dorsal-pushups': {
    link: "https://www.youtube.com/watch?v=oSkF3CCExnY",
    videoBy: "GymnasticBodies",
    instructions: "1. Kneel and put the backs of the hands on the floor, arms turned in (pinkies pointing back or in).\n2. Keep the load light: start on the knees.\n3. Lower a few centimetres, then press back up.\n4. Stop well short of pain in the wrist.\n5. Build range and reps slowly over weeks.",
  },
  'box-jump': {
    link: "https://www.youtube.com/watch?v=G-bxQY57mKc",
    videoBy: "Runna",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Box_Jump/1.jpg",
    instructions: "1. Stand about a foot from the box, feet hip-width.\n2. Swing the arms back and dip into a quarter squat.\n3. Jump, driving the arms up, and land softly on the whole foot.\n4. Land in a half squat with knees over toes, then stand up tall.\n5. Step down, don't jump down. Reset fully between reps.",
  },
  'farmers-walk': {
    link: "https://www.youtube.com/watch?v=NH7Xv-7NQNQ",
    videoBy: "Buff Dudes Workouts",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/1.jpg",
    instructions: "1. Deadlift the weights up with a flat back.\n2. Stand tall, shoulders down and back, weights at your sides.\n3. Brace the core.\n4. Walk with short, quick steps, keeping the torso still.\n5. Walk the set distance, then set the weights down with a flat back.",
  },
  'easy-run': {
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Trail_Running_Walking/1.jpg",
    instructions: "1. Warm up with a few minutes of walking or very easy jogging.\n2. Run at a pace you can hold a conversation at.\n3. Breathe through the nose if you can.\n4. Keep steps short and relaxed.\n5. Cool down with a few minutes of walking.",
  },
  'z2-cycling': {
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bicycling_Stationary/0.jpg",
    instructions: "1. Set up the bike: slight knee bend at the bottom of the pedal stroke.\n2. Warm up for 5 minutes easy.\n3. Ride at zone 2 heart rate, where nose breathing is comfortable.\n4. Keep the cadence smooth, around 80–90 rpm.\n5. Hold for the planned time. Cool down 5 minutes.",
  },
  'interval-run': {
    link: "https://www.youtube.com/watch?v=3r0Kd3G4kek",
    videoBy: "VO2 Max Lab",
    instructions: "1. Warm up for 10–15 minutes of easy running plus a few strides.\n2. Run 4 minutes hard, reaching 90–95% of max heart rate.\n3. Recover 3 minutes with easy jogging.\n4. Repeat for 4 rounds.\n5. Cool down for 10 minutes easy.",
  },
  'tempo-run': {
    link: "https://www.youtube.com/watch?v=hDYp3U8b1nU",
    videoBy: "Sage Running",
    instructions: "1. Warm up for 10–15 minutes easy.\n2. Settle into a comfortably hard pace you could hold for about an hour in a race.\n3. Breathing is strong but controlled; only short phrases are possible.\n4. Hold the pace steady for the planned block (20–30 minutes).\n5. Cool down for 10 minutes easy.",
  },
  'walking': {
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Walking_Treadmill/0.jpg",
    instructions: "1. Walk at a relaxed pace.\n2. No targets. Just move.",
  },
  'uphill-sprints': {
    link: "https://www.youtube.com/watch?v=VzHQUh5jzsI",
    videoBy: "TaylorMade Coaching & Events",
    instructions: "1. Find a steep hill with 10–15 seconds of running on it.\n2. Warm up well: easy jog, drills, a couple of strides.\n3. Sprint up at near-max effort: lean from the ankles, drive the knees and arms.\n4. Walk back down slowly.\n5. Rest fully (2–3 minutes) before the next rep.",
  },
  'broad-jump': {
    link: "https://www.youtube.com/watch?v=dVgtvAXeBQw",
    videoBy: "Athletics Coach",
    instructions: "1. Stand with feet hip-width, toes behind a line.\n2. Swing the arms back and load the hips.\n3. Explode forward, swinging the arms through.\n4. Pull the knees up and reach the feet out to land.\n5. Stick the landing with bent knees. Measure, walk back, reset.",
  },
  'med-ball-slams': {
    link: "https://www.youtube.com/watch?v=lsMGmkvzFsE",
    videoBy: "Bodybuilding.com",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Overhead_Slam/1.jpg",
    instructions: "1. Stand hip-width holding a slam ball.\n2. Lift it overhead, rising onto the toes and extending the whole body.\n3. Slam it down in front of the feet with the whole body, hinging at the hips.\n4. Follow through with the arms.\n5. Pick it up with a flat back and go again.",
  },
  'ring-hold-support': {
    link: "https://www.youtube.com/watch?v=6IWGetY9qLw",
    videoBy: "TotalHumanOptimization",
    instructions: "1. Rings at about hip height. Jump or press into support.\n2. Arms locked, shoulders pushed down away from the ears.\n3. Turn the rings out slightly so the palms face forward.\n4. Body straight, legs together, rings against the sides.\n5. Hold with minimal shaking. Practise with a false grip (wrist over the ring) in some sets.",
  },
  'german-hang': {
    link: "https://www.youtube.com/watch?v=5KaDOUeMY98",
    videoBy: "GMB Fitness",
    instructions: "1. Rings or bar within reach. Start from a hang or tucked position.\n2. Tuck and rotate backward through the skin-the-cat.\n3. Lower the feet toward the floor until the shoulders open into extension.\n4. Stop where the stretch is strong but controlled; feet can stay on the floor to start.\n5. Return the same way. Build hold time slowly.",
  },
  'ring-dip': {
    link: "https://www.youtube.com/watch?v=DY4wvmSDP0g",
    videoBy: "Leon Thorley",
    instructions: "1. Start in the ring support: arms locked, rings by your sides.\n2. Lower slowly, elbows tracking back, rings staying close to the body.\n3. Go down until the shoulders are just below the elbows.\n4. Keep the rings from drifting out.\n5. Press up and turn the rings out at the top.",
  },
  'ball-eye-patched': {
    link: "https://www.youtube.com/watch?v=JNHxkeRmMws",
    videoBy: "YouGoProBaseball",
    instructions: "1. Cover one eye with a patch or your hand.\n2. Stand 1–2 m from a solid wall with a ping pong or tennis ball.\n3. Throw the ball at the wall and catch it with the same hand.\n4. Keep a steady rhythm; move closer or throw faster to progress.\n5. Do the same amount of time with the other eye covered, then switch hands.",
  },
  'juggling-cascade': {
    link: "https://www.youtube.com/watch?v=SHYDbOLrU1w",
    videoBy: "Ultimate101",
    instructions: "1. Start with one ball: throw it in an arc from hand to hand, peaking just above eye level.\n2. Two balls: throw the first; when it peaks, throw the second underneath it. Catch both, then stop.\n3. Three balls: start with two in the dominant hand. Throw, and each time a ball peaks, throw the next.\n4. Throws go inside, catches happen outside. Keep elbows at your sides.\n5. Count throws. Aim for 10, then 20 in a row before adding tricks.",
  },
  'juggling-variations': {
    link: "https://www.youtube.com/watch?v=SSbNtVfMdgM",
    videoBy: "Ultimate101",
    instructions: "1. Start from a steady 3-ball cascade.\n2. Pick one trick (columns, reverse cascade, under the leg) and work only that trick in each set.\n3. Enter the trick for one throw, then return to the cascade.\n4. When single throws are clean, string two or three together.\n5. Stop the set when throws go wild; quality over reps.",
  },
  'juggling-columns': {
    link: "https://www.youtube.com/watch?v=nkAMDSNXCxY",
    videoBy: "Niels Duinker",
    instructions: "1. Hold two balls in the dominant hand and one in the other.\n2. Throw one ball from the dominant hand straight up the middle.\n3. As it peaks, throw the two outside balls straight up together, one from each hand.\n4. Catch the middle ball and throw it again as the outside pair peaks.\n5. Keep all three in vertical lanes. Practise the outside pair on its own first.",
  },
  'juggling-reverse-cascade': {
    link: "https://www.youtube.com/watch?v=rDeneW2EoxQ",
    videoBy: "Niels Duinker",
    instructions: "1. Start from the normal cascade to set the rhythm.\n2. Throw each ball from the outside of the hand, over the top of the incoming ball.\n3. Each ball lands on the inside and is carried out before its next throw.\n4. Keep throws the same height on both sides.\n5. Practise with 2 balls first, then 3.",
  },
  'juggling-half-shower': {
    link: "https://www.youtube.com/watch?v=Mf04OllYlOM",
    videoBy: "Circus Made Simple",
    instructions: "1. Start in a cascade.\n2. Make one hand throw higher, over the top, landing on the far side.\n3. The other hand keeps throwing low underneath, as in the cascade.\n4. The high throws cross above; the low ones pass underneath.\n5. Switch which hand throws high every set.",
  },
  'dead-hang': {
    link: "https://www.youtube.com/watch?v=jBZCzK9zlxk",
    videoBy: "Dr. Allan Bacon",
    instructions: "1. Grip the bar shoulder-width, full grip with the thumbs.\n2. Let the body hang, arms straight.\n3. Relax the shoulders up toward the ears and let the spine lengthen.\n4. Keep the legs quiet and breathe slowly.\n5. Step down before the grip fails.",
  },
  'active-hang': {
    instructions: "1. Start in a dead hang, arms straight.\n2. Pull the shoulder blades down away from the ears without bending the elbows.\n3. The body rises a few centimetres.\n4. Hold for 3 seconds.\n5. Relax back to a dead hang for 1 second. Repeat.",
  },
  'hollow-body-hold': {
    link: "https://www.youtube.com/watch?v=HAfUt2Cco74",
    videoBy: "Zack Henderson",
    instructions: "1. Lie on your back, arms overhead, legs straight.\n2. Press the lower back into the floor by tilting the pelvis back.\n3. Lift the shoulders and legs off the floor.\n4. Keep the lower back flat; lower the legs only as far as you can hold it.\n5. Regress with bent knees or arms by your sides.",
  },
  'couch-stretch': {
    link: "https://www.youtube.com/watch?v=WKo4APrwfXQ",
    videoBy: "Flow Motion Fitness",
    instructions: "1. Kneel with one knee at the base of a wall or couch, shin up against it.\n2. Put the other foot forward in a lunge.\n3. Squeeze the glute of the back leg and tuck the pelvis.\n4. Slowly bring the torso upright.\n5. Hold 1–2 minutes each side, breathing slowly.",
  },
  'hamstring-hang': {
    link: "https://www.youtube.com/watch?v=2W7Dhf6n5aM",
    videoBy: "Dani Winks Flexibility",
    instructions: "1. Stand with feet hip-width, knees soft.\n2. Fold forward from the hips and let the upper body hang.\n3. Hold the opposite elbows and let the head drop.\n4. Sway gently and let gravity do the work.\n5. Roll up slowly when finished.",
  },
  'hamstring-pike': {
    link: "https://www.youtube.com/watch?v=B6--yoHH_Mw",
    videoBy: "GymnasticBodies",
    instructions: "1. Stand with feet together, legs straight.\n2. Hinge forward from the hips, keeping the back long.\n3. Reach the hands toward or past the feet.\n4. Pull the kneecaps up to keep the legs straight.\n5. Hold and breathe; ease deeper on each exhale.",
  },
  'hamstring-pnf': {
    link: "https://www.youtube.com/watch?v=xjWfi4S6yOI",
    videoBy: "Saif Haquz",
    instructions: "1. Lie on your back and lift one straight leg; hold it with a strap or your hands.\n2. Take it to a mild stretch.\n3. Contract: push the leg down into the strap at about 30% effort for 5–6 seconds.\n4. Relax, then pull the leg a little further on the exhale.\n5. Repeat 3–4 rounds per side.",
  },
  'pancake': {
    link: "https://www.youtube.com/watch?v=CHRUb43S6RM",
    videoBy: "Strength Side",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/The_Straddle/0.jpg",
    instructions: "1. Sit with legs wide in a straddle, toes up, knees straight.\n2. Sit up tall; elevate the hips on a cushion if the back rounds.\n3. Tilt the pelvis forward and walk the hands forward.\n4. Lead with the chest, not the head.\n5. Hold and breathe; use contract-relax to ease deeper.",
  },
  'middle-splits': {
    link: "https://www.youtube.com/watch?v=4RkHIxk-K8Q",
    videoBy: "Movesmethod",
    instructions: "1. Stand with feet wide, hands on blocks or the floor.\n2. Slide the feet out slowly (on a sliding surface if you have one).\n3. Keep the toes pointed up or forward and the knees straight.\n4. Stop at a strong but tolerable stretch; hold and breathe.\n5. Push down with the inner thighs to come back up.",
  },
  'foam-rolling': {
    link: "https://www.youtube.com/watch?v=Oc6gHIS7Qos",
    videoBy: "Airrosti Rehab Centers",
    instructions: "1. Place the roller under the target area: calves, quads, glutes, upper back.\n2. Roll slowly, about 2–3 cm per second.\n3. When you find a tender spot, pause and breathe for 20–30 seconds.\n4. Avoid rolling directly on the lower back and joints.\n5. About 1 minute per area.",
  },
  'yoga-childs-pose': {
    link: "https://www.youtube.com/watch?v=eqVMAPM00DM",
    videoBy: "Yoga With Adriene",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Childs_Pose/0.jpg",
    instructions: "1. Kneel with the big toes together, knees together or wide.\n2. Sit the hips back toward the heels.\n3. Fold forward and rest the forehead on the floor.\n4. Arms long in front or by your sides.\n5. Breathe into the back of the ribs.",
  },
  'yoga-cat-cow': {
    link: "https://www.youtube.com/watch?v=y39PrKY_4JM",
    videoBy: "Yoga With Adriene",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cat_Stretch/0.jpg",
    instructions: "1. On all fours, wrists under shoulders, knees under hips.\n2. Inhale: drop the belly, lift the chest and tailbone (cow).\n3. Exhale: round the spine, tuck the tailbone and chin (cat).\n4. Move one segment at a time, starting from the pelvis.\n5. Continue for 5–10 slow breaths.",
  },
  'yoga-reclined-twist': {
    link: "https://www.youtube.com/watch?v=mKC3IeldPOc",
    videoBy: "Yoga With Adriene",
    instructions: "1. Lie on your back, arms out in a T.\n2. Bring the knees toward the chest.\n3. Let both knees drop to one side.\n4. Keep both shoulders on the floor; turn the head the other way if comfortable.\n5. Hold for 5–10 breaths, then switch sides.",
  },
  'yoga-pigeon': {
    link: "https://www.youtube.com/watch?v=0_zPqA65Nok",
    videoBy: "Yoga With Adriene",
    instructions: "1. From all fours, bring one knee forward behind the same wrist.\n2. Angle the front shin; the closer to parallel with the front of the mat, the more intense.\n3. Slide the back leg straight behind you.\n4. Square the hips; prop the front hip on a cushion if it floats.\n5. Stay upright or fold forward. Hold 1–2 minutes per side.",
  },
  'yoga-seated-forward-fold': {
    link: "https://www.youtube.com/watch?v=g7Uhp5tphAs",
    videoBy: "Yoga With Adriene",
    instructions: "1. Sit with legs straight in front, feet flexed.\n2. Sit up tall; a cushion under the hips helps.\n3. Hinge forward from the hips, keeping the back long.\n4. Reach toward the feet without pulling the back into a round.\n5. Hold and breathe; soften on each exhale.",
  },
  'yoga-legs-up-wall': {
    link: "https://www.youtube.com/watch?v=_OQEIiZLY-0",
    videoBy: "Yoga With Adriene",
    instructions: "1. Sit side-on to a wall with one hip touching it.\n2. Swing the legs up the wall as you lie back.\n3. Scoot the hips close to the wall.\n4. Rest the arms by your sides, palms up.\n5. Stay 5–10 minutes, breathing slowly.",
  },
  'hip-90-90-stretch': {
    link: "https://www.youtube.com/watch?v=t4Zz6-aG8Iw",
    videoBy: "Jack Hanrahan Fitness",
    instructions: "1. Sit with the front leg bent at 90° in front and the back leg bent at 90° to the side.\n2. Sit up tall over the front shin.\n3. Hinge forward over the front leg for the stretch.\n4. Rotate the knees to the other side to switch.\n5. Hold each side 30–60 seconds, or flow side to side.",
  },
  'runners-lunge-stretch': {
    link: "https://www.youtube.com/watch?v=iZ1eZBY4fwM",
    videoBy: "PureGym",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Kneeling_Hip_Flexor/0.jpg",
    instructions: "1. Kneel in a lunge, back knee on the floor (padded).\n2. Front knee over the ankle.\n3. Tuck the pelvis and squeeze the back-leg glute.\n4. Shift the hips forward until you feel the front of the hip stretch.\n5. Hold 30–60 seconds each side.",
  },
  'half-split-stretch': {
    link: "https://www.youtube.com/watch?v=h_wtmUMu0MU",
    videoBy: "YanvaYoga",
    instructions: "1. Start in a kneeling lunge.\n2. Shift the hips back over the back knee.\n3. Straighten the front leg, toes up.\n4. Hinge forward over the front leg with a long back.\n5. Hold 30–60 seconds each side.",
  },
  'saccade-chart': {
    link: "https://www.youtube.com/watch?v=z-BH_95_f-w",
    videoBy: "Insight Vision Optometry",
  },

  // ── Batch 2: Tier 2 (complementary rotation) ────────────────
  'pronator-stretch': {
    link: "https://www.youtube.com/watch?v=f4UhnKCHM98",
    videoBy: "Nottingham Physio",
    instructions: "1. Extend the arm fully in front of you, elbow straight, palm facing down.\n2. Wrap the other hand around the forearm just above the wrist.\n3. Slowly rotate the forearm to turn the palm upward until you feel a stretch along the inner forearm.\n4. Hold 20–30 seconds, breathing steadily, then switch sides.",
  },
  'tendon-glides': {
    link: "https://www.youtube.com/watch?v=favZefGkiHk",
    videoBy: "Ability Rehabilitation",
    instructions: "1. Start with fingers straight and together, like a flat hand.\n2. Bend the fingers into a hook fist, keeping the knuckles straight.\n3. Make a full fist, tucking the fingers into the palm.\n4. Flatten into a tabletop shape, bending only at the big knuckles.\n5. Cycle slowly through each shape, 5–10 reps per hand.",
  },
  'prayer-stretch': {
    link: "https://www.youtube.com/watch?v=vjhQCfF5Y-g",
    videoBy: "Dr. Christy Lee",
    instructions: "1. Bring the palms together at chest height, fingers pointing up.\n2. Keep the palms pressed together as you slowly lower the hands toward the waist.\n3. Stop when you feel a stretch along the forearms and wrists, keeping the palms in contact.\n4. Hold 20–30 seconds, then raise back to the start.",
  },
  'wrist-circles': {
    link: "https://www.youtube.com/watch?v=mSZWSQSSEjE",
    videoBy: "GMB Fitness (Praxis)",
    instructions: "1. Clasp the hands together, or extend the arms out in front.\n2. Slowly circle both wrists in one direction for 10–15 reps.\n3. Reverse direction for another 10–15 reps.\n4. Keep the movement slow and pain-free, expanding the range gradually.",
  },
  'open-awareness': {
    link: "https://www.youtube.com/watch?v=yHPzMHsc-JU",
    videoBy: "Yongey Mingyur Rinpoche",
    instructions: "1. Sit comfortably with eyes open or softly closed.\n2. Let go of focusing on any single object, such as breath, sound, or thought.\n3. Rest as open, spacious awareness, simply noticing whatever arises.\n4. If you get caught in a thought, gently return to open noticing.\n5. Continue for 5–15 minutes.",
  },
  'box-breathing': {
    link: "https://www.youtube.com/watch?v=tEmt1Znux58",
    videoBy: "Sunnybrook Hospital",
    instructions: "1. Sit tall and exhale fully to start.\n2. Inhale through the nose for a count of 4.\n3. Hold the breath gently for a count of 4.\n4. Exhale through the nose for a count of 4, then hold empty for a count of 4.\n5. Repeat the cycle for 4–8 rounds.",
  },
  'diaphragmatic-breathing': {
    link: "https://www.youtube.com/watch?v=SYJu_y6WvEc",
    videoBy: "Conor Harris",
    instructions: "1. Lie down or sit with one hand on the chest and one on the belly.\n2. Inhale slowly through the nose, letting the belly rise while the chest stays still.\n3. Exhale slowly through pursed lips, feeling the belly fall.\n4. Keep the breath slow and quiet, avoiding shoulder movement.\n5. Practice 5–10 minutes, or use it before other breathwork.",
  },
  'wim-hof': {
    link: "https://www.youtube.com/watch?v=g0Cu31O3ND0",
    videoBy: "Wim Hof",
    instructions: "1. Sit or lie down somewhere safe, never near water or before driving.\n2. Take 30 deep, full breaths in through the nose or mouth, letting them go without forcing the exhale.\n3. After the last breath, exhale and hold with the lungs empty for as long as is comfortable.\n4. Inhale fully and hold for 10–15 seconds, then release.\n5. Repeat for 3 rounds, resting normally between them.",
  },
  'physiological-sigh': {
    link: "https://www.youtube.com/watch?v=rBdhqBGqiMc",
    videoBy: "Andrew Huberman",
    instructions: "1. Take a deep inhale through the nose.\n2. Before exhaling, sneak in a second short, sharp inhale to top off the lungs.\n3. Exhale slowly and fully through the mouth.\n4. Repeat for 1–3 breaths whenever you need a quick calming reset.",
  },
  'extended-exhale': {
    link: "https://www.youtube.com/watch?v=GhfXMP02dRw",
    videoBy: "Pocket Breath Coach - Luke Horton",
    instructions: "1. Sit or lie comfortably with the mouth closed.\n2. Inhale through the nose for a count of 4.\n3. Exhale slowly through the nose for a count of 8, keeping it smooth and controlled.\n4. Repeat for 5–10 rounds, lengthening the exhale further if comfortable.",
  },
  'trataka': {
    link: "https://www.youtube.com/watch?v=_IYH3foigeo",
    videoBy: "RISE",
    instructions: "1. Place a lit candle at eye level, about an arm's length away.\n2. Sit comfortably and gaze softly at the flame without straining.\n3. Blink as little as possible until the eyes tear up naturally, then close them.\n4. With eyes closed, visualize the afterimage of the flame between the brows.\n5. Repeat 2–3 rounds, finishing with the eyes closed and resting.",
  },
  'yoga-nidra': {
    link: "https://www.youtube.com/watch?v=TwDsdyH-AzE",
    videoBy: "AumShakti by Esh",
    instructions: "1. Lie down in a comfortable position and let the body settle completely.\n2. Set a brief intention for the practice.\n3. Follow the guided body scan, noticing sensation without moving.\n4. Stay with the guidance through breath awareness and visualization.\n5. Allow a slow return to alertness at the end before opening the eyes.",
  },
  'visualization': {
    link: "https://www.youtube.com/watch?v=EAGKsvhAPME",
    videoBy: "Sam Martin - Peak Performance",
    instructions: "1. Sit or lie down somewhere quiet and close the eyes.\n2. Picture the skill or movement in vivid detail: sight, feel, and sound.\n3. Rehearse it slowly at first, then at real speed, imagining a clean execution.\n4. Include the feeling of succeeding, not just the technical steps.\n5. Repeat the mental rep several times before physical practice.",
  },
  'gaze-stabilisation': {
    link: "https://www.youtube.com/watch?v=tjXDyeg3OmU",
    videoBy: "Balancing Act Resources",
  },
  'stick-static': {
    link: "https://www.youtube.com/watch?v=_6ZkflvjQHY",
    videoBy: "Steve Thomson",
    instructions: "1. Hold the stick vertically, balanced upright on a fingertip or open palm.\n2. Look at the top of the stick, not your hand, to read its tilt early.\n3. Make small, quick corrections under the stick's base to keep it centered.\n4. Relax the rest of the body and breathe normally while holding.\n5. Build up hold time gradually, then switch hands.",
  },
  'stick-walking': {
    link: "https://www.youtube.com/watch?v=D_AkQOtL8iQ",
    videoBy: "Support Clown",
    instructions: "1. Get the stick balanced and stable on your palm or fingertip before moving.\n2. Keep your eyes on the top of the stick as you take the first slow step.\n3. Let your hand drift underneath the stick's base to correct any tilt as you walk.\n4. Take small, steady steps, adding speed or direction changes once comfortable.",
  },
  'stick-transfer': {
    link: "https://www.youtube.com/watch?v=gQZQ4kKQsik",
    videoBy: "Virtual Club",
    instructions: "1. Balance the stick steadily in one hand first.\n2. Bring the receiving hand underneath the stick's base as you track its top.\n3. Smoothly slide the balancing hand away as the other hand takes over under the base.\n4. Keep watching the stick's top throughout, not either hand, to catch drift early.\n5. Practice slow, deliberate transfers before speeding up.",
  },
  'vertical-shake': {
    link: "https://www.youtube.com/watch?v=q55fUF0MVGE",
    videoBy: "Qigong with Kseny",
    instructions: "1. Stand with feet hip-width apart, knees soft.\n2. Begin gently bouncing through the knees to set the body shaking.\n3. Let the shake travel loosely up through the hips, spine, arms, and head.\n4. Keep the jaw, shoulders, and hands relaxed throughout.\n5. Shake for 1–3 minutes, then stand still and notice the aftereffects.",
  },
  'straightjacket-shake': {
    link: "https://www.youtube.com/watch?v=yEwonufcSQQ",
    videoBy: "Yoga with Rachel",
    instructions: "1. Lie on your back and cross the arms over the chest like a straightjacket.\n2. Bend the knees with the feet flat on the floor.\n3. Start shaking the legs and let the movement spread naturally through the hips and torso.\n4. Keep the jaw and face relaxed, breathing freely through the mouth.\n5. Shake for 1–3 minutes, then let the body go completely still and rest.",
  },
  'body-tapping': {
    link: "https://www.youtube.com/watch?v=Yw8Wfs4bwjE",
    videoBy: "Taichi Workout",
    instructions: "1. Make loose, relaxed fists or open hands.\n2. Starting at the head and neck, tap rhythmically down the body.\n3. Move down through the shoulders, arms, chest, and back.\n4. Continue down the abdomen, hips, legs, and finish at the feet.\n5. Keep the taps light and springy, not forceful.",
  },
  'pandiculation': {
    link: "https://www.youtube.com/watch?v=hQlbqdfbD7o",
    videoBy: "Kristin Jackson",
    instructions: "1. Move slowly into a stretch position until you feel mild tension.\n2. Instead of holding still, gently contract against that tension for a few seconds, like starting a yawn.\n3. Slowly release the contraction while easing further into the stretch.\n4. Repeat the contract-and-release cycle 3–5 times, moving a little deeper each round.",
  },
  'feldenkrais': {
    link: "https://www.youtube.com/watch?v=Ikaq_vUpX_k",
    videoBy: "Feldenkrais with Taro Iwamoto",
    instructions: "1. Lie on the floor and let the whole body settle and soften.\n2. Move slowly through the sequence, paying attention to sensation rather than effort.\n3. Keep the movements small and easy, well within a comfortable range.\n4. Pause between movements to notice any change in how the body feels.\n5. Stop before fatigue or strain sets in; less effort is the point.",
  },
  'spinal-waves-standing': {
    link: "https://www.youtube.com/watch?v=0oX4mR8qNhg",
    videoBy: "Didier Pare",
    instructions: "1. Stand tall with knees soft and feet hip-width apart.\n2. Initiate the wave from the hips, tucking and untucking the pelvis.\n3. Let the movement travel sequentially up through the lower back, upper back, and neck.\n4. Keep the wave continuous and fluid rather than segmented.\n5. Reverse the wave direction, then repeat for several slow cycles.",
  },
  'spinal-waves-floor': {
    link: "https://www.youtube.com/watch?v=IFHLtcZoW6k",
    videoBy: "Onnit Academy",
    instructions: "1. Lie prone (face down) and press through the hands to arch into a wave through the spine.\n2. Reverse into a rounded position, leading with the hips, to flow into the opposite wave.\n3. Flip to lying supine and repeat the wave pattern on your back.\n4. Keep the movement sequential, one vertebra at a time, rather than a single hinge.\n5. Move slowly for several cycles in each position.",
  },
  'yoga-eagle-pose': {
    link: "https://www.youtube.com/watch?v=DSJQeDb3lxk",
    videoBy: "YOGA WITH AZAD",
    instructions: "1. Stand with the knees soft and shift onto one leg.\n2. Cross the other thigh over it, hooking the foot behind the standing calf if you can.\n3. Cross one arm under the other at the elbows and bring the palms together.\n4. Sink the hips back and lift the elbows to feel the stretch between the shoulder blades.\n5. Hold 20–30 seconds, then switch sides.",
  },
  'yoga-savasana': {
    link: "https://www.youtube.com/watch?v=w7cGoJwUTkc",
    videoBy: "Yin Yoga with Katie",
    instructions: "1. Lie flat on the back with legs relaxed and slightly apart, arms by the sides, palms up.\n2. Close the eyes and let the whole body go heavy and still.\n3. Release any tension in the jaw, shoulders, and hands.\n4. Let the breath settle into its own natural rhythm without controlling it.\n5. Rest for 5–10 minutes, then slowly wiggle fingers and toes before rising.",
  },
  'hip-cars': {
    link: "https://www.youtube.com/watch?v=m_l9DCL2zL0",
    videoBy: "Adam Wolf, PT",
    instructions: "1. Stand tall holding something stable for balance, or stand freely with hands on hips.\n2. Lift one knee up and out to the side, keeping the low back and pelvis still.\n3. Trace the largest comfortable circle with the knee through the full range of the hip.\n4. Move slowly and pause at any restricted spot instead of swinging through it.\n5. Complete several slow circles each direction, then switch legs.",
  },
  'wrist-cars': {
    link: "https://www.youtube.com/watch?v=KdM1KlmVgek",
    videoBy: "Progressive Motion",
    instructions: "1. Extend one arm out in front at shoulder height, palm facing down.\n2. Relax the fingers and slowly circle the wrist through its full range.\n3. Keep the forearm still so only the wrist joint is moving.\n4. Move as slowly as possible, pausing briefly at any tight spot.\n5. Circle several times each direction, then switch wrists.",
  },
  'ankle-cars': {
    link: "https://www.youtube.com/watch?v=vIDJiMShg4o",
    videoBy: "Dr. Beau Beard",
    instructions: "1. Sit or stand holding support, and lift the working foot off the floor.\n2. Point the toes away, then slowly draw the largest circle you can with the foot.\n3. Keep the knee still so the motion comes only from the ankle.\n4. Move slowly through the full range, especially into the stiffer directions.\n5. Do several slow circles each direction, then switch feet.",
  },
  'spine-cars': {
    link: "https://www.youtube.com/watch?v=_U2bvJ6-FHE",
    videoBy: "Nick Allard | Vigour Physiotherapy",
    instructions: "1. Start on hands and knees or standing tall with a neutral spine.\n2. Slowly flex one vertebra at a time from the tailbone up to the neck, then reverse into extension.\n3. Add side bending and rotation once flexion/extension feels controlled, moving segment by segment.\n4. Keep the movement slow and deliberate rather than one big sweep.\n5. Spend a minute or two working through all directions.",
  },
  'deep-squat-hold': {
    link: "https://www.youtube.com/watch?v=0wzrgyAurT8",
    videoBy: "Strength Side",
    instructions: "1. Stand with feet slightly wider than shoulder-width, toes turned out a little.\n2. Lower into the bottom of a squat, keeping the heels flat on the floor.\n3. Rest the elbows against the inside of the knees and gently press the knees outward.\n4. Keep the chest lifted and spine long rather than rounding forward.\n5. Hold 1–3 minutes, breathing steadily and easing deeper into the position over time.",
  },
  'ankle-dorsiflexion': {
    link: "https://www.youtube.com/watch?v=pSMPd12mrg0",
    videoBy: "The Physiobot",
    instructions: "1. Stand facing a wall in a half-kneeling or staggered stance, front foot a few inches from the wall.\n2. Keep the front heel glued to the floor and drive the front knee forward to touch the wall.\n3. Move the foot back slightly and repeat as the ankle allows more range.\n4. Don't let the arch collapse inward as the knee travels forward.\n5. Do several controlled reps, then hold the deepest comfortable position for 20–30 seconds.",
  },
  'ankle-circles': {
    link: "https://www.youtube.com/watch?v=6XX3R9ibBfw",
    videoBy: "Rehab My Patient",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ankle_Circles/1.jpg",
    instructions: "1. Sit or lie down with the leg relaxed and lift the foot slightly off the floor.\n2. Slowly circle the foot through its full range, leading with the big toe.\n3. Keep the movement coming from the ankle rather than swinging the whole leg.\n4. Go slowly enough to feel the full circle, including the tighter portions.\n5. Do 10–15 circles each direction, then switch feet.",
  },
  'knee-over-toe-stretch': {
    link: "https://www.youtube.com/watch?v=CU20QgyjHUs",
    videoBy: "Nicholas Smith (Smith Forged S&C)",
    instructions: "1. Set up in a half-kneeling or forward lunge position with the front foot flat on the floor.\n2. Keep the front heel down and slowly drive the knee forward over the toes.\n3. Go until you feel a stretch through the front of the ankle, without letting the heel lift.\n4. Hold briefly or pulse gently for a light loaded stretch.\n5. Repeat for several reps, then switch legs.",
  },
  'dynamic-stretches': {
    link: "https://www.youtube.com/watch?v=KWJhGuj45sE",
    videoBy: "mobility by julia reppel",
    instructions: "1. Start with a light general warm-up, like easy marching or jogging in place, for a minute.\n2. Move into leg swings, front-to-back and side-to-side, on each leg.\n3. Add arm circles and hip circles, gradually increasing the range with each rep.\n4. Keep the movements smooth and controlled rather than bouncing at end range.\n5. Spend 5–8 minutes total, covering the whole body before training.",
  },
  'dynamic-leg-swings': {
    link: "https://www.youtube.com/watch?v=difYoBtZi2s",
    videoBy: "PureGym",
    instructions: "1. Stand next to a wall or support for balance.\n2. Swing one leg forward and back in a controlled pendulum motion, keeping the torso upright.\n3. After a set of front-to-back swings, turn side-on and swing the same leg across the body and out to the side.\n4. Keep the swings smooth and let the range grow naturally rather than forcing it.\n5. Do 10–15 swings per direction, then switch legs.",
  },
  'dynamic-hip-circles': {
    link: "https://www.youtube.com/watch?v=JYqLwajOGjI",
    videoBy: "Runna",
    instructions: "1. Stand with feet hip-width apart and hands resting on the hips.\n2. Circle the hips in a large, smooth motion as if drawing a big circle with the pelvis.\n3. Keep the knees soft and let the motion come from the hips, not the low back.\n4. Gradually increase the size of the circle as it feels comfortable.\n5. Do 8–10 circles each direction.",
  },
  'worlds-greatest-stretch': {
    link: "https://www.youtube.com/watch?v=-CiWQ2IvY34",
    videoBy: "Squat University",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Worlds_Greatest_Stretch/1.jpg",
    instructions: "1. Start in a push-up position, then step one foot forward outside that hand into a deep lunge.\n2. Drop the back knee to the floor if needed and square the hips forward.\n3. Rotate the torso and reach the same-side arm up toward the ceiling, following it with the eyes.\n4. Return the hand to the floor, then straighten the front leg for a hamstring stretch before re-bending it.\n5. Step back to the start and repeat on the other side, 3–5 reps per side.",
  },
  'foam-roll-quads': {
    link: "https://www.youtube.com/watch?v=asgAWqwC67c",
    videoBy: "Movement As Medicine",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Quadriceps-SMR/0.jpg",
    instructions: "1. Lie face down propped on the forearms, with the foam roller under the front of the thighs.\n2. Roll slowly from just above the knee up to the hip crease.\n3. Pause on any tender spot for 20–30 seconds and breathe until it eases.\n4. Keep the core engaged so the low back doesn't sag.\n5. Spend 1–2 minutes per leg.",
  },
  'foam-roll-it-band': {
    link: "https://www.youtube.com/watch?v=fCcDUppnE3s",
    videoBy: "DocJenFit",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Iliotibial_Tract-SMR/0.jpg",
    instructions: "1. Lie on one side with the roller under the outside of the thigh, top leg bent in front for support.\n2. Prop up on the forearm and roll slowly from just below the hip to just above the knee.\n3. Take more weight through the arm and top leg if the pressure feels too intense.\n4. Pause briefly on tender spots rather than digging in hard.\n5. Spend 30–60 seconds per side.",
  },
  'foam-roll-calves': {
    link: "https://www.youtube.com/watch?v=_gHnz4GpRYI",
    videoBy: "Your House Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calves-SMR/0.jpg",
    instructions: "1. Sit on the floor with the roller under one calf and hands planted behind for support.\n2. Cross the other ankle over the working leg to add pressure, or keep both legs on the roller for less.\n3. Roll slowly from just below the knee to just above the ankle.\n4. Rotate the leg slightly in and out to reach the inner and outer calf.\n5. Spend 30–60 seconds per side.",
  },
  'foam-roll-glutes': {
    link: "https://www.youtube.com/watch?v=jcyV1x-HGyI",
    videoBy: "Rehab and Revive",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Piriformis-SMR/0.jpg",
    instructions: "1. Sit on the roller with one ankle crossed over the opposite knee.\n2. Lean toward the side of the crossed leg and roll slowly through the glute and hip area.\n3. Search for tender spots and pause on them for 20–30 seconds.\n4. Keep the movement slow and controlled rather than rolling quickly.\n5. Spend 1–2 minutes per side.",
  },
  'foam-roll-upper-back': {
    link: "https://www.youtube.com/watch?v=NOiM2TSjoMM",
    videoBy: "Three Storm Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Latissimus_Dorsi-SMR/0.jpg",
    instructions: "1. Lie on the floor with the roller placed horizontally under the shoulder blades.\n2. Support the head with both hands and keep the hips lifted or feet planted for control.\n3. Roll slowly from the base of the shoulder blades up toward the top of the shoulders.\n4. Avoid rolling below the ribcage or directly on the lower back.\n5. Spend 1–2 minutes, pausing on any tight spots.",
  },
  'squat-knee-pump': {
    link: "https://www.youtube.com/watch?v=XwWwDho1lIc",
    videoBy: "Meghan Callaway Fitness Official",
    instructions: "1. Drop into the bottom of a deep squat with feet flat on the floor.\n2. Shift weight slightly onto one leg and let the opposite knee fall inward.\n3. Use the hand or forearm to push that knee outward, then let it ease back in.\n4. Pump the knee out and in for several reps, staying low in the squat throughout.\n5. Switch sides and repeat.",
  },
  'squat-heel-raise-toe-stretch': {
    link: "https://www.youtube.com/watch?v=MunAJwoA1m0",
    videoBy: "Didier Paré",
    instructions: "1. From a deep squat, shift weight onto one leg and let the heel of the other foot lift slightly.\n2. Press that knee forward over the toes so the ball of the foot and big toe load into the floor.\n3. Hold the stretch through the ankle and big toe for a few seconds.\n4. From there, rotate the knee inward to bring it toward the opposite shin.\n5. Lower the heel back down and repeat on the same side before switching.",
  },
  'squat-knee-rotation-hold': {
    link: "https://www.youtube.com/watch?v=w6R9sszZrIw",
    videoBy: "Jacobs Fitness",
    instructions: "1. Settle into the bottom of a deep squat with both feet flat on the floor.\n2. Keeping one heel glued down, rotate that knee inward toward the ground.\n3. Hold the rotated position for about 10 seconds without letting the heel lift.\n4. Return to neutral and repeat for 10 reps on that side.\n5. Switch to the other leg and repeat.",
  },
  'shoulder-cars': {
    link: "https://www.youtube.com/watch?v=2hyNG1U5wYs",
    videoBy: "LivingFit",
    instructions: "1. Stand tall with one arm relaxed by the side.\n2. Raise the arm out to the side and start circling it through the largest range possible.\n3. Keep the ribcage still and avoid shrugging or leaning to create extra range.\n4. Move slowly, pausing briefly at any restricted point in the circle.\n5. Complete several slow circles each direction, then switch arms.",
  },
  'ankle-mobility': {
    link: "https://www.youtube.com/watch?v=uI_S4kRDIhY",
    videoBy: "Orillia Sports Medicine And Rehabilitation",
    instructions: "1. Stand facing a wall in a half-kneeling or staggered stance, front foot a comfortable distance away.\n2. Keeping the front heel down, rock the knee forward toward the wall.\n3. Rock back to the start position and repeat in a smooth, continuous rhythm.\n4. Gradually increase the distance from the wall as range improves.\n5. Do 10–15 rocks, then switch legs.",
  },
  'ido-squat-routine-2': {
    instructions: "1. Drop into a deep squat with feet flat and start with the knee-out pump on one side, pushing the knee out and pumping it several times.\n2. Flow into the heel-raise, big-toe stretch on the same side without standing up.\n3. Rotate that knee inward for the internal knee rotation hold, keeping the heel down.\n4. Cycle through the same three steps on the other leg, staying low throughout.\n5. Move slowly and continuously between steps, repeating the full flow for several minutes.",
  },
  'scapula-mobilization-routine': {
    instructions: "1. Start standing or on hands and knees, and protract the shoulder blades by pushing them away from the spine.\n2. Retract by squeezing the shoulder blades together, then elevate by shrugging them up.\n3. Depress by pulling the shoulder blades down away from the ears, completing the four basic directions.\n4. Once comfortable, uncouple the normal pairings — for example, upwardly rotate the shoulder blades while depressing them instead of elevating.\n5. Move slowly and keep the arms relatively passive so the movement comes from the scapula itself.",
  },
  'glute-bridge-bw': {
    link: "https://www.youtube.com/watch?v=OUgsJ8-Vi0E",
    videoBy: "Airrosti Rehab Centers",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butt_Lift_Bridge/1.jpg",
    instructions: "1. Lie on your back, knees bent, feet flat hip-width apart.\n2. Tilt the pelvis back to flatten the low back before lifting.\n3. Drive through the heels to lift the hips until the body forms a straight line from knees to shoulders.\n4. Squeeze the glutes hard for a 2-second hold at the top.\n5. Lower under control and repeat.",
  },
  'banded-lateral-walk': {
    link: "https://www.youtube.com/watch?v=PhNkkOieB-8",
    videoBy: "Women's Strength Nation by Holly Perkins",
    instructions: "1. Place a band above the knees and set up in a quarter-squat with feet hip-width apart.\n2. Keep the toes pointed forward and stay low the whole set.\n3. Step sideways, keeping constant tension on the band.\n4. Take even, controlled steps in one direction, then reverse.\n5. Do 10–15 steps per side.",
  },
  'dead-bug': {
    link: "https://www.youtube.com/watch?v=bxn9FBrt4-A",
    videoBy: "National Academy of Sports Medicine (NASM)",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dead_Bug/1.jpg",
    instructions: "1. Lie on your back, arms reaching toward the ceiling, hips and knees bent to 90°.\n2. Press the low back into the floor and brace the core.\n3. Slowly lower one arm overhead and the opposite leg toward the floor.\n4. Exhale as you lower, keeping the low back pinned the whole time.\n5. Return to start and alternate sides.",
  },
  'bird-dog': {
    link: "https://www.youtube.com/watch?v=xEDnlOxeJH4",
    videoBy: "Hinge Health",
    instructions: "1. Start on hands and knees, hands under shoulders, knees under hips.\n2. Brace the core and keep the spine neutral.\n3. Reach one arm forward and extend the opposite leg back, keeping the hips level.\n4. Hold 2 seconds at full extension without letting the hips rotate.\n5. Return to start and switch sides.",
  },
  'scap-pushups': {
    link: "https://www.youtube.com/watch?v=N6jNuXZJn9s",
    videoBy: "Lauren McMillin | Yoga & Movement",
    instructions: "1. Start in a push-up or plank position with the arms locked straight.\n2. Keep the elbows locked out for the entire set.\n3. Let the shoulder blades sink together and down between the shoulders.\n4. Push the floor away, spreading the shoulder blades apart and rounding the upper back slightly.\n5. Move only through the shoulder blades, not the elbows.",
  },
  'tibialis-raise': {
    link: "https://www.youtube.com/watch?v=pz70FwVRDJE",
    videoBy: "All Strength Training",
    instructions: "1. Stand with your back against a wall, heels a few inches out from it.\n2. Keep the legs straight and the weight on the heels.\n3. Lift the toes and forefoot up as high as possible while the heels stay down.\n4. Lower under control just short of the floor and repeat.\n5. Build up reps for shin endurance before runs.",
  },
  'calf-raise-iso': {
    link: "https://www.youtube.com/watch?v=x1LhV2nj01Q",
    videoBy: "Movement As Medicine",
    instructions: "1. Stand on one leg, holding light support if needed for balance.\n2. Rise onto the ball of the foot to about mid-range height.\n3. Hold that position without bouncing, keeping the ankle stacked under the knee.\n4. Breathe steadily and hold for the prescribed time.\n5. Switch sides; use before runs or jumps to prime the calf.",
  },
  'copenhagen-plank': {
    link: "https://www.youtube.com/watch?v=nhGK-DxiGBE",
    videoBy: "Physio Plus Fitness",
    instructions: "1. Lie on your side with the top leg's knee resting on a bench (short-lever version).\n2. Prop up on the bottom forearm, stacking the shoulder over the elbow.\n3. Lift the hips so the body forms a straight line, squeezing the inner thigh of the top leg.\n4. Hold briefly at the top, then lower with control.\n5. Progress to the straight-leg (long-lever) version once this is solid.",
  },
  'a-march': {
    link: "https://www.youtube.com/watch?v=2FgmKuOvKFs",
    videoBy: "Jason Curtis",
    instructions: "1. Stand tall with a slight forward lean from the ankles.\n2. Walk forward, driving one knee up to hip height.\n3. Keep the raised shin roughly vertical with the toe pulled up.\n4. Land the foot directly under the hip, not reaching out in front.\n5. Alternate legs at a controlled marching pace for 15–20m.",
  },
  'a-skip': {
    link: "https://www.youtube.com/watch?v=GQg9L28bi1g",
    videoBy: "Matt Holton",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Fast_Skipping/1.jpg",
    instructions: "1. Start moving forward with a light, rhythmic skip.\n2. Drive one knee up to hip height on each skip.\n3. Strike the ground down and back, landing directly under the hip.\n4. Keep the arms driving opposite the legs with relaxed shoulders.\n5. Continue for 15–20m, prioritizing rhythm over speed.",
  },
  'b-skip': {
    link: "https://www.youtube.com/watch?v=kgAM5sYzLOk",
    videoBy: "Matt Holton",
    instructions: "1. Begin with the same rhythm and knee drive as an A-skip.\n2. At the top of the knee drive, extend the lower leg straight out in front.\n3. Actively paw the foot back down and under the hips, like scratching the ground.\n4. Keep the torso tall and avoid leaning back.\n5. Continue for 15–20m, keeping the motion relaxed and rhythmic.",
  },
  'high-knees': {
    link: "https://www.youtube.com/watch?v=h-lqIgLaEFA",
    videoBy: "Runna",
    instructions: "1. Run in place or move slightly forward with a fast turnover.\n2. Drive the knees up to hip height on every step.\n3. Keep ground contact short and quick, landing on the balls of the feet.\n4. Pump the arms in rhythm with the legs.\n5. Stay tall through the torso for 15–20 seconds.",
  },
  'butt-kicks': {
    link: "https://www.youtube.com/watch?v=kRR1i9btd_w",
    videoBy: "StrengthRunning",
    instructions: "1. Jog forward at an easy pace with a quick, relaxed cadence.\n2. Kick each heel up toward the glute on every stride.\n3. Keep the knees pointing down rather than driving forward.\n4. Keep the motion light and fast rather than forced.\n5. Continue for 15–20m or 15–20 seconds.",
  },
  'carioca': {
    link: "https://www.youtube.com/watch?v=CMeuCmzKf84",
    videoBy: "StrengthRunning",
    instructions: "1. Stand sideways to the direction of travel.\n2. Cross one foot over the other in front, then step the trail leg out to the side.\n3. Cross the same foot behind, then step out again, alternating over and behind.\n4. Let the hips and torso rotate naturally with each crossover.\n5. Move at a quick, relaxed tempo for 15–20m, then repeat facing the other way.",
  },
  'pogo-hops': {
    link: "https://www.youtube.com/watch?v=PdhY2bCMJgQ",
    videoBy: "JayTaylor",
    instructions: "1. Stand tall with feet hip-width apart, hands on hips or swinging naturally.\n2. Keep the knees nearly straight and the ankles stiff.\n3. Bounce quickly off the balls of the feet, minimizing ground contact time.\n4. Keep the hops small and controlled rather than jumping for height.\n5. Continue for 15–20 reps, focusing on a quick rebound off the floor.",
  },
  'straight-leg-bound': {
    link: "https://www.youtube.com/watch?v=g1Wb9DbbO1g",
    videoBy: "StrengthRunning",
    instructions: "1. Jog forward keeping the legs nearly straight throughout.\n2. Reach the lead leg out and claw it back toward the ground actively.\n3. Pull the ground back under you on contact rather than reaching and landing passively.\n4. Keep the torso tall and let the arms swing naturally.\n5. Continue for 15–20m, focusing on the pulling action rather than speed.",
  },
  'strides': {
    link: "https://www.youtube.com/watch?v=IeZS646X44M",
    videoBy: "StrengthRunning",
    instructions: "1. Start from a jog and gradually build speed over the first 20–30m.\n2. Reach about 80–90% of max effort by the middle of the stride, keeping form relaxed.\n3. Keep the shoulders and jaw loose, arms driving smoothly, easing off before a full sprint.\n4. Decelerate gently over the last 10–15m rather than stopping abruptly.\n5. Walk back to full recovery before the next rep; run these last, before the main workout.",
  },
  'brachiation': {
    link: "https://www.youtube.com/watch?v=wqqlUSlalLo",
    videoBy: "Tykato Fitness",
    instructions: "1. Start hanging from the first bar with a full overhand grip and active shoulders.\n2. Swing the hips forward to build momentum while keeping the arms mostly straight.\n3. Release the trailing hand as the body swings forward and reach for the next bar.\n4. Catch with an active shoulder, absorbing the swing before letting go with the other hand.\n5. Practice a single swap between two bars before chaining several swings together.",
  },
  'arch-hang': {
    link: "https://www.youtube.com/watch?v=KF1zYcyDXzo",
    videoBy: "Precision Movement",
    instructions: "1. Hang from the bar with a shoulder-width overhand grip.\n2. Draw the shoulder blades down and back and rotate the upper arms outward.\n3. Push the chest forward and let the hips drift slightly behind the hands to create an arch.\n4. Keep the ribs lifted and the head neutral, eyes forward.\n5. Hold the shape for the prescribed time, breathing steadily.",
  },
  'meat-hook-hang': {
    link: "https://www.youtube.com/watch?v=-7MwIMYLQIk",
    videoBy: "Rod J Cooper",
    instructions: "1. Hang with both hands, then bend one elbow and draw that hand up toward the shoulder.\n2. Let the working shoulder rotate so the elbow points up and back.\n3. Keep the other arm hanging straight and relaxed for balance.\n4. Sink gently into the stretch without shrugging the working shoulder up.\n5. Hold for time, then switch sides.",
  },
  'scap-pullups': {
    link: "https://www.youtube.com/watch?v=-ZIpSoTRsuE",
    videoBy: "Zack Henderson",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Scapular_Pull-Up/1.jpg",
    instructions: "1. Start from a dead hang with a shoulder-width overhand grip and arms fully straight.\n2. Keeping the elbows locked, pull the shoulder blades down and together to raise the body slightly.\n3. Hold the top position for one second, chest tall.\n4. Lower under control back to a full dead hang.\n5. Repeat for reps without letting the elbows bend.",
  },
  'false-grip-hang': {
    link: "https://www.youtube.com/watch?v=fgr2g78kLTY",
    videoBy: "Simonster Strength",
    instructions: "1. Set the wrist over the top of the ring so the heel of the palm rests on its edge.\n2. Curl the fingers around the ring below to lock the grip in place.\n3. Hang with straight arms, keeping the shoulders active rather than fully passive.\n4. Keep the wrists stacked over the rings and avoid letting the grip roll back to normal.\n5. Build the hold in short sets toward the target time, resting the wrists between sets.",
  },
  'ring-row': {
    link: "https://www.youtube.com/watch?v=bzmdmqmf39U",
    videoBy: "Jerry Teixeira",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Inverted_Row_with_Straps/1.jpg",
    instructions: "1. Set the rings at the height that matches today's difficulty and grip them firmly.\n2. Walk the feet out for an easier row or in for a harder one.\n3. Keep a straight line from head to heels as you pull the chest to the rings.\n4. Squeeze the shoulder blades together at the top before lowering under control.\n5. Adjust the foot position set to set to progress the angle.",
  },
  'false-grip-ring-row': {
    link: "https://www.youtube.com/watch?v=puz-5s7P_Kc",
    videoBy: "PowerMonkeyFitness",
    instructions: "1. Take a false grip on both rings before starting the row.\n2. Set the feet so the body is angled for a challenging but controllable row.\n3. Pull the chest toward the rings while keeping the wrists locked over the top.\n4. Drive the elbows back and finish with the rings near the lower ribs.\n5. Lower slowly, keeping the false grip intact throughout.",
  },
  'explosive-pullup': {
    link: "https://www.youtube.com/watch?v=SmduaQzt8Jk",
    videoBy: "FitnessFAQs",
    instructions: "1. Start from a dead hang with a shoulder-width overhand grip.\n2. Pull explosively, driving the elbows down and back as fast as possible.\n3. Aim to touch the chest to the bar at the top of each rep.\n4. Control the descent back to a full hang before the next rep.\n5. Keep reps low and rest fully between sets to preserve speed.",
  },
  'straight-bar-dip': {
    link: "https://www.youtube.com/watch?v=6rhowlOcTn0",
    videoBy: "Minus The Gym",
    instructions: "1. Support yourself above the bar with straight arms, bar near the hips.\n2. Lean the torso and shoulders forward over the bar as you begin to lower.\n3. Bend the elbows and descend under control, keeping the lean over the bar.\n4. Press back up by pushing the bar down and back, staying leaned forward.\n5. Only descend as far as the shoulders stay comfortable and controlled.",
  },
  'russian-dip': {
    link: "https://www.youtube.com/watch?v=8BkJ3UgngX8",
    videoBy: "ZOAR Fitness",
    instructions: "1. Start in support on the dip bars with straight arms.\n2. Lower under control until the forearms rest on the bars.\n3. Pause briefly with the forearms supported and the torso upright.\n4. Press back up through the forearms and hands to full support.\n5. Keep the elbows tracking over the bars throughout to protect the joints.",
  },
  'banded-mu-transition': {
    link: "https://www.youtube.com/watch?v=AbfhHy6tRfU",
    videoBy: "Training Norte · Academia TN",
    instructions: "1. Set the rings low and loop a band under the feet or knees, or keep the feet lightly on the floor.\n2. Pull into a false grip and drive the elbows down and back as in a normal pull.\n3. Let the band or feet take some load as you turn the wrists over the rings.\n4. Press out through the support position, finishing with straight arms.\n5. Repeat, focusing on the pull-turnover-press sequence.",
  },
  'switch-grip-hang-beginner': {
    instructions: "1. Hang from the bar with a pronated (overhand) grip and hold briefly.\n2. Rotate to a supinated (underhand) grip without dropping off the bar.\n3. Move to a mixed grip, one palm forward and one palm back, and hold.\n4. Pause for a couple of seconds in each grip before switching.\n5. Cycle through the sequence for the prescribed time or number of rounds.",
  },
  'one-arm-passive-hang': {
    instructions: "1. Grip the bar with one hand and let the body hang fully relaxed.\n2. Keep the other arm resting lightly against the body or touching the bar for balance only.\n3. Let the shoulder sink and the spine lengthen without actively engaging it.\n4. Breathe slowly and stay relaxed through the hanging arm.\n5. Step down before grip strength gives out, then switch sides.",
  },
  'one-arm-active-hang': {
    instructions: "1. Grip the bar with one hand, other arm resting or lightly assisting for balance.\n2. Actively depress and retract the shoulder blade on the hanging side.\n3. Keep the shoulder pulled down away from the ear rather than hanging passively.\n4. Keep the ribs stacked over the hips as you hold the active position.\n5. Hold for time, then switch sides.",
  },
  'ape-swing': {
    instructions: "1. Start hanging from the bar with an active shoulder.\n2. Swing the hips and legs to trace a figure-8 path rather than a straight arc.\n3. Let the swing carry the shoulders slightly side to side as momentum builds.\n4. Keep the arms mostly straight and let the movement come from the hips and shoulders.\n5. Build the swing gradually before attempting to release into a brachiation move.",
  },
  'front-stationary-swing': {
    instructions: "1. Hang from the bar with an active grip and engaged shoulders.\n2. Drive the legs and hips forward to start a front-to-back swing.\n3. Let the body swing back under and behind the bar, then forward again.\n4. Stay under the bar throughout, without traveling to another bar.\n5. Build height and control gradually, keeping the arms mostly straight.",
  },
  'side-side-stationary-swing': {
    instructions: "1. Hang from the bar with an active grip.\n2. Drive the hips and legs out to one side to start a lateral swing.\n3. Let the body swing across to the opposite side under control.\n4. Keep the swing smooth and rhythmic, staying under the bar.\n5. Use this as a warm-up before attempting front-to-back or figure-8 swings.",
  },
  'bear-crawl': {
    link: "https://www.youtube.com/watch?v=vg5hegN6pk0",
    videoBy: "Mind Pump TV",
    instructions: "1. Start on hands and knees, hands under shoulders, knees under hips, knees hovering an inch off the floor.\n2. Keep the back flat and the core braced throughout.\n3. Move the opposite hand and foot together, then switch sides for a cross-body pattern.\n4. Take small, controlled steps and keep the hips level rather than swaying side to side.\n5. Crawl forward and backward for 20–30 seconds per set.",
  },
  'crab-walk': {
    link: "https://www.youtube.com/watch?v=oNUJek2xixA",
    videoBy: "Chidi Nebo",
    instructions: "1. Sit down and plant the hands behind the hips, fingers pointing toward the feet, knees bent and feet flat.\n2. Lift the hips off the floor so the body forms a tabletop shape.\n3. Move the opposite hand and foot together to walk forward or backward.\n4. Keep the chest open and the hips lifted the whole time, don't let them sag.\n5. Walk for 15–20 steps or about 20–30 seconds.",
  },
  'inchworm': {
    link: "https://www.youtube.com/watch?v=aFkv2m9FTGs",
    videoBy: "PureGym",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Inchworm/1.jpg",
    instructions: "1. Stand tall with feet hip-width apart.\n2. Hinge at the hips and walk the hands out to a plank, keeping the legs as straight as comfortable.\n3. Hold a brief plank, then walk the hands back in toward the feet.\n4. Move slowly, feeling the stretch through the hamstrings and the work through the shoulders.\n5. Repeat for 5–8 reps as a warm-up.",
  },
  'freestyle': {
    link: "https://www.youtube.com/watch?v=e2YYd6N5VP8",
    videoBy: "Movement Focus",
    instructions: "1. Start in any position on the ground and let one small movement lead naturally into the next.\n2. Explore different levels — low to the ground, standing, rotating — instead of repeating one pattern.\n3. Follow curiosity and sensation rather than planning shapes in advance.\n4. Breathe steadily and stay relaxed instead of rushing between positions.\n5. Practice for 3–10 minutes, extending the session as comfort with exploration grows.",
  },
  'get-up-squat-stand': {
    link: "https://www.youtube.com/watch?v=wAIdP7_YX5s",
    videoBy: "Jordan Syatt",
    instructions: "1. Start standing, then lower into a squat and sit down on the floor without using the hands.\n2. Control the descent the whole way down rather than dropping the last few inches.\n3. From sitting, reverse the movement and stand back up, again without touching the floor with the hands.\n4. Keep the chest up and weight through the whole foot as you press up.\n5. Repeat for 3–5 clean reps, resting as needed between attempts.",
  },
  'hollow-body-rock': {
    link: "https://www.youtube.com/watch?v=0-fyNmd6jyQ",
    videoBy: "GMB Fitness (Praxis)",
    instructions: "1. Set up in a hollow body hold: lower back pressed down, arms overhead, legs straight, shoulders and heels off the floor.\n2. Keep the hollow shape locked, ribs down, no arch sneaking into the lower back.\n3. Rock gently forward and back through the whole body, pivoting around the midline.\n4. Drive the rock from a small weight shift, not from bending at the hips.\n5. Regress with bent knees or arms by the sides if the shape starts to break down.",
  },
  'arch-body-hold': {
    link: "https://www.youtube.com/watch?v=R3-ea5QvC6M",
    videoBy: "Granosthenics",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Superman/1.jpg",
    instructions: "1. Lie face down, arms extended overhead, legs straight and together.\n2. Squeeze the glutes and lift the chest, arms, and legs off the floor at the same time.\n3. Reach long through the fingers and toes rather than just lifting as high as possible.\n4. Keep the neck neutral, looking at the floor a few inches ahead.\n5. Hold for 15–30 seconds, breathing steadily throughout.",
  },
  'pike-sit-wall': {
    link: "https://www.youtube.com/watch?v=PQ8mQLTL3qU",
    videoBy: "Zack Height",
    instructions: "1. Sit facing a wall with the legs straight and the feet resting flat on the wall.\n2. Reach forward and lean the torso toward the legs, using the wall as feedback for the feet.\n3. Actively pull the chest toward the thighs rather than just relaxing into the stretch.\n4. Keep the knees straight and the lower back as flat as possible.\n5. Hold for 20–30 seconds, breathing into the stretch.",
  },
  'straddle-sit-compression': {
    link: "https://www.youtube.com/watch?v=7MNNGqec0Dc",
    videoBy: "Peak Gymnastics",
    instructions: "1. Sit tall in a wide straddle, hands on the floor in front of the hips or beside the knees.\n2. Lock the legs straight with the knees and toes pointing up.\n3. Lean slightly forward and lift one or both heels off the floor using the hip flexors, not momentum.\n4. Pause at the top, then lower with control.\n5. Do sets of 5–10 lifts or short holds.",
  },
  'front-line-drill': {
    link: "https://www.youtube.com/watch?v=9F0lAHfrjGk",
    videoBy: "The Sustainable Training Method",
    instructions: "1. Lie face down with the feet together and the arms out to the sides at about 45 degrees.\n2. Tuck the pelvis under so the lower back flattens and the belly button stays pressed to the floor.\n3. Squeeze the glutes and brace the abs to hold the tilt without lifting the hips.\n4. Hold for up to 60 seconds, breathing steadily.\n5. Progress by bringing the arms overhead, then by holding a light pole or pipe overhead in the same shape.",
  },
  'hs-wall-plank': {
    link: "https://www.youtube.com/watch?v=FBViSKdERcg",
    videoBy: "Samantha Fox Olson",
    instructions: "1. Start in a plank with your feet against the base of a wall behind you.\n2. Walk the feet up the wall and the hands toward it until the hips are over the shoulders in an L-shape, legs parallel to the floor.\n3. Stack the shoulders over the wrists and push the floor away.\n4. Keep the ribs down and the glutes on so the back doesn't sag or arch.\n5. Hold 10–20 seconds and build time gradually.",
  },
  'hs-wall-hold': {
    link: "https://www.youtube.com/watch?v=udZZb1mif_I",
    videoBy: "NASHI STRENGTH",
    instructions: "1. Start back-to-wall: kick or walk up until the heels rest on the wall and the body is straight.\n2. Once that feels steady, progress to chest-to-wall: face the wall, walk the feet up and the hands in until the chest is close to the wall.\n3. Stack the shoulders over the wrists and squeeze the whole body tight, like an upside-down plank.\n4. Push the floor away through the hands rather than letting the shoulders collapse.\n5. Hold for 10–20 seconds and build time gradually.",
  },
  'wall-walk': {
    link: "https://www.youtube.com/watch?v=47rNQtnuQMg",
    videoBy: "12 Minute Athlete",
    instructions: "1. Start in a plank with the feet against the base of the wall.\n2. Walk the feet up the wall while walking the hands in toward the wall, keeping the hips extended.\n3. Move slowly and stop as soon as control is lost or the lower back starts to arch.\n4. Keep the core braced and the shoulders stacked over the wrists at each step.\n5. Walk back down with the same control, then repeat for 3–5 reps.",
  },
  'wall-shoulder-taps': {
    link: "https://www.youtube.com/watch?v=1bNOGG3Dpow",
    videoBy: "CJ | WODprep",
    instructions: "1. Get into a chest-to-wall handstand hold with the body tight and straight.\n2. Shift the weight slightly onto one hand.\n3. Lift the other hand and tap the opposite shoulder, then place it back down.\n4. Keep the hips and legs still throughout; only the working arm should move.\n5. Alternate sides for 5–10 taps per side.",
  },
  'pike-pushup': {
    link: "https://www.youtube.com/watch?v=paCOGgmLCA0",
    videoBy: "Paul Twyman",
    instructions: "1. Start in a pike position, hips high, hands and feet on the floor forming an inverted V.\n2. Pick a spot on the floor slightly ahead of the hands as your target, not straight down.\n3. Bend the elbows to lower the head toward that spot, then press back up.\n4. Keep the hips high throughout so the movement stays vertical rather than turning into a regular push-up.\n5. Elevate the feet on a box or bench to increase range and difficulty over time.",
  },
  'hs-kick-up': {
    link: "https://www.youtube.com/watch?v=Z1BEEzg5L6Q",
    videoBy: "Paul Twyman",
    instructions: "1. Stand in a lunge with the arms overhead, ears between the arms.\n2. Tip forward as one unit and place the hands shoulder-width on the floor.\n3. Kick the back leg up gently while pushing off the front leg, aiming for balance rather than height.\n4. Bring the second leg up to meet the first once you feel light over the hands.\n5. When you overbalance, bail with a cartwheel step to the side.",
  },
  'yoga-sun-salutation-a': {
    link: "https://www.youtube.com/watch?v=WH6NzQ1v04w",
    videoBy: "The Plant Powered Yoga",
    instructions: "1. Stand at the top of the mat, feet together, hands at the chest.\n2. Inhale and reach the arms overhead; exhale and fold forward.\n3. Inhale halfway up with a long spine; exhale, step or jump back to plank and lower halfway (chaturanga).\n4. Inhale into upward-facing dog; exhale back to downward dog and stay for five breaths.\n5. Step or jump to the hands, fold, then rise to standing. Repeat 3–5 rounds.",
  },
  'straddle-fold-passive': {
    link: "https://www.youtube.com/watch?v=Z816IGgrfxc",
    videoBy: "Live Lean TV Daily Exercises",
    instructions: "1. Sit tall with legs spread wide into a V, knees and toes pointing up.\n2. Walk the hands forward on the floor between your legs.\n3. Let the spine round or stay long, whichever feels more passive, and relax into the position.\n4. Breathe and let gravity deepen the fold rather than actively pulling yourself down.\n5. Hold 30–60 seconds, walking the hands back up slowly to come out.",
  },
  'frog-stretch': {
    link: "https://www.youtube.com/watch?v=8dG-dil8wNg",
    videoBy: "Yoga Mobility Flow",
    instructions: "1. Start on all fours and widen the knees out to the sides.\n2. Keep the shins parallel to each other with ankles roughly in line with the knees.\n3. Shift the hips back toward the heels until you feel the inner thighs load up.\n4. Rock gently forward and back, or hold still at the end range.\n5. Drop to the forearms if that's more comfortable, and hold 30–60 seconds.",
  },
  'single-leg-hamstring-stretch': {
    link: "https://www.youtube.com/watch?v=_Ivm4C53zBQ",
    videoBy: "Your House Fitness",
    instructions: "1. Sit with one leg extended straight and the other bent, foot resting near the inner thigh.\n2. Keep the extended leg's knee soft rather than locked.\n3. Hinge forward from the hips, leading with the chest toward the extended foot.\n4. Keep the back long instead of rounding just to reach lower.\n5. Hold 30–60 seconds, then switch sides.",
  },
  'hurdler-stretch': {
    link: "https://www.youtube.com/watch?v=8FKRY28HnVE",
    videoBy: "Your House Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Floor_Hamstring_Stretch/0.jpg",
    instructions: "1. Sit with one leg extended straight in front of you.\n2. Bend the other knee out to the side; if the knee complains, tuck that foot against the inner thigh instead.\n3. Square the hips and chest toward the straight leg.\n4. Hinge forward from the hips over the extended leg, reaching toward the foot.\n5. Hold 30–60 seconds, then switch sides.",
  },
  'bodyweight-good-morning-stretch': {
    link: "https://www.youtube.com/watch?v=mXgsfc6eLNg",
    videoBy: "Dani Winks Flexibility",
    instructions: "1. Stand tall with feet hip-width apart and knees soft.\n2. Hinge forward at the hips, keeping the back flat and chest reaching forward.\n3. Let the arms hang or reach toward the floor as the hamstrings lengthen.\n4. Stop where you feel a stretch building, not pain, and keep breathing.\n5. Hinge back up to standing; repeat for reps or hold at end range for time.",
  },
  'standing-quad-stretch': {
    link: "https://www.youtube.com/watch?v=kzAsm4WQqvQ",
    videoBy: "PureGym",
    instructions: "1. Stand tall, holding a wall or chair for balance if needed.\n2. Bend one knee and grab that foot or ankle behind you.\n3. Pull the heel gently toward the glute, keeping the knees close together.\n4. Keep the hips level and avoid arching the lower back to get more range.\n5. Hold 30–60 seconds, then switch sides.",
  },
  'yoga-garland-pose': {
    link: "https://www.youtube.com/watch?v=IXpJEqssze8",
    videoBy: "Yoga With Adriene",
    instructions: "1. Stand with feet slightly wider than the hips, toes turned out.\n2. Lower into a deep squat, heels down if possible.\n3. Bring the palms together at the chest and press the elbows into the inner knees to open them.\n4. Lift the chest and lengthen the spine rather than rounding forward.\n5. Hold 30–60 seconds, breathing into the hips.",
  },
  'yoga-lizard-pose': {
    link: "https://www.youtube.com/watch?v=-6MGjYmHdYQ",
    videoBy: "Yoga With Adriene",
    instructions: "1. From a low lunge, step the front foot to the outside of the front hand.\n2. Walk the front foot wider until you feel the hip opening.\n3. Lower onto the forearms if that's available, or stay up on the hands.\n4. Keep the back leg straight and active, back heel reaching away.\n5. Hold 1–2 minutes, then switch sides.",
  },
  'yoga-cow-face-pose': {
    link: "https://www.youtube.com/watch?v=MzfLEJwQNWc",
    videoBy: "YOGA UPLOAD with Maris Aylward",
    instructions: "1. Sit and stack one knee directly on top of the other, feet wide of the hips.\n2. Reach the bottom arm behind the back, palm facing out.\n3. Reach the top arm overhead and bend the elbow to reach down the spine.\n4. Walk the fingers toward each other, or use a strap to bridge the gap.\n5. Hold 30–60 seconds, then switch the arm and leg stack.",
  },
  'yoga-butterfly': {
    link: "https://www.youtube.com/watch?v=B6tb4TncKhY",
    videoBy: "Yoga With Adriene",
    instructions: "1. Sit tall and bring the soles of the feet together, letting the knees fall open.\n2. Hold the feet or ankles and draw the heels in toward the pelvis.\n3. Lengthen the spine upward rather than collapsing forward.\n4. Optionally fold forward from the hips for a deeper stretch.\n5. Hold 1–2 minutes, breathing steadily and letting the knees release.",
  },
  'yoga-figure-4': {
    link: "https://www.youtube.com/watch?v=-g0nuyTHMrI",
    videoBy: "AskDoctorJo",
    instructions: "1. Lie on your back with both knees bent and feet flat on the floor.\n2. Cross one ankle over the opposite knee, shin roughly parallel to the floor.\n3. Reach through and clasp behind the thigh of the bottom leg.\n4. Gently pull the bottom knee toward your chest until you feel the glute stretch.\n5. Hold 30–60 seconds, then switch sides.",
  },
  'yoga-happy-baby': {
    link: "https://www.youtube.com/watch?v=gVM7GZg0OYU",
    videoBy: "YogaRenew",
    instructions: "1. Lie on your back and draw both knees toward the chest.\n2. Grab the outer edges of the feet with your hands, opening the knees wide toward the armpits.\n3. Flex through the heels, stacking ankles roughly over the knees.\n4. Press the feet into the hands to create gentle resistance.\n5. Rock gently side to side for 30–60 seconds to release the lower back.",
  },
  'yoga-head-to-knee-pose': {
    link: "https://www.youtube.com/watch?v=m_wHNBpSD-0",
    videoBy: "Black Yogi Nico Marie",
    instructions: "1. Sit with one leg extended straight and the other foot drawn into the inner thigh.\n2. Square the hips toward the extended leg.\n3. Lengthen the spine as you hinge forward from the hips over the straight leg.\n4. Lead with the chest rather than rounding the back to reach further.\n5. Hold 30–60 seconds, then switch sides.",
  },
  'chest-doorway-stretch': {
    link: "https://www.youtube.com/watch?v=h4M4XmCBFd8",
    videoBy: "Function Thru Fitness Personal Training, Inc.",
    instructions: "1. Stand in a doorway and raise one forearm to the frame at shoulder height, elbow bent 90 degrees.\n2. Step forward through the doorway with the same-side foot until you feel a stretch across the chest.\n3. Keep the ribs down and the shoulder away from the ear rather than shrugging.\n4. Hold 20–30 seconds, then repeat with the arm a little higher or lower on the frame.\n5. Switch sides.",
  },
  'knee-to-chest-stretch': {
    link: "https://www.youtube.com/watch?v=2M2eedW35ZY",
    videoBy: "Your House Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One_Knee_To_Chest/1.jpg",
    instructions: "1. Lie on your back with both legs extended.\n2. Draw one knee toward the chest, hands behind the thigh or shin.\n3. Keep the opposite leg long on the floor and the low back relaxed.\n4. Hold for 20–30 seconds, then switch legs.\n5. Finish by pulling both knees to the chest together.",
  },
  'pelvic-tilt': {
    link: "https://www.youtube.com/watch?v=YLaTyrPAjbw",
    videoBy: "Dr. Carl Baird",
    instructions: "1. Lie on your back with knees bent, feet flat on the floor.\n2. Exhale and flatten the low back into the floor by tilting the pelvis under.\n3. Inhale and release back to a small natural arch.\n4. Move slowly, keeping the motion coming from the pelvis rather than the legs.\n5. Repeat for 10–15 reps.",
  },
  'chin-tuck': {
    link: "https://www.youtube.com/watch?v=vhFGQxDVzF8",
    videoBy: "Physio REHAB",
    instructions: "1. Sit or stand tall with eyes level.\n2. Glide the chin straight back, creating a slight double chin, without tipping the head down.\n3. Keep looking forward the whole time.\n4. Hold 2–3 seconds, then release.\n5. Repeat for 10 reps.",
  },
  'shoulder-overhead-stretch': {
    link: "https://www.youtube.com/watch?v=YB8_Uhl2paY",
    videoBy: "Tom Merrick",
    instructions: "1. Stand facing a wall, arms reaching overhead.\n2. Walk the fingers up the wall, stacking wrists under shoulders as in a handstand.\n3. Keep the ribs drawn down and avoid over-arching the low back to get the reach.\n4. Press the upper arms toward the ears to deepen the overhead position.\n5. Hold 20–30 seconds, breathing steadily.",
  },
  'sleeper-stretch': {
    link: "https://www.youtube.com/watch?v=5eTs7ufGJ6U",
    videoBy: "Momenta Chiropractic",
    instructions: "1. Lie on the side you're stretching, upper arm straight out in front at shoulder height, elbow bent to 90° and fingers pointing up.\n2. Roll the body back slightly so the shoulder blade isn't pinched under you.\n3. Use the other hand to ease the forearm down toward the floor.\n4. Stop at a gentle stretch at the back of the shoulder, never a pinch in front.\n5. Hold 20–30 seconds, then switch sides.",
  },
  'windshield-wipers': {
    link: "https://www.youtube.com/watch?v=tTmFOx5zHMQ",
    videoBy: "Your House Fitness",
    instructions: "1. Lie on your back, knees bent and together, feet planted.\n2. Keep both shoulders flat on the floor throughout.\n3. Slowly rock both knees to one side, then back through center to the other side.\n4. Move only as far as feels controlled and pain-free.\n5. Continue for 8–10 reps each direction.",
  },
  'bridge': {
    link: "https://www.youtube.com/watch?v=gWvklUCj-X0",
    videoBy: "Fit & Bendy",
    instructions: "1. Lie on your back, knees bent, feet flat near the glutes.\n2. Place hands by the ears, fingers pointing toward the shoulders.\n3. Press through hands and feet to lift the hips and chest, opening the shoulders and wrists.\n4. Keep the neck relaxed and gaze toward the floor between the hands.\n5. Hold a few breaths, then lower slowly.",
  },
  'bear-hug-stretch': {
    link: "https://www.youtube.com/watch?v=4zwxe673E70",
    videoBy: "Signum Fitness & Nutrition",
    instructions: "1. Stand or sit tall and wrap both arms around yourself, hands toward the opposite shoulder blades.\n2. Round the upper back and let the shoulder blades spread apart.\n3. Drop the chin slightly and reach a little farther across with each arm.\n4. Breathe into the space between the shoulder blades.\n5. Hold for 20–30 seconds.",
  },
  'yoga-cobra': {
    link: "https://www.youtube.com/watch?v=n6jrC6WeF84",
    videoBy: "Yoga With Adriene",
    instructions: "1. Lie face down, hands under the shoulders, elbows hugged into the ribs.\n2. Press the tops of the feet down and engage the legs.\n3. Inhale and lift the chest, keeping a soft bend in the elbows.\n4. Draw the shoulders back and down, away from the ears.\n5. Hold a few breaths, then lower back down.",
  },
  'yoga-fish-pose': {
    link: "https://www.youtube.com/watch?v=vhFdcezAyL8",
    videoBy: "Yoga & You",
    instructions: "1. Lie on your back, legs extended, hands tucked under the glutes.\n2. Press into the forearms and elbows to lift the chest.\n3. Let the head tip gently back, crown of the head light on the floor or hovering.\n4. Keep the throat soft, with weight mostly in the forearms, not the neck.\n5. Hold a few breaths, then lower carefully.",
  },
  'yoga-sphinx': {
    link: "https://www.youtube.com/watch?v=A3TtesUoxNQ",
    videoBy: "sarahjoalmo",
    instructions: "1. Lie face down, forearms on the floor, elbows under the shoulders.\n2. Press the forearms down and lift the chest slightly.\n3. Keep the low back long and the hips heavy on the floor.\n4. Relax the shoulders down away from the ears.\n5. Hold for 5–10 breaths.",
  },
  'yoga-thread-needle': {
    link: "https://www.youtube.com/watch?v=vOukJVt56os",
    videoBy: "Yoga with Kassandra",
    instructions: "1. Start on all fours, wrists under shoulders, knees under hips.\n2. Slide one arm underneath the body, palm up, lowering that shoulder and ear to the floor.\n3. Keep the hips stacked over the knees, using the other hand for balance.\n4. Breathe into the upper back and shoulder on the threaded side.\n5. Hold for 5–10 breaths, then switch sides.",
  },
  'yoga-seated-twist': {
    link: "https://www.youtube.com/watch?v=at_ohf5-5qU",
    videoBy: "YogaDownload",
    instructions: "1. Sit with legs extended, then bend one knee and cross that foot over the opposite thigh.\n2. Sit tall through the spine before adding rotation.\n3. Twist toward the bent knee, using the opposite elbow or hand against the leg for leverage.\n4. Keep both sit bones grounded and lengthen the spine with each inhale.\n5. Hold for 5–8 breaths, then switch sides.",
  },
  'low-bridge-rotations': {
    instructions: "1. Set up in a low bridge with hands or forearms close to the feet, hips lifted.\n2. Shift weight into one arm and leg, then rotate the body to face away from the floor.\n3. Reach the free arm up and open the chest toward the ceiling as you rotate through.\n4. Continue the rotation until you face the floor again on the same side.\n5. Reverse the rotation back to the starting bridge, then repeat to the other side.",
  },
};

(function applyExerciseMedia() {
  if (typeof LIBRARY === 'undefined') return;
  LIBRARY.forEach(ex => {
    const m = EXERCISE_MEDIA[ex.id];
    if (!m) return;
    if (m.link) ex.link = m.link;
    if (m.imageUrl && !ex.imageUrl && !ex.image) ex.imageUrl = m.imageUrl;
    if (m.instructions && !ex.instructions) ex.instructions = m.instructions;
  });
})();
