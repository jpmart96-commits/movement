// ─────────────────────────────────────────────────────────────
// SHADE — app-wide settings, pulled down from the top (29 Sep)
//
// A panel that covers only the top of the screen. It never opens on a tap:
// put a finger just below the status bar (the top ~44px of the app) and drag
// down; the panel follows the finger and opens once pulled past ~35% of its
// height, or on a quick downward flick. The very top edge is left alone on
// purpose — on an iPhone it belongs to Notification / Control Centre.
// Close it by dragging it back up, tapping the dimmed page, the grabber or
// Escape. On a laptop the same drag works with the mouse.
//
// Inside:
//   · Apps — Training, Daily log, Meals on/off (Scopes.setModule; saved in
//     the profile, synced per account). At least one stays on.
//   · Theme (shares setTheme with Settings → App).
//   · Sync status + Sync now, Training settings, Sign out.
// ─────────────────────────────────────────────────────────────

const Shade = {
  BAND: 44,         // px below the status bar where a pull can start
  OPEN_AT: 0.35,    // share of the panel height to pull before it opens
  CLOSE_AT: 0.25,   // share to push back up before it closes
  _open: false,
  _el: null, _scrim: null, _body: null,

  APPS: {
    train:  { d: 'Block, today, progress, stats, log, notes',
              ico: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
    daylog: { d: 'Morning and evening check-ins, sleep, routines',
              ico: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 9.5h.01M15 9.5h.01"/>' },
    meals:  { d: 'Week plan, prep, shopping, recipes',
              ico: '<path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M2 10h20M9 6.5c0-1 1-1.2 1-2.5M14 6.5c0-1 1-1.2 1-2.5"/>' },
  },

  isOpen() { return this._open; },
  _reduced() { return typeof Motion !== 'undefined' && Motion.reduced && Motion.reduced(); },
  _appVisible() { const r = document.getElementById('app-root'); return !!r && r.style.display !== 'none'; },
  // The status-bar inset, read from the strip style.css already draws there.
  _safeTop() { try { return parseFloat(getComputedStyle(document.body, '::before').height) || 0; } catch (e) { return 0; } },

  _build() {
    if (this._el || typeof document === 'undefined' || !document.body) return;
    const scrim = document.createElement('div');
    scrim.id = 'shade-scrim';
    const el = document.createElement('section');
    el.id = 'shade';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'App settings');
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('inert', '');
    el.tabIndex = -1;
    const apps = Scopes.LIST.map(a => `
      <button type="button" class="shade-app" role="switch" aria-checked="true" data-app="${a.id}" data-shade-mod="${a.id}">
        <span class="shade-ico" aria-hidden="true"><svg viewBox="0 0 24 24">${this.APPS[a.id].ico}</svg></span>
        <span class="shade-app-txt"><span class="shade-app-t">${a.label}</span><span class="shade-app-d">${this.APPS[a.id].d}</span></span>
        <span class="shade-sw" aria-hidden="true"></span>
      </button>`).join('');
    el.innerHTML = `
      <div class="shade-body">
        <div class="shade-head">
          <div class="mv-eyebrow">Movement</div>
          <div class="shade-title mv-display">Apps</div>
          <div class="shade-sub">Choose what this account shows. Synced to your other devices.</div>
        </div>
        <div class="shade-apps">${apps}</div>
        <div class="shade-note" id="shade-note" hidden>At least one app stays on.</div>
        <div class="shade-row">
          <span class="shade-row-t">Theme</span>
          <div class="set-seg" role="group" aria-label="Theme">
            <button type="button" data-theme-opt="system" aria-pressed="true"  onclick="setTheme('system')">System</button>
            <button type="button" data-theme-opt="light"  aria-pressed="false" onclick="setTheme('light')">Light</button>
            <button type="button" data-theme-opt="dark"   aria-pressed="false" onclick="setTheme('dark')">Dark</button>
          </div>
        </div>
        <div class="shade-row">
          <span class="shade-sync" id="shade-sync">Changes sync on their own</span>
          <button type="button" class="shade-btn" data-shade="sync">Sync now</button>
        </div>
        <div class="shade-links">
          <button type="button" class="shade-link" data-shade="settings">Training settings</button>
          <button type="button" class="shade-link" data-shade="signout">Sign out</button>
        </div>
      </div>
      <button type="button" class="shade-grab" data-shade="close" aria-label="Close"><i></i></button>`;
    document.body.appendChild(scrim);
    document.body.appendChild(el);
    this._el = el; this._scrim = scrim; this._body = el.querySelector('.shade-body');

    el.addEventListener('click', e => {
      const t = e.target.closest && e.target.closest('[data-shade-mod], [data-shade]');
      if (!t) return;
      if (t.dataset.shadeMod) {
        const id = t.dataset.shadeMod;
        if (t.getAttribute('aria-disabled') === 'true') { this._nudge(t); return; }
        Scopes.setModule(id, !Scopes.isOn(id));
        return;
      }
      const a = t.dataset.shade;
      if (a === 'close') this.close();
      if (a === 'settings') { this.close(); if (typeof navTo === 'function') navTo('settings'); }
      if (a === 'signout') { this.close(); if (typeof signOut === 'function') signOut(); }
      if (a === 'sync') this._sync(t);
    });
    scrim.addEventListener('click', () => { if (!this._suppress) this.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && this._open) { e.stopPropagation(); this.close(); } }, true);
    window.addEventListener('sync-status', e => this._syncText(e.detail || {}));
    this.refresh();
  },

  _nudge(el) {
    const n = document.getElementById('shade-note');
    if (n) { n.hidden = false; n.classList.remove('is-nudge'); void n.offsetWidth; n.classList.add('is-nudge'); }
    el.classList.remove('is-nudge'); void el.offsetWidth; el.classList.add('is-nudge');
  },

  async _sync(btn) {
    const s = document.getElementById('shade-sync');
    if (s) s.textContent = 'Syncing…';
    btn.disabled = true;
    try { if (typeof manualSync === 'function') await manualSync(); } catch (e) {}
    btn.disabled = false;
    this._syncText({});
  },

  _syncText(d) {
    const s = document.getElementById('shade-sync');
    if (!s || (typeof DB !== 'undefined' && DB._manualSyncing)) return;
    const pending = d.pending != null ? d.pending : (typeof DB !== 'undefined' && DB.pendingCount ? DB.pendingCount() : 0);
    const okAt = d.lastOkAt || (typeof DB !== 'undefined' ? DB.lastOkAt : null);
    if (d.quota) s.textContent = 'Storage full on this device';
    else if (pending) s.textContent = `${pending} change${pending === 1 ? '' : 's'} waiting to sync`;
    else if (okAt) s.textContent = 'Synced · ' + new Date(okAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    else s.textContent = 'Changes sync on their own';
  },

  // Repaint the switches, theme and links from the current state.
  refresh() {
    if (!this._el) return;
    const on = Scopes.on().map(x => x.id);
    this._el.querySelectorAll('[data-shade-mod]').forEach(b => {
      const id = b.dataset.shadeMod, isOn = on.includes(id), last = isOn && on.length === 1;
      b.setAttribute('aria-checked', isOn ? 'true' : 'false');
      b.setAttribute('aria-disabled', last ? 'true' : 'false');
    });
    const note = document.getElementById('shade-note');
    if (note && on.length > 1) note.hidden = true;
    let theme = 'system';
    try { theme = (App.profile && App.profile.settings && App.profile.settings.theme) || 'system'; } catch (e) {}
    this._el.querySelectorAll('[data-theme-opt]').forEach(b => b.setAttribute('aria-pressed', b.dataset.themeOpt === theme ? 'true' : 'false'));
    const st = this._el.querySelector('[data-shade="settings"]');
    if (st) st.hidden = !on.includes('train');
    this._syncText({});
  },

  // ── position ──
  // r = how much of the panel is showing, 0 (closed) … H (open).
  _H() { return this._el.offsetHeight || 1; },
  _live(on) {
    this._el.classList.toggle('is-live', on);
    this._scrim.classList.toggle('is-live', on);
  },
  _set(r, H, ms, ease) {
    const el = this._el, sc = this._scrim;
    const t = ms ? `transform ${ms}ms ${ease}` : 'none';
    el.style.transition = t;
    sc.style.transition = ms ? `opacity ${ms}ms ${ease}` : 'none';
    el.style.transform = `translate3d(0,${Math.round(r - H)}px,0)`;
    sc.style.opacity = String(Math.max(0, Math.min(1, r / H)));
  },

  open(v = 0) {
    this._build();
    if (!this._el) return;
    this.refresh();
    const H = this._H(), from = this._r != null ? this._r : 0;
    if (this._r == null) { this._live(true); this._set(0, H, 0); void this._el.offsetWidth; }
    const ms = this._reduced() ? 0 : Math.round(Math.max(180, Math.min(380, (H - from) / Math.max(Math.abs(v), 0.8) + 120)));
    this._set(H, H, ms, 'cubic-bezier(.2,.9,.25,1)');
    this._r = H; this._open = true;
    clearTimeout(this._t);
    this._el.removeAttribute('inert'); this._el.setAttribute('aria-hidden', 'false');
    this._scrim.classList.add('on');
    document.documentElement.classList.add('shade-open');
    this._returnFocus = document.activeElement;
    try { this._el.focus({ preventScroll: true }); } catch (e) {}
  },

  close(v = 0) {
    if (!this._el || this._r == null) return;
    const H = this._H(), from = this._r;
    const ms = this._reduced() ? 0 : Math.round(Math.max(150, Math.min(280, from / Math.max(Math.abs(v), 1.1) + 60)));
    this._set(0, H, ms, 'cubic-bezier(.4,0,.8,.6)');
    this._open = false; this._r = null;
    this._el.setAttribute('inert', ''); this._el.setAttribute('aria-hidden', 'true');
    this._scrim.classList.remove('on');
    document.documentElement.classList.remove('shade-open');
    clearTimeout(this._t);
    this._t = setTimeout(() => { if (!this._open) { this._live(false); this._el.style.transform = ''; this._el.style.transition = ''; this._scrim.style.opacity = ''; } }, ms + 30);
    const f = this._returnFocus; this._returnFocus = null;
    if (f && f.focus && document.contains(f)) { try { f.focus({ preventScroll: true }); } catch (e) {} }
  },

  // ── gesture ──
  _initGesture() {
    const vel = Scopes._tracker();
    const LOCK = 8;
    let g = null;
    const fieldish = t => !!(t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));

    const start = (x, y, t, target) => {
      g = null;
      if (!this._appVisible()) return;
      if (!this._open) {
        const top = this._safeTop();
        if (y < top || y > top + this.BAND) return;
        if (Scopes._overlayOpen() || fieldish(target)) return;
        this._build();
        g = { mode: 'open', x0: x, y0: y, drag: false };
      } else {
        if (!target || !(this._el.contains(target) || target === this._scrim)) return;
        const b = this._body;
        const inBody = b && b.contains(target);
        const atEnd = !b || b.scrollTop + b.clientHeight >= b.scrollHeight - 1;
        if (inBody && !atEnd) return;   // let the panel scroll first
        g = { mode: 'close', x0: x, y0: y, drag: false };
      }
      vel.reset(); vel.add(y, t);
    };

    const move = (x, y, t, e) => {
      if (!g) return;
      const dx = x - g.x0, dy = y - g.y0;
      vel.add(y, t);
      if (!g.drag) {
        const down = g.mode === 'open';
        const ok = down ? (dy > LOCK && dy > Math.abs(dx) * 1.2) : (dy < -LOCK && -dy > Math.abs(dx) * 1.2);
        if (!ok) { if (Math.abs(dx) > 10 || (down ? dy < -LOCK : dy > LOCK)) g = null; return; }
        g.drag = true; g.y0 += down ? LOCK : -LOCK;
        g.H = this._H();
        if (down) { this._live(true); this._set(0, g.H, 0); }
        document.documentElement.classList.add('shade-dragging');
      }
      if (e && e.cancelable) e.preventDefault();
      const d = y - g.y0;
      const r = g.mode === 'open' ? Math.max(0, Math.min(g.H, d)) : Math.max(0, Math.min(g.H, g.H + d));
      g.r = r;
      this._set(r, g.H, 0);
    };

    const end = () => {
      const s = g; g = null;
      if (!s || !s.drag) return;
      document.documentElement.classList.remove('shade-dragging');
      this._suppress = true; setTimeout(() => { this._suppress = false; }, 60);
      const v = vel.speed(), r = s.r || 0;
      if (s.mode === 'open') {
        const go = r > s.H * this.OPEN_AT || (v > Scopes.FLICK && r > 20);
        this._r = r;
        if (go) this.open(v); else { this._r = r; this.close(v); }
      } else {
        const go = (s.H - r) > s.H * this.CLOSE_AT || v < -Scopes.FLICK;
        this._r = r;
        if (go) this.close(v); else this.open(v);
      }
    };

    document.addEventListener('touchstart', e => { if (e.touches.length === 1) start(e.touches[0].clientX, e.touches[0].clientY, e.timeStamp, e.target); else g = null; }, { passive: true });
    document.addEventListener('touchmove', e => { if (e.touches.length === 1) move(e.touches[0].clientX, e.touches[0].clientY, e.timeStamp, e); }, { passive: false });
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', end);
    document.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) start(e.clientX, e.clientY, e.timeStamp, e.target); });
    window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') move(e.clientX, e.clientY, e.timeStamp, e); });
    window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') end(); });
    // A pull that ends over a button must not also press it.
    document.addEventListener('click', e => {
      if (this._suppress) { e.preventDefault(); e.stopPropagation(); this._suppress = false; }
    }, true);
  },

  init() {
    if (typeof document === 'undefined') return;
    this._build();
    this._initGesture();
  },
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Shade.init());
  else Shade.init();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { Shade };
