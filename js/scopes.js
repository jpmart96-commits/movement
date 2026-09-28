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

  // Swipe on the bar: the icon rows follow the finger; let go past ~18% of
  // the width to change scope. A drag swallows the click that ends it.
  _initSwipe() {
    const nav = document.getElementById('nav'), track = document.getElementById('nav-track');
    if (!nav || !track || nav._scopeSwipe) return;
    nav._scopeSwipe = true;
    let x0 = null, y0 = 0, dx = 0, dragging = false, w = 1, suppress = false;
    const n = this.LIST.length;
    const wide = () => window.matchMedia && window.matchMedia('(min-width: 900px)').matches;
    const down = (x, y) => { if (wide()) return; x0 = x; y0 = y; dx = 0; dragging = false; w = (nav.querySelector('.nav-viewport') || nav).offsetWidth || 1; };
    const move = (x, y) => {
      if (x0 == null) return; dx = x - x0;
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
        if (Math.abs(dx) > w * 0.18) j = Math.max(0, Math.min(n - 1, i + (dx < 0 ? 1 : -1)));
        if (j !== i) this.go(this.LIST[j].id); else this._paint();
      }
      x0 = null; dragging = false;
    };
    nav.addEventListener('touchstart', e => down(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    nav.addEventListener('touchmove', e => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    nav.addEventListener('touchend', up); nav.addEventListener('touchcancel', up);
    nav.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') down(e.clientX, e.clientY); });
    window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') move(e.clientX, e.clientY); });
    window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') up(); });
    nav.addEventListener('click', e => {
      if (suppress) { e.preventDefault(); e.stopPropagation(); suppress = false; return; }
      const dot = e.target.closest && e.target.closest('[data-scope-dot]');
      if (dot) this.go(dot.dataset.scopeDot);
    }, true);
  },

  init() {
    if (typeof document === 'undefined') return;
    this._initSwipe();
    this._paint();
  },
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Scopes.init());
  else Scopes.init();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { Scopes };
