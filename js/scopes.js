// ─────────────────────────────────────────────────────────────
// SCOPES — Training · Daily log · Meals
//
// The nav holds one group of buttons per scope on a sliding track
// (index.html #nav-track). Swiping the bar sideways, or tapping a dot,
// moves to the neighbouring scope and opens the tab last used there. The
// scope is also written to body[data-scope], which recolours --accent
// (css/scopes.css). On a laptop the sidebar shows a Training / Daily log /
// Meals switch instead of the dots.
//
// navTo() calls Scopes.entered(scope, screen) on every navigation, so the
// bar always follows the screen, however it was reached.
//
// Two swipes, two levels (29 Sep):
//   · the bar      → changes app (Training / Daily log / Meals)
//   · the screen   → moves to the neighbouring tab inside the current app,
//                    in the order the bar shows them (hidden tabs skipped).
// Both follow the finger, rubber-band at the ends, and take either a drag
// past a share of the width or a quick flick. Phone only; a laptop keeps
// the sidebar.
// ─────────────────────────────────────────────────────────────

const Scopes = {
  LIST: [
    { id: 'train',  label: 'Training',  first: 'home' },
    { id: 'daylog', label: 'Daily log', first: 'daylog-checkin' },
    { id: 'meals',  label: 'Meals',     first: 'meals-week' },
  ],
  current: 'train',
  last: {},

  scopeOf(screen) {
    const s = String(screen || '');
    if (s.startsWith('meals-')) return 'meals';
    if (s.startsWith('daylog-')) return 'daylog';
    return 'train';
  },
  index(id) { return Math.max(0, this.LIST.findIndex(x => x.id === id)); },

  // Change scope, opening the tab last used in it.
  go(id) {
    if (!this.LIST.some(x => x.id === id)) return;
    if (id === this.current) { this._paint(); return; }
    const sc = this.LIST.find(x => x.id === id);
    let target = this.last[id] || sc.first;
    // The live session tab is only there while a session runs.
    if (target === 'session' && !(typeof LiveSession !== 'undefined' && LiveSession.getSession && LiveSession.getSession())) target = sc.first;
    // On a phone the new app's screen slides in from the side the bar moved
    // towards, matching the icon row, instead of the generic fade-up.
    const reduced = typeof Motion !== 'undefined' && Motion.reduced && Motion.reduced();
    const nw = this._mainFor(target);
    if (nw && !this._wide() && !reduced) {
      nw.classList.remove('mv-swipe-in-l', 'mv-swipe-in-r');
      nw.classList.add(this.index(id) > this.index(this.current) ? 'mv-swipe-in-r' : 'mv-swipe-in-l');
    }
    if (typeof navTo === 'function') navTo(target);
    if (typeof window !== 'undefined' && window.scrollTo) { try { window.scrollTo(0, 0); } catch (e) {} }
  },

  entered(scope, screen) {
    this.current = scope;
    if (screen && screen !== 'generate') this.last[scope] = screen;
    // A screen that slid in keeps its slide class while shown (see
    // _initScreenSwipe); drop it once hidden so a later tap shows the usual fade.
    if (typeof document !== 'undefined') this._clearSlide();
    this._paint();
  },

  _paint() {
    if (typeof document === 'undefined') return;
    const i = this.index(this.current);
    document.body.dataset.scope = this.current;
    const track = document.getElementById('nav-track');
    if (track) track.style.transform = `translateX(${-i * 100 / this.LIST.length}%)`;
    document.querySelectorAll('.nav-group').forEach(g => {
      const on = g.dataset.scope === this.current;
      g.classList.toggle('on', on);
      // Off-screen groups stay out of the tab order and the accessibility tree.
      if (on) g.removeAttribute('inert'); else g.setAttribute('inert', '');
      g.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    const bar = document.getElementById('nav-scopebar');
    if (bar) {
      bar.innerHTML = this.LIST.map(x => `<button type="button" class="${x.id === this.current ? 'on' : ''}" data-scope-dot="${x.id}" aria-label="${x.label}"${x.id === this.current ? ' aria-current="true"' : ''}></button>`).join('')
        + `<span>${this.LIST[i].label}</span>`;
    }
    document.querySelectorAll('[data-scope-go]').forEach(b => {
      const on = b.dataset.scopeGo === this.current;
      b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  },

  _wide() { return !!(window.matchMedia && window.matchMedia('(min-width: 900px)').matches); },

  // Finger speed over the last ~80ms, in px/ms, from the events' own
  // timestamps. A flick is a short, fast swipe: it counts even when it
  // didn't travel far.
  _tracker() {
    let pts = [];
    return {
      reset() { pts = []; },
      add(x, t) { pts.push([x, t]); while (pts.length > 2 && t - pts[0][1] > 80) pts.shift(); },
      speed() { if (pts.length < 2) return 0; const a = pts[0], b = pts[pts.length - 1]; return (b[0] - a[0]) / Math.max(1, b[1] - a[1]); },
    };
  },
  FLICK: 0.45,   // px/ms

  // Swipe on the bar: the icon rows follow the finger; let go past ~18% of
  // the width, or flick, to change scope. A drag swallows the click that ends it.
  _initSwipe() {
    const nav = document.getElementById('nav'), track = document.getElementById('nav-track');
    if (!nav || !track || nav._scopeSwipe) return;
    nav._scopeSwipe = true;
    let x0 = null, y0 = 0, dx = 0, dragging = false, w = 1, suppress = false;
    const n = this.LIST.length, vel = this._tracker();
    const down = (x, y, t) => { if (this._wide()) return; x0 = x; y0 = y; dx = 0; dragging = false; vel.reset(); vel.add(x, t); w = (nav.querySelector('.nav-viewport') || nav).offsetWidth || 1; };
    const move = (x, y, t) => {
      if (x0 == null) return; dx = x - x0; vel.add(x, t);
      if (!dragging) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(y - y0)) { dragging = true; track.classList.add('is-drag'); } else return; }
      const i = this.index(this.current); let off = dx;
      if ((i === 0 && dx > 0) || (i === n - 1 && dx < 0)) off = dx / 3;   // rubber band at the ends
      track.style.transform = `translateX(calc(${-i * 100 / n}% + ${off}px))`;
    };
    const up = () => {
      if (x0 == null) return; track.classList.remove('is-drag');
      if (dragging) {
        suppress = true; setTimeout(() => { suppress = false; }, 60);
        const i = this.index(this.current); let j = i;
        const v = vel.speed();
        const flick = Math.abs(v) > this.FLICK && Math.abs(dx) > 24 && Math.sign(v) === Math.sign(dx);
        if (Math.abs(dx) > w * 0.18 || flick) j = Math.max(0, Math.min(n - 1, i + (dx < 0 ? 1 : -1)));
        if (j !== i) this.go(this.LIST[j].id); else this._paint();
      }
      x0 = null; dragging = false;
    };
    nav.addEventListener('touchstart', e => down(e.touches[0].clientX, e.touches[0].clientY, e.timeStamp), { passive: true });
    nav.addEventListener('touchmove', e => move(e.touches[0].clientX, e.touches[0].clientY, e.timeStamp), { passive: true });
    nav.addEventListener('touchend', up); nav.addEventListener('touchcancel', up);
    nav.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') down(e.clientX, e.clientY, e.timeStamp); });
    window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') move(e.clientX, e.clientY, e.timeStamp); });
    window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') up(); });
    nav.addEventListener('click', e => {
      if (suppress) { e.preventDefault(); e.stopPropagation(); suppress = false; return; }
      const dot = e.target.closest && e.target.closest('[data-scope-dot]');
      if (dot) this.go(dot.dataset.scopeDot);
    }, true);
  },

  // The tabs of a scope, in bar order. Hidden ones (Live, when no session
  // runs) are skipped.
  tabs(scope) {
    const g = document.querySelector(`.nav-group[data-scope="${scope || this.current}"]`);
    if (!g) return [];
    return [...g.querySelectorAll('.nav-btn[data-screen]')].filter(b => b.style.display !== 'none').map(b => b.dataset.screen);
  },

  // A sheet, modal or rest overlay on screen owns the gesture.
  _overlayOpen() {
    const sel = (typeof Motion !== 'undefined' && Motion.SEL) || '.modal-backdrop, .mv-sheet-back, .rest-overlay';
    return [...document.querySelectorAll(sel)].some(el => getComputedStyle(el).display !== 'none');
  },

  // Things that already use a sideways drag keep it: fields, anything that
  // scrolls sideways (week slider, filter chips), charts you scrub, drag
  // handles (their touch-action says so), and [data-noswipe].
  _ownsSideways(t, root) {
    for (let el = t; el && el.nodeType === 1; el = el.parentElement) {
      if (el.matches('input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-noswipe]')) return true;
      const cs = getComputedStyle(el);
      if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 2) return true;
      if (cs.touchAction && cs.touchAction !== 'auto' && cs.touchAction !== 'manipulation') return true;
      if (el === root) break;
    }
    return false;
  },

  // Swipe on the screen: the page follows the finger; let go past a quarter
  // of the width, or flick, to open the next / previous tab of this app.
  // Vertical scrolling wins whenever the finger moves more up/down than
  // sideways. The very edges are left to the phone's own back gesture.
  //
  // Motion (29 Sep, v2):
  //   · drag     — 1:1 with the finger from the moment it locks (no jump by
  //                the dead zone); iOS-style resistance past the first/last tab.
  //   · release  — the old tab keeps going at the finger's speed and fades;
  //                the exit takes 70–160ms depending on how fast you let go.
  //   · enter    — the new tab slides in from the side you swiped towards.
  //                The slide class goes on BEFORE the screen is shown and stays
  //                until the screen is hidden again (entered() clears it), so
  //                the generic .screen fade-up (css/motion.css) never restarts
  //                behind it — that restart was the few-px jump at the end.
  //   · snap back — eases home over a time that scales with the distance.
  _rubber(dx, w) {
    const d = w * 0.55, x = Math.abs(dx);
    return Math.sign(dx) * (1 - 1 / (x * 0.55 / d + 1)) * d;
  },
  _mainFor(screen) {
    const sc = this.scopeOf(screen);
    return document.getElementById('screen-' + (sc === 'train' ? screen : sc));
  },
  _clearSlide(except) {
    document.querySelectorAll('.screen.mv-swipe-in-l, .screen.mv-swipe-in-r').forEach(m => {
      if (m !== except && !m.classList.contains('active')) m.classList.remove('mv-swipe-in-l', 'mv-swipe-in-r');
    });
  },

  _initScreenSwipe() {
    if (document._screenSwipe) return;
    document._screenSwipe = true;
    const vel = this._tracker();
    const LOCK = 12;
    let st = null, suppress = false;
    const reduced = () => typeof Motion !== 'undefined' && Motion.reduced && Motion.reduced();
    const clear = el => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; el.classList.remove('is-swiping'); };
    const fade = (off, w) => String(1 - Math.min(Math.abs(off) / w, 1) * 0.35);

    document.addEventListener('touchstart', e => {
      st = null;
      if (this._wide() || e.touches.length !== 1) return;
      const t = e.target, p = e.touches[0];
      const scr = t && t.closest && t.closest('main.screen.active');
      if (!scr || scr._swipeBusy) return;
      if (p.clientX < 16 || p.clientX > window.innerWidth - 16) return;
      if (this._overlayOpen() || this._ownsSideways(t, scr)) return;
      const list = this.tabs(this.current);
      const cur = (typeof App !== 'undefined' && App.screen) || '';
      const i = list.indexOf(cur);
      if (i < 0 || list.length < 2) return;
      vel.reset(); vel.add(p.clientX, e.timeStamp);
      st = { x0: p.clientX, y0: p.clientY, dx: 0, off: 0, drag: false, scr, list, i, w: scr.offsetWidth || window.innerWidth || 1 };
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (!st) return;
      if (e.touches.length !== 1) { const s = st; st = null; if (s.drag) snapBack(s); return; }
      const p = e.touches[0], dx = p.clientX - st.x0, dy = p.clientY - st.y0;
      vel.add(p.clientX, e.timeStamp);
      if (!st.drag) {
        if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { st = null; return; }   // it's a scroll
        if (Math.abs(dx) < LOCK || Math.abs(dx) < Math.abs(dy) * 1.4) return;
        // Start from where the finger is now, so the page doesn't jump by the dead zone.
        st.drag = true; st.x0 += Math.sign(dx) * LOCK; st.scr.classList.add('is-swiping');
      }
      if (e.cancelable) e.preventDefault();   // no vertical drift while swiping
      const d = p.clientX - st.x0;
      st.dx = d;
      const edge = (st.i === 0 && d > 0) || (st.i === st.list.length - 1 && d < 0);
      st.off = edge ? this._rubber(d, st.w) : d;   // resistance at the first / last tab
      st.scr.style.transform = `translate3d(${st.off}px,0,0)`;
      st.scr.style.opacity = fade(st.off, st.w);
    }, { passive: false });

    const snapBack = s => {
      const el = s.scr;
      const ms = Math.round(Math.max(160, Math.min(300, 140 + Math.abs(s.off) * 0.6)));
      el.style.transition = `transform ${ms}ms cubic-bezier(.2,.9,.25,1), opacity ${ms}ms ease-out`;
      el.style.transform = 'translate3d(0,0,0)'; el.style.opacity = '1';
      setTimeout(() => { if (!el._swipeBusy) clear(el); }, ms + 20);
    };

    const end = () => {
      const s = st; st = null;
      if (!s || !s.drag) return;
      suppress = true; setTimeout(() => { suppress = false; }, 60);
      const v = vel.speed(), dir = s.dx < 0 ? 1 : -1, j = s.i + dir;
      const flick = Math.abs(v) > this.FLICK && Math.abs(s.dx) > 30 && Math.sign(v) === Math.sign(s.dx);
      if (j < 0 || j >= s.list.length || !(Math.abs(s.dx) > s.w * 0.25 || flick)) { snapBack(s); return; }

      const el = s.scr, next = s.list[j], rm = reduced();
      el._swipeBusy = true;
      // Keep the old tab moving at the finger's speed while it fades.
      let target = -dir * s.w * 0.5;
      if (Math.abs(s.off) >= Math.abs(target)) target = s.off - dir * 40;
      const dist = Math.abs(target - s.off), speed = Math.max(Math.abs(v), 0.9);
      const ms = rm ? 0 : Math.round(Math.max(70, Math.min(160, dist / speed)));
      if (ms) {
        el.style.transition = `transform ${ms}ms cubic-bezier(.3,.5,.6,1), opacity ${ms}ms linear`;
        el.style.transform = `translate3d(${target}px,0,0)`; el.style.opacity = '0';
      }
      setTimeout(() => {
        el._swipeBusy = false;
        const nw = this._mainFor(next);
        const cls = dir > 0 ? 'mv-swipe-in-r' : 'mv-swipe-in-l';
        const same = nw === el;
        // A different <main>: arm the slide while it is still hidden, so it is
        // the first and only animation it plays when shown.
        if (nw && !same && !rm) { nw.classList.remove('mv-swipe-in-l', 'mv-swipe-in-r'); nw.classList.add(cls); }
        if (typeof navTo === 'function') navTo(next);
        clear(el);
        try { window.scrollTo(0, 0); } catch (e) {}
        // Same <main> (Daily log / Meals tabs): restart the slide on it.
        if (nw && same && !rm) { nw.classList.remove('mv-swipe-in-l', 'mv-swipe-in-r'); void nw.offsetWidth; nw.classList.add(cls); }
      }, ms);
    };
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', () => { const s = st; st = null; if (s && s.drag) snapBack(s); });
    // A swipe that ends on a button must not also press it.
    document.addEventListener('click', e => {
      if (suppress && e.target.closest && e.target.closest('main.screen')) { e.preventDefault(); e.stopPropagation(); suppress = false; }
    }, true);
  },

  init() {
    if (typeof document === 'undefined') return;
    this._initSwipe();
    this._initScreenSwipe();
    this._paint();
  },
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Scopes.init());
  else Scopes.init();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { Scopes };
