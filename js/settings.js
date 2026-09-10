/* Settings: shop profile, preferences, security, backup & sync, danger zone */
const SettingsPage = {

  async page() {
    const s = App.s;
    const u = Auth.user;
    const connected = Backup.driveValid();
    const lastBk = s.lastBackupAt ? U.fmtDateTime(s.lastBackupAt) : 'never';
    const curOpts = [['\u20A8', 'PKR (\u20A8)'], ['\u20B9', 'INR (\u20B9)'], ['$', 'USD ($)'], ['\u20AC', 'EUR (\u20AC)'], ['\u00A3', 'GBP (\u00A3)'], ['AED', 'AED']];
    return '<div class="page">' +
      UI.backHead('Settings', 'Everything lives on your device',
        '<button class="ph-btn" onclick="App.toggleTheme()">' + UI.icon(s.theme === 'dark' ? 'sun' : 'moon', 18) + '</button>') +
      '<div class="page-body">' +

      '<div class="section-label">Shop profile</div>' +
      '<div class="card">' +
      '<div class="field"><label>Shop name</label><input id="st_shop" value="' + U.esc(s.shopName) + '"></div>' +
      '<div class="field-row">' +
      '<div class="field"><label>Phone</label><input id="st_phone" value="' + U.esc(s.shopPhone || '') + '"></div>' +
      '<div class="field"><label>Currency</label><select id="st_cur">' +
      curOpts.map(c => '<option value="' + c[0] + '" ' + (s.currency === c[0] ? 'selected' : '') + '>' + c[1] + '</option>').join('') +
      '</select></div></div>' +
      '<div class="field"><label>Address</label><input id="st_addr" value="' + U.esc(s.shopAddress || '') + '"></div>' +
      '<button class="btn btn-pri btn-block" onclick="SettingsPage.saveProfile()">' + UI.icon('save', 16) + ' Save profile</button>' +
      '</div>' +

      '<div class="section-label">Khata & inventory preferences</div>' +
      '<div class="card">' +
      '<div class="srow"><div class="s-main"><div class="s-t">Auto-adjust advance</div><div class="s-d">New bills automatically use customer advance</div></div>' +
      '<label class="switch"><input type="checkbox" ' + (s.autoAdvance ? 'checked' : '') + ' onchange="App.s.autoAdvance=this.checked;App.saveSettings();UI.toast(\'Saved\',\'ok\')"><span class="track"></span></label></div>' +
      '<div class="srow"><div class="s-main"><div class="s-t">Default low-stock alarm</div><div class="s-d">Used for new items (editable per item)</div></div>' +
      '<input class="input" style="width:70px;text-align:center" inputmode="decimal" value="' + s.lowStockDefault + '" onchange="App.s.lowStockDefault=U.num(this.value)||0;App.saveSettings();UI.toast(\'Saved\',\'ok\')"></div>' +
      '<div class="srow"><div class="s-main"><div class="s-t">Stock alarm notifications</div><div class="s-d">System notification when items go low</div></div>' +
      '<label class="switch"><input type="checkbox" ' + (s.notify ? 'checked' : '') + ' onchange="SettingsPage.toggleNotify(this.checked)"><span class="track"></span></label></div>' +
      '<div class="srow"><div class="s-main"><div class="s-t">Auto-lock</div><div class="s-d">Lock app after inactivity</div></div>' +
      '<select class="input" style="width:96px" onchange="App.s.autoLockMin=U.num(this.value);App.saveSettings();UI.toast(\'Saved\',\'ok\')">' +
      [[0, 'Off'], [2, '2 min'], [5, '5 min'], [15, '15 min']].map(o => '<option value="' + o[0] + '" ' + (s.autoLockMin === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
      '</div>' +

      '<div class="section-label">Security — smart login</div>' +
      '<div class="card">' +
      (Auth.googleReady() && location.protocol !== 'file:' ? '<div class="srow" onclick="Auth.googleLogin()"><span class="s-ic i-blue">' + Auth.gLogo() + '</span><div class="s-main"><div class="s-t">Sign in with Google</div><div class="s-d">' + (Auth.user.googleEmail ? 'Signed in as ' + U.esc(Auth.user.googleEmail) : 'Link this Gmail — auto backup & sync') + '</div></div>' + UI.icon('chevR', 16) + '</div>' : '') +
      '<div class="srow" onclick="SettingsPage.changePass()"><span class="s-ic i-pri">' + UI.icon('key', 17) + '</span><div class="s-main"><div class="s-t">Change password</div><div class="s-d">Signed in as ' + U.esc(u.username) + (u.googleEmail ? ' (Google)' : '') + '</div></div>' + UI.icon('chevR', 16) + '</div>' +
      '<div class="srow" onclick="SettingsPage.setPin()"><span class="s-ic i-green">' + UI.icon('lock', 17) + '</span><div class="s-main"><div class="s-t">' + (u.pinHash ? 'Change / remove PIN' : 'Set quick PIN') + '</div><div class="s-d">' + (u.pinHash ? 'PIN unlock is on' : '4–6 digit fast unlock') + '</div></div>' + UI.icon('chevR', 16) + '</div>' +
      (Auth.bioCapable() && location.protocol !== 'file:' ?
        '<div class="srow" onclick="Auth.enrollBio()"><span class="s-ic i-amber">' + UI.icon('finger', 17) + '</span><div class="s-main"><div class="s-t">Fingerprint quick unlock</div><div class="s-d">' + (Auth.bioEnrolled() ? 'Enrolled ✓ — tap to re-enroll' : 'Use device biometrics') + '</div></div>' + UI.icon('chevR', 16) + '</div>' : '') +
      '<div class="srow" onclick="App.lock()"><span class="s-ic i-red">' + UI.icon('lock', 17) + '</span><div class="s-main"><div class="s-t">Lock now</div><div class="s-d">Require unlock on next open</div></div>' + UI.icon('chevR', 16) + '</div>' +
      '<div class="srow" onclick="Auth.logout()"><span class="s-ic i-red">' + UI.icon('logout', 17) + '</span><div class="s-main"><div class="s-t">Log out</div><div class="s-d">Data stays on device</div></div>' + UI.icon('chevR', 16) + '</div>' +
      '</div>' +

      '<div class="section-label">Migrate from another app</div>' +
      '<div class="card">' +
      '<div class="srow" onclick="App.nav(\'import\')"><span class="s-ic i-pri">' + UI.icon('upload', 17) + '</span>' +
      '<div class="s-main"><div class="s-t">Import customers & inventory</div>' +
      '<div class="s-d">From Digi Khata, Udhaar Book etc — CSV, Excel, PDF or paste</div></div>' + UI.icon('chevR', 16) + '</div>' +
      '</div>' +

      '<div class="section-label">Backup & global sync</div>' +
      '<div class="card">' +
      '<div class="row-between tiny muted" style="margin-bottom:10px">' + UI.icon('cloud', 14) + ' Last backup: <b>' + lastBk + '</b></div>' +
      '<div class="grid2">' +
      '<button class="btn btn-sm" onclick="Backup.exportNow()">' + UI.icon('download', 15) + ' Export file</button>' +
      '<button class="btn btn-sm" onclick="Backup.pickFile()">' + UI.icon('upload', 15) + ' Import file</button>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="card-title" style="margin-bottom:8px">' + UI.icon('sync', 15) + ' Google Drive sync</div>' +
      (connected
        ? '<div class="row-between" style="background:var(--greenSoft);border-radius:10px;padding:9px 12px;margin-bottom:10px"><span class="small bold green">' + UI.icon('check', 14) + ' Connected</span>' +
          '<button class="btn btn-sm" onclick="Backup.driveDisconnect()">Disconnect</button></div>'
        : '<div class="field"><label>Google OAuth Client ID</label><input id="gd_cid" value="' + U.esc(s.driveClient || '') + '" placeholder="xxxxxxxx.apps.googleusercontent.com">' +
          '<div class="hint">One-time setup — see README. Then tap Connect.</div></div>') +
      '<div class="grid2">' +
      (connected
        ? '<button class="btn btn-sm btn-pri" onclick="Backup.driveBackup(false)">' + UI.icon('cloud', 15) + ' Backup to Drive</button>' +
          '<button class="btn btn-sm" onclick="Backup.driveList()">' + UI.icon('download', 15) + ' Restore from Drive</button>'
        : '<button class="btn btn-sm btn-pri" onclick="Backup.connect()">' + UI.icon('cloud', 15) + ' Connect Google</button>') +
      '</div>' +
      '<div class="srow" style="border-top:1px solid var(--line);margin-top:10px"><div class="s-main"><div class="s-t">Daily auto-backup</div><div class="s-d">Silently backs up to Drive every 24h</div></div>' +
      '<label class="switch"><input type="checkbox" ' + (s.driveAuto ? 'checked' : '') + ' onchange="App.s.driveAuto=this.checked;App.saveSettings();UI.toast(this.checked?\'Auto-backup on\':\'Auto-backup off\',\'ok\')"><span class="track"></span></label></div>' +
      '<div class="hint">Sync across devices: back up here → on the other phone use “Restore from Drive → Merge”. Newest change wins.</div>' +
      '</div>' +

      (App.installEvt ? '<div class="section-label">Install</div><div class="card"><button class="btn btn-pri btn-block" onclick="SettingsPage.install()">' + UI.icon('install', 17) + ' Install as app</button><div class="hint" style="text-align:center;margin-top:8px">Works offline, opens like a native app</div></div>' : '') +

      '<div class="section-label">Danger zone</div>' +
      '<div class="card">' +
      '<button class="btn btn-danger btn-block" onclick="SettingsPage.resetAll()">' + UI.icon('trash', 16) + ' Erase all data & restart</button>' +
      '<div class="hint" style="text-align:center;margin-top:8px">Deletes khatas, inventory, invoices and the login from this device. Export a backup first!</div>' +
      '</div>' +

      '<div class="tiny muted" style="text-align:center;padding:6px 0 14px">Easy Khata v1.1 • offline-first PWA<br>' + UI.icon('zap', 12) + ' made for solar & inverter businesses</div>' +
      '</div></div>';
  },

  bind() {},

  async saveProfile() {
    App.s.shopName = U.q('#st_shop').value.trim() || 'My Shop';
    App.s.shopPhone = U.q('#st_phone').value.trim();
    App.s.currency = U.q('#st_cur').value;
    App.s.shopAddress = U.q('#st_addr').value.trim();
    await App.saveSettings();
    UI.toast('Profile saved', 'ok');
  },

  changePass() {
    UI.sheet({
      title: 'Change password',
      body:
      '<div class="field"><label>Current password</label><input id="cp_old" type="password"></div>' +
      '<div class="field"><label>New password</label><input id="cp_new" type="password"></div>' +
      '<div class="field"><label>Confirm new password</label><input id="cp_new2" type="password"></div>' +
      '<button class="btn btn-pri btn-block" onclick="SettingsPage.doChangePass()">' + UI.icon('check', 17) + ' Update password</button>'
    });
  },

  async doChangePass() {
    const oldP = U.q('#cp_old').value, n1 = U.q('#cp_new').value, n2 = U.q('#cp_new2').value;
    if (n1.length < 4) return UI.toast('New password too short', 'err');
    if (n1 !== n2) return UI.toast('New passwords do not match', 'err');
    const ok = await Auth.changePassword(oldP, n1);
    if (!ok) return UI.toast('Current password is wrong', 'err');
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast('Password updated', 'ok');
  },

  setPin() {
    UI.sheet({
      title: Auth.user.pinHash ? 'Change / remove PIN' : 'Set quick PIN',
      body:
      '<div class="field"><label>New PIN (4–6 digits, blank to remove)</label><input id="pn_new" inputmode="numeric" maxlength="6"></div>' +
      '<div class="field"><label>Confirm with password</label><input id="pn_pass" type="password" placeholder="your login password"></div>' +
      '<button class="btn btn-pri btn-block" onclick="SettingsPage.doSetPin()">' + UI.icon('check', 17) + ' Save PIN</button>'
    });
  },

  async doSetPin() {
    const pin = U.q('#pn_new').value.replace(/\D/g, '');
    const pass = U.q('#pn_pass').value;
    const h = await Auth.sha(pass, Auth.user.salt);
    if (h !== Auth.user.hash) return UI.toast('Password is wrong', 'err');
    if (pin && (pin.length < 4)) return UI.toast('PIN must be 4–6 digits', 'err');
    await Auth.setPin(pin || null);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast(pin ? 'PIN saved' : 'PIN removed', 'ok');
    App.rerender();
  },

  async toggleNotify(on) {
    App.s.notify = on;
    await App.saveSettings();
    if (on && 'Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch (e) {}
    }
    App.maybeNotify(true);
  },

  async install() {
    if (!App.installEvt) return;
    App.installEvt.prompt();
    const r = await App.installEvt.userChoice;
    if (r && r.outcome === 'accepted') { UI.toast('Installing…', 'ok'); App.installEvt = null; App.rerender(); }
  },

  async resetAll() {
    const ok = await UI.confirm({
      title: 'Erase everything?',
      message: 'All khatas, customers, inventory, invoices, expenses and your login will be permanently deleted from this device. This cannot be undone.',
      ok: 'Erase all data'
    });
    if (!ok) return;
    const ok2 = await UI.confirm({ title: 'Really sure?', message: 'Have you exported a backup? This is the last warning.', ok: 'Yes, erase forever' });
    if (!ok2) return;
    for (const s of ['settings', 'users', 'items', 'moves', 'customers', 'entries', 'invoices']) await DB.clear(s);
    localStorage.clear();
    indexedDB.deleteDatabase(DB.name);
    UI.toast('All data erased', 'ok');
    setTimeout(() => location.reload(), 600);
  }
};
