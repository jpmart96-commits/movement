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
    if (typeof navTo === 'function') navTo(target);
    if (typeof window !== 'undefined' && window.scrollTo) { try { window.scrollTo(0, 0); } catch (e) {} }
  },

  entered(scope, screen) {
    this.current = scope;
    if (screen && screen !== 'generate') this.last[scope] = screen;
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
  _initScreenSwipe() {
    if (document._screenSwipe) return;
    document._screenSwipe = true;
    const vel = this._tracker();
    let st = null, suppress = false;
    const clear = el => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; el.classList.remove('is-swiping'); };

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
      st = { x0: p.clientX, y0: p.clientY, dx: 0, drag: false, scr, list, i, w: scr.offsetWidth || window.innerWidth || 1 };
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (!st) return;
      if (e.touches.length !== 1) { const s = st; st = null; if (s.drag) snapBack(s); return; }
      const p = e.touches[0], dx = p.clientX - st.x0, dy = p.clientY - st.y0;
      vel.add(p.clientX, e.timeStamp);
      if (!st.drag) {
        if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { st = null; return; }   // it's a scroll
        if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
        st.drag = true; st.scr.classList.add('is-swiping');
      }
      if (e.cancelable) e.preventDefault();   // no vertical drift while swiping
      st.dx = dx;
      const edge = (st.i === 0 && dx > 0) || (st.i === st.list.length - 1 && dx < 0);
      const off = edge ? dx / 3 : dx;       // rubber band at the first / last tab
      st.scr.style.transform = `translateX(${off}px)`;
      st.scr.style.opacity = String(1 - Math.min(Math.abs(off) / st.w, 1) * 0.4);
    }, { passive: false });

    const snapBack = s => {
      const el = s.scr;
      el.style.transition = 'transform .22s var(--mv-out, ease-out), opacity .22s';
      el.style.transform = ''; el.style.opacity = '';
      setTimeout(() => { if (!el._swipeBusy) clear(el); }, 240);
    };

    const end = () => {
      const s = st; st = null;
      if (!s || !s.drag) return;
      suppress = true; setTimeout(() => { suppress = false; }, 60);
      const v = vel.speed(), dir = s.dx < 0 ? 1 : -1, j = s.i + dir;
      const flick = Math.abs(v) > this.FLICK && Math.abs(s.dx) > 30 && Math.sign(v) === Math.sign(s.dx);
      if (j < 0 || j >= s.list.length || !(Math.abs(s.dx) > s.w * 0.25 || flick)) { snapBack(s); return; }
      // Slide the old tab out a little, then bring the new one in from the
      // side the finger came from.
      const el = s.scr; el._swipeBusy = true;
      const reduced = typeof Motion !== 'undefined' && Motion.reduced && Motion.reduced();
      el.style.transition = 'transform .13s var(--mv-in, ease-in), opacity .13s';
      el.style.transform = `translateX(${-dir * s.w * 0.35}px)`; el.style.opacity = '0';
      setTimeout(() => {
        el._swipeBusy = false; clear(el);
        if (typeof navTo === 'function') navTo(s.list[j]);
        try { window.scrollTo(0, 0); } catch (e) {}
        const nw = document.querySelector('main.screen.active');
        if (nw && !reduced) {
          nw.classList.remove('mv-swipe-in-l', 'mv-swipe-in-r'); void nw.offsetWidth;
          const cls = dir > 0 ? 'mv-swipe-in-r' : 'mv-swipe-in-l';
          nw.classList.add(cls);
          setTimeout(() => nw.classList.remove(cls), 320);
        }
      }, reduced ? 0 : 130);
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
