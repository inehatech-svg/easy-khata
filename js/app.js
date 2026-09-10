/* App core: router, tab bar, FAB, badges, notifications, auto-lock */
const App = {
  s: null,
  installEvt: null,
  lastAct: Date.now(),
  locked: false,

  defaults() {
    return {
      key: 'app', updatedAt: U.nowISO(),
      shopName: 'My Shop', shopPhone: '', shopAddress: '',
      currency: '\u20A8', theme: 'light',
      lowStockDefault: 5, autoAdvance: true,
      autoLockMin: 0, notify: false,
      seq: 1, driveClient: '', driveAuto: false,
      lastBackupAt: '', lastDriveBackup: '',
      notified: {}
    };
  },

  async init() {
    await DB.open();
    const saved = await DB.get('settings', 'app');
    App.s = Object.assign(App.defaults(), saved || {});
    if (saved && saved.key) App.s.key = 'app';

    document.documentElement.setAttribute('data-theme', App.s.theme || 'light');

    const u = await Auth.restoreSession();
    if (u && !localStorage.getItem('sk_locked')) App.showMain();
    else Auth.renderAuth();

    window.addEventListener('hashchange', App.render);
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); App.installEvt = e; });
    window.addEventListener('online', () => UI.toast('Back online', 'ok'));
    window.addEventListener('offline', () => UI.toast('Offline — khata keeps working', ''));

    ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
      window.addEventListener(ev, () => { App.lastAct = Date.now(); }, { passive: true }));
    setInterval(App.lockTick, 20000);

    if (u) {
      App.maybeNotify();
      Backup.autoTick();
    }
  },

  /* ---------- view switching ---------- */
  viewMode(which) {
    const auth = U.q('#authView'), main = U.q('#mainView');
    if (which === 'auth') { auth.hidden = false; main.hidden = true; }
    else { auth.hidden = true; auth.innerHTML = ''; main.hidden = false; }
  },

  showMain() {
    App.viewMode('main');
    Auth.buildPinPad && setTimeout(() => Auth.buildPinPad(), 0);
    if (!location.hash || location.hash === '#/') App.nav('home', true);
    else App.render();
  },

  showAuth() {
    App.viewMode('auth');
    Auth.renderAuth();
  },

  lock() {
    localStorage.setItem('sk_locked', '1');
    App.locked = true;
    App.showAuth();
  },

  lockTick() {
    if (!Auth.user || !App.s.autoLockMin) return;
    if (localStorage.getItem('sk_locked')) return;
    if (Date.now() - App.lastAct > App.s.autoLockMin * 60000) App.lock();
  },

  /* ---------- routing ---------- */
  nav(path, replace) {
    const target = '#/' + path;
    if (replace || location.hash === target) { location.replace(target); App.render(); }
    else location.hash = target;
  },

  parseHash() {
    const h = (location.hash || '#/home').replace(/^#\//, '');
    const [path, qs] = h.split('?');
    const params = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => {
      const [k, v] = kv.split('=');
      params[k] = decodeURIComponent(v || '');
    });
    return { name: path || 'home', params };
  },

  async render() {
    if (!Auth.user || localStorage.getItem('sk_locked')) return;
    App.viewMode('main');
    const { name, params } = App.parseHash();
    let html = '', binder = null;
    try {
      switch (name) {
        case 'home': html = await Dash.page(); binder = () => Dash.bind(params); break;
        case 'khata': html = await Khata.page(); binder = () => Khata.bind(params); break;
        case 'person': html = await Khata.person(params.id); break;
        case 'stock': html = await Stock.page(); binder = () => Stock.bind(params); break;
        case 'item': html = await Stock.itemPage(params.id); break;
        case 'bills': html = await Invoices.list(); binder = () => Invoices.bind(params); break;
        case 'bill': html = await Invoices.view(params.id); break;
        case 'bform': html = await Invoices.form(params); binder = () => Invoices.bindForm(params); break;
        case 'settings': html = await SettingsPage.page(); break;
        case 'import': html = await Importer.page(); break;
        default: App.nav('home', true); return;
      }
    } catch (e) {
      console.error(e);
      html = '<div class="page">' + UI.pageHead('Error') + '<div class="page-body">' +
        UI.empty('alert', 'Something went wrong', e.message || String(e)) + '</div></div>';
    }
    U.q('#view').innerHTML = html;
    window.scrollTo(0, 0);
    App.renderTabbar(name);
    App.updateFab(name);
    App.updateBadges();
    if (binder) binder();
  },

  async rerender() { await App.render(); },

  /* ---------- tab bar ---------- */
  tabs: [
    ['home', 'home', 'Home'],
    ['khata', 'book', 'Khata'],
    ['stock', 'box', 'Stock'],
    ['bills', 'receipt', 'Bills'],
    ['settings', 'more', 'More']
  ],

  tabOf(name) {
    return { home: 'home', khata: 'khata', person: 'khata', stock: 'stock', item: 'stock', bills: 'bills', bill: 'bills', bform: 'bills', settings: 'settings', import: 'settings' }[name] || '';
  },

  renderTabbar(active) {
    const on = App.tabOf(active);
    // mobile bottom tab bar
    U.q('#tabbar').innerHTML = App.tabs.map(t =>
      '<button class="tab ' + (on === t[0] ? 'on' : '') + '" onclick="U.vibrate();App.nav(\'' + t[0] + '\')">' +
      UI.icon(t[1], 21) + '<span>' + t[2] + '</span>' +
      (t[0] === 'stock' ? '<span class="t-badge" id="tabStockBadge" hidden></span>' : '') +
      '</button>').join('');
    // desktop top navbar
    const nav = U.q('#dnav');
    if (nav) {
      const labels = { home: 'Home', khata: 'Khata', stock: 'Stock', bills: 'Bills', settings: 'More' };
      nav.innerHTML =
        '<div class="d-brand"><span class="d-logo">' + UI.icon('zap', 18) + '</span>Easy Khata' +
        '<span class="d-shop">' + U.esc(App.s.shopName || '') + '</span></div>' +
        '<div class="d-links">' + App.tabs.map(t =>
          '<button class="d-link ' + (on === t[0] ? 'on' : '') + '" onclick="App.nav(\'' + t[0] + '\')">' +
          UI.icon(t[1], 16) + labels[t[0]] +
          (t[0] === 'stock' ? ' <span class="d-badge" id="dnavStockBadge" hidden></span>' : '') +
          '</button>').join('') + '</div>' +
        '<div class="d-actions">' +
        '<button class="ph-btn" style="color:var(--muted);border-color:var(--line);background:var(--field)" onclick="App.toggleTheme()" title="Theme">' + UI.icon(App.s.theme === 'dark' ? 'sun' : 'moon', 17) + '</button>' +
        '<button class="ph-btn" style="color:var(--muted);border-color:var(--line);background:var(--field)" onclick="App.lock()" title="Lock">' + UI.icon('lock', 17) + '</button>' +
        '</div>';
    }
  },

  updateFab(route) {
    route = route || App.parseHash().name;
    const fab = U.q('#fab');
    const map = {
      home: ['plus', 'App.nav(\'bform\')'],
      stock: ['plus', 'Stock.itemForm()'],
      bills: ['plus', 'App.nav(\'bform\')'],
      khata: Khata.tab === 'daily' ? ['plus', 'Khata.addExpense()'] : ['plus', 'Khata.customerForm()']
    };
    const conf = map[route];
    if (!conf) { fab.hidden = true; return; }
    fab.hidden = false;
    fab.innerHTML = UI.icon(conf[0], 26);
    fab.setAttribute('onclick', 'U.vibrate();' + conf[1]);
  },

  async updateBadges() {
    try {
      const low = await Stock.lowItems();
      const count = low.length > 99 ? '99+' : low.length;
      const badge = U.q('#tabStockBadge');
      if (badge) { badge.hidden = low.length === 0; badge.textContent = count; }
      const dbadge = U.q('#dnavStockBadge');
      if (dbadge) { dbadge.hidden = low.length === 0; dbadge.textContent = count; }
    } catch (e) { /* db not ready */ }
  },

  /* ---------- settings & theme ---------- */
  async saveSettings() {
    App.s.updatedAt = U.nowISO();
    await DB.put('settings', App.s);
  },

  async toggleTheme() {
    App.s.theme = App.s.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', App.s.theme);
    await App.saveSettings();
    App.rerender();
  },

  /* ---------- smart low-stock notifications ---------- */
  async maybeNotify(force) {
    if (!App.s.notify) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const today = U.day();
    const low = await Stock.lowItems();
    const fresh = low.filter(i => (App.s.notified || {})[i.id] !== today);
    if (!fresh.length && !force) return;
    fresh.slice(0, 3).forEach(i => {
      try {
        new Notification('⚠ Low stock: ' + i.name, {
          body: 'Only ' + U.fmtQty(i.qty) + ' ' + (i.unit || 'pcs') + ' left — alarm was set at ' + U.fmtQty(i.lowStockAt),
          icon: 'icon.svg', tag: 'low-' + i.id
        });
      } catch (e) {}
    });
    low.forEach(i => { App.s.notified[i.id] = today; });
    await App.saveSettings();
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
