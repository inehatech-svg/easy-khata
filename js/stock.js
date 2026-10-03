/* Inventory: solar panels, inverters, batteries… with per-item low stock alarms */
const Stock = {
  search: '',
  cat: 'all',
  saving: false,

  async page() {
    const items = await DB.all('items');
    const active = items.filter(i => !i.archived);
    const cats = Array.from(new Set(active.map(i => (i.category || 'Uncategorized').trim()).filter(Boolean))).sort();
    const value = U.sum(active, i => U.moneyMul(i.qty, i.avgCost != null ? i.avgCost : i.costPrice));
    const saleValue = U.sum(active, i => U.moneyMul(i.qty, i.salePrice));
    const low = Stock.lowList(active);
    return '<div class="page">' +
      UI.pageHead('Inventory', active.length + ' items • Stock value ' + U.money(value),
        '<button class="ph-btn" onclick="Stock.itemForm()">' + UI.icon('plus', 19) + '</button>') +
      '<div class="page-body">' +
      '<div class="stats">' +
      '<div class="stat"><div class="row-between"><span class="s-label">' + UI.icon('box', 15) + ' Items</span></div><div class="s-val">' + active.length + '</div></div>' +
      '<div class="stat"><div class="row-between"><span class="s-label">' + UI.icon('alert', 15) + ' Low stock</span></div><div class="s-val ' + (low.length ? 'red' : '') + '">' + low.length + '</div></div>' +
      '<div class="stat"><div class="s-label">Stock at cost</div><div class="s-val">' + U.money(value) + '</div></div>' +
      '<div class="stat"><div class="s-label">Stock at sale price</div><div class="s-val">' + U.money(saleValue) + '</div><div class="tiny muted">Potential margin ' + U.money(Finance.add(saleValue, -value)) + '</div></div>' +
      '</div>' +
      (low.length ? '<div class="alert-card"><div class="row-between"><span class="bold small red">' + UI.icon('bell', 15) + ' Smart stock alarms</span></div>' +
        low.slice(0, 4).map(i =>
          '<div class="lrow" style="padding:9px 0;border-bottom:1px solid var(--line);background:none" onclick="App.nav(\'item?id=' + i.id + '\')">' +
          '<div class="l-main"><div class="l-title">' + U.esc(i.name) + '</div><div class="l-sub">Alarm at ' + U.fmtQty(i.lowStockAt) + ' ' + U.esc(i.unit || 'pcs') + '</div></div>' +
          '<span class="chip red">' + U.fmtQty(i.qty) + ' left</span></div>').join('') +
        (low.length > 4 ? '<div class="tiny muted mt6">' + (low.length - 4) + ' more low items…</div>' : '') +
        '</div>' : '') +
      '<div class="searchbar mt10">' + UI.icon('search', 18) +
      '<input id="stk_q" placeholder="Search items, SKU, category…" value="' + U.esc(Stock.search) + '" oninput="Stock.search=this.value;Stock.refresh()"></div>' +
      '<div class="chiprow">' +
      '<button class="filter-chip ' + (Stock.cat === 'all' ? 'on' : '') + '" onclick="Stock.cat=\'all\';Stock.refresh()">All</button>' +
      cats.map(c => '<button class="filter-chip ' + (Stock.cat === c ? 'on' : '') + '" onclick="Stock.cat=\'' + U.esc(c).replace(/'/g, "\\'") + '\';Stock.refresh()">' + U.esc(c) + '</button>').join('') +
      '</div>' +
      '<div id="stk_list"></div>' +
      '<div class="section-label">Archived</div><div id="stk_arch"></div>' +
      '</div></div>';
  },

  async bind() {
    Stock.renderLists();
  },

  async refresh() {
    const q = U.q('#stk_q'); const v = q ? q.value : '';
    const pos = q ? q.selectionStart : 0;
    await App.rerender();
    const nq = U.q('#stk_q');
    if (nq) { nq.value = v; nq.focus(); nq.setSelectionRange(pos, pos); }
  },

  lowList(items) {
    return (items || null) && items.filter ? items.filter(i => !i.archived && U.num(i.qty) <= U.num(i.lowStockAt)) : [];
  },

  async lowItems() { return Stock.lowList(await DB.all('items')); },

  async pickStockItem() {
    const items = (await DB.all('items')).filter(item => !item.archived).sort((a, b) => a.name.localeCompare(b.name));
    UI.sheet({ title: 'Choose item to stock in', body: items.length
      ? '<div class="list">' + items.map(item => '<div class="lrow" onclick="U.q(\'.sheet-overlay\').remove();Stock.addStock(\'' + item.id + '\')"><div class="l-main"><div class="l-title">' + U.esc(item.name) + '</div><div class="l-sub">' + U.fmtQty(item.qty) + ' ' + U.esc(item.unit || 'pcs') + ' on hand</div></div>' + UI.icon('chevR', 16) + '</div>').join('') + '</div><button class="btn btn-pri btn-block mt10" onclick="U.q(\'.sheet-overlay\').remove();Stock.itemForm()">' + UI.icon('plus', 16) + ' Add a new inventory item</button>'
      : UI.empty('box', 'No items yet', 'Create an item first, then receive its stock') + '<button class="btn btn-pri btn-block mt10" onclick="U.q(\'.sheet-overlay\').remove();Stock.itemForm()">' + UI.icon('plus', 16) + ' Create inventory item</button>' });
  },

  itemRow(i) {
    const isLow = U.num(i.qty) <= U.num(i.lowStockAt);
    return '<div class="lrow" onclick="App.nav(\'item?id=' + i.id + '\')">' +
      '<div class="avatar sm ' + U.avatarHue(i.category || i.name) + '">' + U.esc(U.initials(i.name)) + '</div>' +
      '<div class="l-main"><div class="l-title">' + U.esc(i.name) + '</div>' +
      '<div class="l-sub">' + U.esc(i.category || 'Uncategorized') + (i.sku ? ' • ' + U.esc(i.sku) : '') + ' • ' + U.money(i.salePrice) + '/' + U.esc(i.unit || 'pc') + '</div></div>' +
      '<div class="l-right"><div class="l-amt ' + (isLow ? 'red' : '') + '">' + U.fmtQty(i.qty) + '</div>' +
      '<div class="l-tag">' + (isLow ? '⚠ low' : U.esc(i.unit || 'pcs')) + '</div></div></div>';
  },

  async renderLists() {
    const items = await DB.all('items');
    let list = items.filter(i => !i.archived);
    if (Stock.cat !== 'all') list = list.filter(i => (i.category || 'Uncategorized') === Stock.cat);
    if (Stock.search) {
      const s = Stock.search.toLowerCase();
      list = list.filter(i => (i.name + ' ' + (i.sku || '') + ' ' + (i.category || '')).toLowerCase().includes(s));
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    const arch = items.filter(i => i.archived);
    const lEl = U.q('#stk_list');
    if (lEl) lEl.innerHTML = list.length
      ? '<div class="list">' + list.map(Stock.itemRow).join('') + '</div>'
      : UI.empty('box', 'No items found', 'Add your panels, inverters, batteries…');
    const aEl = U.q('#stk_arch');
    if (aEl) aEl.innerHTML = arch.length
      ? '<div class="list">' + arch.map(Stock.itemRow).join('') + '</div>'
      : '<div class="tiny muted" style="padding:2px 4px">Nothing archived</div>';
  },

  /* ---------- item form ---------- */
  itemForm(id) {
    (id ? DB.get('items', id) : Promise.resolve(null)).then(item => {
      const it = item || { lowStockAt: App.s.lowStockDefault, unit: 'pcs' };
      UI.sheet({
        title: item ? 'Edit item' : 'New inventory item',
        body:
        '<div class="field"><label>Item name *</label><input id="it_name" value="' + U.esc(it.name || '') + '" placeholder="e.g. Longi 550W Solar Panel"></div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Category</label><input id="it_cat" list="catList" value="' + U.esc(it.category || '') + '" placeholder="Panels"><datalist id="catList"><option>Panels</option><option>Inverters</option><option>Batteries</option><option>Structure</option><option>Cables</option><option>Accessories</option></datalist></div>' +
        '<div class="field"><label>SKU / code</label><input id="it_sku" value="' + U.esc(it.sku || '') + '" placeholder="optional"></div>' +
        '</div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Cost price</label><input id="it_cost" inputmode="decimal" value="' + (it.costPrice != null ? it.costPrice : '') + '"></div>' +
        '<div class="field"><label>Sale price</label><input id="it_sale" inputmode="decimal" value="' + (it.salePrice != null ? it.salePrice : '') + '"></div>' +
        '</div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Unit</label><input id="it_unit" value="' + U.esc(it.unit || 'pcs') + '" placeholder="pcs"></div>' +
        '<div class="field"><label>Low stock alarm at *</label><input id="it_low" inputmode="decimal" value="' + (it.lowStockAt != null ? it.lowStockAt : App.s.lowStockDefault) + '"><div class="hint">Alert when qty ≤ this</div></div>' +
        '</div>' +
        (item ? '' : '<div class="field"><label>Opening stock qty</label><input id="it_qty" inputmode="decimal" placeholder="0"></div>') +
        '<button class="btn btn-pri btn-block" onclick="Stock.saveItem(\'' + (id || '') + '\')">' + UI.icon('save', 17) + ' Save item</button>'
      });
    });
  },

  async saveItem(id) {
    if (Stock.saving) return;
    Stock.saving = true;
    try { await Stock.saveItemInternal(id); }
    catch (error) { console.error('Inventory item save failed', error); UI.toast('Could not save inventory item: ' + (error.message || error), 'err'); }
    finally { Stock.saving = false; }
  },

  async saveItemInternal(id) {
    const name = U.q('#it_name').value.trim();
    const sale = U.num(U.q('#it_sale').value);
    const cost = U.num(U.q('#it_cost').value);
    if (!name) return UI.toast('Enter an item name', 'err');
    if (sale < 0 || cost < 0) return UI.toast('Prices cannot be negative', 'err');
    const patch = {
      name, category: U.q('#it_cat').value.trim() || 'Uncategorized',
      sku: U.q('#it_sku').value.trim(), costPrice: cost,
      salePrice: sale, unit: U.q('#it_unit').value.trim() || 'pcs',
      lowStockAt: U.num(U.q('#it_low').value), archived: false
    };
    if (id) {
      const it = await DB.get('items', id);
      Object.assign(it, patch);
      await DB.put('items', it);
      UI.toast('Item updated', 'ok');
    } else {
      const qty = U.num(U.q('#it_qty').value);
      if (qty < 0) return UI.toast('Opening stock cannot be negative', 'err');
      const it = Object.assign({ id: U.uid(), qty: 0 }, patch);
      const ops = [{ store: 'items', record: it }];
      if (qty > 0) {
        const move = { id: U.uid(), itemId: it.id, type: 'in', qty, unitCost: cost, note: 'Opening stock', day: U.day(), date: U.nowISO() };
        const state = Stock.calculateState([move], it);
        it.qty = state.qty; it.avgCost = state.avgCost;
        ops.push({ store: 'moves', record: move });
      }
      await DB.batch(ops);
      UI.toast('Item added', 'ok');
    }
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    App.rerender();
  },

  /* ---------- item detail ---------- */
  async itemPage(id) {
    const it = await DB.get('items', id);
    if (!it) return '<div class="page">' + UI.backHead('Item') + '<div class="page-body">' + UI.empty('box', 'Item not found') + '</div></div>';
    const moves = (await DB.idx('moves', 'itemId', id)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const isLow = U.num(it.qty) <= U.num(it.lowStockAt);
    return '<div class="page">' +
      UI.backHead(U.esc(it.name), U.esc(it.category || '') + (it.sku ? ' • ' + U.esc(it.sku) : ''),
        '<button class="ph-btn" onclick="Stock.itemForm(\'' + it.id + '\')">' + UI.icon('edit', 18) + '</button>') +
      '<div class="page-body">' +
      '<div class="card"><div class="stats" style="margin:0">' +
      '<div class="stat" style="box-shadow:none;border:none;padding:0"><div class="s-label">' + UI.icon('box', 15) + ' In stock</div><div class="s-val ' + (isLow ? 'red' : '') + '">' + U.fmtQty(it.qty) + ' <span class="small muted">' + U.esc(it.unit || '') + '</span></div>' + (isLow ? '<span class="chip red mt6">' + UI.icon('bell', 13) + ' Low — alarm at ' + U.fmtQty(it.lowStockAt) + '</span>' : '<span class="chip green mt6">Healthy stock</span>') + '</div>' +
      '<div class="stat" style="box-shadow:none;border:none;padding:0"><div class="s-label">' + UI.icon('tag', 15) + ' Prices</div><div class="s-val">' + U.money(it.salePrice) + '</div><div class="tiny muted">Avg cost ' + U.money(it.avgCost != null ? it.avgCost : it.costPrice) + ' • Value ' + U.money(U.moneyMul(it.qty, it.avgCost != null ? it.avgCost : it.costPrice)) + '</div></div>' +
      '</div>' +
      '<div class="grid3 mt10">' +
      '<button class="btn btn-green btn-sm" onclick="Stock.addStock(\'' + it.id + '\')">' + UI.icon('plus', 15) + ' Add stock</button>' +
      '<button class="btn btn-sm" onclick="Stock.adjust(\'' + it.id + '\')">' + UI.icon('sliders', 15) + ' Adjust</button>' +
      '<button class="btn btn-sm ' + (it.archived ? '' : '') + '" onclick="Stock.archive(\'' + it.id + '\',' + (it.archived ? 'false' : 'true') + ')">' + UI.icon('archive', 15) + (it.archived ? ' Unarchive' : ' Archive') + '</button>' +
      '</div></div>' +
      '<div class="section-label">Stock movement history</div>' +
      (moves.length ? '<div class="list">' + moves.map(m => Stock.moveRow(m)).join('') + '</div>'
        : UI.empty('clock', 'No movements yet', 'Add stock or make a sale first')) +
      '</div></div>';
  },

  moveRow(m) {
    const map = {
      in: ['arrowDown', 'green', 'Stock in'], out: ['arrowUp', 'red', 'Sale out'],
      return: ['undo', 'green', 'Return in'], adjust: ['sliders', 'amber', 'Adjustment'],
      open: ['box', 'pri', 'Opening']
    };
    const [ic, cls, label] = map[m.type] || ['box', 'pri', m.type];
    const qtyTxt = m.type === 'adjust' && m.delta != null
      ? (m.delta >= 0 ? '+' : '') + U.fmtQty(m.delta)
      : (m.type === 'out' ? '-' : '+') + U.fmtQty(m.qty);
    return '<div class="entry">' +
      '<div class="e-ic i-' + cls + '">' + UI.icon(ic, 17) + '</div>' +
      '<div class="e-main"><div class="e-title">' + label + (m.note ? ' — ' + U.esc(m.note) : '') + '</div>' +
      '<div class="e-sub">' + U.fmtDateTime(m.date) + (m.refType === 'invoice' ? ' • ' + U.esc(m.refNo || 'invoice') : '') + '</div></div>' +
      '<div class="e-right"><div class="e-amt ' + (cls === 'red' ? 'dr' : 'cr') + '">' + qtyTxt + '</div>' +
      (m.unitCost ? '<div class="e-bal">@ ' + U.money(m.unitCost) + '</div>' : '') + '</div></div>';
  },

  /* ---------- stock movements ---------- */
  async addMove(itemId, type, qty, opts) {
    const o = opts || {};
    await DB.put('moves', {
      itemId, type, qty: Math.abs(U.num(qty)),
      unitCost: o.unitCost || 0, note: o.note || '',
      refType: o.refType || '', refId: o.refId || '', refNo: o.refNo || '', sourceEntryId: o.sourceEntryId || '',
      day: o.day || U.day(), date: U.nowISO()
    });
  },

  // qty is recomputed from the full movement log — keeps stock drift-proof
  async recalc(itemId) {
    const moves = (await DB.idx('moves', 'itemId', itemId)).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.id || '').localeCompare(b.id || ''));
    const it = await DB.get('items', itemId);
    const result = Stock.calculateState(moves, it || {});
    if (it) { it.qty = result.qty; it.avgCost = result.avgCost || U.num(it.costPrice); await DB.put('items', it); }
    return result.qty;
  },

  calculateState(moves, item) {
    let qty = 0, avgCost = 0;
    moves.forEach(m => {
      if (m.type === 'out') qty -= U.num(m.qty);
      else if (m.type === 'adjust') {
        const delta = U.num(m.delta != null ? m.delta : m.qty);
        if (delta > 0) avgCost = Finance.weightedAverage(qty, avgCost || item.costPrice || 0, delta, m.unitCost || avgCost || item.costPrice || 0);
        qty += delta;
      } else {
        const addQty = U.num(m.qty);
        if (addQty > 0) avgCost = Finance.weightedAverage(qty, avgCost || item.costPrice || 0, addQty, m.unitCost || avgCost || item.costPrice || 0);
        qty += addQty;
      }
    });
    return { qty, avgCost: avgCost || U.num(item.costPrice) };
  },

  async recalcMany(ids) {
    for (const id of Array.from(new Set(ids))) await Stock.recalc(id);
  },

  async addStock(id) {
    const suppliers = (await DB.all('customers')).filter(party => party.isSupplier);
    UI.sheet({
      title: 'Add stock (purchase)',
      body:
      '<div class="field"><label>Quantity *</label><input id="ms_qty" inputmode="decimal" placeholder="e.g. 10"></div>' +
      '<div class="field"><label>Unit cost (purchase price)</label><input id="ms_cost" inputmode="decimal" placeholder="per unit"></div>' +
      '<div class="field"><label>Supplier</label><select id="ms_supplier"><option value="">No supplier</option>' + suppliers.map(s => '<option value="' + s.id + '">' + U.esc(s.name) + '</option>').join('') + '</select></div>' +
      '<div class="field-row"><div class="field"><label>Bill no.</label><input id="ms_bill" placeholder="optional"></div><div class="field"><label>Paid now</label><input id="ms_paid" inputmode="decimal" value="0"></div></div>' +
      '<div class="field"><label>Date</label><input id="ms_day" type="date" value="' + U.day() + '"></div>' +
      '<div class="field"><label>Note</label><input id="ms_note" placeholder="optional"></div>' +
      '<button class="btn btn-green btn-block" onclick="Stock.saveMove(\'' + id + '\',\'in\')">' + UI.icon('plus', 17) + ' Add to inventory</button>'
    });
  },

  adjust(id) {
    UI.sheet({
      title: 'Adjust stock',
      body: '<div class="hint" style="margin-bottom:10px">Use for damage, loss, recount or corrections.</div>' +
      '<div class="field"><label>Change (+/-)</label><input id="ms_qty" inputmode="decimal" placeholder="e.g. -2 or 3"></div>' +
      '<div class="field"><label>Reason</label><input id="ms_note" placeholder="e.g. 1 panel broken"></div>' +
      '<button class="btn btn-pri btn-block" onclick="Stock.saveMove(\'' + id + '\',\'adjust\')">' + UI.icon('save', 17) + ' Save adjustment</button>'
    });
  },

  async saveMove(id, type) {
    if (Stock.saving) return;
    Stock.saving = true;
    try { await Stock.saveMoveInternal(id, type); }
    catch (error) {
      console.error('Stock movement failed', error);
      UI.toast('Could not save stock: ' + (error.message || error), 'err');
    } finally { Stock.saving = false; }
  },

  async saveMoveInternal(id, type) {
    const qtyField = U.q('#ms_qty');
    if (!qtyField) return UI.toast('Stock form expired. Reopen it and try again.', 'err');
    const raw = qtyField.value;
    const qty = U.num(raw);
    if (!qty && type === 'in') return UI.toast('Enter a quantity', 'err');
    if (!qty) return UI.toast('Enter a non-zero change', 'err');
    const it = await DB.get('items', id);
    if (!it) return UI.toast('This inventory item no longer exists.', 'err');
    if (type === 'in') {
      const cost = U.num(U.q('#ms_cost') && U.q('#ms_cost').value);
      if (cost < 0) return UI.toast('Unit cost cannot be negative', 'err');
      const amount = Finance.multiply(qty, cost), paid = Finance.major(Finance.minor(U.q('#ms_paid') && U.q('#ms_paid').value));
      if (paid < 0 || paid > amount) return UI.toast('Paid now must be between zero and the purchase total', 'err');
      const supplierId = U.q('#ms_supplier') ? U.q('#ms_supplier').value : '', supplier = supplierId ? await DB.get('customers', supplierId) : null;
      const day = (U.q('#ms_day') && U.q('#ms_day').value) || U.day(), billNo = (U.q('#ms_bill') && U.q('#ms_bill').value.trim()) || '', note = (U.q('#ms_note') && U.q('#ms_note').value.trim()) || '';
      const refId = U.uid(), move = {
        id: U.uid(), itemId: id, type: 'in', qty: Math.abs(qty), unitCost: cost, supplierId,
        billNo, note: note || 'Purchase', refType: 'purchase', refId, refNo: billNo, day,
        date: new Date(day + 'T12:00:00').toISOString()
      };
      const priorMoves = await DB.idx('moves', 'itemId', id);
      const state = Stock.calculateState(priorMoves.concat(move).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.id || '').localeCompare(b.id || '')), it);
      it.qty = state.qty; it.avgCost = state.avgCost;
      if (cost > 0) it.costPrice = cost;
      const ops = [{ store: 'moves', record: move }, { store: 'items', record: it }];
      if (supplier && amount > 0) {
        ops.push({ store: 'entries', record: {
          customerId: supplier.id, customerName: supplier.name, type: 'purchase', amount,
          day, date: new Date(day + 'T12:00:00').toISOString(), itemId: id, itemName: it.name,
          billNo, refId, note: 'Purchase ' + (billNo || 'stock') + ' · ' + it.name
        } });
        if (paid > 0) ops.push({ store: 'entries', record: {
          customerId: supplier.id, customerName: supplier.name, type: 'supplier_payment', amount: paid,
          day, date: new Date(day + 'T12:00:00').toISOString(), billNo, refId, note: 'Paid on purchase ' + (billNo || '')
        } });
      } else if (paid > 0) return UI.toast('Select a supplier to record payment against this purchase', 'err');
      await DB.batch(ops);
    } else {
      await DB.put('moves', {
        itemId: id, type: 'adjust', qty: Math.abs(qty), delta: qty,
        note: U.q('#ms_note').value.trim() || 'Manual adjustment',
        day: U.day(), date: U.nowISO()
      });
    }
    await Stock.recalc(id);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast(type === 'in' ? 'Stock added' : 'Stock adjusted', 'ok');
    const newQty = (await DB.get('items', id)).qty;
    if (newQty <= it.lowStockAt) UI.toast('⚠ ' + it.name + ' is low: ' + U.fmtQty(newQty) + ' left', 'err');
    App.rerender();
  },

  async archive(id, val) {
    const it = await DB.get('items', id);
    it.archived = !!val;
    await DB.put('items', it);
    UI.toast(val ? 'Archived — hidden from billing' : 'Unarchived', 'ok');
    App.rerender();
  },

  async removeItemIfUnused(id) {
    const moves = await DB.idx('moves', 'itemId', id);
    if (moves.length > 0) return UI.toast('This item has stock history — archive it instead', 'err');
    await DB.del('items', id);
    UI.toast('Item deleted', 'ok');
    history.back();
  }
};
