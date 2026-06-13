// ─────────────────────────────────────────────────────────────
// PRACTICE BRAIN — SUPABASE SYNC
// sync.js — replaces localStorage DB with Supabase
// ─────────────────────────────────────────────────────────────

'use strict';

const SUPABASE_URL = 'https://smaxfmxcxsmtjnwlysiv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYXhmbXhjeHNtdGpud2x5c2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTYwMjQsImV4cCI6MjA5NjkzMjAyNH0.3S6Oh0rrSKhvNuKXzXrEnMXZOgzBz7085K1ofN8_Lzg';

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────
const Auth = {
  _user: null,

  async signUp(email, password) {
    const res = await _sbFetch('/auth/v1/signup', 'POST', { email, password });
    if (res.error) throw new Error(res.error.message || 'Sign up failed');
    return res;
  },

  async signIn(email, password) {
    const res = await _sbFetch('/auth/v1/token?grant_type=password', 'POST', { email, password });
    if (res.error) throw new Error(res.error.message || 'Sign in failed');
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
    // Check token not expired
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        // Try refresh
        const res = await _sbFetch('/auth/v1/token?grant_type=refresh_token', 'POST',
          { refresh_token: session.refresh_token });
        if (res.error || !res.access_token) { localStorage.removeItem('sb_session'); return null; }
        _saveSession(res);
        this._user = res.user;
        return res.user;
      }
      this._user = session.user;
      return session.user;
    } catch { return null; }
  },

  isLoggedIn() { return !!_loadSession(); },
};

function _saveSession(res) {
  localStorage.setItem('sb_session', JSON.stringify({
    access_token:  res.access_token,
    refresh_token: res.refresh_token,
    user:          res.user,
  }));
}
function _loadSession() {
  try { return JSON.parse(localStorage.getItem('sb_session')); } catch { return null; }
}
function _getToken() {
  const s = _loadSession(); return s?.access_token || null;
}

// ─────────────────────────────────────────────────────────────
// LOW-LEVEL FETCH
// ─────────────────────────────────────────────────────────────
async function _sbFetch(path, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Prefer':        'return=representation',
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(SUPABASE_URL + path, opts);
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('Supabase fetch error:', e);
    return { error: { message: e.message } };
  }
}

// PostgREST helper
async function _rest(table, method, params = {}, body = null) {
  const token = _getToken();
  let path = `/rest/v1/${table}`;
  const qs = [];
  if (params.select)  qs.push(`select=${params.select}`);
  if (params.eq)      Object.entries(params.eq).forEach(([k,v]) => qs.push(`${k}=eq.${v}`));
  if (params.order)   qs.push(`order=${params.order}`);
  if (params.limit)   qs.push(`limit=${params.limit}`);
  if (qs.length)      path += '?' + qs.join('&');
  return _sbFetch(path, method, body, token);
}

// ─────────────────────────────────────────────────────────────
// DB EXTENSION — adds Supabase sync to the existing DB object
// DB is already defined in app.js; we extend it here
// ─────────────────────────────────────────────────────────────

// Map from localStorage key prefix → supabase table + column
const KEY_MAP = {
  'pb_profile':                   { table: 'profile',       col: 'data',  keyCol: null },
  'pb_session_index':             { table: 'session_index', col: 'data',  keyCol: null },
  'pb_ex_cache':                  { table: 'cache',         col: 'data',  keyCol: 'cache_key', keyVal: 'ex_cache' },
  'pb_goal_cache':                { table: 'cache',         col: 'data',  keyCol: 'cache_key', keyVal: 'goal_cache' },
  'pb_library_overrides':         { table: 'overrides',     col: 'data',  keyCol: 'store_key', keyVal: 'library_overrides' },
  'pb_goal_overrides':            { table: 'overrides',     col: 'data',  keyCol: 'store_key', keyVal: 'goal_overrides' },
  'pb_goal_milestone_overrides':  { table: 'overrides',     col: 'data',  keyCol: 'store_key', keyVal: 'goal_milestone_overrides' },
};

// Extend the DB object defined in app.js with sync methods
Object.assign(DB, {
  _queue: [], // pending writes to flush
  _flushTimer: null,

  _key(k) { return this.PREFIX + k; },

  // Synchronous read — from localStorage cache
  get(k) {
    try {
      const raw = localStorage.getItem(this._key(k));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  // Write — localStorage immediately, Supabase async
  set(k, v) {
    try {
      localStorage.setItem(this._key(k), JSON.stringify(v));
      this._scheduleSync(this._key(k), v);
      return true;
    } catch { return false; }
  },

  remove(k) {
    localStorage.removeItem(this._key(k));
    // Mark for deletion in Supabase (handled by sync)
  },

  // Queue a sync and flush after 500ms debounce
  _scheduleSync(fullKey, value) {
    // Remove any existing queued write for this key
    this._queue = this._queue.filter(q => q.key !== fullKey);
    this._queue.push({ key: fullKey, value });
    clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => this._flush(), 500);
  },

  async _flush() {
    if (!Auth.isLoggedIn()) return;
    const user = await Auth.getUser();
    if (!user) return;
    const uid = user.id;
    const batch = [...this._queue];
    this._queue = [];

    for (const { key, value } of batch) {
      await this._syncKey(key, value, uid);
    }
  },

  async _syncKey(fullKey, value, uid) {
    // Session keys: pb_session_XXXXXXXXX
    if (fullKey.startsWith('pb_session_') && !fullKey.includes('index') && !fullKey.includes('cache')) {
      const sessionKey = fullKey.replace('pb_', '');
      await _rest('sessions', 'POST', {}, {
        user_id:     uid,
        session_key: sessionKey,
        data:        value,
        date:        value?.date || new Date().toISOString(),
        theme:       value?.theme || null,
        duration:    value?.duration || null,
      });
      // Upsert
      await _rest('sessions', 'POST', {}, {
        user_id:     uid,
        session_key: sessionKey,
        data:        value,
        date:        value?.date || new Date().toISOString(),
        theme:       value?.theme || null,
        duration:    value?.duration || null,
      });
      return;
    }

    // Custom exercises: pb_custom_exercises
    if (fullKey === 'pb_custom_exercises') {
      const exercises = Array.isArray(value) ? value : [];
      for (const ex of exercises) {
        await _upsert('custom_exercises', uid, { exercise_id: ex.id, data: ex, user_id: uid }, 'exercise_id', ex.id);
      }
      return;
    }

    // Custom goals: pb_custom_goals
    if (fullKey === 'pb_custom_goals') {
      const goals = Array.isArray(value) ? value : [];
      for (const g of goals) {
        await _upsert('custom_goals', uid, { goal_id: g.id, data: g, user_id: uid }, 'goal_id', g.id);
      }
      return;
    }

    // Mapped keys
    const mapped = KEY_MAP[fullKey];
    if (!mapped) return;

    const row = { user_id: uid, [mapped.col]: value, updated_at: new Date().toISOString() };
    if (mapped.keyCol) row[mapped.keyCol] = mapped.keyVal;

    await _upsert(mapped.table, uid, row, mapped.keyCol || 'user_id', mapped.keyVal || uid);
  },

  // Pull all data from Supabase into localStorage
  async pull() {
    if (!Auth.isLoggedIn()) return;
    const user = await Auth.getUser();
    if (!user) return;
    const uid = user.id;

    // Profile
    const profile = await _rest('profile', 'GET', { eq: { user_id: uid }, select: 'data' });
    if (Array.isArray(profile) && profile[0]) {
      localStorage.setItem('pb_profile', JSON.stringify(profile[0].data));
    }

    // Session index
    const sidx = await _rest('session_index', 'GET', { eq: { user_id: uid }, select: 'data' });
    if (Array.isArray(sidx) && sidx[0]) {
      localStorage.setItem('pb_session_index', JSON.stringify(sidx[0].data));
    }

    // Sessions (last 50)
    const sessions = await _rest('sessions', 'GET', { eq: { user_id: uid }, select: 'session_key,data', order: 'date.desc', limit: 50 });
    if (Array.isArray(sessions)) {
      sessions.forEach(s => localStorage.setItem('pb_' + s.session_key, JSON.stringify(s.data)));
    }

    // Custom exercises
    const exes = await _rest('custom_exercises', 'GET', { eq: { user_id: uid }, select: 'data' });
    if (Array.isArray(exes)) {
      localStorage.setItem('pb_custom_exercises', JSON.stringify(exes.map(e => e.data)));
    }

    // Custom goals
    const goals = await _rest('custom_goals', 'GET', { eq: { user_id: uid }, select: 'data' });
    if (Array.isArray(goals)) {
      localStorage.setItem('pb_custom_goals', JSON.stringify(goals.map(g => g.data)));
    }

    // Overrides + caches
    const ovRows = await _rest('overrides', 'GET', { eq: { user_id: uid }, select: 'store_key,data' });
    if (Array.isArray(ovRows)) {
      ovRows.forEach(r => localStorage.setItem('pb_' + r.store_key, JSON.stringify(r.data)));
    }

    const cacheRows = await _rest('cache', 'GET', { eq: { user_id: uid }, select: 'cache_key,data' });
    if (Array.isArray(cacheRows)) {
      cacheRows.forEach(r => localStorage.setItem('pb_' + r.cache_key, JSON.stringify(r.data)));
    }
  },

  exportAll() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(this.PREFIX)) {
        try { out[k.slice(this.PREFIX.length)] = JSON.parse(localStorage.getItem(k)); }
        catch { out[k.slice(this.PREFIX.length)] = localStorage.getItem(k); }
      }
    }
    return out;
  },

  importAll(data) {
    Object.entries(data).forEach(([k, v]) => this.set(k, v));
  },
});

async function _upsert(table, uid, row, conflictCol, conflictVal) {
  // Try update first, then insert
  const existing = await _rest(table, 'GET', {
    eq: { user_id: uid, [conflictCol]: conflictVal },
    select: 'id',
  });
  if (Array.isArray(existing) && existing.length > 0) {
    await _rest(table, 'PATCH', { eq: { user_id: uid, [conflictCol]: conflictVal } }, row);
  } else {
    await _rest(table, 'POST', {}, row);
  }
}

// ─────────────────────────────────────────────────────────────
// AUTH UI — login screen rendered before app loads
// ─────────────────────────────────────────────────────────────
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
    if (btn) btn.textContent = yes ? 'Please wait…' : (document.getElementById('auth-mode').dataset.mode === 'signin' ? 'Sign in' : 'Create account');
  },
};

async function authSubmit() {
  const email    = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value;
  const mode     = document.getElementById('auth-mode')?.dataset.mode || 'signin';
  if (!email || !password) return AuthUI.setError('Email and password required.');
  AuthUI.setError(''); AuthUI.setLoading(true);
  try {
    if (mode === 'signup') {
      await Auth.signUp(email, password);
      AuthUI.setError('Account created — check your email to confirm, then sign in.');
      setAuthMode('signin');
    } else {
      await Auth.signIn(email, password);
      await DB.pull();
      AuthUI.hide();
      App.init();
      renderHome();
    }
  } catch(e) {
    AuthUI.setError(e.message);
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

// ─────────────────────────────────────────────────────────────
// BOOT — check auth on page load
// ─────────────────────────────────────────────────────────────
async function boot() {
  const user = await Auth.getUser();
  if (!user) {
    AuthUI.show();
    return;
  }
  // Logged in — pull fresh data then start app
  await DB.pull();
  AuthUI.hide();
  App.init();
  renderHome();
}
