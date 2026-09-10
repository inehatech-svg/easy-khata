/* Smart login: password + PIN + biometric (WebAuthn) quick unlock */
const Auth = {
  user: null,

  async sha(str, salt) {
    const data = new TextEncoder().encode(salt + '::' + str);
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      try {
        const buf = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) { /* fall through */ }
    }
    let h1 = 0xdeadbeef ^ salt.length, h2 = 0x41c6ce57 ^ salt.length;
    for (let i = 0; i < data.length; i++) {
      const ch = data[i];
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
  },

  async users() { return DB.all('users'); },

  saveSession(u) {
    Auth.user = u;
    localStorage.setItem('sk_sess', u.id);
    localStorage.removeItem('sk_locked');
  },

  async restoreSession() {
    const uid = localStorage.getItem('sk_sess');
    if (!uid) return null;
    const u = await DB.get('users', uid);
    if (!u) { localStorage.removeItem('sk_sess'); return null; }
    Auth.user = u;
    return u;
  },

  logout() {
    Auth.user = null;
    localStorage.removeItem('sk_sess');
    GDrive.token = null;
    localStorage.removeItem('sk_token');
    App.showAuth();
  },

  /* ---------- rendering ---------- */
  async renderAuth(msg) {
    App.viewMode('auth');
    const users = await Auth.users();
    const el = U.q('#authView');
    if (users.length === 0) el.innerHTML = Auth.setupHtml(msg);
    else {
      Auth.user = users.find(x => x.id === localStorage.getItem('sk_sess')) || users[0];
      el.innerHTML = Auth.loginHtml(Auth.user, msg);
      Auth.buildPinPad();
    }
  },

  logoBlock(sub) {
    return '<div class="auth-logo">' + UI.icon('zap', 42) + '</div>' +
      '<div class="auth-title">Easy Khata</div>' +
      '<div class="auth-sub">' + sub + '</div>';
  },

  gLogo() {
    return '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>';
  },

  googleReady() {
    return !!(window.EK_GOOGLE_CLIENT_ID || (App.s && App.s.driveClient));
  },

  googleBtnHtml(label) {
    if (!Auth.googleReady() || location.protocol === 'file:') return '';
    return '<button class="btn g-btn btn-block mt10" onclick="Auth.googleLogin()">' + Auth.gLogo() + ' ' + (label || 'Continue with Google') + '</button>' +
      '<div class="hint" style="text-align:center;margin-top:8px">Google login also keeps your data auto-backed-up & synced</div>';
  },

  async googleLogin() {
    const cid = String(window.EK_GOOGLE_CLIENT_ID || App.s.driveClient || '').trim();
    if (!cid) return UI.toast('Google Client ID not configured', 'err');
    try {
      await Backup.gisLoad();
      UI.toast('Opening Google sign-in…');
      const resp = await new Promise((resolve, reject) => {
        let settled = false;
        const tc = google.accounts.oauth2.initTokenClient({
          client_id: cid,
          scope: 'https://www.googleapis.com/auth/drive.appdata',
          callback: (r) => { if (!settled) { settled = true; resolve(r); } },
          error_callback: (e) => { if (!settled) { settled = true; reject(new Error(e && e.message || e.type || 'popup closed')); } }
        });
        tc.requestAccessToken({ prompt: '' });
      });
      if (resp.error) throw new Error(resp.error);
      GDrive.token = resp.access_token;
      GDrive.expiry = Date.now() + ((resp.expires_in || 3600) - 60) * 1000;
      localStorage.setItem('sk_token', JSON.stringify({ token: GDrive.token, expiry: GDrive.expiry, clientId: cid }));
      App.s.driveClient = cid;
      App.s.driveAuto = true;
      await App.saveSettings();

      const ab = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', { headers: { Authorization: 'Bearer ' + GDrive.token } });
      const aj = await ab.json();
      const email = aj.user && aj.user.emailAddress;
      if (!email) throw new Error('Google account not identified');

      const users = await DB.all('users');
      let u = users.find(x => (x.googleEmail || '').toLowerCase() === email.toLowerCase());
      if (!u) {
        const shop = App.s.shopName && App.s.shopName !== 'My Solar Shop' ? App.s.shopName : 'My Shop';
        u = { id: U.uid(), username: email.split('@')[0], googleEmail: email, salt: U.uid(), hash: await Auth.sha(U.uid() + U.uid(), U.uid()), createdAt: U.nowISO() };
        await DB.put('users', u);
        if (users.length === 0) { App.s.shopName = shop; await App.saveSettings(); }
        UI.toast('Account created for ' + email, 'ok');
      }
      Auth.saveSession(u);
      App.showMain();
      UI.toast('Signed in with Google — ' + email, 'ok');
      // auto-backup this device, then pull & merge the newest cloud copy
      await Backup.driveBackup(true);
      await Backup.syncFromDrive(true);
    } catch (e) {
      UI.toast('Google sign-in failed: ' + (e.message || e), 'err');
    }
  },

  setupHtml(msg) {
    return '<div class="auth-wrap">' + Auth.logoBlock('Create your owner account to get started') +
      '<div class="auth-card">' +
      (msg ? '<div class="alert-card" style="margin:0 0 12px"><span class="small">' + U.esc(msg) + '</span></div>' : '') +
      '<div class="field"><label>Shop / Business name</label><input id="su_shop" placeholder="e.g. Ali Solar Traders" autocomplete="off"></div>' +
      '<div class="field"><label>Username</label><input id="su_user" placeholder="owner" autocomplete="off"></div>' +
      '<div class="field"><label>Password</label><input id="su_pass" type="password" placeholder="Choose a strong password"></div>' +
      '<div class="field"><label>Confirm password</label><input id="su_pass2" type="password" placeholder="Repeat password"></div>' +
      '<div class="field"><label>Quick PIN <span class="muted tiny">(optional — 4 to 6 digits)</span></label><input id="su_pin" inputmode="numeric" maxlength="6" placeholder="e.g. 4821"></div>' +
      '<button class="btn btn-pri btn-block" onclick="Auth.doSetup()">' + UI.icon('shield', 18) + ' Create account</button>' +
      Auth.googleBtnHtml('Sign up with Google') +
      '</div><div class="auth-foot">Data is stored offline on this device. Google login adds automatic cloud backup.</div></div>';
  },

  loginHtml(user, msg) {
    const hasPin = !!user.pinHash;
    const canBio = Auth.canBiometric();
    return '<div class="auth-wrap">' + Auth.logoBlock('Welcome back') +
      '<div class="auth-card">' +
      (msg ? '<div class="alert-card" style="margin:0 0 12px"><span class="small">' + U.esc(msg) + '</span></div>' : '') +
      '<div class="segmented" style="margin-bottom:14px">' +
      '<button id="lg_t_pass" class="' + (hasPin ? '' : 'on') + '" onclick="Auth.loginTab(\'pass\')">Password</button>' +
      (hasPin ? '<button id="lg_t_pin" class="on" onclick="Auth.loginTab(\'pin\')">PIN</button>' : '') +
      '</div>' +
      '<div id="lg_pass" ' + (hasPin ? 'hidden' : '') + '>' +
      '<div class="field"><label>Username</label><input id="lg_user" value="' + U.esc(user.username) + '" readonly></div>' +
      '<div class="field"><label>Password</label><input id="lg_pass" type="password" placeholder="Enter password"></div>' +
      '<button class="btn btn-pri btn-block" onclick="Auth.doLogin()">' + UI.icon('lock', 18) + ' Unlock</button>' +
      '</div>' +
      '<div id="lg_pin" ' + (hasPin ? '' : 'hidden') + '>' +
      '<input id="lg_pinv" inputmode="numeric" maxlength="6" placeholder="Enter PIN" style="position:absolute;opacity:0;pointer-events:none">' +
      '<div class="pin-dots" id="pinDots">' + '<span></span>'.repeat(6) + '</div>' +
      '<div class="num-pad" id="pinPad"></div>' +
      '</div>' +
      (canBio ? '<button class="btn btn-block mt10" onclick="Auth.bioUnlock()">' + UI.icon('finger', 18) + ' Unlock with fingerprint</button>' : '') +
      Auth.googleBtnHtml() +
      '</div><div class="auth-foot">Easy Khata v1.1 • Offline-first</div></div>';
  },

  loginTab(which) {
    U.q('#lg_pass').hidden = which !== 'pass';
    const pin = U.q('#lg_pin'); if (pin) pin.hidden = which !== 'pin';
    U.q('#lg_t_pass').classList.toggle('on', which === 'pass');
    const t = U.q('#lg_t_pin'); if (t) t.classList.toggle('on', which === 'pin');
    if (which === 'pin') Auth.pinInput('');
  },

  pinInput(val) {
    const hidden = U.q('#lg_pinv'); if (!hidden) return;
    hidden.value = val;
    const dots = U.qa('#pinDots span');
    dots.forEach((d, i) => d.classList.toggle('fill', i < val.length));
    const want = Auth.user && Auth.user.pinLen ? Auth.user.pinLen : 4;
    if (val.length === want) Auth.doPin(val);
  },

  buildPinPad() {
    const pad = U.q('#pinPad'); if (!pad) return;
    let html = '';
    for (let i = 1; i <= 9; i++) html += '<button onclick="Auth.pinInput((U.q(\'#lg_pinv\').value+\'' + i + '\').slice(0,6))">' + i + '</button>';
    html += '<button style="visibility:hidden"></button><button onclick="Auth.pinInput((U.q(\'#lg_pinv\').value+\'0\').slice(0,6))">0</button>' +
      '<button onclick="Auth.pinInput(U.q(\'#lg_pinv\').value.slice(0,-1))">' + UI.icon('back', 18) + '</button>';
    pad.innerHTML = html;
    const hidden = U.q('#lg_pinv');
    hidden.addEventListener('input', () => Auth.pinInput(hidden.value.replace(/\D/g, '').slice(0, 6)));
  },

  shake() {
    const card = U.q('#authView .auth-card');
    if (card) { card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 350); }
  },

  /* ---------- actions ---------- */
  async doSetup() {
    const shop = U.q('#su_shop').value.trim();
    const username = U.q('#su_user').value.trim();
    const pass = U.q('#su_pass').value;
    const pass2 = U.q('#su_pass2').value;
    const pin = U.q('#su_pin').value.replace(/\D/g, '');
    if (!username || !pass) return UI.toast('Username and password are required', 'err');
    if (pass.length < 4) return UI.toast('Password must be at least 4 characters', 'err');
    if (pass !== pass2) return UI.toast('Passwords do not match', 'err');
    if (pin && (pin.length < 4 || pin.length > 6)) return UI.toast('PIN must be 4–6 digits', 'err');
    const salt = U.uid();
    const u = {
      id: U.uid(), username, salt,
      hash: await Auth.sha(pass, salt), createdAt: U.nowISO(), pinLen: pin ? pin.length : 0
    };
    if (pin) { u.pinSalt = U.uid(); u.pinHash = await Auth.sha(pin, u.pinSalt); }
    await DB.put('users', u);
    App.s.shopName = shop || 'My Shop';
    await App.saveSettings();
    Auth.saveSession(u);
    UI.toast('Welcome to Easy Khata!', 'ok');
    App.showMain();
  },

  async doLogin() {
    const pass = U.q('#lg_pass').value;
    const u = Auth.user;
    const hash = await Auth.sha(pass, u.salt);
    if (hash !== u.hash) { Auth.shake(); return UI.toast('Wrong password', 'err'); }
    Auth.saveSession(u);
    App.showMain();
  },

  async doPin(pin) {
    const u = Auth.user;
    if (!u || !u.pinHash) return;
    const hash = await Auth.sha(pin, u.pinSalt);
    if (hash !== u.pinHash) { Auth.shake(); Auth.pinInput(''); return UI.toast('Wrong PIN', 'err'); }
    Auth.saveSession(u);
    App.showMain();
  },

  async changePassword(oldP, newP) {
    const u = Auth.user;
    const h = await Auth.sha(oldP, u.salt);
    if (h !== u.hash) return false;
    u.hash = await Auth.sha(newP, u.salt);
    await DB.put('users', u);
    return true;
  },

  async setPin(pin) {
    const u = Auth.user;
    if (pin) { u.pinSalt = U.uid(); u.pinHash = await Auth.sha(pin, u.pinSalt); u.pinLen = pin.length; }
    else { delete u.pinHash; delete u.pinSalt; delete u.pinLen; }
    await DB.put('users', u);
  },

  /* ---------- biometric (WebAuthn platform authenticator) ---------- */
  bioCapable() { return !!window.PublicKeyCredential; },
  bioEnrolled() { return !!(Auth.user && localStorage.getItem('sk_bio_' + Auth.user.id)); },
  canBiometric() { return Auth.bioCapable() && Auth.bioEnrolled() && location.protocol !== 'file:'; },

  async enrollBio() {
    try {
      const u = Auth.user;
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'Easy Khata', id: location.hostname },
          user: { id: U.u8b64(btoa(u.id)), name: u.username, displayName: u.username },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'preferred' },
          timeout: 60000
        }
      });
      localStorage.setItem('sk_bio_' + u.id, U.b64u8(cred.rawId));
      UI.toast('Quick unlock enabled', 'ok');
      return true;
    } catch (e) {
      UI.toast('Could not enable fingerprint: ' + (e.message || e), 'err');
      return false;
    }
  },

  async bioUnlock() {
    try {
      const u = Auth.user;
      const rawId = localStorage.getItem('sk_bio_' + u.id);
      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{ type: 'public-key', id: U.u8b64(rawId) }],
          userVerification: 'preferred', timeout: 60000
        }
      });
      Auth.saveSession(u);
      App.showMain();
    } catch (e) {
      UI.toast('Fingerprint unlock failed — use password', 'err');
    }
  }
};
