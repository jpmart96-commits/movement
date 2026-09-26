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
// Batch 3 (26 Sep 2026): Tier 3 — the rest of the active library (166).
// Batch 4 (26 Sep 2026): Tier 4 — the not-yet progressions (29). Every
//   library exercise now has an entry.
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
    link: "https://www.youtube.com/shorts/-vmrTXJnyy4",
    videoBy: "Marco Meyer Moves",
    instructions: "1. Get the stick balanced and stable on your palm or fingertip before moving.\n2. Keep your eyes on the top of the stick as you take the first slow step.\n3. Let your hand drift underneath the stick's base to correct any tilt as you walk.\n4. Take small, steady steps, adding speed or direction changes once comfortable.",
  },
  'stick-transfer': {
    link: "https://www.youtube.com/results?search_query=balance+stick+on+palm+pass+to+other+hand",
    videoBy: "YouTube search (no exact video found)",
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

  // ── Batch 3: Tier 3 (rest of the active library) ────────────
  'iso-squat-pins': {
    link: "https://www.youtube.com/watch?v=SckBZz_-Yzs",
    videoBy: "Will Ratelle",
    instructions: "1. Set the safety pins in the rack at your sticking-point height, usually just above parallel.\n2. Get under the bar with normal squat setup and brace hard before pushing into the pins.\n3. Drive up into the pins as hard as possible without moving the bar.\n4. Hold maximal effort for 3–6 seconds, then rack and rest fully.\n5. Do 3–5 reps with 2 minutes rest between efforts.",
  },
  'iso-bench-pins': {
    link: "https://www.youtube.com/watch?v=ORsH3R_Nd7Q",
    videoBy: "Tony Bonvechio",
    instructions: "1. Set the pins on an incline bench inside the rack so the bar sits 2–5 cm off your chest.\n2. Lie back, grip the bar as in a normal press, and set your shoulder blades.\n3. Press up into the pins with full intent without the bar actually moving.\n4. Hold maximal tension for 3–6 seconds, then lower and rest.\n5. Perform 3–5 reps with 2 minutes rest between efforts.",
  },
  'iso-pull-pins': {
    link: "https://www.youtube.com/watch?v=FLL8JNH7kQw",
    videoBy: "Peak Force",
    instructions: "1. Set the pins so the bar sits at mid-thigh height in the rack.\n2. Stand tall with shins near vertical, hips slightly back, and grip the bar.\n3. Pull up into the pins as hard as possible without letting the bar move.\n4. Hold maximal effort for 3–5 seconds, then release and rest.\n5. Do 3–5 reps with 2 minutes rest; on opener days, 2–3 easier pulls before jumps is enough.",
  },
  'iso-press-pins': {
    link: "https://www.youtube.com/watch?v=8_14qNVwAws",
    videoBy: "Dr. Joel Seedman",
    instructions: "1. Set the pins at forehead height with the bar resting just under them.\n2. Grip the bar at shoulder width and brace the ribs down before pressing.\n3. Press up into the pins as hard as possible without the bar moving.\n4. Hold maximal tension for 3–6 seconds, then lower and rest.\n5. Perform 3–5 reps with 2 minutes rest between efforts.",
  },
  'kb-swing': {
    link: "https://www.youtube.com/watch?v=bDCeXbMJVNs",
    videoBy: "Zack Henderson",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Kettlebell_Swings/1.jpg",
    instructions: "1. Stand with feet shoulder-width apart, kettlebell a foot or so in front of you.\n2. Hinge at the hips to grip the bell, then hike it back between your legs.\n3. Snap the hips forward explosively to drive the bell to chest height, arms just along for the ride.\n4. Let the bell float weightless at the top, then let it fall back into the next hinge.\n5. Keep a flat back throughout; work 10–20 reps per set.",
  },
  'ring-push-up': {
    link: "https://www.youtube.com/watch?v=dSRY2IHqOsI",
    videoBy: "Tykato Fitness",
    instructions: "1. Set the rings at roughly hip height and grip them with straight arms in a plank.\n2. Turn the rings out slightly and stack shoulders over wrists.\n3. Lower under control keeping the rings close to the body, elbows tracking back not flared.\n4. Press back up, turning the rings in slightly as you lock out.\n5. If the rings drift, regress to a lower ring height or an incline until stable.",
  },
  'walking-lunge': {
    link: "https://www.youtube.com/watch?v=vYfp2t4XgqQ",
    videoBy: "Runna",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Walking_Lunge/1.jpg",
    instructions: "1. Stand tall, hands on hips or holding dumbbells at your sides.\n2. Step forward into a long stride and drop the back knee toward the floor.\n3. Keep the front shin close to vertical and the torso upright.\n4. Drive through the front heel to step the back leg forward into the next lunge.\n5. Continue alternating legs for the prescribed distance or rep count.",
  },
  'weighted-crunch': {
    link: "https://www.youtube.com/watch?v=1YSxi0qv3wg",
    videoBy: "Live Lean TV Daily Exercises",
    instructions: "1. Lie on your back with knees bent and feet flat, holding a plate against your chest.\n2. Brace the core and exhale as you curl the shoulder blades off the floor.\n3. Keep the plate close to the chest so the load doesn't pull on the neck.\n4. Lower back down under control without fully relaxing between reps.\n5. Work a controlled 8–15 reps rather than rushing the range of motion.",
  },
  'cable-twist': {
    link: "https://www.youtube.com/watch?v=-i4qxlV_SWc",
    videoBy: "SET FOR SET",
    instructions: "1. Set the cable low and stand side-on to the machine, feet shoulder-width apart.\n2. Grip the handle with both hands, arms extended near the low pulley.\n3. Rotate the torso and pull the handle up and across the body to shoulder height, pivoting the back foot.\n4. Keep the arms relatively fixed so the rotation comes from the hips and core, not just the shoulders.\n5. Return under control and complete reps on one side before switching.",
  },
  'cossack-squat': {
    link: "https://www.youtube.com/watch?v=JaCbmoDqUc4",
    videoBy: "Flexibility Maestro",
    instructions: "1. Stand in a wide stance, toes turned slightly out.\n2. Shift your weight over one bent leg, sinking the hips down and back while keeping that heel down.\n3. Straighten the opposite leg out to the side with the foot flat or toes pulled up.\n4. Keep the chest up and torso as upright as mobility allows.\n5. Push back through the bent leg to shift to the other side, or regress to a shallower range if the ankle or hip pinches.",
  },
  'jefferson-curl': {
    link: "https://www.youtube.com/watch?v=y_APeWo643w",
    videoBy: "Tom Merrick",
    instructions: "1. Stand on a raised platform holding a very light bar or plate, feet hip-width apart.\n2. Start rounding from the neck, then the upper back, rib by rib, letting the weight pull you into flexion.\n3. Keep knees soft and let the bar travel straight down past the shins toward the floor.\n4. Reverse the movement by stacking the spine back up from the pelvis to the head.\n5. Use minimal load and stop the descent short of any sharp or pinching sensation.",
  },
  'bulgarian-split-squat': {
    link: "https://www.youtube.com/watch?v=VPhhE6bBzZE",
    videoBy: "Jack Hanrahan Fitness",
    instructions: "1. Rest the top of your back foot on a bench, front foot far enough forward for a vertical shin.\n2. Keep most of your weight through the front leg and torso upright.\n3. Bend the front knee to lower until the back knee nearly touches the floor, feeling a stretch through the hip flexor.\n4. Drive through the front foot to stand back up.\n5. Complete all reps on one side before switching legs.",
  },
  'single-leg-rdl': {
    link: "https://www.youtube.com/watch?v=k83AIfjDbnI",
    videoBy: "Caroline Drury Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Kettlebell_One-Legged_Deadlift/1.jpg",
    instructions: "1. Stand on one leg holding a dumbbell in the opposite hand, soft bend in the standing knee.\n2. Hinge at the hips, letting the free leg extend straight back as the torso tips forward.\n3. Keep the hips square and the dumbbell close to the standing leg as it lowers toward the shin.\n4. Reverse the hinge, squeezing the glute to return to standing.\n5. Keep a slight knee bend throughout and touch the free foot down between reps if balance is limited.",
  },
  'half-kneeling-press': {
    link: "https://www.youtube.com/watch?v=8ffgDvOzxZA",
    videoBy: "APEC - Athletic Performance Education Company",
    instructions: "1. Kneel with the same-side knee down as the pressing arm, front knee and hip at 90°.\n2. Brace the core and squeeze the glute of the down leg to keep the hips square.\n3. Press the dumbbell straight overhead without leaning back or flaring the ribs.\n4. Lower under control to shoulder height.\n5. Complete all reps then switch the kneeling leg and pressing arm.",
  },
  'pallof-press': {
    link: "https://www.youtube.com/watch?v=LA6Uc5yIV1c",
    videoBy: "FITBODY with Julie Lohre",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pallof_Press/1.jpg",
    instructions: "1. Stand side-on to the cable or band anchor at chest height, feet shoulder-width apart.\n2. Hold the handle at your sternum with both hands, arms bent.\n3. Press the handle straight out in front of you, resisting the pull rotating your torso toward the anchor.\n4. Hold briefly at full extension, keeping hips and shoulders square.\n5. Return under control and complete reps before turning to face the other direction.",
  },
  'long-run': {
    link: "https://www.youtube.com/watch?v=KIpuHebfjY0",
    videoBy: "Lee Grantham",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Trail_Running_Walking/0.jpg",
    instructions: "1. Start at an easy, conversational pace where you could hold a conversation.\n2. Keep effort steady rather than chasing a fixed pace, especially over hills.\n3. Relax the shoulders and let the arms swing naturally front to back, not across the body.\n4. Land with your foot roughly under your hips rather than reaching far in front.\n5. Build duration gradually week to week rather than adding pace and distance at the same time.",
  },
  'interval-cycling': {
    link: "https://www.youtube.com/watch?v=VLVHweeG1TU",
    videoBy: "Le Col",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bicycling_Stationary/1.jpg",
    instructions: "1. Warm up with 10–15 minutes of easy spinning before any hard efforts.\n2. Set resistance or gearing so you can hit a hard, sustainable effort for the work interval without bouncing in the saddle.\n3. Keep the hips stable and cadence high rather than mashing a heavy gear.\n4. Ease off to an easy spin for the full rest interval to let heart rate come down before the next effort.\n5. Match the work/rest ratio and total interval count to the run protocol it replaces.",
  },
  'vertical-jump': {
    link: "https://www.youtube.com/watch?v=GozaG81Fquk",
    videoBy: "Garage Strength",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Freehand_Jump_Squat/1.jpg",
    instructions: "1. Stand tall, feet shoulder-width apart.\n2. Swing the arms back and bend the knees and hips into a quick countermovement dip.\n3. Reverse explosively, swinging the arms up hard as you drive through the legs.\n4. Extend the ankles, knees, and hips fully at takeoff and reach at the top.\n5. Land softly with bent knees and reset fully before the next rep.",
  },
  'stair-jump': {
    link: "https://www.youtube.com/watch?v=aDv5CI88UKg",
    videoBy: "SSA Athletics",
    instructions: "1. Find a stairwell or steps and start at an easy jogging pace.\n2. Bound up two steps at a time, driving the knee up and swinging the arms for height and distance.\n3. Land on the ball of the foot with a bent knee to absorb impact before the next push.\n4. Keep the torso tall and drive forward and upward rather than just up.\n5. Stop the set and reset if your foot placement or rhythm starts to break down.",
  },
  'med-ball-rotational': {
    link: "https://www.youtube.com/watch?v=DttZ5JU-b_U",
    videoBy: "CORE Strong Fitness",
    instructions: "1. Stand side-on to a wall or partner, feet slightly wider than shoulder width, holding the ball at your hip.\n2. Rotate away from the target to load through the hips and trunk.\n3. Drive through the back hip and rotate explosively, releasing the ball at hip height.\n4. Let the throwing arm follow through across the body naturally.\n5. Reset fully between reps and complete a set before switching sides.",
  },
  'depth-jump': {
    link: "https://www.youtube.com/watch?v=bMHL5xqKn3E",
    videoBy: "National Academy of Sports Medicine (NASM)",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Linear_Depth_Jump/1.jpg",
    instructions: "1. Stand on a low box, roughly knee height for a beginner.\n2. Step off (don't jump off) and land on both feet at the same time.\n3. The instant you touch the ground, absorb briefly then explode straight up into a maximal jump.\n4. Keep ground contact as short as possible and land the jump softly with bent knees.\n5. Start with a lower box and fewer reps, only progressing height once landings stay quiet and controlled.",
  },
  'neck-glide-isolation': {
    link: "https://www.youtube.com/watch?v=qMBTxcTqLIE",
    videoBy: "Brian Shuffle",
    instructions: "1. Sit or stand tall with the spine long and the shoulders relaxed.\n2. Keep the chin level and the face pointed forward the entire time.\n3. Move the head as a single block, leading with a pure sideways shift rather than a turn.\n4. Start with tiny ranges and only expand once the movement stays isolated from the rest of the spine.\n5. Work slowly for 5–8 reps per direction before adding any speed.",
  },
  'sternum-glide-isolation': {
    link: "https://www.youtube.com/watch?v=mexgd5PsgQI",
    videoBy: "BollyOn Studios",
    instructions: "1. Stand tall with feet hip-width apart and arms extended straight out to the sides.\n2. Keep the hips, lower ribs, and head still throughout the movement.\n3. Shift the breastbone directly sideways rather than twisting the shoulders to get there.\n4. Move in small, controlled inches rather than one big swing.\n5. Practice 5–8 slow reps per side before increasing the range.",
  },
  'pancake-good-morning': {
    link: "https://www.youtube.com/watch?v=pCryw3GCaeE",
    videoBy: "The Flexibility Guy - Coach Elia",
    instructions: "1. Sit in a wide straddle with the legs extended and toes pointed up.\n2. Rest a light barbell across the upper back the way you would for a back squat.\n3. Keep the chest open and hinge forward from the hips rather than rounding the lower back.\n4. Lower only as far as the spine stays neutral, then rise back to tall.\n5. Start with an empty bar or light plates for 2–3 sets of 5–8 slow reps.",
  },
  'couch-stretch-weighted': {
    link: "https://www.youtube.com/watch?v=PWyjTV29q48",
    videoBy: "Rory Boyden",
    instructions: "1. Kneel facing away from a wall with the back shin resting up against it.\n2. Square the hips forward and squeeze the glute on the back leg.\n3. Rise the torso tall until a stretch is felt through the front of the hip and thigh.\n4. Add load by holding a plate or dumbbell against the chest once the bodyweight version feels easy.\n5. Hold 30–60 seconds per side, easing off if the front knee complains.",
  },
  'neck-cars': {
    link: "https://www.youtube.com/watch?v=2Ot6wm12xvI",
    videoBy: "Khalil Hussein",
    instructions: "1. Start standing tall with the spine stacked and shoulders down.\n2. Brace the torso so only the neck moves through the circle.\n3. Trace the largest smooth circle the neck can control, pausing at any tight spot rather than pushing through it.\n4. Move slowly enough to stay pain-free and stop well short of any pinch.\n5. Do 3–5 slow circles each direction, working both clockwise and counterclockwise.",
  },
  'foam-roll-adductors': {
    link: "https://www.youtube.com/watch?v=hSxQuAYlPrE",
    videoBy: "Upright Health",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Adductor/0.jpg",
    instructions: "1. Lie face down and place the foam roller under one inner thigh, with that leg turned out to the side.\n2. Support the weight on the forearms and the other leg.\n3. Roll slowly from just above the knee up toward the groin.\n4. Pause on tender spots for 20–30 seconds and keep breathing.\n5. Work 1–2 minutes per side, keeping the pressure tolerable.",
  },
  'dynamic-arm-circles': {
    link: "https://www.youtube.com/watch?v=Po82AIsBFCM",
    videoBy: "Pacers Running",
    instructions: "1. Stand tall with the arms extended straight out to the sides.\n2. Begin with small, fast circles and gradually widen them.\n3. Keep the shoulder blades down and the movement smooth, not jerky.\n4. Reverse direction halfway through the set.\n5. Do 15–20 seconds per direction as part of a warm-up.",
  },
  'wrist-flexor-stretch': {
    link: "https://www.youtube.com/watch?v=cOYA0cTIwzM",
    videoBy: "Rehab My Patient",
    instructions: "1. Extend one arm straight out in front with the palm facing up.\n2. Use the other hand to gently draw the fingers and palm back toward the body.\n3. Keep the elbow straight to deepen the stretch through the forearm.\n4. Ease off right away if there's joint pain rather than a muscle stretch.\n5. Hold 20–30 seconds per side.",
  },
  'wrist-extensor-stretch': {
    link: "https://www.youtube.com/watch?v=gMl9dFSOehs",
    videoBy: "Rehab My Patient",
    instructions: "1. Extend one arm straight out in front with the palm facing down.\n2. Make a loose fist, then use the other hand to press the wrist into flexion.\n3. Keep the elbow straight and the shoulder relaxed.\n4. Stop at a gentle stretch and back off if the wrist pinches.\n5. Hold 20–30 seconds per side.",
  },
  'supinator-stretch': {
    link: "https://www.youtube.com/watch?v=t92fbpW3BN0",
    videoBy: "Jamie S. Dreyer",
    instructions: "1. Extend one arm out with the elbow straight and the palm facing up.\n2. Grip just above the wrist with the other hand.\n3. Slowly rotate the forearm so the palm turns down while the gripping hand resists slightly.\n4. Keep the upper arm still so the rotation happens only at the forearm.\n5. Hold 20–30 seconds per side, breathing normally.",
  },
  'finger-extension-stretch': {
    link: "https://www.youtube.com/watch?v=kF85ZJfo6Qs",
    videoBy: "Rehab My Patient",
    instructions: "1. Hold one hand out in front with the fingers relaxed.\n2. Use the other hand to gently press the fingers back and spread them open.\n3. Keep the wrist neutral so the stretch stays in the fingers rather than the wrist.\n4. Work one finger at a time for a more targeted stretch if needed.\n5. Hold 15–20 seconds per hand.",
  },
  'wall-accel-drill': {
    link: "https://www.youtube.com/watch?v=4UFpSMFrT8E",
    videoBy: "Simple Speed Coach",
    instructions: "1. Set the hands on the wall and walk the feet back until the body forms one straight line from ankle to head.\n2. Drive one knee up to hip height while pushing hard through the grounded foot.\n3. Keep the ankle stiff and strike with the ball of the foot on each switch.\n4. Progress from slow marches to quick single-leg switches, then triple switches.\n5. Work 3–4 sets of 4–6 seconds, resetting the wall angle each set.",
  },
  'mini-hurdle-hops': {
    link: "https://www.youtube.com/watch?v=k9KR1FN9_nc",
    videoBy: "King Sports",
    instructions: "1. Set up 6–8 low hurdles or floor lines in a row, spaced for quick steps.\n2. Hop through on two feet, keeping ground contacts short and springy.\n3. Drive the knees up and keep the ankles stiff rather than sinking into each hop.\n4. Progress to single-leg hops once the two-foot version feels crisp and controlled.\n5. Take full rest between passes so speed and quality stay high.",
  },
  'snap-down-stick': {
    link: "https://www.youtube.com/watch?v=6HFB64kFeNk",
    videoBy: "Chris Pearson",
    instructions: "1. Rise up onto the toes with the arms reaching overhead.\n2. Snap down fast into an athletic position, sitting the hips back with the knees tracking over the toes.\n3. Land quietly and stick the position without extra hops or wobble.\n4. Hold the landing for a full 2 seconds before resetting.\n5. Once that's solid, progress to stepping off a low box and sticking the same landing.",
  },
  'split-squat-iso': {
    link: "https://www.youtube.com/watch?v=OM6mDU0cQ-k",
    videoBy: "Unified Fitness Systems",
    instructions: "1. Set the top of the back foot on a bench behind you, with the front foot far enough forward for a 90° front knee.\n2. Lower until the back knee hovers just off the floor and keep the torso upright.\n3. Press the front heel down and hold the position without shifting weight around.\n4. Keep the front knee tracking over the foot rather than caving inward.\n5. Hold for 30–45 seconds per side for 3 sets.",
  },
  'spanish-squat': {
    link: "https://www.youtube.com/watch?v=hgFxm5KIF7M",
    videoBy: "E3 Rehab",
    instructions: "1. Loop a heavy band around the back of both knees and anchor it low in front, or set up with the back against a wall instead.\n2. Lean back into the band tension and keep the shins vertical throughout.\n3. Sit down and back until the knees reach roughly 70–90° of bend.\n4. Keep the chest up and drive through the band tension to stand back up.\n5. Regress to a shallower knee bend or shorter hold if the knee tendon feels sharp rather than a working ache.",
  },
  'nordic-curl': {
    link: "https://www.youtube.com/watch?v=_e9vFU9-tkc",
    videoBy: "E3 Rehab",
    instructions: "1. Anchor the heels firmly under a bar, partner, or sturdy pad and kneel tall.\n2. Brace the core and hips into a straight line from knees to head.\n3. Lower the torso forward as slowly as control allows, resisting with the hamstrings the whole way.\n4. Catch the fall with the hands on the floor and push back to the start, or use a resistance band for assistance if full range isn't controlled yet.\n5. Start with 2–3 sets of 3–5 reps and avoid this the day before a sprint session.",
  },
  'tennis-ball-punch': {
    link: "https://www.youtube.com/watch?v=fnekOPtF8UQ",
    videoBy: "fightTIPS",
    instructions: "1. Stand arm's length from a wall holding a tennis ball in one hand.\n2. Toss the ball against the wall at a random angle and punch it back with a quick jab as it rebounds.\n3. Keep the guard hand up and eyes on the ball the whole time.\n4. Alternate hands or stay on one hand for a set, staying light on your feet.\n5. Work in 20–30 second bursts, resting about the same between rounds.",
  },
  'tennis-ball-floor': {
    link: "https://www.youtube.com/watch?v=mtuJKyJDH_k",
    videoBy: "Adam Klecheski",
    instructions: "1. Stand with feet shoulder-width apart and a tennis ball on the floor in front of you.\n2. Tap the ball lightly side to side, or in a small circle, using your fingertips with soft knees.\n3. Keep the wrist relaxed and let the fingers do the work, not the whole arm.\n4. Switch hands every 15–20 seconds to work both sides evenly.\n5. Progress by tapping faster or glancing away from the ball for a few taps at a time.",
  },
  'tennis-ball-dribble': {
    link: "https://www.youtube.com/watch?v=wkusPZJKkis",
    videoBy: "Teach Hoops",
    instructions: "1. Stand a step from a wall holding a tennis ball in one hand.\n2. Bounce the ball off the wall at waist height and dribble it back with the same hand.\n3. Keep a steady rhythm, using the fingertips rather than slapping with the palm.\n4. Switch hands after 20–30 reps to build the non-dominant side.\n5. Progress by increasing speed or alternating hands every bounce.",
  },
  'balance-board': {
    link: "https://www.youtube.com/watch?v=ObtgTAIsUMc",
    videoBy: "Swifty Scooters",
    instructions: "1. Set the board on a firm, non-slip floor and stand with feet hip-width apart over the center.\n2. Keep the knees soft and brace the core to find a stable neutral position.\n3. Hold static balance for a set time, then progress to small controlled tips side to side and front to back.\n4. Keep the eyes on a fixed point ahead rather than looking down at your feet.\n5. Start near a wall or support and work up to 30–60 second holds unassisted.",
  },
  'keepie-uppies': {
    link: "https://www.youtube.com/watch?v=4dhteAi5AWo",
    videoBy: "fanofootball",
  },
  'reaction-ball-wall': {
    link: "https://www.youtube.com/watch?v=HZhYCNq7OOI",
    videoBy: "Hockey Training Exercise Demonstrations",
  },
  'two-ball-wall-alternating': {
    link: "https://www.youtube.com/watch?v=s4xk7ojJTCk",
    videoBy: "Coach Trent Mongero",
  },
  'drop-catch-reaction': {
    link: "https://www.youtube.com/watch?v=-pudLqL4GdA",
    videoBy: "Be Gr8 at Tennis - Rob Cherry",
  },
  'single-leg-eyes-closed': {
    link: "https://www.youtube.com/watch?v=cDnTke5lZPA",
    videoBy: "Travis Tarrant",
  },
  'heel-toe-line-walk': {
    link: "https://www.youtube.com/watch?v=mtPeslIoU4w",
    videoBy: "Therapeutic EDGE",
  },
  'single-leg-head-turns': {
    link: "https://www.youtube.com/watch?v=XIzzy_BTkVE",
    videoBy: "Travis Tarrant",
  },
  'single-leg-ball-pass': {
    link: "https://www.youtube.com/watch?v=Wqwk-kyH0po",
    videoBy: "Athletic Performance Academy",
  },
  'balance-board-single-leg': {
    link: "https://www.youtube.com/watch?v=qjV_UTtCJkE",
    videoBy: "GIBBON SlackBoards and SlackLines",
  },
  'balance-board-squat-hold': {
    link: "https://www.youtube.com/watch?v=gN61oWCTLw4",
    videoBy: "INDOBOARD",
  },
  'edge-walk-head-tilt': {
    link: "https://www.youtube.com/watch?v=ioEFZGSmvKE",
    videoBy: "Balance 180 Gymnastics",
    instructions: "1. Find a straight floor line, low curb, or a 2×4 and stand at one end with arms out to the sides.\n2. Walk heel-to-toe along the edge at a slow, controlled pace.\n3. With each step, tilt the head to bring one ear toward the same-side shoulder, then return to neutral before the next step.\n4. Alternate the tilt side with each step and keep the gaze forward.\n5. Walk 8–10 steps, turn around, and repeat, staying near a wall for support if you're new to it.",
  },
  'edge-walk-turning': {
    link: "https://www.youtube.com/watch?v=YbzegrkdGh0",
    videoBy: "Gymnastics Tips",
    instructions: "1. Find a straight floor line, low curb, or a 2×4 and stand at one end with arms out to the sides.\n2. Walk heel-to-toe along the edge at a controlled pace.\n3. Stop mid-walk and rotate a slow 180° without stepping off the edge, then continue walking.\n4. Once that feels stable, progress the turn to a full 360°.\n5. Keep the arms out for balance and stay near a wall until the turns feel steady.",
  },
  'edge-sl-eyes-closed-taps': {
    link: "https://www.youtube.com/watch?v=bz7L3GVQGBM",
    videoBy: "Garrett McLaughlin",
    instructions: "1. Stand on one leg on a floor line, low curb, or a 2×4 with arms out to the sides.\n2. Close your eyes once you feel stable.\n3. Tap the free foot forward to the floor, then out to the side, without fully weighting it.\n4. Keep the standing hips level and the core braced throughout.\n5. Hold 20–30 seconds per side, opening the eyes immediately if you feel unsteady.",
  },
  'edge-squat-eyes-closed': {
    link: "https://www.youtube.com/watch?v=UR-WO0DEqGY",
    videoBy: "Garrett McLaughlin",
    instructions: "1. Stand with both feet on a floor line, low curb, or a 2×4, arms out to the sides.\n2. Close your eyes once balanced.\n3. Lower slowly into a full squat, keeping both feet on the edge the whole way down.\n4. Pause briefly at the bottom, then stand back up at the same slow pace.\n5. Do 5–8 slow reps, opening the eyes any time you lose the edge.",
  },
  'edge-sl-gaze-shifts': {
    link: "https://www.youtube.com/watch?v=C3ceotefqL4",
    videoBy: "Cara Giusti, PT, DPT",
    instructions: "1. Stand on one leg on a floor line, low curb, or a 2×4 with arms out to the sides and the head still.\n2. Keep the head fixed and shift only the eyes up, then down, several times.\n3. Then shift the eyes left, then right, keeping the head still throughout.\n4. Keep the standing knee soft and the core braced.\n5. Hold 20–30 seconds, then switch legs.",
  },
  'edge-walk-ball-bounce': {
    link: "https://www.youtube.com/watch?v=dfTvrMQ6mdg",
    videoBy: "Pediatric Physical Therapy Exercises",
    instructions: "1. Find a floor line, low curb, or a 2×4 and hold a tennis ball, arms out to the sides.\n2. Walk the edge heel-to-toe while bouncing the ball on the floor with one hand.\n3. Every few steps, drop into a low lunge to bounce the ball near the floor, then continue walking.\n4. Keep the eyes up rather than watching your feet or the ball.\n5. Walk 8–10 steps, turn around, and repeat, switching the bouncing hand each pass.",
  },
  'stick-grip-types': {
    link: "https://www.youtube.com/results?search_query=stick+eagle+grip+pronated+supinated+shoulder+mobility",
    videoBy: "YouTube search (no exact video found)",
    instructions: "1. Hold the stick with both hands about shoulder width apart to start.\n2. Pronated grip: both palms face down and knuckles up, as if gripping a bar overhead.\n3. Supinated grip: rotate both palms to face up, like the bottom of a bicep curl.\n4. Eagle grip: from supinated, rotate the elbows up and out until the palms face away from you, an extreme internal shoulder rotation.\n5. Cycle through all three grips slowly, pausing a few seconds in each to feel the shoulder position before moving on.",
  },
  'stick-hip-pike-slide': {
    link: "https://www.youtube.com/results?search_query=stick+hip+hinge+pike+hands+hanging+from+stick+mobility",
    videoBy: "YouTube search (no exact video found)",
    instructions: "1. Hold the stick against your hips with a wide double-overhand grip.\n2. Hinge forward into a pike, letting the stick roll down so your hands end up hanging from it while your hips stay back.\n3. Keep the legs as straight as comfortable and the stick in light contact with the body the whole way down.\n4. Reverse the motion to re-stand, rolling the stick back up to your hips.\n5. Once smooth, add a full squat at the bottom of the pike before standing back up.",
  },
  'stick-overhead-behind-back': {
    link: "https://www.youtube.com/results?search_query=stick+eagle+grip+overhead+behind+back+shoulder+mobility",
    videoBy: "YouTube search (no exact video found)",
    instructions: "1. Start with a wide double supinated (palms up) grip on the stick.\n2. Slide both hands toward one end, then twist one hand into an eagle grip and back to explore the range.\n3. Repeat the slide-and-twist sequence with the stick held at eye level, then overhead, then behind the back.\n4. Add a small forward hip flex as the stick passes overhead or behind the back to free up shoulder range.\n5. Work both directions evenly and stop short of any pinching shoulder pain.",
  },
  'stick-fingertip-stepover': {
    link: "https://www.youtube.com/shorts/n-fQYALMfAM",
    videoBy: "@igor.system",
    instructions: "1. Hold the stick horizontally at hip height using only the fingertips of both hands.\n2. Lift one foot and step over the stick without letting go of it or touching it with the leg.\n3. Bring the second foot over so you end up standing on the far side of the stick.\n4. Reverse the sequence to step back over, one foot at a time.\n5. Keep the fingertip grip light and the stick still; only regrip between reps, not mid-step.",
  },
  'stick-hop-jump-over': {
    link: "https://www.youtube.com/shorts/xEwpTGJqcno",
    videoBy: "@bro-zone4186",
    instructions: "1. Hold the stick horizontally at shin-to-knee height in front of you.\n2. Hop over it with both feet together, then hop back to the start position.\n3. Progress to a two-footed jump over and back, pausing briefly on each landing.\n4. Once consistent, jump over and immediately rebound straight back without pausing, using the landing to spring the return.\n5. Land soft with bent knees on every rep.",
  },
  'stick-seated-hip-to-butt': {
    link: "https://www.youtube.com/results?search_query=seated+stick+pass+under+legs+balance+challenge",
    videoBy: "YouTube search (no exact video found)",
    instructions: "1. Sit balanced on the sit bones with the feet off the floor, holding the stick in front of the hips.\n2. Pass the stick under the lifted feet and around behind you until it touches the butt, without the stick touching the feet.\n3. Bring it back the same way to the front of the hips.\n4. Progress with straighter legs, then straight and pointed legs.\n5. Set the feet down and reset whenever balance breaks.",
  },
  'stick-360-rotation': {
    link: "https://www.youtube.com/watch?v=hWYPfLrYOCI",
    videoBy: "MoveMore MP",
    instructions: "1. Plant one end of the stick on the floor and hold the top with one hand.\n2. Rotate your whole body 360° around the planted stick while staying on the same side of it.\n3. Let your gripping arm twist and lower down the stick as you turn, then untwist the arm once the rotation is complete.\n4. Keep the base of the stick fixed on the same spot on the floor throughout.\n5. Practice an equal number of reps rotating in each direction.",
  },
  'stick-two-stick-tangle': {
    link: "https://www.youtube.com/results?search_query=two+stick+360+rotation+kinetic+koan",
    videoBy: "YouTube search (no exact video found)",
    instructions: "1. Take one stick in each hand and plant both ends on the floor about shoulder-width apart.\n2. Begin the same whole-body rotation used in the single-stick 360°, one arm circling around each planted stick.\n3. Continue rotating until your arms cross and tangle in front of or behind you.\n4. Step out on the side of the higher arm to unwind and complete the rotation.\n5. Practice both directions, keeping both stick bases planted throughout.",
  },
  'stick-feet-balance-transition': {
    link: "https://www.youtube.com/watch?v=HCiRqduEkWA",
    videoBy: "MoveMore MP",
    instructions: "1. Lie on your back with legs raised and balance the stick horizontally on the soles of your feet.\n2. Make small ankle and hip adjustments to keep it balanced before starting the transition.\n3. Rotate your hips and legs to one side, rolling from your back toward your stomach while keeping the stick on your feet.\n4. Finish lying prone with knees bent and the stick still balanced on the feet, hands off the ground throughout.\n5. If the twisting transition is too hard, regress to a backward roll over one shoulder instead, continuing through to land prone with the stick still on the feet.",
  },
  'juggling-shower': {
    link: "https://www.youtube.com/watch?v=Uk7-iW_Tz5k",
    videoBy: "Taylor Tries",
    instructions: "1. Start in a normal 3-ball cascade to get the rhythm going.\n2. Pick one hand to be the fast, throwing hand and the other to be the catching hand.\n3. Throw every ball in a high arc across from the fast hand to the catch hand.\n4. Pass the ball straight back to the fast hand with a quick, low, flat throw underneath.\n5. Keep the circular direction constant; if throws collide, slow down and isolate the fast hand's rhythm first.",
  },
  'juggling-tennis': {
    link: "https://www.youtube.com/watch?v=kEH2iIF1msQ",
    videoBy: "JugglerJTW",
    instructions: "1. Begin juggling a normal 3-ball cascade.\n2. On one hand's next throw, send the ball up and over the top of the pattern instead of the usual crossing throw.\n3. Let it land in the opposite hand while the other two balls keep following their normal cascade throws underneath.\n4. Alternate which hand throws over the top each cycle, or keep it on one side while learning.\n5. Practice slowly until the over-the-top arc no longer disrupts the two cascading balls.",
  },
  'juggling-mills-mess': {
    link: "https://www.youtube.com/watch?v=GkleBZy7Kcg",
    videoBy: "Circus-expert EU",
    instructions: "1. Start in a 3-ball cascade with a relaxed rhythm.\n2. On the first throw, cross one arm over the other as you release, turning your body slightly toward that side.\n3. Catch and throw the next ball with the arms uncrossing back to a normal position.\n4. Continue alternating crossed and uncrossed arm positions on each throw, letting your torso rotate with the pattern.\n5. Drill the arm-crossing footwork empty-handed first if the timing feels rushed.",
  },
  'juggling-box': {
    link: "https://www.youtube.com/watch?v=Vscg6h1Vi38",
    videoBy: "Taylor Tries",
    instructions: "1. Start with two balls in one hand and one in the other.\n2. Throw one ball straight up on the outside of one hand and, at the same moment, pass a ball flat to the other hand.\n3. Mirror it on the other side: a straight-up throw on the outside of the other hand plus a quick flat pass.\n4. Keep the vertical throws on the outer edges and the passes low through the middle, so the balls trace a box.\n5. Learn the rhythm with two balls before adding the third.",
  },
  'juggling-windmill': {
    link: "https://www.youtube.com/watch?v=grJ0YqMVIC4",
    videoBy: "Shared Hobbies",
    instructions: "1. Start from a steady 3-ball cascade.\n2. Begin circling both hands in the same direction, one following the other, so the pattern rotates like a windmill.\n3. Carry each ball across in the palm before releasing it, rather than throwing it straight across.\n4. Keep the throws low and let the arm circles set the rhythm.\n5. Rehearse the arm motion without balls first, then with one and two balls.",
  },
  'juggling-factory': {
    link: "https://www.youtube.com/watch?v=O6XJGjJH3_Q",
    videoBy: "FlyJuggler",
    instructions: "1. Start juggling two balls as vertical columns in one hand.\n2. Weave the third ball from the other hand under and around the columns.\n3. Keep the column hand's rhythm steady while the weaving hand adjusts its path around it.\n4. Reverse which hand holds the columns once the first side feels consistent.\n5. Slow the columns down while you're still learning the weave's timing.",
  },
  'juggling-441-siteswap': {
    link: "https://www.youtube.com/watch?v=6arRk632OuI",
    videoBy: "Aidan Alper",
    instructions: "1. Warm up with a normal 3-ball cascade.\n2. Throw a higher 4 straight up from one hand so it lands back in the same hand.\n3. Throw a 4 from the other hand the same way.\n4. Then pass a 1 from the first hand: a quick, flat hand-to-hand handoff with no arc.\n5. Repeat the four-four-one rhythm; it switches sides each cycle. Count it out loud.",
  },
  'juggling-under-leg': {
    link: "https://www.youtube.com/watch?v=v_iyu71nrG8",
    videoBy: "mikecorrcircus",
    instructions: "1. Juggle a steady 3-ball cascade and pick which hand will throw under the leg.\n2. Lift that leg and time a normal cascade throw to pass underneath it.\n3. Catch the ball in the opposite hand and continue the cascade without pausing.\n4. Keep the throw low and controlled rather than high and rushed.\n5. Practice the leg lift and throw slowly on their own before adding it into a continuous cascade.",
  },
  'indian-clubs-basic': {
    link: "https://www.youtube.com/watch?v=xZSjTx0M_jE",
    videoBy: "Critical Bench Compound",
    instructions: "1. Hold one light club in each hand with a relaxed grip, arm hanging at your side.\n2. Swing the club down and around in a small circle, letting the wrist and forearm guide the motion.\n3. Keep the shoulder relaxed and let momentum carry the club rather than muscling it around.\n4. Practice the same circle on both sides, then alternate arms.\n5. Start with small, slow circles before increasing the size or speed.",
  },
  'indian-clubs-flows': {
    link: "https://www.youtube.com/watch?v=S2jya26nLng",
    videoBy: "Lea_Shiny Mace and Flow",
    instructions: "1. Warm up with basic single-arm circles on both sides until they feel smooth.\n2. Link two different swing directions together, transitioning at the top or bottom of each circle.\n3. Add the second club, mirroring or alternating the pattern between both arms.\n4. Keep the movement continuous rather than pausing between individual swings.\n5. Slow down any transition that feels rushed until it's controlled at that speed.",
  },
  'contact-juggling': {
    link: "https://www.youtube.com/watch?v=Wl06iQcL9Sg",
    videoBy: "Bayside Hooping",
    instructions: "1. Hold the ball in one open palm, fingers relaxed and slightly spread.\n2. Tilt the hand so the ball rolls smoothly across the palm toward the fingertips.\n3. Let the ball roll off the fingertips into a loose cradle at the base of the fingers.\n4. Keep the hand moving with the ball rather than letting the ball simply fall.\n5. Practice slow, controlled rolls before linking rolls between both hands.",
  },
  'ring-pull-up': {
    link: "https://www.youtube.com/watch?v=Qsg6EP4Va4I",
    videoBy: "Tom Morrison",
    instructions: "1. Hang from the rings with straight arms and the rings turned out at the bottom.\n2. Pull your chest up to the rings, keeping them close to your body.\n3. Drive the elbows back and down rather than flaring them out to the sides.\n4. Lower back to a straight-arm hang under control before the next rep.\n5. Build toward 3–4 sets of 5–8 reps as strength improves.",
  },
  'skin-the-cat': {
    link: "https://www.youtube.com/watch?v=44vYDHorwkM",
    videoBy: "Paul Twyman",
    instructions: "1. Hang from the rings with straight arms.\n2. Tuck the knees to the chest and roll the hips back and up between the rings.\n3. Keep rotating until the body hangs upside down behind the rings with straight arms.\n4. Pause briefly, then reverse the roll back to the start.\n5. Regress by stopping the rotation partway (German hang) until the shoulders tolerate full range.",
  },
  'l-sit-rings': {
    link: "https://www.youtube.com/watch?v=urF3ueca3IU",
    videoBy: "The Sustainable Training Method",
    instructions: "1. Support yourself on the rings with straight arms and the rings turned out.\n2. Depress the shoulders and press the rings down into your sides.\n3. Lift both legs to horizontal with the knees locked and toes pointed.\n4. Keep the ribs pulled down instead of shrugging into the shoulders.\n5. Hold 10–20 seconds, or regress to a tuck or single-leg version first.",
  },
  'one-arm-hang': {
    link: "https://www.youtube.com/watch?v=jjyLApgv_5c",
    videoBy: "Calixpert",
    instructions: "1. Hang from the bar with both hands, then shift most of your weight onto the working arm.\n2. Let the free hand rest lightly on the wrist or a strap for support only.\n3. Keep the working shoulder packed down and away from the ear.\n4. Hold for time, then switch sides and compare left versus right.\n5. Progress by reducing how much the assisting hand helps, set by set.",
  },
  'switch-grip-hang-advanced': {
    instructions: "1. Start in a strong active hang with the shoulders packed down and away from the ears.\n2. Shift most of your weight briefly onto one hand to free the other.\n3. Rotate the free hand into the new grip without letting go or dropping down.\n4. Reset both hands into the active hang before switching again.\n5. Work sets of 4–6 switches per side, resting fully between sets.",
  },
  '90-90-iso-pullup-hang': {
    instructions: "1. Jump or step up to the bar so both elbows sit bent at roughly 90°.\n2. Keep the chest lifted and the shoulder blades pulled down and together.\n3. Hold the position still, resisting any drift up or down.\n4. Breathe steadily instead of holding your breath through the hold.\n5. Build toward 3–4 sets of 10–20 seconds, then lower with control.",
  },
  '0-90-hanging-leg-raise': {
    link: "https://www.youtube.com/watch?v=RAt5-4oJbk4",
    videoBy: "Ido Portal",
    instructions: "1. Hang from the bar with a full grip, straight arms, and legs together.\n2. Brace the core and set a slight posterior pelvic tilt before moving.\n3. Raise both straight legs to parallel with the floor without swinging.\n4. Pause briefly at the top, then lower with control back to the start.\n5. Work 3 sets of 6–10 reps, regressing to bent-knee raises if form breaks down.",
  },
  'one-arm-hanging-leg-raise': {
    link: "https://www.youtube.com/watch?v=xEJRoO7nMYg",
    videoBy: "Bosnian Muscle",
    instructions: "1. Hang from the bar on one arm with the shoulder packed and the body still.\n2. Brace the core fully before starting any leg movement.\n3. Raise both straight legs to parallel with the floor without twisting the torso.\n4. Lower slowly back to the start, resisting any swing.\n5. Only add this once the one-arm hang and two-arm 0–90 raise are both solid.",
  },
  'hs-pike-entry': {
    link: "https://www.youtube.com/watch?v=z4gmz4cF474",
    videoBy: "Coach Bachmann",
    instructions: "1. Start in a pike position with hands on the floor and hips stacked high.\n2. Walk the feet in as close to the hands as flexibility allows.\n3. Press through the shoulders and lift the hips overhead, straightening the legs last.\n4. Keep the gaze down at the floor to stay balanced.\n5. Practice against a wall first and step out of the pike the moment control is lost.",
  },
  'hs-tuck': {
    link: "https://www.youtube.com/watch?v=LRvrlecJahg",
    videoBy: "Paul Twyman",
    instructions: "1. Kick or press up to a handstand with the knees tucked tightly to the chest.\n2. Stack the shoulders directly over the wrists and squeeze the glutes.\n3. Find the balance point by shifting weight from fingertips to heel of the hand.\n4. Hold the tuck for a few seconds before extending toward straddle or full handstand.\n5. Practice near a wall or with a spotter until falling out of the tuck is controlled.",
  },
  'handstand-blocks-climbs': {
    instructions: "1. Kick up to a handstand on a low block or parallette with a wall for support.\n2. Shift weight into one hand and step it up onto the next block.\n3. Follow with the other hand once balance resets.\n4. Keep the ribs pulled in and press firmly through the fingers on each new block.\n5. Climb only as high as control allows, and step down rather than fall if balance goes.",
  },
  '10min-handstand-taps': {
    instructions: "1. Kick up to a handstand against the wall with hands set shoulder-width apart.\n2. Lift one hand a couple of inches and tap it back down without losing the line.\n3. Alternate hands at a steady, controlled pace rather than rushing the taps.\n4. Break the work into short sets across the 10 minutes rather than one continuous hold.\n5. Rest as needed between sets, prioritizing clean taps over total time.",
  },
  'frog-stand': {
    instructions: "1. Find your balance point by rocking your weight slightly forward over the hands.\n2. Keep the head up and the gaze forward rather than down at the floor.\n3. Round the upper back slightly to help the knees grip the arms.\n4. Hold for a few seconds, then rock back down to the feet with control.\n5. Practice on a soft mat with bent elbows so a forward tip is easy to catch.",
  },
  'forearm-stand': {
    link: "https://www.youtube.com/watch?v=HTJ0z-E11CM",
    videoBy: "YOGABODY",
    instructions: "1. Set the forearms shoulder-width apart on the floor with a wall a leg's length away.\n2. Walk the feet up the wall until the hips stack over the shoulders.\n3. Press the forearms down and squeeze the shoulders to lift out of the wrists.\n4. Point the toes and keep the ribs pulled in to avoid over-arching.\n5. Practice small kick-ups away from the wall once the wall hold feels stable.",
  },
  'headstand': {
    link: "https://www.youtube.com/watch?v=aKfFupH5GSY",
    videoBy: "Noelle Roberts Studio",
    instructions: "1. Place the hands shoulder-width on the floor and set the crown of the head in front of them to form a tripod.\n2. Walk the feet in and lift the hips over the shoulders before tucking the knees.\n3. Extend one leg, then the other, up toward the ceiling.\n4. Keep most of the weight in the hands, not the head and neck.\n5. Come down the moment the neck feels loaded, and practise near a wall or on a soft mat first.",
  },
  'tuck-sit': {
    link: "https://www.youtube.com/watch?v=9x8fnQ8uLaU",
    videoBy: "PowerMonkeyFitness",
    instructions: "1. Sit tall with the hands on the floor beside the hips, fingers pointing forward.\n2. Bend the knees into the chest and press down through the hands.\n3. Lift the feet off the floor, balancing your weight on the hands.\n4. Keep the chest lifted and the shoulders away from the ears.\n5. Hold 10–20 seconds, building toward straddle or single-leg L-sit variations.",
  },
  'pike-sit-free': {
    link: "https://www.youtube.com/watch?v=yQXnOuQqKYc",
    videoBy: "Antranik Kizirian",
    instructions: "1. Sit with the legs straight and together, hands beside the hips.\n2. Press down through the hands and actively pull the legs up toward the chest.\n3. Keep the knees locked and toes pointed throughout the lift.\n4. Squeeze the legs together instead of letting them drift apart.\n5. Hold for a few seconds at a time, resting the hips down between attempts.",
  },
  'straddle-leg-circles': {
    link: "https://www.youtube.com/watch?v=X9ZLcGNIzoQ",
    videoBy: "Kerri Kresinski",
    instructions: "1. Sit tall with the legs open wide to the sides and hands lightly on the floor or hips.\n2. Lift both legs slightly off the ground, keeping the knees locked.\n3. Trace slow, controlled circles with straight legs, leading with the heels.\n4. Keep the torso upright and still as the legs move.\n5. Do 5–8 circles each direction, resting the legs down between sets.",
  },
  'straddle-leg-raises': {
    link: "https://www.youtube.com/watch?v=j6goS7QWTuE",
    videoBy: "Simms Fitness",
    instructions: "1. Sit with the legs open wide to the sides, hands on the floor or hips for support.\n2. Keep the knees locked and toes pointed throughout.\n3. Lift both legs together a few inches off the floor.\n4. Hold briefly at the top, then lower without letting the feet touch down.\n5. Work 3 sets of 8–12 controlled reps.",
  },
  'l-sit-floor': {
    link: "https://www.youtube.com/watch?v=IUZJoSP66HI",
    videoBy: "Antranik Kizirian",
    instructions: "1. Sit with the legs straight in front and palms flat on the floor beside the hips.\n2. Press down through the hands and straighten the arms to lift the hips.\n3. Start by tucking one or both knees to the chest to unload the hip flexors.\n4. Progress to lifting one leg straight, then both legs, toward a full L.\n5. Hold each stage 10–15 seconds before moving to the next progression.",
  },
  'low-bar-drill': {
    link: "https://www.youtube.com/watch?v=pz9rbmTvpaE",
    videoBy: "CrossFit",
    instructions: "1. Set a bar at chest-to-hip height with the feet flat on the floor underneath.\n2. Grip the bar and lean back slightly to load the hips.\n3. Drive the hips forward and up into the bar, keeping the arms relatively passive.\n4. Finish by pressing the chest over the bar into a support position.\n5. Repeat for reps, focusing on hip drive rather than pulling with the arms.",
  },
  'turtle-hold': {
    link: "https://www.youtube.com/watch?v=u1WRd19ynJc",
    videoBy: "pigmie",
    instructions: "1. Squat down and place both hands flat on the floor, shoulder-width apart.\n2. Bend the elbows and set them into the front of the hips, just inside the hip bones.\n3. Lean forward and lift the feet off the floor, keeping the body low and horizontal.\n4. Keep the head up with the gaze slightly forward to help balance.\n5. Hold for a few seconds at a time, building toward longer holds or moving in and out of the shape.",
  },
  'slingshot-rebound-plank': {
    link: "https://www.youtube.com/watch?v=-h5vmPru8hw",
    videoBy: "Get Fit Done (formerly This is Fit Workouts)",
    instructions: "1. Start in child's pose with the arms extended and palms on the floor.\n2. Shoot the hips forward low to the ground, sliding through to a straight-arm plank.\n3. Catch the plank position briefly, keeping the core braced and the body in a straight line.\n4. Reverse the motion back to child's pose with control.\n5. Repeat for smooth, reactive reps, keeping the shoulders stable throughout.",
  },
  'rolling-forward': {
    link: "https://www.youtube.com/watch?v=sMlxHIC3yLQ",
    videoBy: "MihranTV",
    instructions: "1. Squat down and place both hands flat on the mat shoulder-width apart.\n2. Tuck the chin to the chest and push gently through the legs, lifting the hips.\n3. Round the back and roll over the shoulders onto the upper back, never the head or neck.\n4. Stay curled in a ball through the roll, knees toward the chest.\n5. Use the momentum to rock forward onto the feet and stand up.",
  },
  'rolling-backward': {
    link: "https://www.youtube.com/watch?v=WSicmtKjOUE",
    videoBy: "Simple Gymnastics",
    instructions: "1. Start in a squat with the chin tucked to the chest.\n2. Sit back and roll onto the back, keeping the body curled tight.\n3. As the hips pass overhead, place both hands flat beside the ears, fingers pointing toward the shoulders.\n4. Push through the hands and arms to lift the head clear of the mat as the legs roll over.\n5. Land on the feet in a squat and stand up; regress to a gentle rock on a soft mat if the neck feels loaded.",
  },
  'rolling-side': {
    link: "https://www.youtube.com/watch?v=YHnyDPeF108",
    videoBy: "Lloyd Byrne",
    instructions: "1. Lie flat on the mat with arms extended overhead and legs straight together.\n2. Keep the body in one long line from fingertips to toes.\n3. Roll sideways along the length of the mat by rotating the whole body as one unit.\n4. Keep the core braced so the hips don't lead or lag behind the shoulders.\n5. Roll for a set distance or count, then reverse direction.",
  },
  'cartwheel': {
    link: "https://www.youtube.com/watch?v=t6hfpz15R9Y",
    videoBy: "Chace Dance Company",
    instructions: "1. Stand tall and reach the arms overhead, then step into a lunge toward the direction of travel.\n2. Bend at the hip and place the lead hand on the floor followed by the second hand, in one line.\n3. Kick the legs up and over in sequence so the body passes through a brief handstand-like straddle.\n4. Land the first foot then the second, finishing facing the start with arms up.\n5. Practice both left- and right-leading cartwheels to build both sides evenly.",
  },
  'ground-get-ups': {
    link: "https://www.youtube.com/watch?v=6z1bPbLyr8I",
    videoBy: "Ben Medder",
    instructions: "1. Start lying on your back, front or side and pick one route to standing: roll to kneel, sit to squat, or turn to a lunge.\n2. Get one foot flat on the floor early to create a base.\n3. Drive through that foot and extend the hips to rise in one continuous movement.\n4. Reverse the route back to the floor with the same control.\n5. Rotate starting positions and sides so getting up never depends on one pattern.",
  },
  'ground-flow': {
    link: "https://www.youtube.com/watch?v=rWdPTDz9eyI",
    videoBy: "Strength + Flow Fitness",
    instructions: "1. Pick two or three floor positions (quadruped, seated, prone, side-sit) to link together.\n2. Move slowly at first and let one position flow into the next without pausing or resetting the hands.\n3. Keep the core engaged and breathe continuously through the transitions.\n4. Explore both directions through the sequence and both sides of the body.\n5. Once comfortable, add speed or close the eyes briefly to build proprioception.",
  },
  'get-up-kick-through': {
    link: "https://www.youtube.com/watch?v=kPHVAKZ0x90",
    videoBy: "Animal Flow",
    instructions: "1. Start in a quadruped (beast) position with hips lifted slightly above the knees.\n2. Reach one hand forward and rotate the hips, kicking the opposite leg through underneath the body.\n3. Extend the kicking leg out to the side as the hips open, finishing in a low seated or standing pivot.\n4. Keep the supporting arm strong and the shoulder stable as the leg passes underneath.\n5. Reverse the motion to return to quadruped, then repeat on the other side.",
  },
  'get-up-backward-roll': {
    link: "https://www.youtube.com/watch?v=aRT3Tc0RhWo",
    videoBy: "CVL BJJ",
    instructions: "1. Start in a low squat with the arms swinging back to build momentum.\n2. Roll backward smoothly along the spine, keeping the chin tucked.\n3. As the hips reach their highest point, snap the legs forward and down toward the floor.\n4. Swing the arms forward hard to help drive the body upright onto the feet.\n5. Land in a stable squat and stand tall; keep hands ready to catch the roll until the timing feels reliable.",
  },
  'ground-flow-sit-through': {
    link: "https://www.youtube.com/watch?v=DTnLJO4jq_A",
    videoBy: "Julia Ladewski",
    instructions: "1. Start in a quadruped position with hands under the shoulders and knees under the hips.\n2. Thread one leg underneath the body toward the opposite side while rotating the hips.\n3. Lift the hips clear of the floor so only the threaded foot and the opposite hand stay grounded.\n4. Finish seated with the legs extended in opposite directions, chest open.\n5. Reverse back to quadruped and repeat leading with the other leg.",
  },
  'ground-flow-shoulder-roll': {
    link: "https://www.youtube.com/watch?v=ikyHPZQJJS0",
    videoBy: "Fit And Fun With Coach Meggin",
    instructions: "1. From a low squat or seated position, tuck the chin and turn the head slightly away from the rolling shoulder.\n2. Guide the body diagonally across the back of one shoulder, never the top of the head or neck.\n3. Keep the movement continuous from hip to opposite shoulder along the back.\n4. Use the momentum to come back up onto the feet or into the next transition.\n5. Practice slowly on a soft surface first and roll to both sides.",
  },
  'ground-flow-scorpion-reach': {
    link: "https://www.youtube.com/watch?v=HL6vmjgK_1o",
    videoBy: "MarkBroadbentPT",
    instructions: "1. Lie face down with arms out to the sides at shoulder height.\n2. Bend one knee and reach that foot up and across toward the opposite hand.\n3. Rotate through the hip and lower spine while keeping the chest and shoulders as flat as comfortable.\n4. Let the reach flow into the next ground position rather than stopping and resetting.\n5. Return to center and repeat on the other side.",
  },
  'lizard-crawl': {
    link: "https://www.youtube.com/watch?v=uknpT9f0lGo",
    videoBy: "Owen Jackson",
    instructions: "1. Start low in a wide push-up position, hands and feet spread wide.\n2. Move the opposite hand and foot forward together, keeping the hips low and close to the floor.\n3. Let the chest sweep close to the ground with each step for a long stride.\n4. Keep the movement slow and controlled rather than rushed.\n5. Cover distance forward and backward, keeping both sides even.",
  },
  'frog-hop': {
    link: "https://www.youtube.com/watch?v=_FCb6drXqr0",
    videoBy: "Bobby Maximus",
    instructions: "1. Squat down low with the hands planted on the floor between the feet.\n2. Load through the hips and legs, then jump both feet forward past the hands explosively.\n3. Drive the knees up toward the chest at the top of the hop.\n4. Land softly back in the low squat with hands ready to plant again.\n5. Chain hops together for distance or reps, resting as needed.",
  },
  'scorpion-walk': {
    link: "https://www.youtube.com/watch?v=NiRMsMKjaGU",
    videoBy: "kaizenoutdoorfitness",
    instructions: "1. Start in a plank or quadruped position with hands planted firmly.\n2. Step one foot across and behind the opposite leg, rotating the hips and lower back.\n3. Let the rotation carry through to the upper back while keeping the hands grounded.\n4. Return the foot to the start position and step forward with the other foot.\n5. Move slowly, prioritizing range of rotation over speed.",
  },
  'seal-drag': {
    link: "https://www.youtube.com/watch?v=LHXdyXMmEEI",
    videoBy: "Dominic Munnelly",
    instructions: "1. Lie face down with the legs straight and relaxed, and the hands planted just outside the shoulders.\n2. Press through the hands and arms to drag the whole body forward, letting the legs trail passively.\n3. Keep the chest slightly lifted and the core braced through the drag.\n4. Move in short controlled pulls rather than one long lunge.\n5. Cover a set distance then rest; regress to shorter distances if the shoulders or low back fatigue quickly.",
  },
  'sprawl': {
    link: "https://www.youtube.com/watch?v=z4ZoTmn1Gvs",
    videoBy: "Grappling SMARTY",
    instructions: "1. Start in a balanced athletic stance with knees bent and hands up.\n2. Drive the hands to the floor as the legs kick straight back and wide, dropping the hips to the mat.\n3. Keep the head and chest up and the hips heavy, as if pressing down on an opponent's shoulders.\n4. Snap the knees back underneath the hips to return to stance.\n5. Repeat for sharp, controlled reps.",
  },
  'level-change-step': {
    link: "https://www.youtube.com/watch?v=lTgXIM0fO9g",
    videoBy: "Grappling SMARTY",
    instructions: "1. Start in a balanced stance with weight on the balls of the feet.\n2. Bend the knees and drop the hips straight down while keeping the chest up and spine neutral.\n3. Step the lead foot deep past the midline, staying low through the transition.\n4. Drive off the back foot to close the distance forward and up.\n5. Return to stance and repeat leading with the other leg.",
  },
  'donkey-kicks': {
    link: "https://www.youtube.com/watch?v=cWMVznFxRPM",
    videoBy: "Flying Frog Academy",
    instructions: "1. Squat down and plant both hands firmly on the floor shoulder-width apart, arms straight.\n2. Shift the weight into the hands and hop the feet off the ground behind the hips.\n3. Keep the arms locked and the shoulders stacked over the wrists as the hips rise.\n4. Control the height of the kick rather than trying to reach a handstand right away.\n5. Land both feet softly together and reset before the next rep.",
  },
  'breakfalls': {
    link: "https://www.youtube.com/watch?v=5n_Qjeia2n8",
    videoBy: "BeyondGrappling",
    instructions: "1. Begin practicing from a seated position before progressing to squatting and then standing falls.\n2. As the body drops, keep the legs together and slightly bent to absorb impact.\n3. Time the arm slap to land just before or as the body touches down, not after.\n4. Keep the head lifted off the mat throughout the fall to protect the neck.\n5. Only advance to the next height once the lower one feels automatic and controlled.",
  },
  'back-arch-to-bridge': {
    link: "https://www.youtube.com/watch?v=jcRykrCXWJY",
    videoBy: "Fit And Fun With Coach Meggin",
    instructions: "1. Stand tall with feet hip-width apart and hands raised overhead.\n2. Squeeze the glutes and push the hips forward as the chest and head lead backward.\n3. Reach back and down with the hands, looking for the floor rather than looking up.\n4. Land both palms flat at the same time, arms and legs sharing the load evenly.\n5. Practice a wall walk-down or use a spotter until the reach and landing feel confident.",
  },
  'corta-capim': {
    instructions: "1. Start in a low squat with both feet flat and hands ready near the floor.\n2. Shift your weight onto the ball of one foot and rise slightly onto it.\n3. Open the opposite knee out to the side as you pivot.\n4. Return to the squat on the new side and repeat, alternating sides.\n5. Keep the rhythm smooth and low; this feeds directly into the Au Cortado entry.",
  },
  'au-cortado': {
    instructions: "1. Begin spinning on one planted leg with the other leg extended for momentum.\n2. As you complete the turn, rise up through the standing leg instead of settling down.\n3. Keep the spinning leg lifted and use its swing to load the cartwheel-style Au.\n4. Drive the hands to the floor and kick through into the Au without ever placing the spinning leg down.\n5. Drill the rise and the Au entry separately before linking them at speed.",
  },
  'role-into-au-cortado': {
    instructions: "1. Start a floor roll from a tucked shoulder, moving smoothly across the back.\n2. Come out of the roll already rotating toward the Au Cortado entry, not stopping to reset.\n3. Rise onto the trailing leg and extend the other for momentum, as in the standalone Au Cortado.\n4. Drive the hands down and kick through into the Au in one continuous motion.\n5. Drill the roll and the Au separately first, then chain them slowly before adding speed.",
  },
  'half-au-cortado': {
    instructions: "1. Set up the same rising spin and leg extension used in the full Au Cortado.\n2. Rotate only partway through the turn instead of completing the full spin.\n3. Control the stop with the standing leg and lower back down under control.\n4. Keep the extended leg active throughout rather than letting it drop early.\n5. Build reps here before adding the full rotation of the complete Au Cortado.",
  },
  'reverse-corta-capim-au-cortado': {
    instructions: "1. Perform Corta Capim in the reverse direction, shifting weight and opening the knee as usual.\n2. Flow directly from the Corta Capim into the Au Cortado spin without pausing between them.\n3. Rise through the standing leg and let the extended leg carry momentum into the Au.\n4. Complete the sequence and reset facing the new direction.\n5. Program as 10 reps x 3 sets with 60 seconds rest between sets.",
  },
  'qdr-circles': {
    instructions: "1. Place your hands on the floor between your legs and load weight into them.\n2. Push through the floor and rotate your body around the planted foot until you complete a full turn.\n3. Shift back into a squat at the end of the turn and repeat on the other side.\n4. Progress by initiating the rotation from the hands rather than the legs, then by removing the hands entirely.\n5. Keep the movement low and controlled rather than rushing the rotation.",
  },
  'role-into-qdr': {
    instructions: "1. Start a floor roll from a tucked shoulder, keeping the motion low and controlled.\n2. Come out of the roll already turning into the QDR setup, hands finding the floor between the legs.\n3. Push through the floor and rotate around the planted foot to complete the turn.\n4. Finish in a squat, linking the transition rather than resetting between reps.\n5. Drill the roll and the QDR separately before chaining them together.",
  },
  'the-centaur': {
    instructions: "1. Stand tall with a relaxed, upright upper body and loose arms.\n2. Drive the legs in a powerful, galloping rhythm, like a horse's gait.\n3. Let the upper body drape and stay passive while the legs generate the power.\n4. Keep the core engaged just enough to support posture without stiffening the torso.\n5. Move continuously for a set duration or distance, contrasting driving legs against a relaxed upper body.",
  },
  'yoga-mountain-pose': {
    link: "https://www.youtube.com/watch?v=NYhH8Gr35cI",
    videoBy: "Yoga With Adriene",
    instructions: "1. Stand with feet together or hip-width, weight even across both feet.\n2. Engage the thighs and lift through the kneecaps without locking the knees.\n3. Lengthen the spine and stack the shoulders over the hips.\n4. Relax the shoulders down and let the arms hang by your sides.\n5. Hold for several breaths as a grounding reset before or between poses.",
  },
  'yoga-downward-dog': {
    link: "https://www.youtube.com/watch?v=Y0GDgQqt-bA",
    videoBy: "SarahBethYoga",
    instructions: "1. From hands and knees, tuck the toes and lift the hips up and back.\n2. Press the hands into the floor and spread the fingers wide.\n3. Draw the hips up and back toward an inverted V shape.\n4. Let the knees stay soft and work the heels toward the floor without forcing them down.\n5. Hold for several breaths, keeping the neck relaxed and the gaze toward the feet.",
  },
  'yoga-upward-dog': {
    link: "https://www.youtube.com/watch?v=Iepuc7z3rWU",
    videoBy: "YYOGA at Home — yoga classes + tutorials",
    instructions: "1. Lie face down and place the hands beside the ribs.\n2. Press into the hands and straighten the arms, lifting the chest and thighs off the floor.\n3. Stack the shoulders directly over the wrists.\n4. Draw the shoulders back and down away from the ears, opening the chest.\n5. Keep the legs active with the tops of the feet pressing down; ease the depth if the lower back complains.",
  },
  'yoga-low-lunge': {
    link: "https://www.youtube.com/watch?v=MjiC4mGTnTw",
    videoBy: "YogaDownload",
    instructions: "1. Step one foot forward into a lunge and lower the back knee to the floor.\n2. Stack the front knee over the front ankle.\n3. Untuck the back toes and let the top of the back foot rest on the floor.\n4. Sink the hips forward and down to open the front of the back hip.\n5. Hold 30–60 seconds, then switch sides.",
  },
  'yoga-warrior-1': {
    link: "https://www.youtube.com/watch?v=TBu5bsWrnTw",
    videoBy: "YouAligned",
    instructions: "1. Step one foot back into a long stance, back foot turned in slightly.\n2. Bend the front knee toward 90 degrees, keeping it tracking over the ankle.\n3. Square the hips and chest toward the front of the mat.\n4. Reach the arms overhead, shoulders relaxed away from the ears.\n5. Hold for several breaths, then switch sides.",
  },
  'yoga-warrior-2': {
    link: "https://www.youtube.com/watch?v=T8b28IuOl_E",
    videoBy: "Heather Kitchen Yoga",
    instructions: "1. Step the feet wide, front foot pointing forward and back foot turned out to the side.\n2. Bend the front knee toward 90 degrees, keeping it over the ankle.\n3. Open the hips and torso to the side, in line with the back foot.\n4. Extend the arms parallel to the floor and gaze over the front hand.\n5. Hold for several breaths, then switch sides.",
  },
  'yoga-extended-side-angle': {
    link: "https://www.youtube.com/watch?v=qXlFNjzLIWA",
    videoBy: "Heather Kitchen Yoga",
    instructions: "1. From Warrior II, hinge the torso over the bent front leg.\n2. Rest the front forearm on the thigh, or bring the front hand to the floor inside or outside the foot.\n3. Reach the top arm overhead to form one long line from the back heel to the fingertips.\n4. Keep the chest open rather than rolling forward toward the floor.\n5. Hold for several breaths, then switch sides.",
  },
  'yoga-triangle': {
    link: "https://www.youtube.com/watch?v=Op72srvfIXM",
    videoBy: "Heather Kitchen Yoga",
    instructions: "1. Step the feet wide, front foot pointing forward and back foot turned in slightly.\n2. Straighten the front leg and hinge at the hip, not the waist, reaching the front hand toward the shin, ankle, or floor.\n3. Stack the top shoulder over the bottom shoulder and extend the top arm toward the ceiling.\n4. Keep both sides of the torso long rather than collapsing into the front leg.\n5. Hold for several breaths, then switch sides.",
  },
  'yoga-standing-forward-fold': {
    link: "https://www.youtube.com/watch?v=g7Uhp5tphAs",
    videoBy: "Yoga With Adriene",
    instructions: "1. Stand with feet hip-width apart.\n2. Hinge at the hips and fold the torso over the legs, keeping the spine long on the way down.\n3. Let the knees bend as much as needed to release the lower back.\n4. Let the head and neck hang heavy, arms dangling or holding opposite elbows.\n5. Hold for several breaths, then rise slowly to avoid dizziness.",
  },
  'two-limbs-negativa': {
    link: "https://www.youtube.com/watch?v=iRb8inBYpf0",
    videoBy: "Howcast",
    instructions: "1. Lower into the negativa base, with one hand and one foot supporting your weight.\n2. Lift the hips so the body forms a low diagonal line rather than a collapsed sit.\n3. Extend the free leg out, keeping it active rather than resting it on the floor.\n4. Keep the supporting arm slightly bent to absorb load rather than locking the elbow.\n5. Hold briefly or move slowly through the position, then switch sides.",
  },
  'wheel-whip': {
    link: "https://www.youtube.com/watch?v=vFPoaTlCMec",
    videoBy: "Mastering Bodyweight Exercise",
    instructions: "1. Build a confident, controlled cartwheel before attempting this.\n2. Drive into the cartwheel with speed, committing the hands to the floor one after the other.\n3. As the hips pass over the hands, whip the legs through toward a handstand line instead of continuing the cartwheel straight through.\n4. Keep the arms strong and the core braced to catch the handstand position momentarily.\n5. Regress by practicing cartwheel-to-handstand bails onto a soft surface until the whip feels controlled.",
  },
  'front-splits': {
    link: "https://www.youtube.com/watch?v=kecvu0aC4m8",
    videoBy: "Shona Vertue",
    instructions: "1. Warm up the hips and hamstrings with a few dynamic leg swings first.\n2. Slide the front leg forward and the back leg behind, hips squared to the front.\n3. Lower only as deep as the hips allow without pain, hands on the floor or blocks for support.\n4. Hold 20–40 seconds, breathing steadily, then ease deeper if it feels right.\n5. Come out slowly and switch sides.",
  },
  'bridge-pushup-basic': {
    link: "https://www.youtube.com/watch?v=m--BWyDAM_4",
    videoBy: "Andrew's Fitness Training",
    instructions: "1. Build a solid full bridge first, hands and feet planted, hips lifted high.\n2. Keep the elbows tracking over the wrists rather than flaring wide.\n3. Move slowly and only as deep as shoulder mobility allows.\n4. Regress to a wall-supported bridge or elevated hands if the wrists or shoulders complain.\n5. Start with 3–5 controlled reps and build from there.",
  },
  'neck-flexion-stretch': {
    link: "https://www.youtube.com/watch?v=uoMmeRubxwk",
    videoBy: "Intermountain Health",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin_To_Chest_Stretch/0.jpg",
    instructions: "1. Sit or stand tall with the shoulders relaxed away from the ears.\n2. Drop the chin slowly toward the chest until a stretch is felt at the back of the neck.\n3. Keep the movement slow and avoid pulling hard with the hands.\n4. Hold 20–30 seconds and breathe steadily.\n5. Ease off if it triggers arm tingling or numbness.",
  },
  'neck-extension-stretch': {
    link: "https://www.youtube.com/watch?v=eV897kJTmbw",
    videoBy: "Intermountain Health",
    instructions: "1. Sit or stand tall with a long spine.\n2. Tilt the head back slowly, leading with the chin.\n3. Stop well short of any pinching or sharp pain.\n4. Hold 10–20 seconds and return to neutral with control.\n5. Stop immediately if dizziness or nerve symptoms appear.",
  },
  'neck-lateral-stretch': {
    link: "https://www.youtube.com/watch?v=cu1d-DH4s2U",
    videoBy: "Psoas Massage + Bodywork",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Neck_Stretch/1.jpg",
    instructions: "1. Sit or stand tall, shoulders relaxed and level.\n2. Tilt the ear toward one shoulder without rotating the chin forward.\n3. Let the opposite shoulder stay down and relaxed.\n4. Hold 20–30 seconds, then repeat on the other side.",
  },
  'neck-rotation-stretch': {
    link: "https://www.youtube.com/watch?v=VJ6qUElGcbc",
    videoBy: "mahalodotcom",
    instructions: "1. Sit or stand tall with the spine long.\n2. Keep the chin level and rotate the head slowly to one side.\n3. Stop at the first sense of tightness, not pain.\n4. Hold 15–20 seconds, then rotate to the other side.",
  },
  'cross-body-shoulder-stretch': {
    link: "https://www.youtube.com/watch?v=uNmWSg705JA",
    videoBy: "BluePhoenix Fitness",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Shoulder_Stretch/1.jpg",
    instructions: "1. Stand or sit tall with the shoulder relaxed away from the ear.\n2. Keep the pulling elbow low, around chest height, rather than jamming into the joint.\n3. Ease the arm across the body until a stretch is felt in the back of the shoulder.\n4. Hold 20–30 seconds, then switch arms.",
  },
  'overhead-triceps-stretch': {
    link: "https://www.youtube.com/watch?v=cPTrm13hSSo",
    videoBy: "PureGym",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Stretch/1.jpg",
    instructions: "1. Raise one arm overhead and bend the elbow so the hand drops behind the head.\n2. Use the opposite hand to gently press the elbow further back.\n3. Keep the ribs down rather than arching the lower back to reach further.\n4. Hold 20–30 seconds, then switch sides.",
  },
  'shoulder-internal-rotation-stretch': {
    link: "https://www.youtube.com/watch?v=RNaMFoh1k64",
    videoBy: "TSAOG Orthopaedics & Spine",
    instructions: "1. Reach one arm behind the back and walk the fingers up the spine.\n2. If the hands don't meet, hold a towel from above with the other hand and walk up it.\n3. Keep the chest open rather than rounding forward to reach higher.\n4. Hold 20–30 seconds, then switch sides.",
  },
  'shoulder-external-rotation-stretch': {
    link: "https://www.youtube.com/watch?v=HzI-XCLNuLU",
    videoBy: "Baptist Health",
    instructions: "1. Stand side-on to a wall or doorframe with the elbow bent to 90° and tucked at the side.\n2. Press the forearm gently back against the frame while keeping the elbow pinned to the ribs.\n3. Keep the shoulder down away from the ear throughout.\n4. Hold 20–30 seconds, then switch sides.",
  },
  'chest-opener-supine': {
    link: "https://www.youtube.com/watch?v=9RCQDYbkPkM",
    videoBy: "Medbridge",
    instructions: "1. Lie on your back along the length of the roller, head and hips supported.\n2. Let both arms fall open to the sides, palms up.\n3. Relax the shoulders down and let gravity open the chest.\n4. Hold 1–2 minutes, breathing slowly and deeply.",
  },
  'hands-clasped-behind-back-stretch': {
    link: "https://www.youtube.com/watch?v=EswbusODZ7o",
    videoBy: "LIVESTRONG",
    instructions: "1. Stand tall and clasp the hands behind the back with straight arms.\n2. Roll the shoulders back and down before lifting the arms.\n3. Lift only as high as feels comfortable in the front shoulders.\n4. Hold 20–30 seconds, breathing steadily.",
  },
  'standing-back-extension': {
    link: "https://www.youtube.com/watch?v=SVhwe-N3VX8",
    videoBy: "Fit Father Project - Fitness For Busy Fathers",
    instructions: "1. Stand with the feet hip-width and hands supporting the low back.\n2. Gently arch backward, leading with the chest, knees soft.\n3. Keep the movement small and pain-free.\n4. Hold 5–10 seconds, or pulse gently a few times.\n5. Avoid if it produces sharp or radiating back pain.",
  },
  'seated-glute-stretch': {
    link: "https://www.youtube.com/watch?v=2E8WWX4cOc4",
    videoBy: "LSM Chiropractic and Forward Natural Medicine",
    instructions: "1. Sit tall and cross one ankle over the opposite knee.\n2. Flex the crossed foot to protect the knee.\n3. Hinge forward from the hips, keeping the back flat.\n4. Hold 20–30 seconds, then switch sides.",
  },
  'knee-to-opposite-shoulder-stretch': {
    link: "https://www.youtube.com/watch?v=pNLqyWe9p2Y",
    videoBy: "Stack 52",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Knee_Across_The_Body/1.jpg",
    instructions: "1. Lie on your back with legs extended.\n2. Draw one knee up and guide it across the body toward the opposite shoulder with both hands.\n3. Keep the opposite leg relaxed on the floor and shoulders flat.\n4. Hold 20–30 seconds, then switch sides.",
  },
  'side-lying-quad-stretch': {
    link: "https://www.youtube.com/watch?v=C2IuPAdGzjI",
    videoBy: "Strength Society App",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/On_Your_Side_Quad_Stretch/1.jpg",
    instructions: "1. Lie on your side with legs stacked.\n2. Bend the top knee and grab the ankle or shin.\n3. Draw the heel toward the glutes while keeping the knees together.\n4. Hold 20–30 seconds, then switch sides.",
  },
  'yoga-hero-pose': {
    link: "https://www.youtube.com/watch?v=ZUfDcmSe2Wg",
    videoBy: "Di Hickman",
    instructions: "1. Kneel with the knees together and feet slightly wider than the hips, tops of the feet flat.\n2. Sit back between the heels, using a block or cushion under the seat if it doesn't reach the floor.\n3. Keep the spine tall rather than leaning back.\n4. Hold 30–60 seconds, breathing steadily.\n5. Come out immediately if there's knee pain, and skip the pose if the knees are sensitive.",
  },
  'horse-stance-hold': {
    link: "https://www.youtube.com/watch?v=op4aI1-NVQE",
    videoBy: "The Barefoot Sprinter",
    instructions: "1. Stand with the feet wider than shoulder-width, toes turned slightly out.\n2. Sink the hips down and back into a low squat, keeping the chest lifted.\n3. Track the knees over the toes and keep the weight through the whole foot.\n4. Hold 20–45 seconds, breathing steadily throughout.",
  },
  'side-lying-hip-stretch': {
    link: "https://www.youtube.com/watch?v=dJvw6reGKKk",
    videoBy: "Cleveland Clinic",
    instructions: "1. Lie on your side with the bottom leg bent for stability.\n2. Cross the top leg over and let the knee drop toward the floor in front.\n3. Keep the top shoulder from rolling forward.\n4. Hold 20–30 seconds, then switch sides.",
  },
  'cross-leg-side-bend': {
    link: "https://www.youtube.com/watch?v=iKMcxB_XVU0",
    videoBy: "Leap Fitness",
    instructions: "1. Stand tall and cross one leg behind the other for a wide, stable base.\n2. Reach the same-side arm overhead and lean gently to the opposite side.\n3. Keep the hips facing forward rather than twisting.\n4. Hold 15–20 seconds, then switch sides.",
  },
  'standing-calf-stretch': {
    link: "https://www.youtube.com/watch?v=YTYQo4WvJHA",
    videoBy: "Travis Tarrant",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_Stretch_Hands_Against_Wall/0.jpg",
    instructions: "1. Face a wall with hands supporting your weight.\n2. Step one leg back, keeping it straight and the heel pressed down.\n3. Lean the hips forward toward the wall until a stretch is felt in the upper calf.\n4. Hold 20–30 seconds, then switch sides.",
  },
  'seated-calf-stretch': {
    link: "https://www.youtube.com/watch?v=uKePAWa2e6c",
    videoBy: "Baptist Health",
    instructions: "1. Sit with the leg extended and the knee bent slightly.\n2. Loop a strap or towel around the forefoot.\n3. Pull the foot gently toward the shin, keeping the knee bend fixed.\n4. Hold 20–30 seconds, then switch sides.",
  },
  'ankle-plantarflexion-stretch': {
    link: "https://www.youtube.com/watch?v=52DxJN9na9U",
    videoBy: "Merck Manuals",
    instructions: "1. Sit with the leg extended in front of you.\n2. Point the toes away from the shin as far as comfortable.\n3. Add gentle overpressure with the hand across the top of the foot.\n4. Hold 15–20 seconds, then release slowly.",
  },
  'toe-extension-stretch': {
    link: "https://www.youtube.com/watch?v=YV9U7PtUsrY",
    videoBy: "The Foot Collective",
    instructions: "1. Sit or stand with the foot in a comfortable position.\n2. Use the hand to gently pull the toes back toward the shin.\n3. Keep the arch long rather than letting the foot roll inward.\n4. Hold 15–20 seconds, then switch feet.",
  },
  'toe-sit-stretch': {
    link: "https://www.youtube.com/watch?v=Dsth46zJJnI",
    videoBy: "Elite Chiropractic and Performance",
    instructions: "1. Kneel on a soft surface with the toes tucked under.\n2. Sit back slowly toward the heels, taking weight through the hands if needed.\n3. Keep the stretch light at first and build depth over sessions.\n4. Hold 15–30 seconds, then come forward off the toes to release.",
  },
  'arch-stretch': {
    link: "https://www.youtube.com/watch?v=uMc-W9XuEaA",
    videoBy: "Travis Tarrant",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Foot-SMR/1.jpg",
    instructions: "1. Place a ball or bottle under the arch of the foot while seated or standing.\n2. Roll slowly along the arch, pausing on tender spots.\n3. Adjust pressure with how much weight you put through the foot.\n4. Work each foot for 30–60 seconds.",
  },

  // ── Batch 4: Tier 4 (not-yet progressions) ──────────────────
  'archer-pull-up': {
    link: "https://www.youtube.com/watch?v=_LGLKUiQH5k",
    videoBy: "Pullup & Dip",
    instructions: "1. Turn the rings out and take a shoulder-width or slightly wider grip.\n2. Pull one arm in tight to the body while the other stays straight and rides out to the side.\n3. Drive the working elbow down and back until your chin clears that ring.\n4. Lower under control back to a dead hang before switching sides.\n5. Build to 3–5 controlled reps per side before moving on to a typewriter pull-up.",
  },
  'typewriter-pull-up': {
    link: "https://www.youtube.com/watch?v=9aV7i_LOZ-A",
    videoBy: "CaliMarco PT",
    instructions: "1. Pull to the top of a pull-up with both arms bent and the rings turned out.\n2. Shift your weight onto one straight arm while the other stays bent, chin over that ring.\n3. Slide sideways across the top, keeping your chin above the rings the whole way.\n4. Finish with the opposite arm bent and the first arm straight.\n5. Lower under control on the bent-arm side; drop back to archer pull-ups if the transition breaks down.",
  },
  'muscle-up-kipping': {
    link: "https://www.youtube.com/watch?v=ThrmnRRC4Xs",
    videoBy: "WODprep",
    instructions: "1. Start in a dead hang and initiate a kip, driving the hips forward then snapping back.\n2. Use the swing to pull the rings toward your lower ribs, turning the wrists over as you go.\n3. Punch down hard through the rings as your chest clears them to drive into support.\n4. Press out to full lockout at the top.\n5. Drill the false-grip turnover on low rings or with a band first if the transition feels unstable.",
  },
  'muscle-up-strict': {
    link: "https://www.youtube.com/watch?v=s2ycF1UZmr8",
    videoBy: "WODprep",
    instructions: "1. Start from a dead hang with a false grip on both rings.\n2. Pull straight up with no leg drive or kip until the rings reach chest height.\n3. Rotate the wrists over the rings as your chest passes them, staying close to the rings.\n4. Press to full lockout with no swing at the top.\n5. Regress to slow negatives or a lightly banded rep if the transition stalls at the bottom.",
  },
  'inverted-muscle-up-elevator': {
    instructions: "1. Start from an inverted, hollow-back hang beneath the rings with a false grip.\n2. Pull the rings down past your hips while keeping the body inverted and hollow, not arching.\n3. Rotate through the transition as the rings pass your torso, staying close and controlled throughout.\n4. Finish by pressing out to support, or on to a handstand depending on the variation being trained.\n5. Only attempt this with a rock-solid strict muscle-up and strong inversion control already in place; drop back to strict muscle-ups if control breaks down mid-turn.",
  },
  'back-lever': {
    link: "https://www.youtube.com/watch?v=ePf69N6jlko",
    videoBy: "GMB Fitness",
    instructions: "1. Hang from the rings then invert through a skin-the-cat to get upside down.\n2. Open to a tight tuck with the hips level with the shoulders and the body horizontal.\n3. Squeeze the shoulder blades down and back so the chest doesn't sag.\n4. Hold the position, then progress to straddle and eventually full extension as strength allows.\n5. Shorten the hold or return to a tighter tuck if the hips drop or the shoulders round forward.",
  },
  'front-lever': {
    link: "https://www.youtube.com/watch?v=BwhZYpIdhro",
    videoBy: "Ashton Fitness",
    instructions: "1. Hang from the rings or a bar with an active, hollow-body grip.\n2. Pull the hips and knees up into a tight tuck so the lower back stays flat.\n3. Push the shoulders down and away from the ears to stop the body dropping.\n4. Extend to advanced tuck, then straddle, then full lever as each level becomes solid.\n5. Hold each level 5–10 seconds before adding reps, and shorten the hold if the hips sag.",
  },
  '90-90-one-arm-iso-chin': {
    instructions: "1. Pull up on one arm until the elbow sits at roughly 90 degrees, using the other hand only lightly to help get set.\n2. Release the assisting hand once positioned and hold the working elbow at that 90-degree angle.\n3. Keep the shoulder packed down and stop the body from swinging or rotating.\n4. Hold for time, then lower under control rather than dropping out of the hold.\n5. Only train this after a solid two-arm 90–90 hold and a confident one-arm active hang; regress to the two-arm version or a band-assisted hold if the shoulder rounds forward.",
  },
  'thick-grip-oac': {
    link: "https://www.youtube.com/watch?v=vn3vHC_M6Ns",
    videoBy: "Tim Berzins",
    instructions: "1. Wrap a towel around a bar or use a thick handle and set a strong one-arm grip with the shoulder packed down.\n2. Start from a partial bend for early negatives, then lower as slowly as control allows.\n3. Keep the working shoulder pulled down and back and avoid letting the body twist or swing.\n4. Build toward a full rep only once slow negatives and one-arm hangs on the thick grip feel controlled.\n5. Drop to a thinner bar or an assisted one-arm chin-up if grip fails before the pulling muscles do.",
  },
  'round-off': {
    link: "https://www.youtube.com/watch?v=1ojiqZQPkPA",
    videoBy: "Fit And Fun With Coach Meggin",
    instructions: "1. Take a short run-up and hurdle into a lunge step with the arms reaching overhead.\n2. Place the hands down one after the other, turning them to face back the way you came.\n3. Kick the lead leg up hard and snap the legs together overhead as you turn over.\n4. Push off the hands forcefully so you land facing back toward the start.\n5. Land with bent knees and arms up, ready to transfer the power into a back handspring or tumbling pass.",
  },
  'corta-capim-bridge-qdr-combo': {
    instructions: "1. Begin in Corta Capim and flow through several rotations, keeping the weight shifting smoothly between hands and feet.\n2. Lower into a bridge as the rotation continues, letting the hips stay open and the head relaxed.\n3. Rotate through the bridge without stalling so the movement stays continuous rather than resetting.\n4. Exit through a QDR circle back to a squat, finishing with the feet under the hips.\n5. Drill Corta Capim, low bridge rotations, and QDR circles separately first, and pause between elements if the flow breaks down.",
  },
  'au-cortado-presses': {
    instructions: "1. Set up in the Au Cortado entry position with one hand and the opposite foot grounded.\n2. Press down through the grounded hand to lift and control the body's weight over that point.\n3. Keep the hips and shoulders stacked rather than letting the body twist during the press.\n4. Lower back under control and repeat for reps on each side.\n5. Master a standard Au Cortado first, and shorten the range of motion if control breaks down during the press.",
  },
  'qdr-rotational-pushups': {
    instructions: "1. Start in a low QDR-style stance with the hands positioned to allow a full circular path.\n2. Lower into a push-up as you begin the rotational sweep, tracking the elbows over the hands.\n3. Press back up while continuing the rotation, mirroring the movement onto the other half of the circle.\n4. Keep the core braced so the hips don't sag or pike as you rotate through the push.\n5. Build reps gradually, and drop back to standard QDR circles without the push-up if pushing endurance runs out before the rotation stays clean.",
  },
  'half-au-role-qdr-combo': {
    instructions: "1. Start in a squat and flow into a Half Au, reaching one hand and the opposite leg out.\n2. Lower back and to the side under control rather than dropping into position.\n3. Pull into a Role, using the momentum to roll smoothly rather than stopping and resetting.\n4. Continue directly from the Role into a QDR with no pause, then return to the squat.\n5. Train 10 reps for 5 sets with 60 seconds rest, running each element separately if the transitions feel rushed; add a full Au Cortado and a second Role only once the basic combo is smooth.",
  },
  'eccentric-pistol-side-pushup-intermediate': {
    instructions: "1. Stand on one leg and lower into a pistol squat as slowly as control allows.\n2. As the hips near the floor, reach the same-side hand down and transition into a one-arm side push-up.\n3. Let the body pass the elbow line into the Vasamento position before pressing back up.\n4. Perform one side push-up per rep for this intermediate version rather than two.\n5. Practice the eccentric pistol and the side push-up separately first if the transition between them isn't smooth yet.",
  },
  'eccentric-pistol-side-pushup-advanced': {
    instructions: "1. Start in a one-leg squat (pistol) position with the working leg planted and the other leg extended forward off the floor.\n2. Rotate down onto the support-side hand and hip into a one-arm side push-up, keeping the free leg hovering throughout and never letting it touch down.\n3. Press back up through the same arm to standing without setting the free leg down at any point.\n4. Master the intermediate version, where brief touches of the free leg are allowed, before removing the touches entirely.\n5. Work 3–5 clean reps per side before adding tempo or range.",
  },
  'hs-straddle': {
    link: "https://www.youtube.com/watch?v=IzZ774DcKeY",
    videoBy: "Paul Twyman",
    instructions: "1. Kick or press up into handstand with the legs open wide into a straddle.\n2. Stack the shoulders over the wrists and press the floor away to round the upper back slightly.\n3. Squeeze the straddle open and point the toes to help hold the balance.\n4. Make small finger and wrist adjustments to correct balance rather than piking at the hips.\n5. Hold against a wall first, then take it freestanding once the shape feels stable.",
  },
  'hs-straight': {
    link: "https://www.youtube.com/watch?v=BcNbi6OSi7E",
    videoBy: "Sid Paulson",
    instructions: "1. Kick up to handstand with the hips fully open and the legs pressed together.\n2. Stack shoulders, hips, and heels into one straight vertical line.\n3. Press through the fingertips and shoulders to fine-tune balance instead of bending at the hips.\n4. Point the toes and keep a light hollow-body brace through the midline.\n5. Build toward a solid 10-second freestanding hold before chasing longer holds.",
  },
  'hs-walking': {
    link: "https://www.youtube.com/watch?v=vD-BUucL9F4",
    videoBy: "WODprep",
    instructions: "1. Kick up into a solid, straight handstand before attempting any steps.\n2. Shift weight slightly onto one hand and lift the other just enough to move it forward.\n3. Take small, quick steps leading with the fingertips rather than lunging the shoulders.\n4. Keep the hips stacked over the hands and look at the floor between them, not forward.\n5. Start with 3–5 controlled steps and only add distance once each step stays balanced; wait until a 10-second static hold is solid before attempting this.",
  },
  'extended-hollow-back-hspu': {
    instructions: "1. Kick up to a wall handstand facing the wall with the hands a few inches out and the body slightly hollowed.\n2. Walk the hands further out from the wall than in a standard handstand push-up to extend the range.\n3. Lower under control into a hollow-back position, letting the head and chest travel back and down between the hands.\n4. Press back up by driving through the shoulders and reversing the hollow-back arch.\n5. Build a solid standard wall handstand push-up and shoulder mobility first, and shorten the range if the lower back rounds or aches.",
  },
  'air-baby': {
    instructions: "1. Squat low and place the hands slightly wider than shoulder width on the floor.\n2. Rest the knees or upper shins on the back of the upper arms, near the elbow-triceps area.\n3. Shift the weight forward over the hands, keeping the head up and the gaze slightly ahead of the fingers.\n4. Find the balance point by pressing the floor away and gently rounding the upper back.\n5. Build a stable Frog Stand hold first, then explore the forward lean in short attempts.",
  },
  'air-baby-extensions': {
    instructions: "1. Start balanced in a solid Air Baby with the knees resting on the upper arms.\n2. Press through the arms to open the elbow angle and lift the body into a higher hold.\n3. Pull the heels in toward the glutes to shorten the lever and keep the balance point stable.\n4. Keep the head up and breathe shallowly so the ribcage doesn't disturb the balance.\n5. Master full Air Baby control first, then extend only a small amount at a time before chasing full extension.",
  },
  'press-hs-pike': {
    link: "https://www.youtube.com/watch?v=AHRJwIpLc0E",
    videoBy: "Chris de Stefano",
    instructions: "1. Set up on parallettes in a pike position with straight legs and hands under the shoulders.\n2. Lift the hips high and shift the shoulders forward over the hands to load the press.\n3. Press the hips up and over into handstand, keeping the legs straight and close to the body.\n4. Practice the eccentric by lowering slowly from handstand back down to pike to build control.\n5. Use a wall or light spotting assistance for early reps until the press is consistent unassisted.",
  },
  'stalder-prep': {
    link: "https://www.youtube.com/watch?v=Q0AmGm7PdRU",
    videoBy: "Paul Twyman",
    instructions: "1. Start on parallettes or the floor in a straddle position with the legs wide and straight.\n2. Lift the hips and open the straddle wide while leaning the shoulders forward over the hands.\n3. Press the hips up and through the straddle into handstand, closing the legs together near the top.\n4. Keep the shoulders protracted and the arms straight throughout the press.\n5. Only attempt full reps once supported pike and straddle presses are solid, and drill hamstring and hip-flexor flexibility separately.",
  },
  'v-sit': {
    link: "https://www.youtube.com/watch?v=P83rvEDFTjg",
    videoBy: "Sid Paulson",
    instructions: "1. Start in a solid L-sit on the floor or parallettes with the legs straight and hips flexed to 90°.\n2. Engage the hip flexors and core to lift the legs above horizontal, moving toward a V shape.\n3. Keep the arms straight and shoulders depressed, pressing the floor away.\n4. Point the toes and squeeze the legs together as they rise.\n5. Build a strong 10–20 second L-sit hold before adding V-sit range.",
  },
  'mechanical-advantage-planche-pushup': {
    instructions: "1. Set up in an easier planche lever, such as tuck planche, with straight arms and protracted shoulders.\n2. Lower slowly into a harder lever, such as straddle or full planche, keeping the hips and shoulders level.\n3. Reverse direction and push back up through the easier lever for the concentric.\n4. Keep the elbows locked and the shoulder blades protracted throughout both phases.\n5. Build solid control in the easier lever alone before adding the harder eccentric range.",
  },
  'bridge-pushup-one-leg': {
    instructions: "1. Set up in a bridge with hands and feet on the floor and the hips lifted.\n2. Shift weight onto one leg and lift the other straight up off the floor.\n3. Bend the elbows to lower the head toward the floor, keeping the lifted leg steady.\n4. Press back up through the arms and the standing leg to return to full bridge.\n5. Master the two-leg bridge push-up solidly before removing the second leg.",
  },
  'bridge-pushup-one-arm': {
    instructions: "1. Set up in a full bridge, then shift most of the weight onto one arm.\n2. Bend the loaded elbow to lower under control, keeping the hips square and the legs steady.\n3. Press back up through the single arm to return to bridge, keeping the wrist stacked under the shoulder.\n4. Keep the free arm light on the floor for balance only, not for pushing.\n5. Confirm a strong, pain-free two-arm bridge push-up and healthy wrists before attempting single-arm reps.",
  },
  'high-bridge-rotations': {
    instructions: "1. Press up into a full, extended bridge with the arms and legs straight and the hips lifted high.\n2. Shift weight onto one arm and leg, and rotate the body open toward that side.\n3. Let the free arm and leg lift and reach toward the ceiling as the body opens into a side-star position.\n4. Rotate back through center to the opposite side, keeping the hips lifted throughout.\n5. Build a solid standard bridge hold and low-bridge rotations first, and stop if the neck or wrists load excessively.",
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
