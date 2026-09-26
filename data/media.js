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
// ─────────────────────────────────────────────────────────────

const EXERCISE_MEDIA = {
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
    instructions: "1. Warm up with a few minutes of walking or very easy jogging.\n2. Run at a pace you can hold a conversation at.\n3. Breathe through the nose if you can.\n4. Keep steps short and relaxed.\n5. Cool down with a few minutes of walking.",
  },
  'z2-cycling': {
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
