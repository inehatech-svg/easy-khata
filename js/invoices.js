/* Invoices: create with line items, auto advance deduction, print, payments, returns */
const Invoices = {
  filter: 'all',
  search: '',
  draft: null,

  /* ============ list ============ */
  async list() {
    const invs = (await DB.all('invoices')).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    Invoices.cache = invs;
    const counts = { all: invs.length, due: 0, overdue: 0, paid: 0 };
    invs.forEach(i => {
      const st = Invoices.statusOf(i);
      if (st === 'paid') counts.paid++;
      else { counts.due++; if (st === 'overdue') counts.overdue++; }
    });
    Invoices.counts = counts;
    return '<div class="page">' +
      UI.pageHead('Invoices', 'Total ' + U.money(U.sum(invs, i => i.total)) + ' billed',
        '<button class="ph-btn" onclick="App.nav(\'bform\')">' + UI.icon('plus', 19) + '</button>') +
      '<div class="page-body">' +
      '<div class="searchbar">' + UI.icon('search', 18) + '<input id="inv_q" placeholder="Search bill no. or customer…" value="' + U.esc(Invoices.search) + '" oninput="Invoices.search=this.value;Invoices.renderList()"></div>' +
      '<div class="chiprow">' +
      [['all', 'All'], ['due', 'Unpaid'], ['overdue', 'Overdue'], ['paid', 'Paid']].map(f =>
        '<button class="filter-chip ' + (Invoices.filter === f[0] ? 'on' : '') + '" onclick="Invoices.filter=\'' + f[0] + '\';Invoices.renderList()">' + f[1] + ' ' + counts[f[0]] + '</button>').join('') +
      '</div><div id="inv_list"></div></div></div>';
  },

  async bind() { Invoices.renderList(); },

  async renderList() {
    let invs = Invoices.cache || [];
    if (Invoices.filter !== 'all') invs = invs.filter(i => Invoices.statusOf(i) === Invoices.filter ||
      (Invoices.filter === 'due' && Invoices.statusOf(i) !== 'paid'));
    if (Invoices.search) {
      const s = Invoices.search.toLowerCase();
      invs = invs.filter(i => ((i.no || '') + ' ' + (i.customerName || '')).toLowerCase().includes(s));
    }
    const el = U.q('#inv_list');
    if (!el) return;
    el.innerHTML = invs.length ? '<div class="list">' + invs.map(i => Invoices.row(i)).join('') + '</div>'
      : UI.empty('receipt', 'No invoices', 'Tap + to create your first bill');
  },

  statusOf(inv) {
    const due = U.num(inv.total) - U.num(inv.paid) - U.num(inv.advanceApplied) - U.num(inv.returned);
    if (due <= 0.009) return 'paid';
    if (inv.dueDate && U.day() > inv.dueDate) return 'overdue';
    return 'due';
  },

  dueOf(inv) {
    return Math.max(0, U.num(inv.total) - U.num(inv.paid) - U.num(inv.advanceApplied) - U.num(inv.returned));
  },

  statusChip(inv) {
    const st = Invoices.statusOf(inv);
    return st === 'paid' ? '<span class="chip green">Paid</span>'
      : st === 'overdue' ? '<span class="chip red">Overdue</span>'
      : '<span class="chip amber">Due ' + U.money(Invoices.dueOf(inv)) + '</span>';
  },

  row(inv) {
    const st = Invoices.statusOf(inv);
    return '<div class="lrow" onclick="App.nav(\'bill?id=' + inv.id + '\')">' +
      '<div class="avatar sm ' + (st === 'paid' ? 'green' : st === 'overdue' ? 'red' : 'amber') + '">' + UI.icon('receipt', 16) + '</div>' +
      '<div class="l-main"><div class="l-title">' + U.esc(inv.no) + ' — ' + U.esc(inv.customerName || 'Walk-in') + '</div>' +
      '<div class="l-sub">' + U.fmtDay(inv.day) + (inv.dueDate && st !== 'paid' ? ' • pay by ' + U.fmtDay(inv.dueDate) : '') + '</div></div>' +
      '<div class="l-right"><div class="l-amt">' + U.money(inv.total) + '</div><div class="l-tag">' + Invoices.statusChip(inv) + '</div></div></div>';
  },

  /* ============ create / edit form ============ */
  async form(params) {
    let editInv = null;
    if (params.id) editInv = await DB.get('invoices', params.id);
    Invoices.draft = {
      editId: editInv ? editInv.id : null,
      customerId: editInv ? editInv.customerId : (params.cust || ''),
      walkinName: editInv && !editInv.customerId ? (editInv.customerName || '') : '',
      lines: editInv ? JSON.parse(JSON.stringify(editInv.lines)) : [],
      discount: editInv ? editInv.discount : 0,
      discountNote: editInv ? (editInv.discountNote || '') : '',
      paid: editInv ? 0 : 0,
      dueDate: editInv ? (editInv.dueDate || '') : '',
      notes: editInv ? (editInv.notes || '') : ''
    };
    const customers = await DB.all('customers');
    customers.sort((a, b) => a.name.localeCompare(b.name));
    Invoices.customers = customers;
    const invNo = editInv ? editInv.no : Invoices.nextNo();
    return '<div class="page">' +
      UI.backHead(editInv ? 'Edit ' + U.esc(editInv.no) : 'New Invoice', editInv ? 'Changes recompute stock & ledger' : invNo) +
      '<div class="page-body">' +
      '<div class="card"><div class="field" style="margin-bottom:' + (Invoices.draft.customerId ? '0' : '12px') + '"><label>Customer</label>' +
      '<select id="iv_cust" onchange="Invoices.setCustomer(this.value)">' +
      '<option value="">— Walk-in (no khata) —</option>' +
      customers.map(c => '<option value="' + c.id + '" ' + (c.id === Invoices.draft.customerId ? 'selected' : '') + '>' + U.esc(c.name) + (c.phone ? ' (' + U.esc(c.phone) + ')' : '') + '</option>').join('') +
      '</select></div>' +
      '<div id="iv_walkin" ' + (Invoices.draft.customerId ? 'hidden' : '') + ' class="field"><label>Walk-in customer name (optional)</label><input id="iv_walkin_name" value="' + U.esc(Invoices.draft.walkinName) + '" placeholder="e.g. Mr. Khan"></div>' +
      '</div>' +
      '<div class="card"><div class="card-title">' + UI.icon('cart', 16) + ' Items' +
      '<span class="ph-spacer"></span><button class="btn btn-sm" onclick="Invoices.pickItem()">' + UI.icon('plus', 14) + ' Add item</button></div>' +
      '<div id="iv_lines"></div></div>' +
      '<div class="card"><div class="card-title">' + UI.icon('cash', 16) + ' Totals & payment</div>' +
      '<div id="iv_totals"></div>' +
      '<div class="field mt10"><label>Received now (cash)</label><input id="iv_paid" inputmode="decimal" value="0" oninput="Invoices.updateTotals()"></div>' +
      '<div id="iv_advrow"></div>' +
      '<div class="field-row">' +
      '<div class="field"><label>Due date (optional)</label><input id="iv_duedate" type="date" value="' + Invoices.draft.dueDate + '"></div>' +
      '<div class="field"><label>Discount ' + U.money(0).replace(/[\d.,]/g, '').slice(0, 2) + '</label><input id="iv_disc" inputmode="decimal" value="' + Invoices.draft.discount + '" oninput="Invoices.updateTotals()"></div>' +
      '</div>' +
      '<div class="field"><label>Discount note</label><input id="iv_discnote" value="' + U.esc(Invoices.draft.discountNote) + '" placeholder="e.g. special customer"></div>' +
      '<div class="field"><label>Notes</label><input id="iv_notes" value="' + U.esc(Invoices.draft.notes) + '" placeholder="warranty, fitting details…"></div>' +
      '<button class="btn btn-pri btn-block" onclick="Invoices.save()">' + UI.icon('check', 17) + ' ' + (editInv ? 'Update invoice' : 'Save invoice') + '</button>' +
      '</div></div></div>';
  },

  nextNo() {
    return 'INV-' + String(App.s.seq).padStart(4, '0');
  },

  bindForm() {
    Invoices.renderLines();
    Invoices.updateTotals();
  },

  setCustomer(v) {
    Invoices.draft.customerId = v;
    const w = U.q('#iv_walkin'); if (w) w.hidden = !!v;
    Invoices.updateTotals();
  },

  pickItem() {
    const sheet = UI.sheet({
      title: 'Pick inventory item',
      body: '<div class="searchbar" style="margin-bottom:10px">' + UI.icon('search', 18) + '<input id="pk_q" placeholder="Search items…" oninput="Invoices.renderPickList()"></div>' +
      '<div id="pk_list"></div>' +
      '<button class="btn btn-block mt10" onclick="Invoices.customLine()">' + UI.icon('edit', 16) + ' Add custom line (service / non-stock)</button>'
    });
    setTimeout(() => Invoices.renderPickList(), 30);
  },

  async renderPickList() {
    const items = (await DB.all('items')).filter(i => !i.archived);
    const s = (U.q('#pk_q') ? U.q('#pk_q').value : '').toLowerCase();
    const list = items.filter(i => (i.name + ' ' + (i.sku || '') + ' ' + (i.category || '')).toLowerCase().includes(s))
      .sort((a, b) => a.name.localeCompare(b.name)).slice(0, 40);
    const el = U.q('#pk_list'); if (!el) return;
    el.innerHTML = list.length ? '<div class="list">' + list.map(i =>
      '<div class="lrow" onclick="Invoices.pickItemDone(\'' + i.id + '\')">' +
      '<div class="l-main"><div class="l-title">' + U.esc(i.name) + '</div><div class="l-sub">' + U.esc(i.category || '') + ' • stock ' + U.fmtQty(i.qty) + ' ' + U.esc(i.unit || '') + '</div></div>' +
      '<div class="l-right"><div class="l-amt">' + U.money(i.salePrice) + '</div></div></div>').join('') + '</div>'
      : UI.empty('search', 'No items match');
  },

  async pickItemDone(id) {
    const it = await DB.get('items', id);
    Invoices.draft.lines.push({ itemId: it.id, name: it.name, unit: it.unit || 'pcs', qty: 1, rate: it.salePrice, custom: false });
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    Invoices.renderLines();
    Invoices.updateTotals();
  },

  customLine() {
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    Invoices.draft.lines.push({ itemId: null, name: 'Service / other', unit: 'job', qty: 1, rate: 0, custom: true });
    Invoices.renderLines();
    Invoices.updateTotals();
    UI.toast('Edit name, qty & rate below', '');
  },

  lineQty(i, v) { Invoices.draft.lines[i].qty = U.num(v); Invoices.updateTotals(); },
  lineRate(i, v) { Invoices.draft.lines[i].rate = U.num(v); Invoices.updateTotals(); },
  lineName(i, v) { Invoices.draft.lines[i].name = v; },
  removeLine(i) { Invoices.draft.lines.splice(i, 1); Invoices.renderLines(); Invoices.updateTotals(); },

  renderLines() {
    const el = U.q('#iv_lines'); if (!el) return;
    el.innerHTML = Invoices.draft.lines.length ? Invoices.draft.lines.map((l, i) =>
      '<div class="line-item"><div class="line-grid">' +
      '<div><input style="background:transparent;border:none;padding:2px 0;font-weight:700;font-size:13px" value="' + U.esc(l.name) + '" oninput="Invoices.lineName(' + i + ',this.value)">' +
      '<div class="tiny muted">' + (l.custom ? 'custom line' : 'inventory item') + ' • ' + U.money(l.qty * l.rate) + '</div></div>' +
      '<input inputmode="decimal" value="' + U.fmtQty(l.qty) + '" oninput="Invoices.lineQty(' + i + ',this.value)">' +
      '<input inputmode="decimal" value="' + l.rate + '" oninput="Invoices.lineRate(' + i + ',this.value)">' +
      '<button class="x-btn" style="width:30px;height:30px" onclick="Invoices.removeLine(' + i + ')">' + UI.icon('x', 14) + '</button>' +
      '</div></div>').join('')
      : UI.empty('cart', 'No items yet', 'Tap “Add item” to build the bill');
  },

  async updateTotals() {
    const d = Invoices.draft;
    const subtotal = U.sum(d.lines, l => U.num(l.qty) * U.num(l.rate));
    d.discount = U.num(U.q('#iv_disc') ? U.q('#iv_disc').value : d.discount);
    const total = Math.max(0, subtotal - d.discount);
    const paid = U.num(U.q('#iv_paid') ? U.q('#iv_paid').value : 0);
    let advAvail = 0, advApply = 0;
    if (d.customerId && App.s.autoAdvance) {
      const entries = await DB.idx('entries', 'customerId', d.customerId);
      advAvail = Khata.advanceOf(entries);
      advApply = Math.min(advAvail, Math.max(0, total - paid));
    }
    const tEl = U.q('#iv_totals');
    if (tEl) tEl.innerHTML =
      '<div class="kv"><span class="k">Subtotal</span><span class="v">' + U.money(subtotal) + '</span></div>' +
      '<div class="kv"><span class="k">Discount</span><span class="v red">− ' + U.money(d.discount) + '</span></div>' +
      '<div class="kv total"><span class="k">Total</span><span class="v">' + U.money(total) + '</span></div>';
    const aEl = U.q('#iv_advrow');
    if (aEl) aEl.innerHTML = (advAvail > 0 && App.s.autoAdvance)
      ? '<div class="kv" style="background:var(--greenSoft);border-radius:10px;padding:8px 12px"><span class="k bold">⚡ Advance available ' + U.money(advAvail) + '</span><span class="v green">auto-adjust ' + U.money(advApply) + '</span></div>'
      : (advAvail > 0 ? '<div class="hint">Customer advance ' + U.money(advAvail) + ' — enable auto-adjust in Settings to use it</div>' : '');
  },

  async save() {
    const d = Invoices.draft;
    const lines = d.lines.filter(l => U.num(l.qty) > 0);
    if (!lines.length) return UI.toast('Add at least one item', 'err');
    const subtotal = U.sum(lines, l => U.num(l.qty) * U.num(l.rate));
    const discount = U.num(U.q('#iv_disc').value);
    if (discount > subtotal) return UI.toast('Discount is larger than subtotal', 'err');
    const total = subtotal - discount;
    const walkin = U.q('#iv_walkin_name') ? U.q('#iv_walkin_name').value.trim() : '';
    if (!d.customerId && !walkin) {
      const ok = await UI.confirm({ title: 'Walk-in customer', message: 'No customer selected and no name given — save as anonymous walk-in bill?', ok: 'Save anyway', danger: false });
      if (!ok) return;
    }
    // stock check
    const short = [];
    const items = await DB.all('items');
    const byId = {}; items.forEach(i => byId[i.id] = i);
    lines.forEach(l => { if (!l.custom && byId[l.itemId] && byId[l.itemId].qty < U.num(l.qty)) short.push(l.name + ' (have ' + U.fmtQty(byId[l.itemId].qty) + ')'); });
    if (short.length) {
      const ok = await UI.confirm({ title: 'Not enough stock', message: 'Low/insufficient stock for: ' + short.join(', ') + '. Save anyway? Stock will go negative.', ok: 'Save anyway' });
      if (!ok) return;
    }
    const paid = U.num(U.q('#iv_paid').value);
    const dueDate = U.q('#iv_duedate').value;
    const notes = U.q('#iv_notes').value.trim();
    const discNote = U.q('#iv_discnote').value.trim();
    const cust = d.customerId ? await DB.get('customers', d.customerId) : null;
    const day = U.day();

    let inv;
    if (d.editId) {
      inv = await DB.get('invoices', d.editId);
      // remove old invoice entries + stock moves; keep payments/returns/advance applications
      const linked = await DB.idx('entries', 'invoiceId', inv.id);
      for (const e of linked) if (e.type === 'invoice') await DB.del('entries', e.id);
      const moves = await DB.idx('moves', 'refId', inv.id);
      for (const m of moves) if (m.refType === 'invoice' && m.type === 'out') await DB.del('moves', m.id);
      Object.assign(inv, { customerId: d.customerId, customerName: cust ? cust.name : (walkin || 'Walk-in'), lines, subtotal, discount, total, discountNote: discNote, dueDate, notes, day });
      inv.updatedAt = U.nowISO();
      await Stock.recalcMany(lines.filter(l => !l.custom).map(l => l.itemId));
    } else {
      const no = Invoices.nextNo();
      App.s.seq++;
      await App.saveSettings();
      inv = {
        id: U.uid(), no, customerId: d.customerId,
        customerName: cust ? cust.name : (walkin || 'Walk-in'),
        lines, subtotal, discount, discountNote: discNote,
        total, paid: 0, advanceApplied: 0, returned: 0,
        dueDate, notes, day, date: U.nowISO(), createdAt: U.nowISO()
      };
    }
    // recompute denormalized credit fields from surviving linked entries
    const linked = await DB.idx('entries', 'invoiceId', inv.id);
    inv.paid = U.sumType(linked, ['payment']);
    inv.advanceApplied = U.sumType(linked, ['advance_apply']);
    inv.returned = U.sumType(linked, ['return']);
    if (!d.editId) { inv.paid = 0; inv.advanceApplied = 0; inv.returned = 0; }

    // new payment with invoice
    if (paid > 0) {
      await DB.put('entries', {
        customerId: d.customerId, type: 'payment', amount: Math.min(paid, total),
        day, note: 'Paid with ' + inv.no, invoiceId: inv.id, invoiceNo: inv.no
      });
      inv.paid += Math.min(paid, total);
    }
    // auto advance deduction
    if (d.customerId && App.s.autoAdvance) {
      const cents = await DB.idx('entries', 'customerId', d.customerId);
      const pool = Khata.advanceOf(cents);
      const apply = Math.min(pool, Math.max(0, total - inv.paid));
      if (apply > 0) {
        await DB.put('entries', {
          customerId: d.customerId, type: 'advance_apply', amount: apply,
          day, note: 'Advance adjusted to ' + inv.no, invoiceId: inv.id, invoiceNo: inv.no
        });
        inv.advanceApplied += apply;
      }
    }
    // invoice debit entry
    await DB.put('entries', {
      customerId: d.customerId, type: 'invoice', amount: total,
      day, note: inv.no + (discount > 0 ? ' (disc ' + U.money(discount) + (discNote ? ' — ' + discNote : '') + ')' : ''),
      invoiceId: inv.id, invoiceNo: inv.no
    });
    // stock moves
    for (const l of lines) {
      if (!l.custom) {
        await Stock.addMove(l.itemId, 'out', l.qty, { refType: 'invoice', refId: inv.id, refNo: inv.no, note: inv.no, day });
      }
    }
    await Stock.recalcMany(lines.filter(l => !l.custom).map(l => l.itemId));
    await DB.put('invoices', inv);
    UI.toast(d.editId ? 'Invoice updated' : inv.no + ' created', 'ok');
    App.nav('bill?id=' + inv.id);
  },

  /* ============ invoice view ============ */
  async view(id) {
    const inv = await DB.get('invoices', id);
    if (!inv) return '<div class="page">' + UI.backHead('Invoice') + '<div class="page-body">' + UI.empty('receipt', 'Invoice not found') + '</div></div>';
    const st = Invoices.statusOf(inv);
    const due = Invoices.dueOf(inv);
    return '<div class="page">' +
      UI.backHead(U.esc(inv.no), U.fmtDay(inv.day) + ' • ' + U.esc(inv.customerName || 'Walk-in'),
        '<button class="ph-btn" onclick="App.nav(\'bform?id=' + inv.id + '\')">' + UI.icon('edit', 18) + '</button>') +
      '<div class="page-body">' +
      '<div class="card"><div class="row-between">' + Invoices.statusChip(inv) +
      '<span class="chip plain">' + inv.lines.length + ' items</span></div>' +
      '<div class="kv total"><span class="k">Invoice total</span><span class="v">' + U.money(inv.total) + '</span></div>' +
      (inv.paid ? '<div class="kv"><span class="k">Received</span><span class="v green">' + U.money(inv.paid) + '</span></div>' : '') +
      (inv.advanceApplied ? '<div class="kv"><span class="k">Advance adjusted</span><span class="v green">' + U.money(inv.advanceApplied) + '</span></div>' : '') +
      (inv.returned ? '<div class="kv"><span class="k">Returned credit</span><span class="v">' + U.money(inv.returned) + '</span></div>' : '') +
      (due > 0 ? '<div class="kv"><span class="k red bold">Balance due</span><span class="v red">' + U.money(due) + (inv.dueDate ? ' <span class="small muted">by ' + U.fmtDay(inv.dueDate) + '</span>' : '') + '</span></div>' : '') +
      '<div class="grid3 mt10">' +
      '<button class="btn btn-sm" onclick="Invoices.print(\'' + inv.id + '\')">' + UI.icon('printer', 15) + ' Print</button>' +
      '<button class="btn btn-sm" onclick="Invoices.share(\'' + inv.id + '\')">' + UI.icon('share', 15) + ' Share</button>' +
      (due > 0 && inv.customerId ? '<button class="btn btn-green btn-sm" onclick="Invoices.receive(\'' + inv.id + '\')">' + UI.icon('cash', 15) + ' Payment</button>'
        : '<button class="btn btn-sm" onclick="Invoices.returnItems(\'' + inv.id + '\')">' + UI.icon('undo', 15) + ' Return</button>') +
      '</div>' +
      (due > 0 && inv.customerId ? '<button class="btn btn-block mt10" onclick="Invoices.returnItems(\'' + inv.id + '\')">' + UI.icon('undo', 15) + ' Return items</button>' : '') +
      (inv.notes ? '<div class="hint mt10">📝 ' + U.esc(inv.notes) + '</div>' : '') +
      '</div>' +
      '<div class="card"><div class="card-title">' + UI.icon('cart', 16) + ' Items</div>' +
      '<table class="table-mini"><tr><th>Item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr>' +
      inv.lines.map(l => '<tr><td>' + U.esc(l.name) + '</td><td class="num">' + U.fmtQty(l.qty) + '</td><td class="num">' + U.money(l.rate) + '</td><td class="num">' + U.money(l.qty * l.rate) + '</td></tr>').join('') +
      '</table>' +
      (inv.discount ? '<div class="kv mt6"><span class="k">Discount' + (inv.discountNote ? ' (' + U.esc(inv.discountNote) + ')' : '') + '</span><span class="v red">− ' + U.money(inv.discount) + '</span></div>' : '') +
      '</div>' +
      '<button class="btn btn-danger btn-block" onclick="Invoices.remove(\'' + inv.id + '\')">' + UI.icon('trash', 16) + ' Delete invoice</button>' +
      '</div></div>';
  },

  async receive(id) {
    const inv = await DB.get('invoices', id);
    const due = Invoices.dueOf(inv);
    UI.sheet({
      title: 'Receive payment — ' + inv.no,
      body:
      '<div class="kv" style="background:var(--field);border-radius:10px;padding:10px 12px;margin-bottom:12px"><span class="k">Balance due</span><span class="v red">' + U.money(due) + '</span></div>' +
      '<div class="field"><label>Amount received *</label><input id="pay_amt" inputmode="decimal" value="' + due + '"></div>' +
      '<div class="field"><label>Note</label><input id="pay_note" placeholder="cash / bank / easypaisa…"></div>' +
      '<button class="btn btn-green btn-block" onclick="Invoices.savePayment(\'' + id + '\')">' + UI.icon('check', 17) + ' Record payment</button>'
    });
  },

  async savePayment(id) {
    const inv = await DB.get('invoices', id);
    const amt = U.num(U.q('#pay_amt').value);
    if (amt <= 0) return UI.toast('Enter amount', 'err');
    await DB.put('entries', {
      customerId: inv.customerId, type: 'payment', amount: amt, day: U.day(),
      note: 'Payment for ' + inv.no + (U.q('#pay_note').value.trim() ? ' — ' + U.q('#pay_note').value.trim() : ''),
      invoiceId: inv.id, invoiceNo: inv.no
    });
    inv.paid = U.num(inv.paid) + amt;
    await DB.put('invoices', inv);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast('Payment recorded', 'ok');
    App.rerender();
  },

  async returnItems(id) {
    const inv = await DB.get('invoices', id);
    const rets = (await DB.idx('entries', 'invoiceId', id)).filter(e => e.type === 'return');
    const retByItem = {};
    rets.forEach(r => (r.items || []).forEach(li => {
      retByItem[li.itemId || li.name] = (retByItem[li.itemId || li.name] || 0) + U.num(li.qty);
    }));
    const rows = inv.lines.map((l, idx) => {
      const key = l.itemId || l.name;
      const already = retByItem[key] || 0;
      const remaining = U.num(l.qty) - already;
      return '<div class="line-item" ' + (remaining <= 0 ? 'style="opacity:.45"' : '') + '>' +
        '<div class="row-between"><div><div class="bold small">' + U.esc(l.name) + '</div>' +
        '<div class="tiny muted">bought ' + U.fmtQty(l.qty) + ' • returned ' + U.fmtQty(already) + '</div></div>' +
        (remaining > 0 ? '<input id="rt_' + idx + '" inputmode="decimal" placeholder="0" value="0" style="width:70px;text-align:right;background:var(--field);border:1px solid var(--line);border-radius:9px;padding:8px">' : '<span class="chip plain">fully returned</span>') +
        '</div></div>';
    }).join('');
    UI.sheet({
      title: 'Return items — ' + inv.no,
      body:
      '<div class="hint" style="margin-bottom:10px">Returned items go back into inventory and the customer\'s balance is credited.</div>' +
      rows +
      '<div class="field mt10"><label>Reason</label><input id="rt_note" placeholder="e.g. defective panel"></div>' +
      '<button class="btn btn-pri btn-block" onclick="Invoices.doReturn(\'' + id + '\')">' + UI.icon('undo', 17) + ' Process return</button>'
    });
  },

  async doReturn(id) {
    const inv = await DB.get('invoices', id);
    const items = [];
    let total = 0;
    inv.lines.forEach((l, idx) => {
      const qty = U.num(U.q('#rt_' + idx) ? U.q('#rt_' + idx).value : 0);
      if (qty > 0) {
        items.push({ itemId: l.itemId, name: l.name, qty, rate: l.rate });
        total += qty * U.num(l.rate);
      }
    });
    if (!items.length) return UI.toast('Enter return quantity for at least one item', 'err');
    const note = U.q('#rt_note').value.trim();
    await DB.put('entries', {
      customerId: inv.customerId, type: 'return', amount: total, items,
      day: U.day(), invoiceId: inv.id, invoiceNo: inv.no,
      note: note || ('Return against ' + inv.no)
    });
    for (const li of items) {
      if (li.itemId) await Stock.addMove(li.itemId, 'return', li.qty, { refType: 'return', refId: inv.id, refNo: inv.no, note: note || 'Return', day: U.day() });
    }
    await Stock.recalcMany(items.filter(i => i.itemId).map(i => i.itemId));
    inv.returned = U.num(inv.returned) + total;
    await DB.put('invoices', inv);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast('Return processed — stock updated', 'ok');
    App.rerender();
  },

  async remove(id) {
    const inv = await DB.get('invoices', id);
    const ok = await UI.confirm({
      title: 'Delete ' + inv.no + '?',
      message: 'This removes the bill, its payments, advance adjustments, returns and puts returned stock back out of inventory. Ledger history will change.',
      ok: 'Delete forever'
    });
    if (!ok) return;
    const linked = await DB.idx('entries', 'invoiceId', id);
    for (const e of linked) await DB.del('entries', e.id);
    const moves = await DB.idx('moves', 'refId', id);
    const itemIds = [];
    for (const m of moves) { itemIds.push(m.itemId); await DB.del('moves', m.id); }
    await Stock.recalcMany(itemIds);
    await DB.del('invoices', id);
    UI.toast('Invoice deleted', 'ok');
    App.nav('bills');
  },

  /* ============ print & share ============ */
  async print(id) {
    const inv = await DB.get('invoices', id);
    const st = Invoices.statusOf(inv);
    const due = Invoices.dueOf(inv);
    const s = App.s;
    U.q('#printArea').innerHTML =
      '<div class="print-doc">' +
      '<div class="p-shop"><div><h1>' + U.esc(s.shopName) + '</h1>' +
      '<div class="p-mut">' + U.esc(s.shopPhone || '') + (s.shopAddress ? ' • ' + U.esc(s.shopAddress) : '') + '</div></div>' +
      '<div class="p-inv"><div class="no">' + U.esc(inv.no) + '</div><div>' + U.fmtDay(inv.day) + '</div>' +
      '<div class="p-status" style="color:' + (st === 'paid' ? '#047857' : st === 'overdue' ? '#dc2626' : '#d97706') + ';border-color:currentColor">' + st.toUpperCase() + '</div></div></div>' +
      '<p><b>Customer:</b> ' + U.esc(inv.customerName || 'Walk-in') + '</p>' +
      '<table><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr>' +
      inv.lines.map((l, i) => '<tr><td>' + (i + 1) + '</td><td>' + U.esc(l.name) + '</td><td class="num">' + U.fmtQty(l.qty) + '</td><td class="num">' + U.money(l.rate) + '</td><td class="num">' + U.money(l.qty * l.rate) + '</td></tr>').join('') +
      '</table>' +
      '<div class="p-totals">' +
      '<div class="kv"><span class="k">Subtotal</span><span>' + U.money(inv.subtotal) + '</span></div>' +
      (inv.discount ? '<div class="kv"><span class="k">Discount</span><span>− ' + U.money(inv.discount) + '</span></div>' : '') +
      '<div class="kv total"><span>Total</span><span>' + U.money(inv.total) + '</span></div>' +
      (inv.paid ? '<div class="kv"><span class="k">Received</span><span>' + U.money(inv.paid) + '</span></div>' : '') +
      (inv.advanceApplied ? '<div class="kv"><span class="k">Advance adjusted</span><span>' + U.money(inv.advanceApplied) + '</span></div>' : '') +
      (inv.returned ? '<div class="kv"><span class="k">Returned</span><span>− ' + U.money(inv.returned) + '</span></div>' : '') +
      (due > 0 ? '<div class="kv"><span class="k"><b>Balance due</b></span><span><b>' + U.money(due) + '</b></span></div>' : '') +
      '</div>' +
      (inv.dueDate ? '<p>Payment due by <b>' + U.fmtDay(inv.dueDate) + '</b></p>' : '') +
      (inv.notes ? '<p class="p-mut">' + U.esc(inv.notes) + '</p>' : '') +
      '<div class="p-foot">Thank you for your business — ' + U.esc(s.shopName) + '<br>Generated by Easy Khata • ' + new Date().toLocaleString() + '</div>' +
      '</div>';
    setTimeout(() => window.print(), 60);
  },

  async share(id) {
    const inv = await DB.get('invoices', id);
    const due = Invoices.dueOf(inv);
    const text = '*' + App.s.shopName + '*\n' + inv.no + ' • ' + U.fmtDay(inv.day) +
      '\nCustomer: ' + (inv.customerName || 'Walk-in') +
      '\n' + inv.lines.map(l => '• ' + l.name + ' x' + U.fmtQty(l.qty) + ' = ' + U.money(l.qty * l.rate)).join('\n') +
      '\nTotal: ' + U.money(inv.total) +
      (inv.discount ? '\nDiscount: -' + U.money(inv.discount) : '') +
      (inv.paid ? '\nReceived: ' + U.money(inv.paid) : '') +
      '\nBalance due: ' + U.money(due) +
      (inv.dueDate ? '\nPay by ' + U.fmtDay(inv.dueDate) : '');
    const phone = '';
    const wa = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
    try {
      if (navigator.share) await navigator.share({ title: inv.no, text });
      else { window.open(wa, '_blank'); }
    } catch (e) { /* cancelled */ }
  }
};
