// ─────────────────────────────────────────────────────────────
// KEEP AWAKE + MOTION (26 Sep)
// ─────────────────────────────────────────────────────────────
// Two small things that make a live session feel right on the phone.
//
// KeepAwake: while a session is running and the app is on screen, hold a
// Screen Wake Lock so the display doesn't dim and lock between sets. The
// browser drops the lock whenever the app is hidden, so it is re-requested
// on return. No hooks into start/finish: it polls the live session every few
// seconds and on every tap, so every path that starts, restores, finishes or
// discards a session is covered without touching them. iOS home-screen apps
// honour this from iOS 18.4.
//
// Motion: sheets and modals slide/fade in and out, a logged set pops in, an
// exercise's check pops when it completes, a finished block flashes, Today's
// blocks ease open. Enter animations are pure CSS (css/motion.css). Exit
// animations need the element kept visible for a moment after the app hides
// it, and there are ~20 open/close paths, so rather than edit each one a
// MutationObserver watches the backdrops: when one flips to display:none it
// is put back for ~220ms with .mv-leaving, then hidden for real. Re-opening
// during that window cancels the exit. prefers-reduced-motion skips it all.

const KeepAwake = {
  _lock: null,
  _pending: false,
  _failed: false,

  supported() {
    return typeof navigator !== 'undefined' && !!navigator.wakeLock &&
      typeof navigator.wakeLock.request === 'function';
  },

  // A session counts as live until it is completed or discarded.
  wanted() {
    if (typeof document === 'undefined' || document.visibilityState !== 'visible') return false;
    const s = typeof LiveSession !== 'undefined' ? LiveSession.getSession() : null;
    return !!(s && s.status !== 'completed');
  },

  held() { return !!this._lock; },

  async sync() {
    if (!this.supported()) return;
    const want = this.wanted();
    if (want && !this._lock && !this._pending && !this._failed) {
      this._pending = true;
      try {
        const lock = await navigator.wakeLock.request('screen');
        this._lock = lock;
        lock.addEventListener('release', () => { if (this._lock === lock) this._lock = null; });
      } catch (e) {
        // Refused (battery saver, not allowed yet). Try again on the next tap
        // or visibility change rather than every poll.
        this._failed = true;
      } finally {
        this._pending = false;
      }
      if (this._lock && !this.wanted()) this.sync();
    } else if (!want && this._lock) {
      const lock = this._lock;
      this._lock = null;
      try { await lock.release(); } catch (e) {}
    }
  },

  init() {
    if (!this.supported()) return;
    const retry = () => { this._failed = false; this.sync(); };
    document.addEventListener('visibilitychange', retry);
    document.addEventListener('pointerup', retry, true);
    setInterval(() => this.sync(), 4000);
    this.sync();
  },
};

const Motion = {
  SEL: '.modal-backdrop, .mv-sheet-back, .rest-overlay',
  _obs: null,

  reduced() {
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  },

  init() {
    if (typeof MutationObserver === 'undefined' || !document.body) return;
    this._obs = new MutationObserver(recs => this._handle(recs));
    this._obs.observe(document.body, {
      subtree: true, attributes: true, attributeFilter: ['style'], attributeOldValue: true,
    });
    this._wrap();
  },

  // Is this backdrop on its way out? Code that asks "is the sheet open?"
  // should treat a leaving one as closed.
  leaving(el) { return !!(el && el.classList && el.classList.contains('mv-leaving')); },

  _handle(recs) {
    const before = new Map();
    for (const r of recs) {
      const el = r.target;
      if (el.nodeType !== 1 || !el.matches(this.SEL)) continue;
      if (!before.has(el)) before.set(el, r.oldValue || '');
    }
    before.forEach((old, el) => this._settle(el, old));
    // Our own style writes just above are not changes to react to.
    if (this._obs) this._obs.takeRecords();
  },

  _settle(el, oldStyle) {
    const now = el.style.display;
    if (now !== 'none') {
      if (this.leaving(el)) this._stop(el);   // re-opened mid-exit
      return;
    }
    if (this.leaving(el)) { el.style.display = el._mvDisp; return; }  // closed twice: keep exiting
    const m = /display:\s*([a-z-]+)/.exec(oldStyle);
    const was = m ? m[1] : '';
    if (was === 'none' || !el.isConnected || this.reduced()) return;

    el._mvDisp = was;
    el.style.display = was;
    el.classList.add('mv-leaving');
    const done = () => this._finish(el);
    el._mvEnd = e => { if (e.target === el) done(); };
    el.addEventListener('animationend', el._mvEnd);
    el._mvT = setTimeout(done, 320);
  },

  _stop(el) {
    clearTimeout(el._mvT);
    if (el._mvEnd) el.removeEventListener('animationend', el._mvEnd);
    el._mvEnd = null;
    el.classList.remove('mv-leaving');
  },

  _finish(el) {
    if (!this.leaving(el)) return;
    this._stop(el);
    el.style.display = 'none';
    if (this._obs) {
      const rest = this._obs.takeRecords().filter(r => r.target !== el);
      if (rest.length) this._handle(rest);
    }
  },

  // Tag what just changed in the live session so CSS can animate it: new set
  // rows, a check that just turned done, a block that just finished.
  _wrap() {
    const W = typeof window !== 'undefined' ? window : null;
    if (!W) return;

    if (typeof W.refreshExercise === 'function') {
      const orig = W.refreshExercise;
      W.refreshExercise = function (b, e) {
        const prev = document.getElementById(`ex-${b}-${e}`);
        const nSets = prev ? prev.querySelectorAll('.set-row').length : 0;
        const wasDone = prev ? prev.classList.contains('ex-done') : true;
        const out = orig.apply(this, arguments);
        const next = document.getElementById(`ex-${b}-${e}`);
        if (prev && next && next !== prev) {
          const rows = next.querySelectorAll('.set-row');
          for (let i = nSets; i < rows.length; i++) rows[i].classList.add('mv-set-new');
          if (!wasDone && next.classList.contains('ex-done')) {
            const chk = next.querySelector('.ex-check');
            if (chk) chk.classList.add('mv-check-pop');
          }
        }
        return out;
      };
    }

    if (typeof W.refreshBlock === 'function') {
      const orig = W.refreshBlock;
      W.refreshBlock = function (b) {
        const hdr = () => document.querySelector(`#block-${b} .block-header`);
        const was = hdr() ? hdr().classList.contains('block-done') : true;
        const out = orig.apply(this, arguments);
        const h = hdr();
        if (h && !was && h.classList.contains('block-done')) {
          h.classList.remove('mv-block-flash'); void h.offsetWidth; h.classList.add('mv-block-flash');
        }
        return out;
      };
    }

    if (typeof W.toggleTodayBlock === 'function') {
      const orig = W.toggleTodayBlock;
      W.toggleTodayBlock = function () {
        const out = orig.apply(this, arguments);
        const body = document.querySelector('.mv-blk.open .mv-blk-body');
        if (body) body.classList.add('mv-reveal');
        return out;
      };
    }
  },
};

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    try { KeepAwake.init(); } catch (e) { console.warn('KeepAwake', e); }
    try { Motion.init(); } catch (e) { console.warn('Motion', e); }
  });
}
