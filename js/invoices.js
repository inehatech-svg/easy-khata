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
    const due = Finance.invoiceDue(inv);
    if (U.num(inv.returned) >= U.num(inv.total) && U.num(inv.total) > 0) return 'returned';
    if (due <= 0) return 'paid';
    if (inv.dueDate && U.day() > inv.dueDate) return 'overdue';
    if (U.num(inv.paid) + U.num(inv.advanceApplied) > 0) return 'partial';
    return 'due';
  },

  dueOf(inv) {
    return Finance.invoiceDue(inv);
  },

  statusChip(inv) {
    const st = Invoices.statusOf(inv);
    return st === 'paid' ? '<span class="chip green">Paid</span>'
      : st === 'returned' ? '<span class="chip plain">Returned</span>'
      : st === 'overdue' ? '<span class="chip red">Overdue</span>'
      : st === 'partial' ? '<span class="chip amber">Partial · ' + U.money(Invoices.dueOf(inv)) + ' due</span>'
      : '<span class="chip amber">Unpaid · ' + U.money(Invoices.dueOf(inv)) + '</span>';
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
    const estimateAmount = Math.max(0, U.num(params.estimateAmount));
    Invoices.draft = {
      editId: editInv ? editInv.id : null,
      customerId: editInv ? editInv.customerId : (params.cust || params.cid || ''),
      orderId: editInv ? (editInv.sourceOrderId || '') : (params.orderId || ''),
      walkinName: editInv && !editInv.customerId ? (editInv.customerName || '') : '',
      lines: editInv ? JSON.parse(JSON.stringify(editInv.lines)) : (estimateAmount > 0 ? [{ itemId: null, name: params.estimateName || 'Website order estimate', unit: 'system', qty: 1, rate: estimateAmount, custom: true }] : []),
      discount: editInv ? editInv.discount : 0,
      tax: editInv ? U.num(editInv.tax) : 0,
      charges: editInv ? U.num(editInv.charges) : 0,
      discountNote: editInv ? (editInv.discountNote || '') : '',
      paid: editInv ? 0 : 0,
      dueDate: editInv ? (editInv.dueDate || '') : '',
      notes: editInv ? (editInv.notes || '') : (params.note || '')
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
      '<div class="field mt10"><label>Received now</label><input id="iv_paid" inputmode="decimal" value="0" oninput="Invoices.updateTotals()"></div>' +
      '<div class="field-row"><div class="field"><label>Payment method</label><select id="iv_method"><option>Cash</option><option>JazzCash</option><option>Easypaisa</option><option>Bank</option><option>Cheque</option><option>Other</option></select></div><div class="field"><label>Reference no.</label><input id="iv_ref" placeholder="optional"></div></div>' +
      '<div id="iv_advrow"></div>' +
      '<div class="field-row">' +
      '<div class="field"><label>Due date (optional)</label><input id="iv_duedate" type="date" value="' + Invoices.draft.dueDate + '"></div>' +
      '<div class="field"><label>Discount ' + U.money(0).replace(/[\d.,]/g, '').slice(0, 2) + '</label><input id="iv_disc" inputmode="decimal" value="' + Invoices.draft.discount + '" oninput="Invoices.updateTotals()"></div>' +
      '</div>' +
      '<div class="field"><label>Discount note</label><input id="iv_discnote" value="' + U.esc(Invoices.draft.discountNote) + '" placeholder="e.g. special customer"></div>' +
      '<div class="field-row"><div class="field"><label>Tax</label><input id="iv_tax" inputmode="decimal" value="' + U.num(Invoices.draft.tax) + '" oninput="Invoices.updateTotals()"></div><div class="field"><label>Delivery / other charge</label><input id="iv_charges" inputmode="decimal" value="' + U.num(Invoices.draft.charges) + '" oninput="Invoices.updateTotals()"></div></div>' +
      '<div class="field"><label>Notes</label><input id="iv_notes" value="' + U.esc(Invoices.draft.notes) + '" placeholder="warranty, fitting details…"></div>' +
      '<button class="btn btn-pri btn-block" onclick="Invoices.save()">' + UI.icon('check', 17) + ' ' + (editInv ? 'Update invoice' : 'Save invoice') + '</button>' +
      '</div></div></div>';
  },

  nextNo() {
    return (App.s.invoicePrefix || 'INV-') + String(App.s.seq).padStart(4, '0');
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
      '<div class="tiny muted">' + (l.custom ? 'custom line' : 'inventory item') + ' • ' + U.money(U.moneyMul(l.qty, l.rate)) + '</div></div>' +
      '<input inputmode="decimal" value="' + U.fmtQty(l.qty) + '" oninput="Invoices.lineQty(' + i + ',this.value)">' +
      '<input inputmode="decimal" value="' + l.rate + '" oninput="Invoices.lineRate(' + i + ',this.value)">' +
      '<button class="x-btn" style="width:30px;height:30px" onclick="Invoices.removeLine(' + i + ')">' + UI.icon('x', 14) + '</button>' +
      '</div></div>').join('')
      : UI.empty('cart', 'No items yet', 'Tap “Add item” to build the bill');
  },

  async updateTotals() {
    const d = Invoices.draft;
    const subtotal = d.lines.reduce((sum, l) => sum + Finance.minor(Finance.multiply(l.qty, l.rate)), 0) / 100;
    d.discount = U.num(U.q('#iv_disc') ? U.q('#iv_disc').value : d.discount);
    const tax = Finance.major(Finance.minor(U.q('#iv_tax') ? U.q('#iv_tax').value : d.tax));
    const charges = Finance.major(Finance.minor(U.q('#iv_charges') ? U.q('#iv_charges').value : d.charges));
    const total = Finance.invoiceTotal(d.lines, { discount: d.discount, tax, charges });
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
      (tax ? '<div class="kv"><span class="k">Tax</span><span class="v">' + U.money(tax) + '</span></div>' : '') +
      (charges ? '<div class="kv"><span class="k">Delivery / other charge</span><span class="v">' + U.money(charges) + '</span></div>' : '') +
      '<div class="kv total"><span class="k">Total</span><span class="v">' + U.money(total) + '</span></div>';
    const aEl = U.q('#iv_advrow');
    if (aEl) aEl.innerHTML = (advAvail > 0 && App.s.autoAdvance)
      ? '<div class="kv" style="background:var(--greenSoft);border-radius:10px;padding:8px 12px"><span class="k bold">⚡ Advance available ' + U.money(advAvail) + '</span><span class="v green">auto-adjust ' + U.money(advApply) + '</span></div>'
      : (advAvail > 0 ? '<div class="hint">Customer advance ' + U.money(advAvail) + ' — enable auto-adjust in Settings to use it</div>' : '');
  },

  async save() {
    if (Invoices.saving) return;
    Invoices.saving = true;
    try { await Invoices.saveInternal(); }
    catch (error) { console.error(error); UI.toast('Could not save invoice: ' + (error.message || error), 'err'); }
    finally { Invoices.saving = false; }
  },

  async saveInternal() {
    const d = Invoices.draft;
    const existingForCosts = d.editId ? await DB.get('invoices', d.editId) : null;
    const stockItems = await DB.all('items');
    const itemById = Object.fromEntries(stockItems.map(item => [item.id, item]));
    const lines = d.lines.filter(l => U.num(l.qty) > 0).map(line => {
      const oldLine = existingForCosts && existingForCosts.lines.find(old => old.itemId === line.itemId && old.name === line.name);
      const item = line.itemId && itemById[line.itemId];
      const costAtSale = line.custom ? 0 : oldLine && oldLine.costAtSale != null ? oldLine.costAtSale : item ? (item.avgCost != null ? item.avgCost : item.costPrice) : 0;
      return Object.assign({}, line, { costAtSale: U.num(costAtSale) });
    });
    if (!lines.length) return UI.toast('Add at least one item', 'err');
    const subtotal = lines.reduce((sum, l) => sum + Finance.minor(Finance.multiply(l.qty, l.rate)), 0) / 100;
    const discount = U.num(U.q('#iv_disc').value);
    if (discount > subtotal) return UI.toast('Discount is larger than subtotal', 'err');
    const tax = Finance.major(Finance.minor(U.q('#iv_tax') ? U.q('#iv_tax').value : d.tax));
    const charges = Finance.major(Finance.minor(U.q('#iv_charges') ? U.q('#iv_charges').value : d.charges));
    if (tax < 0 || charges < 0) return UI.toast('Tax and charges cannot be negative', 'err');
    const total = Finance.invoiceTotal(lines, { discount, tax, charges });
    const walkin = U.q('#iv_walkin_name') ? U.q('#iv_walkin_name').value.trim() : '';
    if (!d.customerId && !walkin) {
      const ok = await UI.confirm({ title: 'Walk-in customer', message: 'No customer selected and no name given — save as anonymous walk-in bill?', ok: 'Save anyway', danger: false });
      if (!ok) return;
    }
    // stock check
    const short = [];
    lines.forEach(l => { if (!l.custom && itemById[l.itemId] && itemById[l.itemId].qty < U.num(l.qty)) short.push(l.name + ' (have ' + U.fmtQty(itemById[l.itemId].qty) + ')'); });
    if (short.length) {
      if (App.s.negativeStockMode === 'block') return UI.toast('Not enough stock for: ' + short.join(', '), 'err');
      const ok = await UI.confirm({ title: 'Not enough stock', message: 'Low/insufficient stock for: ' + short.join(', ') + '. Save anyway? Stock will go negative.', ok: 'Save anyway' });
      if (!ok) return;
    }
    const paid = Finance.major(Finance.minor(U.q('#iv_paid').value));
    if (paid < 0) return UI.toast('Received amount cannot be negative', 'err');
    const paymentMethod = U.q('#iv_method') ? U.q('#iv_method').value : 'Cash';
    const paymentRef = U.q('#iv_ref') ? U.q('#iv_ref').value.trim() : '';
    const dueDate = U.q('#iv_duedate').value || (U.num(App.s.defaultCreditDays) ? U.addDays(U.day(), U.num(App.s.defaultCreditDays)) : '');
    const notes = U.q('#iv_notes').value.trim();
    const discNote = U.q('#iv_discnote').value.trim();
    const cust = d.customerId ? await DB.get('customers', d.customerId) : null;
    const day = U.day();

    if (!d.editId) return Invoices.createAtomicSale({ d, cust, lines, subtotal, discount, tax, charges, total, paid, paymentMethod, paymentRef, dueDate, notes, discNote, day, walkin, itemById });

    let inv;
    if (d.editId) {
      inv = await DB.get('invoices', d.editId);
      // remove old invoice entries + stock moves; keep payments/returns/advance applications
      const linked = await DB.idx('entries', 'invoiceId', inv.id);
      for (const e of linked) if (e.type === 'invoice') await DB.del('entries', e.id);
      const moves = await DB.idx('moves', 'refId', inv.id);
      for (const m of moves) if (m.refType === 'invoice' && m.type === 'out') await DB.del('moves', m.id);
      Object.assign(inv, { customerId: d.customerId, customerName: cust ? cust.name : (walkin || 'Walk-in'), lines, subtotal, discount, tax, charges, total, discountNote: discNote, dueDate, notes, day });
      inv.updatedAt = U.nowISO();
      await Stock.recalcMany(lines.filter(l => !l.custom).map(l => l.itemId));
    } else {
      const no = Invoices.nextNo();
      App.s.seq++;
      await App.saveSettings();
      inv = {
        id: U.uid(), no, customerId: d.customerId,
        customerName: cust ? cust.name : (walkin || 'Walk-in'),
        lines, subtotal, discount, tax, charges, discountNote: discNote,
        total, paid: 0, advanceApplied: 0, returned: 0,
        dueDate, notes, day, date: U.nowISO(), createdAt: U.nowISO()
      };
    }
    // recompute denormalized credit fields from surviving linked entries
    const linked = await DB.idx('entries', 'invoiceId', inv.id);
    inv.paid = U.sumType(linked, ['payment']);
    inv.advanceApplied = U.sumType(linked, ['advance_apply']);
    inv.returned = U.sumType(linked, ['return']);
    inv.costOfGoods = lines.reduce((sum, line) => sum + Finance.minor(Finance.multiply(line.qty, line.costAtSale)), 0) / 100;
    inv.profit = Finance.add(total, -inv.costOfGoods);
    if (!d.editId) { inv.paid = 0; inv.advanceApplied = 0; inv.returned = 0; }

    // new payment with invoice
    if (paid > 0) {
      await DB.put('entries', {
        customerId: d.customerId, type: 'payment', amount: Math.min(paid, total),
        day, method: paymentMethod, refNo: paymentRef, note: 'Paid with ' + inv.no, invoiceId: inv.id, invoiceNo: inv.no
      });
      inv.paid += Math.min(paid, total);
    }
    const billingAdvance = Finance.add(paid, -Math.min(paid, total));
    if (billingAdvance > 0 && d.customerId) await DB.put('entries', {
      customerId: d.customerId, type: 'advance', amount: billingAdvance, day,
      method: paymentMethod, refNo: paymentRef, note: 'Overpayment on ' + inv.no, invoiceNo: inv.no
    });
    // auto advance deduction
    if (d.customerId && App.s.autoAdvance) {
      const cents = await DB.idx('entries', 'customerId', d.customerId);
      const pool = Khata.advanceOf(cents);
      const apply = Math.min(pool, Finance.invoiceDue(Object.assign({}, inv, { paid: inv.paid })));
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

  async createAtomicSale(data) {
    const { d, cust, lines, subtotal, discount, tax, charges, total, paid, paymentMethod, paymentRef, dueDate, notes, discNote, day, walkin, itemById } = data;
    const no = Invoices.nextNo();
    App.s.seq++;
    await App.saveSettings();
    const id = U.uid(), now = U.nowISO();
    const inv = {
      id, no, customerId: d.customerId, customerName: cust ? cust.name : (walkin || 'Walk-in'),
      lines, subtotal, discount, tax, charges, discountNote: discNote, total, paid: 0, advanceApplied: 0, returned: 0,
      costOfGoods: lines.reduce((sum, line) => sum + Finance.minor(Finance.multiply(line.qty, line.costAtSale)), 0) / 100,
      dueDate, notes, day, date: now, createdAt: now, sourceOrderId: d.orderId || ''
    };
    inv.profit = Finance.add(total, -inv.costOfGoods);
    const appliedNow = Math.min(paid, total), excess = Finance.add(paid, -appliedNow);
    const existing = d.customerId ? await DB.idx('entries', 'customerId', d.customerId) : [];
    const advancePool = Finance.add(Khata.advanceOf(existing), excess);
    const advanceApplied = d.customerId && App.s.autoAdvance ? Math.min(advancePool, Finance.add(total, -appliedNow)) : 0;
    inv.paid = appliedNow;
    inv.advanceApplied = advanceApplied;
    const ops = [{ store: 'invoices', record: inv }];
    if (appliedNow > 0) ops.push({ store: 'entries', record: {
      customerId: d.customerId, customerName: inv.customerName, type: 'payment', amount: appliedNow, day,
      method: paymentMethod, refNo: paymentRef, note: 'Paid with ' + no, invoiceId: id, invoiceNo: no
    } });
    if (excess > 0 && d.customerId) ops.push({ store: 'entries', record: {
      customerId: d.customerId, customerName: inv.customerName, type: 'advance', amount: excess, day,
      method: paymentMethod, refNo: paymentRef, note: 'Overpayment on ' + no
    } });
    if (advanceApplied > 0) ops.push({ store: 'entries', record: {
      customerId: d.customerId, customerName: inv.customerName, type: 'advance_apply', amount: advanceApplied,
      day, note: 'Advance adjusted to ' + no, invoiceId: id, invoiceNo: no
    } });
    ops.push({ store: 'entries', record: {
      customerId: d.customerId, customerName: inv.customerName, type: 'invoice', amount: total, day,
      note: no + (discount > 0 ? ' (discount ' + U.money(discount) + (discNote ? ' — ' + discNote : '') + ')' : ''),
      invoiceId: id, invoiceNo: no
    } });

    const itemIds = Array.from(new Set(lines.filter(line => !line.custom).map(line => line.itemId)));
    for (const itemId of itemIds) {
      const item = itemById[itemId];
      const priorMoves = await DB.idx('moves', 'itemId', itemId);
      const saleMoves = lines.filter(line => line.itemId === itemId && !line.custom).map(line => ({
        id: U.uid(), itemId, type: 'out', qty: U.num(line.qty), unitCost: line.costAtSale,
        refType: 'invoice', refId: id, refNo: no, note: no, day, date: now
      }));
      const state = Stock.calculateState(priorMoves.concat(saleMoves).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.id || '').localeCompare(b.id || '')), item);
      item.qty = state.qty; item.avgCost = state.avgCost;
      ops.push({ store: 'items', record: item });
      saleMoves.forEach(move => ops.push({ store: 'moves', record: move }));
    }
    await DB.batch(ops);
    if (d.orderId && typeof KhataWebAdmin !== 'undefined') {
      await KhataWebAdmin.updateOrderStatus(d.orderId, 'Invoiced in Khata', { invoiceId: id });
    }
    UI.toast(no + ' created', 'ok');
    App.nav('bill?id=' + id);
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
      (inv.costOfGoods != null ? '<div class="kv"><span class="k">Cost of goods</span><span class="v">' + U.money(inv.costOfGoods) + '</span></div><div class="kv"><span class="k">Invoice profit</span><span class="v ' + (inv.profit >= 0 ? 'green' : 'red') + '">' + U.money(inv.profit) + '</span></div>' : '') +
      (due > 0 ? '<div class="kv"><span class="k red bold">Balance due</span><span class="v red">' + U.money(due) + (inv.dueDate ? ' <span class="small muted">by ' + U.fmtDay(inv.dueDate) + '</span>' : '') + '</span></div>' : '') +
      '<div class="grid2 mt10">' +
      '<button class="btn btn-sm" onclick="Invoices.print(\'' + inv.id + '\', \'A4\')">' + UI.icon('printer', 15) + ' Print A4</button>' +
      '<button class="btn btn-sm" onclick="Invoices.print(\'' + inv.id + '\', \'thermal80\')">' + UI.icon('printer', 15) + ' Print 80 mm</button>' +
      '<button class="btn btn-sm" onclick="Invoices.share(\'' + inv.id + '\')">' + UI.icon('share', 15) + ' Share</button>' +
      (due > 0 && inv.customerId ? '<button class="btn btn-green btn-sm" onclick="Invoices.receive(\'' + inv.id + '\')">' + UI.icon('cash', 15) + ' Payment</button>'
        : '<button class="btn btn-sm" onclick="Invoices.returnItems(\'' + inv.id + '\')">' + UI.icon('undo', 15) + ' Return</button>') +
      '</div>' +
      (due > 0 && inv.customerId ? '<button class="btn btn-block mt10" onclick="Invoices.returnItems(\'' + inv.id + '\')">' + UI.icon('undo', 15) + ' Return items</button>' : '') +
      (inv.notes ? '<div class="hint mt10">📝 ' + U.esc(inv.notes) + '</div>' : '') +
      '</div>' +
      '<div class="card"><div class="card-title">' + UI.icon('cart', 16) + ' Items</div>' +
      '<table class="table-mini"><tr><th>Item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr>' +
      inv.lines.map(l => '<tr><td>' + U.esc(l.name) + '</td><td class="num">' + U.fmtQty(l.qty) + '</td><td class="num">' + U.money(l.rate) + '</td><td class="num">' + U.money(U.moneyMul(l.qty, l.rate)) + '</td></tr>').join('') +
      '</table>' +
      (inv.discount ? '<div class="kv mt6"><span class="k">Discount' + (inv.discountNote ? ' (' + U.esc(inv.discountNote) + ')' : '') + '</span><span class="v red">− ' + U.money(inv.discount) + '</span></div>' : '') +
      (inv.tax ? '<div class="kv"><span class="k">Tax</span><span class="v">' + U.money(inv.tax) + '</span></div>' : '') +
      (inv.charges ? '<div class="kv"><span class="k">Delivery / other</span><span class="v">' + U.money(inv.charges) + '</span></div>' : '') +
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
      '<div class="field"><label>Date</label><input id="pay_day" type="date" value="' + U.day() + '"></div>' +
      '<div class="field"><label>Method</label><select id="pay_method"><option>Cash</option><option>JazzCash</option><option>Easypaisa</option><option>Bank</option><option>Cheque</option><option>Other</option></select></div>' +
      '<div class="field"><label>Reference number</label><input id="pay_ref" placeholder="optional"></div>' +
      '<div class="field"><label>Note</label><input id="pay_note" placeholder="optional note"></div>' +
      '<button class="btn btn-green btn-block" onclick="Invoices.savePayment(\'' + id + '\')">' + UI.icon('check', 17) + ' Record payment</button>'
    });
  },

  async savePayment(id) {
    const inv = await DB.get('invoices', id);
    const amount = Finance.major(Finance.minor(U.q('#pay_amt').value));
    if (amount <= 0) return UI.toast('Enter an amount greater than zero', 'err');
    const due = Invoices.dueOf(inv), applied = Math.min(amount, due), extra = Finance.add(amount, -applied);
    const group = U.uid(), day = U.q('#pay_day') ? U.q('#pay_day').value : U.day();
    const note = U.q('#pay_note').value.trim(), method = U.q('#pay_method') ? U.q('#pay_method').value : 'Cash';
    const refNo = U.q('#pay_ref') ? U.q('#pay_ref').value.trim() : '';
    const ops = [];
    if (applied > 0) {
      inv.paid = Finance.add(inv.paid, applied);
      ops.push({ store: 'invoices', record: inv });
      ops.push({ store: 'entries', record: {
        customerId: inv.customerId, customerName: inv.customerName, type: 'payment', amount: applied,
        day, date: new Date(day + 'T12:00:00').toISOString(), method, refNo, note: note || 'Payment for ' + inv.no,
        invoiceId: inv.id, invoiceNo: inv.no, receiptGroup: group
      } });
    }
    if (extra > 0) ops.push({ store: 'entries', record: {
      customerId: inv.customerId, customerName: inv.customerName, type: 'advance', amount: extra,
      day, date: new Date(day + 'T12:00:00').toISOString(), method, refNo, note: 'Advance from overpayment ' + inv.no,
      invoiceId: null, invoiceNo: inv.no, receiptGroup: group
    } });
    await DB.batch(ops);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast(extra > 0 ? 'Payment recorded; ' + U.money(extra) + ' kept as advance' : 'Payment recorded', 'ok');
    App.rerender();
  },

  async receiveCustomer(customerId) {
    const customer = await DB.get('customers', customerId);
    if (!customer) return UI.toast('Customer not found', 'err');
    const invoices = (await DB.idx('invoices', 'customerId', customerId)).filter(inv => Invoices.dueOf(inv) > 0)
      .sort((a, b) => (a.day || '').localeCompare(b.day || '') || (a.no || '').localeCompare(b.no || ''));
    const due = invoices.reduce((sum, inv) => Finance.add(sum, Invoices.dueOf(inv)), 0);
    UI.sheet({
      title: 'Receive payment — ' + customer.name,
      body: '<div class="kv" style="background:var(--field);border-radius:10px;padding:10px 12px;margin-bottom:12px"><span class="k">Total due</span><span class="v red">' + U.money(due) + '</span></div>' +
        '<div class="field"><label>Amount received *</label><input id="pay_amt" inputmode="decimal" value="' + due + '"></div>' +
        '<div class="field"><label>Method</label><select id="pay_method"><option>Cash</option><option>JazzCash</option><option>Easypaisa</option><option>Bank</option><option>Cheque</option><option>Other</option></select></div>' +
        '<div class="field"><label>Reference number</label><input id="pay_ref" placeholder="optional"></div>' +
        '<div class="field"><label>Date</label><input id="pay_day" type="date" value="' + U.day() + '"></div>' +
        '<div class="field"><label>Promise to pay by</label><input id="pay_promise" type="date"></div>' +
        '<div class="field"><label>Note</label><input id="pay_note" placeholder="optional note"></div>' +
        '<div class="hint">Payment is applied to oldest invoices first. Any extra stays as customer advance.</div>' +
        '<button class="btn btn-green btn-block" onclick="Invoices.saveCustomerPayment(\'' + customerId + '\')">' + UI.icon('check', 17) + ' Record payment</button>'
    });
  },

  async saveCustomerPayment(customerId) {
    const customer = await DB.get('customers', customerId);
    const amount = Finance.major(Finance.minor(U.q('#pay_amt').value));
    if (amount <= 0) return UI.toast('Enter an amount greater than zero', 'err');
    const invoices = (await DB.idx('invoices', 'customerId', customerId)).filter(inv => Invoices.dueOf(inv) > 0)
      .sort((a, b) => (a.day || '').localeCompare(b.day || '') || (a.no || '').localeCompare(b.no || ''));
    const allocation = Finance.allocateFIFO(amount, invoices.map(inv => Object.assign({}, inv, { balance: Invoices.dueOf(inv) })));
    const group = U.uid(), day = U.q('#pay_day').value || U.day(), method = U.q('#pay_method').value;
    const refNo = U.q('#pay_ref').value.trim(), note = U.q('#pay_note').value.trim();
    const byId = Object.fromEntries(invoices.map(inv => [inv.id, inv]));
    const ops = [];
    allocation.allocations.forEach((part, index) => {
      const inv = byId[part.invoiceId];
      inv.paid = Finance.add(inv.paid, part.amount);
      ops.push({ store: 'invoices', record: inv });
      ops.push({ store: 'entries', record: {
        customerId, customerName: customer.name, type: 'payment', amount: part.amount,
        day, date: new Date(day + 'T12:00:00').toISOString(), method, refNo,
        note: note || 'Payment allocated to ' + inv.no, invoiceId: inv.id, invoiceNo: inv.no,
        receiptGroup: group, allocationIndex: index + 1
      } });
    });
    if (allocation.advance > 0) ops.push({ store: 'entries', record: {
      customerId, customerName: customer.name, type: 'advance', amount: allocation.advance,
      day, date: new Date(day + 'T12:00:00').toISOString(), method, refNo,
      note: note || 'Unallocated advance', receiptGroup: group
    } });
    const promise = U.q('#pay_promise').value;
    if (promise && allocation.allocations.length) {
      const oldest = byId[allocation.allocations[0].invoiceId];
      oldest.promiseDate = promise;
    }
    if (!ops.length) return UI.toast('No outstanding balance to allocate', 'err');
    await DB.batch(ops);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast(allocation.advance > 0 ? 'Payment saved; advance ' + U.money(allocation.advance) : 'Payment allocated to oldest bills', 'ok');
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
    const existingReturns = (await DB.idx('entries', 'invoiceId', id)).filter(entry => entry.type === 'return');
    const returnedQty = {};
    existingReturns.forEach(entry => (entry.items || []).forEach(line => {
      const key = line.itemId || line.name;
      returnedQty[key] = (returnedQty[key] || 0) + U.num(line.qty);
    }));
    let total = 0;
    inv.lines.forEach((l, idx) => {
      const qty = U.num(U.q('#rt_' + idx) ? U.q('#rt_' + idx).value : 0);
      if (qty > 0) {
        const key = l.itemId || l.name;
        if (qty > U.num(l.qty) - (returnedQty[key] || 0)) return;
        items.push({ itemId: l.itemId, name: l.name, qty, rate: l.rate, costAtSale: l.costAtSale || 0 });
        total = Finance.add(total, Finance.multiply(qty, l.rate));
      }
    });
    if (!items.length) return UI.toast('Enter return quantity for at least one item', 'err');
    const invalid = inv.lines.some((line, idx) => {
      const qty = U.num(U.q('#rt_' + idx) ? U.q('#rt_' + idx).value : 0);
      return qty > U.num(line.qty) - (returnedQty[line.itemId || line.name] || 0);
    });
    if (invalid) return UI.toast('Return quantity is greater than the quantity still eligible for return', 'err');
    const note = U.q('#rt_note').value.trim();
    const entry = { id: U.uid(),
      customerId: inv.customerId, type: 'return', amount: total, items,
      day: U.day(), invoiceId: inv.id, invoiceNo: inv.no,
      note: note || ('Return against ' + inv.no)
    };
    const now = U.nowISO(), ops = [{ store: 'entries', record: entry }];
    const itemById = Object.fromEntries((await DB.all('items')).map(item => [item.id, item]));
    for (const itemId of Array.from(new Set(items.filter(line => line.itemId).map(line => line.itemId)))) {
      const priorMoves = await DB.idx('moves', 'itemId', itemId);
      const returnMoves = items.filter(line => line.itemId === itemId).map(line => ({
        id: U.uid(), itemId, type: 'return', qty: line.qty, unitCost: line.costAtSale,
        refType: 'return', refId: inv.id, refNo: inv.no, sourceEntryId: entry.id,
        note: note || 'Return', day: U.day(), date: now
      }));
      const item = itemById[itemId], state = Stock.calculateState(priorMoves.concat(returnMoves), item);
      item.qty = state.qty; item.avgCost = state.avgCost;
      ops.push({ store: 'items', record: item });
      returnMoves.forEach(move => ops.push({ store: 'moves', record: move }));
    }
    inv.returned = Finance.add(inv.returned, total);
    ops.push({ store: 'invoices', record: inv });
    await DB.batch(ops);
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
    const moves = await DB.idx('moves', 'refId', id);
    const itemIds = Array.from(new Set(moves.map(move => move.itemId)));
    const ops = linked.map(entry => ({ store: 'entries', action: 'delete', id: entry.id }))
      .concat(moves.map(move => ({ store: 'moves', action: 'delete', id: move.id })), [{ store: 'invoices', action: 'delete', id }]);
    linked.filter(entry => entry.type === 'payment' && entry.customerId).forEach(entry => ops.push({
      store: 'entries', record: {
        customerId: entry.customerId, customerName: entry.customerName, type: 'advance', amount: entry.amount,
        day: entry.day, date: entry.date, method: entry.method, refNo: entry.refNo,
        note: 'Advance retained after cancelling ' + inv.no, receiptGroup: entry.receiptGroup
      }
    }));
    const items = await DB.all('items');
    for (const itemId of itemIds) {
      const item = items.find(row => row.id === itemId); if (!item) continue;
      const itemMoves = await DB.idx('moves', 'itemId', itemId);
      const state = Stock.calculateState(itemMoves.filter(move => !moves.some(deleted => deleted.id === move.id)), item);
      item.qty = state.qty; item.avgCost = state.avgCost;
      ops.push({ store: 'items', record: item });
    }
    await DB.batch(ops);
    UI.toast('Invoice deleted', 'ok');
    App.nav('bills');
  },

  /* ============ print & share ============ */
  async print(id, requestedSize = 'A4') {
    const inv = await DB.get('invoices', id);
    if (!inv) return UI.toast('Invoice not found', 'err');
    if (!KhataWebAdmin.webData && KhataWebAdmin.fetchWebData) await KhataWebAdmin.fetchWebData();
    const customer = inv.customerId ? await DB.get('customers', inv.customerId) : null;
    const status = Invoices.statusOf(inv);
    const due = Invoices.dueOf(inv);
    const settings = App.s;
    const company = (KhataWebAdmin.webData || window.SOLIS_DATA || window.DEFAULT_SOLIS_DATA || {}).company || {};
    const shopName = company.name || window.DEFAULT_SOLIS_DATA?.company?.name || settings.shopName || 'Solis Pakistan';
    const shopPhone = company.mobile || company.whatsapp || settings.shopPhone || '';
    const shopAddress = company.address || settings.shopAddress || '';
    const logoUrl = company.logoUrl || '';
    const paperSize = ['A4', 'thermal80'].includes(requestedSize) ? requestedSize : 'A4';
    const logo = logoUrl
      ? '<img class="p-logo" src="' + U.esc(logoUrl) + '" alt="' + U.esc(shopName) + ' logo">'
      : '<span class="p-logo-fallback" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="12"/><path d="M24 2v8m0 28v8M2 24h8m28 0h8M8.5 8.5l5.7 5.7m19.6 19.6 5.7 5.7M8.5 39.5l5.7-5.7m19.6-19.6 5.7-5.7"/></svg></span>';
    const lines = (inv.lines || []).map((line, index) =>
      '<tr><td class="p-index">' + (index + 1) + '</td><td class="p-item-name">' + U.esc(line.name) + '</td><td class="num">' + U.fmtQty(line.qty) + '</td><td class="num">' + U.money(line.rate) + '</td><td class="num">' + U.money(U.moneyMul(line.qty, line.rate)) + '</td></tr>'
    ).join('');
    U.q('#printArea').innerHTML =
      '<table class="print-doc ' + paperSize + ' print-' + paperSize + '"><thead>' +
      '<tr><th colspan="5" class="p-print-header-cell"><header class="p-print-header"><div class="p-brand">' + logo + '<div class="p-company"><h1>' + U.esc(shopName) + '</h1>' +
      '<div class="p-mut">' + (shopPhone ? '<div>' + U.esc(shopPhone) + '</div>' : '') + (shopAddress ? '<div>' + U.esc(shopAddress) + '</div>' : '') + '</div></div></div>' +
      '<div class="p-inv"><div class="p-kicker">INVOICE</div><div class="no">' + U.esc(inv.no) + '</div><div>' + U.fmtDay(inv.day) + '</div>' +
      '<div class="p-status ' + status + '">' + status.toUpperCase() + '</div></div></header></th></tr>' +
      '<tr><th class="p-index">#</th><th>Item / Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>' +
      '<tfoot><tr><td colspan="5" class="p-footer-cell"><footer class="p-print-footer"><div class="p-thanks">' + U.esc(settings.invoiceFooter || 'Thank you for your business.') + '</div>' +
      '<div class="p-powered"><span>Powered by Ineha Tech</span><img src="images/ineha-tech.png" alt="Ineha Tech logo"></div></footer></td></tr></tfoot><tbody>' +
      '<tr><td colspan="5"><section class="p-billto"><div class="p-section-label">BILLED TO</div><strong>' + U.esc(inv.customerName || 'Walk-in') + '</strong>' +
      (customer?.phone ? '<div>' + U.esc(customer.phone) + '</div>' : '') + (customer?.address ? '<div>' + U.esc(customer.address) + '</div>' : '') +
      (inv.dueDate ? '<div class="p-due-date">Payment due: <b>' + U.fmtDay(inv.dueDate) + '</b></div>' : '') + '</section></td></tr>' + lines +
      '<tr><td colspan="5"><div class="p-totals"><div class="kv"><span class="k">Subtotal</span><span>' + U.money(inv.subtotal) + '</span></div>' +
      (inv.discount ? '<div class="kv"><span class="k">Discount</span><span>− ' + U.money(inv.discount) + '</span></div>' : '') +
      (inv.tax ? '<div class="kv"><span class="k">Tax</span><span>' + U.money(inv.tax) + '</span></div>' : '') +
      (inv.charges ? '<div class="kv"><span class="k">Delivery / other</span><span>' + U.money(inv.charges) + '</span></div>' : '') +
      '<div class="kv total"><span>Total</span><span>' + U.money(inv.total) + '</span></div>' +
      (inv.paid ? '<div class="kv"><span class="k">Received</span><span>' + U.money(inv.paid) + '</span></div>' : '') +
      (inv.advanceApplied ? '<div class="kv"><span class="k">Advance adjusted</span><span>' + U.money(inv.advanceApplied) + '</span></div>' : '') +
      (inv.returned ? '<div class="kv"><span class="k">Returned</span><span>− ' + U.money(inv.returned) + '</span></div>' : '') +
      (due > 0 ? '<div class="kv p-balance"><span>Balance due</span><span>' + U.money(due) + '</span></div>' : '') + '</div>' +
      (inv.notes ? '<section class="p-notes"><b>Notes</b><div>' + U.esc(inv.notes) + '</div></section>' : '') + '</td></tr></tbody></table>';
    const images = Array.from(U.q('#printArea').querySelectorAll('img'));
    Promise.race([
      Promise.all(images.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; }))),
      new Promise(resolve => setTimeout(resolve, 2500))
    ]).then(() => {
      if (paperSize !== 'A4') {
        const area = U.q('#printArea');
        const doc = area.querySelector('.print-doc');
        const oldStyle = area.getAttribute('style');
        area.style.cssText = 'display:block;position:fixed;left:-10000px;top:0;width:80mm';
        const contentHeight = doc.getBoundingClientRect().height;
        if (oldStyle == null) area.removeAttribute('style');
        else area.setAttribute('style', oldStyle);
        const width = 80;
        const margin = 3;
        const height = Math.max(70, Math.ceil(contentHeight * 25.4 / 96 + margin * 2 + 6));
        let pageStyle = document.getElementById('thermalInvoicePageSize');
        if (!pageStyle) { pageStyle = document.createElement('style'); pageStyle.id = 'thermalInvoicePageSize'; document.head.appendChild(pageStyle); }
        pageStyle.textContent = '@page receipt' + width + ' { size: ' + width + 'mm ' + height + 'mm; margin: ' + margin + 'mm; }';
      }
      window.print();
    });
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
