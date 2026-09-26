'use strict';

const SUPABASE_URL = 'https://smaxfmxcxsmtjnwlysiv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYXhmbXhjeHNtdGpud2x5c2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTYwMjQsImV4cCI6MjA5NjkzMjAyNH0.3S6Oh0rrSKhvNuKXzXrEnMXZOgzBz7085K1ofN8_Lzg';

// Storage keys owned by the sync layer. Deliberately NOT under DB.PREFIX
// ('pb_') so every prefix scan in the app (DB.exportAll, backups, anything
// that walks localStorage for 'pb_' keys) skips them without having to know
// they exist — they are bookkeeping, not app data, and must never be synced,
// pulled, exported or re-imported.
const OUTBOX_KEY     = 'sb_outbox';
const TOMBSTONES_KEY = 'sb_tombstones';
// Pseudo storage key the outbox uses for "push the tombstone set".
const TOMBSTONE_ITEM = 'sb:tombstones';
// Refresh the access token when it has less than this left. A request that
// starts with 5s of validity can still arrive expired.
const TOKEN_MIN_VALID_MS = 60 * 1000;

// ── LOW-LEVEL FETCH ────────────────────────────────────────────
// Always resolves to { ok, status, data, error }. It used to return the
// parsed body on success and { error } on failure, and every caller except
// signIn ignored the difference — a 401 looked like a successful upload.
// status 0 means the request never got an answer (offline, DNS, CORS).
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
    if (!res.ok) {
      console.warn('Supabase error', res.status, method, path.split('?')[0], text.slice(0, 200));
      return { ok: false, status: res.status, data: null, error: text || ('HTTP ' + res.status) };
    }
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = text; }
    return { ok: true, status: res.status, data, error: null };
  } catch (e) {
    console.warn('Supabase fetch error:', e && e.message);
    return { ok: false, status: 0, data: null, error: (e && e.message) || 'network error' };
  }
}

// Authenticated request: makes sure the token is fresh first, and if the
// server still says 401 (revoked, clock skew) forces one refresh and retries
// once. Returns the same shape as _sbFetch.
async function _authed(path, method, body, extraHeaders) {
  let token = await Auth._ensureToken();
  if (!token) return { ok: false, status: 0, data: null, error: 'no valid session token (offline or signed out)' };
  let res = await _sbFetch(path, method, body, token, extraHeaders);
  if (res.status === 401) {
    token = await Auth._ensureToken(true);
    if (!token) return res;
    res = await _sbFetch(path, method, body, token, extraHeaders);
  }
  return res;
}

// PostgREST REST helper
function _inList(values) {
  // Quoted so ids containing commas/parens can't break the list.
  return '(' + values.map(v => '"' + encodeURIComponent(String(v).replace(/"/g, '\\"')) + '"').join(',') + ')';
}
async function _rest(table, method, params = {}, body = null, extraHeaders = {}) {
  let path = `/rest/v1/${table}`;
  const qs = [];
  if (params.select) qs.push(`select=${params.select}`);
  if (params.eq)     Object.entries(params.eq).forEach(([k,v]) => qs.push(`${k}=eq.${encodeURIComponent(v)}`));
  if (params.in)     Object.entries(params.in).forEach(([k,vs]) => qs.push(`${k}=in.${_inList(vs)}`));
  if (params.order)  qs.push(`order=${params.order}`);
  if (params.limit)  qs.push(`limit=${params.limit}`);
  if (qs.length)     path += '?' + qs.join('&');
  return _authed(path, method, body, extraHeaders);
}

// True upsert using PostgREST's on-conflict. `rows` may be one row or an
// array (bulk upsert — one request for a whole custom list instead of N).
async function _upsert(table, rows, onConflict) {
  return _authed(
    `/rest/v1/${table}?on_conflict=${onConflict}`,
    'POST', rows,
    { 'Prefer': 'resolution=merge-duplicates,return=minimal' }
  );
}

// ── AUTH ───────────────────────────────────────────────────────
function _b64urlJson(part) {
  // JWTs are base64url; atob() throws on '-'/'_' and on missing padding,
  // which used to make getUser() report "signed out" for some tokens.
  let s = part.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return JSON.parse(atob(s));
}
function _tokenExpMs(token) {
  try { return _b64urlJson(token.split('.')[1]).exp * 1000; } catch { return 0; }
}

const Auth = {
  _user: null,
  _refreshing: null,   // single-flight refresh promise shared by concurrent callers
  offline: false,      // last refresh attempt could not reach the server

  async signUp(email, password) {
    const res = await _sbFetch('/auth/v1/signup', 'POST', { email, password });
    if (!res.ok) throw new Error(typeof res.error === 'string' && res.status ? res.error : 'Sign up failed');
    return res.data;
  },

  async signIn(email, password) {
    const res = await _sbFetch('/auth/v1/token?grant_type=password', 'POST', { email, password });
    if (!res.ok || !res.data || !res.data.access_token) {
      throw new Error(res.status === 0 ? 'No connection — try again when online' : 'Invalid email or password');
    }
    _saveSession(res.data);
    this._user = res.data.user;
    this.offline = false;
    return res.data.user;
  },

  async signOut() {
    // Last chance to get pending changes up before the token goes away.
    // Whatever doesn't make it stays in the outbox for the next sign-in.
    try { await DB._flush(); } catch {}
    const token = _getToken();
    if (token) await _sbFetch('/auth/v1/logout', 'POST', {}, token);
    localStorage.removeItem('sb_session');
    this._user = null;
  },

  // Returns an access token valid for at least TOKEN_MIN_VALID_MS, refreshing
  // it if needed, or null when there is none to be had right now (signed
  // out, or offline with an expired token). `force` refreshes regardless —
  // used after a 401.
  //
  // This used to happen only inside getUser(), whose in-memory cache meant it
  // ran once per app launch: an app opened at 08:50 kept sending the 08:50
  // token all morning, and every upload after 09:50 was a silent 401.
  async _ensureToken(force = false) {
    const session = _loadSession();
    if (!session || !session.access_token) return null;
    if (!force && _tokenExpMs(session.access_token) - Date.now() > TOKEN_MIN_VALID_MS) {
      return session.access_token;
    }
    if (!this._refreshing) {
      this._refreshing = this._refresh(session).finally(() => { this._refreshing = null; });
    }
    return this._refreshing;
  },

  async _refresh(session) {
    const res = await _sbFetch('/auth/v1/token?grant_type=refresh_token', 'POST',
      { refresh_token: session.refresh_token });
    if (res.ok && res.data && res.data.access_token) {
      _saveSession({ ...res.data,
        refresh_token: res.data.refresh_token || session.refresh_token,
        user: res.data.user || session.user });
      if (res.data.user) this._user = res.data.user;
      this.offline = false;
      return res.data.access_token;
    }
    if (res.status === 400 || res.status === 401) {
      // Another tab may have rotated the refresh token under us — if storage
      // now holds a different one, that session is good; use it.
      const now = _loadSession();
      if (now && now.refresh_token !== session.refresh_token &&
          _tokenExpMs(now.access_token) - Date.now() > TOKEN_MIN_VALID_MS) {
        return now.access_token;
      }
      // The server positively rejected the refresh token (revoked, expired,
      // reused): the only case where signing out is right. The outbox is
      // left alone and flushes after the next sign-in.
      console.warn('Auth: refresh token rejected (' + res.status + ') — signing out');
      localStorage.removeItem('sb_session');
      this._user = null;
      return null;
    }
    // Network failure / 5xx / 429: keep the session, run offline, retry later.
    // Signing out here is what used to put the login screen in front of an
    // in-progress workout in a gym with no signal.
    this.offline = true;
    return null;
  },

  // The user object may be cached; token validity is re-checked every call.
  // Offline with an expired token still returns the stored user so the app
  // runs on local data — only a rejected refresh token returns null.
  async getUser() {
    const session = _loadSession();
    if (!session) { this._user = null; return null; }
    await this._ensureToken();
    if (!_loadSession()) return null;   // refresh token was rejected
    return this._user || session.user || null;
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

// ── HELPERS ────────────────────────────────────────────────────
function _isQuotaError(e) {
  return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                 e.code === 22 || e.code === 1014);
}
function _readJSON(key) {
  try { const raw = localStorage.getItem(key); return raw == null ? null : JSON.parse(raw); } catch { return null; }
}
function _sameJSON(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// How much real training a session / daily instance holds. Used to decide
// between a local and a remote copy of the same record: the one with more
// logged work wins, ties go to the server (another device may have edited
// the plan — trade, swap, chat override — without logging anything).
// A completed record always beats an unfinished one.
function _workScore(s) {
  if (!s || typeof s !== 'object') return -1;
  let n = s.status === 'completed' ? 100000 : 0;
  (s.blocks || []).forEach(b => (b.exercises || []).forEach(e => {
    if (e && e.completed) n += 2;
    if (e && Array.isArray(e.sets)) n += e.sets.length;
  }));
  return n;
}

// The session_index entry History.saveSession writes, derived from the
// session itself — used to (re)build entries the index is missing.
function _indexEntryFrom(id, s, row) {
  s = s || {};
  row = row || {};
  const e = {
    id,
    date:     s.date || (row.date ? String(row.date).slice(0, 10) : null),
    theme:    s.theme ?? row.theme ?? null,
    themes:   s.themes,
    duration: s.duration ?? row.duration ?? null,
    source:   s.source || 'generated',
    status:   s.status || 'completed',
  };
  // Undefined fields would blank the existing entry's values when spread.
  Object.keys(e).forEach(k => { if (e[k] === undefined || e[k] === null && k !== 'id') delete e[k]; });
  return e;
}
function _idNum(id) { const m = /(\d+)$/.exec(id || ''); return m ? +m[1] : 0; }
// Most recent first, which is what every History.getIndex caller assumes.
function _indexSort(a, b) {
  const da = String(a.date || '').slice(0, 10), db = String(b.date || '').slice(0, 10);
  if (da !== db) return da < db ? 1 : -1;
  return _idNum(b.id) - _idNum(a.id);
}

// Which remote table a storage key syncs to, or null if it is local-only
// (pb_active_session, pb_exercise_ideas, …). Only routed keys enter the
// outbox — an unroutable key would otherwise sit there forever.
// Order matters and mirrors the original _syncKey if-chain.
function _route(fullKey) {
  if (fullKey === TOMBSTONE_ITEM) return 'tombstones';
  if (fullKey.startsWith('pb_session_') && !fullKey.includes('index') && !fullKey.includes('cache')) return 'session';
  if (fullKey === 'pb_custom_exercises') return 'custom_exercises';
  if (fullKey === 'pb_custom_goals')     return 'custom_goals';
  if (fullKey === 'pb_plan_notes')       return 'plan_notes';
  if (fullKey === 'pb_profile')          return 'profile';
  if (fullKey === 'pb_session_index')    return 'session_index';
  if (fullKey.startsWith('pb_') && (fullKey.includes('override') || fullKey.includes('_cache'))) return 'override';
  if (fullKey.startsWith('pb_daily_instance_')) return 'daily_instance';
  if (fullKey === 'pb_month_plan')       return 'month_plan';
  if (fullKey === 'pb_hevy_aliases')     return 'hevy_aliases';
  if (fullKey === 'pb_vitals')           return 'vitals';
  if (fullKey === 'pb_week_scaffold')    return 'week_scaffold';
  return null;
}
const _LISTS = {
  pb_custom_exercises: { table: 'custom_exercises', idCol: 'exercise_id' },
  pb_custom_goals:     { table: 'custom_goals',     idCol: 'goal_id' },
  // Notes tab (js/notes.js). One row per note so a plan review can query
  // them directly (see plan_notes in supabase_schema.sql).
  pb_plan_notes:       { table: 'plan_notes',       idCol: 'note_id' },
};

// The profile as it may leave the device: the Anthropic API key is
// device-local ("Stored only on this device" in Settings) and must never
// reach Supabase.
function _profileForPush(p) {
  if (!p || typeof p !== 'object') return p;
  const out = { ...p };
  if (out.settings && typeof out.settings === 'object') {
    out.settings = { ...out.settings };
    delete out.settings.anthropicApiKey;
  }
  return out;
}

// ── DB EXTENSION ───────────────────────────────────────────────
// Extends the DB object from app.js with Supabase sync.
//
// Writes go to localStorage immediately and the storage KEY goes into a
// persisted outbox (OUTBOX_KEY). The flush reads the current value at send
// time, so repeated writes coalesce and the latest value wins, and an item
// leaves the outbox only after the server confirmed it with a 2xx. The old
// design emptied an in-memory queue before sending and ignored the result,
// so any failure (expired token, no signal, app killed within 800ms) lost
// the change for good — and the next pull then overwrote the local copy
// with the server's older one.
Object.assign(DB, {
  _flushTimer: null,
  _retryTimer: null,
  _retryFails: 0,
  _flushing: null,
  _obMem: null,        // in-memory mirror of the outbox (source of truth if storage is full)
  _memValues: {},      // values that could not be written to localStorage (quota) — kept for upload
  _pullWatch: null,    // keys written while a pull is in flight
  _seq: 0,
  lastError: null,
  lastOkAt: null,

  // ── outbox storage ──
  _obRead() {
    const stored = _readJSON(OUTBOX_KEY);
    if (stored && stored.items && typeof stored.items === 'object') {
      // Keep in-memory-only items (outbox write failed on quota) alongside.
      if (this._obMem && this._obPersistFailed) Object.entries(this._obMem.items).forEach(([k, it]) => {
        if (!stored.items[k] || (stored.items[k].v || 0) < (it.v || 0)) stored.items[k] = it;
      });
      return stored;
    }
    return this._obMem || { items: {} };
  },
  _obWrite(ob) {
    this._obMem = ob;
    try {
      if (Object.keys(ob.items).length) localStorage.setItem(OUTBOX_KEY, JSON.stringify(ob));
      else localStorage.removeItem(OUTBOX_KEY);
      this._obPersistFailed = false;
    } catch (e) {
      this._obPersistFailed = true;
      // Still held in memory for this app run; flushes normally.
      console.warn('Sync: could not persist outbox', e && e.name);
    }
  },
  pendingCount() { return Object.keys(this._obRead().items).length; },
  _isPending(fullKey) { return !!this._obRead().items[fullKey]; },

  _emit(extra = {}) {
    if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
    try {
      window.dispatchEvent(new CustomEvent('sync-status', { detail: {
        pending: this.pendingCount(), lastError: this.lastError, lastOkAt: this.lastOkAt, ...extra,
      }}));
    } catch {}
  },

  // Put a key in the outbox. op: 'set' | 'delete'. opts.removed: list ids to
  // delete remotely (accumulates across coalesced writes).
  _enqueue(fullKey, op = 'set', opts = {}) {
    const ob = this._obRead();
    const prev = ob.items[fullKey];
    const item = { op, v: Date.now() * 1000 + (this._seq++ % 1000), at: Date.now() };
    const removed = new Set([...(prev && prev.removed || []), ...(opts.removed || [])]);
    if (removed.size) item.removed = [...removed];
    ob.items[fullKey] = item;
    this._obWrite(ob);
    if (this._pullWatch) this._pullWatch.add(fullKey);
    clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => this._flush(), 800);
  },

  // Override set — write localStorage immediately, queue Supabase sync
  set(k, v) {
    const fullKey = this.PREFIX + k;
    const route = _route(fullKey);
    // Deletions from a custom list: ids present before this write and gone
    // after it. Tombstoned so the other device's next pull drops them too,
    // and deleted remotely by the flush (upserting the survivors never
    // removed anything, so a deleted exercise used to come back).
    let removed = null;
    if (_LISTS[fullKey] && Array.isArray(v)) {
      const before = _readJSON(fullKey);
      if (Array.isArray(before)) {
        const now = new Set(v.map(x => x && x.id));
        removed = before.map(x => x && x.id).filter(id => id && !now.has(id));
        if (removed.length) this._addTombstones(_LISTS[fullKey].table, removed);
      }
      this._reviveTombstones(_LISTS[fullKey].table, v.map(x => x && x.id).filter(Boolean));
    }
    let ok = true;
    try {
      localStorage.setItem(fullKey, JSON.stringify(v));
      delete this._memValues[fullKey];
    } catch (e) {
      ok = false;
      // Storage full: the value can't stay on this device, but it can still
      // reach the server — hold it in memory and upload it. Without this a
      // finished session hitting the quota was lost locally AND never queued.
      if (route) this._memValues[fullKey] = v;
      console.error('DB.set failed for', fullKey, e && e.name);
      this.lastError = _isQuotaError(e) ? 'Storage full on this device' : ('Local save failed: ' + (e && e.message));
      this._emit({ quota: _isQuotaError(e), key: fullKey });
    }
    if (route) this._enqueue(fullKey, 'set', { removed });
    return ok;
  },

  // Override remove — a removed session or daily instance is deleted on the
  // server too (a deleted session used to linger remotely and, once pull
  // rebuilds the index from the sessions table, would come back).
  remove(k) {
    const fullKey = this.PREFIX + k;
    try { localStorage.removeItem(fullKey); } catch {}
    delete this._memValues[fullKey];
    const route = _route(fullKey);
    if (route === 'session') {
      this._addTombstones('sessions', [fullKey.replace('pb_', '')]);
      this._enqueue(fullKey, 'delete');
    } else if (route === 'daily_instance') {
      this._enqueue(fullKey, 'delete');
    } else if (route && this._isPending(fullKey)) {
      // Nothing left to upload for it.
      const ob = this._obRead(); delete ob.items[fullKey]; this._obWrite(ob);
    }
  },

  // ── tombstones ──
  // { sessions|custom_exercises|custom_goals|plan_notes: { id: ±ms } }, kept
  // locally and mirrored to a reserved `overrides` row so deletions reach
  // other devices. Needed because "on the server but not on this device"
  // and "deleted on another device" otherwise look identical, and the safe
  // reading of that (push local-only items up) would resurrect deletes.
  // If the server is ever wiped (20 Sep), the tombstones go with it and
  // local items get pushed back up — the failure mode is resurrection,
  // never loss.
  // A positive value is "deleted at ms"; a negative one is "re-added at |ms|"
  // (an id deleted and later restored, e.g. by re-importing a DLC file with
  // fixed ids). Merging keeps the later |ms| per id, so a restore can
  // override a delete across devices instead of being re-deleted forever.
  _tombstones() {
    const t = _readJSON(TOMBSTONES_KEY) || {};
    ['sessions', 'custom_exercises', 'custom_goals', 'plan_notes'].forEach(k => { if (!t[k] || typeof t[k] !== 'object') t[k] = {}; });
    return t;
  },
  _saveTombstones(t) { try { localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(t)); } catch {} },
  _addTombstones(kind, ids) {
    const t = this._tombstones(); const now = Date.now();
    ids.forEach(id => { t[kind][id] = now; });
    this._saveTombstones(t);
    this._enqueue(TOMBSTONE_ITEM, 'set');
  },
  _reviveTombstones(kind, ids) {
    const t = this._tombstones(); const now = Date.now();
    const revived = ids.filter(id => t[kind][id] > 0);
    if (!revived.length) return;
    revived.forEach(id => { t[kind][id] = -now; });
    this._saveTombstones(t);
    this._enqueue(TOMBSTONE_ITEM, 'set');
  },

  // Push everything in the outbox. Single-flight; resolves to
  // { pending, lastError } so callers can report honestly.
  async _flush() {
    if (this._flushing) return this._flushing;
    this._flushing = this._flushOnce().finally(() => { this._flushing = null; });
    return this._flushing;
  },

  async _flushOnce() {
    clearTimeout(this._flushTimer);
    clearTimeout(this._retryTimer);
    const keys = Object.keys(this._obRead().items);
    if (!keys.length) { this._retryFails = 0; this._emit(); return { pending: 0, lastError: null }; }
    if (!Auth.isLoggedIn()) {
      this.lastError = 'Signed out — sign in again to sync';
      this._emit();
      return { pending: keys.length, lastError: this.lastError };
    }
    const token = await Auth._ensureToken();
    const user = await Auth.getUser();
    if (!token || !user) {
      this.lastError = Auth.isLoggedIn() ? 'Offline — changes saved on this device' : 'Signed out';
      this._scheduleRetry(false);
      this._emit();
      return { pending: this.pendingCount(), lastError: this.lastError };
    }
    const uid = user.id;
    let anyFail = false;
    // Tombstones first, so a delete lands before anything could re-push it.
    keys.sort((a, b) => (b === TOMBSTONE_ITEM) - (a === TOMBSTONE_ITEM));
    for (const key of keys) {
      const item = this._obRead().items[key];
      if (!item) continue;
      let res;
      try { res = await this._syncKey(key, item, uid); }
      catch (e) { res = { ok: false, status: -1, error: (e && e.message) || String(e) }; }
      if (res && res.ok) {
        // Remove only if nothing newer was queued for this key meanwhile.
        const ob = this._obRead();
        if (ob.items[key] && ob.items[key].v === item.v) {
          delete ob.items[key]; this._obWrite(ob);
          delete this._memValues[key];
        }
        this.lastOkAt = Date.now();
      } else {
        anyFail = true;
        this.lastError = `${key.replace('pb_', '')}: ${res && res.status ? 'HTTP ' + res.status : 'offline'} ${String(res && res.error || '').slice(0, 120)}`.trim();
        console.warn('Sync: upload failed, kept in outbox —', this.lastError);
        // No connection / no token: the rest will fail the same way.
        if (!res || res.status === 0 || res.status === 401) break;
      }
    }
    const pending = this.pendingCount();
    if (!pending) { this.lastError = null; this._retryFails = 0; }
    else this._scheduleRetry(!anyFail);
    this._emit();
    return { pending, lastError: this.lastError };
  },

  // Backoff retry while the outbox is non-empty: 5s, 10s, 20s … 5 min.
  _scheduleRetry(progressed) {
    if (!this.pendingCount() || !Auth.isLoggedIn()) return;
    this._retryFails = progressed ? 0 : this._retryFails + 1;
    const delay = Math.min(5 * 60 * 1000, 5000 * Math.pow(2, this._retryFails));
    clearTimeout(this._retryTimer);
    this._retryTimer = setTimeout(() => this._flush(), delay);
  },

  // Current value to upload for a key: localStorage, or the in-memory copy
  // kept when storage was full. undefined = nothing to upload.
  _valueFor(fullKey) {
    if (Object.prototype.hasOwnProperty.call(this._memValues, fullKey)) return this._memValues[fullKey];
    const raw = localStorage.getItem(fullKey);
    if (raw == null) return undefined;
    try { return JSON.parse(raw); } catch { return undefined; }
  },

  // Send one outbox item. Returns a _sbFetch-shaped result; ok only if every
  // request it needed returned 2xx.
  async _syncKey(fullKey, item, uid) {
    const route = _route(fullKey);
    const OK = { ok: true, status: 200 };

    if (item.op === 'delete') {
      if (route === 'session') {
        return _rest('sessions', 'DELETE', { eq: { user_id: uid, session_key: fullKey.replace('pb_', '') } });
      }
      if (route === 'daily_instance') {
        return _rest('daily_instances', 'DELETE', { eq: { user_id: uid, date: fullKey.replace('pb_daily_instance_', '') } });
      }
      return OK;
    }

    if (route === 'tombstones') {
      return _upsert('overrides', { user_id: uid, store_key: '_tombstones', data: this._tombstones() }, 'user_id,store_key');
    }

    const value = this._valueFor(fullKey);
    if (value === undefined) return { ...OK, dropped: true };  // removed since it was queued

    // Sessions
    if (route === 'session') {
      return _upsert('sessions', {
        user_id: uid, session_key: fullKey.replace('pb_',''),
        data: value, date: value?.date||new Date().toISOString(),
        theme: value?.theme||null,
        // integer column — an imported 42.5-minute run would 400 forever
        duration: Number.isFinite(+value?.duration) && value?.duration !== null ? Math.round(+value.duration) : null,
      }, 'user_id,session_key');
    }
    // Custom exercises / goals: delete what was removed, bulk-upsert the rest.
    if (_LISTS[fullKey]) {
      const { table, idCol } = _LISTS[fullKey];
      const list = (Array.isArray(value) ? value : []).filter(x => x && x.id);
      const tomb = this._tombstones()[table];
      const present = new Set(list.map(x => x.id));
      const gone = (item.removed || []).filter(id => !present.has(id));
      if (gone.length) {
        const r = await _rest(table, 'DELETE', { eq: { user_id: uid }, in: { [idCol]: gone } });
        if (!r.ok) return r;
      }
      const rows = list.filter(x => !(tomb[x.id] > 0)).map(x => ({ user_id: uid, [idCol]: x.id, data: x }));
      return rows.length ? _upsert(table, rows, `user_id,${idCol}`) : OK;
    }
    // Profile — never with the API key.
    if (route === 'profile') {
      return _upsert('profile', { user_id:uid, data:_profileForPush(value) }, 'user_id');
    }
    // Session index
    if (route === 'session_index') {
      return _upsert('session_index', { user_id:uid, data:value }, 'user_id');
    }
    // Overrides (library_overrides, goal_overrides, goal_milestone_overrides)
    if (route === 'override') {
      const storeKey = fullKey.replace('pb_','');
      const table = fullKey.includes('cache') ? 'cache' : 'overrides';
      const keyCol = fullKey.includes('cache') ? 'cache_key' : 'store_key';
      return _upsert(table, { user_id:uid, [keyCol]:storeKey, data:value }, `user_id,${keyCol}`);
    }
    // Daily instances (project_scaffold_revamp) — key is 'pb_daily_instance_YYYY-MM-DD'
    if (route === 'daily_instance') {
      const date = fullKey.replace('pb_daily_instance_', '');
      // weekday is NOT NULL in the schema; derive it rather than 400 forever.
      const wd = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(date + 'T12:00:00').getDay()] || 'unknown';
      return _upsert('daily_instances', {
        user_id: uid, date,
        weekday: value?.weekday || wd,
        correlation_mode: value?.correlationMode || 'correlated',
        theme_override: value?.themeOverride || null,
        data: value,
        chat_log: value?.chatLog || [],
      }, 'user_id,date');
    }
    // Month plan (js/monthplan.js) — the four-week block skeleton. One row
    // per block; block_start doubles as the natural key so regenerating the
    // same block updates it rather than piling up duplicates.
    if (route === 'month_plan') {
      return _upsert('month_plans', {
        user_id: uid,
        block_start: value?.blockStart || null,
        block_end:   value?.blockEnd   || null,
        title:       value?.title      || null,
        data: value,
      }, 'user_id,block_start');
    }
    // Hevy exercise-name aliases (js/import.js) — { normalizedHevyName:
    // exerciseId }, learned each time the user confirms a mapping on the
    // import screen. Stored in the generic `overrides` table since it is
    // exactly that shape; pull() already restores it as 'pb_hevy_aliases'.
    if (route === 'hevy_aliases') {
      return _upsert('overrides', { user_id: uid, store_key: 'hevy_aliases', data: value }, 'user_id,store_key');
    }
    // Watch vitals (js/stats.js Vitals) — daily resting HR / HRV / VO2 max /
    // sleep, merged from tools/health_vitals.py output. Generic overrides
    // row, so pull() restores it as 'pb_vitals' with no schema change.
    if (route === 'vitals') {
      return _upsert('overrides', { user_id: uid, store_key: 'vitals', data: value }, 'user_id,store_key');
    }
    // Week scaffold override (project_scaffold_revamp) — user's edited copy
    // of the default WEEK_SCAFFOLD shipped in data/scaffold.js, if/when the
    // app grows a UI to edit it. Not written by anything yet.
    if (route === 'week_scaffold') {
      return _upsert('week_scaffold', { user_id: uid, data: value }, 'user_id');
    }
    return { ...OK, dropped: true };
  },

  // Pull all data from Supabase into localStorage.
  //
  // Rules (see also _workScore):
  //  - a key still in the outbox, or written while the pull was in flight,
  //    is never overwritten — the local copy is newer by definition;
  //  - lists (custom exercises/goals) and the session index merge by id,
  //    minus tombstoned ids; local-only items are queued for upload;
  //  - sessions / daily instances: the copy with more logged work wins,
  //    ties go to the server; a local winner is queued for upload;
  //  - profile: shallow merge, remote wins per top-level field (and per
  //    settings field), the API key always stays local;
  //  - a failed request leaves that key alone; a storage-quota error skips
  //    the key. pull() never throws — a failure here used to reach boot()'s
  //    catch and show the login screen.
  // Resolves to { ok, skipped?, quota?, error? }.
  async pull() {
    if (!Auth.isLoggedIn()) return { ok: false, skipped: 'signed out' };
    const watch = new Set();
    this._pullWatch = watch;
    try {
      return await this._pullOnce(watch);
    } catch (e) {
      console.error('Pull failed:', e);
      this.lastError = 'Pull failed: ' + (e && e.message);
      this._emit();
      return { ok: false, error: e && e.message };
    } finally {
      if (this._pullWatch === watch) this._pullWatch = null;
    }
  },

  async _pullOnce(watch) {
    const user = await Auth.getUser(); if (!user) return { ok: false, skipped: 'signed out' };
    const token = await Auth._ensureToken();
    if (!token) {
      console.warn('Pull skipped — offline or no valid token; running on local data');
      return { ok: false, skipped: 'offline' };
    }
    const uid = user.id;
    console.log('Pulling data for user', uid);
    const startPending = new Set(Object.keys(this._obRead().items));
    const keep = key => startPending.has(key) || watch.has(key) || this._isPending(key);
    let quota = false;
    const put = (key, val) => {
      if (keep(key)) return false;
      try { localStorage.setItem(key, JSON.stringify(val)); return true; }
      catch (e) {
        if (_isQuotaError(e)) quota = true;
        console.warn('Pull: could not store', key, e && e.name);
        return false;
      }
    };
    const rows = r => (r && r.ok && Array.isArray(r.data)) ? r.data : null;

    const results = await Promise.all([
      _rest('profile',          'GET', { eq:{user_id:uid}, select:'data' }),
      _rest('session_index',    'GET', { eq:{user_id:uid}, select:'data' }),
      // Every session's key + summary columns (cheap), so the index can be
      // rebuilt from the table rather than trusting one last-write-wins blob.
      _rest('sessions',         'GET', { eq:{user_id:uid}, select:'session_key,date,theme,duration', order:'date.desc' }),
      _rest('sessions',         'GET', { eq:{user_id:uid}, select:'session_key,data', order:'date.desc', limit:50 }),
      _rest('custom_exercises', 'GET', { eq:{user_id:uid}, select:'data' }),
      _rest('custom_goals',     'GET', { eq:{user_id:uid}, select:'data' }),
      _rest('overrides',        'GET', { eq:{user_id:uid}, select:'store_key,data' }),
      _rest('cache',            'GET', { eq:{user_id:uid}, select:'cache_key,data' }),
      _rest('week_scaffold',    'GET', { eq:{user_id:uid}, select:'data' }),
      _rest('daily_instances',  'GET', { eq:{user_id:uid}, select:'date,data', order:'date.desc', limit:30 }),
      _rest('month_plans',      'GET', { eq:{user_id:uid}, select:'data', order:'block_start.desc', limit:1 }),
      _rest('plan_notes',       'GET', { eq:{user_id:uid}, select:'data' }),
    ]);
    const failed = results.filter(r => !r.ok).length;
    if (failed === results.length) {
      console.warn('Pull: server unreachable — running on local data');
      return { ok: false, skipped: 'offline' };
    }
    const [profile, sidx, sessMeta, sessRecent, exes, goals, ovRows, cacheRows, scaffold, instances, monthPlan, notes] = results.map(rows);

    // ── tombstones (reserved overrides row) ──
    const tomb = this._tombstones();
    const remoteTombRow = (ovRows || []).find(r => r.store_key === '_tombstones');
    if (remoteTombRow && remoteTombRow.data) {
      let localHasMore = false;
      Object.keys(tomb).forEach(kind => {
        const rt = remoteTombRow.data[kind] || {};
        // Per id, the entry with the later |timestamp| wins (see _tombstones).
        Object.entries(rt).forEach(([id, ts]) => { if (Math.abs(ts) > Math.abs(tomb[kind][id] || 0)) tomb[kind][id] = ts; });
        if (Object.entries(tomb[kind]).some(([id, ts]) => rt[id] !== ts)) localHasMore = true;
      });
      this._saveTombstones(tomb);
      if (localHasMore) this._enqueue(TOMBSTONE_ITEM, 'set');
    } else if (ovRows && Object.values(tomb).some(m => Object.keys(m).length)) {
      this._enqueue(TOMBSTONE_ITEM, 'set');
    }

    // ── profile ──
    if (profile && profile[0] && profile[0].data && !keep('pb_profile')) {
      const remote = profile[0].data;
      const local = _readJSON('pb_profile');
      let merged = remote;
      if (local && typeof local === 'object') {
        merged = { ...local, ...remote };
        if (local.settings || remote.settings) merged.settings = { ...(local.settings || {}), ...(remote.settings || {}) };
      }
      // The API key never comes from the server: keep this device's value
      // (or none). A legacy copy on the server is scrubbed by re-pushing.
      if (merged.settings) {
        const localKey = local && local.settings ? local.settings.anthropicApiKey : undefined;
        if (localKey !== undefined) merged.settings.anthropicApiKey = localKey;
        else delete merged.settings.anthropicApiKey;
      }
      if (!_sameJSON(merged, local)) put('pb_profile', merged);
      if (remote.settings && remote.settings.anthropicApiKey) this._enqueue('pb_profile', 'set');
    }

    // ── sessions ──
    const tombS = tomb.sessions;
    const remoteKeys = sessMeta ? new Set(sessMeta.map(r => r.session_key)) : null;
    const sessionData = {};   // session_key -> winning data (for index derivation)
    const applySession = (sk, remoteData) => {
      const key = 'pb_' + sk;
      if (tombS[sk] > 0) { this._enqueue(key, 'delete'); return; }
      const local = this._valueFor(key);
      if (keep(key)) { sessionData[sk] = local; return; }
      if (local !== undefined && _workScore(local) > _workScore(remoteData)) {
        sessionData[sk] = local; this._enqueue(key, 'set'); return;
      }
      sessionData[sk] = remoteData;
      if (!_sameJSON(local, remoteData)) put(key, remoteData);
    };
    (sessRecent || []).forEach(s => applySession(s.session_key, s.data));
    if (sessMeta) {
      // Rows this device has never seen (older than the 50 above) — fetch them.
      const missing = sessMeta.map(r => r.session_key)
        .filter(sk => !(sk in sessionData) && !(tombS[sk] > 0) && this._valueFor('pb_' + sk) === undefined);
      for (let i = 0; i < missing.length; i += 40) {
        const chunk = rows(await _rest('sessions', 'GET', { eq:{user_id:uid}, in:{session_key: missing.slice(i, i + 40)}, select:'session_key,data' }));
        (chunk || []).forEach(s => applySession(s.session_key, s.data));
      }
      // Sessions only this device holds (an upload that 401'd before this
      // fix, or made offline) — push them up instead of letting them vanish.
      // (Collect first: enqueueing writes to localStorage, which can
      // reorder localStorage.key(i) mid-loop.)
      const localSessionKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && _route(k) === 'session') localSessionKeys.push(k);
      }
      localSessionKeys.forEach(k => {
        const sk = k.replace('pb_', '');
        if (!remoteKeys.has(sk) && !(tombS[sk] > 0) && !keep(k)) this._enqueue(k, 'set');
      });
    }
    // Tombstoned sessions still on the server → delete them there.
    (sessMeta || []).forEach(r => { if (tombS[r.session_key] > 0 && !keep('pb_' + r.session_key)) this._enqueue('pb_' + r.session_key, 'delete'); });

    // ── session_index: union of local + remote blob + sessions table ──
    // Merged even while the local index is pending — a union only adds, and
    // the pending upload then carries the merged list.
    if (sidx || sessMeta) {
      const local = _readJSON('pb_session_index');
      const remoteIdx = (sidx && sidx[0] && Array.isArray(sidx[0].data)) ? sidx[0].data : [];
      const byId = new Map();
      const better = (a, b) => {   // prefer the entry whose session is complete / longer
        const sa = (a.status === 'completed') - (b.status === 'completed');
        if (sa) return sa > 0 ? a : b;
        return (+a.duration || 0) >= (+b.duration || 0) ? a : b;
      };
      [...remoteIdx, ...(Array.isArray(local) ? local : [])].forEach(e => {
        if (!e || !e.id || (tombS[e.id] > 0)) return;
        const cur = byId.get(e.id);
        byId.set(e.id, cur ? { ...cur, ...better(e, cur) } : e);
      });
      const metaById = new Map((sessMeta || []).map(r => [r.session_key, r]));
      metaById.forEach((row, sk) => {
        if (tombS[sk] > 0) return;
        const data = sessionData[sk] !== undefined ? sessionData[sk] : this._valueFor('pb_' + sk);
        const derived = _indexEntryFrom(sk, data, row);
        const cur = byId.get(sk);
        // The session data is the truth for the summary fields.
        byId.set(sk, cur ? (data ? { ...cur, ...derived } : cur) : derived);
      });
      Object.entries(sessionData).forEach(([sk, data]) => {
        if (data && byId.has(sk)) byId.set(sk, { ...byId.get(sk), ..._indexEntryFrom(sk, data) });
      });
      const merged = [...byId.values()].sort(_indexSort);
      if (!_sameJSON(merged, local)) {
        try { localStorage.setItem('pb_session_index', JSON.stringify(merged)); }
        catch (e) { if (_isQuotaError(e)) quota = true; }
      }
      if (!_sameJSON(merged, remoteIdx)) this._enqueue('pb_session_index', 'set');
    }

    // ── custom exercises / goals: union by id ──
    const mergeList = (key, remoteRows) => {
      if (!remoteRows) return;   // request failed — leave local alone
      const { table } = _LISTS[key];
      const t = tomb[table];
      const remote = remoteRows.map(r => r.data).filter(x => x && x.id);
      const local = (_readJSON(key) || []).filter(x => x && x.id);
      const pending = keep(key);
      const byTime = key === 'pb_plan_notes';
      const remoteById = new Map(remote.map(x => [x.id, x]));
      const localIds = new Set(local.map(x => x.id));
      const merged = [];
      let localOnly = false;
      local.forEach(x => {
        if (t[x.id] > 0) return;                                  // deleted elsewhere
        if (!remoteById.has(x.id)) { localOnly = true; merged.push(x); return; }
        const r = remoteById.get(x.id);
        // Notes carry updatedAt, and can be edited off-device (a plan review
        // marking one applied), so the later edit wins per note even while
        // an unrelated note edit is pending here.
        if (byTime && x.updatedAt && r.updatedAt && x.updatedAt !== r.updatedAt) {
          if (String(r.updatedAt) > String(x.updatedAt)) merged.push(r);
          else { merged.push(x); localOnly = true; }   // local edit the server lacks
          return;
        }
        merged.push(pending ? x : r);      // remote wins unless pending
      });
      remote.forEach(x => { if (!localIds.has(x.id) && !(t[x.id] > 0)) merged.push(x); });
      const deadRemote = remote.filter(x => t[x.id] > 0).map(x => x.id);
      if (!_sameJSON(merged, _readJSON(key))) {
        try { localStorage.setItem(key, JSON.stringify(merged)); }
        catch (e) { if (_isQuotaError(e)) quota = true; }
      }
      // Local-only items (first pull on a device, or an upload that failed)
      // go up; tombstoned rows still on the server get deleted there.
      if (localOnly || deadRemote.length) this._enqueue(key, 'set', { removed: deadRemote });
    };
    mergeList('pb_custom_exercises', exes);
    mergeList('pb_custom_goals',     goals);
    mergeList('pb_plan_notes',       notes);

    // ── overrides / cache / scaffold (whole-blob; skip pending) ──
    (ovRows || []).forEach(r => { if (r.store_key && r.store_key[0] !== '_') put('pb_' + r.store_key, r.data); });
    (cacheRows || []).forEach(r => put('pb_' + r.cache_key, r.data));
    if (scaffold && scaffold[0]) put('pb_week_scaffold', scaffold[0].data);

    // ── daily instances: more logged work wins, ties → server ──
    if (instances) {
      // Local instances the server has never seen (an upload lost before
      // this fix) within the window the query covers — push them up.
      const remoteDates = new Set(instances.map(r => r.date));
      const oldest = instances.length >= 30 ? instances[instances.length - 1].date : '';
      const localInst = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('pb_daily_instance_')) localInst.push(k);
      }
      localInst.forEach(k => {
        const d = k.replace('pb_daily_instance_', '');
        if (!remoteDates.has(d) && d >= oldest && !keep(k)) this._enqueue(k, 'set');
      });
    }
    (instances || []).forEach(r => {
      const key = 'pb_daily_instance_' + r.date;
      if (keep(key)) return;
      const local = _readJSON(key);
      if (local && _workScore(local) > _workScore(r.data)) { this._enqueue(key, 'set'); return; }
      if (!_sameJSON(local, r.data)) put(key, r.data);
    });

    // A remote plan older than the shipped seed must not overwrite it, or a
    // pull silently reinstates the previous block on a device that has just
    // been updated — which is exactly how the 21 Sep plan kept coming back.
    if (monthPlan && monthPlan[0]) {
      const remotePlan = monthPlan[0].data;
      const seedV = (typeof MONTH_PLAN_SEED !== 'undefined' && MONTH_PLAN_SEED.seedVersion) || 0;
      if (((remotePlan && remotePlan.seedVersion) || 0) >= seedV) {
        put('pb_month_plan', remotePlan);
      } else {
        console.log('Pull: ignoring month_plan seedVersion',
          (remotePlan && remotePlan.seedVersion) || 0, '< shipped', seedV);
      }
    }

    if (quota) {
      this.lastError = 'Storage full — some synced data could not be stored on this device';
      this._emit({ quota: true });
    }
    console.log('Pull complete' + (failed ? ` (${failed} request${failed === 1 ? '' : 's'} failed — those keys left as they were)` : ''));
    return { ok: true, partial: failed, quota };
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

// Retry triggers for the outbox: coming back online, the app returning to
// the foreground (also where a stale token gets refreshed), and leaving it
// (last chance before the OS may kill the PWA).
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('online', () => { if (Auth.isLoggedIn()) DB._flush(); });
  document.addEventListener('visibilitychange', () => {
    if (Auth.isLoggedIn() && DB.pendingCount()) DB._flush();
  });
  // Minimal status line: the Settings "Sync now" row shows pending changes.
  window.addEventListener('sync-status', e => {
    const el = document.getElementById('sync-status');
    if (!el || DB._manualSyncing) return;
    const d = e.detail || {};
    if (d.quota) { el.textContent = 'Storage full on this device — changes kept for upload'; el.style.color = 'var(--danger)'; }
    else if (d.pending) { el.textContent = `${d.pending} change${d.pending === 1 ? '' : 's'} waiting to sync`; el.style.color = 'var(--text3)'; }
    else if (/waiting to sync|Storage full/.test(el.textContent)) {
      el.textContent = 'Synced ✓ ' + new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      el.style.color = 'var(--accent2)';
    }
  });
}

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
    }
    // (After signup: auto sign in, which works when email confirmation is off.)
    await Auth.signIn(email, password);
    await _syncAndSeed();
    AuthUI.hide();
    App.init();
    const restored = LiveSession.restore(s => { App.session = s; if (App.screen === 'session') renderSessionScreen(); });
    if (restored) App.session = restored;
    renderHome();
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
// Push the outbox, then pull, then bring the month plan up to the shipped
// seed. Order matters: pushing first means the pull can't bring back an
// older server copy of something changed offline, and ensureSeeded must run
// after the pull or a stale remote plan would overwrite the new seed on
// the next open. None of this may throw — a sync problem must never stand
// between the user and their local data (a quota error in pull() used to
// reach boot()'s catch and show the login screen).
async function _syncAndSeed() {
  try { await DB._flush(); } catch (e) { console.warn('Boot flush failed:', e); }
  let pulled = null;
  try { pulled = await DB.pull(); } catch (e) { console.warn('Boot pull failed:', e); }
  try { if (typeof MonthPlan !== 'undefined') MonthPlan.ensureSeeded(); } catch (e) { console.warn('ensureSeeded failed:', e); }
  return pulled;
}

async function boot() {
  const user = await Auth.getUser();
  if (!user) { AuthUI.show(); return; }
  await _syncAndSeed();
  AuthUI.hide();
  App.init();
  // Restore an in-progress session that survived a reload (phone locked
  // mid-exercise, backgrounded PWA got evicted, etc.) instead of silently
  // losing it. renderHome() below picks this up via LiveSession.getSession()
  // and shows the "Session in progress" banner + nav tab.
  const restored = LiveSession.restore(s => { App.session = s; if (App.screen === 'session') renderSessionScreen(); });
  if (restored) App.session = restored;
  renderHome();
}

// ── MANUAL SYNC ────────────────────────────────────────────────
async function manualSync() {
  const status = document.getElementById('sync-status');
  if (status) { status.textContent = 'Syncing…'; status.style.color = 'var(--text3)'; }
  DB._manualSyncing = true;
  try {
    clearTimeout(DB._flushTimer);
    const pulled = await _syncAndSeed();   // push pending writes, pull, reseed
    App.profile = Profile.load();
    // Seeding/merging may have queued more uploads — send them now so the
    // message below describes the real state.
    const flushed = await DB._flush();
    const pending = (flushed && flushed.pending) || DB.pendingCount();
    const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    // Only claim "Synced" when it is true: nothing left in the outbox and
    // the pull actually ran.
    if (status) {
      if (pending) {
        status.textContent = `${pending} change${pending === 1 ? '' : 's'} not yet synced — ${Auth.offline || !(pulled && pulled.ok) ? 'offline, will retry' : 'will retry'}`;
        status.title = DB.lastError || '';
        status.style.color = 'var(--danger)';
      } else if (!pulled || !pulled.ok) {
        status.textContent = 'Could not reach the server — showing this device\'s data';
        status.style.color = 'var(--danger)';
      } else {
        const warn = pulled.quota ? ' (storage full — some data not stored locally)'
                   : pulled.partial ? ` (${pulled.partial} table${pulled.partial === 1 ? '' : 's'} could not be read)` : '';
        status.textContent = `Synced ✓ ${time}${warn}`;
        status.style.color = warn ? 'var(--danger)' : 'var(--accent2)';
      }
    }
    // Re-render current screen
    if (App.screen === 'home')     renderHome();
    if (App.screen === 'goals')    renderGoals();
    if (App.screen === 'settings') renderSettings();
    if (App.screen === 'log')      renderLog();
    if (App.screen === 'stats' && typeof renderStats === 'function') renderStats();
  } catch(e) {
    console.error('Sync error:', e);
    if (status) { status.textContent = 'Sync failed — check connection'; status.style.color = 'var(--danger)'; }
  } finally {
    DB._manualSyncing = false;
  }
}
