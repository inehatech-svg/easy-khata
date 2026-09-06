/* Utilities: formatting, ids, dates, download */
const U = {
  q: (s, el) => (el || document).querySelector(s),
  qa: (s, el) => Array.from((el || document).querySelectorAll(s)),

  esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  nowISO() { return new Date().toISOString(); },

  pad2(n) { return String(n).padStart(2, '0'); },

  // 'YYYY-MM-DD' for a Date, ISO string, or now
  day(d) {
    const dt = d ? new Date(d) : new Date();
    return dt.getFullYear() + '-' + U.pad2(dt.getMonth() + 1) + '-' + U.pad2(dt.getDate());
  },

  addDays(dayStr, n) {
    const [y, m, d] = dayStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return U.day(dt);
  },

  monthShort(dayStr) {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(dayStr.slice(5, 7)) - 1];
  },

  fmtDay(dayStr) {
    if (!dayStr) return '';
    return Number(dayStr.slice(8, 10)) + ' ' + U.monthShort(dayStr) + ' ' + dayStr.slice(0, 4);
  },

  fmtDateTime(iso) {
    if (!iso) return '';
    const dt = new Date(iso);
    let h = dt.getHours(); const am = h < 12 ? 'am' : 'pm';
    h = h % 12 || 12;
    return Number(dt.getDate()) + ' ' + U.monthShort(U.day(dt)) + ', ' + h + ':' + U.pad2(dt.getMinutes()) + am;
  },

  num(v) {
    const n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  },

  money(n) {
    const sym = (window.App && App.s && App.s.currency) || '\u20A8';
    const loc = sym === '\u20B9' ? 'en-IN' : 'en-US';
    const v = Math.abs(U.num(n));
    const s = v.toLocaleString(loc, { maximumFractionDigits: 2 });
    return (n < 0 ? '-' : '') + sym + s;
  },

  fmtQty(n) {
    const v = U.num(n);
    return v % 1 === 0 ? String(v) : v.toFixed(2);
  },

  sum(arr, f) {
    return arr.reduce((a, x) => a + (f ? U.num(f(x)) : U.num(x)), 0);
  },

  sumType(entries, types) {
    return U.sum(entries.filter(e => types.includes(e.type)), e => e.amount);
  },

  initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
  },

  avatarHue(name) {
    const c = [' ', 'amber', 'green', 'red', 'blue'];
    let h = 0; const s = String(name || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return c[h % c.length === 0 ? 1 : h % c.length];
  },

  download(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  },

  b64u8(arr) { return btoa(String.fromCharCode(...new Uint8Array(arr))); },
  u8b64(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); },

  vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms || 8); } catch (e) {} }
};
