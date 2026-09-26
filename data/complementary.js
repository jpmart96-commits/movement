// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — DATA LAYER
// complementary.js — everything around the main block.
//
// Added 2026-09-26. Loaded straight after library.js. It does three things:
//
//   1. Tags every exercise outside the main blocks with a FAMILY (what it
//      is) and ROLES (the jobs it can do in a session). The role decides the
//      dose: a hip stretch held ≤30s is prep, 2–3 × 60–90s is building range,
//      one long easy hold is winding down. Rules, not hand edits, so a new
//      library entry gets tagged the same way. Verified 26 Sep: 296 of 333
//      tagged, none unsorted; the other 37 are main-block content.
//   2. Adds 30 exercises the plan needed and the library didn't have: run &
//      sprint drills, activation, muscle-up prep, handstand prep, breath.
//      Batch 2 (26 Sep) adds 22 more from the Instagram intake.
//   3. Holds the recipes the Generator fills the non-main blocks from:
//      OPEN_VARIANTS, MOBILITY_RECIPES, SKILL_LINES, CLOSE_RECIPES, and
//      the coordination rotation's DOMAIN_FAMILIES.
//
// Evidence behind the roles (see claude/complementary-library-taxonomy.md):
//   - RAMP warm-up (Jeffreys): raise, activate/mobilise, potentiate.
//   - Static holds >60s per muscle before max/explosive work cost force;
//     shorter holds inside a dynamic warm-up don't. Prep stretches ≤30s.
//   - Flexibility gains need daily 2–3 × 30–120s per area. Stretching is not
//     a recovery tool, so Close is about down-regulating, not "recovery".
// ─────────────────────────────────────────────────────────────

const FAMILIES = {
  A1: 'Breath & attention',            A2: 'Somatic reset',
  B1: 'Joint prep',                    B2: 'Squat & ankle mobility',
  B3: 'Wrist & hand',                  B4: 'Shoulder & neck prehab',
  B5: 'Run & sprint drills',           B6: 'Activation & prehab',
  C1: 'Vision',  C2: 'Ball & reaction',  C3: 'Balance',
  C4a: 'Stick balancing',  C4b: 'Stick manipulation',  C5: 'Objects',
  D1: 'Hanging — decompression & scapular',  D2: 'Hanging — swings',
  D3: 'Hanging — grip & pulling strength',   D4: 'Rings',
  D5: 'Handstand & inversion',  D6: 'Arm balances',
  D7: 'Gymnastics conditioning',
  E1: 'Locomotion & ground flow',  E2: 'Floreio',  E3: 'Tumbling',  E4: 'Yoga flow',
  F1: 'Hips, glutes, quads, adductors',  F2: 'Hamstrings',  F3: 'Splits & pancake',
  F4: 'Spine',  F5: 'Shoulders, chest, neck',  F6: 'Lower leg & foot',  F7: 'Loaded stretching',
  G1: 'Supported passive',  G2: 'Self-massage',
};

// ── COORDINATION ROTATION ─────────────────────────────────────
// Six domains. Movement practice (crawls, ground flow, Floreio, tumbling)
// joined on 26 Sep. Heavy/explosive movement items only land on easy days
// (see movementGate), and on a movement day the Mobility block does not draw
// from the movement families, so nothing repeats in one session.
const DOMAIN_FAMILIES = {
  'vision':        ['C1'],
  'ball-reaction': ['C2'],
  'balance':       ['C3'],
  'stick':         ['C4a', 'C4b'],
  'objects':       ['C5'],
  'movement':      ['E1', 'E2', 'E3'],
};
const MOVEMENT_FULL_DAY_TYPES = ['z2-bike', 'z2-run', 'light'];

// ── 1. TAGGING RULES ──────────────────────────────────────────
const Complementary = {

  classifyFamily(e) {
    const c = e.category, s = e.subcategory, id = e.id;
    if (e.family) return e.family;                       // new entries carry their own
    // main-block content → not complementary
    if (c === 'Gym' && ['Strength A', 'Strength B'].includes(s)) return null;
    if (c === 'Cardio' && id !== 'walking') return null;
    if (c === 'Power') return null;
    if (c === 'Gym' && (s === 'Plio A' || s === 'Plio B') && !['shoulder-cars', 'ankle-mobility'].includes(id)) return null;
    if (id === 'hip-thrust') return null;

    if (c === 'Meditation') return 'A1';
    if ((c === 'Somatic' && s === 'Eye Training') || ['saccade-chart', 'gaze-stabilisation', 'ball-eye-patched'].includes(id)) return 'C1';
    if (c === 'Somatic' && s === 'Finite Isolation') return 'B1';
    if (c === 'Somatic') return 'A2';
    if (s === 'CARs' || s === 'Dynamic' || ['shoulder-cars', 'ankle-mobility', 'worlds-greatest-stretch', 'scapula-mobilization-routine'].includes(id)) return 'B1';
    if (s === 'Squat Mobility' || id === 'deep-squat-hold') return 'B2';
    if (c === 'Gym' && s === 'Prehab') return 'B3';
    if (c === 'Gym' && s === 'Accessory') return 'B4';
    if (['Wrist', 'Forearm', 'Hand'].includes(s)) return 'B3';
    if (s === 'Hanging') {
      if (['dead-hang', 'one-arm-passive-hang', 'arch-hang', 'active-hang', 'one-arm-active-hang'].includes(id)) return 'D1';
      if (['brachiation', 'ape-swing', 'front-stationary-swing', 'side-side-stationary-swing'].includes(id)) return 'D2';
      return 'D3';
    }
    if (c === 'Rings') return 'D4';
    if (s === 'Handstand' || s === 'Inversion') return 'D5';
    if (s === 'Arm Balancing') return 'D6';
    if (s === 'Gymnastics Conditioning') return id === 'straddle-fold-passive' ? 'F3' : 'D7';
    if (s === 'Floreio') return 'E2';
    if (s === 'Tumbling') return 'E3';
    if (c === 'Yoga' && s === 'Flow') return 'E4';
    if (['Animal Locomotion', 'Ground Flow', 'Ground', 'Flow'].includes(s) || id === 'walking') return 'E1';
    if (c === 'Object Manipulation' && s === 'Stick Balancing')
      return ['stick-static', 'stick-walking', 'stick-transfer'].includes(id) ? 'C4a' : 'C4b';
    if (s === 'Balance' || s === 'Standing Balance' || id === 'yoga-eagle-pose') return 'C3';
    if (c === 'Object Manipulation' && (s === 'Tennis Ball' || s === 'Reaction')) return 'C2';
    if (c === 'Object Manipulation') return 'C5';
    if (s === 'Self-Massage') return 'G2';
    if (s === 'Loaded Stretch') return 'F7';
    if (['yoga-legs-up-wall', 'yoga-savasana'].includes(id)) return 'G1';
    if (s === 'Splits' || id === 'pancake') return 'F3';
    if (['Hip', 'Glutes', 'Adductor', 'Abductor', 'Hip Opener', 'Quad', 'Kneeling'].includes(s) ||
        ['yoga-pigeon', 'yoga-butterfly', 'yoga-figure-4', 'yoga-happy-baby', 'yoga-cow-face-pose'].includes(id)) return 'F1';
    if (s === 'Hamstring' || ['yoga-seated-forward-fold', 'yoga-head-to-knee-pose'].includes(id)) return 'F2';
    if (['Thoracic', 'Spine', 'Lower Back', 'Upper Back', 'Backbend', 'Seated'].includes(s) ||
        ['yoga-cat-cow', 'yoga-reclined-twist', 'yoga-sphinx', 'yoga-childs-pose', 'yoga-thread-needle'].includes(id)) return 'F4';
    if (['Shoulder', 'Chest', 'Neck'].includes(s)) return 'F5';
    if (['Ankle', 'Calf', 'Foot'].includes(s)) return 'F6';
    return 'UNSORTED';
  },

  _RESTORATIVE: ['yoga-childs-pose', 'yoga-reclined-twist', 'yoga-figure-4', 'yoga-happy-baby', 'yoga-butterfly',
    'yoga-sphinx', 'yoga-thread-needle', 'knee-to-chest-stretch', 'windshield-wipers', 'pelvic-tilt', 'yoga-fish-pose',
    'yoga-seated-forward-fold', 'yoga-pigeon', 'bear-hug-stretch'],

  defaultRoles(e, fam) {
    if (Array.isArray(e.roles) && e.roles.length) return e.roles;
    const id = e.id, t = e.intensityTier;
    switch (fam) {
      case 'A1': if (id === 'trataka' || id === 'visualization') return ['practice'];
                 if (id === 'wim-hof') return ['raise']; return ['downregulate'];
      case 'A2': if (id.startsWith('spinal-waves')) return ['mobilise'];
                 if (['straightjacket-shake', 'tre-tremoring'].includes(id)) return ['downregulate'];
                 if (id === 'feldenkrais') return ['practice', 'downregulate'];
                 if (id === 'pandiculation') return ['mobilise', 'downregulate']; return ['raise'];
      case 'B1': if (id.includes('glide-isolation')) return ['mobilise', 'practice'];
                 if (id === 'worlds-greatest-stretch' || id === 'dynamic-stretches') return ['raise', 'mobilise'];
                 return ['mobilise'];
      case 'B2': return ['mobilise', 'develop'];
      case 'B3': if (['rice-bucket', 'first-knuckle-raises', 'fin-pushups', 'dorsal-pushups'].includes(id)) return ['activate', 'develop'];
                 if (['wrist-prep', 'wrist-circles', 'tendon-glides'].includes(id)) return ['mobilise'];
                 return ['mobilise', 'develop'];
      case 'B4': return ['activate'];
      case 'C1': case 'C2': case 'C3': case 'C4a': case 'C4b': case 'C5': return ['practice'];
      case 'D1': return ['active-hang', 'arch-hang', 'one-arm-active-hang'].includes(id) ? ['activate', 'develop'] : ['develop', 'mobilise'];
      case 'D2': return ['practice', 'raise'];
      case 'D3': return ['develop'];
      case 'D4': if (['ring-hold-support', 'german-hang'].includes(id)) return ['develop'];
                 if (id === 'ring-row') return ['activate', 'develop']; return ['practice', 'develop'];
      case 'D5': return id === 'front-line-drill' ? ['activate', 'practice'] : ['practice'];
      case 'D6': return ['practice'];
      case 'D7': return ['hollow-body-hold', 'arch-body-hold', 'hollow-body-rock'].includes(id) ? ['activate', 'develop'] : ['develop'];
      case 'E1': if (id === 'walking') return ['raise', 'downregulate']; if (id === 'freestyle') return ['practice'];
                 return t === 'light' ? ['raise', 'mobilise', 'practice'] : ['practice'];
      case 'E2': return (t === 'heavy' || t === 'explosive') ? ['practice', 'develop'] : ['practice'];
      case 'E3': return id.startsWith('rolling') ? ['practice', 'mobilise'] : ['practice'];
      case 'E4': return id === 'yoga-sun-salutation-a' ? ['raise', 'mobilise'] : ['mobilise', 'develop'];
      case 'F4': if (id.startsWith('bridge-pushup') || id.includes('bridge-rotations')) return ['develop'];
                 if (id === 'yoga-cat-cow') return ['mobilise', 'downregulate'];
                 // falls through
      case 'F1': case 'F2': case 'F3': case 'F5': case 'F6': {
        if (['ankle-circles', 'chin-tuck', 'bodyweight-good-morning-stretch'].includes(id)) return ['mobilise'];
        const r = ['mobilise', 'develop']; if (this._RESTORATIVE.includes(id)) r.push('downregulate'); return r;
      }
      case 'F7': return ['develop'];
      case 'G1': return ['downregulate'];
      case 'G2': return ['mobilise', 'downregulate'];
    }
    return [];
  },

  movementGate(e, fam) {
    if (!fam || fam[0] !== 'E' || fam === 'E4') return undefined;
    return (e.intensityTier === 'heavy' || e.intensityTier === 'explosive') ? 'easy-days' : 'any-day';
  },

  // Applied once, at load. Leaves modalityTags and intensityTier alone
  // except for two prep drills that were tagged power-plyo and so could be
  // drawn into the plyo Main Focus.
  apply(lib) {
    const counts = {}, unsorted = [];
    const retag = { 'shoulder-cars': ['mobility-movement'], 'ankle-mobility': ['mobility-movement'] };
    for (const e of lib) {
      if (retag[e.id]) e.modalityTags = retag[e.id];
      const fam = this.classifyFamily(e);
      if (!fam) continue;
      if (fam === 'UNSORTED') { unsorted.push(e.id); continue; }
      e.family = fam;
      e.roles = this.defaultRoles(e, fam);
      const gate = this.movementGate(e, fam); if (gate) e.movementGate = gate;
      counts[fam] = (counts[fam] || 0) + 1;
    }
    this.lastApply = { counts, unsorted, tagged: Object.values(counts).reduce((a, b) => a + b, 0) };
    return this.lastApply;
  },

  isUnilateral(ex) {
    if (!ex) return false;
    if (typeof ex.perSide === 'boolean') return ex.perSide;
    if (DOSE_OVERRIDES[ex.id] && typeof DOSE_OVERRIDES[ex.id].perSide === 'boolean') return DOSE_OVERRIDES[ex.id].perSide;
    const s = (ex.name || '') + ' ' + (ex.notes || '');
    return /hip cars|ankle cars|shoulder cars|leg swings|world's greatest|each side|each leg|per side|single[- ]leg|one[- ]arm|one[- ]leg|both sides|90\/90|pigeon|lizard|couch|lunge|half split|figure-4|quad stretch|calf stretch|hurdler|cross-body|sleeper|lateral neck|seated glute|knee-to-opposite|side-lying|cossack|warrior|triangle|side angle|eagle|cow face|head-to-knee|single-leg/i.test(s);
  },

  // ── DOSE ────────────────────────────────────────────────────
  // Returns { sets, reps?, durationSec?, distanceM?, perSide, restSec, text }.
  // `role` is the job the exercise is doing in this block.
  doseFor(ex, role) {
    const fam = ex.family, log = ex.logType, side = this.isUnilateral(ex);
    const d = (o) => ({ perSide: side, restSec: 20, ...o });
    if (ex.dose) return d({ ...ex.dose });               // explicit dose on the entry wins
    if (DOSE_OVERRIDES[ex.id]) return d({ ...DOSE_OVERRIDES[ex.id] });
    if (log === 'cardio') return d({ sets: 1, durationSec: 300, restSec: 0 });
    if (log === 'none')   return d({ sets: 1, durationSec: 120, restSec: 0 });

    switch (role) {
      case 'raise':
        return log === 'hold' ? d({ sets: 2, durationSec: 45 }) : d({ sets: 2, reps: 8 });
      case 'mobilise':
        if (fam === 'B1' || fam === 'A2') return log === 'hold' ? d({ sets: 1, durationSec: 60 }) : d({ sets: 1, reps: 6 });
        return log === 'hold' ? d({ sets: 2, durationSec: 30 }) : d({ sets: 2, reps: 8 });   // ≤30s before work
      case 'activate':
        return log === 'hold' ? d({ sets: 2, durationSec: 25, restSec: 30 }) : d({ sets: 2, reps: 12, restSec: 30 });
      case 'potentiate':
        return d({ sets: 3, reps: log === 'reps' ? 1 : 10, restSec: 45 });
      case 'practice':
        if (['C1', 'C2', 'C3', 'C4a', 'C4b', 'C5', 'E1', 'E2', 'E3'].includes(fam))
          return log === 'hold' ? d({ sets: 4, durationSec: 60, restSec: 30 }) : d({ sets: 4, reps: 4, restSec: 45 });
        return log === 'hold' ? d({ sets: 4, durationSec: 20, restSec: 60 }) : d({ sets: 3, reps: 4, restSec: 90 });
      case 'develop':
        if (['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'B2', 'E4'].includes(fam))
          return log === 'hold' ? d({ sets: 2, durationSec: 75, restSec: 15 }) : d({ sets: 2, reps: 8 });
        return log === 'hold' ? d({ sets: 3, durationSec: 30, restSec: 60 }) : d({ sets: 3, reps: 6, restSec: 90 });
      case 'downregulate':
        if (fam === 'A1' || fam === 'G1') return d({ sets: 1, durationSec: 180, restSec: 0 });
        if (fam === 'G2') return d({ sets: 1, durationSec: 90, restSec: 0 });
        return log === 'hold' ? d({ sets: 1, durationSec: 60, restSec: 0 }) : d({ sets: 1, reps: 8, restSec: 0 });
    }
    return log === 'hold' ? d({ sets: 2, durationSec: 30 }) : d({ sets: 2, reps: 8 });
  },

  // Seconds a dose takes, including rest between sets and both sides.
  doseSeconds(dose) {
    if (!dose) return 0;
    const work = dose.durationSec || (dose.distanceM ? Math.max(15, dose.distanceM / 3) : (dose.reps ? Math.max(20, dose.reps * 4) : 30));
    const sides = dose.perSide ? 2 : 1;
    const sets = dose.sets || 1;
    return sets * work * sides + Math.max(0, sets - 1) * (dose.restSec || 0);
  },

  // Scale a dose so it fills `seconds`, by sets first (1–6), then hold time.
  // Most sets a role may be scaled to. Prep work stays short even when the
  // block has room — leftover minutes are transition time, not more strides.
  MAX_SETS: { raise: 2, mobilise: 3, activate: 3, potentiate: 4, practice: 6, develop: 3, downregulate: 1, open: 3 },

  fitDose(dose, seconds, role) {
    if (!dose || !seconds) return dose;
    const out = { ...dose };
    if (out.label) return out;                           // written doses are not rescaled
    const cap = (role && this.MAX_SETS[role]) || 6;
    const one = this.doseSeconds({ ...out, sets: 1 }) + (out.restSec || 0);
    let sets = Math.round((seconds + (out.restSec || 0)) / Math.max(1, one));
    const singleShot = (out.sets || 1) === 1 && out.durationSec && !out.reps;
    if (singleShot) {
      // one long hold / a breathing block: stretch the time, not the sets
      out.durationSec = Math.max(30, Math.round(seconds / (out.perSide ? 2 : 1) / 15) * 15);
      return out;
    }
    out.sets = Math.max(1, Math.min(cap, sets));
    // Holds that still have room at the set cap get longer, not more
    // numerous — develop holds up to 2 min, practice sets up to 90s.
    if (out.durationSec && out.sets === cap && sets > cap && ['develop', 'practice'].includes(role)) {
      const per = (seconds - (cap - 1) * (out.restSec || 0)) / (cap * (out.perSide ? 2 : 1));
      const ceil = role === 'develop' ? 120 : 90;
      if (per > out.durationSec) out.durationSec = Math.min(ceil, Math.round(per / 15) * 15);
    }
    return out;
  },

  doseText(dose) {
    if (!dose) return '';
    const fmt = s => s >= 60 ? (s % 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s / 60} min`) : `${s}s`;
    const side = dose.perSide ? ' each side' : '';
    let body;
    if (dose.label) return dose.label;
    if (dose.distanceM) body = `${dose.distanceM}m`;
    else if (dose.reps) body = String(dose.reps);
    else if (dose.durationSec) body = fmt(dose.durationSec);
    else body = '';
    if ((dose.sets || 1) === 1 && dose.durationSec && !dose.reps) return fmt(dose.durationSec) + side;
    if ((dose.sets || 1) === 1 && dose.reps && !dose.loadKg) return `${dose.reps} reps${side}`;
    let t = `${dose.sets || 1} × ${body}${side}`;
    if (dose.loadKg != null && dose.loadKg !== '') t += ` @ ${dose.loadKg}kg`;
    if (dose.rpe) t += ` · RPE ${dose.rpe}`;
    return t;
  },
};

// Exercise-specific doses where the role default reads wrong: routines are
// done in rounds, CARs in slow reps, breathing in minutes.
const DOSE_OVERRIDES = {
  'ido-squat-routine-2':          { sets: 1, label: '2 slow rounds', durationSec: 240, restSec: 0 },
  'scapula-mobilization-routine': { sets: 2, reps: 8, restSec: 15 },
  'yoga-sun-salutation-a':        { sets: 1, label: '3–5 rounds', durationSec: 300, restSec: 0 },
  'dynamic-stretches':            { sets: 1, durationSec: 180, restSec: 0 },
  'dynamic-leg-swings':           { sets: 1, reps: 15, restSec: 0, perSide: true, label: '15 front-back + 15 lateral each leg' },
  'dynamic-hip-circles':          { sets: 1, reps: 10, restSec: 0, label: '10 each direction' },
  'dynamic-arm-circles':          { sets: 1, reps: 10, restSec: 0, label: '10 each direction' },
  'worlds-greatest-stretch':      { sets: 1, reps: 5, restSec: 0, perSide: true },
  'hip-cars':                     { sets: 1, reps: 5, restSec: 0, perSide: true },
  'ankle-cars':                   { sets: 1, reps: 8, restSec: 0, perSide: true },
  'shoulder-cars':                { sets: 1, reps: 5, restSec: 0, perSide: true },
  'spine-cars':                   { sets: 1, reps: 3, restSec: 0, perSide: false },
  'wrist-cars':                   { sets: 1, reps: 8, restSec: 0, perSide: false },
  'neck-cars':                    { sets: 1, reps: 3, restSec: 0, perSide: false },
  'ankle-mobility':               { sets: 2, reps: 10, restSec: 0, perSide: true },
  'wrist-prep':                   { sets: 1, durationSec: 120, restSec: 0, perSide: false },
  'tendon-glides':                { sets: 1, durationSec: 60, restSec: 0, perSide: false },
  'yoga-cat-cow':                 { sets: 1, reps: 10, restSec: 0 },
  'bear-crawl':                   { sets: 2, label: '2 × 15m forward and back', durationSec: 40, restSec: 20, perSide: false },
  'crab-walk':                    { sets: 2, label: '2 × 15m', durationSec: 40, restSec: 20, perSide: false },
  'inchworm':                     { sets: 2, reps: 5, restSec: 20, perSide: false },
  'get-up-squat-stand':           { sets: 2, reps: 5, restSec: 20, perSide: false },
  'face-pulls':                   { sets: 2, reps: 15, restSec: 45 },
  'band-pull-aparts':             { sets: 2, reps: 15, restSec: 30 },
  'ext-rotation-bands':           { sets: 2, reps: 12, restSec: 30, perSide: true },
  'first-knuckle-raises':         { sets: 2, durationSec: 20, restSec: 30 },
  'fin-pushups':                  { sets: 2, reps: 8, restSec: 45 },
  'dorsal-pushups':               { sets: 2, reps: 6, restSec: 45 },
  'rice-bucket':                  { sets: 1, durationSec: 120, restSec: 0 },
  'glute-bridge-bw':              { sets: 2, reps: 12, restSec: 30 },
  'banded-lateral-walk':          { sets: 2, reps: 12, restSec: 30, perSide: true, label: '2 × 12 steps each way' },
  'hs-wall-hold':                 { sets: 4, durationSec: 25, restSec: 60, label: '4 × 20–30s chest to wall' },
  'hs-wall-plank':                { sets: 3, durationSec: 30, restSec: 45 },
  'front-line-drill':             { sets: 3, durationSec: 30, restSec: 30 },
  'ring-hold-support':            { sets: 3, durationSec: 20, restSec: 60 },
  'ring-row':                     { sets: 3, reps: 8, restSec: 60 },
  'dead-hang':                    { sets: 3, durationSec: 45, restSec: 45 },
};

// ── 2. NEW EXERCISES ──────────────────────────────────────────
// Library shape. Drills are deliberately NOT tagged power-plyo, so they can
// never be drawn into the plyo Main Focus pool.
const _cx = (id, name, category, subcategory, family, roles, tier, logType, restGroup, equipment, notes, extra = {}) => ({
  id, name, modality: [], category, subcategory,
  modalityTags: extra.modalityTags || ['mobility-movement'],
  difficulty: extra.difficulty || 1, energy: extra.energy || 'Low', segment: extra.segment || 'warmup',
  goals: extra.goals || [], equipment, frequency: '',
  restGroup, intensityTier: tier, logType, notes,
  link: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' drill'),
  defaultState: 'active', family, roles,
  ...(extra.dose ? { dose: extra.dose } : {}),
  ...(typeof extra.perSide === 'boolean' ? { perSide: extra.perSide } : {}),
});

const NEW_COMPLEMENTARY_EXERCISES = [
  // B5 Run & sprint drills
  _cx('a-march', 'A-march', 'Power', 'Run Drills', 'B5', ['mobilise', 'potentiate'], 'light', 'reps', 'prehab', [], 'Tall posture, knee to hip height, foot lands under the hip.', { dose: { sets: 2, distanceM: 20, restSec: 20 } }),
  _cx('a-skip', 'A-skip', 'Power', 'Run Drills', 'B5', ['potentiate'], 'moderate', 'reps', 'prehab', [], 'Rhythmic skip. Drive the knee, strike down under the hip.', { dose: { sets: 3, distanceM: 20, restSec: 30 } }),
  _cx('b-skip', 'B-skip', 'Power', 'Run Drills', 'B5', ['potentiate'], 'moderate', 'reps', 'prehab', [], 'A-skip, then extend the leg and paw it back under you.', { dose: { sets: 2, distanceM: 20, restSec: 30 } }),
  _cx('high-knees', 'High knees', 'Power', 'Run Drills', 'B5', ['raise', 'potentiate'], 'moderate', 'reps', 'prehab', [], 'Fast turnover, short ground contact.', { dose: { sets: 2, distanceM: 15, restSec: 30 } }),
  _cx('butt-kicks', 'Butt kicks', 'Power', 'Run Drills', 'B5', ['raise', 'mobilise'], 'light', 'reps', 'prehab', [], 'Heel to glute, quick and relaxed.', { dose: { sets: 2, distanceM: 15, restSec: 20 } }),
  _cx('carioca', 'Carioca', 'Power', 'Run Drills', 'B5', ['raise', 'mobilise'], 'light', 'reps', 'prehab', [], 'Lateral crossover, let the hips rotate.', { dose: { sets: 2, distanceM: 20, restSec: 20, perSide: true } }),
  _cx('pogo-hops', 'Pogo hops', 'Power', 'Run Drills', 'B5', ['activate', 'potentiate'], 'moderate', 'reps', 'prehab', [], 'Stiff ankles, minimal knee bend, bounce off the balls of the feet.', { dose: { sets: 3, reps: 15, restSec: 30 } }),
  _cx('straight-leg-bound', 'Straight-leg bound', 'Power', 'Run Drills', 'B5', ['potentiate'], 'moderate', 'reps', 'prehab', [], 'Legs straight, pull the ground back under you.', { dose: { sets: 2, distanceM: 20, restSec: 30 } }),
  _cx('strides', 'Strides', 'Power', 'Run Drills', 'B5', ['potentiate'], 'moderate', 'reps', 'prehab', [], 'Build to 80–90% over 60m, float, walk back. Last thing before the main set.', { dose: { sets: 3, distanceM: 60, restSec: 45 } }),
  // B6 Activation
  _cx('glute-bridge-bw', 'Glute bridge (bodyweight)', 'Body Movement', 'Activation', 'B6', ['activate'], 'light', 'reps', 'prehab', [], 'Tilt the pelvis back first, then drive through the heels. 2s squeeze at the top.'),
  _cx('banded-lateral-walk', 'Banded lateral walk', 'Body Movement', 'Activation', 'B6', ['activate'], 'light', 'reps', 'prehab', ['Rubber bands'], 'Band above the knees, stay low, toes forward.', { perSide: true }),
  _cx('dead-bug', 'Dead bug', 'Body Movement', 'Activation', 'B6', ['activate'], 'light', 'reps', 'prehab', [], 'Low back pinned. Exhale as the opposite arm and leg lower.', { dose: { sets: 2, reps: 8, restSec: 30, perSide: true } }),
  _cx('bird-dog', 'Bird dog', 'Body Movement', 'Activation', 'B6', ['activate'], 'light', 'reps', 'prehab', [], 'Reach long, hips level, 2s hold at the end.', { dose: { sets: 2, reps: 8, restSec: 30, perSide: true } }),
  _cx('copenhagen-plank', 'Copenhagen plank', 'Body Movement', 'Activation', 'B6', ['activate', 'develop'], 'moderate', 'hold', 'prehab', ['Bench'], 'Top leg on a bench, lift the hips. Short-lever (knee) version first.', { dose: { sets: 2, durationSec: 20, restSec: 30, perSide: true } }),
  _cx('scap-pushups', 'Scapular push-ups', 'Body Movement', 'Activation', 'B6', ['activate'], 'light', 'reps', 'prehab', [], 'Arms locked. Move only the shoulder blades: protract, retract.', { dose: { sets: 2, reps: 10, restSec: 30 } }),
  _cx('tibialis-raise', 'Tibialis raise', 'Body Movement', 'Activation', 'B6', ['activate', 'develop'], 'light', 'reps', 'prehab', ['Wall'], 'Back to the wall, heels forward, lift the toes. Shin health for running.', { dose: { sets: 2, reps: 15, restSec: 30 } }),
  _cx('calf-raise-iso', 'Calf raise — isometric hold', 'Body Movement', 'Activation', 'B6', ['activate'], 'light', 'hold', 'prehab', [], 'Single leg, mid-range hold. Before runs and jumps.', { dose: { sets: 2, durationSec: 30, restSec: 20, perSide: true } }),
  // Muscle-up prep
  _cx('scap-pullups', 'Scapular pull-ups', 'Body Movement', 'Hanging', 'D3', ['activate', 'develop'], 'light', 'reps', 'skill', ['Rack'], 'From a dead hang, depress and retract without bending the elbows. 1s hold at the top.', { modalityTags: ['calisthenics'], dose: { sets: 3, reps: 8, restSec: 60 }, segment: 'skill' }),
  _cx('false-grip-hang', 'False grip hang', 'Rings', 'Holds', 'D4', ['develop'], 'moderate', 'hold', 'rings', ['Rings'], 'Wrist over the ring, heel of the palm on top. Ladder: 30s by 11 Oct, 45s by 15 Nov.', { modalityTags: ['calisthenics'], goals: ['ring-muscle-up'], dose: { sets: 3, durationSec: 20, restSec: 60 }, segment: 'skill', energy: 'Med' }),
  _cx('false-grip-ring-row', 'False grip ring row', 'Rings', 'Pulling', 'D4', ['activate', 'develop'], 'moderate', 'reps', 'rings', ['Rings'], 'Keep the false grip through the whole row. Pull to the lower ribs.', { modalityTags: ['calisthenics'], goals: ['ring-muscle-up'], dose: { sets: 3, reps: 6, restSec: 75 }, segment: 'skill', energy: 'Med' }),
  _cx('explosive-pullup', 'Explosive / chest-to-bar pull-up', 'Rings', 'Pulling', 'D4', ['practice', 'develop'], 'explosive', 'reps', 'rings', ['Rack'], 'Pull as fast and high as possible, chest to bar. Low reps, full rest.', { modalityTags: ['calisthenics'], goals: ['ring-muscle-up'], dose: { sets: 4, reps: 2, restSec: 90 }, segment: 'skill', energy: 'High' }),
  _cx('straight-bar-dip', 'Straight bar dip', 'Rings', 'Pushing', 'D4', ['develop'], 'moderate', 'reps', 'rings', ['Rack'], 'The top half of the muscle-up. Lean forward over the bar.', { modalityTags: ['calisthenics'], goals: ['ring-muscle-up'], dose: { sets: 3, reps: 6, restSec: 90 }, segment: 'skill', energy: 'Med' }),
  _cx('russian-dip', 'Russian dip', 'Rings', 'Pushing', 'D4', ['develop'], 'moderate', 'reps', 'rings', ['Dip bars'], 'Drop to the forearms on the bars and press back up. Builds the transition position.', { modalityTags: ['calisthenics'], goals: ['ring-muscle-up'], dose: { sets: 3, reps: 5, restSec: 90 }, segment: 'skill', energy: 'Med' }),
  _cx('banded-mu-transition', 'Banded muscle-up transition', 'Rings', 'Skill', 'D4', ['practice'], 'moderate', 'reps', 'rings', ['Rings', 'Rubber bands'], 'Low rings, feet down or a band. Rehearse pull, turnover, support.', { modalityTags: ['calisthenics'], goals: ['ring-muscle-up'], dose: { sets: 3, reps: 4, restSec: 90 }, segment: 'skill', energy: 'Med' }),
  // Handstand prep
  _cx('wall-walk', 'Wall walk', 'Body Movement', 'Handstand', 'D5', ['practice', 'develop'], 'moderate', 'reps', 'skill', ['Wall'], 'From plank, walk the feet up and the hands in. Stop where you control it.', { modalityTags: ['calisthenics'], goals: ['handstand'], dose: { sets: 3, reps: 2, restSec: 60 }, segment: 'skill', energy: 'Med' }),
  _cx('wall-shoulder-taps', 'Handstand — wall shoulder taps', 'Body Movement', 'Handstand', 'D5', ['practice', 'develop'], 'moderate', 'reps', 'skill', ['Wall'], 'Chest to wall, shift and tap one shoulder at a time.', { modalityTags: ['calisthenics'], goals: ['handstand'], dose: { sets: 3, reps: 6, restSec: 60 }, segment: 'skill', energy: 'Med' }),
  _cx('pike-pushup', 'Pike push-up', 'Body Movement', 'Handstand', 'D5', ['develop'], 'moderate', 'reps', 'skill', [], 'Hips high, head to a tripod point ahead of the hands. Feet on a box to progress.', { modalityTags: ['calisthenics'], goals: ['handstand'], dose: { sets: 3, reps: 6, restSec: 75 }, segment: 'skill', energy: 'Med' }),
  _cx('hs-kick-up', 'Handstand — kick-up practice', 'Body Movement', 'Handstand', 'D5', ['practice'], 'moderate', 'reps', 'skill', [], 'Small kicks to find balance, not max height. Learn the cartwheel bail first.', { modalityTags: ['calisthenics'], goals: ['handstand'], dose: { sets: 2, reps: 6, restSec: 45, perSide: true }, segment: 'skill', energy: 'Med' }),
  // Breath
  _cx('physiological-sigh', 'Physiological sigh', 'Meditation', 'Breathwork', 'A1', ['downregulate'], 'flexibility', 'hold', 'meditation', [], 'Double inhale through the nose, long slow exhale through the mouth.', { modalityTags: [], segment: 'cooldown', dose: { sets: 1, durationSec: 120, restSec: 0 } }),
  _cx('extended-exhale', 'Extended-exhale breathing (4–8)', 'Meditation', 'Breathwork', 'A1', ['downregulate'], 'flexibility', 'hold', 'meditation', [], 'Inhale 4, exhale 8, nose only.', { modalityTags: [], segment: 'cooldown', dose: { sets: 1, durationSec: 180, restSec: 0 } }),
];

const NEW_COMPLEMENTARY_TAGS = {
  'a-march':             { joints: ['hip', 'ankle'], impact: 'low',    pattern: 'locomotion', raisesHR: true,  muscle: null },
  'a-skip':              { joints: ['hip', 'ankle'], impact: 'moderate', pattern: 'locomotion', raisesHR: true,  muscle: null },
  'b-skip':              { joints: ['hip', 'ankle'], impact: 'moderate', pattern: 'locomotion', raisesHR: true,  muscle: null },
  'high-knees':          { joints: ['hip', 'ankle'], impact: 'moderate', pattern: 'locomotion', raisesHR: true,  muscle: null },
  'butt-kicks':          { joints: ['knee', 'ankle'], impact: 'low',   pattern: 'locomotion', raisesHR: true,  muscle: null },
  'carioca':             { joints: ['hip', 'ankle'], impact: 'low',    pattern: 'locomotion', raisesHR: true,  muscle: null },
  'pogo-hops':           { joints: ['ankle'],        impact: 'moderate', pattern: 'other',      raisesHR: true,  muscle: 'calves' },
  'straight-leg-bound':  { joints: ['hip', 'ankle'], impact: 'moderate', pattern: 'locomotion', raisesHR: true,  muscle: 'hamstrings' },
  'strides':             { joints: ['hip', 'knee', 'ankle'], impact: 'moderate', pattern: 'locomotion', raisesHR: true, muscle: null },
  'glute-bridge-bw':     { joints: ['hip'],          impact: 'low',    pattern: 'hinge',      raisesHR: false, muscle: 'glutes' },
  'banded-lateral-walk': { joints: ['hip'],          impact: 'low',    pattern: 'other',      raisesHR: false, muscle: 'glutes' },
  'dead-bug':            { joints: [],               impact: 'low',    pattern: 'isometric',  raisesHR: false, muscle: 'core' },
  'bird-dog':            { joints: ['back'],         impact: 'low',    pattern: 'isometric',  raisesHR: false, muscle: 'core' },
  'copenhagen-plank':    { joints: ['hip', 'knee'],  impact: 'low',    pattern: 'isometric',  raisesHR: false, muscle: 'core' },
  'scap-pushups':        { joints: ['shoulder', 'wrist'], impact: 'low', pattern: 'push',     raisesHR: false, muscle: 'shoulders' },
  'tibialis-raise':      { joints: ['ankle'],        impact: 'low',    pattern: 'other',      raisesHR: false, muscle: 'calves' },
  'calf-raise-iso':      { joints: ['ankle'],        impact: 'low',    pattern: 'isometric',  raisesHR: false, muscle: 'calves' },
  'scap-pullups':        { joints: ['shoulder'],     impact: 'low',    pattern: 'pull',       raisesHR: false, muscle: 'back' },
  'false-grip-hang':     { joints: ['wrist', 'elbow', 'shoulder'], impact: 'low', pattern: 'isometric', raisesHR: false, muscle: 'forearms' },
  'false-grip-ring-row': { joints: ['wrist', 'elbow', 'shoulder'], impact: 'low', pattern: 'pull',      raisesHR: false, muscle: 'back' },
  'explosive-pullup':    { joints: ['elbow', 'shoulder'], impact: 'moderate', pattern: 'pull',  raisesHR: true,  muscle: 'back' },
  'straight-bar-dip':    { joints: ['wrist', 'elbow', 'shoulder'], impact: 'low', pattern: 'push',      raisesHR: false, muscle: 'triceps' },
  'russian-dip':         { joints: ['elbow', 'shoulder'], impact: 'low', pattern: 'push',     raisesHR: false, muscle: 'triceps' },
  'banded-mu-transition':{ joints: ['wrist', 'elbow', 'shoulder'], impact: 'low', pattern: 'pull',      raisesHR: false, muscle: 'back' },
  'wall-walk':           { joints: ['wrist', 'shoulder'], impact: 'low', pattern: 'push',     raisesHR: true,  muscle: 'shoulders' },
  'wall-shoulder-taps':  { joints: ['wrist', 'shoulder'], impact: 'low', pattern: 'balance',  raisesHR: false, muscle: 'shoulders' },
  'pike-pushup':         { joints: ['wrist', 'shoulder', 'elbow'], impact: 'low', pattern: 'push',      raisesHR: false, muscle: 'shoulders' },
  'hs-kick-up':          { joints: ['wrist', 'shoulder'], impact: 'low', pattern: 'balance',  raisesHR: false, muscle: 'shoulders' },
  'physiological-sigh':  { joints: [], impact: 'low', pattern: 'isometric', raisesHR: false, muscle: null },
  'extended-exhale':     { joints: [], impact: 'low', pattern: 'isometric', raisesHR: false, muscle: null },
};

// ── 2b. BATCH 2 (26 Sep, Instagram intake) ─────────────────────
// Source: claude/library-intake.md. Sit-through, crawls and rolls were
// already in the library, so they are not repeated here.
const _EDGE = 'On a floor line, a low curb or a 2×4. Arms out.';

const NEW_COMPLEMENTARY_BATCH2 = [
  // B5 Run & sprint drills
  _cx('wall-accel-drill', 'Wall acceleration drill', 'Power', 'Run Drills', 'B5', ['activate', 'potentiate'], 'moderate', 'reps', 'prehab', ['Wall'],
    'Hands on a wall or post, body at ~45°, straight line ankle to head. Marches → single switches → triple switches. Variant: hold the drive position and push into the wall at full intent for 3–5s (overcoming isometric). Variant: band around the hips anchored behind.',
    { dose: { sets: 3, reps: 5, restSec: 45, perSide: true } }),
  _cx('mini-hurdle-hops', 'Mini-hurdle hops', 'Power', 'Run Drills', 'B5', ['potentiate'], 'moderate', 'reps', 'prehab', ['Mini hurdles'],
    '6–8 low hurdles or floor lines. Quick, stiff contacts, knees up. Two feet first, single leg later. Full rest.',
    { dose: { sets: 3, reps: 8, restSec: 60 } }),
  _cx('snap-down-stick', 'Snap-down to stick landing', 'Power', 'Run Drills', 'B5', ['activate', 'potentiate'], 'moderate', 'reps', 'prehab', [],
    'Rise onto the toes, arms up, snap down into an athletic landing: hips back, knees over toes, stick 2s. Progress to drop landings off a low box. Deceleration prep.',
    { dose: { sets: 2, reps: 5, restSec: 45 } }),

  // B6 Activation & prehab
  _cx('split-squat-iso', 'Split squat isometric hold (rear foot elevated)', 'Body Movement', 'Activation', 'B6', ['activate', 'develop', 'mobilise'], 'moderate', 'hold', 'prehab', ['Bench'],
    'Back foot on a bench, front knee ~90°, back knee just off the floor, torso tall. Develop: 3 × 30–45s per side. Short holds also open the back hip flexor.',
    { dose: { sets: 2, durationSec: 25, restSec: 30, perSide: true } }),
  _cx('spanish-squat', 'Spanish squat / wall sit', 'Body Movement', 'Activation', 'B6', ['activate', 'develop'], 'moderate', 'hold', 'prehab', ['Rubber bands'],
    'Heavy band behind the knees anchored in front (or back against a wall), shins vertical, sit to 70–90° knee bend. Loads the knee tendon for running and jumping.',
    { dose: { sets: 3, durationSec: 40, restSec: 60 } }),
  _cx('nordic-curl', 'Nordic hamstring curl', 'Body Movement', 'Activation', 'B6', ['develop'], 'heavy', 'reps', 'prehab', [],
    'Heels anchored, kneel tall, lower forward as slowly as possible, catch with the hands, push back up. Start band-assisted or partial range. Not the day before sprints; expect soreness the first two weeks.',
    { dose: { sets: 2, reps: 4, restSec: 120 }, energy: 'Med', difficulty: 3 }),

  // C3 Balance: edge progression (vestibular → proprioceptive → visual → integration)
  _cx('edge-walk-head-tilt', 'Edge walk — head tilts', 'Body Movement', 'Balance', 'C3', ['practice'], 'light', 'reps', 'skill', [],
    `${_EDGE} Slow heel-to-toe walk, tilting the head ear to shoulder. Vestibular: head tilt tolerance.`, { dose: { sets: 3, distanceM: 5, restSec: 20 } }),
  _cx('edge-walk-turning', 'Edge walk — turns', 'Body Movement', 'Balance', 'C3', ['practice'], 'light', 'reps', 'skill', [],
    `${_EDGE} Walk the edge and turn around mid-walk: 180°, then 360°. Vestibular: rotational acceleration.`, { dose: { sets: 3, distanceM: 5, restSec: 20 } }),
  _cx('edge-sl-eyes-closed-taps', 'Edge single-leg balance — eyes closed, taps', 'Body Movement', 'Balance', 'C3', ['practice', 'activate'], 'light', 'reps', 'skill', [],
    `${_EDGE} Single leg on the edge, eyes closed, free foot taps forward and to the side. Proprioception.`, { dose: { sets: 2, reps: 8, restSec: 20, perSide: true } }),
  _cx('edge-squat-eyes-closed', 'Edge squat — eyes closed', 'Body Movement', 'Balance', 'C3', ['practice', 'mobilise'], 'light', 'reps', 'skill', [],
    `${_EDGE} Both feet on the line, eyes closed, lower slowly to a full squat and stand. Proprioception through range.`, { dose: { sets: 2, reps: 5, restSec: 30 } }),
  _cx('edge-sl-gaze-shifts', 'Edge single-leg balance — gaze shifts', 'Body Movement', 'Balance', 'C3', ['practice'], 'light', 'hold', 'skill', [],
    `${_EDGE} Single leg, head still, eyes jump up/down, then left/right. Visual: saccades under balance load.`, { dose: { sets: 2, durationSec: 30, restSec: 20, perSide: true } }),
  _cx('edge-walk-ball-bounce', 'Edge walk — ball bounce', 'Body Movement', 'Balance', 'C3', ['practice'], 'light', 'reps', 'skill', ['Tennis ball'],
    `${_EDGE} Walk the edge while bouncing a ball, dropping into low lunges to bounce it near the floor. Integration: divided attention.`, { dose: { sets: 3, distanceM: 5, restSec: 20 } }),

  // D4 Muscle-up prep
  _cx('low-bar-drill', 'Low bar drill (muscle-up hip drive)', 'Rings', 'Skill', 'D4', ['practice'], 'moderate', 'reps', 'skill', ['Rack'],
    'Bar at chest-to-hip height, feet on the floor. Drive the hips up into the bar and turn over into support with as little arm pull as possible. Fixes muscling over the bar instead of using the hips.',
    { modalityTags: ['calisthenics'], goals: ['ring-muscle-up'], dose: { sets: 3, reps: 4, restSec: 90 }, segment: 'skill', energy: 'Med' }),

  // D6 Arm balances
  _cx('turtle-hold', 'Turtle hold', 'Body Movement', 'Arm Balancing', 'D6', ['practice', 'develop'], 'heavy', 'hold', 'skill', [],
    'Low bent-arm balance: elbows under the hips, body horizontal, knees bent, feet off the floor. Between frog stand and planche-type holds.',
    { modalityTags: ['calisthenics'], dose: { sets: 5, durationSec: 8, restSec: 45 }, segment: 'skill', energy: 'Med', difficulty: 3 }),

  // D7 Gymnastics conditioning
  _cx('slingshot-rebound-plank', 'Slingshot rebound plank', 'Body Movement', 'Gymnastics Conditioning', 'D7', ['activate', 'potentiate'], 'moderate', 'reps', 'skill', [],
    "From child's pose, shoot forward into a plank and rebound back. Reactive shoulders and core. Before handstand or push work.",
    { modalityTags: ['calisthenics'], dose: { sets: 2, reps: 8, restSec: 45 } }),

  // E1 Locomotion & ground flow (wrestling flow)
  _cx('sprawl', 'Sprawl', 'Body Movement', 'Ground Flow', 'E1', ['raise', 'potentiate'], 'moderate', 'reps', 'skill', [],
    'From an athletic stance, shoot the legs back and drop the hips to the floor, chest up, then snap back to stance.', { dose: { sets: 3, reps: 6, restSec: 45 } }),
  _cx('level-change-step', 'Level change / penetration step', 'Body Movement', 'Ground Flow', 'E1', ['practice'], 'moderate', 'reps', 'skill', [],
    'From stance, drop the hips and step deep, lead knee to the floor, back straight, then drive up and forward.', { dose: { sets: 2, reps: 6, restSec: 45, perSide: true } }),
  _cx('donkey-kicks', 'Donkey kicks', 'Body Movement', 'Ground Flow', 'E1', ['raise', 'practice'], 'light', 'reps', 'skill', [],
    'Hands planted, kick the hips and legs up behind you, land softly on the feet. Handstand entry prep.', { dose: { sets: 2, reps: 8, restSec: 30 } }),

  // E2 Floreio
  _cx('two-limbs-negativa', 'Two-limbs negativa', 'Body Movement', 'Floreio', 'E2', ['practice'], 'moderate', 'hold', 'skill', [],
    'Negativa supported on one hand and one foot, hips lifted, other leg extended. Switch sides.', { dose: { sets: 3, durationSec: 5, restSec: 30, perSide: true } }),
  _cx('wheel-whip', 'Wheel whip', 'Body Movement', 'Floreio', 'E2', ['practice'], 'explosive', 'reps', 'skill', [],
    'Cartwheel-type pass through handstand with the legs whipping over. Needs a solid cartwheel first.', { dose: { sets: 4, reps: 3, restSec: 60, perSide: true }, energy: 'High', difficulty: 4 }),

  // E3 Tumbling
  _cx('breakfalls', 'Breakfalls (side / back)', 'Body Movement', 'Tumbling', 'E3', ['practice'], 'light', 'reps', 'skill', [],
    'Chin tucked, round the back, slap the floor with the arm(s) at ~45° as you land. From sitting, then squatting, then standing.', { dose: { sets: 2, reps: 5, restSec: 30, perSide: true } }),
  _cx('back-arch-to-bridge', 'Standing back arch into bridge', 'Body Movement', 'Tumbling', 'E3', ['practice'], 'heavy', 'reps', 'skill', [],
    'From standing, hips forward, arch back and lower the hands to the floor into a bridge. Learn with a wall walk-down or a spotter first.', { dose: { sets: 3, reps: 2, restSec: 60 }, energy: 'Med', difficulty: 4 }),
];

const NEW_COMPLEMENTARY_TAGS_BATCH2 = {
  'wall-accel-drill':          { joints: ['hip', 'ankle'], impact: 'low', pattern: 'isometric', raisesHR: true, muscle: 'glutes' },
  'mini-hurdle-hops':          { joints: ['ankle', 'knee'], impact: 'moderate', pattern: 'other', raisesHR: true, muscle: null },
  'snap-down-stick':           { joints: ['hip', 'knee', 'ankle'], impact: 'moderate', pattern: 'squat', raisesHR: false, muscle: 'quads' },
  'split-squat-iso':           { joints: ['hip', 'knee'], impact: 'low', pattern: 'isometric', raisesHR: false, muscle: 'quads' },
  'spanish-squat':             { joints: ['knee'], impact: 'low', pattern: 'isometric', raisesHR: false, muscle: 'quads' },
  'nordic-curl':               { joints: ['knee'], impact: 'low', pattern: 'hinge', raisesHR: false, muscle: 'hamstrings' },
  'edge-walk-head-tilt':       { joints: ['ankle', 'neck'], impact: 'low', pattern: 'balance', raisesHR: false, muscle: null },
  'edge-walk-turning':         { joints: ['ankle'], impact: 'low', pattern: 'balance', raisesHR: false, muscle: null },
  'edge-sl-eyes-closed-taps':  { joints: ['ankle', 'hip'], impact: 'low', pattern: 'balance', raisesHR: false, muscle: null },
  'edge-squat-eyes-closed':    { joints: ['ankle', 'knee', 'hip'], impact: 'low', pattern: 'balance', raisesHR: false, muscle: null },
  'edge-sl-gaze-shifts':       { joints: ['ankle'], impact: 'low', pattern: 'balance', raisesHR: false, muscle: null },
  'edge-walk-ball-bounce':     { joints: ['ankle', 'wrist'], impact: 'low', pattern: 'balance', raisesHR: false, muscle: null },
  'low-bar-drill':             { joints: ['wrist', 'elbow', 'shoulder', 'hip'], impact: 'low', pattern: 'skill', raisesHR: false, muscle: 'back' },
  'turtle-hold':               { joints: ['wrist', 'elbow', 'shoulder'], impact: 'low', pattern: 'balance', raisesHR: false, muscle: 'shoulders' },
  'slingshot-rebound-plank':   { joints: ['wrist', 'shoulder'], impact: 'moderate', pattern: 'push', raisesHR: true, muscle: 'core' },
  'sprawl':                    { joints: ['hip', 'wrist', 'shoulder'], impact: 'moderate', pattern: 'flow', raisesHR: true, muscle: 'core' },
  'level-change-step':         { joints: ['knee', 'hip'], impact: 'moderate', pattern: 'flow', raisesHR: true, muscle: 'quads' },
  'donkey-kicks':              { joints: ['wrist', 'shoulder'], impact: 'moderate', pattern: 'flow', raisesHR: true, muscle: 'shoulders' },
  'two-limbs-negativa':        { joints: ['wrist', 'shoulder', 'hip'], impact: 'low', pattern: 'skill', raisesHR: false, muscle: 'core' },
  'wheel-whip':                { joints: ['wrist', 'shoulder'], impact: 'high', pattern: 'skill', raisesHR: true, muscle: 'shoulders' },
  'breakfalls':                { joints: ['back', 'shoulder', 'neck'], impact: 'moderate', pattern: 'skill', raisesHR: false, muscle: null },
  'back-arch-to-bridge':       { joints: ['back', 'wrist', 'shoulder'], impact: 'moderate', pattern: 'skill', raisesHR: false, muscle: null },
};

NEW_COMPLEMENTARY_EXERCISES.push(...NEW_COMPLEMENTARY_BATCH2);
Object.assign(NEW_COMPLEMENTARY_TAGS, NEW_COMPLEMENTARY_TAGS_BATCH2);

// Register: append the new entries (skipping any id that already exists,
// so a later hand-written library entry wins), then tag everything.
(function registerComplementary() {
  if (typeof LIBRARY === 'undefined') return;
  const have = new Set(LIBRARY.map(e => e.id));
  NEW_COMPLEMENTARY_EXERCISES.forEach(e => { if (!have.has(e.id)) LIBRARY.push(e); });
  if (typeof EXERCISE_TAGS !== 'undefined') {
    Object.entries(NEW_COMPLEMENTARY_TAGS).forEach(([id, t]) => { if (!EXERCISE_TAGS[id]) EXERCISE_TAGS[id] = t; });
  }
  Complementary.apply(LIBRARY);
})();

// ── 3. RECIPES ────────────────────────────────────────────────
// A recipe is an ordered list of steps. Each step picks `n` exercises from
// its candidate `ids` (least-recently-done first) and doses them for `role`.
// Order is the order they are done in. Candidate lists are curated per day
// type, so the Mobility block before squats looks after ankles and hips and
// the one before sprints is dynamic only.

// Open: four fixed slots, the variant follows the day.
const OPEN_VARIANTS = {
  'strength-a':   [{ id: 'active-hang',           dose: { sets: 3, durationSec: 30, restSec: 30 } },
                   { id: 'spinal-waves-standing', dose: { sets: 2, reps: 8, restSec: 15 } },
                   { id: 'squat-knee-pump',       dose: { sets: 2, reps: 6, restSec: 15, perSide: true } },
                   { id: 'vertical-shake',        dose: { sets: 1, durationSec: 120, restSec: 0 } }],
  'z2-bike':      [{ id: 'dead-hang',             dose: { sets: 3, durationSec: 45, restSec: 45 } },
                   { id: 'spinal-waves-floor',    dose: { sets: 2, reps: 8, restSec: 15 } },
                   { id: 'deep-squat-hold',       dose: { sets: 2, durationSec: 60, restSec: 20 } },
                   { id: 'pandiculation',         dose: { sets: 1, durationSec: 120, restSec: 0 } }],
  'plyo-power':   [{ id: 'arch-hang',             dose: { sets: 3, durationSec: 20, restSec: 30 } },
                   { id: 'spinal-waves-standing', dose: { sets: 2, reps: 8, restSec: 15 } },
                   { id: 'squat-heel-raise-toe-stretch', dose: { sets: 2, durationSec: 30, restSec: 15, perSide: true } },
                   { id: 'vertical-shake',        dose: { sets: 1, durationSec: 120, restSec: 0 } }],
  'z2-run':       [{ id: 'dead-hang',             dose: { sets: 3, durationSec: 45, restSec: 45 } },
                   { id: 'yoga-cat-cow',          dose: { sets: 1, reps: 10, restSec: 0 } },
                   { id: 'deep-squat-hold',       dose: { sets: 2, durationSec: 60, restSec: 20 } },
                   { id: 'body-tapping',          dose: { sets: 1, durationSec: 120, restSec: 0 } }],
  'strength-b':   [{ id: 'active-hang',           dose: { sets: 2, durationSec: 20, restSec: 30 } },
                   { id: 'spine-cars',            dose: { sets: 1, reps: 3, restSec: 0 } },
                   { id: 'yoga-garland-pose',     dose: { sets: 2, durationSec: 45, restSec: 15 } },
                   { id: 'vertical-shake',        dose: { sets: 1, durationSec: 120, restSec: 0 } }],
  'quality-run':  [{ id: 'dead-hang',             dose: { sets: 3, durationSec: 30, restSec: 30 } },
                   { id: 'spinal-waves-standing', dose: { sets: 2, reps: 8, restSec: 15 } },
                   { id: 'squat-knee-rotation-hold', dose: { sets: 2, durationSec: 30, restSec: 15, perSide: true } },
                   { id: 'pandiculation',         dose: { sets: 1, durationSec: 120, restSec: 0 } }],
  // Test day: the max dead hang comes after the run, so Open hangs actively and short.
  'aerobic-test': [{ id: 'active-hang',           dose: { sets: 2, durationSec: 20, restSec: 30 } },
                   { id: 'spinal-waves-standing', dose: { sets: 2, reps: 8, restSec: 15 } },
                   { id: 'deep-squat-hold',       dose: { sets: 2, durationSec: 45, restSec: 15 } },
                   { id: 'vertical-shake',        dose: { sets: 1, durationSec: 120, restSec: 0 } }],
  'light':        [{ id: 'active-hang',           dose: { sets: 3, durationSec: 30, restSec: 30 } },
                   { id: 'spinal-waves-floor',    dose: { sets: 3, reps: 8, restSec: 15 } },
                   { id: 'deep-squat-hold',       dose: { sets: 3, durationSec: 60, restSec: 20 } },
                   { id: 'tre-tremoring',         dose: { sets: 1, durationSec: 180, restSec: 0 } }],
};

// Short aliases so recipes stay readable.
const _RUN_PREP = [
  { role: 'raise',      n: 1, ids: ['butt-kicks', 'carioca', 'high-knees'] },
  { role: 'mobilise',   n: 2, ids: ['dynamic-leg-swings', 'worlds-greatest-stretch', 'dynamic-hip-circles', 'ankle-mobility', 'ankle-cars'] },
  { role: 'activate',   n: 1, ids: ['calf-raise-iso', 'tibialis-raise', 'glute-bridge-bw', 'banded-lateral-walk'] },
];

const MOBILITY_RECIPES = {
  // Squat + incline bench + pull-ups. Prep: nothing held over 30s.
  'strength-a': { mode: 'prep', steps: [
    { role: 'raise',    n: 1, ids: ['bear-crawl', 'inchworm', 'get-up-squat-stand', 'worlds-greatest-stretch'] },
    { role: 'mobilise', n: 2, ids: ['hip-cars', 'ankle-cars', 'spine-cars', 'shoulder-cars'] },
    { role: 'mobilise', n: 1, ids: ['ido-squat-routine-2', 'knee-over-toe-stretch', 'ankle-dorsiflexion', 'squat-knee-rotation-hold'] },
    { role: 'mobilise', n: 1, ids: ['scapula-mobilization-routine', 'chest-doorway-stretch', 'yoga-thread-needle', 'shoulder-overhead-stretch'] },
    { role: 'activate', n: 1, ids: ['glute-bridge-bw', 'dead-bug', 'scap-pushups', 'banded-lateral-walk'] },
  ] },
  // Deadlift + overhead press + row + dips.
  'strength-b': { mode: 'prep', steps: [
    { role: 'raise',    n: 1, ids: ['inchworm', 'bear-crawl', 'crab-walk', 'worlds-greatest-stretch'] },
    { role: 'mobilise', n: 2, ids: ['hip-cars', 'spine-cars', 'shoulder-cars', 'wrist-cars'] },
    { role: 'mobilise', n: 1, ids: ['bodyweight-good-morning-stretch', 'hamstring-pike', 'single-leg-hamstring-stretch', 'hip-90-90-stretch'] },
    { role: 'mobilise', n: 1, ids: ['shoulder-overhead-stretch', 'scapula-mobilization-routine', 'yoga-thread-needle', 'bear-hug-stretch'] },
    { role: 'activate', n: 1, ids: ['glute-bridge-bw', 'bird-dog', 'dead-bug', 'scap-pushups'] },
  ] },
  // Sprints, jumps, throws. Dynamic only, then drills, strides last.
  'plyo-power': { mode: 'prep', steps: [
    ..._RUN_PREP,
    { role: 'potentiate', n: 2, ids: ['a-skip', 'b-skip', 'straight-leg-bound', 'a-march'] },
    { role: 'potentiate', n: 1, ids: ['pogo-hops'] },
    { role: 'potentiate', n: 1, ids: ['strides'] },
  ] },
  'quality-run': { mode: 'prep', steps: [
    ..._RUN_PREP,
    { role: 'potentiate', n: 1, ids: ['a-skip', 'a-march', 'high-knees'] },
    { role: 'potentiate', n: 1, ids: ['strides'] },
  ] },
  'aerobic-test': { mode: 'prep', steps: [ ..._RUN_PREP ] },
  // Easy aerobic days: nothing explosive follows, so this is where range is
  // built — long holds, 2 × 60–90s.
  'z2-bike': { mode: 'develop', steps: [
    { role: 'develop',  n: 1, ids: ['bridge', 'yoga-sphinx', 'yoga-cobra', 'low-bridge-rotations'] },
    { role: 'develop',  n: 1, ids: ['shoulder-overhead-stretch', 'chest-doorway-stretch', 'sleeper-stretch', 'yoga-thread-needle'] },
    { role: 'develop',  n: 1, ids: ['yoga-seated-twist', 'yoga-reclined-twist', 'windshield-wipers'] },
    { role: 'develop',  n: 1, ids: ['hip-90-90-stretch', 'yoga-pigeon', 'couch-stretch', 'frog-stretch'] },
  ] },
  'z2-run': { mode: 'develop', steps: [
    { role: 'develop',  n: 1, ids: ['hip-90-90-stretch', 'yoga-pigeon', 'frog-stretch', 'yoga-lizard-pose'] },
    { role: 'develop',  n: 1, ids: ['half-split-stretch', 'single-leg-hamstring-stretch', 'hurdler-stretch', 'hamstring-pnf'] },
    { role: 'develop',  n: 1, ids: ['couch-stretch', 'runners-lunge-stretch', 'standing-quad-stretch'] },
    { role: 'mobilise', n: 1, ids: ['dynamic-leg-swings', 'ankle-cars', 'worlds-greatest-stretch'] },
  ] },
  'light': { mode: 'develop', steps: [
    { role: 'raise',    n: 1, ids: ['yoga-sun-salutation-a'] },
    { role: 'develop',  n: 2, ids: ['yoga-pigeon', 'frog-stretch', 'yoga-butterfly', 'yoga-happy-baby', 'hip-90-90-stretch'] },
    { role: 'develop',  n: 1, ids: ['yoga-seated-forward-fold', 'single-leg-hamstring-stretch', 'yoga-head-to-knee-pose'] },
    { role: 'develop',  n: 2, ids: ['yoga-reclined-twist', 'yoga-thread-needle', 'yoga-childs-pose', 'bridge', 'yoga-sphinx'] },
  ] },
};

// Accessory & Skill: the skill line for the day. Handstand and muscle-up are
// "toys in the way", not goals, so each line is short and done fresh-ish.
const SKILL_LINES = {
  'prehab-shoulder-wrist': { label: 'Shoulder & wrist prehab', steps: [
    { role: 'activate', n: 1, ids: ['face-pulls', 'band-pull-aparts'] },
    { role: 'activate', n: 1, ids: ['ext-rotation-bands', 'neck-work'] },
    { role: 'mobilise', n: 1, ids: ['wrist-prep'] },
    { role: 'activate', n: 1, ids: ['first-knuckle-raises', 'fin-pushups', 'rice-bucket', 'dorsal-pushups'] },
    { role: 'mobilise', n: 1, ids: ['tendon-glides', 'prayer-stretch', 'pronator-stretch'] },
  ] },
  'handstand': { label: 'Handstand', steps: [
    { role: 'mobilise', n: 1, ids: ['wrist-prep'] },
    { role: 'activate', n: 1, ids: ['first-knuckle-raises', 'fin-pushups'] },
    { role: 'practice', n: 1, ids: ['front-line-drill', 'wall-walk', 'pike-pushup'] },
    { role: 'practice', n: 1, ids: ['hs-wall-plank', 'wall-shoulder-taps', 'hs-kick-up'] },
    { role: 'practice', n: 1, ids: ['hs-wall-hold'] },
  ] },
  'muscle-up-prep': { label: 'Muscle-up prep', steps: [
    { role: 'develop',  n: 1, ids: ['false-grip-hang'] },
    { role: 'activate', n: 1, ids: ['scap-pullups'] },
    { role: 'develop',  n: 1, ids: ['false-grip-ring-row', 'ring-row', 'explosive-pullup'] },
    { role: 'develop',  n: 1, ids: ['ring-hold-support', 'straight-bar-dip', 'russian-dip'] },
  ] },
  'pancake-hips': { label: 'Pancake & hips', steps: [
    { role: 'develop',  n: 1, ids: ['pancake', 'straddle-fold-passive'] },
    { role: 'develop',  n: 1, ids: ['hip-90-90-stretch', 'frog-stretch'] },
    { role: 'develop',  n: 1, ids: ['straddle-sit-compression', 'pike-sit-wall'] },
    { role: 'develop',  n: 1, ids: ['yoga-butterfly', 'yoga-pigeon'] },
  ] },
  'hang-project': { label: 'Hang project', steps: [
    { role: 'develop',  n: 1, ids: ['dead-hang'], dose: { sets: 5, durationSec: 45, restSec: 60 } },
    { role: 'develop',  n: 1, ids: ['one-arm-passive-hang'] },
    { role: 'develop',  n: 1, ids: ['meat-hook-hang', 'switch-grip-hang-beginner'] },
  ] },
};

// Close: wind down. One short stretch, one release, one breath practice.
const CLOSE_RECIPES = {
  'strength': [
    { role: 'downregulate', n: 1, ids: ['couch-stretch', 'yoga-childs-pose', 'knee-to-chest-stretch', 'hamstring-hang'] },
    { role: 'downregulate', n: 1, ids: ['foam-roll-upper-back', 'foam-roll-quads', 'foam-roll-glutes', 'straightjacket-shake'] },
    { role: 'downregulate', n: 1, ids: ['yoga-legs-up-wall'] },
    { role: 'downregulate', n: 1, ids: ['box-breathing', 'physiological-sigh', 'extended-exhale', 'diaphragmatic-breathing'] },
  ],
  'run': [
    { role: 'downregulate', n: 1, ids: ['foam-roll-calves', 'foam-roll-quads', 'foam-roll-it-band'] },
    { role: 'downregulate', n: 1, ids: ['yoga-legs-up-wall', 'tre-tremoring', 'straightjacket-shake'] },
    { role: 'downregulate', n: 1, ids: ['diaphragmatic-breathing', 'physiological-sigh', 'extended-exhale'] },
  ],
  'bike': [
    { role: 'downregulate', n: 1, ids: ['yoga-reclined-twist', 'knee-to-chest-stretch', 'yoga-childs-pose'] },
    { role: 'downregulate', n: 1, ids: ['yoga-legs-up-wall', 'straightjacket-shake'] },
    { role: 'downregulate', n: 1, ids: ['box-breathing', 'body-scan', 'extended-exhale'] },
  ],
  'light': [
    { role: 'downregulate', n: 1, ids: ['yoga-legs-up-wall'] },
    { role: 'downregulate', n: 1, ids: ['yoga-nidra', 'body-scan', 'open-awareness'] },
  ],
};
