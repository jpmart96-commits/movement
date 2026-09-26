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
- `tests/browser/settings.js` — Settings end to end: tabs, library tiles → category → subcategory, search,
  filters, the exercise sheet (state, 1RM tracking, Edit refreshes it), steppers saving, zone ceilings
  staying in order, equipment chips, theme, and the sync status line. `node tests/browser/settings.js`

## Before every push

`tools/git-hooks/pre-push` runs `node tests/run.js` and stops the push if anything
fails (GitHub Desktop shows the output). It lives in `.git/hooks/pre-push`; after a
fresh clone, copy it back there. Needs Node.js on the PC — without it the hook only
prints a warning. `.github/workflows/tests.yml` runs the same suite on GitHub after
each push.
