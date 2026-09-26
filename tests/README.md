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
- `tests/browser/today-flow.js` — the Today edit flow end to end (run → bike, remove a
  block, reload, one-tap logging with RPE, finish with rows open).
