'use strict';
// tests/load.js — loads the app's browser scripts into one node:vm context.
//
//   const { freshContext } = require('./load');
//   const app = freshContext({ now: '2026-09-28T09:00:00', storage: { pb_profile: {...} } });
//   app.Generator.generateFromScaffold({ date: app.date('2026-09-28'), profile: app.Profile.load() });
//   app.setNow('2026-09-29T09:00');   app.storage.reset();   app.run('MonthPlan.dayFor(new Date())');
//
// What it does:
// * Reads the <script src> list from index.html, in order, so a new js/*.js
//   file added to the page is picked up automatically. Remote (http) scripts
//   and anything in `skip` are left out.
// * Strips the 'use strict' directive (it stops cross-file sharing in one vm).
// * Top-level const/let/class don't become properties of the vm global, so
//   after each file every column-0 declaration is re-exposed as a live
//   getter/setter on globalThis (so `app.Generator`, `app.MONTH_PLAN_SEED` work).
// * Stubs: in-memory localStorage (resettable), window/self (= the global),
//   a minimal document, navigator, fetch (always rejects: no network),
//   timers (never fire: sync's debounce and stats' resize are inert),
//   console passthrough.
// * Determinism: TZ fixed to Europe/Lisbon; Date is wrapped so Date.now()
//   and `new Date()` return a controllable clock; Math.random is a seeded
//   PRNG (only custom-exercise/idea ids use it today); crypto.randomUUID is
//   deterministic too.

process.env.TZ = 'Europe/Lisbon'; // before any Date use in this process

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_NOW = '2026-09-26T09:00:00';
const DEFAULT_SKIP = []; // sync.js and overrides.js load fine with the stubs below

function scriptList(root = ROOT) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const out = [];
  const re = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const src = m[1].split(/[?#]/)[0];          // tolerate ?v=cache-busters
    if (/^(https?:)?\/\//i.test(src)) continue;  // CDN scripts: not ours
    out.push(src.replace(/^\.?\//, ''));
  }
  return out;
}

// Column-0 const/let/class declarations (incl. simple destructuring).
function topLevelLexicals(src) {
  const names = new Set();
  const re = /^(?:export\s+)?(const|let|class)\s+(\{[^}]*\}|\[[^\]]*\]|[A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(src))) {
    const t = m[2];
    if (t[0] === '{' || t[0] === '[') {
      t.slice(1, -1).split(',').forEach(part => {
        const nm = part.split(':').pop().split('=')[0].replace(/\.\.\./, '').trim();
        if (/^[A-Za-z_$][\w$]*$/.test(nm)) names.add(nm);
      });
    } else names.add(t);
  }
  return [...names];
}

function makeStorage(initial) {
  const store = new Map();
  const api = {
    getItem: k => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => { store.set(String(k), String(v)); },
    removeItem: k => { store.delete(String(k)); },
    key: i => [...store.keys()][i] ?? null,
    get length() { return store.size; },
    clear: () => store.clear(),
  };
  const seed = obj => {
    for (const [k, v] of Object.entries(obj || {})) store.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  };
  seed(initial);
  return { api, map: store, reset(next) { store.clear(); seed(next); }, dump: () => Object.fromEntries(store) };
}

function makeDocument() {
  const el = () => ({
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, appendChild() {}, addEventListener() {},
    querySelector: () => null, querySelectorAll: () => [], innerHTML: '', textContent: '',
  });
  return {
    documentElement: el(), body: el(), head: el(),
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    createElement: el, addEventListener() {}, removeEventListener() {},
  };
}

function freshContext({ now = DEFAULT_NOW, storage = {}, skip = DEFAULT_SKIP, seed = 1, root = ROOT, quiet = false } = {}) {
  const ls = makeStorage(storage);
  const ctx = {
    console: quiet ? { log() {}, info() {}, warn() {}, error() {}, debug() {} } : console,
    localStorage: ls.api, sessionStorage: makeStorage().api,
    document: makeDocument(),
    navigator: { userAgent: 'node-test', onLine: false, serviceWorker: undefined },
    location: { href: 'http://localhost/movement/', hostname: 'localhost', pathname: '/movement/', search: '', hash: '' },
    fetch: async () => { throw new Error('network disabled in tests'); },
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    alert() {}, confirm: () => true, prompt: () => null,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    innerWidth: 390, innerHeight: 844,
  };
  ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);

  // Controllable clock + seeded randomness, installed inside the realm so
  // app code sees the context's own Date/Math.
  const nowMs = typeof now === 'number' ? now : Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error('freshContext: bad now ' + now);
  vm.runInContext(`
    (function () {
      const RealDate = Date;
      let NOW = ${nowMs};
      const FakeDate = new Proxy(RealDate, {
        construct(target, args, newTarget) {
          return args.length ? Reflect.construct(target, args, newTarget) : Reflect.construct(target, [NOW], newTarget);
        },
        apply() { return new RealDate(NOW).toString(); },
        get(target, prop, recv) { return prop === 'now' ? () => NOW : Reflect.get(target, prop, recv); },
      });
      globalThis.Date = FakeDate;
      Object.defineProperty(globalThis, '__setNow', { value: v => { NOW = typeof v === 'number' ? v : RealDate.parse(v); if (!Number.isFinite(NOW)) throw new Error('bad time ' + v); return NOW; } });
      Object.defineProperty(globalThis, '__getNow', { value: () => NOW });
      let s = ${seed >>> 0} || 1;
      const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      Math.random = rnd;
      Object.defineProperty(globalThis, '__seedRandom', { value: v => { s = v >>> 0 || 1; } });
      let uuidN = 0;
      globalThis.crypto = { randomUUID: () => '00000000-0000-4000-8000-' + String(++uuidN).padStart(12, '0'),
                            getRandomValues: a => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(rnd() * 256); return a; } };
    })();
  `, ctx, { filename: 'tests/load.js:clock' });

  const loaded = [];
  const exposed = [];
  for (const rel of scriptList(root)) {
    if (skip.includes(rel)) continue;
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) throw new Error(`index.html references ${rel}, which does not exist`);
    // Blank (not delete) the directive line so stack-trace line numbers match the file.
    const src = fs.readFileSync(file, 'utf8').replace(/^[ \t]*(['"])use strict\1;?[ \t]*$/gm, '');
    try {
      vm.runInContext(src, ctx, { filename: rel });
    } catch (e) {
      e.message = `while loading ${rel}: ${e.message}`;
      throw e;
    }
    loaded.push(rel);
    const names = topLevelLexicals(src).filter(n => !Object.prototype.hasOwnProperty.call(ctx, n));
    if (names.length) {
      // Live accessors, so a reassigned `let` stays in sync. A name that is
      // not actually a global binding (e.g. a column-0 decl inside a
      // wrapper) is skipped silently via the typeof guard.
      vm.runInContext(names.map(n =>
        `try { if (typeof ${n} !== 'undefined') Object.defineProperty(globalThis, ${JSON.stringify(n)}, { get() { return ${n}; }, set(v) { ${n} = v; }, configurable: true, enumerable: false }); } catch (e) {}`
      ).join('\n'), ctx, { filename: `tests/load.js:expose(${rel})` });
      exposed.push(...names.filter(n => Object.prototype.hasOwnProperty.call(ctx, n)));
    }
  }

  const api = Object.create(ctx); // app.Generator etc. resolve through the context
  Object.assign(api, {
    ctx, loaded, exposed,
    storage: { get api() { return ls.api; }, reset: ls.reset, dump: ls.dump, map: ls.map },
    run: (code, filename = 'tests:eval') => vm.runInContext(code, ctx, { filename }),
    setNow: v => ctx.__setNow(typeof v === 'string' && /^\d{4}-\d\d-\d\d$/.test(v) ? v + 'T09:00:00' : v),
    getNow: () => ctx.__getNow(),
    seedRandom: v => ctx.__seedRandom(v),
    // A context-realm Date at local noon (or the given time) on a YYYY-MM-DD day.
    date: (ymd, time = '12:00:00') => vm.runInContext(`new Date(${JSON.stringify(ymd + 'T' + time)})`, ctx),
  });
  return api;
}

// Local-date iteration helpers shared by the tests.
function dateRange(from, to) {
  const out = [];
  const d = new Date(from + 'T12:00:00'), end = new Date(to + 'T12:00:00');
  for (; d <= end; d.setDate(d.getDate() + 1)) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}

module.exports = { freshContext, scriptList, topLevelLexicals, dateRange, ROOT };
