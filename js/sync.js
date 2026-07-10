'use strict';

const SUPABASE_URL = 'https://smaxfmxcxsmtjnwlysiv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYXhmbXhjeHNtdGpud2x5c2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTYwMjQsImV4cCI6MjA5NjkzMjAyNH0.3S6Oh0rrSKhvNuKXzXrEnMXZOgzBz7085K1ofN8_Lzg';

// ── LOW-LEVEL FETCH ────────────────────────────────────────────
async function _sbFetch(path, method = 'GET', body = null, token = null, extraHeaders = {}) {
  const headers = {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    ...extraHeaders,
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(SUPABASE_URL + path, opts);
    const text = await res.text();
    if (!res.ok) { console.warn('Supabase error', res.status, text); return { error: text }; }
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('Supabase fetch error:', e);
    return { error: e.message };
  }
}

// PostgREST REST helper
async function _rest(table, method, params = {}, body = null, extraHeaders = {}) {
  const token = _getToken();
  let path = `/rest/v1/${table}`;
  const qs = [];
  if (params.select) qs.push(`select=${params.select}`);
  if (params.eq)     Object.entries(params.eq).forEach(([k,v]) => qs.push(`${k}=eq.${encodeURIComponent(v)}`));
  if (params.order)  qs.push(`order=${params.order}`);
  if (params.limit)  qs.push(`limit=${params.limit}`);
  if (qs.length)     path += '?' + qs.join('&');
  return _sbFetch(path, method, body, token, extraHeaders);
}

// True upsert using PostgREST's on-conflict
async function _upsert(table, row, onConflict) {
  const token = _getToken();
  return _sbFetch(
    `/rest/v1/${table}?on_conflict=${onConflict}`,
    'POST', row, token,
    { 'Prefer': 'resolution=merge-duplicates,return=minimal' }
  );
}

// ── AUTH ───────────────────────────────────────────────────────
const Auth = {
  _user: null,

  async signUp(email, password) {
    const res = await _sbFetch('/auth/v1/signup', 'POST', { email, password });
    if (res.error) throw new Error(typeof res.error === 'string' ? res.error : 'Sign up failed');
    return res;
  },

  async signIn(email, password) {
    const res = await _sbFetch('/auth/v1/token?grant_type=password', 'POST', { email, password });
    if (res.error || !res.access_token) throw new Error('Invalid email or password');
    _saveSession(res);
    this._user = res.user;
    return res.user;
  },

  async signOut() {
    const token = _getToken();
    if (token) await _sbFetch('/auth/v1/logout', 'POST', {}, token);
    localStorage.removeItem('sb_session');
    this._user = null;
  },

  async getUser() {
    if (this._user) return this._user;
    const session = _loadSession();
    if (!session) return null;
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        const res = await _sbFetch('/auth/v1/token?grant_type=refresh_token', 'POST',
          { refresh_token: session.refresh_token });
        if (res.error || !res.access_token) { localStorage.removeItem('sb_session'); return null; }
        _saveSession(res); this._user = res.user; return res.user;
      }
      this._user = session.user; return session.user;
    } catch { return null; }
  },

  isLoggedIn() { return !!_loadSession(); },
};

function _saveSession(res) {
  localStorage.setItem('sb_session', JSON.stringify({
    access_token: res.access_token, refresh_token: res.refresh_token, user: res.user,
  }));
}
function _loadSession() { try { return JSON.parse(localStorage.getItem('sb_session')); } catch { return null; } }
function _getToken()    { return _loadSession()?.access_token || null; }

// ── DB EXTENSION ───────────────────────────────────────────────
// Extends the DB object from app.js with Supabase sync
Object.assign(DB, {
  _queue: [],
  _flushTimer: null,

  // Override set — write localStorage immediately, queue Supabase sync
  set(k, v) {
    try {
      localStorage.setItem(this.PREFIX + k, JSON.stringify(v));
      this._scheduleSync(this.PREFIX + k, v);
      return true;
    } catch { return false; }
  },

  _scheduleSync(fullKey, value) {
    this._queue = this._queue.filter(q => q.key !== fullKey);
    this._queue.push({ key: fullKey, value });
    clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => this._flush(), 800);
  },

  async _flush() {
    if (!Auth.isLoggedIn()) return;
    const user = await Auth.getUser(); if (!user) return;
    const uid = user.id;
    const batch = [...this._queue]; this._queue = [];
    for (const { key, value } of batch) {
      try { await this._syncKey(key, value, uid); }
      catch(e) { console.error('Sync error for', key, e); }
    }
  },

  async _syncKey(fullKey, value, uid) {
    // Sessions
    if (fullKey.startsWith('pb_session_') && !fullKey.includes('index') && !fullKey.includes('cache')) {
      await _upsert('sessions', {
        user_id: uid, session_key: fullKey.replace('pb_',''),
        data: value, date: value?.date||new Date().toISOString(),
        theme: value?.theme||null, duration: value?.duration||null,
      }, 'user_id,session_key');
      return;
    }
    // Custom exercises
    if (fullKey === 'pb_custom_exercises') {
      const list = Array.isArray(value) ? value : [];
      for (const ex of list) {
        await _upsert('custom_exercises', { user_id:uid, exercise_id:ex.id, data:ex }, 'user_id,exercise_id');
      }
      return;
    }
    // Custom goals
    if (fullKey === 'pb_custom_goals') {
      const list = Array.isArray(value) ? value : [];
      for (const g of list) {
        await _upsert('custom_goals', { user_id:uid, goal_id:g.id, data:g }, 'user_id,goal_id');
      }
      return;
    }
    // Profile
    if (fullKey === 'pb_profile') {
      await _upsert('profile', { user_id:uid, data:value }, 'user_id');
      return;
    }
    // Session index
    if (fullKey === 'pb_session_index') {
      await _upsert('session_index', { user_id:uid, data:value }, 'user_id');
      return;
    }
    // Overrides (library_overrides, goal_overrides, goal_milestone_overrides)
    if (fullKey.startsWith('pb_') && (fullKey.includes('override') || fullKey.includes('_cache'))) {
      const storeKey = fullKey.replace('pb_','');
      const table = fullKey.includes('cache') ? 'cache' : 'overrides';
      const keyCol = fullKey.includes('cache') ? 'cache_key' : 'store_key';
      await _upsert(table, { user_id:uid, [keyCol]:storeKey, data:value }, `user_id,${keyCol}`);
      return;
    }
  },

  // Pull all data from Supabase into localStorage
  async pull() {
    if (!Auth.isLoggedIn()) return;
    const user = await Auth.getUser(); if (!user) return;
    const uid = user.id;
    console.log('Pulling data for user', uid);

    const [profile, sidx, sessions, exes, goals, ovRows, cacheRows] = await Promise.all([
      _rest('profile',          'GET', { eq:{user_id:uid}, select:'data' }),
      _rest('session_index',    'GET', { eq:{user_id:uid}, select:'data' }),
      _rest('sessions',         'GET', { eq:{user_id:uid}, select:'session_key,data', order:'date.desc', limit:50 }),
      _rest('custom_exercises', 'GET', { eq:{user_id:uid}, select:'data' }),
      _rest('custom_goals',     'GET', { eq:{user_id:uid}, select:'data' }),
      _rest('overrides',        'GET', { eq:{user_id:uid}, select:'store_key,data' }),
      _rest('cache',            'GET', { eq:{user_id:uid}, select:'cache_key,data' }),
    ]);

    if (Array.isArray(profile)  && profile[0])  localStorage.setItem('pb_profile',          JSON.stringify(profile[0].data));
    if (Array.isArray(sidx)     && sidx[0])     localStorage.setItem('pb_session_index',    JSON.stringify(sidx[0].data));
    if (Array.isArray(sessions))                sessions.forEach(s  => localStorage.setItem('pb_'+s.session_key, JSON.stringify(s.data)));
    if (Array.isArray(exes))                    localStorage.setItem('pb_custom_exercises', JSON.stringify(exes.map(e=>e.data)));
    if (Array.isArray(goals))                   localStorage.setItem('pb_custom_goals',     JSON.stringify(goals.map(g=>g.data)));
    if (Array.isArray(ovRows))                  ovRows.forEach(r   => localStorage.setItem('pb_'+r.store_key,   JSON.stringify(r.data)));
    if (Array.isArray(cacheRows))               cacheRows.forEach(r => localStorage.setItem('pb_'+r.cache_key,  JSON.stringify(r.data)));

    console.log('Pull complete');
  },

  exportAll() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.PREFIX)) {
        try { out[k.slice(this.PREFIX.length)] = JSON.parse(localStorage.getItem(k)); }
        catch { out[k.slice(this.PREFIX.length)] = localStorage.getItem(k); }
      }
    }
    return out;
  },

  importAll(data) { Object.entries(data).forEach(([k,v]) => this.set(k,v)); },
});

// ── AUTH UI ────────────────────────────────────────────────────
const AuthUI = {
  show() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-root').style.display    = 'none';
  },
  hide() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-root').style.display    = 'block';
  },
  setError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
  },
  setLoading(yes) {
    const btn = document.getElementById('auth-btn');
    const mode = document.getElementById('auth-mode')?.dataset.mode || 'signin';
    if (btn) btn.textContent = yes ? 'Please wait…' : (mode === 'signin' ? 'Sign in' : 'Create account');
  },
};

async function authSubmit() {
  const email    = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value;
  const mode     = document.getElementById('auth-mode')?.dataset.mode || 'signin';
  if (!email || !password) return AuthUI.setError('Email and password required.');
  if (password.length < 6) return AuthUI.setError('Password must be at least 6 characters.');
  // Only allow your account
  const ALLOWED = 'jpmart96@gmail.com';
  if (email.toLowerCase() !== ALLOWED) return AuthUI.setError('Access denied.');
  AuthUI.setError(''); AuthUI.setLoading(true);
  try {
    if (mode === 'signup') {
      await Auth.signUp(email, password);
      // Auto sign in after signup (works when email confirmation is off)
      await Auth.signIn(email, password);
      await DB.pull();
      AuthUI.hide();
      App.init(); renderHome();
    } else {
      await Auth.signIn(email, password);
      await DB.pull();
      AuthUI.hide();
      App.init(); renderHome();
    }
  } catch(e) {
    AuthUI.setError(e.message || 'Something went wrong. Try again.');
  }
  AuthUI.setLoading(false);
}

function setAuthMode(mode) {
  const modeEl = document.getElementById('auth-mode');
  const btn    = document.getElementById('auth-btn');
  const toggle = document.getElementById('auth-toggle');
  if (!modeEl) return;
  modeEl.dataset.mode = mode;
  if (btn)    btn.textContent    = mode === 'signin' ? 'Sign in' : 'Create account';
  if (toggle) toggle.textContent = mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in';
  AuthUI.setError('');
}

function toggleAuthMode() {
  const current = document.getElementById('auth-mode')?.dataset.mode || 'signin';
  setAuthMode(current === 'signin' ? 'signup' : 'signin');
}

async function signOut() {
  if (!confirm('Sign out?')) return;
  await Auth.signOut();
  location.reload();
}

// ── BOOT ───────────────────────────────────────────────────────
async function boot() {
  const user = await Auth.getUser();
  if (!user) { AuthUI.show(); return; }
  await DB.pull();
  AuthUI.hide();
  App.init();
  renderHome();
}

// ── MANUAL SYNC ────────────────────────────────────────────────
async function manualSync() {
  const status = document.getElementById('sync-status');
  if (status) { status.textContent = 'Syncing…'; status.style.color = 'var(--text3)'; }
  try {
    clearTimeout(DB._flushTimer);
    await DB._flush();       // push any pending local writes first
    await DB.pull();         // pull fresh from Supabase
    App.profile = Profile.load();
    const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    if (status) { status.textContent = `Synced ✓ ${time}`; status.style.color = 'var(--accent2)'; }
    // Re-render current screen
    if (App.screen === 'home')     renderHome();
    if (App.screen === 'goals')    renderGoals();
    if (App.screen === 'settings') renderSettings();
    if (App.screen === 'log')      renderLog();
  } catch(e) {
    console.error('Sync error:', e);
    if (status) { status.textContent = 'Sync failed — check connection'; status.style.color = 'var(--danger)'; }
  }
}
