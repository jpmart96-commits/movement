// ─────────────────────────────────────────────────────────────
// BACKUP — a file you keep, once a week.
//
// Supabase's free plan keeps no restorable history, and on 20 Sep a
// recreated auth user cascade-deleted every row. Two layers now:
//   1. Server: a nightly snapshot per user into `backups` (pg_cron, see
//      supabase_schema.sql). It has no foreign key to auth.users, so a
//      recreated user can't take it with them. Restored by SQL.
//   2. This: a weekly nudge on Today to save the whole local store as a
//      JSON file. On a phone it goes through the share sheet (Save to
//      Files / iCloud Drive); on a computer it downloads. Settings → Data →
//      Import backup reads it back.
// The Anthropic key is left out of the file.
// ─────────────────────────────────────────────────────────────

const Backup = {
  KEY: 'mv_last_backup',          // plain localStorage: device-local, never synced
  EVERY_DAYS: 7,

  lastAt() { try { return +localStorage.getItem(this.KEY) || 0; } catch (e) { return 0; } },
  _mark() { try { localStorage.setItem(this.KEY, String(Date.now())); } catch (e) {} },
  due() { return Date.now() - this.lastAt() > this.EVERY_DAYS * 864e5; },

  data() {
    const d = (typeof DB !== 'undefined' && DB.exportAll) ? DB.exportAll() : {};
    if (d.profile && d.profile.settings && d.profile.settings.anthropicApiKey) {
      d.profile = { ...d.profile, settings: { ...d.profile.settings, anthropicApiKey: '' } };
    }
    return d;
  },

  fileName() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `movement-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
  },

  // Share sheet where files can be shared (iPhone), download otherwise.
  async save() {
    const text = JSON.stringify(this.data(), null, 2);
    const name = this.fileName();
    try {
      if (typeof File !== 'undefined' && navigator.canShare) {
        const f = new File([text], name, { type: 'application/json' });
        if (navigator.canShare({ files: [f] })) {
          await navigator.share({ files: [f], title: name });
          this._mark();
          return 'shared';
        }
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    this._mark();
    return 'downloaded';
  },

  // Today: a one-line nudge when a week has passed.
  reminder() {
    if (!this.due()) return '';
    const last = this.lastAt();
    const when = last ? `Last one ${Math.floor((Date.now() - last) / 864e5)} days ago.` : 'No backup file saved on this device yet.';
    return `<div class="mv-card mv-backup"><div style="flex:1"><div class="mv-ready-k" style="color:var(--text3)">Weekly backup</div>
      <div class="mv-ready-v">${when} Save a copy of everything to Files.</div></div>
      <button type="button" class="mv-pill" onclick="Backup.save().then(()=>{ if (typeof renderToday==='function') renderToday(); })">Save</button></div>`;
  },

  statusLine() {
    const last = this.lastAt();
    return last ? `Last backup file: ${new Date(last).toLocaleDateString()}` : 'No backup file saved on this device yet.';
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Backup };
