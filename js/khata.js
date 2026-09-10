/* Khata: daily ledger, customers list, per-person khata with running balance */
const Khata = {
  tab: 'daily',          // daily | people
  daySel: null,          // selected day for daily view
  search: '',

  /* ---------- ledger math ---------- */
  // amount the customer owes (unapplied advances excluded)
  balanceOf(entries) {
    const dr = U.sumType(entries, ['invoice', 'opening']).valueOf();
    let openDr = 0, openCr = 0;
    entries.forEach(e => { if (e.type === 'opening') { if (U.num(e.amount) > 0) openDr += U.num(e.amount); else openCr += Math.abs(U.num(e.amount)); } });
    const invoiceDr = U.sumType(entries, ['invoice']);
    const cr = U.sumType(entries, ['payment', 'advance_apply', 'return', 'discount']) + openCr;
    return invoiceDr + openDr - cr;
  },

  // unapplied advance pool
  advanceOf(entries) {
    return U.sumType(entries, ['advance']) - U.sumType(entries, ['advance_apply']);
  },

  /* ============ main page ============ */
  async page() {
    if (!Khata.daySel) Khata.daySel = U.day();
    return '<div class="page">' +
      UI.pageHead('Khata Ledger', 'Daily book & customer accounts') +
      '<div class="page-body" style="margin-top:-38px">' +
      '<div class="card" style="padding:6px"><div class="segmented" style="background:var(--field)">' +
      '<button id="kh_t_daily" class="' + (Khata.tab === 'daily' ? 'on' : '') + '" onclick="Khata.setTab(\'daily\')">' + UI.icon('calendar', 15) + ' Daily</button>' +
      '<button id="kh_t_people" class="' + (Khata.tab === 'people' ? 'on' : '') + '" onclick="Khata.setTab(\'people\')">' + UI.icon('users', 15) + ' People</button>' +
      '</div></div>' +
      '<div id="kh_body"></div></div></div>';
  },

  async bind() { Khata.renderBody(); },

  setTab(t) {
    Khata.tab = t;
    const d = U.q('#kh_t_daily'), p = U.q('#kh_t_people');
    if (d) d.classList.toggle('on', t === 'daily');
    if (p) p.classList.toggle('on', t === 'people');
    Khata.renderBody();
    App.updateFab();
  },

  async renderBody() {
    const el = U.q('#kh_body'); if (!el) return;
    el.innerHTML = Khata.tab === 'daily' ? await Khata.dailyHtml() : await Khata.peopleHtml();
  },

  /* ============ daily khata ============ */
  async dailyHtml() {
    const day = Khata.daySel;
    const entries = (await DB.idx('entries', 'day', day))
      .filter(e => e.type !== 'advance_apply')
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const sales = U.sumType(entries, ['invoice']);
    const received = U.sumType(entries, ['payment']);
    const advanceIn = U.sumType(entries, ['advance']);
    const returns = U.sumType(entries, ['return']);
    const discounts = U.sumType(entries, ['discount']);
    const expenses = U.sumType(entries, ['expense']);
    const isToday = day === U.day();
    return '<div class="date-nav" style="margin-bottom:12px">' +
      '<button class="d-btn" onclick="Khata.shiftDay(-1)">' + UI.icon('chevL', 18) + '</button>' +
      '<input type="date" value="' + day + '" onchange="Khata.daySel=this.value;Khata.renderBody()">' +
      (isToday ? '' : '<button class="d-btn" onclick="Khata.daySel=U.day();Khata.renderBody()" title="Today">' + UI.icon('calendar', 16) + '</button>') +
      '<button class="d-btn" onclick="Khata.shiftDay(1)">' + UI.icon('chevR', 18) + '</button></div>' +
      '<div class="stats">' +
      '<div class="stat"><span class="s-label"><span class="s-icon i-pri">' + UI.icon('cart', 15) + '</span> Sales</span><div class="s-val">' + U.money(sales) + '</div></div>' +
      '<div class="stat"><span class="s-label"><span class="s-icon i-green">' + UI.icon('cash', 15) + '</span> Received</span><div class="s-val green">' + U.money(received + advanceIn) + '</div></div>' +
      '<div class="stat"><span class="s-label"><span class="s-icon i-amber">' + UI.icon('undo', 15) + '</span> Returns + disc.</span><div class="s-val">' + U.money(returns + discounts) + '</div></div>' +
      '<div class="stat"><span class="s-label"><span class="s-icon i-red">' + UI.icon('wallet', 15) + '</span> Expenses</span><div class="s-val">' + U.money(expenses) + '</div></div>' +
      '</div>' +
      '<div class="card"><div class="kv total" style="border:none;margin:0;padding:4px 0"><span class="k">Net cash today</span><span class="v ' + (received + advanceIn - expenses >= 0 ? 'green' : 'red') + '">' + U.money(received + advanceIn - expenses) + '</span></div></div>' +
      '<div class="section-label">Entries — ' + U.fmtDay(day) + '</div>' +
      (entries.length ? '<div class="list">' + entries.map(e => Khata.entryRow(e, false)).join('') + '</div>'
        : UI.empty('book', 'Nothing on this day', 'Sales, payments and expenses will appear here'));
  },

  shiftDay(n) { Khata.daySel = U.addDays(Khata.daySel, n); Khata.renderBody(); },

  entryMeta: {
    invoice: { ic: 'receipt', cls: 'red', label: 'Sale', dr: true },
    payment: { ic: 'cash', cls: 'green', label: 'Payment received', dr: false },
    advance: { ic: 'wallet', cls: 'green', label: 'Advance received', dr: false },
    advance_apply: { ic: 'zap', cls: 'pri', label: 'Advance adjusted', dr: false },
    return: { ic: 'undo', cls: 'blue', label: 'Return', dr: false },
    discount: { ic: 'percent', cls: 'amber', label: 'Discount given', dr: false },
    opening: { ic: 'book', cls: 'pri', label: 'Opening balance', dr: true },
    expense: { ic: 'wallet', cls: 'red', label: 'Expense', dr: true }
  },

  entryRow(e, withBalance) {
    const m = Khata.entryMeta[e.type] || { ic: 'book', cls: 'pri', label: e.type, dr: false };
    const amt = Math.abs(U.num(e.amount));
    return '<div class="entry" onclick="Khata.tapEntry(\'' + e.id + '\')">' +
      '<div class="e-ic i-' + m.cls + '">' + UI.icon(m.ic, 17) + '</div>' +
      '<div class="e-main"><div class="e-title">' + m.label + (e.customerName ? ' — ' + U.esc(e.customerName) : '') + '</div>' +
      '<div class="e-sub">' + U.fmtDateTime(e.date) + (e.note ? ' • ' + U.esc(e.note) : '') + '</div></div>' +
      '<div class="e-right"><div class="e-amt ' + (m.dr ? 'dr' : 'cr') + '">' + (m.dr ? '+' : '−') + U.money(amt) + '</div>' +
      (withBalance && e._bal != null ? '<div class="e-bal">bal ' + U.money(e._bal) + '</div>' : '') + '</div></div>';
  },

  async tapEntry(id) {
    const e = await DB.get('entries', id);
    if (!e) return;
    if (e.type === 'invoice') return App.nav('bill?id=' + e.invoiceId);
    Khata.editEntry(id);
  },

  /* ============ people ============ */
  async peopleHtml() {
    const customers = await DB.all('customers');
    const allEntries = await DB.all('entries');
    const byCust = {};
    allEntries.forEach(e => {
      if (!e.customerId) return;
      (byCust[e.customerId] = byCust[e.customerId] || []).push(e);
    });
    const rows = customers.map(c => {
      const es = byCust[c.id] || [];
      return { c, bal: Khata.balanceOf(es), adv: Khata.advanceOf(es) };
    });
    let list = rows;
    if (Khata.search) {
      const s = Khata.search.toLowerCase();
      list = list.filter(r => (r.c.name + ' ' + (r.c.phone || '')).toLowerCase().includes(s));
    }
    list.sort((a, b) => (b.bal - a.bal) || a.c.name.localeCompare(b.c.name));
    const totalDue = U.sum(rows.filter(r => r.bal > 0), r => r.bal);
    return '<div class="stats">' +
      '<div class="stat"><span class="s-label">' + UI.icon('users', 15) + ' Customers</span><div class="s-val">' + rows.length + '</div></div>' +
      '<div class="stat"><span class="s-label">' + UI.icon('alert', 15) + ' Total receivable</span><div class="s-val ' + (totalDue > 0 ? 'red' : 'green') + '">' + U.money(totalDue) + '</div></div></div>' +
      '<div class="searchbar" style="margin-bottom:10px">' + UI.icon('search', 18) +
      '<input placeholder="Search name or phone…" value="' + U.esc(Khata.search) + '" oninput="Khata.search=this.value;Khata.renderBody()"></div>' +
      (list.length ? '<div class="list">' + list.map(r =>
        '<div class="lrow" onclick="App.nav(\'person?id=' + r.c.id + '\')">' +
        '<div class="avatar ' + U.avatarHue(r.c.name) + '">' + U.esc(U.initials(r.c.name)) + '</div>' +
        '<div class="l-main"><div class="l-title">' + U.esc(r.c.name) + '</div>' +
        '<div class="l-sub">' + (r.c.phone ? U.esc(r.c.phone) + ' • ' : '') + U.esc(r.c.address || 'no address') + '</div></div>' +
        '<div class="l-right">' + (r.adv > 0 ? '<span class="chip green tiny">' + UI.icon('wallet', 12) + ' adv ' + U.money(r.adv) + '</span> ' : '') +
        (r.bal > 0 ? '<div class="l-amt red">' + U.money(r.bal) + '</div><div class="l-tag">you\'ll receive</div>'
          : r.bal < 0 ? '<div class="l-amt green">' + U.money(-r.bal) + '</div><div class="l-tag">advance / credit</div>'
          : '<span class="chip green">clear</span>') + '</div></div>').join('') + '</div>'
        : UI.empty('users', 'No customers yet', 'Tap + to add your first khata'));
  },

  customerForm(id) {
    DB.get('customers', id).then(c => {
      UI.sheet({
        title: c ? 'Edit customer' : 'New customer khata',
        body:
        '<div class="field"><label>Full name *</label><input id="cu_name" value="' + U.esc(c ? c.name : '') + '" placeholder="e.g. Haji Iqbal"></div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Phone</label><input id="cu_phone" inputmode="tel" value="' + U.esc(c ? c.phone || '' : '') + '" placeholder="03xx…"></div>' +
        '<div class="field"><label>Opening balance</label><input id="cu_open" inputmode="decimal" value="0" placeholder="+due / −adv"><div class="hint">' + (c ? 'edit from ledger' : 'positive = old due, negative = advance') + '</div></div>' +
        '</div>' +
        '<div class="field"><label>Address</label><input id="cu_addr" value="' + U.esc(c ? c.address || '' : '') + '" placeholder="village / street"></div>' +
        '<div class="field"><label>Notes</label><textarea id="cu_notes" placeholder="anything special…">' + U.esc(c ? c.notes || '' : '') + '</textarea></div>' +
        '<button class="btn btn-pri btn-block" onclick="Khata.saveCustomer(\'' + (id || '') + '\')">' + UI.icon('save', 17) + ' Save customer</button>'
      });
    });
  },

  async saveCustomer(id) {
    const name = U.q('#cu_name').value.trim();
    if (!name) return UI.toast('Name is required', 'err');
    const patch = {
      name, phone: U.q('#cu_phone').value.trim(),
      address: U.q('#cu_addr').value.trim(), notes: U.q('#cu_notes').value.trim()
    };
    if (id) {
      const c = await DB.get('customers', id);
      Object.assign(c, patch);
      await DB.put('customers', c);
      UI.toast('Customer updated', 'ok');
    } else {
      const c = Object.assign({ id: U.uid(), createdAt: U.nowISO() }, patch);
      await DB.put('customers', c);
      const open = U.num(U.q('#cu_open').value);
      if (open !== 0) {
        await DB.put('entries', {
          customerId: c.id, customerName: c.name, type: 'opening', amount: open,
          day: U.day(), date: U.nowISO(), note: 'Opening balance (new khata)'
        });
      }
      UI.toast('Khata created for ' + name, 'ok');
    }
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    App.rerender();
  },

  /* ============ person khata ============ */
  async person(id) {
    const c = await DB.get('customers', id);
    if (!c) return '<div class="page">' + UI.backHead('Customer') + '<div class="page-body">' + UI.empty('user', 'Customer not found') + '</div></div>';
    const entries = (await DB.idx('entries', 'customerId', id))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    entries.forEach(e => { e.customerName = c.name; });
    let run = 0;
    entries.forEach(e => {
      const m = Khata.entryMeta[e.type];
      if (!m || e.type === 'advance') return;   // advance sits in pool, not balance
      if (m.dr) run += U.num(e.amount);
      else run -= Math.abs(U.num(e.amount));
      e._bal = run;
    });
    Khata.personEntries = entries;
    Khata.personCust = c;
    const bal = Khata.balanceOf(entries);
    const adv = Khata.advanceOf(entries);
    const desc = entries.slice().reverse();
    return '<div class="page">' +
      UI.backHead(U.esc(c.name), (c.phone ? U.esc(c.phone) + ' • ' : '') + U.esc(c.address || 'no address'),
        '<button class="ph-btn" onclick="Khata.customerForm(\'' + c.id + '\')">' + UI.icon('edit', 18) + '</button>') +
      '<div class="page-body">' +
      '<div class="person-hero">' +
      '<div class="row" style="margin-bottom:12px">' +
      '<div class="avatar ' + U.avatarHue(c.name) + '" style="width:48px;height:48px;border-radius:15px;font-size:17px">' + U.esc(U.initials(c.name)) + '</div>' +
      '<div style="flex:1;min-width:0"><div class="bold" style="font-size:16px">' + U.esc(c.name) + '</div>' +
      '<div class="tiny muted">' + entries.length + ' entries' + (c.notes ? ' • ' + U.esc(c.notes) : '') + '</div></div>' +
      (bal > 0 ? '<span class="balance-pill" style="background:var(--redSoft);color:var(--red)">Due ' + U.money(bal) + '</span>'
        : bal < 0 ? '<span class="balance-pill" style="background:var(--greenSoft);color:var(--green)">Advance ' + U.money(-bal) + '</span>'
        : '<span class="balance-pill" style="background:var(--greenSoft);color:var(--green)">' + UI.icon('check', 14) + ' Clear</span>') +
      '</div>' +
      (adv > 0 ? '<div class="kv" style="background:var(--greenSoft);border-radius:10px;padding:8px 12px;margin-bottom:12px"><span class="k bold">' + UI.icon('wallet', 14) + ' Advance pool available</span><span class="v green">' + U.money(adv) + '</span></div>' : '') +
      '<div class="qact">' +
      '<button onclick="App.nav(\'bform?cust=' + c.id + '\')"><span class="qa-ic i-red">' + UI.icon('cart', 16) + '</span>Sale</button>' +
      '<button onclick="Khata.addEntry(\'' + c.id + '\',\'payment\')"><span class="qa-ic i-green">' + UI.icon('cash', 16) + '</span>Payment</button>' +
      '<button onclick="Khata.addEntry(\'' + c.id + '\',\'advance\')"><span class="qa-ic i-green">' + UI.icon('wallet', 16) + '</span>Advance</button>' +
      '<button onclick="Khata.addEntry(\'' + c.id + '\',\'return\')"><span class="qa-ic i-blue">' + UI.icon('undo', 16) + '</span>Return</button>' +
      '<button onclick="Khata.addEntry(\'' + c.id + '\',\'discount\')"><span class="qa-ic i-amber">' + UI.icon('percent', 16) + '</span>Discount</button>' +
      '<button onclick="Khata.statement(\'' + c.id + '\')"><span class="qa-ic i-pri">' + UI.icon('printer', 16) + '</span>Statement</button>' +
      '</div></div>' +
      '<div class="section-label">Khata history (newest first)</div>' +
      (desc.length ? '<div class="list">' + desc.map(e => Khata.entryRow(e, true)).join('') + '</div>'
        : UI.empty('book', 'Empty khata', 'Start with a sale, payment or advance')) +
      '<button class="btn btn-danger btn-block mt10" onclick="Khata.removeCustomer(\'' + c.id + '\')">' + UI.icon('trash', 16) + ' Delete khata</button>' +
      '</div></div>';
  },

  /* ---------- add / edit entries ---------- */
  addEntry(custId, type) {
    if (!custId && type !== 'expense') return Khata.pickCustomerFor(type);
    const labels = {
      payment: 'Receive payment', advance: 'Receive advance',
      return: 'Record return', discount: 'Give discount', expense: 'Add expense', opening: 'Opening balance'
    };
    const isExpense = type === 'expense';
    UI.sheet({
      title: labels[type] || type,
      body:
      '<div class="field"><label>Amount *</label><input id="en_amt" inputmode="decimal" placeholder="0"></div>' +
      (type === 'discount' ? '<div class="hint" style="margin:-6px 0 12px">Discount reduces the amount the customer owes.</div>' : '') +
      (isExpense ? '<div class="field"><label>Category</label><input id="en_cat" list="expCats" placeholder="e.g. Transport"><datalist id="expCats"><option>Rent</option><option>Electricity</option><option>Salaries</option><option>Transport</option><option>Purchase</option><option>Other</option></datalist></div>' : '') +
      '<div class="field"><label>Date</label><input id="en_day" type="date" value="' + U.day() + '"></div>' +
      '<div class="field"><label>Note</label><input id="en_note" placeholder="optional"></div>' +
      '<button class="btn btn-pri btn-block" onclick="Khata.saveEntry(null,\'' + (custId || '') + '\',\'' + type + '\')">' + UI.icon('check', 17) + ' Save</button>'
    });
  },

  async editEntry(id) {
    const e = await DB.get('entries', id);
    if (!e) return;
    if (e.type === 'invoice') return App.nav('bill?id=' + e.invoiceId);
    const labels = { payment: 'Edit payment', advance: 'Edit advance', return: 'Edit return', discount: 'Edit discount', expense: 'Edit expense', opening: 'Edit opening balance' };
    UI.sheet({
      title: labels[e.type] || 'Edit entry',
      body:
      '<div class="field"><label>Amount ' + (e.amount < 0 ? '(negative = advance)' : '') + '</label><input id="en_amt" inputmode="decimal" value="' + e.amount + '"></div>' +
      (e.type === 'expense' ? '<div class="field"><label>Category</label><input id="en_cat" value="' + U.esc(e.category || '') + '"></div>' : '') +
      '<div class="field"><label>Date</label><input id="en_day" type="date" value="' + e.day + '"></div>' +
      '<div class="field"><label>Note</label><input id="en_note" value="' + U.esc(e.note || '') + '"></div>' +
      '<div class="row"><button class="btn btn-pri" style="flex:1" onclick="Khata.saveEntry(\'' + id + '\',\'\',\'\')">' + UI.icon('save', 16) + ' Save</button>' +
      '<button class="btn btn-danger" onclick="Khata.delEntry(\'' + id + '\')">' + UI.icon('trash', 16) + '</button></div>'
    });
  },

  async saveEntry(id, custId, type) {
    const amt = U.num(U.q('#en_amt').value);
    if (!amt) return UI.toast('Enter an amount', 'err');
    if (id) {
      const e = await DB.get('entries', id);
      e.amount = amt;
      e.day = U.q('#en_day').value || e.day;
      e.note = U.q('#en_note').value.trim();
      if (U.q('#en_cat')) e.category = U.q('#en_cat').value.trim();
      await DB.put('entries', e);
      UI.toast('Entry updated', 'ok');
    } else {
      let name = null;
      if (custId) { const c = await DB.get('customers', custId); name = c ? c.name : null; }
      await DB.put('entries', {
        customerId: custId || null, customerName: name, type, amount: amt,
        day: U.q('#en_day').value || U.day(), date: U.nowISO(),
        note: U.q('#en_note').value.trim(),
        category: U.q('#en_cat') ? U.q('#en_cat').value.trim() : ''
      });
      UI.toast('Saved to khata', 'ok');
    }
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    App.rerender();
  },

  async delEntry(id) {
    const e = await DB.get('entries', id);
    const ok = await UI.confirm({ title: 'Delete entry?', message: (e.note || e.type) + ' — ' + U.money(e.amount) + ' will be removed from the ledger.', ok: 'Delete' });
    if (!ok) return;
    await DB.del('entries', id);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast('Entry deleted', 'ok');
    App.rerender();
  },

  pickCustomerFor(type) {
    DB.all('customers').then(customers => {
      customers.sort((a, b) => a.name.localeCompare(b.name));
      UI.sheet({
        title: 'Choose customer',
        body: customers.length
          ? '<div class="list">' + customers.map(c =>
            '<div class="lrow" onclick="U.q(\'.sheet-overlay\')&&U.q(\'.sheet-overlay\').remove();Khata.addEntry(\'' + c.id + '\',\'' + type + '\')">' +
            '<div class="avatar sm ' + U.avatarHue(c.name) + '">' + U.esc(U.initials(c.name)) + '</div>' +
            '<div class="l-main"><div class="l-title">' + U.esc(c.name) + '</div>' +
            '<div class="l-sub">' + U.esc(c.phone || c.address || 'no contact') + '</div></div>' +
            UI.icon('chevR', 16) + '</div>').join('') + '</div>'
          : UI.empty('users', 'No customers yet', '') +
            '<button class="btn btn-pri btn-block" onclick="U.q(\'.sheet-overlay\')&&U.q(\'.sheet-overlay\').remove();Khata.customerForm()">Add customer first</button>'
      });
    });
  },

  addExpense() { Khata.addEntry(null, 'expense'); },

  async removeCustomer(id) {
    const entries = await DB.idx('entries', 'customerId', id);
    if (entries.length) return UI.toast('This khata has entries — it cannot be deleted', 'err');
    const ok = await UI.confirm({ title: 'Delete customer?', message: 'Empty khata will be removed permanently.', ok: 'Delete' });
    if (!ok) return;
    await DB.del('customers', id);
    UI.toast('Customer deleted', 'ok');
    App.nav('khata');
  },

  /* ---------- printable statement ---------- */
  async statement(id) {
    const c = await DB.get('customers', id);
    const entries = (await DB.idx('entries', 'customerId', id)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const bal = Khata.balanceOf(entries);
    const adv = Khata.advanceOf(entries);
    let run = 0;
    const rows = entries.map(e => {
      const m = Khata.entryMeta[e.type] || { dr: false };
      let delta = 0;
      if (e.type === 'advance') delta = 0;
      else if (m.dr) delta = U.num(e.amount);
      else delta = -Math.abs(U.num(e.amount));
      run += delta;
      return '<tr><td>' + U.fmtDay(e.day) + '</td><td>' + (m.label || e.type) + (e.note ? '<br><small>' + U.esc(e.note) + '</small>' : '') + '</td>' +
        '<td class="num">' + (delta > 0 ? U.money(delta) : '') + '</td><td class="num">' + (delta < 0 ? U.money(-delta) : '') + '</td><td class="num">' + U.money(run) + '</td></tr>';
    }).join('');
    U.q('#printArea').innerHTML =
      '<div class="print-doc"><div class="p-shop"><div><h1>' + U.esc(App.s.shopName) + '</h1><div>' + U.esc(App.s.shopPhone || '') + '</div></div>' +
      '<div class="p-inv"><div class="no">KHATA STATEMENT</div><div>' + new Date().toLocaleDateString() + '</div></div></div>' +
      '<p><b>Customer:</b> ' + U.esc(c.name) + (c.phone ? ' • ' + U.esc(c.phone) : '') + (c.address ? '<br>' + U.esc(c.address) : '') + '</p>' +
      '<table><tr><th>Date</th><th>Detail</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th></tr>' + rows + '</table>' +
      '<div class="p-totals"><div class="kv total"><span>Current balance</span><span>' + U.money(bal) + '</span></div>' +
      (adv > 0 ? '<div class="kv"><span class="k">Advance pool</span><span>' + U.money(adv) + '</span></div>' : '') + '</div>' +
      '<div class="p-foot">' + U.esc(App.s.shopName) + ' — generated by Easy Khata</div></div>';
    setTimeout(() => window.print(), 60);
  }
};
