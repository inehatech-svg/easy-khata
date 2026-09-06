/* Backup: JSON export/import with merge (last-write-wins) + Google Drive app-data sync */
const Backup = {
  async collect() {
    const stores = ['settings', 'users', 'items', 'moves', 'customers', 'entries', 'invoices'];
    const out = {};
    for (const s of stores) out[s] = await DB.all(s);
    return {
      app: 'solar-khata', version: 1,
      exportedAt: U.nowISO(), deviceId: Backup.deviceId(),
      shopName: App.s.shopName, data: out
    };
  },

  deviceId() {
    let id = localStorage.getItem('sk_device');
    if (!id) { id = U.uid(); localStorage.setItem('sk_device', id); }
    return id;
  },

  async exportNow() {
    try {
      const payload = await Backup.collect();
      const day = U.day();
      const name = 'solar-khata-backup-' + day + '-' + U.nowISO().slice(11, 16).replace(':', '') + '.json';
      U.download(name, JSON.stringify(payload));
      App.s.lastBackupAt = U.nowISO();
      await App.saveSettings();
      UI.toast('Backup file downloaded', 'ok');
    } catch (e) {
      UI.toast('Backup failed: ' + (e.message || e), 'err');
    }
  },

  /* ---------- import ---------- */
  pickFile() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (data.app !== 'solar-khata' || !data.data) throw new Error('Not a Solar Khata backup file');
          Backup.askMode(data, f.name);
        } catch (e) {
          UI.toast('Invalid backup file: ' + (e.message || e), 'err');
        }
      };
      r.readAsText(f);
    };
    inp.click();
  },

  askMode(data, name) {
    UI.sheet({
      title: 'Restore backup',
      body:
      '<div class="kv" style="background:var(--field);border-radius:10px;padding:10px 12px;margin-bottom:12px">' +
      '<span class="k">File</span><span class="v small">' + U.esc(name || 'backup') + '</span></div>' +
      '<div class="kv"><span class="k">Exported</span><span class="v">' + (data.exportedAt ? U.fmtDateTime(data.exportedAt) : '?') + '</span></div>' +
      '<div class="kv"><span class="k">Shop</span><span class="v">' + U.esc(data.shopName || '?') + '</span></div>' +
      '<div class="hint" style="margin:10px 0"><b>Merge</b> keeps both devices\' data (newest change wins per record — global sync).<br><b>Replace</b> wipes this device first.</div>' +
      '<button class="btn btn-pri btn-block" onclick="Backup.applyPicked(\'merge\')">' + UI.icon('sync', 17) + ' Merge (recommended)</button>' +
      '<button class="btn btn-danger btn-block mt10" onclick="Backup.applyPicked(\'replace\')">' + UI.icon('trash', 16) + ' Replace everything</button>'
    });
    Backup.pending = data;
  },

  async applyPicked(mode) {
    const data = Backup.pending;
    if (!data) return;
    try {
      await Backup.apply(data, mode);
      U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
      UI.toast(mode === 'merge' ? 'Backup merged ✓' : 'Backup restored ✓', 'ok');
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      UI.toast('Restore failed: ' + (e.message || e), 'err');
    }
  },

  async apply(data, mode) {
    const stores = ['settings', 'users', 'items', 'moves', 'customers', 'entries', 'invoices'];
    for (const s of stores) {
      if (!data.data[s]) continue;
      if (mode === 'replace') await DB.clear(s);
      if (mode === 'merge') {
        const existing = await DB.all(s);
        const keyOf = r => (s === 'settings' ? r.key : r.id);
        const mine = {};
        existing.forEach(r => { mine[keyOf(r)] = r; });
        const incoming = data.data[s].filter(r => {
          const cur = mine[keyOf(r)];
          if (!cur) return true;
          return (r.updatedAt || '') > (cur.updatedAt || '');
        });
        await DB.bulkPut(s, incoming.map(r => Object.assign({}, r)));
      } else {
        await DB.bulkPut(s, data.data[s].map(r => Object.assign({}, r)));
      }
    }
  },

  /* ================= Google Drive ================= */
  drive: {
    clientId: null, token: null, expiry: 0, tokenClient: null
  },

  driveLoad() {
    if (GDrive.token) return GDrive.token;
    const raw = localStorage.getItem('sk_token');
    if (raw) {
      try {
        const t = JSON.parse(raw);
        GDrive.token = t.token; GDrive.expiry = t.expiry; GDrive.clientId = t.clientId;
      } catch (e) {}
    }
    return GDrive.token;
  },

  gisLoad() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    if (Backup._gisPromise) return Backup._gisPromise;
    Backup._gisPromise = new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      sc.src = 'https://accounts.google.com/gsi/client';
      sc.async = true; sc.defer = true;
      sc.onload = () => resolve();
      sc.onerror = () => { Backup._gisPromise = null; reject(new Error('no internet — cannot load Google sign-in')); };
      document.head.appendChild(sc);
    });
    return Backup._gisPromise;
  },

  async connect() {
    const cid = (U.q('#gd_cid') ? U.q('#gd_cid').value : GDrive.clientId || '').trim();
    if (!cid) return UI.toast('Enter your Google OAuth Client ID first', 'err');
    GDrive.clientId = cid;
    await Backup.gisLoad();
    return new Promise((resolve) => {
      try {
        GDrive.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: cid,
          scope: 'https://www.googleapis.com/auth/drive.appdata',
          callback: (resp) => {
            if (resp.error) { UI.toast('Google sign-in failed: ' + resp.error, 'err'); return resolve(false); }
            GDrive.token = resp.access_token;
            GDrive.expiry = Date.now() + ((resp.expires_in || 3600) - 60) * 1000;
            localStorage.setItem('sk_token', JSON.stringify({ token: GDrive.token, expiry: GDrive.expiry, clientId: cid }));
            App.s.driveClient = cid;
            App.saveSettings();
            UI.toast('Google Drive connected', 'ok');
            resolve(true);
          }
        });
        GDrive.tokenClient.requestAccessToken({ prompt: '' });
      } catch (e) {
        UI.toast('Could not start Google sign-in: ' + (e.message || e), 'err');
        resolve(false);
      }
    });
  },

  driveValid() {
    Backup.driveLoad();
    return !!(GDrive.token && Date.now() < GDrive.expiry);
  },

  driveDisconnect() {
    GDrive.token = null; GDrive.expiry = 0;
    localStorage.removeItem('sk_token');
    UI.toast('Drive disconnected', '');
    App.rerender();
  },

  driveBackupUrl: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&parents=appDataFolder',

  async driveBackup(silent) {
    if (!Backup.driveValid()) {
      if (!silent) UI.toast('Connect Google Drive first', 'err');
      return false;
    }
    try {
      const payload = JSON.stringify(await Backup.collect());
      const boundary = 'sk' + U.uid();
      const meta = JSON.stringify({ name: 'solar-khata-' + U.day() + '.json', parents: ['appDataFolder'] });
      const body =
        '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n' +
        '--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + payload + '\r\n--' + boundary + '--';
      const res = await fetch(Backup.driveBackupUrl, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + GDrive.token, 'Content-Type': 'multipart/related; boundary=' + boundary },
        body
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      App.s.lastBackupAt = U.nowISO();
      App.s.lastDriveBackup = U.nowISO();
      await App.saveSettings();
      if (!silent) UI.toast('Backed up to Google Drive ✓', 'ok');
      return true;
    } catch (e) {
      if (!silent) UI.toast('Drive backup failed: ' + (e.message || e), 'err');
      return false;
    }
  },

  async driveList() {
    if (!Backup.driveValid()) return UI.toast('Connect Google Drive first', 'err');
    UI.sheet({
      title: 'Restore from Google Drive',
      body: '<div id="gd_list" class="muted small">Loading backups…</div>'
    });
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,modifiedTime,size)', {
        headers: { Authorization: 'Bearer ' + GDrive.token }
      });
      const j = await res.json();
      const files = (j.files || []);
      const el = U.q('#gd_list');
      if (!el) return;
      el.innerHTML = files.length
        ? '<div class="list">' + files.map(f =>
          '<div class="lrow" onclick="Backup.driveRestore(\'' + f.id + '\')">' +
          '<div class="avatar sm blue">' + UI.icon('cloud', 16) + '</div>' +
          '<div class="l-main"><div class="l-title">' + U.esc(f.name) + '</div>' +
          '<div class="l-sub">' + U.fmtDateTime(f.modifiedTime) + ' • ' + Math.round((f.size || 0) / 1024) + ' KB</div></div>' +
          '<span class="chip pri">Restore</span></div>').join('') + '</div>'
        : UI.empty('cloud', 'No backups in Drive yet', 'Tap “Backup to Drive” first');
    } catch (e) {
      UI.toast('Could not list Drive files: ' + (e.message || e), 'err');
    }
  },

  async driveRestore(fileId) {
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
        headers: { Authorization: 'Bearer ' + GDrive.token }
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (data.app !== 'solar-khata') throw new Error('Not a Solar Khata backup');
      U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
      Backup.askMode(data, data.exportedAt ? 'Drive backup ' + U.fmtDateTime(data.exportedAt) : 'Drive backup');
    } catch (e) {
      UI.toast('Restore failed: ' + (e.message || e), 'err');
    }
  },

  // runs on app start: silent auto backup max once per 24h
  async autoTick() {
    if (!App.s.driveAuto || !Backup.driveValid()) return;
    const last = App.s.lastDriveBackup || '';
    if (last && (Date.now() - new Date(last).getTime()) < 24 * 3600 * 1000) return;
    await Backup.driveBackup(true);
  }
};

/* GDrive alias used across modules */
const GDrive = {
  get token() { return Backup.drive.token; },
  set token(v) { Backup.drive.token = v; },
  get expiry() { return Backup.drive.expiry; },
  set expiry(v) { Backup.drive.expiry = v; },
  get clientId() { return Backup.drive.clientId; },
  set clientId(v) { Backup.drive.clientId = v; },
  get tokenClient() { return Backup.drive.tokenClient; },
  set tokenClient(v) { Backup.drive.tokenClient = v; }
};
