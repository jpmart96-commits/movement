# Tests

Zero-dependency regression suite (Node 22+, built-ins only). It loads the real
browser scripts into one `node:vm` context. No build, no network, no DOM.

```
node tests/run.js                  # everything; exit 1 only on real failures
node tests/run.js snapshot         # only files matching "snapshot"
UPDATE_GOLDEN=1 node tests/run.js  # re-baseline tests/golden/days.json after an intended change
VERBOSE=1 node tests/run.js        # also list every KNOWN violation and test stdout
node --test 'tests/*.test.js'      # the stock runner works too
```

| File | What |
|---|---|
| `load.js` | `freshContext({ now, storage, seed, skip })`: loads the `<script src>` list from `index.html` in order. It strips `'use strict'`, exposes top-level `const`/`let`/`class` as globals, stubs localStorage/window/document/fetch/timers, and fixes TZ to Europe/Lisbon. It also installs a controllable clock (`setNow`) and seeds `Math.random`. |
| `helpers.js` | `generateDay`, the compact normal form, and the per-date diff. |
| `snapshot.test.js` | `generateFromScaffold` for 26 Sep–30 Nov (empty history) against `golden/days.json`, plus a determinism check. |
| `invariants.test.js` | Per plan day (26 Sep–25 Oct): no duplicates, every item dosed, minutes add up, and blocks fit their time (+10%). Main Focus must match `mainFocusPlan` loads with no prehab, `dayType` must match the plan, and Complementary must be 3–5 items in one domain. Also checks the known-bug behaviours. |
| `notes.test.js` | Notes tab (`js/notes.js`): day/exercise context stamping, status and resolution, ordering, tombstoned delete, outbox routing to `plan_notes`, markdown export. |
| `meals.test.js` | Meals and the daily log: day effort from the plan (a "lighter" day steps down, an override wins), weight from weigh-ins, hybrid/Sunday planning rules, portions by day, vegetarian and constraint filtering, shopping list, eaten meals kept on regenerate, sync routing (`pb_meals`, `pb_daylog`), week pruning, training auto-tick. |
| `run.js` | Runner. It groups output into failures, KNOWN violations, expected failures and now-passing tests. |

**Known bugs.** A known bug is a test with `{ todo: 'known bug: …' }`. It is reported under
"expected failures" and doesn't fail the run. When one starts passing, the runner lists it
under "now passing"; remove the `todo` then.

**KNOWN.** Accepted invariant violations live in the `KNOWN` array at the top of
`invariants.test.js`. When an entry stops matching, the runner says so.

## Browser suites (optional, need Playwright)

- `tests/browser/suite.js` — sync layer against a fake in-memory Supabase shared by two
  "devices": token expiry mid-session, offline start, two-device index, custom-list
  merge/delete, quota, API-key scrubbing, outbox across reloads. `node tests/browser/suite.js`
- `tests/browser/motion.js` — keep-awake (lock held while a session is live, dropped when hidden,
  re-taken on return, released on finish) and motion (new set / completed check tagged, sheets
  animate out, re-open mid-exit stays open).
- `tests/browser/today-flow.js` — the Today edit flow end to end (run → bike, remove a
  block, reload, one-tap logging with RPE, finish with rows open).
- `tests/browser/notes.js` — Notes tab end to end: write from the tab, quick add from Today
  and the exercise sheet, sync to `plan_notes`, an off-device review marking a note applied
  (wins over a pending local edit of another note), a second device, delete, export.
- `tests/browser/meals.js` — scopes, Meals and Daily log end to end: swipe the bar between Training / Daily log / Meals
  (accent and icons change, rubber band, short drags ignored), generate a week, eaten, shopping ticks, a second
  device pulls the plan, two-touch check-in seeding the training check-in, routine edits, laptop sidebar switch.
  `SHOTS=1` writes screenshots to /tmp. `node tests/browser/meals.js`
- `tests/browser/screen-swipe.js` — sideways swipe on the page moves to the next / previous tab of the current
  app in bar order (bar swipe still changes app): rubber band at the ends, never crosses apps, short slow drags and
  vertical scrolls ignored, a quick flick counts, Live joins while a session runs, the week slider and open sheets
  keep the gesture, laptop width does nothing, plus one real CDP touch. `node tests/browser/screen-swipe.js`
- `tests/browser/shade.js` — the top shade (app-wide settings): opens only on a pull from just below the top edge
  (taps, mid-screen and sideways drags ignored), follows the finger, short pulls spring back, a flick opens, push up /
  tap outside / Escape close. Apps on/off: bar, dots, bar swipe, navTo and the laptop switch follow; switching off the
  app on screen leaves it; the last app stays on; the choice syncs to a second device; theme; mouse drag on a laptop.
  `node tests/browser/shade.js`
- `tests/browser/settings.js` — Settings end to end: tabs, library tiles → category → subcategory, search,
  filters, the exercise sheet (state, 1RM tracking, Edit refreshes it), steppers saving, zone ceilings
  staying in order, equipment chips, theme, and the sync status line. `node tests/browser/settings.js`

## Before every push

`tools/git-hooks/pre-push` runs `node tests/run.js` and stops the push if anything
fails (GitHub Desktop shows the output). It lives in `.git/hooks/pre-push`; after a
fresh clone, copy it back there. Needs Node.js on the PC — without it the hook only
prints a warning. `.github/workflows/tests.yml` runs the same suite on GitHub after
each push.
